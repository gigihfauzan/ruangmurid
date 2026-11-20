// admin.js — layar admin utama (Tahap 5).
(function () {
  App.bukaMenuAdmin = function (key) {
    if (key === 'dashboard') bukaDashboard();
    else if (key === 'identitas') bukaIdentitas();
    else if (key === 'tahun') bukaTahun();
    else if (key === 'kelas') bukaKelas();
    else if (key === 'form') bukaForm();
    else if (key === 'kriteria') bukaKriteria();
    else if (key === 'akun') bukaAkun();
    else if (key === 'naik') bukaNaik();
    else if (key === 'pengumuman') bukaPengumuman();
    else if (key === 'ekspor') bukaEkspor();
    else if (key === 'backup') bukaBackup();
    else if (key === 'lihat') bukaLihat();
    else if (key === 'log') bukaLog();
  };

  function field(kunci, label, val, type) { return '<label class="label">' + label + '</label><input id="set_' + kunci + '" class="input" type="' + (type || 'text') + '" value="' + App.escapeAttr(val || '') + '">'; }
  function ta(kunci, label, val) { return '<label class="label">' + label + '</label><textarea id="set_' + kunci + '" class="input" rows="3">' + App.escapeHtml(val || '') + '</textarea>'; }
  function select(kunci, label, val, opts) { var o = ''; opts.forEach(function (op) { o += '<option value="' + op.v + '"' + (op.v === val ? ' selected' : '') + '>' + App.escapeHtml(op.l) + '</option>'; }); return '<label class="label">' + label + '</label><select id="set_' + kunci + '" class="input">' + o + '</select>'; }
  function simpanPengaturan(kuncis, btnId) {
    var items = kuncis.map(function (k) { var n = App.el('set_' + k); return { kunci: k, nilai: n ? n.value : '' }; });
    if (btnId) App.setLoading(btnId, true);
    App.api('admin.pengaturanSet', { items: items }, App.state.token).then(function (res) { if (btnId) App.setLoading(btnId, false); if (res && res.ok) App.toast('Pengaturan tersimpan.', 'ok'); else App.toast((res && res.error) || 'Gagal.', 'err'); });
  }

  //Identitas
  function bukaIdentitas() {
    App.el('konten').innerHTML = '<h2>Identitas Sekolah</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.pengaturanGet', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var p = res.data.pengaturan, K = ['NAMA_SEKOLAH','NPSN','KOTA','PROVINSI','KEPALA_SEKOLAH_NAMA','KEPALA_SEKOLAH_NIP','NAMA_APLIKASI','LOGO_URL','URL_FRONTEND'];
      var html = '<h2><span class="titik titik-kuning"></span>Identitas Sekolah</h2>';
      html += field('NAMA_SEKOLAH', 'Nama Sekolah', p.NAMA_SEKOLAH);
      html += field('NPSN', 'NPSN', p.NPSN);
      html += field('KOTA', 'Kota/Kabupaten', p.KOTA);
      html += field('PROVINSI', 'Provinsi', p.PROVINSI);
      html += field('KEPALA_SEKOLAH_NAMA', 'Nama Kepala Sekolah', p.KEPALA_SEKOLAH_NAMA);
      html += field('KEPALA_SEKOLAH_NIP', 'NIP Kepala Sekolah', p.KEPALA_SEKOLAH_NIP);
      html += field('NAMA_APLIKASI', 'Nama Aplikasi', p.NAMA_APLIKASI);
      html += ta('TEKS_SAMBUTAN', 'Teks Sambutan', p.TEKS_SAMBUTAN);
      html += field('WARNA_TEMA', 'Warna Tema (hex, mis. #0EA5E9)', p.WARNA_TEMA);
      html += field('LOGO_URL', 'URL Logo (opsional)', p.LOGO_URL);
      html += field('URL_FRONTEND', 'URL Frontend (domain GitHub Pages)', p.URL_FRONTEND);
      html += '<button id="btnSimpanIdentitas" class="btn btn-block">Simpan Identitas</button>';
      App.el('konten').innerHTML = html;
      App.el('btnSimpanIdentitas').addEventListener('click', function () { simpanPengaturan(['NAMA_SEKOLAH','NPSN','KOTA','PROVINSI','KEPALA_SEKOLAH_NAMA','KEPALA_SEKOLAH_NIP','NAMA_APLIKASI','TEKS_SAMBUTAN','WARNA_TEMA','LOGO_URL','URL_FRONTEND'], 'btnSimpanIdentitas'); });
    });
  }
  //Kriteria & aturan
  function bukaKriteria() {
    App.el('konten').innerHTML = '<h2>Kriteria & Aturan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.pengaturanGet', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var p = res.data.pengaturan, html = '<h2><span class="titik titik-kuning"></span>Kriteria & Aturan</h2>';
      html += '<div class="habit-nama">Kriteria Bangun Pagi</div>';
      html += field('BANGUN_MIN', 'Jam Bangun Minimum (HH:MM)', p.BANGUN_MIN);
      html += field('BANGUN_MAX', 'Jam Bangun Maksimum (HH:MM)', p.BANGUN_MAX);
      html += select('CARA_BANGUN', 'Cara Penentuan', p.CARA_BANGUN, [{v:'manual',l:'Manual dengan petunjuk'},{v:'otomatis',l:'Otomatis dari jam'}]);
      html += '<div class="habit-nama">Tidur</div>';
      html += field('TIDUR_MIN_JAM', 'Durasi Tidur Ideal Minimum (jam)', p.TIDUR_MIN_JAM);
      html += field('TIDUR_MAX_JAM', 'Durasi Tidur Ideal Maksimum (jam)', p.TIDUR_MAX_JAM);
      html += '<div class="habit-nama">Ambang "Sudah Terbiasa"</div>';
      html += field('AMBANG_TERBIASA_NUMERATOR', 'Pembilang (contoh 2)', p.AMBANG_TERBIASA_NUMERATOR);
      html += field('AMBANG_TERBIASA_DENOMINATOR', 'Penyebut (contoh 3)', p.AMBANG_TERBIASA_DENOMINATOR);
      html += select('LABEL_BERTINGKAT', 'Label Bertingkat Tambahan', p.LABEL_BERTINGKAT, [{v:'0',l:'Nonaktif'},{v:'1',l:'Aktif'}]);
      html += '<div class="habit-nama">Aturan Pengisian</div>';
      html += field('BATAS_HARI_MUNDUR', 'Batas Hari Mundur (boleh isi N hari ke belakang)', p.BATAS_HARI_MUNDUR);
      html += select('HARI_DIHITUNG', 'Hari yang Dihitung', p.HARI_DIHITUNG, [{v:'semua',l:'Semua hari (termasuk akhir pekan)'},{v:'kerja',l:'Hari kerja saja'}]);
      html += select('WAJIB_DIKETAHUI_ORTU', 'Wajib "Diketahui Orang Tua"', p.WAJIB_DIKETAHUI_ORTU, [{v:'0',l:'Opsional'},{v:'1',l:'Wajib'}]);
      html += select('WAJIB_REFLEKSI', 'Wajib Refleksi Bulanan', p.WAJIB_REFLEKSI, [{v:'0',l:'Opsional'},{v:'1',l:'Wajib'}]);
      html += '<button id="btnSimpanKriteria" class="btn btn-block">Simpan Kriteria & Aturan</button>';
      App.el('konten').innerHTML = html;
      App.el('btnSimpanKriteria').addEventListener('click', function () { simpanPengaturan(['BANGUN_MIN','BANGUN_MAX','CARA_BANGUN','TIDUR_MIN_JAM','TIDUR_MAX_JAM','AMBANG_TERBIASA_NUMERATOR','AMBANG_TERBIASA_DENOMINATOR','LABEL_BERTINGKAT','BATAS_HARI_MUNDUR','HARI_DIHITUNG','WAJIB_DIKETAHUI_ORTU','WAJIB_REFLEKSI'], 'btnSimpanKriteria'); });
    });
  }
  //Tahun ajaran & libur
  function bukaTahun() {
    App.el('konten').innerHTML = '<h2>Tahun Ajaran & Libur</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.tahunList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Tahun Ajaran</h2>';
      html += '<div class="habit-row"><div class="habit-nama">Tambah Tahun Ajaran</div>';
      html += '<input id="thNama" class="input" placeholder="Nama (mis. 2025/2026)">';
      html += '<select id="thSem" class="input" style="margin-top:8px"><option>Ganjil</option><option>Genap</option></select>';
      html += '<input id="thMulai" class="input" style="margin-top:8px" type="date"><input id="thAkhir" class="input" style="margin-top:8px" type="date">';
      html += '<label class="cek" style="margin-top:8px"><input type="checkbox" id="thAktif" checked> Jadikan aktif</label>';
      html += '<button id="btnThTambah" class="btn btn-block">Tambah</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Daftar Tahun Ajaran</div>';
      res.data.tahun.forEach(function (t) {
        var badge = t.aktif ? '<span class="badge badge-ok">Aktif</span>' : (t.arsip ? '<span class="badge badge-belum">Arsip</span>' : '');
        html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(t.nama) + '</b> ' + App.escapeHtml(t.semester || '') + ' (' + (t.mulai || '?') + ' → ' + (t.akhir || '?') + ') ' + badge + '</div>';
        html += '<div class="siswa-aksi">';
        if (!t.aktif) html += '<button class="chip" data-act="aktif" data-id="' + t.id + '">Jadikan Aktif</button>';
        if (!t.arsip) html += '<button class="chip" data-act="arsip" data-id="' + t.id + '">Arsipkan &amp; Pindah Data</button>';
        html += '<button class="chip" data-act="libur" data-id="' + t.id + '">Libur</button></div></div>';
      });
      App.el('konten').innerHTML = html;
      App.el('btnThTambah').addEventListener('click', function () {
        App.api('admin.tahunTambah', { nama: App.el('thNama').value, semester: App.el('thSem').value, mulai: App.el('thMulai').value, akhir: App.el('thAkhir').value, aktif: App.el('thAktif').checked }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Tahun ditambahkan.', 'ok'); bukaTahun(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
      });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-aksi .chip'), function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
          if (act === 'aktif') App.api('admin.tahunSetAktif', { id: id }, App.state.token).then(function () { App.toast('Dijadikan aktif.', 'ok'); bukaTahun(); });
          else if (act === 'arsip') {
            if (!window.confirm('Arsipkan tahun ini? Data Jurnal & Refleksi tahun ini akan DIPINDAH ke spreadsheet arsip (terpisah) lalu dihapus dari database aktif agar aplikasi tetap cepat. Lanjutkan?')) return;
            App.api('admin.tahunArsipPenuh', { idTahun: id }, App.state.token).then(function (r) {
              if (r && r.ok) { App.toast('Diarsipkan: ' + r.data.jurnal + ' jurnal, ' + r.data.refleksi + ' refleksi.', 'ok'); window.prompt('URL spreadsheet arsip (salin & simpan):', r.data.url); bukaTahun(); }
              else App.toast((r && r.error) || 'Gagal.', 'err');
            });
          }
          else if (act === 'libur') bukaLibur(id);
        });
      });
    });
  }
  function bukaLibur(idTahun) {
    App.el('konten').innerHTML = '<h2>Libur</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.liburList', { idTahun: idTahun }, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Hari Libur</h2>';
      html += '<div class="habit-row"><div class="habit-nama">Tambah Libur</div>';
      html += '<input id="lbTgl" class="input" type="date">';
      html += '<input id="lbKet" class="input" style="margin-top:8px" placeholder="Keterangan (mis. Hari Raya)">';
      html += '<button id="btnLbTambah" class="btn btn-block">Tambah</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Daftar Libur</div>';
      if (!res.data.libur.length) html += '<p class="muted">Belum ada.</p>';
      res.data.libur.forEach(function (l) { html += '<div class="siswa-item"><div class="siswa-info">' + App.escapeHtml(l.tanggal) + ' — ' + App.escapeHtml(l.keterangan) + '</div><button class="chip" data-id="' + l.id + '">Hapus</button></div>'; });
      html += '<button id="btnKembaliTh" class="btn btn-kecil btn-ghost btn-block" style="margin-top:12px">Kembali</button>';
      App.el('konten').innerHTML = html;
      App.el('btnLbTambah').addEventListener('click', function () { App.api('admin.liburTambah', { idTahun: idTahun, tanggal: App.el('lbTgl').value, keterangan: App.el('lbKet').value }, App.state.token).then(function (r) { if (r && r.ok) bukaLibur(idTahun); else App.toast((r && r.error) || 'Gagal.', 'err'); }); });
      App.el('btnKembaliTh').addEventListener('click', function () { bukaTahun(); });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-item .chip'), function (btn) { btn.addEventListener('click', function () { App.api('admin.liburHapus', { id: btn.getAttribute('data-id') }, App.state.token).then(function () { bukaLibur(idTahun); }); }); });
    });
  }
  //Kelas & wali
  function bukaKelas() {
    App.el('konten').innerHTML = '<h2>Kelas & Wali Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    Promise.all([App.api('admin.kelasList', {}, App.state.token), App.api('admin.akunList', {}, App.state.token)]).then(function (rs) {
      var kr = rs[0], ar = rs[1];
      if (!kr.ok || !ar.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var waliAkun = ar.data.akun.filter(function (a) { return a.peran === 'wali' && !a.nonaktif; });
      var html = '<h2><span class="titik titik-kuning"></span>Kelas & Wali Kelas</h2>';
      html += '<div class="habit-row"><div class="habit-nama">Tambah Kelas</div><input id="klNama" class="input" placeholder="Nama kelas (mis. 7A)"><button id="btnKlTambah" class="btn btn-block" style="margin-top:8px">Tambah</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Daftar Kelas</div>';
      kr.data.kelas.forEach(function (k) {
        html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(k.nama) + '</b> · Wali: ' + App.escapeHtml(k.waliNama || '-') + (k.nonaktif ? ' <span class="badge badge-belum">Nonaktif</span>' : '') + '</div></div>';
        html += '<div class="habit-row" style="margin-top:6px"><label class="label kecil-label">Wali Kelas</label><select class="input" data-act="wali" data-id="' + k.id + '"><option value="">— pilih —</option>';
        waliAkun.forEach(function (a) { html += '<option value="' + a.id + '"' + (a.id === k.idWali ? ' selected' : '') + '>' + App.escapeHtml(a.nama) + '</option>'; });
        html += '</select>';
        html += '<label class="label kecil-label" style="margin-top:8px">Jadwal Buka Pengisian (HH:MM, opsional)</label><input class="input" data-act="buka" data-id="' + k.id + '" value="' + App.escapeAttr(k.jadwalBuka || '') + '" placeholder="mis. 06:00">';
        html += '<label class="label kecil-label" style="margin-top:8px">Jadwal Tutup Pengisian (HH:MM, opsional)</label><input class="input" data-act="tutup" data-id="' + k.id + '" value="' + App.escapeAttr(k.jadwalTutup || '') + '" placeholder="mis. 21:00">';
        html += '<button class="btn btn-kecil btn-ghost btn-block" style="margin-top:8px" data-act="simpanjadwal" data-id="' + k.id + '">Simpan Jadwal & Wali</button></div>';
      });
      App.el('konten').innerHTML = html;
      App.el('btnKlTambah').addEventListener('click', function () { App.api('admin.kelasTambah', { nama: App.el('klNama').value }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Kelas ditambah.', 'ok'); bukaKelas(); } else App.toast((r && r.error) || 'Gagal.', 'err'); }); });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('[data-act="simpanjadwal"]'), function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          var wali = App.el('konten').querySelector('[data-act="wali"][data-id="' + id + '"]').value;
          var buka = App.el('konten').querySelector('[data-act="buka"][data-id="' + id + '"]').value;
          var tutup = App.el('konten').querySelector('[data-act="tutup"][data-id="' + id + '"]').value;
          App.api('admin.kelasSetWali', { idKelas: id, idWali: wali }, App.state.token).then(function () {
            App.api('admin.kelasJadwal', { idKelas: id, jadwalBuka: buka, jadwalTutup: tutup }, App.state.token).then(function (r) { if (r && r.ok) App.toast('Tersimpan.', 'ok'); else App.toast('Gagal.', 'err'); });
          });
        });
      });
    });
  }
  //Form builder
  function bukaForm() {
    App.el('konten').innerHTML = '<h2>Form 7 Kebiasaan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.formGet', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var d = res.data, html = '<h2><span class="titik titik-kuning"></span>Form 7 Kebiasaan</h2>';
      html += '<p class="muted kecil">Versi aktif: <b>' + d.form.versi + '</b>. Setiap perubahan membuat versi baru; data lama tetap terbaca.</p>';
      html += '<div class="habit-nama">Kebiasaan</div>';
      d.habits.forEach(function (h) {
        html += '<div class="habit-row"><div class="habit-nama">' + App.escapeHtml(h.nama) + '</div>';
        html += '<label class="label kecil-label">Nama</label><input class="input" data-act="hnama" data-id="' + h.id + '" value="' + App.escapeAttr(h.nama) + '">';
        html += '<label class="label kecil-label" style="margin-top:6px">Urutan</label><input class="input" type="number" data-act="hurutan" data-id="' + h.id + '" value="' + h.urutan + '">';
        html += '<label class="cek" style="margin-top:6px"><input type="checkbox" data-act="haktif" data-id="' + h.id + '"' + (h.aktif ? ' checked' : '') + '> Aktif</label>';
        html += '<button class="btn btn-kecil btn-ghost btn-block" style="margin-top:6px" data-act="hsimpan" data-id="' + h.id + '">Simpan Kebiasaan</button></div>';
      });
      html += '<div class="habit-nama" style="margin-top:14px">Isian Form</div>';
      d.fields.forEach(function (f) {
        var hnama = ''; d.habits.forEach(function (h) { if (h.id === f.id_kebiasaan) hnama = h.nama; });
        html += '<div class="habit-row"><div class="habit-nama">' + App.escapeHtml(hnama) + ' — ' + App.escapeHtml(f.kode) + ' (' + f.tipe + ')</div>';
        html += '<label class="label kecil-label">Label</label><input class="input" data-act="flabel" data-id="' + f.id + '" value="' + App.escapeAttr(f.label) + '">';
        html += '<label class="cek" style="margin-top:6px"><input type="checkbox" data-act="fwajib" data-id="' + f.id + '"' + (f.wajib ? ' checked' : '') + '> Wajib</label>';
        html += '<label class="cek"><input type="checkbox" data-act="faktif" data-id="' + f.id + '"' + (f.aktif ? ' checked' : '') + '> Aktif</label>';
        html += '<button class="btn btn-kecil btn-ghost btn-block" style="margin-top:6px" data-act="fsimpan" data-id="' + f.id + '">Simpan Isian</button></div>';
      });
      html += '<div class="habit-nama" style="margin-top:14px">Tambah Isian</div>';
      html += '<div class="habit-row"><label class="label kecil-label">Kebiasaan</label><select id="ftHabit" class="input">';
      d.habits.forEach(function (h) { html += '<option value="' + h.id + '">' + App.escapeHtml(h.nama) + '</option>'; });
      html += '</select>';
      html += '<label class="label kecil-label" style="margin-top:6px">Kode field</label><input id="ftKode" class="input" placeholder="mis. catatan_belajar">';
      html += '<label class="label kecil-label" style="margin-top:6px">Tipe</label><select id="ftTipe" class="input"><option value="teks_singkat">Teks singkat</option><option value="teks_panjang">Teks panjang</option><option value="angka">Angka</option><option value="jam">Jam</option><option value="pilihan">Pilihan</option></select>';
      html += '<label class="label kecil-label" style="margin-top:6px">Label</label><input id="ftLabel" class="input" placeholder="Label isian">';
      html += '<label class="cek" style="margin-top:6px"><input type="checkbox" id="ftWajib"> Wajib</label>';
      html += '<label class="cek"><input type="checkbox" id="ftAktif" checked> Aktif</label>';
      html += '<button id="btnFtTambah" class="btn btn-block" style="margin-top:6px">Tambah Isian</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Riwayat Versi</div>';
      d.versions.forEach(function (v) { html += '<p class="muted kecil">' + App.escapeHtml(v.versi) + ' — ' + App.escapeHtml(v.dibuat) + (v.aktif ? ' <span class="badge badge-ok">Aktif</span>' : '') + '</p>'; });
      App.el('konten').innerHTML = html;
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('[data-act="hsimpan"]'), function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          var nama = App.el('konten').querySelector('[data-act="hnama"][data-id="' + id + '"]').value;
          var urutan = App.el('konten').querySelector('[data-act="hurutan"][data-id="' + id + '"]').value;
          var aktif = App.el('konten').querySelector('[data-act="haktif"][data-id="' + id + '"]').checked;
          App.api('admin.habitSet', { id: id, nama: nama, urutan: urutan, aktif: aktif }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Kebiasaan disimpan. Versi baru dibuat.', 'ok'); bukaForm(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
        });
      });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('[data-act="fsimpan"]'), function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          var label = App.el('konten').querySelector('[data-act="flabel"][data-id="' + id + '"]').value;
          var wajib = App.el('konten').querySelector('[data-act="fwajib"][data-id="' + id + '"]').checked;
          var aktif = App.el('konten').querySelector('[data-act="faktif"][data-id="' + id + '"]').checked;
          App.api('admin.fieldSet', { id: id, label: label, wajib: wajib, aktif: aktif }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Isian disimpan. Versi baru.', 'ok'); bukaForm(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
        });
      });
      App.el('btnFtTambah').addEventListener('click', function () {
        App.api('admin.fieldTambah', { idKebiasaan: App.el('ftHabit').value, kode: App.el('ftKode').value, tipe: App.el('ftTipe').value, label: App.el('ftLabel').value, wajib: App.el('ftWajib').checked, aktif: App.el('ftAktif').checked }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Isian ditambah. Versi baru.', 'ok'); bukaForm(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
      });
    });
  }
  //Akun staff
  function bukaAkun() {
    App.el('konten').innerHTML = '<h2>Akun & Keamanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    Promise.all([App.api('admin.akunList', {}, App.state.token), App.api('admin.kelasList', {}, App.state.token)]).then(function (rs) {
      var ar = rs[0], kr = rs[1];
      if (!ar.ok || !kr.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var akunList = ar.data.akun, kelas = kr.data.kelas, html = '<h2><span class="titik titik-kuning"></span>Akun Staff</h2>';
      html += '<div class="habit-row"><div class="habit-nama">Tambah Akun</div>';
      html += '<select id="akPeran" class="input"><option value="wali">Wali Kelas</option><option value="pembaca">Pembaca</option><option value="admin">Admin Utama</option></select>';
      html += '<input id="akNama" class="input" style="margin-top:8px" placeholder="Nama lengkap">';
      html += '<input id="akUsername" class="input" style="margin-top:8px" placeholder="Username">';
      html += '<input id="akNip" class="input" style="margin-top:8px" placeholder="NIP (opsional)">';
      html += '<select id="akKelas" class="input" style="margin-top:8px"><option value="">Kelas (untuk wali)</option>';
      kelas.forEach(function (k) { html += '<option value="' + k.id + '">' + App.escapeHtml(k.nama) + '</option>'; });
      html += '</select><button id="btnAkTambah" class="btn btn-block" style="margin-top:8px">Tambah</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Daftar Akun</div>';
      akunList.forEach(function (a) {
        html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(a.nama) + '</b> (' + App.escapeHtml(a.username) + ') · ' + App.labelPeran(a.peran) + (a.nip ? ' · NIP ' + App.escapeHtml(a.nip) : '') + (a.nonaktif ? ' <span class="badge badge-belum">Nonaktif</span>' : '') + '</div>';
        html += '<div class="siswa-aksi"><button class="chip" data-act="edit" data-id="' + a.id + '">Edit</button><button class="chip" data-act="reset" data-id="' + a.id + '">Reset PIN</button><button class="chip" data-act="nonaktif" data-id="' + a.id + '">' + (a.nonaktif ? 'Aktifkan' : 'Nonaktifkan') + '</button></div></div>';
      });
      App.el('konten').innerHTML = html;
      App.el('btnAkTambah').addEventListener('click', function () {
        App.api('admin.akunTambah', { peran: App.el('akPeran').value, nama: App.el('akNama').value, username: App.el('akUsername').value, nip: App.el('akNip').value, idKelas: App.el('akKelas').value }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Akun ditambah. PIN awal: ' + r.data.pin, 'ok'); bukaAkun(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
      });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-aksi .chip'), function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
          if (act === 'edit') {
            var a = null; for (var i = 0; i < akunList.length; i++) if (akunList[i].id === id) { a = akunList[i]; break; }
            if (!a) return;
            App.modalForm('Edit Akun', [
              { kunci: 'nama', label: 'Nama', val: a.nama },
              { kunci: 'username', label: 'Username', val: a.username },
              { kunci: 'nip', label: 'NIP', val: a.nip || '' }
            ], function (v) {
              App.api('admin.akunEdit', { idAkun: id, nama: v.nama, username: v.username, nip: v.nip }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Diperbarui.', 'ok'); bukaAkun(); } else App.toast((r && r.error) || 'Gagal.', 'err'); });
            });
          } else if (act === 'reset') { if (window.confirm('Reset PIN ke awal?')) App.api('admin.akunResetPin', { idAkun: id }, App.state.token).then(function (r) { if (r && r.ok) App.toast('PIN direset ke: ' + r.data.pin, 'ok'); else App.toast('Gagal.', 'err'); }); }
          else if (act === 'nonaktif') App.api('admin.akunNonaktif', { idAkun: id, aktif: false }, App.state.token).then(function () { App.toast('Diperbarui.', 'ok'); bukaAkun(); });
        });
      });
    });
  }
  //Naik kelas
    function bukaNaik() {
    App.el('konten').innerHTML = '<h2>Naik Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.naikPreview', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var g = res.data.grouped, html = '<h2><span class="titik titik-kuning"></span>Naik Kelas</h2>';
      html += '<p class="muted kecil">Pilih salah satu cara sesuai kondisi sekolah. <b>Sebaiknya lakukan backup dulu (Tahap 7).</b></p>';
      function tampil(kelompok, judul) { if (!kelompok.length) return; html += '<div class="habit-nama" style="margin-top:10px">' + judul + '</div>'; kelompok.forEach(function (k) { html += '<p class="muted kecil">' + App.escapeHtml(k.nama) + ' — ' + k.jumlahSiswa + ' siswa</p>'; }); }
      tampil(g['7'], 'Kelas 7'); tampil(g['8'], 'Kelas 8'); tampil(g['9'], 'Kelas 9');
      html += '<div class="habit-row" style="margin-top:14px"><div class="habit-nama">1. Luluskan Kelas 9</div>';
      html += '<p class="muted kecil">Tandai semua siswa kelas 9 sebagai lulus (nonaktif) dan arsipkan kelas 9. Jalankan ini <b>sebelum</b> Atur Ulang bila ada siswa kelas 9.</p>';
      html += '<button id="btnLulus9" class="btn btn-block btn-ghost">Luluskan Kelas 9</button><p id="lulus9Hasil" class="muted kecil"></p></div>';
      html += '<div class="habit-row"><div class="habit-nama">2. Naikkan Jenjang Otomatis (7A→8A, 8A→9A)</div>';
      html += '<p class="muted kecil">Untuk sekolah yang <b>tidak mengacak</b> kelas. Siswa 7→8 dan 8→9 dengan nama kelas sama; kelas 9 diluluskan.</p>';
      html += '<button id="btnNaikOtomatis" class="btn btn-block btn-ghost">Jalankan Naik Otomatis</button><p id="naikHasil" class="muted kecil"></p></div>';
      html += '<div class="habit-row"><div class="habit-nama">3. Atur Ulang Kelas via Impor (untuk sekolah yang mengacak)</div>';
      html += '<p class="muted kecil">Tempel pemetaan <b>NISN, Kelas Baru</b> per baris (koma/tab). Kelas baru dibuat otomatis. Cocok untuk pengacakan kelas.</p>';
      html += '<textarea id="aturTxt" class="input" rows="5" placeholder="1234567890,8B&#10;1234567891,8A&#10;..."></textarea>';
      html += '<button id="btnAtur" class="btn btn-block">Pindahkan Sesuai Pemetaan</button><p id="aturHasil" class="muted kecil"></p></div>';
      App.el('konten').innerHTML = html;
      App.el('btnLulus9').addEventListener('click', function () {
        if (!window.confirm('Luluskan semua siswa kelas 9?')) return;
        App.setLoading('btnLulus9', true);
        App.api('admin.naikLuluskan9', {}, App.state.token).then(function (r) { App.setLoading('btnLulus9', false); if (r && r.ok) { App.el('lulus9Hasil').textContent = 'Selesai. ' + r.data.lulus + ' siswa diluluskan, ' + r.data.kelas + ' kelas diarsipkan.'; App.toast('Selesai.', 'ok'); } else App.el('lulus9Hasil').textContent = (r && r.error) || 'Gagal.'; });
      });
      App.el('btnNaikOtomatis').addEventListener('click', function () {
        if (!window.confirm('Jalankan naik otomatis (7A→8A, dst)?')) return;
        App.setLoading('btnNaikOtomatis', true);
        App.api('admin.naikJalankan', {}, App.state.token).then(function (r) { App.setLoading('btnNaikOtomatis', false); if (r && r.ok) { var s = r.data.ringkasan; App.el('naikHasil').textContent = 'Selesai. 7→8: ' + s.naik7 + ', 8→9: ' + s.naik8 + ', lulus: ' + s.lulus9 + (s.kelasBaru.length ? '. Kelas baru: ' + s.kelasBaru.join(', ') : ''); App.toast('Selesai.', 'ok'); } else App.el('naikHasil').textContent = (r && r.error) || 'Gagal.'; });
      });
      App.el('btnAtur').addEventListener('click', function () {
        var txt = App.el('aturTxt').value.trim(), hasil = App.el('aturHasil');
        if (!txt) { hasil.textContent = 'Tempel pemetaan dulu.'; return; }
        var lines = txt.split(/\r?\n/), pemetaan = [];
        lines.forEach(function (line) { line = line.trim(); if (!line) return; var parts = line.split(/[,\t]/).map(function (p) { return p.trim(); }); if (parts.length >= 2) pemetaan.push({ nisn: parts[0], kelas: parts.slice(1).join(' ').trim() }); });
        if (!pemetaan.length) { hasil.textContent = 'Format tidak terbaca.'; return; }
        App.setLoading('btnAtur', true);
        App.api('admin.aturUlangKelas', { pemetaan: pemetaan }, App.state.token).then(function (r) { App.setLoading('btnAtur', false); if (r && r.ok) { var d = r.data; hasil.textContent = 'Berhasil: ' + d.sukses + '. Gagal: ' + d.errors.length + (d.errors.length ? ' — ' + d.errors.join('; ') : ''); if (d.sukses > 0) App.toast(d.sukses + ' siswa dipindah.', 'ok'); } else hasil.textContent = (r && r.error) || 'Gagal.'; });
      });
    });
  }
  //Pengumuman
  function bukaPengumuman() {
    App.el('konten').innerHTML = '<h2>Pengumuman</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.pengumumanList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Pengumuman</h2>';
      html += '<div class="habit-row"><div class="habit-nama">Tambah Pengumuman</div>';
      html += '<input id="pgJudul" class="input" placeholder="Judul">';
      html += '<textarea id="pgIsi" class="input" style="margin-top:8px" rows="3" placeholder="Isi pengumuman"></textarea>';
      html += '<label class="label kecil-label" style="margin-top:6px">Tampil sampai (opsional)</label><input id="pgSampai" class="input" type="date">';
      html += '<button id="btnPgTambah" class="btn btn-block" style="margin-top:8px">Tambah</button></div>';
      html += '<div class="habit-nama" style="margin-top:14px">Daftar Pengumuman</div>';
      if (!res.data.pengumuman.length) html += '<p class="muted">Belum ada.</p>';
      res.data.pengumuman.forEach(function (p) {
        html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(p.judul) + '</b> ' + (p.nonaktif ? '<span class="badge badge-belum">Nonaktif</span>' : '<span class="badge badge-ok">Aktif</span>') + '<br><span class="muted kecil">' + App.escapeHtml(p.isi) + (p.tampilSampai ? ' · sampai ' + p.tampilSampai : '') + '</span></div>';
        html += '<button class="chip" data-id="' + p.id + '" data-aktif="' + (p.nonaktif ? '1' : '0') + '">' + (p.nonaktif ? 'Aktifkan' : 'Nonaktifkan') + '</button></div>';
      });
      App.el('konten').innerHTML = html;
      App.el('btnPgTambah').addEventListener('click', function () { App.api('admin.pengumumanTambah', { judul: App.el('pgJudul').value, isi: App.el('pgIsi').value, tampilSampai: App.el('pgSampai').value }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Ditambah.', 'ok'); bukaPengumuman(); } else App.toast((r && r.error) || 'Gagal.', 'err'); }); });
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-item .chip'), function (btn) { btn.addEventListener('click', function () { App.api('admin.pengumumanNonaktif', { id: btn.getAttribute('data-id'), aktif: btn.getAttribute('data-aktif') === '1' }, App.state.token).then(function () { bukaPengumuman(); }); }); });
    });
  }
  //Lihat sebagai wali
  function bukaLihat() {
    App.el('konten').innerHTML = '<h2>Lihat sebagai Wali Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.kelasList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Lihat sebagai Wali Kelas</h2>';
      html += '<p class="muted kecil">Buka tampilan wali kelas untuk kelas tertentu. Tombol <b>Kembali ke Admin</b> tersedia di kartu Akun Saya.</p>';
      res.data.kelas.forEach(function (k) {
        if (k.nonaktif) return;
        html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(k.nama) + '</b> · Wali: ' + App.escapeHtml(k.waliNama || '-') + '</div><button class="chip" data-id="' + k.id + '" data-nama="' + App.escapeAttr(k.nama) + '">Buka</button></div>';
      });
      App.el('konten').innerHTML = html;
      Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-item .chip'), function (btn) {
        btn.addEventListener('click', function () {
          var idKelas = btn.getAttribute('data-id'), namaKelas = btn.getAttribute('data-nama');
          App.api('admin.lihatSebagai', { idKelas: idKelas }, App.state.token).then(function (r) {
            if (r && r.ok) {
              App.state.tokenAdmin = App.state.token;
              App.state.token = r.data.token; App.state.peran = 'wali'; App.state.id_kelas = r.data.idKelas; App.state.lihatSebagai = true; App.state.namaKelasLihat = namaKelas;
              App.masukApp(); App.toast('Melihat sebagai wali kelas ' + namaKelas, 'ok');
            } else App.toast((r && r.error) || 'Gagal.', 'err');
          });
        });
      });
    });
  }
  //Log
  function bukaLog() {
    App.el('konten').innerHTML = '<h2>Log Aktivitas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.logList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Log Aktivitas (60 terbaru)</h2>';
      if (!res.data.log.length) html += '<p class="muted">Belum ada.</p>';
      res.data.log.forEach(function (l) { html += '<div class="log-item"><span class="muted kecil">' + App.escapeHtml(l.waktu) + '</span> · <b>' + App.escapeHtml(l.aksi) + '</b> <span class="muted kecil">(' + App.escapeHtml(l.detail || '') + ')</span></div>'; });
      App.el('konten').innerHTML = html;
    });
  }

  function bukaDashboard() {
    App.el('konten').innerHTML = '<h2>Dashboard Sekolah</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.dashboard', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.renderDashboard(res.data); });
  }
  function bukaEkspor() {
    App.el('konten').innerHTML = '<h2>Ekspor xlsx</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.kelasList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var bulan = App.monthKey(App.state.hariIni);
      var html = '<h2><span class="titik titik-kuning"></span>Ekspor xlsx (Rekap Bulanan)</h2>';
      html += '<p class="muted kecil">Format Lampiran 3: identitas, tabel 7 kebiasaan + catatan, tanda tangan kepala sekolah & wali kelas. Ditambah lembar kategori & data harian.</p>';
      html += '<label class="label">Bulan</label><input id="ekBulan" class="input" type="month" value="' + bulan + '">';
      html += '<label class="label">Kelas</label><select id="ekKelas" class="input"><option value="">Semua Kelas (satu sheet per kelas + ringkasan sekolah)</option>';
      res.data.kelas.forEach(function (k) { if (!k.nonaktif) html += '<option value="' + k.id + '">' + App.escapeHtml(k.nama) + '</option>'; });
      html += '</select><button id="btnEkspor" class="btn btn-block">Unduh xlsx</button><p id="ekHasil" class="muted kecil"></p>';
      App.el('konten').innerHTML = html;
      App.el('btnEkspor').addEventListener('click', function () {
        var bln = App.el('ekBulan').value || bulan, idKelas = App.el('ekKelas').value;
        var action = idKelas ? 'admin.eksporKelas' : 'admin.eksporSemua';
        var payload = idKelas ? { idKelas: idKelas, bulan: bln } : { bulan: bln };
        App.setLoading('btnEkspor', true); App.el('ekHasil').textContent = 'Menyusun xlsx…';
        App.api(action, payload, App.state.token).then(function (r) {
          App.setLoading('btnEkspor', false);
          if (r && r.ok) { App.unduhFile(r.data.file, r.data.nama); App.el('ekHasil').textContent = 'Terunduh: ' + r.data.nama; }
          else App.el('ekHasil').textContent = (r && r.error) || 'Gagal.';
        });
      });
    });
  }

  function bukaBackup() {
    App.el('konten').innerHTML = '<h2>Backup</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('admin.backupInfo', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var d = res.data, html = '<h2><span class="titik titik-kuning"></span>Backup Data</h2>';
      html += '<p class="muted kecil">Backup menyalin spreadsheet database ke folder Google Drive Anda. Backup harian otomatis berjalan pukul ~02:00 WIB bila diaktifkan.</p>';
      html += '<div class="habit-row"><div class="habit-nama">Pengaturan</div>';
      html += '<label class="label">ID Folder Google Drive</label><input id="bkFolder" class="input" value="' + App.escapeAttr(d.folderId || '') + '" placeholder="tempel ID folder">';
      html += '<p class="muted kecil">Cara dapat ID: buka folder di Drive, salin bagian URL setelah <code>/folders/</code>.</p>';
      html += '<label class="label" style="margin-top:8px">Retensi (hari, backup lama dibuang)</label><input id="bkRetensi" class="input" type="number" value="' + (d.retensiHari || 30) + '">';
      html += '<button id="btnBkSimpan" class="btn btn-block">Simpan Pengaturan</button></div>';
      html += '<div class="habit-row"><div class="habit-nama">Status</div>';
      html += '<p class="muted kecil">Folder: ' + (d.folderAda ? App.escapeHtml(d.namaFolder) : '<b>belum diset / tidak ditemukan</b>') + '</p>';
      html += '<p class="muted kecil">Backup terakhir: ' + (d.lastBackup || 'belum ada') + '</p>';
      html += '<p class="muted kecil">Backup harian otomatis: ' + (d.triggerAktif ? '<span class="badge badge-ok">Aktif</span>' : '<span class="badge badge-belum">Nonaktif</span>') + '</p>';
      html += '<button id="btnBkSekarang" class="btn btn-block btn-ghost" style="margin-top:8px">Backup Sekarang</button>';
      html += '<button id="btnBkAktifkan" class="btn btn-block">' + (d.triggerAktif ? 'Matikan Backup Harian' : 'Aktifkan Backup Harian') + '</button>';
      html += '<p id="bkHasil" class="muted kecil"></p></div>';
      App.el('konten').innerHTML = html;
      App.el('btnBkSimpan').addEventListener('click', function () { App.api('admin.backupAtur', { folderId: App.el('bkFolder').value, retensiHari: App.el('bkRetensi').value }, App.state.token).then(function (r) { if (r && r.ok) { App.toast('Tersimpan.', 'ok'); bukaBackup(); } else App.toast((r && r.error) || 'Gagal.', 'err'); }); });
      //App.el('btnBkSekarang').addEventListener('click', function () { App.setLoading('btnBkSekarang', true); App.api('admin.backupSekarang', {}, App.state.token).then(function (r) { App.setLoading('btnBkSekarang', false); if (r && r.ok) { App.toast('Backup dibuat.', 'ok'); bukaBackup(); } else App.toast((r && r.error) || 'Gagal.', 'err'); }); });
      App.el('btnBkSekarang').addEventListener('click', function () {
        App.setLoading('btnBkSekarang', true);
        App.api('admin.backupSekarang', {}, App.state.token).then(function (r) {
          App.setLoading('btnBkSekarang', false);
          if (r && r.ok) { App.toast('Backup dibuat: ' + r.data.namaFile, 'ok'); bukaBackup(); }
          else App.toast((r && r.error) || 'Gagal.', 'err');
        });
      });
      App.el('btnBkAktifkan').addEventListener('click', function () { var aktif = !d.triggerAktif; App.api('admin.backupAtur', { aktifkan: aktif }, App.state.token).then(function (r) { if (r && r.ok) { App.toast(aktif ? 'Backup harian diaktifkan.' : 'Backup harian dimatikan.', 'ok'); bukaBackup(); } else App.toast('Gagal.', 'err'); }); });
    });
  }  
})();
