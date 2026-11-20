// app.js — Logika frontend & panggilan API ke Apps Script (lintas-asal).
(function () {
  'use strict';

  //--- Token sesi (dipakai mulai Tahap 2) ---
  function getToken() {
    try { return localStorage.getItem('7kaih_token'); } catch (e) { return null; }
  }
  function setToken(t) {
    try { if (t) localStorage.setItem('7kaih_token', t); else localStorage.removeItem('7kaih_token'); } catch (e) {}
  }

  //--- Wrapper API ---
  //PENTING: tidak memakai header khusus, jadi browser mengirim Content-Type: text/plain
  //(CORS simple request => tanpa preflight OPTIONS). Token dikirim di body, bukan di URL.
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
          if (attempt >= delays.length) {
            return { ok: false, error: err.message || 'Gagal terhubung ke server.' };
          }
          return new Promise(function (r) { setTimeout(r, delays[attempt++]); }).then(run);
        });
    }
    return run();
  }

  //--- Render ---
  function el(id) { return document.getElementById(id); }
  function setHtml(node, html) { if (node) node.innerHTML = html; }
  function muat(node, teks) { setHtml(node, '<span class="spinner"></span> ' + (teks || 'Memuat…')); }
  function baris(k, v) {
    return '<div class="baris"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>';
  }

  function muatStatus() {
    var node = el('statusSistem');
    muat(node, 'Memeriksa…');
    api('system.status').then(function (res) {
      if (!res || !res.ok) {
        setHtml(node, '<p class="muted">Gagal memuat. Pastikan <b>APPSCRIPT_URL</b> di config.js benar.</p>');
        return;
      }
      var d = res.data;
      var badge = d.siap
        ? '<span class="badge badge-ok">Siap</span>'
        : '<span class="badge badge-belum">Belum disiapkan</span>';
      setHtml(node,
        baris('Database', badge) +
        baris('Versi', d.versi) +
        baris('Zona Waktu', d.zona) +
        baris('Tanggal Server', d.tanggalServer + ' &middot; ' + d.waktuServer)
      );
      if (d.namaAplikasi) el('judul').textContent = d.namaAplikasi;
      if (d.sambutan) el('sambutan').textContent = d.sambutan;
      if (d.namaSekolah) el('sekolahInfo').textContent = d.namaSekolah;
    });
  }

  function muatLogin() {
    var node = el('statusLogin');
    muat(node, 'Memeriksa…');
    api('auth.status', {}, getToken()).then(function (res) {
      if (!res || !res.ok || !res.data || !res.data.login) {
        setHtml(node, '<p class="muted">Belum masuk. Form login akan tersedia di Tahap 2.</p>');
        return;
      }
      var d = res.data;
      setHtml(node,
        baris('Nama', d.nama) +
        baris('Peran', d.peran) +
        baris('Ganti PIN', d.harusGantiPin ? 'Wajib' : 'Sudah')
      );
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    muatStatus();
    muatLogin();
  });
})();