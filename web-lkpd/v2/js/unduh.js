/* ============================================================
 * js/unduh.js — Fitur unduh (XLSX, CSV, PDF, ZIP)
 * ============================================================
 * Semua diproses di browser agar tidak membebani kuota Apps Script.
 *
 * Fitur:
 *  - UNDUH.buatPdfSiswa(opts)   : satu PDF per siswa (dipakai siswa & guru)
 *  - UNDUH.rekapXlsx(...)        : rekap seluruh siswa ke .xlsx
 *  - UNDUH.rekapCsv(...)         : rekap seluruh siswa ke .csv
 *  - UNDUH.zipMassal(...)        : ZIP berisi semua PDF + foto, per kelas/nama
 *
 * Pustaka (versi dikunci, dimuat di HTML):
 *  - JSZip 3.10.1
 *  - SheetJS (xlsx) 0.18.5
 *  - jsPDF 2.5.1 (dengan font Unicode Roboto agar simbol ≤ ≥ √ π ° tampil)
 *
 * Font Unicode dimuat saat dibutuhkan dari CDN jsdelivr (pin tag jsPDF 2.5.1).
 * Jika gagal, fallback ke font default (simbol mungkin tidak sempurna).
 * ============================================================ */
(function () {
  'use strict';

  window.UNDUH = {};

  // URL font TTF Unicode (versi dikunci via jsdelivr npm).
  // DejaVu Sans mendukung simbol ≤ ≥ √ π ° ² ³ dll. Tersedia di package
  // dejavu-fonts-ttf versi 2.37.3 (file TTF ~300KB).
  const URL_FONT = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';
  let fontBase64 = null;       // cache font setelah dimuat
  let sedangMuatFont = false;

  // Konstanta tata letak PDF (A4 portrait, satuan mm)
  const PDF = {
    lebarKertas: 210,
    tinggiKertas: 297,
    margin: 15,
    lebarKonten: 180,          // 210 - 2*15
    batasBawah: 285,           // 297 - 12
    awalY: 20,
  };

  // ----------------------------------------------------------
  // PEMUATAN FONT UNICODE
  // ----------------------------------------------------------

  /**
   * Memuat font Roboto TTF sebagai base64 untuk jsPDF.
   * Di-cache agar hanya dimuat sekali per sesi.
   * @returns {Promise<string|null>} base64 string font, atau null jika gagal
   */
  async function muatFont() {
    if (fontBase64) return fontBase64;
    if (sedangMuatFont) {
      // Tunggu pemuatan sedang berjalan
      while (sedangMuatFont) { await new Promise(r => setTimeout(r, 100)); }
      return fontBase64;
    }
    sedangMuatFont = true;
    try {
      const resp = await fetch(URL_FONT);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Konversi ke base64 (chunk agar tidak overflow call stack)
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
      }
      fontBase64 = btoa(binary);
    } catch (err) {
      console.warn('Gagal memuat font Unicode, pakai default:', err);
      fontBase64 = null;
    }
    sedangMuatFont = false;
    return fontBase64;
  }

  /**
   * Membuat instance jsPDF baru dengan font Unicode terpasang.
   * @returns {Promise<object>} instance jsPDF
   */
  async function buatDocPdf() {
    const jspdfModul = window.jspdf;
    if (!jspdfModul || !jspdfModul.jsPDF) {
      throw new Error('Pustaka jsPDF belum dimuat.');
    }
    const doc = new jspdfModul.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const font = await muatFont();
    if (font) {
      try {
        doc.addFileToVFS('DejaVuSans.ttf', font);
        // jsPDF mendaftarkan font dengan nama & style. Style 'normal' wajib cocok
        // saat setFont dipanggil. Daftarkan kedua alias untuk kompatibilitas.
        doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
        doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'regular');
        doc.setFont('DejaVuSans', 'normal');
        // Verifikasi font benar-benar terdaftar
        const daftar = doc.getFontList();
        if (!daftar['DejaVuSans']) {
          console.warn('Font DejaVuSans tidak terdaftar, pakai default helvetica.');
          doc.setFont('helvetica', 'normal');
        }
      } catch (e) {
        console.warn('Gagal memasang font, pakai default:', e);
      }
    }
    return doc;
  }

  // ----------------------------------------------------------
  // UTILITAS NAMA FILE AMAN
  // ----------------------------------------------------------

  /** Membersihkan string agar aman jadi nama file (tanpa karakter khusus). */
  function namaFileAman(teks) {
    if (!teks) return 'tanpa-nama';
    return String(teks)
      .replace(/[\\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 80) || 'tanpa-nama';
  }

  // ----------------------------------------------------------
  // NORMALISASI BERKAS
  // ----------------------------------------------------------

  /**
   * Menormalkan daftar berkas ke array datar.
   * Menerima array datar atau objek { idSoal: [meta] }.
   */
  function normalisasiBerkas(berkas) {
    if (!berkas) return [];
    if (Array.isArray(berkas)) return berkas.slice();
    const flat = [];
    for (const idSoal in berkas) {
      if (berkas.hasOwnProperty(idSoal)) {
        berkas[idSoal].forEach(function (b) {
          flat.push(Object.assign({ idSoal: idSoal }, b));
        });
      }
    }
    return flat;
  }

  // ----------------------------------------------------------
  // PENGAMBILAN BERKAS (FOTO)
  // ----------------------------------------------------------

  /**
   * Mengambil data URL semua berkas (foto) untuk satu siswa.
   * @param {Array} berkasList Daftar metadata berkas
   * @param {string} token Token sesi
   * @param {string} mode 'siswa' atau 'guru' (menentukan API yang dipakai)
   * @param {string} pengerjaanId (wajib untuk mode siswa)
   * @returns {Promise<object>} { berkasId: dataUrl }
   */
  async function ambilSemuaBerkas(berkasList, token, mode, pengerjaanId) {
    const hasil = {};
    for (let i = 0; i < berkasList.length; i++) {
      const b = berkasList[i];
      let res;
      if (mode === 'guru') {
        res = await API.ambilBerkasGuru(b.id, token);
      } else {
        res = await API.ambilBerkas(pengerjaanId, b.id, token);
      }
      if (res.ok && res.data && res.data.dataBase64) {
        hasil[b.id] = 'data:' + (b.mime || 'image/jpeg') + ';base64,' + res.data.dataBase64;
      }
    }
    return hasil;
  }

  // ----------------------------------------------------------
  // RINGKASAN JAWABAN (untuk XLSX/CSV)
  // ----------------------------------------------------------

  /**
   * Meringkas jawaban satu soal menjadi string singkat untuk sel spreadsheet.
   */
  function ringkasJawaban(blok, jawaban) {
    if (!jawaban) return '';
    const teks = jawaban.teks || '';
    const data = jawaban.data;
    switch (blok.tipe) {
      case 'teks_singkat':
      case 'uraian':
      case 'pilihan_ganda':
      case 'benar_salah':
      case 'isian_angka':
      case 'skala_refleksi':
        return teks;
      case 'tabel_isian':
        if (!data || !data.sel) return '';
        return Object.keys(data.sel).map(function (k) {
          return data.sel[k];
        }).filter(function (v) { return v; }).join(' | ');
      case 'menjodohkan':
        if (!data || !data.pasangan) return '';
        return Object.keys(data.pasangan).map(function (k) {
          return data.pasangan[k];
        }).filter(function (v) { return v; }).join(' | ');
      case 'urutkan':
        if (!data || !data.urutan) return '';
        return data.urutan.join(' → ');
      case 'kanvas':
        return (data && data.gambar) ? '(gambar kanvas)' : '';
      case 'foto':
        return data && data.jumlah ? data.jumlah + ' foto' : '';
      default:
        return teks;
    }
  }

  // ----------------------------------------------------------
  // PDF: BANTU TATA LETAK
  // ----------------------------------------------------------

  /** Memastikan ruang cukup; jika tidak, tambah halaman. */
  function pastikanRuang(doc, y, tinggi) {
    if (y + tinggi > PDF.batasBawah) {
      doc.addPage();
      return PDF.awalY;
    }
    return y;
  }

  /** Mendapat dimensi gambar (mempertahankan rasio) yang pas ke lebar maks. */
  function hitungDimensiGambar(dataUrl, maksLebar, maksTinggi) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) { resolve({ w: maksLebar, h: 60 }); return; }
        const rasio = Math.min(maksLebar / w, maksTinggi / h, 1);
        resolve({ w: Math.round(w * rasio), h: Math.round(h * rasio) });
      };
      img.onerror = function () { resolve({ w: maksLebar, h: 60 }); };
      img.src = dataUrl;
    });
  }

  /** Mendeteksi format gambar dari data URL untuk addImage. */
  function formatGambar(dataUrl) {
    if (dataUrl.indexOf('image/png') !== -1) return 'PNG';
    if (dataUrl.indexOf('image/jpeg') !== -1 || dataUrl.indexOf('image/jpg') !== -1) return 'JPEG';
    if (dataUrl.indexOf('image/webp') !== -1) return 'WEBP';
    return 'PNG';
  }

  /** Menulis teks dengan pembungkusan otomatis, mengembalikan Y baru. */
  function tulisTeks(doc, y, teks, ukuran, gaya, warna) {
    doc.setFontSize(ukuran);
    doc.setFont('DejaVuSans', gaya || 'normal');
    if (warna) doc.setTextColor(warna[0], warna[1], warna[2]);
    else doc.setTextColor(30, 41, 59);
    const baris = doc.splitTextToSize(String(teks || ''), PDF.lebarKonten);
    for (let i = 0; i < baris.length; i++) {
      y = pastikanRuang(doc, y, 6);
      doc.text(PDF.margin, y, baris[i]);
      y += (ukuran * 0.35) + 1.5;
    }
    return y;
  }

  // ----------------------------------------------------------
  // PDF: RENDER SATU SISWA
  // ----------------------------------------------------------

  /**
   * Membuat PDF untuk satu siswa.
   * @param {object} opts {
   *   lkpd, siswa:{nama,kelas}, pengerjaanId, jawaban, berkas,
   *   nilai, token, mode:'siswa'|'guru', statusPengerjaan, waktuKumpul
   * }
   * @returns {Promise<Blob>} PDF blob
   */
  async function renderPdfSiswa(opts) {
    const lkpd = opts.lkpd;
    const doc = await buatDocPdf();
    let y = PDF.awalY;

    // --- Header ---
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, PDF.lebarKertas, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('DejaVuSans', 'normal');
    doc.text(PDF.margin, 13, lkpd.meta.judul);
    doc.setFontSize(10);
    doc.text(PDF.margin, 20, lkpd.meta.mapel + '  •  Kelas ' + lkpd.meta.kelas + '  •  ' + lkpd.meta.bab);
    doc.text(PDF.margin, 26, lkpd.meta.sekolah + '  —  Guru: ' + lkpd.meta.guru);

    y = 40;
    doc.setTextColor(30, 41, 59);

    // --- Identitas ---
    doc.setFillColor(239, 246, 255);
    doc.rect(PDF.margin, y, PDF.lebarKonten, 24, 'F');
    doc.setFontSize(11); doc.setFont('DejaVuSans', 'normal');
    doc.text(PDF.margin + 4, y + 7, 'Nama: ' + (opts.siswa.nama || '-'));
    doc.text(PDF.margin + 4, y + 14, 'Kelas: ' + (opts.siswa.kelas || '-'));
    doc.text(PDF.margin + 4, y + 21, 'Status: ' + (opts.statusPengerjaan || '-') + (opts.waktuKumpul ? '  •  Dikumpul: ' + UMUM.formatWaktu(opts.waktuKumpul) : ''));
    y += 30;

    // --- Siapkan data berkas ---
    const berkasList = normalisasiBerkas(opts.berkas);
    let dataBerkas = {};
    if (berkasList.length > 0 && opts.token) {
      dataBerkas = await ambilSemuaBerkas(berkasList, opts.token, opts.mode || 'guru', opts.pengerjaanId);
    }

    // --- Grup berkas per idSoal ---
    const berkasPerSoal = {};
    berkasList.forEach(function (b) {
      if (!berkasPerSoal[b.idSoal]) berkasPerSoal[b.idSoal] = [];
      berkasPerSoal[b.idSoal].push(b);
    });

    // --- Render setiap bagian & soal ---
    (lkpd.bagian || []).forEach(function (bagian) {
      y = pastikanRuang(doc, y, 16);
      // Garis pemisah + judul bagian
      doc.setDrawColor(251, 191, 36); doc.setLineWidth(0.8);
      doc.line(PDF.margin, y - 2, PDF.margin + 4, y - 2);
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(13); doc.setFont('DejaVuSans', 'normal');
      const judulBag = doc.splitTextToSize(bagian.judul, PDF.lebarKonten);
      doc.text(PDF.margin + 7, y, judulBag[0]);
      y += 8;

      (bagian.blok || []).forEach(function (blok) {
        if (blok.jenis === 'bacaan') {
          y = tulisTeks(doc, y, blok.judul ? blok.judul : '', 11, 'normal', [146, 64, 14]);
          y = tulisTeks(doc, y, blok.isi || '', 10, 'normal', [100, 116, 139]);
          y += 3;
        } else if (blok.jenis === 'soal') {
          // Nomor & teks soal
          const label = blok.nomor ? 'Soal ' + blok.nomor : 'Refleksi';
          y = tulisTeks(doc, y, label, 11, 'normal', [37, 99, 235]);
          y = tulisTeks(doc, y, blok.teks || '', 11, 'normal');
          y += 1;

          // Jawaban
          const jawab = opts.jawaban[blok.id];
          y = renderJawabanPdf(doc, y, blok, jawab, dataBerkas, berkasPerSoal[blok.id] || []);

          // Nilai & komentar
          if (opts.nilai && opts.nilai[blok.id]) {
            const n = opts.nilai[blok.id];
            y = pastikanRuang(doc, y, 12);
            doc.setFillColor(220, 252, 231);
            doc.rect(PDF.margin, y, PDF.lebarKonten, 12, 'F');
            doc.setTextColor(22, 101, 52);
            doc.setFontSize(10); doc.setFont('DejaVuSans', 'normal');
            const teksNilai = 'Nilai: ' + (n.skor !== undefined && n.skor !== '' ? n.skor : '-') + (n.komentar ? '   |   Komentar: ' + n.komentar : '');
            const barisNilai = doc.splitTextToSize(teksNilai, PDF.lebarKonten - 6);
            doc.text(PDF.margin + 3, y + 7, barisNilai[0]);
            y += 16;
          }
          y += 4;
        }
      });
      y += 2;
    });

    // --- Footer nomor halaman ---
    const totalHalaman = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalHalaman; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text('Halaman ' + i + ' dari ' + totalHalaman, PDF.margin, PDF.tinggiKertas - 6);
      doc.text('e-LKPD — ' + lkpd.meta.sekolah, PDF.lebarKertas - PDF.margin, PDF.tinggiKertas - 6, { align: 'right' });
    }

    return doc.output('blob');
  }

  /** Merender jawaban satu soal ke PDF, mengembalikan Y baru. */
  function renderJawabanPdf(doc, y, blok, jawab, dataBerkas, berkasSoal) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10); doc.setFont('DejaVuSans', 'normal');

    if (!jawab) {
      y = tulisTeks(doc, y, '(belum dijawab)', 10, 'normal', [148, 163, 184]);
      return y;
    }
    const teks = jawab.teks || '';
    const data = jawab.data;

    switch (blok.tipe) {
      case 'teks_singkat':
      case 'uraian':
      case 'pilihan_ganda':
      case 'benar_salah':
      case 'isian_angka':
      case 'skala_refleksi':
        y = tulisTeks(doc, y, 'Jawaban: ' + teks, 10, 'normal', [22, 101, 52]);
        break;

      case 'tabel_isian':
        if (data && data.sel) {
          y = renderTabelPdf(doc, y, blok, data.sel);
        }
        break;

      case 'menjodohkan':
        if (data && data.pasangan) {
          y = tulisTeks(doc, y, 'Jawaban:', 10, 'normal', [22, 101, 52]);
          (blok.item || []).forEach(function (it) {
            const p = data.pasangan[it.id] || '-';
            y = tulisTeks(doc, y, '  ' + it.kiri + ' → ' + p, 10, 'normal');
          });
        }
        break;

      case 'urutkan':
        if (data && data.urutan) {
          y = tulisTeks(doc, y, 'Urutan:', 10, 'normal', [22, 101, 52]);
          const itemMap = {};
          (blok.item || []).forEach(function (i) { itemMap[i.id] = i; });
          data.urutan.forEach(function (idItem, idx) {
            const it = itemMap[idItem];
            y = tulisTeks(doc, y, '  ' + (idx + 1) + '. ' + (it ? it.teks : idItem), 10, 'normal');
          });
        }
        break;

      case 'kanvas':
        if (data && data.gambar) {
          y = tambahGambarPdf(doc, y, data.gambar, 'Gambar kanvas:');
        } else {
          y = tulisTeks(doc, y, '(kanvas kosong)', 10, 'normal', [148, 163, 184]);
        }
        break;

      case 'foto':
        if (berkasSoal && berkasSoal.length > 0) {
          y = tulisTeks(doc, y, 'Foto (' + berkasSoal.length + '):', 10, 'normal', [22, 101, 52]);
          berkasSoal.forEach(function (b, idx) {
            const url = dataBerkas[b.id];
            if (url) {
              y = tambahGambarPdf(doc, y, url, 'Foto ' + (idx + 1) + ': ' + (b.nama || ''));
            } else {
              y = tulisTeks(doc, y, '  (foto tidak dapat dimuat: ' + (b.nama || '') + ')', 9, 'normal', [148, 163, 184]);
            }
          });
        } else {
          y = tulisTeks(doc, y, '(tidak ada foto)', 10, 'normal', [148, 163, 184]);
        }
        break;
    }
    return y;
  }

  /** Merender tabel isian ke PDF. */
  function renderTabelPdf(doc, y, blok, sel) {
    const kolom = blok.kolom || [];
    const baris = blok.baris || [];
    const kolomIsian = blok.kolomIsian || [];
    const nilaiKolom = blok.nilaiKolom || {};
    const lebarKolom = PDF.lebarKonten / kolom.length;

    y = pastikanRuang(doc, y, 10);
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(PDF.margin, y, PDF.lebarKonten, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('DejaVuSans', 'normal');
    kolom.forEach(function (k, idx) {
      doc.text(PDF.margin + idx * lebarKolom + 2, y + 6, String(k));
    });
    y += 8;

    // Baris
    baris.forEach(function (barisItem, idxBaris) {
      y = pastikanRuang(doc, y, 8);
      if (idxBaris % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(PDF.margin, y, PDF.lebarKonten, 8, 'F');
      }
      doc.setTextColor(30, 41, 59);
      kolom.forEach(function (k, idxKolom) {
        let isi = '';
        if (kolomIsian.indexOf(idxKolom) !== -1) {
          isi = sel[barisItem.id + '_' + idxKolom] || '';
        } else if (nilaiKolom[idxKolom] && nilaiKolom[idxKolom][idxBaris] !== undefined) {
          isi = String(nilaiKolom[idxKolom][idxBaris]);
        } else if (idxKolom === 0 && barisItem.label) {
          isi = barisItem.label;
        }
        const barisTeks = doc.splitTextToSize(String(isi), lebarKolom - 4);
        doc.text(PDF.margin + idxKolom * lebarKolom + 2, y + 6, barisTeks[0]);
      });
      y += 8;
    });
    return y + 3;
  }

  /** Menambahkan gambar ke PDF dengan rasio yang benar. */
  async function tambahGambarPdf(doc, y, dataUrl, label) {
    if (label) {
      y = tulisTeks(doc, y, label, 9, 'normal', [100, 116, 139]);
    }
    const dim = await hitungDimensiGambar(dataUrl, PDF.lebarKonten, 120);
    y = pastikanRuang(doc, y, dim.h + 4);
    try {
      doc.addImage(dataUrl, formatGambar(dataUrl), PDF.margin, y, dim.w, dim.h);
    } catch (e) {
      y = tulisTeks(doc, y, '(gagal menambahkan gambar)', 9, 'normal', [239, 68, 68]);
    }
    return y + dim.h + 5;
  }

  // ----------------------------------------------------------
  // API PUBLIK: PDF SATU SISWA
  // ----------------------------------------------------------

  /**
   * Membuat & mengunduh PDF untuk satu siswa (tombol "Unduh Pekerjaanku").
   * @param {object} opts lihat renderPdfSiswa
   */
  UNDUH.buatPdfSiswa = async function (opts) {
    try {
      UMUM.toast('Membuat PDF...', 'info', 4000);
      const blob = await renderPdfSiswa(opts);
      const nama = namaFileAman(opts.siswa.nama) + '_' + namaFileAman(opts.lkpd.meta.bab) + '.pdf';
      UMUM.unduhBlob(blob, nama);
      UMUM.toast('PDF siap diunduh.', 'sukses');
    } catch (err) {
      console.error(err);
      UMUM.toast('Gagal membuat PDF: ' + (err.message || err), 'bahaya', 5000);
    }
  };

  /**
   * Membuat PDF untuk satu siswa dan mengembalikan blob (dipakai ZIP massal).
   */
  UNDUH.blobPdfSiswa = async function (opts) {
    return await renderPdfSiswa(opts);
  };

  // ----------------------------------------------------------
  // PENGAMBILAN SEMUA PEKERJAAN (untuk rekap & ZIP)
  // ----------------------------------------------------------

  /**
   * Mengambil pekerjaan semua siswa secara berurutan (bukan serentak).
   * @param {Array} daftarSiswa Dari API.daftarSiswa
   * @param {string} lkpdId
   * @param {string} token
   * @param {function} onProgres {sekarang, total, nama}
   * @returns {Promise<Array>} [{ siswa, pengerjaan, jawaban, berkas, nilai }]
   */
  async function ambilSemuaPekerjaan(daftarSiswa, lkpdId, token, onProgres) {
    const hasil = [];
    for (let i = 0; i < daftarSiswa.length; i++) {
      const s = daftarSiswa[i];
      if (onProgres) onProgres({ sekarang: i + 1, total: daftarSiswa.length, nama: s.nama });
      if (!s.pengerjaanId) {
        // Siswa belum mulai mengerjakan
        hasil.push({ siswa: s, pengerjaan: null, jawaban: {}, berkas: [], nilai: {} });
        continue;
      }
      const res = await API.lihatPekerjaan(s.pengerjaanId, token);
      if (res.ok) {
        hasil.push({
          siswa: s,
          pengerjaan: res.data.pengerjaan,
          jawaban: res.data.jawaban || {},
          berkas: res.data.berkas || [],
          nilai: res.data.nilai || {}
        });
      } else {
        hasil.push({ siswa: s, pengerjaan: null, jawaban: {}, berkas: [], nilai: {} });
      }
    }
    return hasil;
  }

  /** Membangun daftar kolom soal dari LKPD untuk header rekap. */
  function kolomSoal(lkpd) {
    const kolom = [];
    (lkpd.bagian || []).forEach(function (bagian) {
      (bagian.blok || []).forEach(function (b) {
        if (b.jenis === 'soal' && b.nomor) {
          kolom.push({ id: b.id, header: 'Soal ' + b.nomor, blok: b });
        }
      });
    });
    return kolom;
  }

  // ----------------------------------------------------------
  // REKAP XLSX
  // ----------------------------------------------------------

  /**
   * Membuat rekap seluruh siswa ke file .xlsx.
   * Satu baris per siswa, kolom per soal + nilai + status + waktu.
   * @returns {Promise<boolean>} true jika berhasil
   */
  UNDUH.rekapXlsx = async function (daftarSiswa, lkpd, token, onProgres) {
    if (!window.XLSX) { UMUM.toast('Pustaka SheetJS belum dimuat.', 'bahaya'); return false; }
    try {
      UMUM.toast('Mengumpulkan data siswa...', 'info', 4000);
      const semua = await ambilSemuaPekerjaan(daftarSiswa, lkpd.meta.id, token, onProgres);
      const daftarKolomSoal = kolomSoal(lkpd);

      // Header
      const header = ['No', 'Nama', 'Kelas', 'Status', 'Waktu Kumpul'];
      daftarKolomSoal.forEach(function (k) { header.push(k.header); });
      header.push('Skor Total', 'Komentar');

      // Baris
      const rows = [];
      semua.forEach(function (item, idx) {
        const s = item.siswa;
        const row = [idx + 1, s.nama, s.kelas, s.status, s.waktuKumpul ? UMUM.formatWaktu(s.waktuKumpul) : ''];
        let skorTotal = 0; let adaSkor = false; let komentarAll = [];
        daftarKolomSoal.forEach(function (k) {
          const jawab = item.jawaban[k.id];
          row.push(ringkasJawaban(k.blok, jawab));
          if (item.nilai[k.id]) {
            const sk = Number(item.nilai[k.id].skor);
            if (!isNaN(sk)) { skorTotal += sk; adaSkor = true; }
            if (item.nilai[k.id].komentar) komentarAll.push(k.header + ': ' + item.nilai[k.id].komentar);
          }
        });
        row.push(adaSkor ? skorTotal : '');
        row.push(komentarAll.join(' | '));
        rows.push(row);
      });

      // Buat workbook
      const ws = XLSX.utils.aoa_to_sheet([header].concat(rows));
      ws['!cols'] = header.map(function (h, i) {
        return { wch: i === 1 ? 24 : (i < 5 ? 12 : 18) };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
      const namaFile = 'rekap_' + namaFileAman(lkpd.meta.bab) + '_' + lkpd.meta.kelas + '.xlsx';
      XLSX.writeFile(wb, namaFile);
      UMUM.toast('Rekap XLSX siap diunduh.', 'sukses');
      return true;
    } catch (err) {
      console.error(err);
      UMUM.toast('Gagal membuat XLSX: ' + (err.message || err), 'bahaya', 5000);
      return false;
    }
  };

  // ----------------------------------------------------------
  // REKAP CSV
  // ----------------------------------------------------------

  /**
   * Membuat rekap seluruh siswa ke file .csv (format yang sama dengan XLSX).
   */
  UNDUH.rekapCsv = async function (daftarSiswa, lkpd, token, onProgres) {
    if (!window.XLSX) { UMUM.toast('Pustaka SheetJS belum dimuat.', 'bahaya'); return false; }
    try {
      UMUM.toast('Mengumpulkan data siswa...', 'info', 4000);
      const semua = await ambilSemuaPekerjaan(daftarSiswa, lkpd.meta.id, token, onProgres);
      const daftarKolomSoal = kolomSoal(lkpd);

      const header = ['No', 'Nama', 'Kelas', 'Status', 'Waktu Kumpul'];
      daftarKolomSoal.forEach(function (k) { header.push(k.header); });
      header.push('Skor Total', 'Komentar');

      const rows = [];
      semua.forEach(function (item, idx) {
        const s = item.siswa;
        const row = [idx + 1, s.nama, s.kelas, s.status, s.waktuKumpul ? UMUM.formatWaktu(s.waktuKumpul) : ''];
        let skorTotal = 0; let adaSkor = false; let komentarAll = [];
        daftarKolomSoal.forEach(function (k) {
          const jawab = item.jawaban[k.id];
          row.push(ringkasJawaban(k.blok, jawab));
          if (item.nilai[k.id]) {
            const sk = Number(item.nilai[k.id].skor);
            if (!isNaN(sk)) { skorTotal += sk; adaSkor = true; }
            if (item.nilai[k.id].komentar) komentarAll.push(k.header + ': ' + item.nilai[k.id].komentar);
          }
        });
        row.push(adaSkor ? skorTotal : '');
        row.push(komentarAll.join(' | '));
        rows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet([header].concat(rows));
      const csv = XLSX.utils.sheet_to_csv(ws);
      // Tambah BOM agar Excel membaca UTF-8 dengan benar
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const namaFile = 'rekap_' + namaFileAman(lkpd.meta.bab) + '_' + lkpd.meta.kelas + '.csv';
      UMUM.unduhBlob(blob, namaFile);
      UMUM.toast('Rekap CSV siap diunduh.', 'sukses');
      return true;
    } catch (err) {
      console.error(err);
      UMUM.toast('Gagal membuat CSV: ' + (err.message || err), 'bahaya', 5000);
      return false;
    }
  };

  // ----------------------------------------------------------
  // ZIP MASSAL
  // ----------------------------------------------------------

  /**
   * Membuat ZIP berisi PDF + foto semua siswa, tersusun per kelas lalu nama.
   * Memproses siswa secara berurutan (bukan serentak) agar memori tidak penuh.
   * @param {Array} daftarSiswa
   * @param {object} lkpd
   * @param {string} token
   * @param {function} onProgres {sekarang, total, nama, tahap}
   * @returns {Promise<boolean>}
   */
  UNDUH.zipMassal = async function (daftarSiswa, lkpd, token, onProgres) {
    if (!window.JSZip) { UMUM.toast('Pustaka JSZip belum dimuat.', 'bahaya'); return false; }
    try {
      const zip = new JSZip();
      UMUM.toast('Menyiapkan ZIP massal...', 'info', 4000);

      for (let i = 0; i < daftarSiswa.length; i++) {
        const s = daftarSiswa[i];
        if (onProgres) onProgres({ sekarang: i + 1, total: daftarSiswa.length, nama: s.nama, tahap: 'memproses' });

        const folderKelas = 'Kelas_' + namaFileAman(s.kelas) + '/';
        const folderSiswa = folderKelas + namaFileAman(s.nama) + '/';

        if (!s.pengerjaanId) {
          // Tandai belum mengerjakan dengan file catatan
          zip.file(folderSiswa + 'BELUM_MENGERJAKAN.txt', 'Siswa ' + s.nama + ' (' + s.kelas + ') belum memulai pengerjaan.');
          continue;
        }

        // Ambil pekerjaan lengkap
        const res = await API.lihatPekerjaan(s.pengerjaanId, token);
        if (!res.ok) {
          zip.file(folderSiswa + 'GAGAL_MEMUAT.txt', 'Gagal memuat pekerjaan: ' + res.pesan);
          continue;
        }

        // Buat PDF
        if (onProgres) onProgres({ sekarang: i + 1, total: daftarSiswa.length, nama: s.nama, tahap: 'membuat PDF' });
        const pdfBlob = await renderPdfSiswa({
          lkpd: lkpd,
          siswa: { nama: s.nama, kelas: s.kelas },
          pengerjaanId: s.pengerjaanId,
          jawaban: res.data.jawaban || {},
          berkas: res.data.berkas || [],
          nilai: res.data.nilai || {},
          token: token,
          mode: 'guru',
          statusPengerjaan: s.status,
          waktuKumpul: s.waktuKumpul
        });
        zip.file(folderSiswa + namaFileAman(s.nama) + '.pdf', pdfBlob);

        // Tambahkan foto-foto
        const berkasList = res.data.berkas || [];
        for (let j = 0; j < berkasList.length; j++) {
          const b = berkasList[j];
          if (onProgres) onProgres({ sekarang: i + 1, total: daftarSiswa.length, nama: s.nama, tahap: 'mengambil foto ' + (j + 1) });
          const berkasRes = await API.ambilBerkasGuru(b.id, token);
          if (berkasRes.ok && berkasRes.data && berkasRes.data.dataBase64) {
            const ekstensi = (b.mime === 'image/png') ? 'png' : (b.mime === 'image/webp' ? 'webp' : 'jpg');
            const namaFoto = namaFileAman(b.idSoal) + '_' + (j + 1) + '.' + ekstensi;
            zip.file(folderSiswa + 'foto/' + namaFoto, berkasRes.data.dataBase64, { base64: true });
          }
        }
      }

      // Tambahkan rekap XLSX ke root ZIP
      if (onProgres) onProgres({ sekarang: daftarSiswa.length, total: daftarSiswa.length, nama: '', tahap: 'menambah rekap' });
      const semua = await ambilSemuaPekerjaan(daftarSiswa, lkpd.meta.id, token);
      const daftarKolomSoal = kolomSoal(lkpd);
      const header = ['No', 'Nama', 'Kelas', 'Status', 'Waktu Kumpul'];
      daftarKolomSoal.forEach(function (k) { header.push(k.header); });
      header.push('Skor Total', 'Komentar');
      const rows = [];
      semua.forEach(function (item, idx) {
        const s = item.siswa;
        const row = [idx + 1, s.nama, s.kelas, s.status, s.waktuKumpul ? UMUM.formatWaktu(s.waktuKumpul) : ''];
        let skorTotal = 0; let adaSkor = false; let komentarAll = [];
        daftarKolomSoal.forEach(function (k) {
          row.push(ringkasJawaban(k.blok, item.jawaban[k.id]));
          if (item.nilai[k.id]) {
            const sk = Number(item.nilai[k.id].skor);
            if (!isNaN(sk)) { skorTotal += sk; adaSkor = true; }
            if (item.nilai[k.id].komentar) komentarAll.push(k.header + ': ' + item.nilai[k.id].komentar);
          }
        });
        row.push(adaSkor ? skorTotal : '');
        row.push(komentarAll.join(' | '));
        rows.push(row);
      });
      const ws = XLSX.utils.aoa_to_sheet([header].concat(rows));
      const csv = XLSX.utils.sheet_to_csv(ws);
      zip.file('rekap_' + namaFileAman(lkpd.meta.bab) + '.csv', '\ufeff' + csv);

      // Generate ZIP
      if (onProgres) onProgres({ sekarang: daftarSiswa.length, total: daftarSiswa.length, nama: '', tahap: 'mengompres' });
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const namaFile = 'LKPD_' + namaFileAman(lkpd.meta.bab) + '_semua.zip';
      UMUM.unduhBlob(blob, namaFile);
      UMUM.toast('ZIP massal siap diunduh.', 'sukses');
      return true;
    } catch (err) {
      console.error(err);
      UMUM.toast('Gagal membuat ZIP: ' + (err.message || err), 'bahaya', 5000);
      return false;
    }
  };

})();
// ============================================================
// AKHIR FILE js/unduh.js
// ============================================================
