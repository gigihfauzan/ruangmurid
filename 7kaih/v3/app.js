// app.js — inti: state, API, otentikasi, shell, modal, unduh, dashboard.
var App = window.App = {};
App.state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false, hariIni: '', lihatSebagai: false, tokenAdmin: null, namaKelasLihat: '' };

App.api = function (action, payload, token) {
  if (!APPSCRIPT_URL || APPSCRIPT_URL.indexOf('PASTE_URL') === 0) return Promise.resolve({ ok: false, error: 'APPSCRIPT_URL belum diisi di config.js.' });
  var body = JSON.stringify({ action: action, token: token || null, payload: payload || {} });
  var delays = [1000, 2000, 4000, 8000], attempt = 0;
  function run() {
    return fetch(APPSCRIPT_URL, { method: 'POST', body: body })
      .then(function (res) { if (!res.ok) throw new Error('Koneksi gagal (' + res.status + ')'); return res.json(); })
      .catch(function (err) { if (attempt >= delays.length) return { ok: false, error: err.message || 'Gagal terhubung.' }; return new Promise(function (r) { setTimeout(r, delays[attempt++]); }).then(run); });
  }
  return run();
};
App.getToken = function () { try { return localStorage.getItem('7kaih_token'); } catch (e) { return null; } };
App.saveToken = function (t) { try { if (t) localStorage.setItem('7kaih_token', t); else localStorage.removeItem('7kaih_token'); } catch (e) {} };
App.el = function (id) { return document.getElementById(id); };
App.showLayar = function (id) { Array.prototype.forEach.call(document.querySelectorAll('.layar'), function (l) { l.classList.remove('layar-aktif'); }); var t = App.el(id); if (t) t.classList.add('layar-aktif'); };
App.setErr = function (id, msg) { var e = App.el(id); if (e) e.textContent = msg || ''; };
App.toast = function (msg, tipe) { var t = App.el('toast'); t.textContent = msg; t.className = 'toast show ' + (tipe === 'ok' ? 'toast-ok' : tipe === 'err' ? 'toast-err' : ''); clearTimeout(t._timer); t._timer = setTimeout(function () { t.className = 'toast'; }, 3500); };
App.setLoading = function (btnId, loading) { var b = App.el(btnId); if (!b) return; if (loading) { b.disabled = true; b.dataset.teks = b.textContent; b.innerHTML = '<span class="spinner spinner-putih"></span> Memproses…'; } else { b.disabled = false; if (b.dataset.teks) b.textContent = b.dataset.teks; } };
App.escapeHtml = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
App.escapeAttr = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
App.labelPeran = function (p) { return { admin: 'Admin Utama', wali: 'Wali Kelas', siswa: 'Siswa', pembaca: 'Pembaca (Kepsek/BK)' }[p] || p; };
App.addDaysYmd = function (ymd, n) { var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
App.formatTglPendek = function (ymd) { var nh = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']; var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); return nh[d.getDay()] + ', ' + Number(p[2]); };
App.formatBulan = function (bulan) { var nb = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']; var p = bulan.split('-'); return nb[Number(p[1]) - 1] + ' ' + p[0]; };
App.geserBulan = function (bulan, delta) { var p = bulan.split('-'); var y = Number(p[0]); var m = Number(p[1]) + delta; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + ('0' + m).slice(-2); };
App.monthKey = function (ymd) { return String(ymd || '').substring(0, 7); };

//--- Modal form ---
App.modalForm = function (judul, fields, onSimpan) {
  var overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  var html = '<div class="modal-box"><div class="modal-judul">' + App.escapeHtml(judul) + '</div><div class="modal-isi">';
  fields.forEach(function (f) {
    if (f.type === 'textarea') html += '<label class="label kecil-label">' + App.escapeHtml(f.label) + '</label><textarea id="mf_' + f.kunci + '" class="input" rows="3">' + App.escapeHtml(f.val || '') + '</textarea>';
    else if (f.type === 'select') { html += '<label class="label kecil-label">' + App.escapeHtml(f.label) + '</label><select id="mf_' + f.kunci + '" class="input">'; f.opts.forEach(function (o) { html += '<option value="' + App.escapeAttr(o.v) + '"' + (o.v === f.val ? ' selected' : '') + '>' + App.escapeHtml(o.l) + '</option>'; }); html += '</select>'; }
    else html += '<label class="label kecil-label">' + App.escapeHtml(f.label) + '</label><input id="mf_' + f.kunci + '" class="input" type="' + (f.type || 'text') + '" value="' + App.escapeAttr(f.val || '') + '">';
  });
  html += '</div><div class="modal-aksi"><button id="mfBatal" class="btn btn-kecil btn-ghost">Batal</button><button id="mfSimpan" class="btn btn-kecil">Simpan</button></div></div>';
  overlay.innerHTML = html; document.body.appendChild(overlay);
  App.el('mfBatal').addEventListener('click', function () { document.body.removeChild(overlay); });
  App.el('mfSimpan').addEventListener('click', function () {
    var values = {}; fields.forEach(function (f) { var n = App.el('mf_' + f.kunci); values[f.kunci] = n ? n.value : ''; });
    var tutup = onSimpan(values);
    if (tutup !== false) document.body.removeChild(overlay);
  });
};

//--- Unduh file base64 ---
App.unduhFile = function (b64, nama) {
  try {
    var chars = atob(b64), bytes = new Uint8Array(chars.length);
    for (var i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
    var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = nama;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  } catch (e) { App.toast('Gagal mengunduh: ' + e.message, 'err'); }
};

//--- Dashboard renderer (shared admin & pembaca) ---
App.renderDashboard = function (d) {
  var html = '<h2><span class="titik titik-hijau"></span>Dashboard Sekolah</h2>';
  html += '<p class="muted kecil">Tanggal: ' + d.tanggal + ' · Bulan: ' + App.formatBulan(d.bulan) + '</p>';
  html += '<div class="card-mini"><b>Total Siswa:</b> ' + d.totalSiswa + ' · <b>Isi Hari Ini:</b> ' + d.totalIsiHariIni + ' (' + d.persenIsiSekolah + '%)</div>';
  html += '<div class="habit-nama" style="margin-top:14px">Rata-rata per Kebiasaan (sekolah, hari dilakukan bulan ini)</div>';
  d.perHabitSekolah.forEach(function (h) {
    var persen = d.totalHari ? Math.round(h.rata / d.totalHari * 100) : 0;
    html += '<div class="ring-item"><div class="ring-nama">' + App.escapeHtml(h.nama) + '</div><div class="ring-bar"><div class="ring-fill" style="width:' + persen + '%"></div></div><div class="ring-meta">rata-rata ' + h.rata + ' / ' + d.totalHari + ' hari (' + persen + '%)</div></div>';
  });
  html += '<div class="habit-nama" style="margin-top:14px">Per Kelas</div>';
  html += '<div class="kal-scroll"><table class="kal"><thead><tr><th>Kelas</th><th>Siswa</th><th>Isi Hari Ini</th><th>% Isi</th>';
  d.habits.forEach(function (h) { html += '<th class="th-habit">' + App.escapeHtml(h.nama) + '</th>'; });
  html += '</tr></thead><tbody>';
  d.perKelas.forEach(function (k) {
    html += '<tr><td class="kal-nama">' + App.escapeHtml(k.nama) + '</td><td>' + k.jumlahSiswa + '</td><td>' + k.isiHariIni + '</td><td>' + k.persenIsi + '%</td>';
    k.perHabitAvg.forEach(function (h) { html += '<td class="kal-cell">' + h.rata + '</td>'; });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  App.el('konten').innerHTML = html;
};

App.MENU = {
  siswa: [
    { key: 'isi', label: 'Isi Hari Ini' }, { key: 'kalender', label: 'Kalender Bulanan' },
    { key: 'ringkasan', label: 'Ringkasan Bulan' }, { key: 'refleksi', label: 'Refleksi Bulanan' },
    { key: 'definisi', label: 'Definisi 7 Kebiasaan' }, { key: 'bantuan', label: 'Panduan' }
  ],
  wali: [
    { key: 'siswa', label: 'Kelola Siswa' }, { key: 'pantau', label: 'Pemantauan Hari Ini' },
    { key: 'validasi', label: 'Validasi (Paraf)' }, { key: 'rekap', label: 'Rekap Bulanan' },
    { key: 'refsiswa', label: 'Refleksi Siswa' }, { key: 'bantuan', label: 'Panduan' }
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard' }, { key: 'identitas', label: 'Identitas Sekolah' },
    { key: 'tahun', label: 'Tahun Ajaran & Libur' }, { key: 'kelas', label: 'Kelas & Wali' },
    { key: 'form', label: 'Form 7 Kebiasaan' }, { key: 'kriteria', label: 'Kriteria & Aturan' },
    { key: 'akun', label: 'Akun & Keamanan' }, { key: 'naik', label: 'Naik Kelas' },
    { key: 'pengumuman', label: 'Pengumuman' }, { key: 'ekspor', label: 'Ekspor xlsx' },
    { key: 'backup', label: 'Backup' }, { key: 'lihat', label: 'Lihat sebagai Wali' },
    { key: 'log', label: 'Log Aktivitas' }, { key: 'bantuan', label: 'Panduan' }
  ],
  pembaca: [
    { key: 'dashboard', label: 'Dashboard' }, { key: 'rekap', label: 'Rekap Kelas' }, { key: 'bantuan', label: 'Panduan' }
  ]
};

App.login = function () {
  var s = App.state, identifier = App.el('loginId').value.trim(), pin = App.el('loginPin').value;
  App.setErr('loginErr', '');
  if (!identifier) { App.setErr('loginErr', 'Isi NISN atau username.'); return; }
  if (!/^\d{4,8}$/.test(pin)) { App.setErr('loginErr', 'PIN 4-8 digit angka.'); return; }
  App.setLoading('btnLogin', true);
  App.api('auth.login', { identifier: identifier, pin: pin }).then(function (res) {
    App.setLoading('btnLogin', false);
    if (!res || !res.ok) { App.setErr('loginErr', (res && res.error) || 'Gagal masuk.'); return; }
    var d = res.data;
    s.token = d.token; s.peran = d.peran; s.nama = d.nama; s.id_kelas = d.id_kelas || ''; s.harusGantiPin = d.harusGantiPin; s.lihatSebagai = false; s.tokenAdmin = null; s.namaKelasLihat = '';
    App.saveToken(d.token); App.el('loginPin').value = '';
    if (d.harusGantiPin) { App.showLayar('layar-ganti'); App.el('gpLama').focus(); App.toast('PIN pertama wajib diganti.', 'err'); }
    else App.masukApp();
  });
};
App.gantiPin = function () {
  var lama = App.el('gpLama').value, baru = App.el('gpBaru').value, konfirm = App.el('gpKonfirm').value;
  App.setErr('gpErr', '');
  if (!/^\d{4,8}$/.test(baru)) { App.setErr('gpErr', 'PIN baru 4-8 digit angka.'); return; }
  if (baru !== konfirm) { App.setErr('gpErr', 'Konfirmasi PIN tidak cocok.'); return; }
  if (baru === lama) { App.setErr('gpErr', 'PIN baru harus berbeda.'); return; }
  App.setLoading('btnGanti', true);
  App.api('auth.gantiPin', { oldPin: lama, newPin: baru, konfirmasi: konfirm }, App.state.token).then(function (res) {
    App.setLoading('btnGanti', false);
    if (!res || !res.ok) { App.setErr('gpErr', (res && res.error) || 'Gagal.'); return; }
    App.state.harusGantiPin = false; App.el('gpLama').value = ''; App.el('gpBaru').value = ''; App.el('gpKonfirm').value = '';
    App.toast('PIN berhasil diganti. Selamat datang!', 'ok'); App.masukApp();
  });
};
App.logout = function () {
  App.api('auth.logout', {}, App.state.token).then(function () {
    App.state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false, hariIni: App.state.hariIni, lihatSebagai: false, tokenAdmin: null, namaKelasLihat: '' };
    App.saveToken(null); App.el('loginId').value = ''; App.el('loginPin').value = '';
    App.showLayar('layar-login'); App.el('loginId').focus(); App.toast('Anda telah keluar.');
  });
};
App.kembaliKeAdmin = function () {
  var s = App.state;
  if (!s.tokenAdmin) return;
  s.token = s.tokenAdmin; s.peran = 'admin'; s.lihatSebagai = false; s.tokenAdmin = null; s.id_kelas = ''; s.namaKelasLihat = '';
  App.saveToken(s.token); App.masukApp();
};
App.masukApp = function () {
  var s = App.state;
  App.el('akunNama').textContent = s.nama || '';
  var peranText = App.labelPeran(s.peran);
  if (s.lihatSebagai) peranText += (s.namaKelasLihat ? ' ' + s.namaKelasLihat : '') + ' (lihat sebagai)';
  App.el('akunPeran').textContent = peranText;
  App.renderNav(s.peran);
  App.el('btnKembaliAdmin').style.display = s.lihatSebagai ? '' : 'none';
  App.showLayar('layar-app'); App.tampilkanBeranda();
};
App.renderNav = function (peran) {
  var menu = App.MENU[peran] || [];
  App.el('nav').innerHTML = menu.map(function (m) { return '<button class="nav-item" data-key="' + m.key + '">' + App.escapeHtml(m.label) + '</button>'; }).join('');
  Array.prototype.forEach.call(App.el('nav').querySelectorAll('.nav-item'), function (btn) { btn.addEventListener('click', function () { App.bukaMenu(btn.getAttribute('data-key')); }); });
};
App.bukaMenu = function (key) {
  var s = App.state, menu = App.MENU[s.peran] || [], m = null;
  for (var i = 0; i < menu.length; i++) if (menu[i].key === key) { m = menu[i]; break; }
  if (!m) return;
  Array.prototype.forEach.call(App.el('nav').querySelectorAll('.nav-item'), function (b) { b.classList.remove('aktif'); });
  var cur = App.el('nav').querySelector('[data-key="' + key + '"]'); if (cur) cur.classList.add('aktif');
  if (key === 'bantuan') { App.bukaBantuan(); return; }
  if (s.peran === 'siswa' && App.bukaMenuSiswa) { App.bukaMenuSiswa(key); return; }
  if (s.peran === 'wali' && App.bukaMenuWali) { App.bukaMenuWali(key); return; }
  if (s.peran === 'admin' && App.bukaMenuAdmin) { App.bukaMenuAdmin(key); return; }
  if (s.peran === 'pembaca' && App.bukaMenuPembaca) { App.bukaMenuPembaca(key); return; }
  App.el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>' + App.escapeHtml(m.label) + '</h2><p class="muted">Aktif di tahap berikutnya.</p>';
};
App.tampilkanBeranda = function () {
  var s = App.state, html = '';
  if (s.peran === 'siswa') {
    html = '<h2><span class="titik titik-hijau"></span>Halo, ' + App.escapeHtml(s.nama) + '!</h2><p class="muted">Tekan <b>Isi Hari Ini</b> untuk mengisi catatan harianmu.</p><div id="stikerBox"></div><div id="pengumumanBox"></div>';
    App.el('konten').innerHTML = html;
    App.api('siswa.stiker', {}, s.token).then(function (res) { if (!res || !res.ok || !res.data) return; var d = res.data, h = ''; if (d.lengkapHariIni) h += '<div class="stiker stiker-bintang"><div class="stiker-cap">' + d.rentetan + '</div><div><b>7 Kebiasaan lengkap hari ini!</b><br>Rentetan: ' + d.rentetan + ' hari berturut-turut.</div></div>'; else h += '<div class="stiker"><div class="stiker-cap">?</div><div>Ayo lengkapi 7 kebiasaan hari ini!</div></div>'; App.el('stikerBox').innerHTML = h; });
    App.api('publik.pengumuman', {}, s.token).then(function (res) { if (!res || !res.ok || !res.data || !res.data.pengumuman.length) return; var h = '<div class="habit-nama" style="margin-top:14px">Pengumuman</div>'; res.data.pengumuman.forEach(function (p) { h += '<div class="pengumuman-item"><b>' + App.escapeHtml(p.judul) + '</b><br><span class="muted kecil">' + App.escapeHtml(p.isi) + '</span></div>'; }); App.el('pengumumanBox').innerHTML = h; });
  } else if (s.peran === 'pembaca') {
    html = '<h2><span class="titik titik-hijau"></span>Halo, ' + App.escapeHtml(s.nama) + '!</h2><p class="muted">Pilih <b>Dashboard</b> untuk melihat rekap sekolah, atau <b>Rekap Kelas</b> untuk kelas tertentu.</p>';
    App.el('konten').innerHTML = html;
  } else {
    html = '<h2><span class="titik titik-hijau"></span>Selamat datang, ' + App.escapeHtml(s.nama) + '!</h2><p class="muted">Anda masuk sebagai <b>' + App.labelPeran(s.peran) + '</b>' + (s.lihatSebagai ? ' (sedang melihat sebagai wali kelas' + (s.namaKelasLihat ? ' ' + s.namaKelasLihat : '') + ')' : '') + '. Pilih menu di bawah.</p>';
    App.el('konten').innerHTML = html;
  }
};
App.bukaBantuan = function () {
  var s = App.state;
  var panduan = {
    siswa: [
      'Isi Hari Ini: pilih tanggal (hari ini atau maks 2 hari ke belakang), tandai tiap kebiasaan ✓ Sudah / ✗ Belum, isi jam bangun & jam tidur, centang "Diketahui orang tua", lalu Simpan.',
      'Kalender Bulanan: lihat rekap v/x per tanggal, jam bangun/tidur, dan jumlah paraf.',
      'Ringkasan Bulan: lihat kategori Sudah/Belum Terbiasa per kebiasaan + rata-rata durasi tidur.',
      'Refleksi Bulanan: isi kesimpulan & tindak lanjut per kebiasaan bersama orang tua di akhir bulan.',
      'Stiker: lengkapi 7 kebiasaan ✓ hari ini untuk dapat stiker; berturut-turut menambah rentetan.'
    ],
    wali: [
      'Kelola Siswa: tambah satu per satu atau impor massal (NISN, Nama, L/P). Edit (modal), reset PIN, nonaktifkan.',
      'Pemantauan Hari Ini: lihat siswa belum mengisi & yang perlu perhatian (3 hari kosong / kurang tidur).',
      'Validasi (Paraf): pilih siswa + tanggal, tandai paraf per kebiasaan; atau paraf massal untuk rentang tanggal.',
      'Rekap Bulanan: lihat jumlah hari per kebiasaan per siswa + kategori; isi catatan wali; unduh xlsx Lampiran 3.',
      'Refleksi Siswa: lihat refleksi siswa per bulan (read-only).'
    ],
    admin: [
      'Dashboard: rekap sekolah (isi hari ini, rata-rata per kebiasaan, per kelas).',
      'Identitas Sekolah & Kriteria: nama sekolah, NPSN, kepala sekolah, warna tema, ambang "Sudah Terbiasa", batas hari mundur, dll.',
      'Tahun Ajaran & Libur: buat tahun aktif, tambah libur. Arsipkan tahun lama (data dipindah ke spreadsheet arsip).',
      'Kelas & Wali: tambah kelas, assign wali, atur jadwal buka-tutup pengisian per kelas (bergelombang).',
      'Form 7 Kebiasaan: ubah nama/urutan/aktif kebiasaan & isian; versi form baru otomatis.',
      'Akun & Keamanan: kelola admin/wali/pembaca (modal edit), reset PIN, lihat log aktivitas.',
      'Naik Kelas: luluskan kelas 9, naikkan jenjang, atau atur ulang kelas via impor (untuk pengacakan).',
      'Ekspor xlsx: unduh rekap per kelas (Lampiran 3) atau semua kelas.',
      'Backup: atur folder Drive, retensi, aktifkan backup harian otomatis.'
    ],
    pembaca: [
      'Dashboard: lihat rekap sekolah (isi hari ini, rata-rata per kebiasaan, per kelas).',
      'Rekap Kelas: pilih kelas + bulan, lihat rekap & unduh xlsx (read-only, tidak mengubah data).'
    ]
  };
  var list = panduan[s.peran] || [];
  var html = '<h2><span class="titik titik-hijau"></span>Panduan Pemakaian</h2>';
  list.forEach(function (t) { html += '<div class="def-item"><div class="def-isi">' + App.escapeHtml(t) + '</div></div>'; });
  html += '<p class="muted kecil" style="margin-top:12px">Bila lupa PIN, hubungi admin atau wali kelas untuk direset.</p>';
  App.el('konten').innerHTML = html;
};

document.addEventListener('DOMContentLoaded', function () {
  App.el('btnLogin').addEventListener('click', App.login);
  App.el('btnGanti').addEventListener('click', App.gantiPin);
  App.el('btnLogout').addEventListener('click', App.logout);
  App.el('btnKembaliAdmin').addEventListener('click', App.kembaliKeAdmin);
  App.el('loginPin').addEventListener('keypress', function (e) { if (e.key === 'Enter') App.login(); });
  App.el('gpKonfirm').addEventListener('keypress', function (e) { if (e.key === 'Enter') App.gantiPin(); });
  App.api('system.status').then(function (res) { if (res && res.ok && res.data) { if (res.data.namaAplikasi) App.el('judul').textContent = res.data.namaAplikasi; if (res.data.sambutan) App.el('sambutan').textContent = res.data.sambutan; if (res.data.namaSekolah) App.el('sekolahInfo').textContent = res.data.namaSekolah; App.state.hariIni = res.data.tanggalServer; } });
  var token = App.getToken();
  if (token) {
    App.api('auth.status', {}, token).then(function (res) {
      if (res && res.ok && res.data && res.data.login) { App.state.token = token; App.state.peran = res.data.peran; App.state.nama = res.data.nama; App.state.id_kelas = res.data.id_kelas || ''; App.state.harusGantiPin = res.data.harusGantiPin; if (App.state.harusGantiPin) { App.showLayar('layar-ganti'); App.el('gpLama').focus(); } else App.masukApp(); }
      else { App.saveToken(null); App.showLayar('layar-login'); App.el('loginId').focus(); }
    });
  } else { App.showLayar('layar-login'); App.el('loginId').focus(); }
});
