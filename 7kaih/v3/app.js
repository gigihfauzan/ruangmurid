// app.js — Tahap 3 (siswa) + Tahap 4 (wali kelas).
(function () {
  'use strict';

  var state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false,
                tanggalIsi: '', bulanKal: '', bulanRing: '', bulanRef: '', hariIni: '',
                bulanRekap: '', bulanRefSiswa: '', siswaListWali: [] };

  //--- API wrapper ---
  function api(action, payload, token) {
    if (!APPSCRIPT_URL || APPSCRIPT_URL.indexOf('PASTE_URL') === 0) {
      return Promise.resolve({ ok: false, error: 'APPSCRIPT_URL belum diisi di config.js.' });
    }
    var body = JSON.stringify({ action: action, token: token || null, payload: payload || {} });
    var delays = [1000, 2000, 4000, 8000];
    var attempt = 0;
    function run() {
      return fetch(APPSCRIPT_URL, { method: 'POST', body: body })
        .then(function (res) { if (!res.ok) throw new Error('Koneksi gagal (' + res.status + ')'); return res.json(); })
        .catch(function (err) {
          if (attempt >= delays.length) return { ok: false, error: err.message || 'Gagal terhubung ke server.' };
          return new Promise(function (r) { setTimeout(r, delays[attempt++]); }).then(run);
        });
    }
    return run();
  }

  //--- Token ---
  function getToken()   { try { return localStorage.getItem('7kaih_token'); } catch (e) { return null; } }
  function saveToken(t) { try { if (t) localStorage.setItem('7kaih_token', t); else localStorage.removeItem('7kaih_token'); } catch (e) {} }

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
    clearTimeout(t._timer); t._timer = setTimeout(function () { t.className = 'toast'; }, 3500);
  }
  function setLoading(btnId, loading) {
    var b = el(btnId); if (!b) return;
    if (loading) { b.disabled = true; b.dataset.teks = b.textContent; b.innerHTML = '<span class="spinner spinner-putih"></span> Memproses…'; }
    else { b.disabled = false; if (b.dataset.teks) b.textContent = b.dataset.teks; }
  }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function labelPeran(p) { return { admin: 'Admin Utama', wali: 'Wali Kelas', siswa: 'Siswa', pembaca: 'Pembaca (Kepsek/BK)' }[p] || p; }

  //--- Date helper ---
  function addDaysYmdClient(ymd, n) {
    var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function formatTglPendek(ymd) { var nh = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']; var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); return nh[d.getDay()] + ', ' + Number(p[2]); }
  function formatBulan(bulan) { var nb = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']; var p = bulan.split('-'); return nb[Number(p[1]) - 1] + ' ' + p[0]; }
  function geserBulan(bulan, delta) { var p = bulan.split('-'); var y = Number(p[0]); var m = Number(p[1]) + delta; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + ('0' + m).slice(-2); }
  function monthKeyFromYmdClient(ymd) { return String(ymd || '').substring(0, 7); }

  //--- LOGIN ---
  function login() {
    var identifier = el('loginId').value.trim(), pin = el('loginPin').value;
    setErr('loginErr', '');
    if (!identifier) { setErr('loginErr', 'Isi NISN atau username.'); return; }
    if (!/^\d{4,8}$/.test(pin)) { setErr('loginErr', 'PIN harus 4-8 digit angka.'); return; }
    setLoading('btnLogin', true);
    api('auth.login', { identifier: identifier, pin: pin }).then(function (res) {
      setLoading('btnLogin', false);
      if (!res || !res.ok) { setErr('loginErr', (res && res.error) || 'Gagal masuk.'); return; }
      var d = res.data;
      state.token = d.token; state.peran = d.peran; state.nama = d.nama; state.id_kelas = d.id_kelas || ''; state.harusGantiPin = d.harusGantiPin;
      state.tanggalIsi = ''; state.bulanKal = ''; state.bulanRing = ''; state.bulanRef = ''; state.bulanRekap = ''; state.bulanRefSiswa = '';
      saveToken(d.token); el('loginPin').value = '';
      if (d.harusGantiPin) { showLayar('layar-ganti'); el('gpLama').focus(); toast('PIN pertama wajib diganti.', 'err'); }
      else masukApp();
    });
  }
  function gantiPin() {
    var lama = el('gpLama').value, baru = el('gpBaru').value, konfirm = el('gpKonfirm').value;
    setErr('gpErr', '');
    if (!/^\d{4,8}$/.test(baru)) { setErr('gpErr', 'PIN baru harus 4-8 digit angka.'); return; }
    if (baru !== konfirm) { setErr('gpErr', 'Konfirmasi PIN tidak cocok.'); return; }
    if (baru === lama) { setErr('gpErr', 'PIN baru harus berbeda dari PIN lama.'); return; }
    setLoading('btnGanti', true);
    api('auth.gantiPin', { oldPin: lama, newPin: baru, konfirmasi: konfirm }, state.token).then(function (res) {
      setLoading('btnGanti', false);
      if (!res || !res.ok) { setErr('gpErr', (res && res.error) || 'Gagal mengganti PIN.'); return; }
      state.harusGantiPin = false; el('gpLama').value = ''; el('gpBaru').value = ''; el('gpKonfirm').value = '';
      toast('PIN berhasil diganti. Selamat datang!', 'ok'); masukApp();
    });
  }
  function logout() {
    api('auth.logout', {}, state.token).then(function () {
      state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false, tanggalIsi: '', bulanKal: '', bulanRing: '', bulanRef: '', hariIni: '', bulanRekap: '', bulanRefSiswa: '', siswaListWali: [] };
      saveToken(null); el('loginId').value = ''; el('loginPin').value = '';
      showLayar('layar-login'); el('loginId').focus(); toast('Anda telah keluar.');
    });
  }

  //--- APP SHELL ---
  function masukApp() {
    el('akunNama').textContent = state.nama || '';
    el('akunPeran').textContent = labelPeran(state.peran);
    renderNav(state.peran); showLayar('layar-app'); tampilkanBeranda();
  }
  function renderNav(peran) {
    var menu = MENU[peran] || [];
    el('nav').innerHTML = menu.map(function (m) { return '<button class="nav-item" data-key="' + m.key + '">' + escapeHtml(m.label) + '</button>'; }).join('');
    Array.prototype.forEach.call(el('nav').querySelectorAll('.nav-item'), function (btn) {
      btn.addEventListener('click', function () { bukaMenu(btn.getAttribute('data-key')); });
    });
  }
  function bukaMenu(key) {
    var menu = MENU[state.peran] || []; var m = null;
    for (var i = 0; i < menu.length; i++) { if (menu[i].key === key) { m = menu[i]; break; } }
    if (!m) return;
    Array.prototype.forEach.call(el('nav').querySelectorAll('.nav-item'), function (b) { b.classList.remove('aktif'); });
    var cur = el('nav').querySelector('[data-key="' + key + '"]'); if (cur) cur.classList.add('aktif');
    if (state.peran === 'siswa') { bukaMenuSiswa(key); return; }
    if (state.peran === 'wali') { bukaMenuWali(key); return; }
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>' + escapeHtml(m.label) + '</h2><p class="muted">' + escapeHtml(m.catatan) + '</p>';
  }
  function tampilkanBeranda() {
    if (state.peran === 'siswa') {
      el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Halo, ' + escapeHtml(state.nama) + '!</h2><p class="muted">Tekan <b>Isi Hari Ini</b> untuk mengisi catatan harianmu.</p><div id="stikerBox"></div>';
      api('siswa.stiker', {}, state.token).then(function (res) {
        if (!res || !res.ok || !res.data) return; var d = res.data, html = '';
        if (d.lengkapHariIni) html += '<div class="stiker stiker-bintang"><div class="stiker-cap">' + d.rentetan + '</div><div><b>7 Kebiasaan lengkap hari ini!</b><br>Rentetan: ' + d.rentetan + ' hari berturut-turut. Pertahankan!</div></div>';
        else html += '<div class="stiker"><div class="stiker-cap">?</div><div>Ayo lengkapi 7 kebiasaan hari ini!</div></div>';
        el('stikerBox').innerHTML = html;
      });
    } else if (state.peran === 'wali') {
      el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Halo, ' + escapeHtml(state.nama) + '!</h2><p class="muted">Pilih menu untuk mengelola kelas Anda. Mulai dari <b>Kelola Siswa</b> untuk menambah/impor siswa.</p>';
    } else {
      el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Selamat datang!</h2><p class="muted">Hai <b>' + escapeHtml(state.nama) + '</b>, Anda masuk sebagai <b>' + labelPeran(state.peran) + '</b>. Fitur aktif bertahap.</p>';
    }
  }

  //============== SISWA (Tahap 3) ==============
  function bukaMenuSiswa(key) {
    if (key === 'isi') bukaIsiHariIni();
    else if (key === 'kalender') bukaKalender();
    else if (key === 'ringkasan') bukaRingkasan();
    else if (key === 'refleksi') bukaRefleksi();
    else if (key === 'definisi') bukaDefinisi();
  }
  function bukaIsiHariIni() {
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.jurnalHari', { tanggal: state.tanggalIsi || '' }, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      state.tanggalIsi = res.data.tanggal; renderIsiHariIni(res.data);
    });
  }
  function renderField(f, val) {
    var id = 'field_' + f.kode;
    var lab = '<label class="label kecil-label" for="' + id + '">' + escapeHtml(f.label) + (f.wajib ? ' *' : '') + '</label>';
    if (f.tipe === 'jam') return lab + '<input id="' + id + '" class="input" type="time" value="' + escapeAttr(val) + '">';
    if (f.tipe === 'angka') return lab + '<input id="' + id + '" class="input" type="number" inputmode="numeric" value="' + escapeAttr(val) + '">';
    if (f.tipe === 'teks_panjang') return lab + '<textarea id="' + id + '" class="input" rows="3">' + escapeHtml(val) + '</textarea>';
    if (f.tipe === 'pilihan') { var opts = (f.opsi && f.opsi.pilihan) || []; var o = '<option value="">— pilih —</option>'; opts.forEach(function (op) { o += '<option value="' + escapeAttr(op) + '"' + (op === val ? ' selected' : '') + '>' + escapeHtml(op) + '</option>'; }); return lab + '<select id="' + id + '" class="input">' + o + '</select>'; }
    return lab + '<input id="' + id + '" class="input" type="text" value="' + escapeAttr(val) + '">';
  }
  function renderIsiHariIni(data) {
    var j = data.jurnal, form = data.form, status = (j && j.status) || {}, jawaban = (j && j.jawaban_tambahan) || {};
    var html = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2><div class="chip-row">';
    for (var k = data.batasMundur; k >= 0; k--) { var tgl = addDaysYmdClient(data.hariIni, -k); html += '<button class="chip' + (tgl === data.tanggal ? ' aktif' : '') + '" data-tgl="' + tgl + '">' + formatTglPendek(tgl) + '</button>'; }
    html += '</div>';
    if (!data.editable) html += '<p class="muted kecil">Tanggal ini hanya untuk dilihat.</p>';
    form.habits.forEach(function (h) {
      var st = status['status_' + h.kode] || '';
      html += '<div class="habit-row"><div class="habit-nama">' + escapeHtml(h.nama) + '</div><div class="vx-group">';
      html += '<button class="vx vx-v' + (st === 'v' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="v">&#10003; Sudah</button>';
      html += '<button class="vx vx-x' + (st === 'x' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="x">&#10007; Belum</button></div>';
      var extras = (form.fields || []).filter(function (f) { return f.id_kebiasaan === h.id && f.kode !== 'status_' + h.kode; });
      extras.forEach(function (f) {
        var val = ''; if (f.kode === 'jam_bangun') val = (j && j.jam_bangun) || ''; else if (f.kode === 'jam_tidur') val = (j && j.jam_tidur) || ''; else val = jawaban[f.kode] || '';
        html += renderField(f, val);
      });
      html += '</div>';
    });
    html += '<label class="cek"><input type="checkbox" id="ortuChk"' + (j && j.diketahui_ortu ? ' checked' : '') + '> Diketahui orang tua/wali</label>';
    html += '<button id="btnSimpanIsi" class="btn btn-block"' + (data.editable ? '' : ' disabled') + '>Simpan</button><p id="isiErr" class="pesan-err"></p>';
    el('konten').innerHTML = html;
    Array.prototype.forEach.call(el('konten').querySelectorAll('.chip'), function (c) { c.addEventListener('click', function () { state.tanggalIsi = c.getAttribute('data-tgl'); bukaIsiHariIni(); }); });
    Array.prototype.forEach.call(el('konten').querySelectorAll('.vx'), function (btn) {
      btn.addEventListener('click', function () {
        var kode = btn.getAttribute('data-kode');
        Array.prototype.forEach.call(el('konten').querySelectorAll('.vx[data-kode="' + kode + '"]'), function (b) { b.classList.remove('aktif'); });
        btn.classList.add('aktif');
      });
    });
    el('btnSimpanIsi').addEventListener('click', function () { simpanIsi(data); });
  }
  function simpanIsi(data) {
    var status = {}, jamBangun = '', jamTidur = '', jawaban = {};
    data.form.habits.forEach(function (h) { var sel = el('konten').querySelector('.vx[data-kode="' + h.kode + '"].aktif'); status['status_' + h.kode] = sel ? sel.getAttribute('data-val') : ''; });
    (data.form.fields || []).forEach(function (f) { if (f.kode.indexOf('status_') === 0) return; var node = el('field_' + f.kode); if (!node) return; var v = node.value; if (f.kode === 'jam_bangun') jamBangun = v; else if (f.kode === 'jam_tidur') jamTidur = v; else jawaban[f.kode] = v; });
    setErr('isiErr', ''); setLoading('btnSimpanIsi', true);
    api('siswa.simpanJurnal', { tanggal: state.tanggalIsi, status: status, jamBangun: jamBangun, jamTidur: jamTidur, jawabanTambahan: jawaban, diketahuiOrtu: el('ortuChk').checked }, state.token).then(function (res) {
      setLoading('btnSimpanIsi', false);
      if (!res || !res.ok) { setErr('isiErr', (res && res.error) || 'Gagal menyimpan.'); return; }
      toast('Tersimpan! Kerja bagus.', 'ok');
      api('siswa.stiker', {}, state.token).then(function (r) { if (r && r.ok && r.data && r.data.lengkapHariIni) toast('Luar biasa! 7 kebiasaan lengkap. Rentetan: ' + r.data.rentetan + ' hari.', 'ok'); });
      bukaIsiHariIni();
    });
  }
  function bukaKalender() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.kalender', { bulan: state.bulanKal || '' }, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.bulanKal = res.data.bulan; renderKalender(res.data); });
  }
  function renderKalender(data) {
    var total = data.totalHari, html = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="kalPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="kalNext">&raquo;</button></div>';
    html += '<div class="kal-scroll"><table class="kal"><thead><tr><th>Kebiasaan</th>'; for (var d = 1; d <= total; d++) html += '<th>' + d + '</th>'; html += '</tr></thead><tbody>';
    data.habits.forEach(function (h) {
      html += '<tr><td class="kal-nama">' + escapeHtml(h.nama) + '</td>';
      for (var d2 = 1; d2 <= total; d2++) { var tgl = data.bulan + '-' + ('0' + d2).slice(-2); var pt = data.perTanggal[tgl]; var st = pt && pt.status ? (pt.status['status_' + h.kode] || '') : ''; html += '<td class="kal-cell ' + (st === 'v' ? 'cell-v' : st === 'x' ? 'cell-x' : '') + '">' + (st === 'v' ? '&#10003;' : st === 'x' ? '&#10007;' : '') + '</td>'; }
      html += '</tr>';
    });
    html += '<tr><td class="kal-nama">Jam Bangun</td>'; for (var d3 = 1; d3 <= total; d3++) { var p3 = data.perTanggal[data.bulan + '-' + ('0' + d3).slice(-2)]; html += '<td class="kal-cell kecil">' + (p3 && p3.jamBangun ? escapeHtml(p3.jamBangun) : '') + '</td>'; } html += '</tr>';
    html += '<tr><td class="kal-nama">Jam Tidur</td>'; for (var d4 = 1; d4 <= total; d4++) { var p4 = data.perTanggal[data.bulan + '-' + ('0' + d4).slice(-2)]; html += '<td class="kal-cell kecil">' + (p4 && p4.jamTidur ? escapeHtml(p4.jamTidur) : '') + '</td>'; } html += '</tr>';
    html += '<tr><td class="kal-nama">Paraf</td>'; for (var d5 = 1; d5 <= total; d5++) { var p5 = data.perTanggal[data.bulan + '-' + ('0' + d5).slice(-2)]; var pr = p5 ? p5.paraf : 0; html += '<td class="kal-cell' + (pr ? ' paraf' : '') + '">' + (pr ? pr : '') + '</td>'; } html += '</tr>';
    html += '</tbody></table></div><p class="muted kecil">&#10003; = dilakukan, &#10007; = belum. Angka di baris Paraf = jumlah kebiasaan divalidasi guru.</p>';
    el('konten').innerHTML = html;
    el('kalPrev').addEventListener('click', function () { state.bulanKal = geserBulan(data.bulan, -1); bukaKalender(); });
    el('kalNext').addEventListener('click', function () { state.bulanKal = geserBulan(data.bulan, 1); bukaKalender(); });
  }
  function bukaRingkasan() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Ringkasan Bulan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.ringkasan', { bulan: state.bulanRing || '' }, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.bulanRing = res.data.bulan; renderRingkasan(res.data); });
  }
  function renderRingkasan(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Ringkasan ' + formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="ringPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="ringNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    data.perHabit.forEach(function (h) {
      var badge = h.kategori === 'Sudah Terbiasa' ? 'badge-ok' : 'badge-belum';
      html += '<div class="ring-item"><div class="ring-nama">' + escapeHtml(h.nama) + '</div><div class="ring-bar"><div class="ring-fill" style="width:' + h.persen + '%"></div></div><div class="ring-meta">' + h.hariV + '/' + h.totalHari + ' hari &middot; ' + h.persen + '% <span class="badge ' + badge + '">' + h.kategori + '</span></div></div>';
    });
    html += '<div class="card-mini"><b>Rata-rata durasi tidur:</b> ' + (data.avgDurasiTidurJam ? data.avgDurasiTidurJam + ' jam' : 'belum ada data') + ' (dari ' + data.jumlahHariTidurLengkap + ' hari lengkap).</div>';
    el('konten').innerHTML = html;
    el('ringPrev').addEventListener('click', function () { state.bulanRing = geserBulan(data.bulan, -1); bukaRingkasan(); });
    el('ringNext').addEventListener('click', function () { state.bulanRing = geserBulan(data.bulan, 1); bukaRingkasan(); });
  }
  function bukaRefleksi() {
    el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Refleksi Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.refleksiGet', { bulan: state.bulanRef || '' }, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.bulanRef = res.data.bulan; renderRefleksi(res.data); });
  }
  function renderRefleksi(data) {
    var html = '<h2><span class="titik titik-koral"></span>Refleksi ' + formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="refPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="refNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Isi bersama orang tua/wali di akhir bulan.</p>';
    data.habits.forEach(function (h) {
      var item = (data.isi && data.isi[h.kode]) || {};
      html += '<div class="ref-item"><div class="ref-nama">' + escapeHtml(h.nama) + '</div>';
      html += '<label class="label kecil-label">Kesimpulan / Refleksi</label><textarea id="ref_' + h.kode + '_k" class="input" rows="2">' + escapeHtml(item.kesimpulan || '') + '</textarea>';
      html += '<label class="label kecil-label">Tindak Lanjut</label><textarea id="ref_' + h.kode + '_t" class="input" rows="2">' + escapeHtml(item.tindakLanjut || '') + '</textarea></div>';
    });
    if (data.catatanWali) html += '<div class="card-mini"><b>Catatan Wali Kelas:</b> ' + escapeHtml(data.catatanWali) + '</div>';
    html += '<button id="btnSimpanRef" class="btn btn-block">Simpan Refleksi</button><p id="refErr" class="pesan-err"></p>';
    el('konten').innerHTML = html;
    el('refPrev').addEventListener('click', function () { state.bulanRef = geserBulan(data.bulan, -1); bukaRefleksi(); });
    el('refNext').addEventListener('click', function () { state.bulanRef = geserBulan(data.bulan, 1); bukaRefleksi(); });
    el('btnSimpanRef').addEventListener('click', function () { simpanRefleksi(data); });
  }
  function simpanRefleksi(data) {
    var isi = {};
    data.habits.forEach(function (h) { var k = el('ref_' + h.kode + '_k'), t = el('ref_' + h.kode + '_t'); isi[h.kode] = { kesimpulan: k ? k.value : '', tindakLanjut: t ? t.value : '' }; });
    setLoading('btnSimpanRef', true);
    api('siswa.refleksiSimpan', { bulan: data.bulan, isi: isi }, state.token).then(function (res) { setLoading('btnSimpanRef', false); if (!res || !res.ok) { setErr('refErr', (res && res.error) || 'Gagal.'); return; } toast('Refleksi tersimpan.', 'ok'); });
  }
  function bukaDefinisi() {
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.definisi', {}, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2>';
      res.data.habits.forEach(function (h) { html += '<div class="def-item"><div class="def-nama">' + h.urutan + '. ' + escapeHtml(h.nama) + '</div><div class="def-isi">' + escapeHtml(h.definisi) + '</div></div>'; });
      el('konten').innerHTML = html;
    });
  }

  //============== WALI KELAS (Tahap 4) ==============
  function bukaMenuWali(key) {
    if (key === 'siswa') bukaKelolaSiswa();
    else if (key === 'pantau') bukaPemantauan();
    else if (key === 'validasi') bukaValidasi();
    else if (key === 'rekap') bukaRekapWali();
    else if (key === 'refsiswa') bukaRefleksiSiswa();
  }
  //Kelola siswa
  function bukaKelolaSiswa() {
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Kelola Siswa</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.siswaList', {}, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } renderKelolaSiswa(res.data); });
  }
  function renderKelolaSiswa(data) {
    var html = '<h2><span class="titik titik-kuning"></span>Kelola Siswa</h2>';
    html += '<div class="habit-row"><div class="habit-nama">Tambah Siswa</div>';
    html += '<input id="tnNisn" class="input" placeholder="NISN (6-12 digit)" inputmode="numeric">';
    html += '<input id="tnNama" class="input" style="margin-top:8px" placeholder="Nama lengkap">';
    html += '<select id="tnJk" class="input" style="margin-top:8px"><option value="">Jenis kelamin</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>';
    html += '<button id="btnTambah" class="btn btn-block">Tambah</button><p id="tnErr" class="pesan-err"></p></div>';
    html += '<div class="habit-row"><div class="habit-nama">Impor Massal</div>';
    html += '<p class="muted kecil">Tempel: <b>NISN, Nama, L/P</b> per baris (dipisah koma/tab).</p>';
    html += '<textarea id="imporTxt" class="input" rows="5" placeholder="1234567890,Andi Pratama,L&#10;1234567891,Budi,L&#10;..."></textarea>';
    html += '<button id="btnImpor" class="btn btn-block btn-ghost">Impor</button><p id="imporHasil" class="muted kecil"></p></div>';
    html += '<div class="habit-nama" style="margin-top:14px">Daftar Siswa (' + data.siswa.length + ')</div>';
    if (!data.siswa.length) html += '<p class="muted">Belum ada siswa. Tambah satu per satu atau impor massal.</p>';
    data.siswa.forEach(function (s, idx) {
      html += '<div class="siswa-item"><div class="siswa-info"><b>' + (idx + 1) + '. ' + escapeHtml(s.nama) + '</b> — ' + escapeHtml(s.nisn) + ' (' + s.jk + ')';
      html += '<br><span class="muted kecil">Isi hari ini: ' + (s.isiHariIni ? 'Ya' : 'Belum') + ' · Terakhir: ' + (s.tglTerakhir || '-') + '</span></div>';
      html += '<div class="siswa-aksi"><button class="chip" data-act="edit" data-id="' + s.id + '">Edit</button>';
      html += '<button class="chip" data-act="reset" data-id="' + s.id + '">Reset PIN</button>';
      html += '<button class="chip" data-act="nonaktif" data-id="' + s.id + '">Nonaktifkan</button></div></div>';
    });
    el('konten').innerHTML = html;
    el('btnTambah').addEventListener('click', tambahSiswa);
    el('btnImpor').addEventListener('click', imporSiswa);
    Array.prototype.forEach.call(el('konten').querySelectorAll('.siswa-aksi .chip'), function (btn) {
      btn.addEventListener('click', function () { aksiSiswa(btn.getAttribute('data-act'), btn.getAttribute('data-id')); });
    });
  }
  function tambahSiswa() {
    var nisn = el('tnNisn').value.trim(), nama = el('tnNama').value.trim(), jk = el('tnJk').value;
    setErr('tnErr', '');
    if (!/^\d{6,12}$/.test(nisn)) { setErr('tnErr', 'NISN 6-12 digit angka.'); return; }
    if (!nama) { setErr('tnErr', 'Nama wajib.'); return; }
    if (!jk) { setErr('tnErr', 'Pilih L/P.'); return; }
    setLoading('btnTambah', true);
    api('wali.siswaTambah', { nisn: nisn, nama: nama, jk: jk }, state.token).then(function (res) {
      setLoading('btnTambah', false);
      if (!res || !res.ok) { setErr('tnErr', (res && res.error) || 'Gagal.'); return; }
      toast('Siswa ditambahkan. PIN awal: ' + res.data.pin + ' (wajib ganti saat login pertama).', 'ok');
      bukaKelolaSiswa();
    });
  }
  function imporSiswa() {
    var txt = el('imporTxt').value.trim();
    var hasil = el('imporHasil');
    if (!txt) { hasil.textContent = 'Tempel data dulu.'; return; }
    var lines = txt.split(/\r?\n/), rows = [];
    lines.forEach(function (line) {
      line = line.trim(); if (!line) return;
      var parts = line.split(/[,\t]/).map(function (p) { return p.trim(); });
      if (parts.length >= 3) rows.push({ nisn: parts[0], nama: parts.slice(1, -1).join(' '), jk: parts[parts.length - 1] });
      else if (parts.length === 2) rows.push({ nisn: parts[0], nama: parts[1], jk: '' });
    });
    if (!rows.length) { hasil.textContent = 'Format tidak terbaca.'; return; }
    el('btnImpor').disabled = true;
    api('wali.siswaImpor', { rows: rows }, state.token).then(function (res) {
      el('btnImpor').disabled = false;
      if (!res || !res.ok) { hasil.textContent = (res && res.error) || 'Gagal.'; return; }
      var d = res.data;
      hasil.textContent = 'Berhasil: ' + d.sukses + '. Gagal: ' + d.errors.length + (d.errors.length ? ' — ' + d.errors.join('; ') : '');
      if (d.sukses > 0) { toast(d.sukses + ' siswa diimpor.', 'ok'); bukaKelolaSiswa(); }
    });
  }
  function aksiSiswa(act, id) {
    if (act === 'edit') {
      var nama = window.prompt('Nama baru:'); if (nama === null) return;
      var jk = window.prompt('Jenis kelamin (L/P):'); if (jk === null) return; jk = jk.toUpperCase().trim();
      api('wali.siswaEdit', { idSiswa: id, nama: nama, jk: jk }, state.token).then(function (res) { if (res && res.ok) { toast('Siswa diperbarui.', 'ok'); bukaKelolaSiswa(); } else toast((res && res.error) || 'Gagal.', 'err'); });
    } else if (act === 'reset') {
      if (!window.confirm('Reset PIN siswa ke awal? Siswa wajib ganti saat login berikutnya.')) return;
      api('wali.siswaResetPin', { idSiswa: id }, state.token).then(function (res) { if (res && res.ok) toast('PIN direset ke: ' + res.data.pin, 'ok'); else toast((res && res.error) || 'Gagal.', 'err'); });
    } else if (act === 'nonaktif') {
      if (!window.confirm('Nonaktifkan siswa ini?')) return;
      api('wali.siswaNonaktif', { idSiswa: id, aktif: false }, state.token).then(function (res) { if (res && res.ok) { toast('Siswa dinonaktifkan.', 'ok'); bukaKelolaSiswa(); } else toast((res && res.error) || 'Gagal.', 'err'); });
    }
  }
  //Pemantauan
  function bukaPemantauan() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Pemantauan Hari Ini</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.pemantauan', {}, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } renderPemantauan(res.data); });
  }
  function renderPemantauan(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Pemantauan Hari Ini</h2>';
    html += '<p class="muted kecil">Tanggal: ' + data.tanggal + ' · Total siswa: ' + data.totalSiswa + '</p>';
    html += '<div class="habit-nama">Belum mengisi hari ini (' + data.belumIsi.length + ')</div>';
    if (!data.belumIsi.length) html += '<p class="muted">Semua siswa sudah mengisi.</p>';
    data.belumIsi.forEach(function (s) { html += '<div class="siswa-item"><div class="siswa-info">' + escapeHtml(s.nama) + ' (' + escapeHtml(s.nisn) + ')</div></div>'; });
    html += '<div class="habit-nama" style="margin-top:14px">Perlu perhatian (' + data.perhatian.length + ')</div>';
    if (!data.perhatian.length) html += '<p class="muted">Tidak ada yang perlu perhatian khusus.</p>';
    data.perhatian.forEach(function (s) { html += '<div class="siswa-item"><div class="siswa-info"><b>' + escapeHtml(s.nama) + '</b><br><span class="muted kecil">' + escapeHtml(s.alasan) + '</span></div></div>'; });
    html += '<p class="muted kecil" style="margin-top:12px">Pendekatan mendukung: hubungi siswa dengan ramah, bukan menghakimi.</p>';
    el('konten').innerHTML = html;
  }
  //Validasi
  function bukaValidasi() {
    el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Validasi (Paraf Digital)</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.siswaList', {}, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.siswaListWali = res.data.siswa; state.hariIni = res.data.hariIni; renderValidasiShell(); });
  }
  function renderValidasiShell() {
    var today = state.hariIni || '';
    var html = '<h2><span class="titik titik-koral"></span>Validasi (Paraf Digital)</h2>';
    html += '<label class="label">Tanggal</label><input id="valTgl" class="input" type="date" value="' + today + '">';
    html += '<label class="label">Siswa</label><select id="valSiswa" class="input">';
    state.siswaListWali.forEach(function (s) { html += '<option value="' + s.id + '">' + escapeHtml(s.nama) + ' (' + escapeHtml(s.nisn) + ')</option>'; });
    html += '</select><button id="btnTampilVal" class="btn btn-block">Tampilkan</button><div id="valDetail"></div>';
    html += '<hr class="garis-pemisah"><div class="habit-nama">Paraf Massal</div>';
    html += '<p class="muted kecil">Tandai paraf semua siswa pada rentang tanggal, hanya untuk kebiasaan yang sudah dilakukan (v).</p>';
    html += '<label class="label">Dari</label><input id="valMulai" class="input" type="date" value="' + today + '">';
    html += '<label class="label">Sampai</label><input id="valAkhir" class="input" type="date" value="' + today + '">';
    html += '<button id="btnMassal" class="btn btn-block btn-ghost">Paraf Massal</button><p id="massalHasil" class="muted kecil"></p>';
    el('konten').innerHTML = html;
    el('btnTampilVal').addEventListener('click', tampilkanValidasi);
    el('btnMassal').addEventListener('click', massalParaf);
  }
  function tampilkanValidasi() {
    var tgl = el('valTgl').value, sid = el('valSiswa').value;
    el('valDetail').innerHTML = '<p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.validasiGet', { idSiswa: sid, tanggal: tgl }, state.token).then(function (res) { if (!res || !res.ok) { el('valDetail').innerHTML = '<p class="muted">' + escapeHtml((res && res.error) || 'Gagal') + '</p>'; return; } renderValidasiDetail(res.data); });
  }
  function renderValidasiDetail(data) {
    var j = data.jurnal, html = '<div class="habit-nama" style="margin-top:10px">' + escapeHtml(data.siswa.nama) + '</div>';
    if (!j) { html += '<p class="muted kecil">Siswa belum mengisi tanggal ini.</p>'; el('valDetail').innerHTML = html; return; }
    data.form.habits.forEach(function (h) {
      var st = (j.status && j.status['status_' + h.kode]) || '';
      var paraf = (j.validasi_guru && j.validasi_guru['status_' + h.kode]);
      html += '<div class="habit-row"><div class="habit-nama">' + escapeHtml(h.nama) + '</div><div class="vx-group">';
      html += '<span class="vx-info ' + (st === 'v' ? 'cell-v' : st === 'x' ? 'cell-x' : '') + '">' + (st === 'v' ? '✓ Dilakukan' : st === 'x' ? '✗ Belum' : '— Kosong') + '</span>';
      html += '<button class="vx ' + (paraf ? 'aktif vx-v' : '') + '" data-kode="status_' + h.kode + '">' + (paraf ? '✓ Paraf' : 'Paraf') + '</button></div></div>';
    });
    el('valDetail').innerHTML = html;
    Array.prototype.forEach.call(el('valDetail').querySelectorAll('.vx[data-kode]'), function (btn) {
      btn.addEventListener('click', function () { toggleParaf(data.siswa.id, el('valTgl').value, btn.getAttribute('data-kode')); });
    });
  }
  function toggleParaf(sid, tgl, kode) {
    api('wali.validasiSet', { idSiswa: sid, tanggal: tgl, kode: kode }, state.token).then(function (res) { if (res && res.ok) tampilkanValidasi(); else toast((res && res.error) || 'Gagal.', 'err'); });
  }
  function massalParaf() {
    var mulai = el('valMulai').value, akhir = el('valAkhir').value;
    var hasil = el('massalHasil');
    if (!mulai || !akhir) { hasil.textContent = 'Isi tanggal.'; return; }
    el('btnMassal').disabled = true;
    api('wali.validasiMassal', { mulai: mulai, akhir: akhir }, state.token).then(function (res) {
      el('btnMassal').disabled = false;
      if (res && res.ok) { hasil.textContent = res.data.baris + ' baris diperbarui.'; toast('Paraf massal selesai.', 'ok'); }
      else hasil.textContent = (res && res.error) || 'Gagal.';
    });
  }
  //Rekap
  function bukaRekapWali() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Rekap Bulanan Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.rekapBulan', { bulan: state.bulanRekap || '' }, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.bulanRekap = res.data.bulan; renderRekapWali(res.data); });
  }
  function renderRekapWali(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Rekap ' + formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="rekPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="rekNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    html += '<div class="kal-scroll"><table class="kal"><thead><tr><th>No</th><th>Nama</th><th>L/P</th>';
    data.habits.forEach(function (h) { html += '<th title="' + escapeAttr(h.nama) + '">' + escapeHtml(h.kode.substring(0, 2).toUpperCase()) + '</th>'; });
    html += '<th>Catatan Wali</th></tr></thead><tbody>';
    data.siswa.forEach(function (s, idx) {
      html += '<tr><td>' + (idx + 1) + '</td><td class="kal-nama">' + escapeHtml(s.nama) + '</td><td>' + s.jk + '</td>';
      s.perHabit.forEach(function (h) { html += '<td class="kal-cell ' + (h.kategori === 'Sudah Terbiasa' ? 'cell-v' : '') + '" title="' + escapeAttr(h.kategori) + '">' + h.hariV + '</td>'; });
      html += '<td><input class="input-catatan" data-id="' + s.id + '" value="' + escapeAttr(s.catatanWali || '') + '" placeholder="catatan…"></td></tr>';
    });
    html += '</tbody></table></div><p class="muted kecil">Angka = jumlah hari melakukan. Hijau = Sudah Terbiasa. Catatan tersimpan saat berpindah dari kolom.</p>';
    el('konten').innerHTML = html;
    el('rekPrev').addEventListener('click', function () { state.bulanRekap = geserBulan(data.bulan, -1); bukaRekapWali(); });
    el('rekNext').addEventListener('click', function () { state.bulanRekap = geserBulan(data.bulan, 1); bukaRekapWali(); });
    Array.prototype.forEach.call(el('konten').querySelectorAll('.input-catatan'), function (inp) {
      inp.addEventListener('change', function () { simpanCatatan(inp.getAttribute('data-id'), data.bulan, inp.value); });
    });
  }
  function simpanCatatan(sid, bulan, catatan) {
    api('wali.catatanSet', { idSiswa: sid, bulan: bulan, catatan: catatan }, state.token).then(function (res) { if (res && res.ok) toast('Catatan tersimpan.', 'ok'); else toast((res && res.error) || 'Gagal.', 'err'); });
  }
  //Refleksi siswa
  function bukaRefleksiSiswa() {
    el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Refleksi Siswa</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.siswaList', {}, state.token).then(function (res) { if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } state.siswaListWali = res.data.siswa; state.hariIni = res.data.hariIni; renderRefleksiSiswaShell(); });
  }
  function renderRefleksiSiswaShell() {
    var bulan = state.bulanRefSiswa || monthKeyFromYmdClient(state.hariIni);
    var html = '<h2><span class="titik titik-koral"></span>Refleksi Siswa</h2>';
    html += '<label class="label">Siswa</label><select id="refSiswa" class="input">';
    state.siswaListWali.forEach(function (s) { html += '<option value="' + s.id + '">' + escapeHtml(s.nama) + '</option>'; });
    html += '</select><label class="label">Bulan</label><input id="refBulan" class="input" type="month" value="' + bulan + '">';
    html += '<button id="btnTampilRef" class="btn btn-block">Tampilkan</button><div id="refDetail"></div>';
    el('konten').innerHTML = html;
    el('btnTampilRef').addEventListener('click', tampilkanRefleksiSiswa);
  }
  function tampilkanRefleksiSiswa() {
    var sid = el('refSiswa').value, bulan = el('refBulan').value || monthKeyFromYmdClient(state.hariIni);
    state.bulanRefSiswa = bulan;
    el('refDetail').innerHTML = '<p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('wali.refleksiSiswaGet', { idSiswa: sid, bulan: bulan }, state.token).then(function (res) {
      if (!res || !res.ok) { el('refDetail').innerHTML = '<p class="muted">' + escapeHtml((res && res.error) || 'Gagal') + '</p>'; return; }
      var d = res.data, html = '<div class="habit-nama" style="margin-top:10px">' + escapeHtml(d.siswa.nama) + '</div>';
      if (!d.isi || !Object.keys(d.isi).length) html += '<p class="muted kecil">Siswa belum mengisi refleksi bulan ini.</p>';
      d.habits.forEach(function (h) {
        var item = d.isi[h.kode] || {};
        html += '<div class="ref-item"><div class="ref-nama">' + escapeHtml(h.nama) + '</div>';
        html += '<p class="muted kecil"><b>Kesimpulan:</b> ' + escapeHtml(item.kesimpulan || '-') + '</p>';
        html += '<p class="muted kecil"><b>Tindak lanjut:</b> ' + escapeHtml(item.tindakLanjut || '-') + '</p></div>';
      });
      if (d.catatanWali) html += '<div class="card-mini"><b>Catatan Anda:</b> ' + escapeHtml(d.catatanWali) + '</div>';
      el('refDetail').innerHTML = html;
    });
  }

  //--- Menu per peran ---
  var MENU = {
    siswa: [
      { key: 'isi', label: 'Isi Hari Ini', catatan: 'Tahap 3.' },
      { key: 'kalender', label: 'Kalender Bulanan', catatan: 'Tahap 3.' },
      { key: 'ringkasan', label: 'Ringkasan Bulan', catatan: 'Tahap 3.' },
      { key: 'refleksi', label: 'Refleksi Bulanan', catatan: 'Tahap 3.' },
      { key: 'definisi', label: 'Definisi 7 Kebiasaan', catatan: 'Tahap 3.' }
    ],
    wali: [
      { key: 'siswa', label: 'Kelola Siswa', catatan: 'Tahap 4.' },
      { key: 'pantau', label: 'Pemantauan Hari Ini', catatan: 'Tahap 4.' },
      { key: 'validasi', label: 'Validasi (Paraf)', catatan: 'Tahap 4.' },
      { key: 'rekap', label: 'Rekap Bulanan', catatan: 'Tahap 4.' },
      { key: 'refsiswa', label: 'Refleksi Siswa', catatan: 'Tahap 4.' }
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
    api('system.status').then(function (res) {
      if (res && res.ok && res.data) {
        if (res.data.namaAplikasi) el('judul').textContent = res.data.namaAplikasi;
        if (res.data.sambutan) el('sambutan').textContent = res.data.sambutan;
        if (res.data.namaSekolah) el('sekolahInfo').textContent = res.data.namaSekolah;
        state.hariIni = res.data.tanggalServer;
      }
    });
    var token = getToken();
    if (token) {
      api('auth.status', {}, token).then(function (res) {
        if (res && res.ok && res.data && res.data.login) {
          state.token = token; state.peran = res.data.peran; state.nama = res.data.nama; state.id_kelas = res.data.id_kelas || ''; state.harusGantiPin = res.data.harusGantiPin;
          if (state.harusGantiPin) { showLayar('layar-ganti'); el('gpLama').focus(); }
          else masukApp();
        } else { saveToken(null); showLayar('layar-login'); el('loginId').focus(); }
      });
    } else { showLayar('layar-login'); el('loginId').focus(); }
  });
})();
