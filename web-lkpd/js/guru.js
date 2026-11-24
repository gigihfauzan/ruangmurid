/* ============================================================
 * js/guru.js — Dashboard guru
 * ============================================================
 * Mengatur: login guru, tabel siswa, detail pekerjaan, penilaian,
 * pengaturan, dan fitur unduh.
 *
 * Tidak ada teks materi tertanam di sini — semua dari konten.js.
 * ============================================================ */
(function () {
  'use strict';

  window.GURU = {};
  const G = window.GURU;

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    sesi: null,             // { token, peran }
    lkpd: null,             // objek ELKPD
    daftarSiswa: [],        // dari API.daftarSiswa
    filterKelas: '',        // filter kelas aktif
    pencarian: '',          // teks pencarian
    pengaturan: null,       // dari API.bacaPengaturan
    detailAktif: null,      // pengerjaanId yang sedang dilihat
    dataDetail: null,       // data lihatPekerjaan untuk detail aktif
    berkasCache: {}         // { berkasId: dataUrl } cache foto untuk detail
  };

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    state.lkpd = window.ELKPD;
    terapkanTema();
    document.title = 'Dashboard Guru — ' + state.lkpd.meta.judul;
    isiHeaderGuru();

    // Cek sesi tersimpan
    const sesi = UMUM.lsBaca('sesiGuru');
    if (sesi && sesi.token && sesi.peran === 'guru') {
      state.sesi = sesi;
      muatDashboard();
    } else {
      tampilLayar('layar-login-guru');
    }

    pasangEventListener();
  }

  /** Menerapkan tema dari konten.js. */
  function terapkanTema() {
    const t = state.lkpd.tema || {};
    const root = document.documentElement;
    if (t.warnaUtama) root.style.setProperty('--warna-utama', t.warnaUtama);
    if (t.warnaUtamaGelap) root.style.setProperty('--warna-utama-gelap', t.warnaUtamaGelap);
    if (t.warnaAksen) root.style.setProperty('--warna-aksen', t.warnaAksen);
    if (t.warnaLatar) root.style.setProperty('--warna-latar', t.warnaLatar);
    if (t.warnaKartu) root.style.setProperty('--warna-kartu', t.warnaKartu);
    if (t.warnaTeks) root.style.setProperty('--warna-teks', t.warnaTeks);
    if (t.fontJudul) root.style.setProperty('--font-judul', t.fontJudul);
    if (t.fontIsi) root.style.setProperty('--font-isi', t.fontIsi);
  }

  /** Mengisi teks header dashboard dari konten.js. */
  function isiHeaderGuru() {
    const meta = state.lkpd.meta;
    const el = UMUM.el('guru-judul-app');
    if (el) el.textContent = 'Dashboard Guru — ' + meta.mapel;
    const elSub = UMUM.el('guru-subjudul');
    if (elSub) elSub.textContent = meta.judul;
    const elSekolah = UMUM.el('guru-info-sekolah');
    if (elSekolah) elSekolah.textContent = meta.sekolah;
    const elGuru = UMUM.el('guru-info-guru');
    if (elGuru) elGuru.textContent = 'Guru: ' + meta.guru;
  }

  // ============================================================
  // MANAJEMEN LAYAR
  // ============================================================
  function tampilLayar(idLayar) {
    UMUM.qsa('.layar').forEach(function (l) { l.classList.remove('aktif'); });
    const layar = UMUM.el(idLayar);
    if (layar) layar.classList.add('aktif');
    window.scrollTo(0, 0);
  }

  // ============================================================
  // EVENT LISTENER
  // ============================================================
  function pasangEventListener() {
    // Login
    const btnMasuk = UMUM.el('btn-guru-masuk');
    if (btnMasuk) btnMasuk.addEventListener('click', klikLoginGuru);
    const sandiInput = UMUM.el('guru-sandi');
    if (sandiInput) sandiInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') klikLoginGuru(); });

    // Keluar
    const btnKeluar = UMUM.el('btn-guru-keluar');
    if (btnKeluar) btnKeluar.addEventListener('click', klikKeluar);

    // Refresh
    const btnRefresh = UMUM.el('btn-refresh');
    if (btnRefresh) btnRefresh.addEventListener('click', function () { muatDaftarSiswa(); });

    // Filter kelas
    const selKelas = UMUM.el('filter-kelas');
    if (selKelas) selKelas.addEventListener('change', function () {
      state.filterKelas = selKelas.value;
      renderTabelSiswa();
    });

    // Pencarian
    const inputCari = UMUM.el('input-pencarian');
    if (inputCari) inputCari.addEventListener('input', UMUM.debounce(function () {
      state.pencarian = inputCari.value.toLowerCase().trim();
      renderTabelSiswa();
    }, 250));

    // Tab
    UMUM.qsa('.tab-nav-tombol').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pindahTab(btn.getAttribute('data-tab'));
      });
    });

    // Simpan pengaturan
    const btnSimpanSet = UMUM.el('btn-simpan-pengaturan');
    if (btnSimpanSet) btnSimpanSet.addEventListener('click', klikSimpanPengaturan);

    // Unduh
    const btnXlsx = UMUM.el('btn-unduh-xlsx');
    if (btnXlsx) btnXlsx.addEventListener('click', klikUnduhXlsx);
    const btnCsv = UMUM.el('btn-unduh-csv');
    if (btnCsv) btnCsv.addEventListener('click', klikUnduhCsv);
    const btnZip = UMUM.el('btn-unduh-zip');
    if (btnZip) btnZip.addEventListener('click', klikUnduhZip);
  }

  // ============================================================
  // LOGIN GURU
  // ============================================================
  function klikLoginGuru() {
    const sandi = UMUM.el('guru-sandi').value;
    const galat = UMUM.el('guru-login-galat');
    if (!sandi) { tampilGalat(galat, 'Kata sandi wajib diisi.'); return; }
    sembunyikanGalat(galat);
    const btn = UMUM.el('btn-guru-masuk');
    btn.disabled = true; btn.textContent = 'Memeriksa...';

    API.masukGuru(sandi).then(function (res) {
      btn.disabled = false; btn.textContent = 'Masuk';
      if (!res.ok) { tampilGalat(galat, res.pesan); return; }
      state.sesi = { token: res.data.token, peran: 'guru' };
      UMUM.lsTulis('sesiGuru', state.sesi);
      muatDashboard();
    });
  }

  function muatDashboard() {
    tampilLayar('layar-dashboard');
    isiFilterKelas();
    muatDaftarSiswa();
    muatPengaturan();
  }

  /** Mengisi dropdown filter kelas dari pengaturan. */
  function isiFilterKelas() {
    const sel = UMUM.el('filter-kelas');
    if (!sel) return;
    UMUM.kosongkan(sel);
    sel.appendChild(UMUM.buatEl('option', { value: '', text: 'Semua Kelas' }));
    const kelasList = state.pengaturan && state.pengaturan.daftarKelas ? state.pengaturan.daftarKelas : (state.lkpd.daftarKelas || []);
    kelasList.forEach(function (k) {
      sel.appendChild(UMUM.buatEl('option', { value: k, text: k }));
    });
  }

  // ============================================================
  // DAFTAR SISWA
  // ============================================================
  function muatDaftarSiswa() {
    const wadah = UMUM.el('tabel-siswa-body');
    if (wadah) UMUM.kosongkan(wadah);
    UMUM.el('info-daftar').textContent = 'Memuat daftar siswa...';
    API.daftarSiswa(state.filterKelas, state.lkpd.meta.id, state.sesi.token).then(function (res) {
      if (!res.ok) {
        UMUM.el('info-daftar').textContent = 'Gagal: ' + res.pesan;
        if (res.kode === 'TOKEN_TIDAK_VALID') {
          UMUM.lsHapus('sesiGuru');
          state.sesi = null;
          tampilLayar('layar-login-guru');
        }
        return;
      }
      state.daftarSiswa = res.data.siswa || [];
      renderTabelSiswa();
    });
  }

  /** Render tabel siswa dengan filter & pencarian. */
  function renderTabelSiswa() {
    const wadah = UMUM.el('tabel-siswa-body');
    if (!wadah) return;
    UMUM.kosongkan(wadah);

    let daftar = state.daftarSiswa;
    // Filter pencarian
    if (state.pencarian) {
      daftar = daftar.filter(function (s) {
        return String(s.nama).toLowerCase().indexOf(state.pencarian) !== -1;
      });
    }

    const info = UMUM.el('info-daftar');
    info.textContent = 'Menampilkan ' + daftar.length + ' dari ' + state.daftarSiswa.length + ' siswa';

    if (daftar.length === 0) {
      const tr = UMUM.buatEl('tr');
      const td = UMUM.buatEl('td', { colspan: 7, class: 'tabel-kosong' });
      td.appendChild(UMUM.buatEl('p', { text: 'Belum ada siswa yang terdaftar untuk LKPD ini.' }));
      tr.appendChild(td);
      wadah.appendChild(tr);
      return;
    }

    daftar.forEach(function (s) {
      const tr = UMUM.buatEl('tr');
      // No
      tr.appendChild(UMUM.buatEl('td', { text: '', class: 'tabel-no' }));
      // Nama
      tr.appendChild(UMUM.buatEl('td', { text: s.nama, class: 'tabel-nama' }));
      // Kelas
      tr.appendChild(UMUM.buatEl('td', { text: s.kelas }));
      // Status (dengan badge)
      const tdStatus = UMUM.buatEl('td');
      tdStatus.appendChild(buatBadgeStatus(s.status));
      tr.appendChild(tdStatus);
      // Waktu kumpul
      tr.appendChild(UMUM.buatEl('td', { text: s.waktuKumpul ? UMUM.formatWaktu(s.waktuKumpul) : '-' }));
      // Foto
      tr.appendChild(UMUM.buatEl('td', { text: String(s.jumlahFoto || 0) }));
      // Aksi
      const tdAksi = UMUM.buatEl('td', { class: 'tabel-aksi' });
      const btnLihat = UMUM.buatEl('button', { class: 'tombol-kecil tombol-primer', type: 'button', text: '👁 Lihat' });
      btnLihat.disabled = !s.pengerjaanId;
      btnLihat.addEventListener('click', function () { bukaDetail(s.pengerjaanId, s); });
      tdAksi.appendChild(btnLihat);

      const btnRevisi = UMUM.buatEl('button', { class: 'tombol-kecil tombol-sekunder', type: 'button' });
      if (s.status === 'terkumpul' || s.status === 'dinilai') {
        btnRevisi.textContent = '🔓 Buka Revisi';
        btnRevisi.addEventListener('click', function () { klikBukaRevisi(s, true); });
      } else {
        btnRevisi.textContent = '🔒 Kunci';
        btnRevisi.disabled = true;
      }
      tdAksi.appendChild(btnRevisi);

      const btnReset = UMUM.buatEl('button', { class: 'tombol-kecil tombol-sekunder', type: 'button', text: '🔑 Reset PIN' });
      btnReset.addEventListener('click', function () { klikResetPin(s); });
      tdAksi.appendChild(btnReset);

      tr.appendChild(tdAksi);
      wadah.appendChild(tr);
    });

    // Isi nomor urut
    UMUM.qsa('#tabel-siswa-body tr').forEach(function (tr, idx) {
      const td = tr.querySelector('.tabel-no');
      if (td) td.textContent = String(idx + 1);
    });
  }

  /** Membuat badge status siswa. */
  function buatBadgeStatus(status) {
    const peta = {
      'belum': { teks: 'Belum', kelas: 'badge-belum' },
      'sedang': { teks: 'Sedang', kelas: 'badge-sedang' },
      'terkumpul': { teks: 'Terkumpul', kelas: 'badge-terkumpul' },
      'dinilai': { teks: 'Dinilai', kelas: 'badge-dinilai' }
    };
    const p = peta[status] || peta['belum'];
    return UMUM.buatEl('span', { class: 'badge ' + p.kelas, text: p.teks });
  }

  // ============================================================
  // DETAIL PEKERJAAN
  // ============================================================
  function bukaDetail(pengerjaanId, siswa) {
    state.detailAktif = pengerjaanId;
    state.berkasCache = {};
    UMUM.el('detail-info').textContent = 'Memuat pekerjaan ' + (siswa ? siswa.nama : '') + '...';
    UMUM.el('detail-konten').innerHTML = '';
    tampilLayar('layar-detail');

    API.lihatPekerjaan(pengerjaanId, state.sesi.token).then(function (res) {
      if (!res.ok) {
        UMUM.el('detail-info').textContent = 'Gagal: ' + res.pesan;
        return;
      }
      state.dataDetail = res.data;
      renderDetail(res.data);
    });
  }

  /** Render detail pekerjaan siswa. */
  function renderDetail(data) {
    const info = UMUM.el('detail-info');
    UMUM.kosongkan(info);
    const s = data.siswa || {};
    const p = data.pengerjaan || {};
    info.appendChild(UMUM.buatEl('h2', { text: 'Pekerjaan: ' + (s.nama || '-') }));
    const meta = UMUM.buatEl('div', { class: 'detail-meta' });
    meta.appendChild(UMUM.buatEl('span', { text: 'Kelas: ' + (s.kelas || '-') }));
    meta.appendChild(UMUM.buatEl('span', { text: 'Status: ' + (p.status || '-') }));
    meta.appendChild(UMUM.buatEl('span', { text: 'Mulai: ' + (p.waktuMulai ? UMUM.formatWaktu(p.waktuMulai) : '-') }));
    meta.appendChild(UMUM.buatEl('span', { text: 'Kumpul: ' + (p.waktuKumpul ? UMUM.formatWaktu(p.waktuKumpul) : '-') }));
    info.appendChild(meta);

    // Tombol aksi
    const barAksi = UMUM.buatEl('div', { class: 'detail-aksi' });
    const btnRevisi = UMUM.buatEl('button', { class: 'tombol tombol-sekunder', type: 'button' });
    if (p.status === 'terkumpul' || p.status === 'dinilai') {
      btnRevisi.textContent = '🔓 Buka Revisi';
      btnRevisi.addEventListener('click', function () {
        klikBukaRevisi({ pengerjaanId: p.id, nama: s.nama, status: p.status }, true);
      });
    } else {
      btnRevisi.textContent = '🔒 Kunci Revisi';
      btnRevisi.addEventListener('click', function () {
        klikBukaRevisi({ pengerjaanId: p.id, nama: s.nama, status: p.status }, false);
      });
    }
    barAksi.appendChild(btnRevisi);
    const btnUnduhPdf = UMUM.buatEl('button', { class: 'tombol tombol-primer', type: 'button', text: '📄 Unduh PDF' });
    btnUnduhPdf.addEventListener('click', function () {
      UNDUH.buatPdfSiswa({
        lkpd: state.lkpd,
        siswa: { nama: s.nama, kelas: s.kelas },
        pengerjaanId: p.id,
        jawaban: data.jawaban,
        berkas: data.berkas,
        nilai: data.nilai,
        token: state.sesi.token,
        mode: 'guru',
        statusPengerjaan: p.status,
        waktuKumpul: p.waktuKumpul
      });
    });
    barAksi.appendChild(btnUnduhPdf);
    const btnKembali = UMUM.buatEl('button', { class: 'tombol tombol-sekunder', type: 'button', text: '← Kembali' });
    btnKembali.addEventListener('click', function () { tampilLayar('layar-dashboard'); pindahTab('siswa'); });
    barAksi.appendChild(btnKembali);
    info.appendChild(barAksi);

    // Konten jawaban
    const konten = UMUM.el('detail-konten');
    UMUM.kosongkan(konten);

    (state.lkpd.bagian || []).forEach(function (bagian) {
      const kotakBag = UMUM.buatEl('div', { class: 'detail-bagian' });
      kotakBag.appendChild(UMUM.buatEl('h3', { class: 'detail-bagian-judul', text: bagian.judul }));
      (bagian.blok || []).forEach(function (blok) {
        if (blok.jenis === 'bacaan') {
          const kotak = UMUM.buatEl('div', { class: 'blok-bacaan' });
          if (blok.judul) kotak.appendChild(UMUM.buatEl('h4', { text: blok.judul }));
          String(blok.isi || '').split('\n').forEach(function (p) {
            if (p.trim()) kotak.appendChild(UMUM.buatEl('p', { text: p }));
          });
          kotakBag.appendChild(kotak);
        } else if (blok.jenis === 'soal') {
          kotakBag.appendChild(renderSoalDetail(blok, data));
        }
      });
      konten.appendChild(kotakBag);
    });

    // Tombol simpan nilai
    const barSimpan = UMUM.buatEl('div', { class: 'detail-simpan' });
    const btnSimpan = UMUM.buatEl('button', { class: 'tombol tombol-primer tombol-besar', type: 'button', text: '💾 Simpan Nilai' });
    btnSimpan.addEventListener('click', klikSimpanNilai);
    barSimpan.appendChild(btnSimpan);
    konten.appendChild(barSimpan);
  }

  /** Render satu soal di detail (read-only) dengan input nilai. */
  function renderSoalDetail(blok, data) {
    const kotak = UMUM.buatEl('div', { class: 'blok-soal detail-soal', 'data-id-soal': blok.id });
    const kepala = UMUM.buatEl('div', { class: 'soal-kepala' });
    if (blok.nomor) kepala.appendChild(UMUM.buatEl('span', { class: 'soal-nomor', text: 'Soal ' + blok.nomor }));
    else kepala.appendChild(UMUM.buatEl('span', { class: 'soal-nomor soal-nomor-refleksi', text: 'Refleksi' }));
    if (blok.teks) kepala.appendChild(UMUM.buatEl('p', { class: 'soal-teks', text: blok.teks }));
    kotak.appendChild(kepala);

    // Tampilkan jawaban siswa (read-only)
    const wadahJawab = UMUM.buatEl('div', { class: 'soal-jawaban-detail' });
    const jawab = data.jawaban[blok.id];
    wadahJawab.appendChild(tampilJawaban(blok, jawab, data));
    kotak.appendChild(wadahJawab);

    // Foto/kanvas
    const berkasSoal = (data.berkas || []).filter(function (b) { return b.idSoal === blok.id; });
    if (blok.tipe === 'kanvas' && jawab && jawab.data && jawab.data.gambar) {
      const img = UMUM.buatEl('img', { src: jawab.data.gambar, alt: 'Gambar kanvas', class: 'detail-gambar' });
      img.addEventListener('click', function () {
        UMUM.modal({ judul: 'Gambar Kanvas', isi: UMUM.buatEl('img', { src: jawab.data.gambar, alt: 'Gambar', class: 'foto-besar' }), tombol: [{ teks: 'Tutup', tipe: 'sekunder' }] });
      });
      kotak.appendChild(UMUM.buatEl('div', { class: 'detail-gambar-wadah' }, [img]));
    }
    if (berkasSoal.length > 0) {
      const grid = UMUM.buatEl('div', { class: 'foto-grid' });
      berkasSoal.forEach(function (b) {
        const thumb = UMUM.buatEl('div', { class: 'foto-thumb' });
        const img = UMUM.buatEl('img', { alt: b.nama, class: 'foto-thumb-img' });
        img.loading = 'lazy';
        thumb.appendChild(img);
        thumb.appendChild(UMUM.buatEl('span', { class: 'foto-thumb-nama', text: b.nama }));
        grid.appendChild(thumb);
        // Ambil data berkas
        API.ambilBerkasGuru(b.id, state.sesi.token).then(function (res) {
          if (res.ok && res.data && res.data.dataBase64) {
            const url = 'data:' + (b.mime || 'image/jpeg') + ';base64,' + res.data.dataBase64;
            img.src = url;
            state.berkasCache[b.id] = url;
            img.addEventListener('click', function () {
              UMUM.modal({ judul: b.nama, isi: UMUM.buatEl('img', { src: url, alt: b.nama, class: 'foto-besar' }), tombol: [{ teks: 'Tutup', tipe: 'sekunder' }] });
            });
          } else {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="90"%3E%3Crect width="100%25" height="100%25" fill="%23fee2e2"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="10" fill="%23991919"%3Egagal%3C/text%3E%3C/svg%3E';
          }
        });
      });
      kotak.appendChild(grid);
    }

    // Input nilai & komentar
    const nilaiSebelumnya = data.nilai[blok.id] || {};
    const wadahNilai = UMUM.buatEl('div', { class: 'detail-input-nilai' });
    wadahNilai.appendChild(UMUM.buatEl('label', { text: 'Nilai Soal ' + (blok.nomor || '') }));
    const inputSkor = UMUM.buatEl('input', {
      type: 'number', class: 'input-nilai', 'data-id-soal': blok.id, 'data-jenis': 'skor',
      value: nilaiSebelumnya.skor !== undefined && nilaiSebelumnya.skor !== '' ? nilaiSebelumnya.skor : '',
      placeholder: '0-100', min: '0', max: '100'
    });
    wadahNilai.appendChild(inputSkor);
    wadahNilai.appendChild(UMUM.buatEl('label', { text: 'Komentar' }));
    const inputKomentar = UMUM.buatEl('textarea', {
      class: 'input-komentar', 'data-id-soal': blok.id, 'data-jenis': 'komentar',
      rows: 2, placeholder: 'Tulis komentar untuk siswa...'
    });
    inputKomentar.value = nilaiSebelumnya.komentar || '';
    wadahNilai.appendChild(inputKomentar);
    kotak.appendChild(wadahNilai);

    return kotak;
  }

  /** Menampilkan jawaban siswa read-only sesuai tipe. */
  function tampilJawaban(blok, jawab, data) {
    const wadah = UMUM.buatEl('div', { class: 'jawaban-tampil' });
    if (!jawab || (!jawab.teks && !jawab.data)) {
      wadah.appendChild(UMUM.buatEl('p', { class: 'jawaban-kosong', text: '(belum dijawab)' }));
      return wadah;
    }
    const teks = jawab.teks || '';
    const d = jawab.data;
    switch (blok.tipe) {
      case 'teks_singkat':
      case 'uraian':
      case 'pilihan_ganda':
      case 'benar_salah':
      case 'isian_angka':
      case 'skala_refleksi':
        wadah.appendChild(UMUM.buatEl('p', { class: 'jawaban-teks', text: teks || '(kosong)' }));
        break;
      case 'tabel_isian':
        if (d && d.sel) {
          const tabel = UMUM.buatEl('table', { class: 'tabel-isian' });
          const thead = UMUM.buatEl('thead'); const trh = UMUM.buatEl('tr');
          (blok.kolom || []).forEach(function (k) { trh.appendChild(UMUM.buatEl('th', { text: k })); });
          thead.appendChild(trh); tabel.appendChild(thead);
          const tbody = UMUM.buatEl('tbody');
          (blok.baris || []).forEach(function (br, idxB) {
            const tr = UMUM.buatEl('tr');
            (blok.kolom || []).forEach(function (k, idxK) {
              const td = UMUM.buatEl('td');
              if (blok.kolomIsian && blok.kolomIsian.indexOf(idxK) !== -1) {
                td.textContent = d.sel[br.id + '_' + idxK] || '';
              } else if (blok.nilaiKolom && blok.nilaiKolom[idxK] && blok.nilaiKolom[idxK][idxB] !== undefined) {
                td.textContent = String(blok.nilaiKolom[idxK][idxB]);
              } else if (idxK === 0 && br.label) {
                td.textContent = br.label;
              }
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          tabel.appendChild(tbody); wadah.appendChild(tabel);
        }
        break;
      case 'menjodohkan':
        if (d && d.pasangan) {
          const ul = UMUM.buatEl('ul', { class: 'jawaban-list' });
          (blok.item || []).forEach(function (it) {
            ul.appendChild(UMUM.buatEl('li', { text: it.kiri + ' → ' + (d.pasangan[it.id] || '-') }));
          });
          wadah.appendChild(ul);
        }
        break;
      case 'urutkan':
        if (d && d.urutan) {
          const itemMap = {};
          (blok.item || []).forEach(function (i) { itemMap[i.id] = i; });
          const ol = UMUM.buatEl('ol', { class: 'jawaban-urut' });
          d.urutan.forEach(function (idItem) {
            const it = itemMap[idItem];
            ol.appendChild(UMUM.buatEl('li', { text: it ? it.teks : idItem }));
          });
          wadah.appendChild(ol);
        }
        break;
      case 'kanvas':
        wadah.appendChild(UMUM.buatEl('p', { class: 'jawaban-teks', text: '(lihat gambar kanvas di bawah)' }));
        break;
      case 'foto':
        wadah.appendChild(UMUM.buatEl('p', { class: 'jawaban-teks', text: '(lihat foto di bawah)' }));
        break;
    }
    return wadah;
  }

  // ============================================================
  // SIMPAN NILAI
  // ============================================================
  function klikSimpanNilai() {
    if (!state.dataDetail) return;
    const pengerjaanId = state.dataDetail.pengerjaan.id;
    const nilaiArr = [];
    UMUM.qsa('.detail-soal').forEach(function (kotak) {
      const idSoal = kotak.getAttribute('data-id-soal');
      const skor = kotak.querySelector('input[data-jenis="skor"]');
      const komentar = kotak.querySelector('textarea[data-jenis="komentar"]');
      if (skor || komentar) {
        nilaiArr.push({
          idSoal: idSoal,
          skor: skor ? skor.value : '',
          komentar: komentar ? komentar.value : ''
        });
      }
    });
    if (nilaiArr.length === 0) {
      UMUM.toast('Tidak ada nilai untuk disimpan.', 'peringatan');
      return;
    }
    UMUM.konfirmasi('Simpan nilai untuk ' + nilaiArr.length + ' soal?', 'Simpan Nilai?').then(function (ya) {
      if (!ya) return;
      UMUM.toast('Menyimpan nilai...', 'info', 3000);
      API.beriNilai(pengerjaanId, nilaiArr, state.sesi.token).then(function (res) {
        if (res.ok) {
          UMUM.toast('Nilai tersimpan. Status: dinilai.', 'sukses');
          // Refresh daftar siswa
          muatDaftarSiswa();
        } else {
          UMUM.toast('Gagal: ' + res.pesan, 'bahaya');
        }
      });
    });
  }

  // ============================================================
  // RESET PIN
  // ============================================================
  function klikResetPin(siswa) {
    UMUM.konfirmasi('Reset PIN untuk ' + siswa.nama + '? Siswa harus membuat PIN baru saat masuk.', 'Reset PIN?').then(function (ya) {
      if (!ya) return;
      API.resetPin(siswa.id, state.sesi.token).then(function (res) {
        if (res.ok) {
          UMUM.toast('PIN ' + siswa.nama + ' direset.', 'sukses');
        } else {
          UMUM.toast('Gagal: ' + res.pesan, 'bahaya');
        }
      });
    });
  }

  // ============================================================
  // BUKA / TUTUP REVISI
  // ============================================================
  function klikBukaRevisi(siswa, buka) {
    if (!siswa.pengerjaanId) {
      UMUM.toast('Siswa belum memulai pengerjaan.', 'peringatan');
      return;
    }
    const pesan = buka
      ? 'Buka revisi untuk ' + siswa.nama + '? Siswa dapat mengubah jawaban lalu mengumpulkan ulang.'
      : 'Kunci revisi untuk ' + siswa.nama + '? Jawaban akan terkunci kembali.';
    UMUM.konfirmasi(pesan, buka ? 'Buka Revisi?' : 'Kunci Revisi?').then(function (ya) {
      if (!ya) return;
      API.bukaRevisi(siswa.pengerjaanId, buka, state.sesi.token).then(function (res) {
        if (res.ok) {
          UMUM.toast(buka ? 'Revisi dibuka.' : 'Revisi dikunci.', 'sukses');
          muatDaftarSiswa();
          // Jika detail terbuka, kembali ke dashboard
          if (state.detailAktif === siswa.pengerjaanId) {
            tampilLayar('layar-dashboard');
            pindahTab('siswa');
          }
        } else {
          UMUM.toast('Gagal: ' + res.pesan, 'bahaya');
        }
      });
    });
  }

  // ============================================================
  // PENGATURAN
  // ============================================================
  function muatPengaturan() {
    API.bacaPengaturan(state.sesi.token).then(function (res) {
      if (!res.ok) {
        UMUM.toast('Gagal memuat pengaturan: ' + res.pesan, 'bahaya');
        return;
      }
      state.pengaturan = res.data;
      isiFilterKelas();
      renderFormPengaturan(res.data);
    });
  }

  function renderFormPengaturan(p) {
    const elAkses = UMUM.el('set-akses-buka');
    if (elAkses) elAkses.checked = p.aksesBuka !== false;
    const elTenggat = UMUM.el('set-tenggat');
    if (elTenggat) {
      // Format untuk input datetime-local: YYYY-MM-DDTHH:MM
      if (p.tenggat) {
        const d = new Date(p.tenggat);
        if (!isNaN(d.getTime())) {
          elTenggat.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      }
    }
    const elTampil = UMUM.el('set-tampilkan-nilai');
    if (elTampil) elTampil.checked = p.tampilkanNilaiSiswa === true;
    const elKelas = UMUM.el('set-daftar-kelas');
    if (elKelas) elKelas.value = (p.daftarKelas || []).join(', ');
    const elJudul = UMUM.el('set-lkpd-judul');
    if (elJudul) elJudul.value = p.lkpdJudul || state.lkpd.meta.judul;
  }

  function klikSimpanPengaturan() {
    const aksesBuka = UMUM.el('set-akses-buka').checked;
    const tenggatInput = UMUM.el('set-tenggat').value;
    const tampilkanNilai = UMUM.el('set-tampilkan-nilai').checked;
    const kelasStr = UMUM.el('set-daftar-kelas').value;
    const judul = UMUM.el('set-lkpd-judul').value;
    const daftarKelas = kelasStr.split(',').map(function (k) { return k.trim(); }).filter(function (k) { return k; });

    let tenggat = '';
    if (tenggatInput) {
      const d = new Date(tenggatInput);
      if (!isNaN(d.getTime())) tenggat = d.toISOString();
    }

    const pengaturan = {
      aksesBuka: aksesBuka,
      tenggat: tenggat,
      tampilkanNilaiSiswa: tampilkanNilai,
      daftarKelas: daftarKelas,
      infoLkpd: { id: state.lkpd.meta.id, judul: judul, mapel: state.lkpd.meta.mapel, kelas: state.lkpd.meta.kelas }
    };

    UMUM.toast('Menyimpan pengaturan...', 'info', 3000);
    API.simpanPengaturan(pengaturan, state.sesi.token).then(function (res) {
      if (res.ok) {
        UMUM.toast('Pengaturan tersimpan.', 'sukses');
        state.pengaturan = Object.assign({}, state.pengaturan, pengaturan);
        isiFilterKelas();
      } else {
        UMUM.toast('Gagal: ' + res.pesan, 'bahaya');
      }
    });
  }

  // ============================================================
  // UNDUH
  // ============================================================
  function klikUnduhXlsx() {
    if (state.daftarSiswa.length === 0) { UMUM.toast('Belum ada siswa.', 'peringatan'); return; }
    tampilkanProgresUnduh('Membuat rekap XLSX...');
    UNDUH.rekapXlsx(state.daftarSiswa, state.lkpd, state.sesi.token, function (p) {
      updateProgresUnduh(p);
    }).then(function () {
      sembunyikanProgresUnduh();
    });
  }

  function klikUnduhCsv() {
    if (state.daftarSiswa.length === 0) { UMUM.toast('Belum ada siswa.', 'peringatan'); return; }
    tampilkanProgresUnduh('Membuat rekap CSV...');
    UNDUH.rekapCsv(state.daftarSiswa, state.lkpd, state.sesi.token, function (p) {
      updateProgresUnduh(p);
    }).then(function () {
      sembunyikanProgresUnduh();
    });
  }

  function klikUnduhZip() {
    if (state.daftarSiswa.length === 0) { UMUM.toast('Belum ada siswa.', 'peringatan'); return; }
    UMUM.konfirmasi('Membuat ZIP massal untuk ' + state.daftarSiswa.length + ' siswa? Proses ini memerlukan waktu dan data internet.', 'Unduh ZIP Massal?').then(function (ya) {
      if (!ya) return;
      tampilkanProgresUnduh('Memulai ZIP massal...');
      UNDUH.zipMassal(state.daftarSiswa, state.lkpd, state.sesi.token, function (p) {
        updateProgresUnduh(p);
      }).then(function () {
        sembunyikanProgresUnduh();
      });
    });
  }

  function tampilkanProgresUnduh(teks) {
    const wadah = UMUM.el('progres-unduh');
    if (!wadah) return;
    wadah.style.display = 'block';
    UMUM.el('progres-unduh-teks').textContent = teks;
    UMUM.el('progres-unduh-bar').style.width = '0%';
  }
  function updateProgresUnduh(p) {
    const persen = p.total > 0 ? Math.round((p.sekarang / p.total) * 100) : 0;
    UMUM.el('progres-unduh-bar').style.width = persen + '%';
    let teks = '';
    if (p.tahap) teks = p.tahap + ' — ';
    teks += p.sekarang + '/' + p.total;
    if (p.nama) teks += ' (' + p.nama + ')';
    UMUM.el('progres-unduh-teks').textContent = teks;
  }
  function sembunyikanProgresUnduh() {
    const wadah = UMUM.el('progres-unduh');
    if (wadah) setTimeout(function () { wadah.style.display = 'none'; }, 1500);
  }

  // ============================================================
  // TAB
  // ============================================================
  function pindahTab(nama) {
    UMUM.qsa('.tab-nav-tombol').forEach(function (b) {
      b.classList.toggle('aktif', b.getAttribute('data-tab') === nama);
    });
    UMUM.qsa('.tab-panel').forEach(function (p) {
      p.classList.toggle('aktif', p.getAttribute('data-tab') === nama);
    });
  }

  // ============================================================
  // KELUAR
  // ============================================================
  function klikKeluar() {
    UMUM.konfirmasi('Keluar dari dashboard guru?', 'Keluar?').then(function (ya) {
      if (ya) {
        UMUM.lsHapus('sesiGuru');
        state.sesi = null;
        tampilLayar('layar-login-guru');
        UMUM.el('guru-sandi').value = '';
      }
    });
  }

  // ============================================================
  // PESAN GALAT
  // ============================================================
  function tampilGalat(node, pesan) {
    if (!node) return;
    node.textContent = pesan; node.style.display = 'block';
  }
  function sembunyikanGalat(node) {
    if (!node) return;
    node.textContent = ''; node.style.display = 'none';
  }

  // ============================================================
  // MULAI
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
// ============================================================
// AKHIR FILE js/guru.js
// ============================================================
