/** student.js — halaman siswa: Hari Ini, Kalender, Ringkasan, Refleksi, Stiker, Panduan. */

const STUDENT_VIEWS = {
  'hari-ini': viewFill, kalender: viewCalendar, ringkasan: viewSummary,
  refleksi: viewReflection, stiker: viewStickers, panduan: viewGuidePage
};

/* ---------- Pembantu ---------- */
function loading() { return h('div', { class: 'center-block' }, h('div', { class: 'spinner' }), h('p', {}, 'Memuat…')); }

function errorBlock(msg, retry) {
  return h('div', { class: 'card center' },
    h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '📡'),
    h('p', { class: 'form-msg' }, msg),
    retry ? h('button', { type: 'button', class: 'btn', style: 'max-width:240px;margin:0 auto', onclick: retry }, 'Coba lagi') : null);
}

function pad2(n) { return ('0' + n).slice(-2); }
function dateOf(ym, d) { return ym + '-' + pad2(d); }
function weekdayOf(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]).getDay(); }
function monthLabel(ym) {
  const p = ym.split('-').map(Number);
  try { return new Date(p[0], p[1] - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); } catch (e) { return ym; }
}
function addMonth(ym, delta) {
  const p = ym.split('-').map(Number), d = new Date(p[0], p[1] - 1 + delta, 1);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}
function shortDate(s) {
  const p = s.split('-').map(Number);
  try { return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return s; }
}
function habitLook(id) { return HABITS.filter(function (x) { return x.id === id; })[0] || { emoji: '⭐', c: '#64748b' }; }
function applyLook(el, c) {
  el.style.setProperty('--c', c);
  el.style.setProperty('--c-soft', Color.soft(c));
  el.style.setProperty('--c-ink', Color.ink(c));
}
function fmtDuration(min) { return Math.floor(min / 60) + ' jam ' + pad2(min % 60) + ' menit'; }

/** Draf isian di perangkat. Bila penyimpanan tidak tersedia, aplikasi tetap berjalan. */
const Draft = {
  key: function (id, d) { return 'kaih_draft_' + id + '_' + d; },
  load: function (id, d) { try { const s = localStorage.getItem(this.key(id, d)); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  save: function (id, d, obj) { try { localStorage.setItem(this.key(id, d), JSON.stringify(obj)); } catch (e) {} },
  clear: function (id, d) { try { localStorage.removeItem(this.key(id, d)); } catch (e) {} }
};

function monthNav(month, today, onChange) {
  const cur = today.substring(0, 7);
  return h('div', { class: 'month-nav' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bulan sebelumnya', onclick: function () { onChange(addMonth(month, -1)); } }, '‹'),
    h('strong', { class: 'month-title' }, monthLabel(month)),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Bulan berikutnya', disabled: month >= cur, onclick: function () { onChange(addMonth(month, 1)); } }, '›'));
}

/** Kerangka halaman bulanan: navigasi bulan + satu pemanggilan bulan_data. */
function monthView(settings, title, renderFn) {
  const root = h('section', {});
  let month = (settings.hari_ini || '').substring(0, 7);
  function load() {
    const nav = monthNav(month, settings.hari_ini, function (m) { month = m; load(); });
    setChildren(root, h('h1', { class: 'page-title' }, title), nav, loading());
    Api.call('bulan_data', { bulan: month }, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(root, h('h1', { class: 'page-title' }, title), nav, errorBlock(res.error.pesan, load)); return; }
      setChildren(root, h('h1', { class: 'page-title' }, title), nav, renderFn(res.data, load));
    });
  }
  load();
  return root;
}

/* ---------- Isi Hari Ini ---------- */
function fieldControl(f, cur, onChange) {
  const id = 'fld-' + f.id_field;
  const get = function () { return f.simpan_di === 'jam_bangun' ? cur.jb : (f.simpan_di === 'jam_tidur' ? cur.jt : (cur.ex[f.id_field] || '')); };
  const set = function (v) {
    if (f.simpan_di === 'jam_bangun') cur.jb = v; else if (f.simpan_di === 'jam_tidur') cur.jt = v; else cur.ex[f.id_field] = v;
    onChange();
  };
  let input, evt = 'input';
  if (f.tipe === 'jam') input = h('input', { class: 'input', id: id, type: 'time', step: '60' });
  else if (f.tipe === 'angka') input = h('input', { class: 'input', id: id, type: 'number', inputmode: 'decimal', min: '0' });
  else if (f.tipe === 'pilihan') {
    input = h('select', { class: 'input', id: id }, h('option', { value: '' }, 'Pilih…'), f.opsi.map(function (o) { return h('option', { value: o }, o); }));
    evt = 'change';
  } else if (f.tipe === 'teks_panjang') input = h('textarea', { class: 'input', id: id, rows: '3', maxlength: '500' });
  else if (f.tipe === 'centang') { input = h('input', { type: 'checkbox', id: id, class: 'chk' }); evt = 'change'; }
  else input = h('input', { class: 'input', id: id, maxlength: '100' });
  if (f.tipe === 'centang') input.checked = get() === 'v'; else input.value = get();
  input.addEventListener(evt, function () { set(f.tipe === 'centang' ? (input.checked ? 'v' : 'x') : input.value); });
  return field(f.label + (f.wajib ? ' *' : ''), id, input, f.petunjuk);
}

function celebrate(r) {
  if (r.lengkap) {
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    const em = ['🎉', '⭐', '✨', '🌈', '💛', '🎊'];
    for (let i = 0; i < 28; i++) {
      const s = h('span', {}, em[i % em.length]);
      s.style.left = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 1.2) + 's';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4500);
    let m;
    const body = h('div', { class: 'center' },
      h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🌈'),
      h('p', { class: 'lead' }, 'Semua kebiasaan hari ini terlaksana. Kamu luar biasa!'),
      h('button', { type: 'button', class: 'btn', onclick: function () { m.close(); } }, 'Terima kasih!'));
    m = openModal('Hari yang lengkap! 🎉', body);
    return;
  }
  let msg;
  if (r.jumlah_v === 0) msg = 'Tersimpan. Terima kasih sudah jujur mencatat. Besok kita coba lagi ya! 🌤️';
  else if (r.jumlah_v * 2 < r.jumlah_total) msg = 'Tersimpan! Setiap langkah kecil berarti. Kamu melakukan ' + r.jumlah_v + ' kebiasaan hari ini 💪';
  else msg = 'Tersimpan! Bagus, ' + r.jumlah_v + ' dari ' + r.jumlah_total + ' kebiasaan terlaksana. Terus semangat! 🌟';
  Toast.show(msg, 'ok');
}

function viewFill(profile, settings) {
  const root = h('section', {});
  let info = null, selected = null;
  const edits = {};

  function blank() { return { s: {}, jb: '', jt: '', ex: {}, ortu: false }; }
  function editFor(d) {
    if (!edits[d]) {
      const saved = info.entri[d], draft = Draft.load(profile.id, d);
      if (draft && draft.s) edits[d] = draft;
      else if (saved) edits[d] = { s: Object.assign({}, saved.s), jb: saved.jb || '', jt: saved.jt || '', ex: Object.assign({}, saved.ex), ortu: !!saved.ortu };
      else edits[d] = blank();
    }
    return edits[d];
  }

  function load() {
    setChildren(root, loading());
    Api.call('isi_info', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(root, errorBlock(res.error.pesan, load)); return; }
      info = res.data;
      if (!info.tanggal.length) {
        setChildren(root, h('div', { class: 'card center' }, h('div', { class: 'big-emoji' }, '📅'),
          h('p', { class: 'lead' }, 'Hari ini belum termasuk periode tahun ajaran yang aktif. Hubungi wali kelas ya.')));
        return;
      }
      if (!selected || info.tanggal.indexOf(selected) < 0) selected = info.tanggal[0];
      draw();
    });
  }

  function draw() {
    const form = info.form, rules = info.aturan, cur = editFor(selected), paints = [];
    const progText = h('span', {}), progBar = h('span', {});
    const autoOn = function (k) { return k.kode === 'bangun_pagi' && rules.bangun_mode === 'otomatis'; };
    const autoStatus = function () { return cur.jb ? ((cur.jb >= rules.bangun_awal && cur.jb <= rules.bangun_akhir) ? 'v' : 'x') : ''; };
    const statusOf = function (k) { return autoOn(k) ? autoStatus() : (cur.s[k.id] || ''); };

    function refreshProgress() {
      let answered = 0, done = 0;
      form.kebiasaan.forEach(function (k) { const v = statusOf(k); if (v) answered++; if (v === 'v') done++; });
      progText.textContent = 'Sudah dicatat ' + answered + ' dari ' + form.kebiasaan.length + ' · Dilakukan ' + done;
      progBar.style.width = (form.kebiasaan.length ? Math.round(answered * 100 / form.kebiasaan.length) : 0) + '%';
    }
    function changed() {
      Draft.save(profile.id, selected, cur);
      paints.forEach(function (p) { p(); });
      refreshProgress();
    }

    function fillCard(k) {
      const look = habitLook(k.id), auto = autoOn(k), saved = info.entri[selected];
      const bV = h('button', { type: 'button', class: 'choice-btn yes' }, '✔ Sudah');
      const bX = h('button', { type: 'button', class: 'choice-btn no' }, '✖ Belum');
      function paint() {
        const v = statusOf(k);
        bV.classList.toggle('on', v === 'v'); bX.classList.toggle('on', v === 'x');
        bV.setAttribute('aria-pressed', String(v === 'v')); bX.setAttribute('aria-pressed', String(v === 'x'));
      }
      function pick(v) { cur.s[k.id] = (cur.s[k.id] === v) ? '' : v; changed(); }
      if (auto) { bV.disabled = true; bX.disabled = true; }
      else { bV.addEventListener('click', function () { pick('v'); }); bX.addEventListener('click', function () { pick('x'); }); }
      paints.push(paint); paint();
      const own = form.fields.filter(function (f) { return f.id_kebiasaan === k.id; }).map(function (f) { return fieldControl(f, cur, changed); });
      const card = h('div', { class: 'fill-card' },
        h('div', { class: 'fill-head' },
          h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), h('span', {}, k.nama),
          (saved && saved.val && saved.val[k.id]) ? h('span', { class: 'tag ok' }, '✍️ Diparaf') : null),
        h('div', { class: 'choice' }, bV, bX),
        auto ? h('p', { class: 'field-hint' }, 'Dihitung otomatis dari jam bangun (' + rules.bangun_awal.replace(':', '.') + '–' + rules.bangun_akhir.replace(':', '.') + ').') : null,
        h('div', { class: 'fields' }, own),
        k.deskripsi ? h('details', { class: 'about' }, h('summary', {}, 'Apa ini?'), h('p', {}, k.deskripsi)) : null);
      applyLook(card, look.c);
      return card;
    }

    async function save() {
      const res = await Api.call('isi_simpan', {
        tanggal: selected, status: cur.s, jam_bangun: cur.jb, jam_tidur: cur.jt, tambahan: cur.ex, diketahui_ortu: cur.ortu
      }, { retries: 3 });
      if (!res.ok) { Toast.show(res.error.pesan, 'err'); return; }
      info.entri[selected] = Object.assign({}, info.entri[selected] || {}, res.data.entri);
      Draft.clear(profile.id, selected);
      delete edits[selected];
      celebrate(res.data);
      draw();
    }

    const kelas = info.kelas ? 'Kelas ' + info.kelas : '';
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Pilih tanggal' }, info.tanggal.map(function (d, i) {
      const label = i === 0 ? 'Hari ini' : (i === 1 ? 'Kemarin' : shortDate(d));
      return h('button', { type: 'button', class: 'chip-btn', 'aria-pressed': String(d === selected), onclick: function () { selected = d; draw(); } },
        label + (info.entri[d] ? ' ✓' : ''));
    }));
    const habitIds = form.kebiasaan.map(function (k) { return k.id; });
    const general = form.fields.filter(function (f) { return !f.id_kebiasaan || habitIds.indexOf(f.id_kebiasaan) < 0; })
      .map(function (f) { return fieldControl(f, cur, changed); });
    const ortuBox = h('input', { type: 'checkbox', id: 'f-ortu', class: 'chk' });
    ortuBox.checked = !!cur.ortu;
    ortuBox.addEventListener('change', function () { cur.ortu = ortuBox.checked; changed(); });
    const saveBtn = h('button', { type: 'button', class: 'btn', disabled: !info.jendela.buka }, 'Simpan catatan');
    saveBtn.addEventListener('click', function () { runBusy(saveBtn, 'Menyimpan…', save); });

    setChildren(root,
      h('div', { class: 'hero-card' },
        h('p', { class: 'hero-date' }, formatDate(selected)),
        h('h1', {}, selected === info.hari_ini ? 'Halo, ' + firstName(profile.nama) + '! 👋' : 'Mengisi catatan ' + shortDate(selected)),
        h('p', {}, settings.teks_sambutan),
        kelas ? h('span', { class: 'pill' }, kelas) : null),
      info.pengumuman.map(function (a) { return h('div', { class: 'banner info' }, h('strong', {}, '📣 ' + a.judul), a.isi ? h('div', {}, a.isi) : null); }),
      h('h2', { class: 'section-title' }, 'Pilih tanggal'), chips,
      info.jendela.buka ? null : h('div', { class: 'banner' }, '🕐 ' + info.jendela.pesan),
      h('div', { class: 'progress-wrap' }, h('div', { class: 'progress' }, progBar), h('p', { class: 'field-hint' }, progText)),
      form.kebiasaan.map(fillCard),
      general.length ? h('div', { class: 'card' }, h('h2', { class: 'section-title', style: 'margin-top:0' }, 'Catatan tambahan'), h('div', { class: 'fields' }, general)) : null,
      h('label', { class: 'ortu', for: 'f-ortu' }, ortuBox,
        h('span', {}, '👪 Orang tua/wali sudah mengetahui catatan ini' + (rules.ortu_wajib ? ' (wajib)' : ''))),
      saveBtn,
      h('p', { class: 'field-hint center-text' }, 'Belum lengkap? Tidak apa-apa, simpan dulu dan lengkapi nanti. Catatan di hari yang sama akan diperbarui.'));
    paints.forEach(function (p) { p(); });
    refreshProgress();
  }

  load();
  return root;
}

/* ---------- Kalender bulanan (meniru lembar kertas resmi) ---------- */
function openDayDetail(date, data) {
  const e = data.entri[date], body = h('div', { class: 'detail' });
  const row = function (a, b) { return h('div', { class: 'drow' }, h('span', {}, a), h('strong', {}, b)); };
  if (!e) {
    body.appendChild(h('p', {}, 'Belum ada catatan untuk tanggal ini.'));
  } else {
    const old = (e.versi && e.versi !== data.form.versi) ? data.versi_lama[e.versi] : null;
    const habits = old ? old.kebiasaan : data.form.kebiasaan, fields = old ? old.fields : data.form.fields;
    habits.forEach(function (k) {
      const v = e.s[k.id];
      body.appendChild(row(habitLook(k.id).emoji + ' ' + k.nama, v === 'v' ? 'Dilakukan ✓' : (v === 'x' ? 'Belum ✕' : '—')));
    });
    if (e.jb) body.appendChild(row('Jam bangun', e.jb));
    if (e.jt) body.appendChild(row('Jam tidur', e.jt));
    fields.forEach(function (f) { if (f.id_field !== 'jam_bangun' && f.id_field !== 'jam_tidur' && e.ex[f.id_field]) body.appendChild(row(f.label, e.ex[f.id_field])); });
    body.appendChild(row('Diketahui orang tua/wali', e.ortu ? '👪 Ya' : 'Belum'));
    const nPar = Object.keys(e.val || {}).length;
    if (nPar) body.appendChild(row('Paraf guru', '✍️ ' + nPar + ' kebiasaan'));
  }
  openModal(formatDate(date), body);
}

function renderCalendar(data) {
  const n = data.hari_dalam_bulan, month = data.bulan, lib = {}, cnt = {}, days = [];
  data.libur.forEach(function (d) { lib[d] = true; });
  data.dihitung.forEach(function (d) { cnt[d] = true; });
  for (let d = 1; d <= n; d++) days.push(dateOf(month, d));
  const wk = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
  const thCls = function (s) {
    let c = 'day'; const w = weekdayOf(s);
    if (w === 0 || w === 6) c += ' wkend';
    if (lib[s]) c += ' libur';
    if (s === data.hari_ini) c += ' today';
    return c;
  };
  const head = h('tr', {}, h('th', { class: 'stick' }, 'Kebiasaan'),
    days.map(function (s, i) {
      return h('th', { class: thCls(s) }, h('button', { type: 'button', class: 'daybtn', 'aria-label': 'Detail tanggal ' + (i + 1), onclick: function () { openDayDetail(s, data); } },
        h('span', {}, i + 1), h('small', {}, wk[weekdayOf(s)])));
    }), h('th', { class: 'sum' }, 'Hari'), h('th', { class: 'sum' }, 'Paraf'));
  const rows = data.form.kebiasaan.map(function (k) {
    const sm = data.ringkasan.filter(function (x) { return x.id === k.id; })[0] || { hari: 0, paraf: 0 };
    return h('tr', {}, h('th', { class: 'stick' }, habitLook(k.id).emoji + ' ' + k.nama),
      days.map(function (s) {
        const e = data.entri[s], v = e && e.s ? e.s[k.id] : '', par = e && e.val && e.val[k.id];
        return h('td', { class: 'cell ' + (v === 'v' ? 'yes' : (v === 'x' ? 'no' : '')) + (cnt[s] ? '' : ' off') + (par ? ' par' : '') },
          v === 'v' ? '✓' : (v === 'x' ? '✕' : ''));
      }), h('td', { class: 'sum' }, sm.hari), h('td', { class: 'sum' }, sm.paraf));
  });
  const extra = function (label, fn) {
    return h('tr', { class: 'extra' }, h('th', { class: 'stick' }, label),
      days.map(function (s) { return h('td', { class: 'cell small' + (cnt[s] ? '' : ' off') }, fn(data.entri[s])); }),
      h('td', { class: 'sum' }), h('td', { class: 'sum' }));
  };
  return h('div', {},
    h('div', { class: 'cal-wrap' }, h('table', { class: 'cal' }, head, rows,
      extra('Jam bangun', function (e) { return e ? e.jb : ''; }),
      extra('Jam tidur', function (e) { return e ? e.jt : ''; }),
      extra('Diketahui orang tua', function (e) { return e && e.ortu ? '👪' : ''; }))),
    h('p', { class: 'field-hint' }, '✓ dilakukan · ✕ belum · titik biru = sudah diparaf guru · kolom abu-abu = bukan hari yang dihitung. Ketuk tanggal untuk melihat detail.'));
}

function viewCalendar(profile, settings) { return monthView(settings, '🗓️ Kalender', renderCalendar); }

/* ---------- Ringkasan bulanan ---------- */
function renderSummary(data) {
  const cur = (State.settings.hari_ini || '').substring(0, 7), past = data.bulan < cur;
  const first = data.ringkasan[0], wrap = h('div', {});
  if (first) {
    wrap.appendChild(h('p', { class: 'field-hint' }, 'Sudah Terbiasa = dilakukan minimal ' + data.aturan.ambang_p + '/' + data.aturan.ambang_q +
      ' dari jumlah hari dalam bulan (target bulan ini: ' + first.target + ' dari ' + first.dari + ' hari).'));
  }
  data.form.kebiasaan.forEach(function (k) {
    const r = data.ringkasan.filter(function (x) { return x.id === k.id; })[0];
    if (!r) return;
    const look = habitLook(k.id), done = r.kategori === 'Sudah Terbiasa';
    const fillBar = h('span', {}), marker = h('i', {});
    fillBar.style.width = Math.min(100, r.persen) + '%';
    marker.style.left = (r.dari ? Math.round(r.target * 100 / r.dari) : 0) + '%';
    let text = r.hari + ' dari ' + r.dari + ' hari';
    if (done) text += ' — keren, kamu konsisten! 🎉';
    else if (past) text += ' — bulan depan pasti bisa lebih baik 💪';
    else text += ' — tinggal ' + r.sisa + ' hari lagi untuk mencapai target. Semangat!';
    if (r.paraf > 0) text += ' · ✍️ ' + r.paraf + ' paraf';
    const card = h('div', { class: 'sum-card' },
      h('div', { class: 'sum-head' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), h('strong', {}, k.nama),
        h('span', { class: 'tag ' + (done ? 'ok' : 'wait') }, done ? 'Sudah Terbiasa' : 'Belum Terbiasa')),
      h('div', { class: 'bar' }, fillBar, marker), h('p', {}, text));
    applyLook(card, look.c);
    wrap.appendChild(card);
  });
  const t = data.tidur;
  let sleepText = 'Belum ada data durasi tidur. Isi jam tidur dan jam bangun di dua hari berturut-turut ya.';
  if (t.rata_menit !== null) {
    if (t.status === 'ideal') sleepText = 'Pas sekali! Tidurmu sesuai kebutuhan usiamu (' + t.min_jam + '–' + t.maks_jam + ' jam). Pertahankan ya 🌙';
    else if (t.status === 'kurang') sleepText = 'Rata-ratamu sedikit di bawah kebutuhan usiamu (' + t.min_jam + '–' + t.maks_jam + ' jam). Coba tidur lebih awal malam ini 🌙';
    else sleepText = 'Kamu cukup beristirahat. Jaga jadwal tidurmu tetap konsisten, termasuk akhir pekan.';
  }
  wrap.appendChild(h('div', { class: 'sum-card' },
    h('div', { class: 'sum-head' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, '😴'), h('strong', {}, 'Rata-rata durasi tidur')),
    h('p', { class: 'big-number' }, t.rata_menit !== null ? fmtDuration(t.rata_menit) : '—'),
    h('p', {}, sleepText),
    h('p', { class: 'field-hint' }, 'Dihitung dari ' + t.n + ' malam. Hanya indikator informasi, bukan nilai.')));
  return wrap;
}

function viewSummary(profile, settings) { return monthView(settings, '📊 Ringkasan', renderSummary); }

/* ---------- Refleksi bulanan ---------- */
function renderReflection(data, reload) {
  const editable = data.refleksi.bisa_ubah, isi = data.refleksi.isi || {}, inputs = {};
  const wrap = h('div', {});
  wrap.appendChild(h('div', { class: 'banner info' }, '👪 Isi refleksi ini bersama orang tua atau wali, ya. Tulis dengan jujur. Tidak ada jawaban yang salah.'));
  if (!editable) wrap.appendChild(h('div', { class: 'banner' }, 'Refleksi hanya bisa diisi untuk bulan ini dan bulan lalu. Bulan ini kamu hanya bisa membacanya.'));
  data.form.kebiasaan.forEach(function (k) {
    const r = data.ringkasan.filter(function (x) { return x.id === k.id; })[0];
    const look = habitLook(k.id), done = r && r.kategori === 'Sudah Terbiasa', v = isi[k.id] || {};
    const ks = h('textarea', { class: 'input', id: 'rk-' + k.id, rows: '3', maxlength: '500', disabled: !editable,
      placeholder: done ? 'Apa yang membuatmu bisa konsisten?' : 'Apa yang membuatmu sulit melakukannya?' });
    const tl = h('textarea', { class: 'input', id: 'rt-' + k.id, rows: '3', maxlength: '500', disabled: !editable, placeholder: 'Apa yang akan kamu lakukan bulan depan?' });
    ks.value = v.kesimpulan || ''; tl.value = v.tindak_lanjut || '';
    inputs[k.id] = { ks: ks, tl: tl };
    const card = h('div', { class: 'sum-card' },
      h('div', { class: 'sum-head' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), h('strong', {}, k.nama),
        r ? h('span', { class: 'tag ' + (done ? 'ok' : 'wait') }, r.kategori) : null),
      h('div', { class: 'fields' }, field('Kesimpulan / refleksi', 'rk-' + k.id, ks), field('Tindak lanjut', 'rt-' + k.id, tl)),
      done ? h('p', { class: 'field-hint' }, '💛 Kamu konsisten! Orang tua/wali bisa menuliskan apresiasi untukmu di sini.') : null);
    applyLook(card, look.c);
    wrap.appendChild(card);
  });
  if (data.refleksi.catatan_wali) {
    wrap.appendChild(h('div', { class: 'card' }, h('strong', {}, '🧑‍🏫 Catatan wali kelas'), h('p', {}, data.refleksi.catatan_wali)));
  }
  if (editable) {
    const btn = h('button', { type: 'button', class: 'btn' }, 'Simpan refleksi');
    btn.addEventListener('click', function () {
      runBusy(btn, 'Menyimpan…', async function () {
        const payload = {};
        data.form.kebiasaan.forEach(function (k) { payload[k.id] = { kesimpulan: inputs[k.id].ks.value, tindak_lanjut: inputs[k.id].tl.value }; });
        const res = await Api.call('refleksi_simpan', { bulan: data.bulan, isi: payload }, { retries: 3 });
        if (!res.ok) { Toast.show(res.error.pesan, 'err'); return; }
        Toast.show('Refleksi tersimpan 💛', 'ok');
      });
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

function viewReflection(profile, settings) { return monthView(settings, '📝 Refleksi', renderReflection); }

/* ---------- Stiker ---------- */
function viewStickers() {
  const root = h('section', {});
  function load() {
    setChildren(root, h('h1', { class: 'page-title' }, '⭐ Stiker'), loading());
    Api.call('stiker', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(root, h('h1', { class: 'page-title' }, '⭐ Stiker'), errorBlock(res.error.pesan, load)); return; }
      const d = res.data;
      const msg = d.rangkaian_sekarang > 0
        ? (d.hari_ini_terisi ? 'Hebat, hari ini sudah kamu catat!' : 'Catat hari ini supaya rangkaianmu terus berlanjut!')
        : 'Mulai rangkaian barumu hari ini. Kamu pasti bisa! 💪';
      setChildren(root, h('h1', { class: 'page-title' }, '⭐ Stiker'),
        h('div', { class: 'hero-card streak' },
          h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🔥'),
          h('p', { class: 'big-number' }, d.rangkaian_sekarang + ' hari berturut-turut'),
          h('p', {}, msg)),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('strong', {}, d.hari_lengkap), h('span', {}, 'hari lengkap')),
          h('div', { class: 'stat' }, h('strong', {}, d.total_hari), h('span', {}, 'hari tercatat')),
          h('div', { class: 'stat' }, h('strong', {}, d.rangkaian_terpanjang), h('span', {}, 'rangkaian terpanjang'))),
        h('h2', { class: 'section-title' }, 'Koleksi stikermu'),
        h('div', { class: 'sticker-grid' }, d.stiker.map(function (s) {
          const bar = h('span', {});
          bar.style.width = Math.min(100, Math.round(s.now * 100 / s.target)) + '%';
          return h('div', { class: 'sticker' + (s.diraih ? '' : ' locked') },
            h('div', { class: 'em', 'aria-hidden': 'true' }, s.emoji), h('strong', {}, s.judul), h('p', { class: 'field-hint' }, s.syarat),
            s.diraih ? h('span', { class: 'tag ok' }, 'Diraih ✨') : h('div', {}, h('div', { class: 'progress' }, bar), h('p', { class: 'field-hint' }, Math.min(s.now, s.target) + ' / ' + s.target)));
        })));
    });
  }
  load();
  return root;
}

/* ---------- Panduan ---------- */
function viewGuidePage() {
  const root = h('section', {});
  function load() {
    setChildren(root, h('h1', { class: 'page-title' }, '📖 Panduan 7 Kebiasaan'), loading());
    Api.call('panduan', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(root, h('h1', { class: 'page-title' }, '📖 Panduan 7 Kebiasaan'), errorBlock(res.error.pesan, load)); return; }
      const a = res.data.aturan;
      setChildren(root, h('h1', { class: 'page-title' }, '📖 Panduan 7 Kebiasaan'),
        h('p', { class: 'lead' }, 'Tujuh kebiasaan kecil yang membuat harimu lebih sehat, semangat, dan bermakna.'),
        res.data.form.kebiasaan.map(function (k) {
          const look = habitLook(k.id);
          const card = h('div', { class: 'sum-card' },
            h('div', { class: 'sum-head' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), h('strong', {}, k.nama)),
            h('p', {}, k.deskripsi || 'Penjelasan belum tersedia.'));
          applyLook(card, look.c);
          return card;
        }),
        h('div', { class: 'card' }, h('h2', { class: 'section-title', style: 'margin-top:0' }, 'Cara mengisi catatan'),
          h('p', {}, 'Setiap hari, termasuk Sabtu dan Minggu, pilih ✔ Sudah jika kebiasaan itu kamu lakukan, atau ✖ Belum jika belum. Catat juga jam bangun dan jam tidurmu. Kamu bisa mengisi sampai ' +
            (a.hari_mundur > 0 ? a.hari_mundur + ' hari ke belakang' : 'hari ini saja') + ' jika terlewat.')),
        h('div', { class: 'card' }, h('h2', { class: 'section-title', style: 'margin-top:0' }, 'Apa itu "Sudah Terbiasa"?'),
          h('p', {}, 'Sebuah kebiasaan disebut Sudah Terbiasa jika kamu melakukannya minimal ' + a.ambang_p + '/' + a.ambang_q +
            ' dari jumlah hari dalam satu bulan. Jika belum, namanya Belum Terbiasa. Itu bukan hukuman, hanya tanda untuk terus berlatih.')));
    });
  }
  load();
  return root;
}
