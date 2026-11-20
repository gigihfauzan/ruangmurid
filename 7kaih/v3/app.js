// app.js — Tahap 3: login, ganti PIN, kerangka app per peran, layar siswa penuh.
(function () {
  'use strict';

  var state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false,
                tanggalIsi: '', bulanKal: '', bulanRing: '', bulanRef: '', hariIni: '' };

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
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function labelPeran(p) {
    return { admin: 'Admin Utama', wali: 'Wali Kelas', siswa: 'Siswa', pembaca: 'Pembaca (Kepsek/BK)' }[p] || p;
  }

  //--- Date helper (klien) ---
  function addDaysYmdClient(ymd, n) {
    var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function formatTglPendek(ymd) {
    var nh = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    var p = ymd.split('-'); var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return nh[d.getDay()] + ', ' + Number(p[2]);
  }
  function formatBulan(bulan) {
    var nb = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var p = bulan.split('-');
    return nb[Number(p[1]) - 1] + ' ' + p[0];
  }
  function geserBulan(bulan, delta) {
    var p = bulan.split('-'); var y = Number(p[0]); var m = Number(p[1]) + delta;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    return y + '-' + ('0' + m).slice(-2);
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
      state.token = d.token; state.peran = d.peran; state.nama = d.nama; state.id_kelas = d.id_kelas || '';
      state.harusGantiPin = d.harusGantiPin;
      state.tanggalIsi = ''; state.bulanKal = ''; state.bulanRing = ''; state.bulanRef = '';
      saveToken(d.token);
      el('loginPin').value = '';
      if (d.harusGantiPin) { showLayar('layar-ganti'); el('gpLama').focus(); toast('PIN pertama wajib diganti.', 'err'); }
      else masukApp();
    });
  }

  //--- GANTI PIN ---
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
    Array.prototype.forEach.call(el('nav').querySelectorAll('.nav-item'), function (b) { b.classList.remove('aktif'); });
    var cur = el('nav').querySelector('[data-key="' + key + '"]');
    if (cur) cur.classList.add('aktif');
    if (state.peran === 'siswa') { bukaMenuSiswa(key); return; }
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>' + escapeHtml(m.label) + '</h2><p class="muted">' + escapeHtml(m.catatan) + '</p>';
  }
  function bukaMenuSiswa(key) {
    if (key === 'isi') bukaIsiHariIni();
    else if (key === 'kalender') bukaKalender();
    else if (key === 'ringkasan') bukaRingkasan();
    else if (key === 'refleksi') bukaRefleksi();
    else if (key === 'definisi') bukaDefinisi();
  }
  function tampilkanBeranda() {
    if (state.peran === 'siswa') {
      el('konten').innerHTML =
        '<h2><span class="titik titik-hijau"></span>Halo, ' + escapeHtml(state.nama) + '!</h2>' +
        '<p class="muted">Tekan <b>Isi Hari Ini</b> untuk mengisi catatan harianmu.</p>' +
        '<div id="stikerBox"></div>';
      api('siswa.stiker', {}, state.token).then(function (res) {
        if (!res || !res.ok || !res.data) return;
        var d = res.data;
        var html = '';
        if (d.lengkapHariIni) {
          html += '<div class="stiker stiker-bintang"><div class="stiker-cap">' + d.rentetan + '</div>' +
            '<div><b>7 Kebiasaan lengkap hari ini!</b><br>Rentetan: ' + d.rentetan + ' hari berturut-turut. Pertahankan!</div></div>';
        } else {
          html += '<div class="stiker"><div class="stiker-cap">?</div><div>Ayo lengkapi 7 kebiasaan hari ini!</div></div>';
        }
        el('stikerBox').innerHTML = html;
      });
    } else {
      el('konten').innerHTML =
        '<h2><span class="titik titik-hijau"></span>Selamat datang!</h2>' +
        '<p class="muted">Hai <b>' + escapeHtml(state.nama) + '</b>, Anda masuk sebagai <b>' + labelPeran(state.peran) + '</b>. ' +
        'Pilih menu di bawah. Fitur akan aktif bertahap pada tahap berikutnya.</p>';
    }
  }

  //--- LOGOUT ---
  function logout() {
    api('auth.logout', {}, state.token).then(function () {
      state = { token: null, peran: null, nama: null, id_kelas: '', harusGantiPin: false,
                tanggalIsi: '', bulanKal: '', bulanRing: '', bulanRef: '', hariIni: '' };
      saveToken(null);
      el('loginId').value = ''; el('loginPin').value = '';
      showLayar('layar-login');
      el('loginId').focus();
      toast('Anda telah keluar.');
    });
  }

  //================ SISWA: ISI HARI INI ================
  function bukaIsiHariIni() {
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.jurnalHari', { tanggal: state.tanggalIsi || '' }, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      state.tanggalIsi = res.data.tanggal;
      renderIsiHariIni(res.data);
    });
  }
  function renderField(f, val) {
    var id = 'field_' + f.kode;
    var lab = '<label class="label kecil-label" for="' + id + '">' + escapeHtml(f.label) + (f.wajib ? ' *' : '') + '</label>';
    if (f.tipe === 'jam') return lab + '<input id="' + id + '" class="input" type="time" value="' + escapeAttr(val) + '">';
    if (f.tipe === 'angka') return lab + '<input id="' + id + '" class="input" type="number" inputmode="numeric" value="' + escapeAttr(val) + '">';
    if (f.tipe === 'teks_panjang') return lab + '<textarea id="' + id + '" class="input" rows="3">' + escapeHtml(val) + '</textarea>';
    if (f.tipe === 'pilihan') {
      var opts = (f.opsi && f.opsi.pilihan) || [];
      var o = '<option value="">— pilih —</option>';
      opts.forEach(function (op) { o += '<option value="' + escapeAttr(op) + '"' + (op === val ? ' selected' : '') + '>' + escapeHtml(op) + '</option>'; });
      return lab + '<select id="' + id + '" class="input">' + o + '</select>';
    }
    return lab + '<input id="' + id + '" class="input" type="text" value="' + escapeAttr(val) + '">';
  }
  function renderIsiHariIni(data) {
    var j = data.jurnal;
    var form = data.form;
    var status = (j && j.status) || {};
    var jawaban = (j && j.jawaban_tambahan) || {};
    var html = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2>';

    //Chip tanggal
    html += '<div class="chip-row">';
    for (var k = data.batasMundur; k >= 0; k--) {
      var tgl = addDaysYmdClient(data.hariIni, -k);
      html += '<button class="chip' + (tgl === data.tanggal ? ' aktif' : '') + '" data-tgl="' + tgl + '">' + formatTglPendek(tgl) + '</button>';
    }
    html += '</div>';
    if (!data.editable) html += '<p class="muted kecil">Tanggal ini hanya untuk dilihat (tidak bisa diisi ulang).</p>';

    form.habits.forEach(function (h) {
      var st = status['status_' + h.kode] || '';
      html += '<div class="habit-row">';
      html += '<div class="habit-nama">' + escapeHtml(h.nama) + '</div>';
      html += '<div class="vx-group">';
      html += '<button class="vx vx-v' + (st === 'v' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="v">&#10003; Sudah</button>';
      html += '<button class="vx vx-x' + (st === 'x' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="x">&#10007; Belum</button>';
      html += '</div>';
      var extras = (form.fields || []).filter(function (f) { return f.id_kebiasaan === h.id && f.kode !== 'status_' + h.kode; });
      extras.forEach(function (f) {
        var val = '';
        if (f.kode === 'jam_bangun') val = (j && j.jam_bangun) || '';
        else if (f.kode === 'jam_tidur') val = (j && j.jam_tidur) || '';
        else val = jawaban[f.kode] || '';
        html += renderField(f, val);
      });
      html += '</div>';
    });

    html += '<label class="cek"><input type="checkbox" id="ortuChk"' + (j && j.diketahui_ortu ? ' checked' : '') + '> Diketahui orang tua/wali</label>';
    html += '<button id="btnSimpanIsi" class="btn btn-block"' + (data.editable ? '' : ' disabled') + '>Simpan</button>';
    html += '<p id="isiErr" class="pesan-err"></p>';
    el('konten').innerHTML = html;

    Array.prototype.forEach.call(el('konten').querySelectorAll('.chip'), function (c) {
      c.addEventListener('click', function () { state.tanggalIsi = c.getAttribute('data-tgl'); bukaIsiHariIni(); });
    });
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
    data.form.habits.forEach(function (h) {
      var sel = el('konten').querySelector('.vx[data-kode="' + h.kode + '"].aktif');
      status['status_' + h.kode] = sel ? sel.getAttribute('data-val') : '';
    });
    (data.form.fields || []).forEach(function (f) {
      if (f.kode.indexOf('status_') === 0) return;
      var node = el('field_' + f.kode);
      if (!node) return;
      var v = node.value;
      if (f.kode === 'jam_bangun') jamBangun = v;
      else if (f.kode === 'jam_tidur') jamTidur = v;
      else jawaban[f.kode] = v;
    });
    var ortu = el('ortuChk').checked;
    setErr('isiErr', '');
    setLoading('btnSimpanIsi', true);
    api('siswa.simpanJurnal', {
      tanggal: state.tanggalIsi, status: status, jamBangun: jamBangun, jamTidur: jamTidur,
      jawabanTambahan: jawaban, diketahuiOrtu: ortu
    }, state.token).then(function (res) {
      setLoading('btnSimpanIsi', false);
      if (!res || !res.ok) { setErr('isiErr', (res && res.error) || 'Gagal menyimpan.'); return; }
      toast('Tersimpan! Kerja bagus.', 'ok');
      api('siswa.stiker', {}, state.token).then(function (r) {
        if (r && r.ok && r.data && r.data.lengkapHariIni) {
          toast('Luar biasa! 7 kebiasaan lengkap. Rentetan: ' + r.data.rentetan + ' hari.', 'ok');
        }
      });
      bukaIsiHariIni();
    });
  }

  //================ SISWA: KALENDER ================
  function bukaKalender() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.kalender', { bulan: state.bulanKal || '' }, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      state.bulanKal = res.data.bulan;
      renderKalender(res.data);
    });
  }
  function renderKalender(data) {
    var total = data.totalHari;
    var html = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="kalPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="kalNext">&raquo;</button></div>';
    html += '<div class="kal-scroll"><table class="kal"><thead><tr><th>Kebiasaan</th>';
    for (var d = 1; d <= total; d++) html += '<th>' + d + '</th>';
    html += '</tr></thead><tbody>';
    data.habits.forEach(function (h) {
      html += '<tr><td class="kal-nama">' + escapeHtml(h.nama) + '</td>';
      for (var d2 = 1; d2 <= total; d2++) {
        var tgl = data.bulan + '-' + ('0' + d2).slice(-2);
        var pt = data.perTanggal[tgl];
        var st = pt && pt.status ? (pt.status['status_' + h.kode] || '') : '';
        html += '<td class="kal-cell ' + (st === 'v' ? 'cell-v' : st === 'x' ? 'cell-x' : '') + '">' + (st === 'v' ? '&#10003;' : st === 'x' ? '&#10007;' : '') + '</td>';
      }
      html += '</tr>';
    });
    //Jam bangun
    html += '<tr><td class="kal-nama">Jam Bangun</td>';
    for (var d3 = 1; d3 <= total; d3++) { var t3 = data.bulan + '-' + ('0' + d3).slice(-2); var p3 = data.perTanggal[t3]; html += '<td class="kal-cell kecil">' + (p3 && p3.jamBangun ? escapeHtml(p3.jamBangun) : '') + '</td>'; }
    html += '</tr>';
    //Jam tidur
    html += '<tr><td class="kal-nama">Jam Tidur</td>';
    for (var d4 = 1; d4 <= total; d4++) { var t4 = data.bulan + '-' + ('0' + d4).slice(-2); var p4 = data.perTanggal[t4]; html += '<td class="kal-cell kecil">' + (p4 && p4.jamTidur ? escapeHtml(p4.jamTidur) : '') + '</td>'; }
    html += '</tr>';
    //Paraf
    html += '<tr><td class="kal-nama">Paraf</td>';
    for (var d5 = 1; d5 <= total; d5++) { var t5 = data.bulan + '-' + ('0' + d5).slice(-2); var p5 = data.perTanggal[t5]; var pr = p5 ? p5.paraf : 0; html += '<td class="kal-cell' + (pr ? ' paraf' : '') + '">' + (pr ? pr : '') + '</td>'; }
    html += '</tr>';
    html += '</tbody></table></div>';
    html += '<p class="muted kecil">&#10003; = dilakukan, &#10007; = belum. Angka di baris Paraf = jumlah kebiasaan yang divalidasi guru.</p>';
    el('konten').innerHTML = html;
    el('kalPrev').addEventListener('click', function () { state.bulanKal = geserBulan(data.bulan, -1); bukaKalender(); });
    el('kalNext').addEventListener('click', function () { state.bulanKal = geserBulan(data.bulan, 1); bukaKalender(); });
  }

  //================ SISWA: RINGKASAN ================
  function bukaRingkasan() {
    el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Ringkasan Bulan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.ringkasan', { bulan: state.bulanRing || '' }, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      state.bulanRing = res.data.bulan;
      renderRingkasan(res.data);
    });
  }
  function renderRingkasan(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Ringkasan ' + formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="ringPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="ringNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    data.perHabit.forEach(function (h) {
      var badge = h.kategori === 'Sudah Terbiasa' ? 'badge-ok' : 'badge-belum';
      html += '<div class="ring-item"><div class="ring-nama">' + escapeHtml(h.nama) + '</div>';
      html += '<div class="ring-bar"><div class="ring-fill" style="width:' + h.persen + '%"></div></div>';
      html += '<div class="ring-meta">' + h.hariV + '/' + h.totalHari + ' hari &middot; ' + h.persen + '% <span class="badge ' + badge + '">' + h.kategori + '</span></div></div>';
    });
    html += '<div class="card-mini"><b>Rata-rata durasi tidur:</b> ' + (data.avgDurasiTidurJam ? data.avgDurasiTidurJam + ' jam' : 'belum ada data') + ' (dari ' + data.jumlahHariTidurLengkap + ' hari lengkap).</div>';
    el('konten').innerHTML = html;
    el('ringPrev').addEventListener('click', function () { state.bulanRing = geserBulan(data.bulan, -1); bukaRingkasan(); });
    el('ringNext').addEventListener('click', function () { state.bulanRing = geserBulan(data.bulan, 1); bukaRingkasan(); });
  }

  //================ SISWA: REFLEKSI ================
  function bukaRefleksi() {
    el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Refleksi Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.refleksiGet', { bulan: state.bulanRef || '' }, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      state.bulanRef = res.data.bulan;
      renderRefleksi(res.data);
    });
  }
  function renderRefleksi(data) {
    var html = '<h2><span class="titik titik-koral"></span>Refleksi ' + formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="refPrev">&laquo;</button><span>' + formatBulan(data.bulan) + '</span><button class="chip" id="refNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Isi bersama orang tua/wali di akhir bulan.</p>';
    data.habits.forEach(function (h) {
      var item = (data.isi && data.isi[h.kode]) || {};
      html += '<div class="ref-item"><div class="ref-nama">' + escapeHtml(h.nama) + '</div>';
      html += '<label class="label kecil-label">Kesimpulan / Refleksi</label>';
      html += '<textarea id="ref_' + h.kode + '_k" class="input" rows="2">' + escapeHtml(item.kesimpulan || '') + '</textarea>';
      html += '<label class="label kecil-label">Tindak Lanjut</label>';
      html += '<textarea id="ref_' + h.kode + '_t" class="input" rows="2">' + escapeHtml(item.tindakLanjut || '') + '</textarea></div>';
    });
    if (data.catatanWali) html += '<div class="card-mini"><b>Catatan Wali Kelas:</b> ' + escapeHtml(data.catatanWali) + '</div>';
    html += '<button id="btnSimpanRef" class="btn btn-block">Simpan Refleksi</button>';
    html += '<p id="refErr" class="pesan-err"></p>';
    el('konten').innerHTML = html;
    el('refPrev').addEventListener('click', function () { state.bulanRef = geserBulan(data.bulan, -1); bukaRefleksi(); });
    el('refNext').addEventListener('click', function () { state.bulanRef = geserBulan(data.bulan, 1); bukaRefleksi(); });
    el('btnSimpanRef').addEventListener('click', function () { simpanRefleksi(data); });
  }
  function simpanRefleksi(data) {
    var isi = {};
    data.habits.forEach(function (h) {
      var k = el('ref_' + h.kode + '_k'), t = el('ref_' + h.kode + '_t');
      isi[h.kode] = { kesimpulan: k ? k.value : '', tindakLanjut: t ? t.value : '' };
    });
    setLoading('btnSimpanRef', true);
    api('siswa.refleksiSimpan', { bulan: data.bulan, isi: isi }, state.token).then(function (res) {
      setLoading('btnSimpanRef', false);
      if (!res || !res.ok) { setErr('refErr', (res && res.error) || 'Gagal menyimpan.'); return; }
      toast('Refleksi tersimpan.', 'ok');
    });
  }

  //================ SISWA: DEFINISI ================
  function bukaDefinisi() {
    el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    api('siswa.definisi', {}, state.token).then(function (res) {
      if (!res || !res.ok) { el('konten').innerHTML = '<p class="muted">Gagal memuat.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2>';
      res.data.habits.forEach(function (h) {
        html += '<div class="def-item"><div class="def-nama">' + h.urutan + '. ' + escapeHtml(h.nama) + '</div>' +
          '<div class="def-isi">' + escapeHtml(h.definisi) + '</div></div>';
      });
      el('konten').innerHTML = html;
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
      //Layar Memuat sudah tampil (default). Verifikasi sesi.
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
