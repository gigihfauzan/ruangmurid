/**
 * api.js — klien API. Satu aksi = satu pemanggilan server.
 * Gagal jaringan diulang otomatis dengan jeda bertahap. Aman diulang karena simpan harian berupa upsert.
 * Token hanya disimpan di sessionStorage (dibungkus try/catch) dan dikirim di badan permintaan, bukan di URL.
 */
const Api = (function () {
  const TOKEN_KEY = 'kaih_token';
  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) { /* penyimpanan tidak tersedia: tetap jalan */ }

  function setToken(t) {
    token = t || null;
    try { if (token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  async function call(action, payload, opts) {
    const maxRetry = (opts && opts.retries !== undefined) ? opts.retries : 3;
    for (let i = 0; ; i++) {
      try {
        // Tanpa header Content-Type: tipe bawaan teks biasa, supaya tidak memicu preflight CORS.
        const res = await fetch(window.APP_CONFIG.API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: action, payload: payload || {}, token: token })
        });
        const json = await res.json();
        if (!json.ok && json.error && json.error.kode === 'SIBUK' && i < maxRetry) {
          await sleep(700 * Math.pow(2, i) + Math.random() * 400);
          continue;
        }
        if (!json.ok && json.error && json.error.kode === 'SESI_HABIS') {
          setToken(null);
          window.dispatchEvent(new Event('sesi-habis'));
        }
        return json;
      } catch (e) {
        if (i >= maxRetry) {
          return { ok: false, error: { kode: 'JARINGAN', pesan: 'Tidak dapat terhubung ke server. Periksa internet, lalu coba lagi.' } };
        }
        await sleep(700 * Math.pow(2, i) + Math.random() * 400);
      }
    }
  }
  return { call: call, setToken: setToken, hasToken: function () { return !!token; } };
})();