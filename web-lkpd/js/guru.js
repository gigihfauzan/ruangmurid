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
   * MODAL PEMERIKSAAN PEKERJAAN & PENILAIAN SISWA
   * ==========================================================================
   */
  async function bukaModalDetailSiswa(idSiswa) {
    const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
    const res = await window.ApiLKPD.kirim('lihatPekerjaan', {
      token: state.token,
      idSiswa: idSiswa,
      idLkpd: idLkpd
    });

    if (!res || !res.ok || !res.data) {
      window.Umum.tampilkanToast((res && res.pesan) || 'Gagal memuat pekerjaan siswa.', 'bahaya');
      return;
    }

    state.detailAktif = {
      siswa: res.data.siswa,
      pengerjaan: res.data.pengerjaan,
      jawaban: res.data.jawaban || [],
      berkas: res.data.berkas || [],
      nilai: res.data.nilai || { daftar: [], totalSkor: null },
      cacheGambar: {}
    };

    const s = state.detailAktif.siswa;
    const p = state.detailAktif.pengerjaan;
    document.getElementById('judul-modal-siswa').textContent =
      '📋 ' + s.nama + ' (Kelas ' + s.kelas + ')';
    document.getElementById('subjudul-modal-siswa').textContent =
      'Status: ' +
      String(p.status || 'belum').toUpperCase() +
      (p.waktuKumpul ? ' • Dikumpulkan: ' + window.Umum.formatWaktuIndonesia(p.waktuKumpul) : '');

    renderIsiDetailJawabanDanBerkas();
    isiNilaiTersimpanKeForm();

    document.getElementById('modal-detail-siswa').classList.remove('tersembunyi');
    window.Umum.renderMatematika(document.getElementById('wadah-isi-detail-siswa'));
  }

  function ambilSemuaSoalKonten() {
    if (!state.lkpd || !Array.isArray(state.lkpd.bagian)) return [];
    const daftar = [];
    state.lkpd.bagian.forEach(function (bag) {
      (bag.blok || []).forEach(function (b) {
        if (b.jenis === 'soal') daftar.push(b);
      });
    });
    return daftar;
  }

  function renderIsiDetailJawabanDanBerkas() {
    const wadah = document.getElementById('wadah-isi-detail-siswa');
    wadah.innerHTML = '';

    const detail = state.detailAktif;
    const mapJawaban = {};
    detail.jawaban.forEach(function (j) {
      mapJawaban[j.idSoal] = j;
    });

    const mapNilaiSoal = {};
    (detail.nilai.daftar || []).forEach(function (n) {
      mapNilaiSoal[n.idSoal] = n;
    });

    const daftarSoal = ambilSemuaSoalKonten();

    daftarSoal.forEach(function (soal) {
      const jwb = mapJawaban[soal.id] || { teks: '', dataJson: '' };
      const nilaiSoal = mapNilaiSoal[soal.id] || { skor: '', komentar: '' };
      const berkasSoal = detail.berkas.filter(function (b) {
        return b.idSoal === soal.id;
      });

      const item = document.createElement('div');
      item.className = 'item-jawaban-guru';

      const header = document.createElement('div');
      header.innerHTML =
        '<strong style="color:var(--warna-utama-gelap);font-family:var(--font-judul);">Soal ' +
        window.Umum.escapeHtml(soal.nomor) +
        ' (' +
        window.Umum.escapeHtml(soal.tipe) +
        ')</strong>' +
        '<div style="margin:6px 0 10px;font-weight:700;">' +
        window.Umum.formatTeksMateriAman(soal.teks || '') +
        '</div>';
      item.appendChild(header);

      // Tampilkan jawaban terstruktur jika ada (tabel / menjodohkan / urutan)
      const boxJawaban = document.createElement('div');
      boxJawaban.style.cssText =
        'background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:8px;';

      if (soal.tipe === 'tabel_isian' && jwb.dataJson) {
        try {
          const matriks = JSON.parse(jwb.dataJson);
          if (Array.isArray(matriks)) {
            const tbl = document.createElement('table');
            tbl.className = 'tabel-isian';
            tbl.style.minWidth = '360px';
            if (Array.isArray(soal.kolom)) {
              const thead = document.createElement('thead');
              const trH = document.createElement('tr');
              soal.kolom.forEach(function (k) {
                const th = document.createElement('th');
                th.textContent = k;
                trH.appendChild(th);
              });
              thead.appendChild(trH);
              tbl.appendChild(thead);
            }
            const tbody = document.createElement('tbody');
            matriks.forEach(function (row) {
              const tr = document.createElement('tr');
              (row || []).forEach(function (sel) {
                const td = document.createElement('td');
                td.textContent = sel || '-';
                tr.appendChild(td);
              });
              tbody.appendChild(tr);
            });
            tbl.appendChild(tbody);
            boxJawaban.appendChild(tbl);
          }
        } catch (err) {
          boxJawaban.textContent = jwb.teks || '(Kosong)';
        }
      } else {
        boxJawaban.innerHTML = jwb.teks
          ? window.Umum.formatTeksMateriAman(jwb.teks)
          : '<em style="color:#94a3b8;">Belum dijawab</em>';
      }

      item.appendChild(boxJawaban);

      // Tampilkan berkas foto atau gambar kanvas milik soal ini
      if (berkasSoal.length > 0) {
        const galeri = document.createElement('div');
        galeri.className = 'galeri-berkas';

        berkasSoal.forEach(function (brk) {
          const kartuB = document.createElement('div');
          kartuB.className = 'kartu-berkas-item';

          const img = document.createElement('img');
          img.className = 'pratinjau-berkas-img';
          img.alt = brk.namaFile || 'Berkas siswa';
          img.src =
            detail.cacheGambar[brk.idBerkas] ||
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="100%" height="100%" fill="%23e0f2fe"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%230369a1">Memuat...</text></svg>';

          if (!detail.cacheGambar[brk.idBerkas]) {
            muatGambarGuru(brk.idBerkas, img);
          }

          img.addEventListener('click', function () {
            if (detail.cacheGambar[brk.idBerkas]) {
              document.getElementById('img-pratinjau-penuh').src = detail.cacheGambar[brk.idBerkas];
              document.getElementById('modal-pratinjau-gambar').classList.remove('tersembunyi');
            }
          });

          const ket = document.createElement('div');
          ket.style.cssText = 'font-size:0.78rem;font-weight:700;color:#475569;';
          ket.textContent = (brk.jenis === 'gambar' ? '🎨 Kanvas: ' : '📸 Foto: ') + brk.namaFile;

          kartuB.appendChild(img);
          kartuB.appendChild(ket);
          galeri.appendChild(kartuB);
        });

        item.appendChild(galeri);
      }

      // Input skor & komentar per soal
      const gridNilai = document.createElement('div');
      gridNilai.className = 'grid-nilai-guru';

      const divSkor = document.createElement('div');
      divSkor.innerHTML =
        '<label class="label-form" style="font-size:0.84rem;">Skor Soal ' +
        soal.nomor +
        '</label>';
      const inpSkor = document.createElement('input');
      inpSkor.type = 'number';
      inpSkor.step = '0.5';
      inpSkor.className = 'input-teks input-skor-per-soal';
      inpSkor.dataset.idSoal = soal.id;
      inpSkor.value =
        nilaiSoal.skor !== null && nilaiSoal.skor !== undefined ? String(nilaiSoal.skor) : '';
      inpSkor.placeholder = 'Skor';
      divSkor.appendChild(inpSkor);

      const divKom = document.createElement('div');
      divKom.innerHTML =
        '<label class="label-form" style="font-size:0.84rem;">Komentar Guru (Soal ' +
        soal.nomor +
        ')</label>';
      const inpKom = document.createElement('input');
      inpKom.type = 'text';
      inpKom.className = 'input-teks input-komentar-per-soal';
      inpKom.dataset.idSoal = soal.id;
      inpKom.value = nilaiSoal.komentar || '';
      inpKom.placeholder = 'Komentar untuk jawaban nomor ' + soal.nomor + '...';
      divKom.appendChild(inpKom);

      gridNilai.appendChild(divSkor);
      gridNilai.appendChild(divKom);
      item.appendChild(gridNilai);

      wadah.appendChild(item);
    });
  }

  async function muatGambarGuru(idBerkas, elemenImg) {
    const res = await window.ApiLKPD.kirim('ambilBerkasGuru', {
      token: state.token,
      idBerkas: idBerkas
    });
    if (res && res.ok && res.data && res.data.base64Data) {
      if (state.detailAktif) {
        state.detailAktif.cacheGambar[idBerkas] = res.data.base64Data;
      }
      if (elemenImg) {
        elemenImg.src = res.data.base64Data;
      }
    }
  }

  function isiNilaiTersimpanKeForm() {
    const inpTotal = document.getElementById('input-skor-total-guru');
    const inpKomTotal = document.getElementById('input-komentar-total-guru');

    const nilai = (state.detailAktif && state.detailAktif.nilai) || { daftar: [], totalSkor: null };
    const itemTotal = (nilai.daftar || []).find(function (n) {
      return n.idSoal === '__TOTAL__';
    });

    inpTotal.value =
      nilai.totalSkor !== null && nilai.totalSkor !== undefined ? String(nilai.totalSkor) : '';
    inpKomTotal.value = itemTotal && itemTotal.komentar ? itemTotal.komentar : '';
  }

  function pasangEventModalDetail() {
    document.getElementById('tombol-tutup-modal-siswa').addEventListener('click', function () {
      document.getElementById('modal-detail-siswa').classList.add('tersembunyi');
      state.detailAktif = null;
    });

    document.getElementById('tombol-tutup-pratinjau').addEventListener('click', function () {
      document.getElementById('modal-pratinjau-gambar').classList.add('tersembunyi');
    });

    document.getElementById('tombol-simpan-nilai-guru').addEventListener('click', async function () {
      if (!state.detailAktif) return;

      const paketNilai = [];
      const skorInputs = document.querySelectorAll('.input-skor-per-soal');
      const komInputs = document.querySelectorAll('.input-komentar-per-soal');

      const mapKom = {};
      komInputs.forEach(function (el) {
        mapKom[el.dataset.idSoal] = el.value;
      });

      skorInputs.forEach(function (el) {
        const idSoal = el.dataset.idSoal;
        const skorVal = el.value.trim();
        const komVal = (mapKom[idSoal] || '').trim();
        if (skorVal !== '' || komVal !== '') {
          paketNilai.push({
            idSoal: idSoal,
            skor: skorVal !== '' ? Number(skorVal) : '',
            komentar: komVal
          });
        }
      });

      const skorTotalRaw = document.getElementById('input-skor-total-guru').value.trim();
      const komTotalRaw = document.getElementById('input-komentar-total-guru').value.trim();
      if (skorTotalRaw !== '' || komTotalRaw !== '') {
        paketNilai.push({
          idSoal: '__TOTAL__',
          skor: skorTotalRaw !== '' ? Number(skorTotalRaw) : '',
          komentar: komTotalRaw
        });
      }

      if (paketNilai.length === 0) {
        window.Umum.tampilkanToast('Isi skor atau komentar terlebih dahulu sebelum menyimpan.', 'peringatan');
        return;
      }

      const btnSimpan = document.getElementById('tombol-simpan-nilai-guru');
      btnSimpan.disabled = true;
      btnSimpan.textContent = '⏳ Menyimpan nilai...';

      try {
        const idLkpd = (state.lkpd && state.lkpd.meta && state.lkpd.meta.id) || '';
        const res = await window.ApiLKPD.kirim('beriNilai', {
          token: state.token,
          idSiswa: state.detailAktif.siswa.idSiswa,
          idLkpd: idLkpd,
          daftarNilai: paketNilai
        });

        if (!res || !res.ok) {
          window.Umum.tampilkanToast((res && res.pesan) || 'Gagal menyimpan nilai.', 'bahaya');
          return;
        }

        window.Umum.tampilkanToast('Nilai & komentar siswa berhasil disimpan!', 'sukses');
        await muatDaftarSiswaDariServer();
      } finally {
        btnSimpan.disabled = false;
        btnSimpan.textContent = '💾 Simpan Nilai & Komentar';
      }
    });

    document.getElementById('tombol-unduh-pdf-modal').addEventListener('click', async function () {
      if (!state.detailAktif || !window.UnduhLKPD) return;
      await window.UnduhLKPD.unduhPdfDetailGuru({
        lkpd: state.lkpd,
        detail: state.detailAktif,
        token: state.token
      });
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