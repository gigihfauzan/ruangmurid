// app.js — Logika frontend Tahap 2: login, ganti PIN, kerangka app per peran.
(function () {
  'use strict';

  var state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false };

  //--- API wrapper (POST JSON ke Apps Script, tanpa header khusus = CORS simple) ---
  function api(action, payload, token) {
    if (!APPSCRIPT_URL || APPSCRIPT_URL.indexOf('PASTE_URL') === 0) {
      return Promise.resolve({ ok: false, error: 'APPSCRIPT_URL belum diisi di config.js.' });
    }
    var body = JSON.stringify({ action: action, token: token || null, payload: payload || {} });
    var delays = [1000, 2000, 4000, 8000];
    var attempt = 0;
    function run() {
      return fetch(APPSCRIPT_URL, { method: 'POST', body: body })
        .then(function (res) {
          if (!res.ok) throw new Error('Koneksi gagal (' + res.status + ')');
          return res.json();
        })
        .catch(function (err) {
          if (attempt >= delays.length) return { ok: false, error: err.message || 'Gagal terhubung ke server.' };
          return new Promise(function (r) { setTimeout(r, delays[attempt++]); }).then(run);
        });
    }
    return run();
  }

  //--- Token ---
  function getToken()    { try { return localStorage.getItem('7kaih_token'); } catch (e) { return null; } }
  function saveToken(t)  { try { if (t) localStorage.setItem('7kaih_token', t); else localStorage.removeItem('7kaih_token'); } catch (e) {} }

  //--- DOM helper ---
  function el(id) { return document.getElementById(id); }
  function showLayar(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.layar'), function (l) { l.classList.remove('layar-aktif'); });
    var t = el(id); if (t) t.classList.add('layar-aktif');
  }
  function setErr(id, msg) { var e = el(id); if (e) e.textContent = msg || ''; }
  function toast(msg, tipe) {
    var t = el('toast'); t.textContent = msg;
    t.className = 'toast show ' + (tipe === 'ok' ? 'toast-ok' : (tipe === 'err' ? 'toast-err' : ''));
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = 'toast'; }, 3500);
  }
  function setLoading(btnId, loading) {
    var b = el(btnId); if (!b) return;
    if (loading) { b.disabled = true; b.dataset.teks = b.textContent; b.innerHTML = '<span class="spinner spinner-putih"></span> Memproses…'; }
    else { b.disabled = false; if (b.dataset.teks) b.textContent = b.dataset.teks; }
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function labelPeran(p) {
    return { admin: 'Admin Utama', wali: 'Wali Kelas', siswa: 'Siswa', pembaca: 'Pembaca (Kepsek/BK)' }[p] || p;
  }

  //--- LOGIN ---
  function login() {
    var identifier = el('loginId').value.trim();
    var pin = el('loginPin').value;
    setErr('loginErr', '');
    if (!identifier) { setErr('loginErr', 'Isi NISN atau username.'); return; }
    if (!/^\d{4,8}$/.test(pin)) { setErr('loginErr', 'PIN harus 4-8 digit angka.'); return; }
    setLoading('btnLogin', true);
    api('auth.login', { identifier: identifier, pin: pin }).then(function (res) {
      setLoading('btnLogin', false);
      if (!res || !res.ok) { setErr('loginErr', (res && res.error) || 'Gagal masuk.'); return; }
      var d = res.data;
      state.token = d.token; state.peran = d.peran; state.nama = d.nama;
      state.id_kelas = d.id_kelas || ''; state.harusGantiPin = d.harusGantiPin;
      saveToken(d.token);
      el('loginPin').value = '';
      if (d.harusGantiPin) {
        showLayar('layar-ganti');
        el('gpLama').focus();
        toast('PIN pertama wajib diganti.', 'err');
      } else {
        masukApp();
      }
    });
  }

  //--- GANTI PIN ---
  function gantiPin() {
    var lama = el('gpLama').value;
    var baru = el('gpBaru').value;
    var konfirm = el('gpKonfirm').value;
    setErr('gpErr', '');
    if (!/^\d{4,8}$/.test(baru)) { setErr('gpErr', 'PIN baru harus 4-8 digit angka.'); return; }
    if (baru !== konfirm) { setErr('gpErr', 'Konfirmasi PIN tidak cocok.'); return; }
    if (baru === lama) { setErr('gpErr', 'PIN baru harus berbeda dari PIN lama.'); return; }
    setLoading('btnGanti', true);
    api('auth.gantiPin', { oldPin: lama, newPin: baru, konfirmasi: konfirm }, state.token).then(function (res) {
      setLoading('btnGanti', false);
      if (!res || !res.ok) { setErr('gpErr', (res && res.error) || 'Gagal mengganti PIN.'); return; }
      state.harusGantiPin = false;
      el('gpLama').value = ''; el('gpBaru').value = ''; el('gpKonfirm').value = '';
      toast('PIN berhasil diganti. Selamat datang!', 'ok');
      masukApp();
    });
  }

  //--- APP SHELL ---
  function masukApp() {
    el('akunNama').textContent = state.nama || '';
    el('akunPeran').textContent = labelPeran(state.peran);
    renderNav(state.peran);
    showLayar('layar-app');
    tampilkanBeranda();
  }
  function renderNav(peran) {
    var menu = MENU[peran] || [];
    el('nav').innerHTML = menu.map(function (m) {
      return '<button class="nav-item" data-key="' + m.key + '">' + escapeHtml(m.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(el('nav').querySelectorAll('.nav-item'), function (btn) {
      btn.addEventListener('click', function () { bukaMenu(btn.getAttribute('data-key')); });
    });
  }
  function bukaMenu(key) {
    var menu = MENU[state.peran] || [];
    var m = null;
    for (var i = 0; i < menu.length; i++) { if (menu[i].key === key) { m = menu[i]; break; } }
    if (!m) return;
    el('konten').innerHTML =
      '<h2><span class="titik titik-kuning"></span>' + escapeHtml(m.label) + '</h2>' +
      '<p class="muted">' + escapeHtml(m.catatan) + '</p>';
    Array.prototype.forEach.call(el('nav').querySelectorAll('.nav-item'), function (b) { b.classList.remove('aktif'); });
    var cur = el('nav').querySelector('[data-key="' + key + '"]');
    if (cur) cur.classList.add('aktif');
  }
  function tampilkanBeranda() {
    el('konten').innerHTML =
      '<h2><span class="titik titik-hijau"></span>Selamat datang!</h2>' +
      '<p class="muted">Hai <b>' + escapeHtml(state.nama) + '</b>, Anda masuk sebagai <b>' + labelPeran(state.peran) + '</b>. ' +
      'Pilih menu di bawah. Fitur akan aktif bertahap pada tahap berikutnya.</p>';
  }

  //--- LOGOUT ---
  function logout() {
    api('auth.logout', {}, state.token).then(function () {
      state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false };
      saveToken(null);
      el('loginId').value = ''; el('loginPin').value = '';
      showLayar('layar-login');
      el('loginId').focus();
      toast('Anda telah keluar.');
    });
  }

  //--- Menu per peran (placeholder; fitur aktif tahap berikutnya) ---
  var MENU = {
    siswa: [
      { key: 'isi', label: 'Isi Hari Ini', catatan: 'Aktif di Tahap 3.' },
      { key: 'kalender', label: 'Kalender Bulanan', catatan: 'Aktif di Tahap 3.' },
      { key: 'ringkasan', label: 'Ringkasan Bulan', catatan: 'Aktif di Tahap 3.' },
      { key: 'refleksi', label: 'Refleksi Bulanan', catatan: 'Aktif di Tahap 3.' },
      { key: 'definisi', label: 'Definisi 7 Kebiasaan', catatan: 'Aktif di Tahap 3.' }
    ],
    wali: [
      { key: 'siswa', label: 'Kelola Siswa', catatan: 'Aktif di Tahap 4.' },
      { key: 'pantau', label: 'Pemantauan Hari Ini', catatan: 'Aktif di Tahap 4.' },
      { key: 'validasi', label: 'Validasi (Paraf)', catatan: 'Aktif di Tahap 4.' },
      { key: 'rekap', label: 'Rekap Bulanan', catatan: 'Aktif di Tahap 4.' },
      { key: 'refsiswa', label: 'Refleksi Siswa', catatan: 'Aktif di Tahap 4.' }
    ],
    admin: [
      { key: 'pengaturan', label: 'Pengaturan', catatan: 'Aktif di Tahap 5.' },
      { key: 'kelas', label: 'Kelas & Wali Kelas', catatan: 'Aktif di Tahap 5.' },
      { key: 'akun', label: 'Akun & Keamanan', catatan: 'Aktif di Tahap 5.' },
      { key: 'naik', label: 'Naik Kelas', catatan: 'Aktif di Tahap 5.' },
      { key: 'pengumuman', label: 'Pengumuman', catatan: 'Aktif di Tahap 5.' },
      { key: 'lihat', label: 'Lihat sebagai Wali', catatan: 'Aktif di Tahap 5.' }
    ],
    pembaca: [
      { key: 'dashboard', label: 'Dashboard', catatan: 'Aktif di Tahap 6.' },
      { key: 'rekap', label: 'Rekap', catatan: 'Aktif di Tahap 6.' }
    ]
  };

  //--- INIT ---
  document.addEventListener('DOMContentLoaded', function () {
    el('btnLogin').addEventListener('click', login);
    el('btnGanti').addEventListener('click', gantiPin);
    el('btnLogout').addEventListener('click', logout);
    el('loginPin').addEventListener('keypress', function (e) { if (e.key === 'Enter') login(); });
    el('gpKonfirm').addEventListener('keypress', function (e) { if (e.key === 'Enter') gantiPin(); });

    //Branding dari server
    api('system.status').then(function (res) {
      if (res && res.ok && res.data) {
        if (res.data.namaAplikasi) el('judul').textContent = res.data.namaAplikasi;
        if (res.data.sambutan) el('sambutan').textContent = res.data.sambutan;
        if (res.data.namaSekolah) el('sekolahInfo').textContent = res.data.namaSekolah;
      }
    });

    //Cek sesi tersimpan
    var token = getToken();
    if (token) {
      api('auth.status', {}, token).then(function (res) {
        if (res && res.ok && res.data && res.data.login) {
          state.token = token; state.peran = res.data.peran; state.nama = res.data.nama;
          state.id_kelas = res.data.id_kelas || ''; state.harusGantiPin = res.data.harusGantiPin;
          if (state.harusGantiPin) { showLayar('layar-ganti'); el('gpLama').focus(); }
          else masukApp();
        } else {
          saveToken(null);
          showLayar('layar-login');
          el('loginId').focus();
        }
      });
    } else {
      showLayar('layar-login');
      el('loginId').focus();
    }
  });
})();
