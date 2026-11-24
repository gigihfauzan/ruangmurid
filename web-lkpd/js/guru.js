/**
 * ============================================================================
 * LOGIKA DASHBOARD GURU (js/guru.js)
 * ============================================================================
 * Mengelola autentikasi guru, daftar siswa per kelas, filter & pencarian,
 * pemeriksaan jawaban/gambar/foto, penilaian per soal & total, reset PIN,
 * buka revisi, pengaturan akses/tenggat/kelas, serta pemicu ekspor XLSX/CSV/ZIP.
 */

window.GuruApp = (function () {
  'use strict';

  const KUNCI_SESI_GURU = 'ELKPD_SESI_GURU_V1';

  const state = {
    token: '',
    lkpd: null,
    pengaturan: {},
    daftarKelas: [],
    daftarSiswa: [],
    detailAktif: null, // { siswa, pengerjaan, jawaban, berkas, nilai, cacheGambar }
    sedangEkspor: false
  };

  function simpanSesiGuru(token) {
    try {
      localStorage.setItem(KUNCI_SESI_GURU, JSON.stringify({ token: token, waktu: Date.now() }));
    } catch (err) {
      // Abaikan
    }
  }

  function bacaSesiGuru() {
    try {
      const raw = localStorage.getItem(KUNCI_SESI_GURU);
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed && parsed.token ? String(parsed.token) : '';
    } catch (err) {
      return '';
    }
  }

  function hapusSesiGuru() {
    try {
      localStorage.removeItem(KUNCI_SESI_GURU);
    } catch (err) {
      // Abaikan
    }
  }

  function mulai() {
    state.lkpd = window.ELKPD || null;
    if (state.lkpd && state.lkpd.tema) {
      window.Umum.terapkanTema(state.lkpd.tema);
    }

    pasangEventLoginGuru();
    pasangEventTabDanFilter();
    pasangEventKunciOtomatis();
    pasangEventPengaturan();
    pasangEventModalDetail();
    pasangEventUnduh();

    const tokenSimpan = bacaSesiGuru();
    if (tokenSimpan) {
      state.token = tokenSimpan;
      masukKeDashboard(true);
    }
  }

  function pasangEventLoginGuru() {
    const form = document.getElementById('form-login-guru');
    const inputPass = document.getElementById('input-password-guru');
    const btnSubmit = document.getElementById('tombol-submit-login-guru');
    const kotakGalat = document.getElementById('galat-login-guru');
    const teksGalat = document.getElementById('teks-galat-login-guru');

    form.addEventListener('submit', async function (evt) {
      evt.preventDefault();
      kotakGalat.classList.add('tersembunyi');

      const password = inputPass.value;
      if (!password) {
        teksGalat.textContent = 'Masukkan kata sandi guru terlebih dahulu.';
        kotakGalat.classList.remove('tersembunyi');
        inputPass.focus();
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = '⏳ Memverifikasi...';

      try {
        const res = await window.ApiLKPD.kirim('masukGuru', { password: password });
        if (!res || !res.ok) {
          teksGalat.textContent = (res && res.pesan) || 'Kata sandi tidak valid.';
          kotakGalat.classList.remove('tersembunyi');
          return;
        }

        state.token = res.data.token;
        state.pengaturan = res.data.pengaturan || {};
        state.daftarKelas = res.data.daftarKelas || [];
        simpanSesiGuru(state.token);
        inputPass.value = '';
        await masukKeDashboard(false);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Masuk ke Dashboard ➡️';
      }
    });

    document.getElementById('tombol-keluar-guru').addEventListener('click', function () {
      hapusSesiGuru();
      state.token = '';
      location.reload();
    });
  }

  async function masukKeDashboard(modePulihkanSesi) {
    document.getElementById('tampilan-login-guru').classList.add('tersembunyi');
    document.getElementById('tampilan-dashboard-guru').classList.remove('tersembunyi');
    document.getElementById('tombol-keluar-guru').classList.remove('tersembunyi');

    const ok = await muatDaftarSiswaDariServer();
    if (!ok && modePulihkanSesi) {
      hapusSesiGuru();
      document.getElementById('tampilan-dashboard-guru').classList.add('tersembunyi');
      document.getElementById('tampilan-login-guru').classList.remove('tersembunyi');
      document.getElementById('tombol-keluar-guru').classList.add('tersembunyi');
    }
  }

  async function muatDaftarSiswaDariServer() {
    const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
    const res = await window.ApiLKPD.kirim('daftarSiswa', {
      token: state.token,
      idLkpd: idLkpd
    });

    if (!res || !res.ok) {
      if (res && res.kode === 'SESI_TIDAK_VALID') {
        window.Umum.tampilkanToast('Sesi guru berakhir, silakan masuk kembali.', 'peringatan');
        return false;
      }
      window.Umum.tampilkanToast((res && res.pesan) || 'Gagal memuat daftar siswa.', 'bahaya');
      return true;
    }

    state.daftarSiswa = Array.isArray(res.data.daftarSiswa) ? res.data.daftarSiswa : [];
    if (Array.isArray(res.data.daftarKelas) && res.data.daftarKelas.length > 0) {
      state.daftarKelas = res.data.daftarKelas;
    }

    renderChipIdentitasGuru();
    isiFilterKelas();
    renderStatistikRingkasan();
    renderTabelSiswa();
    return true;
  }

  function renderChipIdentitasGuru() {
    const chip = document.getElementById('chip-guru-identitas');
    chip.innerHTML = '';
    const meta = (state.lkpd && state.lkpd.meta) || {};
    const guru = state.pengaturan.nama_guru || meta.guru || '';
    const sekolah = state.pengaturan.nama_sekolah || meta.sekolah || '';
    const lkpdAktif = state.pengaturan.judul_lkpd || meta.judul || '';

    [
      guru ? '👨‍🏫 ' + guru : '',
      sekolah ? '🏫 ' + sekolah : '',
      lkpdAktif ? '📘 ' + lkpdAktif : ''
    ]
      .filter(Boolean)
      .forEach(function (t) {
        const span = document.createElement('span');
        span.className = 'chip-meta';
        span.textContent = t;
        chip.appendChild(span);
      });
  }

  function isiFilterKelas() {
    const select = document.getElementById('filter-kelas-guru');
    const nilaiTerpilih = select.value;
    select.innerHTML = '<option value="">Semua Kelas</option>';

    const setKelas = new Set();
    state.daftarKelas.forEach(function (k) {
      const nama = typeof k === 'string' ? k : k.nama;
      if (nama) setKelas.add(nama);
    });
    state.daftarSiswa.forEach(function (s) {
      if (s.kelas) setKelas.add(s.kelas);
    });

    Array.from(setKelas).forEach(function (namaKelas) {
      const opt = document.createElement('option');
      opt.value = namaKelas;
      opt.textContent = 'Kelas ' + namaKelas;
      if (namaKelas === nilaiTerpilih) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function renderStatistikRingkasan() {
    const total = state.daftarSiswa.length;
    let terkumpul = 0;
    let sedang = 0;
    let belum = 0;

    state.daftarSiswa.forEach(function (s) {
      if (s.status === 'terkumpul') terkumpul++;
      else if (s.status === 'sedang') sedang++;
      else belum++;
    });

    document.getElementById('stat-total-siswa').textContent = String(total);
    document.getElementById('stat-terkumpul').textContent = String(terkumpul);
    document.getElementById('stat-sedang').textContent = String(sedang);
    document.getElementById('stat-belum').textContent = String(belum);
  }

  function ambilSiswaTerfilter() {
    const kataKunci = String(document.getElementById('input-cari-siswa').value || '')
      .trim()
      .toLowerCase();
    const kelasPilih = String(document.getElementById('filter-kelas-guru').value || '').trim();
    const statusPilih = String(document.getElementById('filter-status-guru').value || '').trim();

    return state.daftarSiswa.filter(function (s) {
      if (kelasPilih && String(s.kelas) !== kelasPilih) return false;
      if (statusPilih && String(s.status) !== statusPilih) return false;
      if (kataKunci && String(s.nama || '').toLowerCase().indexOf(kataKunci) === -1) return false;
      return true;
    });
  }

  function renderTabelSiswa() {
    const tbody = document.getElementById('tbody-daftar-siswa');
    tbody.innerHTML = '';

    const daftar = ambilSiswaTerfilter();
    if (daftar.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td colspan="8" style="text-align:center;padding:24px;color:#64748b;">Tidak ada data siswa yang sesuai dengan filter.</td>';
      tbody.appendChild(tr);
      return;
    }

    daftar.forEach(function (s, idx) {
      const tr = document.createElement('tr');

      const labelStatus =
        s.status === 'terkumpul'
          ? '<span class="lencana-status status-terkumpul">✅ Terkumpul</span>'
          : s.status === 'sedang'
            ? '<span class="lencana-status status-sedang">✏️ Sedang</span>'
            : '<span class="lencana-status status-belum">⏳ Belum</span>';

      const infoReset = s.statusReset
        ? ' <span class="lencana-status status-sedang" title="Menunggu siswa membuat PIN baru">Reset PIN</span>'
        : '';

      const skorTampil =
        s.totalSkor !== null && s.totalSkor !== undefined
          ? '<strong>' + window.Umum.escapeHtml(s.totalSkor) + '</strong>'
          : '-';

      tr.innerHTML =
        '<td>' +
        (idx + 1) +
        '</td>' +
        '<td><span class="lencana-kelas">' +
        window.Umum.escapeHtml(s.kelas) +
        '</span></td>' +
        '<td><strong>' +
        window.Umum.escapeHtml(s.nama) +
        '</strong>' +
        infoReset +
        '</td>' +
        '<td>' +
        labelStatus +
        '</td>' +
        '<td>' +
        window.Umum.escapeHtml(s.waktuKumpul ? window.Umum.formatWaktuIndonesia(s.waktuKumpul) : '-') +
        '</td>' +
        '<td>' +
        (s.jumlahBerkas > 0 ? '🖼️ ' + s.jumlahBerkas : '0') +
        '</td>' +
        '<td>' +
        skorTampil +
        '</td>' +
        '<td><div class="aksi-baris-guru"></div></td>';

      const wadahAksi = tr.querySelector('.aksi-baris-guru');

      const btnLihat = document.createElement('button');
      btnLihat.type = 'button';
      btnLihat.className = 'tombol tombol-utama tombol-kecil';
      btnLihat.textContent = '👁️ Lihat & Nilai';
      btnLihat.addEventListener('click', function () {
        bukaModalDetailSiswa(s.idSiswa);
      });

      const btnReset = document.createElement('button');
      btnReset.type = 'button';
      btnReset.className = 'tombol tombol-sekunder tombol-kecil';
      btnReset.textContent = '🔑 Reset PIN';
      btnReset.addEventListener('click', function () {
        resetPinSiswa(s);
      });

      wadahAksi.appendChild(btnLihat);
      wadahAksi.appendChild(btnReset);

      if (s.status === 'terkumpul') {
        const btnRevisi = document.createElement('button');
        btnRevisi.type = 'button';
        btnRevisi.className = 'tombol tombol-aksen tombol-kecil';
        btnRevisi.textContent = '🔓 Buka Revisi';
        btnRevisi.addEventListener('click', function () {
          bukaRevisiSiswa(s);
        });
        wadahAksi.appendChild(btnRevisi);
      }

      tbody.appendChild(tr);
    });
  }

  async function resetPinSiswa(siswa) {
    const res = await window.ApiLKPD.kirim('resetPin', {
      token: state.token,
      idSiswa: siswa.idSiswa
    });
    if (!res || !res.ok) {
      window.Umum.tampilkanToast((res && res.pesan) || 'Gagal mereset PIN siswa.', 'bahaya');
      return;
    }
    window.Umum.tampilkanToast(res.pesan || 'PIN berhasil direset.', 'sukses');
    await muatDaftarSiswaDariServer();
  }

  async function bukaRevisiSiswa(siswa) {
    const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
    const res = await window.ApiLKPD.kirim('bukaRevisi', {
      token: state.token,
      idSiswa: siswa.idSiswa,
      idLkpd: idLkpd
    });
    if (!res || !res.ok) {
      window.Umum.tampilkanToast((res && res.pesan) || 'Gagal membuka revisi.', 'bahaya');
      return;
    }
    window.Umum.tampilkanToast('Akses revisi dibuka untuk ' + siswa.nama + '.', 'sukses');
    await muatDaftarSiswaDariServer();
  }

  /**
   * ==========================================================================
   * PENGELOLA KUNCI SKOR OTOMATIS (KELOLA KUNCI DI SERVER)
   * ==========================================================================
   */
  async function muatDanRenderFormKunci() {
    const wadah = document.getElementById('wadah-form-kunci-otomatis');
    if (!wadah) return;
    wadah.innerHTML = '<p style="color:#64748b;">Memuat kunci jawaban dari server...</p>';

    const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
    const res = await window.ApiLKPD.kirim('kelolaKunci', {
      token: state.token,
      mode: 'baca',
      idLkpd: idLkpd
    });

    const mapKunci = {};
    if (res && res.ok && res.data && Array.isArray(res.data.daftarKunci)) {
      res.data.daftarKunci.forEach(function (k) {
        mapKunci[k.idSoal] = k;
      });
    }

    const soalOtomatis = ambilSemuaSoalKonten().filter(function (s) {
      return ['pilihan_ganda', 'benar_salah', 'isian_angka'].indexOf(String(s.tipe)) !== -1;
    });

    wadah.innerHTML = '';
    if (soalOtomatis.length === 0) {
      wadah.innerHTML = '<p>Tidak ada soal bertipe pilihan_ganda, benar_salah, atau isian_angka pada konten ini.</p>';
      return;
    }

    soalOtomatis.forEach(function (soal) {
      const ada = mapKunci[soal.id] || { kunciJawaban: '', toleransi: 0, bobot: 10 };
      const baris = document.createElement('div');
      baris.className = 'item-jawaban-guru';

      baris.innerHTML =
        '<div style="font-weight:800;margin-bottom:8px;">Soal ' +
        window.Umum.escapeHtml(soal.nomor) +
        ' (' +
        window.Umum.escapeHtml(soal.tipe) +
        ') — ' +
        window.Umum.escapeHtml(soal.teks || '') +
        '</div>' +
        '<div class="grid-nilai-guru" style="grid-template-columns: 2fr 1fr 1fr; margin-top:0; padding-top:0; border-top:none;">' +
        '<div><label class="label-form" style="font-size:0.82rem;">Kunci Jawaban</label>' +
        '<input type="text" class="input-teks input-kunci-jwb" data-id-soal="' +
        window.Umum.escapeHtml(soal.id) +
        '" data-tipe="' +
        window.Umum.escapeHtml(soal.tipe) +
        '" value="' +
        window.Umum.escapeHtml(ada.kunciJawaban || '') +
        '" placeholder="Contoh: (-3)^5 atau 43" /></div>' +
        '<div><label class="label-form" style="font-size:0.82rem;">Toleransi Angka</label>' +
        '<input type="number" step="0.01" class="input-teks input-kunci-tol" data-id-soal="' +
        window.Umum.escapeHtml(soal.id) +
        '" value="' +
        window.Umum.escapeHtml(ada.toleransi !== undefined ? ada.toleransi : 0) +
        '" /></div>' +
        '<div><label class="label-form" style="font-size:0.82rem;">Bobot Skor</label>' +
        '<input type="number" step="0.5" class="input-teks input-kunci-bobot" data-id-soal="' +
        window.Umum.escapeHtml(soal.id) +
        '" value="' +
        window.Umum.escapeHtml(ada.bobot !== undefined ? ada.bobot : 10) +
        '" /></div>' +
        '</div>';

      wadah.appendChild(baris);
    });
  }

  function pasangEventKunciOtomatis() {
    const btnSimpan = document.getElementById('tombol-simpan-kunci-otomatis');
    if (!btnSimpan) return;

    btnSimpan.addEventListener('click', async function () {
      const daftarKunci = [];
      const inputsJwb = document.querySelectorAll('.input-kunci-jwb');
      const mapTol = {};
      const mapBobot = {};

      document.querySelectorAll('.input-kunci-tol').forEach(function (el) {
        mapTol[el.dataset.idSoal] = el.value;
      });
      document.querySelectorAll('.input-kunci-bobot').forEach(function (el) {
        mapBobot[el.dataset.idSoal] = el.value;
      });

      inputsJwb.forEach(function (el) {
        const idSoal = el.dataset.idSoal;
        const kunciVal = el.value.trim();
        if (kunciVal) {
          daftarKunci.push({
            idSoal: idSoal,
            tipe: el.dataset.tipe,
            kunciJawaban: kunciVal,
            toleransi: Number(mapTol[idSoal] || 0),
            bobot: Number(mapBobot[idSoal] || 10)
          });
        }
      });

      btnSimpan.disabled = true;
      btnSimpan.textContent = '⏳ Menyimpan kunci...';
      try {
        const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
        const res = await window.ApiLKPD.kirim('kelolaKunci', {
          token: state.token,
          mode: 'simpan',
          idLkpd: idLkpd,
          daftarKunci: daftarKunci
        });
        if (!res || !res.ok) {
          window.Umum.tampilkanToast((res && res.pesan) || 'Gagal menyimpan kunci.', 'bahaya');
          return;
        }
        window.Umum.tampilkanToast('Kunci jawaban berhasil disimpan ke server!', 'sukses');
      } finally {
        btnSimpan.disabled = false;
        btnSimpan.textContent = '💾 Simpan Kunci Jawaban ke Server';
      }
    });
  }

  /**
   * ==========================================================================
   * PENGATURAN SISTEM GURU
   * ==========================================================================
   */
  function isiFormPengaturan() {
    const p = state.pengaturan || {};
    const meta = (state.lkpd && state.lkpd.meta) || {};

    document.getElementById('set-lkpd-aktif').value = p.lkpd_aktif || meta.id || '';
    document.getElementById('set-judul-lkpd').value = p.judul_lkpd || meta.judul || '';
    document.getElementById('set-akses-dibuka').value = p.akses_dibuka === 'TIDAK' ? 'TIDAK' : 'YA';
    document.getElementById('set-skor-otomatis').value = p.skor_otomatis === 'YA' ? 'YA' : 'TIDAK';
    document.getElementById('set-tampilkan-skor').value =
      p.tampilkan_skor_siswa === 'TIDAK' ? 'TIDAK' : 'YA';

    if (p.tenggat) {
      const d = new Date(p.tenggat);
      if (!isNaN(d.getTime())) {
        const lokal = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        document.getElementById('set-tenggat').value = lokal;
      }
    } else {
      document.getElementById('set-tenggat').value = '';
    }

    const namaKelasList = state.daftarKelas
      .map(function (k) {
        return typeof k === 'string' ? k : k.nama;
      })
      .filter(Boolean);
    document.getElementById('set-daftar-kelas').value = namaKelasList.join(', ');
    document.getElementById('set-password-baru').value = '';
  }

  function pasangEventPengaturan() {
    const form = document.getElementById('form-pengaturan-guru');
    form.addEventListener('submit', async function (evt) {
      evt.preventDefault();

      const kelasStr = document.getElementById('set-daftar-kelas').value;
      const daftarKelasBaru = kelasStr
        .split(',')
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);

      if (daftarKelasBaru.length === 0) {
        window.Umum.tampilkanToast('Minimal harus ada 1 nama kelas.', 'peringatan');
        return;
      }

      const tenggatInput = document.getElementById('set-tenggat').value;
      const tenggatIso = tenggatInput ? new Date(tenggatInput).toISOString() : '';

      const pengaturanBaru = {
        lkpd_aktif: document.getElementById('set-lkpd-aktif').value.trim(),
        judul_lkpd: document.getElementById('set-judul-lkpd').value.trim(),
        akses_dibuka: document.getElementById('set-akses-dibuka').value,
        tenggat: tenggatIso,
        skor_otomatis: document.getElementById('set-skor-otomatis').value,
        tampilkan_skor_siswa: document.getElementById('set-tampilkan-skor').value
      };

      const passwordBaru = document.getElementById('set-password-baru').value;
      const btn = document.getElementById('tombol-simpan-pengaturan');
      btn.disabled = true;
      btn.textContent = '⏳ Menyimpan pengaturan...';

      try {
        const res = await window.ApiLKPD.kirim('simpanPengaturan', {
          token: state.token,
          pengaturan: pengaturanBaru,
          daftarKelas: daftarKelasBaru,
          passwordBaru: passwordBaru
        });

        if (!res || !res.ok) {
          window.Umum.tampilkanToast((res && res.pesan) || 'Gagal menyimpan pengaturan.', 'bahaya');
          return;
        }

        state.pengaturan = res.data.pengaturan || pengaturanBaru;
        state.daftarKelas = res.data.daftarKelas || daftarKelasBaru;
        document.getElementById('set-password-baru').value = '';

        renderChipIdentitasGuru();
        isiFilterKelas();
        window.Umum.tampilkanToast('Pengaturan berhasil disimpan ke server!', 'sukses');
      } finally {
        btn.disabled = false;
        btn.textContent = '💾 Simpan Pengaturan';
      }
    });
  }

  /**
   * ==========================================================================
   * NAVIGASI TAB, FILTER & EKSPOR DATA
   * ==========================================================================
   */
  function pasangEventTabDanFilter() {
    const tabs = [
      { btn: 'tab-guru-siswa', panel: 'panel-guru-siswa' },
      { btn: 'tab-guru-unduh', panel: 'panel-guru-unduh' },
      { btn: 'tab-guru-kunci', panel: 'panel-guru-kunci' },
      { btn: 'tab-guru-pengaturan', panel: 'panel-guru-pengaturan' }
    ];

    tabs.forEach(function (t) {
      document.getElementById(t.btn).addEventListener('click', function () {
        tabs.forEach(function (item) {
          document.getElementById(item.btn).classList.remove('aktif');
          document.getElementById(item.panel).classList.add('tersembunyi');
        });
        document.getElementById(t.btn).classList.add('aktif');
        document.getElementById(t.panel).classList.remove('tersembunyi');

        if (t.panel === 'panel-guru-pengaturan') {
          isiFormPengaturan();
        } else if (t.panel === 'panel-guru-kunci') {
          muatDanRenderFormKunci();
        }
      });
    });

    document.getElementById('input-cari-siswa').addEventListener('input', renderTabelSiswa);
    document.getElementById('filter-kelas-guru').addEventListener('change', renderTabelSiswa);
    document.getElementById('filter-status-guru').addEventListener('change', renderTabelSiswa);
    document.getElementById('tombol-muat-ulang-siswa').addEventListener('click', function () {
      muatDaftarSiswaDariServer();
    });
  }

  function pasangEventUnduh() {
    document.getElementById('tombol-unduh-xlsx').addEventListener('click', async function () {
      if (!window.UnduhLKPD) return;
      await window.UnduhLKPD.unduhRekapSpreadsheet({
        format: 'xlsx',
        lkpd: state.lkpd,
        daftarSiswa: ambilSiswaTerfilter(),
        token: state.token,
        onProgres: perbaruiProgresUnduh
      });
    });

    document.getElementById('tombol-unduh-csv').addEventListener('click', async function () {
      if (!window.UnduhLKPD) return;
      await window.UnduhLKPD.unduhRekapSpreadsheet({
        format: 'csv',
        lkpd: state.lkpd,
        daftarSiswa: ambilSiswaTerfilter(),
        token: state.token,
        onProgres: perbaruiProgresUnduh
      });
    });

    document.getElementById('tombol-unduh-zip-terfilter').addEventListener('click', async function () {
      if (state.sedangEkspor || !window.UnduhLKPD) return;
      state.sedangEkspor = true;
      try {
        await window.UnduhLKPD.unduhZipMassal({
          lkpd: state.lkpd,
          daftarSiswa: ambilSiswaTerfilter(),
          token: state.token,
          onProgres: perbaruiProgresUnduh
        });
      } finally {
        state.sedangEkspor = false;
      }
    });

    document.getElementById('tombol-unduh-zip-semua').addEventListener('click', async function () {
      if (state.sedangEkspor || !window.UnduhLKPD) return;
      state.sedangEkspor = true;
      try {
        await window.UnduhLKPD.unduhZipMassal({
          lkpd: state.lkpd,
          daftarSiswa: state.daftarSiswa.slice(),
          token: state.token,
          onProgres: perbaruiProgresUnduh
        });
      } finally {
        state.sedangEkspor = false;
      }
    });
  }

  function perbaruiProgresUnduh(persen, teks) {
    const kotak = document.getElementById('kotak-progres-unduh');
    if (persen === null) {
      kotak.classList.add('tersembunyi');
      return;
    }
    kotak.classList.remove('tersembunyi');
    const p = Math.max(0, Math.min(100, Math.round(persen)));
    document.getElementById('teks-progres-unduh').textContent = teks || 'Memproses...';
    document.getElementById('persen-progres-unduh').textContent = p + '%';
    document.getElementById('isi-progres-unduh').style.width = p + '%';
  }

  document.addEventListener('DOMContentLoaded', mulai);

  return {
    ambilState: function () {
      return state;
    }
  };
})();