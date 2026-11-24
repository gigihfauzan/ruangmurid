/**
 * ============================================================================
 * MODUL UNDUH REKAP (.XLSX, .CSV), PDF PER SISWA & ZIP MASSAL (js/unduh.js)
 * ============================================================================
 * Seluruh proses pembuatan berkas dilakukan di browser agar tidak membebani
 * kuota waktu eksekusi maupun kuota Google Apps Script.
 */

window.UnduhLKPD = (function () {
  'use strict';

  function ambilDaftarSoal(lkpd) {
    if (!lkpd || !Array.isArray(lkpd.bagian)) return [];
    const soalList = [];
    lkpd.bagian.forEach(function (bag) {
      (bag.blok || []).forEach(function (b) {
        if (b.jenis === 'soal') soalList.push(b);
      });
    });
    return soalList;
  }

  /**
   * Membersihkan nama folder/file agar aman lintas sistem operasi (tanpa karakter khusus).
   */
  function namaAman(teks) {
    return String(teks || 'berkas')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 70) || 'item';
  }

  /**
   * Menerjemahkan simbol matematika khusus (≤, ≥, √, π, °, pangkat sup) agar
   * tidak menimbulkan karakter rusak pada font standar PDF.
   */
  function teksAmanUntukPdf(teks) {
    if (teks === undefined || teks === null) return '';
    const petaSup = {
      '⁰': '^0',
      '¹': '^1',
      '²': '^2',
      '³': '^3',
      '⁴': '^4',
      '⁵': '^5',
      '⁶': '^6',
      '⁷': '^7',
      '⁸': '^8',
      '⁹': '^9',
      'ⁿ': '^n',
      '⁻': '^-'
    };

    let hasil = String(teks);
    Object.keys(petaSup).forEach(function (ch) {
      hasil = hasil.split(ch).join(petaSup[ch]);
    });

    return hasil
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .replace(/≠/g, '!=')
      .replace(/≈/g, '~=')
      .replace(/√/g, 'akar(')
      .replace(/π/g, 'pi')
      .replace(/°/g, ' derajat')
      .replace(/×/g, 'x')
      .replace(/÷/g, '/')
      .replace(/[^\x20-\x7E\n]/g, ' ');
  }

  function memicuUnduhanBlob(blob, namaFile) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
  }

  /**
   * Membuat rekap seluruh siswa ke format .xlsx atau .csv (satu baris per siswa).
   */
  async function unduhRekapSpreadsheet(opsi) {
    const format = opsi.format === 'csv' ? 'csv' : 'xlsx';
    const lkpd = opsi.lkpd || window.ELKPD;
    const daftarSiswa = Array.isArray(opsi.daftarSiswa) ? opsi.daftarSiswa : [];
    const token = opsi.token;
    const onProgres = opsi.onProgres || function () {};

    if (!daftarSiswa.length) {
      window.Umum.tampilkanToast('Tidak ada data siswa untuk direkap.', 'peringatan');
      return;
    }

    if (format === 'xlsx' && typeof window.XLSX === 'undefined') {
      window.Umum.tampilkanToast('Pustaka SheetJS belum termuat. Periksa koneksi internet.', 'bahaya');
      return;
    }

    const soalList = ambilDaftarSoal(lkpd);
    const idLkpd = (lkpd && lkpd.meta && lkpd.meta.id) || '';
    const barisRekap = [];

    for (let i = 0; i < daftarSiswa.length; i++) {
      const s = daftarSiswa[i];
      onProgres(((i + 1) / daftarSiswa.length) * 85, 'Mengambil jawaban ' + s.nama + '...');

      let mapJawaban = {};
      if (s.idPengerjaan) {
        const res = await window.ApiLKPD.kirim('lihatPekerjaan', {
          token: token,
          idSiswa: s.idSiswa,
          idLkpd: idLkpd
        });
        if (res && res.ok && res.data && Array.isArray(res.data.jawaban)) {
          res.data.jawaban.forEach(function (j) {
            mapJawaban[j.idSoal] = j.teks || '';
          });
        }
      }

      const baris = {
        No: i + 1,
        Kelas: s.kelas,
        'Nama Siswa': s.nama,
        Status: s.status,
        'Waktu Kumpul': s.waktuKumpul || '-',
        'Jumlah Berkas': s.jumlahBerkas || 0,
        'Nilai Total': s.totalSkor !== null && s.totalSkor !== undefined ? s.totalSkor : ''
      };

      soalList.forEach(function (soal) {
        const kolomNama = 'Soal ' + soal.nomor + ' (' + soal.id + ')';
        baris[kolomNama] = mapJawaban[soal.id] || '';
      });

      barisRekap.push(baris);
    }

    onProgres(95, 'Menyusun berkas ' + format.toUpperCase() + '...');

    const namaDasar = 'Rekap_' + namaAman((lkpd && lkpd.meta && lkpd.meta.judul) || 'eLKPD');

    if (format === 'csv') {
      const wbTemp = window.XLSX ? window.XLSX.utils.book_new() : null;
      let csvString = '';
      if (wbTemp) {
        const ws = window.XLSX.utils.json_to_sheet(barisRekap);
        csvString = window.XLSX.utils.sheet_to_csv(ws);
      } else {
        const headers = Object.keys(barisRekap[0]);
        const lines = [headers.join(',')];
        barisRekap.forEach(function (r) {
          lines.push(
            headers
              .map(function (h) {
                const v = String(r[h] === undefined || r[h] === null ? '' : r[h]).replace(
                  /"/g,
                  '""'
                );
                return '"' + v + '"';
              })
              .join(',')
          );
        });
        csvString = lines.join('\n');
      }
      const blobCsv = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      memicuUnduhanBlob(blobCsv, namaDasar + '.csv');
    } else {
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.json_to_sheet(barisRekap);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
      const arrayBuffer = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blobXlsx = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      memicuUnduhanBlob(blobXlsx, namaDasar + '.xlsx');
    }

    onProgres(100, 'Selesai!');
    setTimeout(function () {
      onProgres(null, '');
    }, 1500);
    window.Umum.tampilkanToast('Rekap .' + format + ' berhasil diunduh.', 'sukses');
  }

  /**
   * Membuat objek jsPDF untuk satu siswa lengkap dengan identitas, jawaban,
   * nilai/komentar, dan lampiran gambar kanvas / foto.
   */
  async function buatDokumenPdfSiswa(data) {
    const jspdfLib = window.jspdf && window.jspdf.jsPDF;
    if (!jspdfLib) {
      throw new Error('Pustaka jsPDF belum dimuat.');
    }

    const doc = new jspdfLib({ unit: 'pt', format: 'a4' });
    const lebarHalaman = doc.internal.pageSize.getWidth();
    const tinggiHalaman = doc.internal.pageSize.getHeight();
    const margin = 42;
    const lebarIsi = lebarHalaman - margin * 2;
    let y = 46;

    function cekHalaman(tinggiDibutuhkan) {
      if (y + tinggiDibutuhkan > tinggiHalaman - margin) {
        doc.addPage();
        y = 46;
      }
    }

    const meta = (data.lkpd && data.lkpd.meta) || {};
    const siswa = data.siswa || {};
    const pengerjaan = data.pengerjaan || {};

    // Judul Laporan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(teksAmanUntukPdf(meta.judul || 'Lembar Kerja Siswa'), margin, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      teksAmanUntukPdf(
        (meta.mapel || '') +
          ' | Kelas ' +
          (siswa.kelas || meta.kelas || '') +
          ' | Guru: ' +
          (meta.guru || '') +
          ' | ' +
          (meta.sekolah || '')
      ),
      margin,
      y
    );
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.text(
      teksAmanUntukPdf(
        'Nama Siswa: ' + (siswa.nama || '-') + '   |   Status: ' + (pengerjaan.status || '-')
      ),
      margin,
      y
    );
    y += 14;

    if (data.nilai && data.nilai.totalSkor !== null && data.nilai.totalSkor !== undefined) {
      doc.text(teksAmanUntukPdf('Nilai Total: ' + data.nilai.totalSkor), margin, y);
      y += 14;
    }

    doc.setDrawColor(180);
    doc.line(margin, y, lebarHalaman - margin, y);
    y += 18;

    const soalList = ambilDaftarSoal(data.lkpd);
    const mapJawaban = data.jawabanMap || {};
    const berkasDaftar = Array.isArray(data.berkasDaftar) ? data.berkasDaftar : [];
    const cacheGambar = data.cacheDataUrlBerkas || {};

    for (let i = 0; i < soalList.length; i++) {
      const soal = soalList[i];
      const jwb = mapJawaban[soal.id] || { teks: '', dataJson: '' };

      cekHalaman(54);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const barisSoal = doc.splitTextToSize(
        teksAmanUntukPdf('Soal ' + soal.nomor + ': ' + (soal.teks || '')),
        lebarIsi
      );
      doc.text(barisSoal, margin, y);
      y += barisSoal.length * 14 + 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const teksJwb = jwb.teks ? jwb.teks : '(Belum dijawab)';
      const barisJwb = doc.splitTextToSize(teksAmanUntukPdf('Jawaban: ' + teksJwb), lebarIsi);
      cekHalaman(barisJwb.length * 14 + 12);
      doc.text(barisJwb, margin, y);
      y += barisJwb.length * 14 + 10;

      // Lampirkan gambar/foto yang terkait soal ini jika tersedia
      const berkasSoal = berkasDaftar.filter(function (b) {
        return b.idSoal === soal.id;
      });
      for (let bIdx = 0; bIdx < berkasSoal.length; bIdx++) {
        const brk = berkasSoal[bIdx];
        const dataUrl = cacheGambar[brk.idBerkas];
        if (dataUrl && dataUrl.indexOf('data:image/') === 0) {
          try {
            cekHalaman(175);
            const formatImg = dataUrl.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
            doc.addImage(dataUrl, formatImg, margin, y, 220, 150);
            y += 162;
          } catch (err) {
            // Abaikan jika gagal menyisipkan gambar tertentu
          }
        }
      }
    }

    return doc;
  }

  /**
   * Mengunduh PDF untuk siswa yang sedang login di halaman siswa.
   */
  async function unduhPdfSiswa(data) {
    try {
      const doc = await buatDokumenPdfSiswa(data);
      const namaFile =
        'Pekerjaan_' +
        namaAman((data.siswa && data.siswa.nama) || 'Siswa') +
        '_' +
        namaAman((data.lkpd && data.lkpd.meta && data.lkpd.meta.id) || 'LKPD') +
        '.pdf';
      doc.save(namaFile);
      window.Umum.tampilkanToast('PDF pekerjaanmu berhasil diunduh!', 'sukses');
    } catch (err) {
      window.Umum.tampilkanToast(
        (err && err.message) || 'Gagal membuat PDF. Menggunakan tampilan cetak browser.',
        'peringatan'
      );
      window.print();
    }
  }

  /**
   * Mengunduh PDF dari modal detail guru untuk satu siswa.
   */
  async function unduhPdfDetailGuru(opsi) {
    const detail = opsi.detail;
    const lkpd = opsi.lkpd || window.ELKPD;
    const token = opsi.token;

    if (!detail) return;

    // Pastikan seluruh gambar berkas sudah dimuat sebelum membuat PDF
    for (let i = 0; i < detail.berkas.length; i++) {
      const brk = detail.berkas[i];
      if (!detail.cacheGambar[brk.idBerkas]) {
        const res = await window.ApiLKPD.kirim('ambilBerkasGuru', {
          token: token,
          idBerkas: brk.idBerkas
        });
        if (res && res.ok && res.data && res.data.base64Data) {
          detail.cacheGambar[brk.idBerkas] = res.data.base64Data;
        }
      }
    }

    const jawabanMap = {};
    detail.jawaban.forEach(function (j) {
      jawabanMap[j.idSoal] = { teks: j.teks || '', dataJson: j.dataJson || '' };
    });

    await unduhPdfSiswa({
      lkpd: lkpd,
      siswa: detail.siswa,
      pengerjaan: detail.pengerjaan,
      jawabanMap: jawabanMap,
      berkasDaftar: detail.berkas,
      cacheDataUrlBerkas: detail.cacheGambar,
      nilai: detail.nilai
    });
  }

  /**
   * Membuat ZIP massal secara berurutan (per siswa) agar memori browser tidak penuh.
   * Tersusun per kelas lalu per nama siswa, berisi PDF + seluruh foto/gambar asli.
   */
  async function unduhZipMassal(opsi) {
    if (typeof window.JSZip === 'undefined') {
      window.Umum.tampilkanToast('Pustaka JSZip belum termuat. Periksa koneksi internet.', 'bahaya');
      return;
    }

    const lkpd = opsi.lkpd || window.ELKPD;
    const daftarSiswa = Array.isArray(opsi.daftarSiswa) ? opsi.daftarSiswa : [];
    const token = opsi.token;
    const onProgres = opsi.onProgres || function () {};

    if (!daftarSiswa.length) {
      window.Umum.tampilkanToast('Tidak ada siswa untuk dimasukkan ke dalam ZIP.', 'peringatan');
      return;
    }

    const zip = new window.JSZip();
    const idLkpd = (lkpd && lkpd.meta && lkpd.meta.id) || '';

    for (let i = 0; i < daftarSiswa.length; i++) {
      const s = daftarSiswa[i];
      const persenAwal = Math.round((i / daftarSiswa.length) * 85);
      onProgres(persenAwal, 'Memproses (' + (i + 1) + '/' + daftarSiswa.length + '): ' + s.nama);

      const folderSiswa = zip
        .folder(namaAman('Kelas_' + (s.kelas || 'Umum')))
        .folder(namaAman(s.nama || s.idSiswa));

      let jawabanList = [];
      let berkasList = [];
      let nilaiObj = { daftar: [], totalSkor: s.totalSkor };
      const cacheGambarSiswa = {};

      if (s.idPengerjaan) {
        const resDetail = await window.ApiLKPD.kirim('lihatPekerjaan', {
          token: token,
          idSiswa: s.idSiswa,
          idLkpd: idLkpd
        });
        if (resDetail && resDetail.ok && resDetail.data) {
          jawabanList = resDetail.data.jawaban || [];
          berkasList = resDetail.data.berkas || [];
          nilaiObj = resDetail.data.nilai || nilaiObj;
        }
      }

      // Ambil satu per satu berkas gambar/foto milik siswa ini
      for (let b = 0; b < berkasList.length; b++) {
        const brk = berkasList[b];
        const resImg = await window.ApiLKPD.kirim('ambilBerkasGuru', {
          token: token,
          idBerkas: brk.idBerkas
        });
        if (resImg && resImg.ok && resImg.data && resImg.data.base64Data) {
          cacheGambarSiswa[brk.idBerkas] = resImg.data.base64Data;
          const idxB64 = resImg.data.base64Data.indexOf('base64,');
          if (idxB64 !== -1) {
            const b64Murni = resImg.data.base64Data.slice(idxB64 + 7);
            const namaFileBerkas = namaAman(brk.idSoal + '_' + brk.jenis + '_' + (b + 1)) +
              (brk.mime && brk.mime.indexOf('png') !== -1 ? '.png' : '.jpg');
            folderSiswa.file(namaFileBerkas, b64Murni, { base64: true });
          }
        }
      }

      const jawabanMap = {};
      jawabanList.forEach(function (j) {
        jawabanMap[j.idSoal] = { teks: j.teks || '', dataJson: j.dataJson || '' };
      });

      if (window.jspdf && window.jspdf.jsPDF) {
        const docPdf = await buatDokumenPdfSiswa({
          lkpd: lkpd,
          siswa: s,
          pengerjaan: { status: s.status, waktuKumpul: s.waktuKumpul },
          jawabanMap: jawabanMap,
          berkasDaftar: berkasList,
          cacheDataUrlBerkas: cacheGambarSiswa,
          nilai: nilaiObj
        });
        const pdfArrayBuffer = docPdf.output('arraybuffer');
        folderSiswa.file('Laporan_' + namaAman(s.nama) + '.pdf', pdfArrayBuffer);
      }
    }

    onProgres(92, 'Mengompres arsip ZIP...');
    const blobZip = await zip.generateAsync({ type: 'blob' }, function (metaZip) {
      if (metaZip && typeof metaZip.percent === 'number') {
        onProgres(92 + Math.round(metaZip.percent * 0.08), 'Mengemas ZIP...');
      }
    });

    const namaZip = 'Arsip_' + namaAman((lkpd && lkpd.meta && lkpd.meta.judul) || 'eLKPD') + '.zip';
    memicuUnduhanBlob(blobZip, namaZip);

    onProgres(100, 'Arsip ZIP selesai diunduh!');
    setTimeout(function () {
      onProgres(null, '');
    }, 1800);
    window.Umum.tampilkanToast('Arsip ZIP seluruh siswa berhasil diunduh!', 'sukses');
  }

  return {
    unduhRekapSpreadsheet: unduhRekapSpreadsheet,
    unduhPdfSiswa: unduhPdfSiswa,
    unduhPdfDetailGuru: unduhPdfDetailGuru,
    unduhZipMassal: unduhZipMassal
  };
})();