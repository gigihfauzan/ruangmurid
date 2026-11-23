/** reader.js — Tahap 6: unduh xlsx, dashboard sekolah, dan rekap pembaca. Didaftarkan lewat EXTRA_VIEWS. */
const EXTRA_VIEWS = {
  wali: { unduh: viewTeacherExport },
  admin: { dashboard: viewDashboard, ekspor: viewAdminExport },
  pembaca: { dashboard: viewDashboard, rekap: viewReaderRecap }
};

function saveBase64File(name, mime, b64) {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = h('a', { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}

/** Kartu unduhan: pilih bulan dan (opsional) Data Harian. basePayload() memberi id_kelas bila perlu. */
function exportCard(body, settings, flags, basePayload, opts) {
  opts = opts || {};
  const today = settings.hari_ini;
  let month = today.substring(0, 7);
  function draw() {
    const lastDay = new Date(Number(month.substr(0, 4)), Number(month.substr(5, 2)), 0).getDate();
    const dari = h('input', { class: 'input', id: 'ex-dari', type: 'date', max: today });
    const sampai = h('input', { class: 'input', id: 'ex-sampai', type: 'date', max: today });
    dari.value = month + '-01';
    const endStr = month + '-' + pad2(lastDay);
    sampai.value = endStr > today ? today : endStr;
    const showDaily = !!flags.harian && opts.allowDaily !== false;
    const daily = checkRow('ex-daily', 'Sertakan lembar Data Harian (per siswa per tanggal)', true);
    const btn = h('button', { type: 'button', class: 'btn' }, '⬇️ Unduh xlsx');
    btn.addEventListener('click', function () {
      runBusy(btn, 'Menyiapkan berkas…', async function () {
        const payload = Object.assign({}, basePayload(), { bulan: month });
        if (showDaily && daily.get()) { payload.harian = true; payload.dari = dari.value; payload.sampai = sampai.value; }
        const r = await Api.call(opts.action || 'ekspor_rekap_kelas', payload, { retries: 0 });
        if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
        saveBase64File(r.data.nama, r.data.mime, r.data.data);
        Toast.show('Berkas diunduh ✓', 'ok');
      });
    });
    setChildren(body, h('div', { class: 'card' },
      monthNav(month, today, function (m) { month = m; draw(); }),
      h('p', { class: 'field-hint' }, 'Berkas berisi rekap bulanan (format Lampiran 3)' + (flags.kategori ? ', lembar Sudah/Belum Terbiasa' : '') + (showDaily ? ', dan Data Harian' : '') + '. Proses sekitar 10–60 detik.'),
      showDaily ? h('div', { class: 'fields' }, daily.el, field('Data harian dari tanggal', 'ex-dari', dari), field('sampai tanggal', 'ex-sampai', sampai)) : null,
      btn));
  }
  draw();
}

/* ---------- Wali kelas: menu Unduh ---------- */
function viewTeacherExport(profile, settings) {
  return teacherFrame(profile, '⬇️ Unduh xlsx', function (kelasId, body) {
    setChildren(body, loading());
    Api.call('kelas_publik', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, null)); return; }
      exportCard(body, settings, res.data.ekspor, function () { return { id_kelas: kelasId }; }, {});
    });
  });
}

/* ---------- Admin: Ekspor ---------- */
function viewAdminExport(profile, settings) {
  const root = h('section', {}), body = h('div', {});
  setChildren(root, h('h1', { class: 'page-title' }, '📤 Ekspor xlsx'), body, loading());
  Api.call('kelas_publik', {}, { retries: 2 }).then(function (res) {
    if (!res.ok) { setChildren(root, h('h1', { class: 'page-title' }, '📤 Ekspor xlsx'), errorBlock(res.error.pesan, null)); return; }
    setChildren(root, h('h1', { class: 'page-title' }, '📤 Ekspor xlsx'), body);
    const flags = res.data.ekspor, kelas = res.data.kelas;
    let mode = 'satu', pick = kelas.length ? kelas[0].id_kelas : '';
    function draw() {
      const sel = selectEl('ae-kelas', kelas.map(function (k) { return [k.id_kelas, 'Kelas ' + k.nama]; }), pick);
      sel.addEventListener('change', function () { pick = sel.value; });
      const box = h('div', {});
      setChildren(body,
        chipTabs([{ id: 'satu', t: 'Satu kelas' }, { id: 'semua', t: 'Semua kelas (satu berkas)' }], mode, function (id) { mode = id; draw(); }),
        mode === 'satu'
          ? field('Kelas', 'ae-kelas', sel)
          : h('p', { class: 'field-hint' }, 'Satu berkas berisi Ringkasan Sekolah dan satu lembar rekap (format Lampiran 3) untuk tiap kelas aktif. Prosesnya bisa sampai 1–2 menit.'),
        box);
      exportCard(box, settings, flags, function () { return mode === 'satu' ? { id_kelas: pick } : {}; },
        { action: mode === 'satu' ? 'ekspor_rekap_kelas' : 'ekspor_semua_kelas', allowDaily: mode === 'satu' });
    }
    draw();
  });
  return root;
}

/* ---------- Dashboard sekolah (admin dan pembaca) ---------- */
function renderDashboard(d) {
  const pct = d.sekolah.jumlah ? Math.round(d.sekolah.isi_hari_ini * 100 / d.sekolah.jumlah) : 0;
  const colHead = function (emoji, label) { return h('th', { class: 'colhead' }, h('span', {}, emoji), h('small', {}, label)); };
  const cell = function (st) {
    const p = st.jumlah ? Math.round(st.sudah * 100 / st.jumlah) : 0;
    return h('td', { class: 'rc ' + (p >= 66 ? 'ok' : (p >= 33 ? 'wait' : 'low')) },
      h('strong', {}, st.sudah + '/' + st.jumlah), h('small', {}, p + '%' + (d.tier && st.mulai ? ' +' + st.mulai : '')));
  };
  const head = h('tr', {}, h('th', { class: 'stick' }, 'Kelas'), colHead('👥', 'Siswa L/P'), colHead('✅', 'Mengisi hari ini'),
    d.kebiasaan.map(function (k) { return colHead(habitLook(k.id).emoji, k.nama); }));
  const rows = d.kelas.map(function (c) {
    return h('tr', {}, h('th', { class: 'stick' }, 'Kelas ' + c.nama),
      h('td', { class: 'rc' }, h('strong', {}, c.jumlah), h('small', {}, c.l + '/' + c.p)),
      h('td', { class: 'rc' }, h('strong', {}, c.isi_hari_ini + '/' + c.jumlah)),
      c.kebiasaan.map(cell));
  });
  const all = h('tr', { class: 'extra' }, h('th', { class: 'stick' }, 'Seluruh sekolah'),
    h('td', { class: 'rc' }, h('strong', {}, d.sekolah.jumlah), h('small', {}, d.sekolah.l + '/' + d.sekolah.p)),
    h('td', { class: 'rc' }, h('strong', {}, d.sekolah.isi_hari_ini + '/' + d.sekolah.jumlah)),
    d.sekolah.kebiasaan.map(cell));
  return h('div', {},
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', {}, d.sekolah.jumlah), h('span', {}, 'siswa aktif')),
      h('div', { class: 'stat' }, h('strong', {}, pct + '%'), h('span', {}, 'mengisi hari ini')),
      h('div', { class: 'stat' }, h('strong', {}, d.kelas.length), h('span', {}, 'kelas aktif'))),
    h('p', { class: 'field-hint', style: 'margin-top:14px' }, 'Angka besar = jumlah siswa yang Sudah Terbiasa dari seluruh siswa kelas. Hijau ≥ 66%, kuning ≥ 33%, merah muda di bawahnya' + (d.tier ? '. "+n" = siswa Mulai Terbiasa.' : '.')),
    h('div', { class: 'cal-wrap' }, h('table', { class: 'cal' }, head, rows, all)));
}

function viewDashboard(profile, settings) {
  const root = h('section', {}), body = h('div', {});
  let month = settings.hari_ini.substring(0, 7);
  function load(fresh) {
    const nav = monthNav(month, settings.hari_ini, function (m) { month = m; load(false); });
    setChildren(body, nav, loading());
    Api.call('dashboard_sekolah', { bulan: month, segarkan: !!fresh }, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, nav, errorBlock(res.error.pesan, function () { load(true); })); return; }
      setChildren(body, nav, h('button', { type: 'button', class: 'mini', style: 'margin-bottom:12px', onclick: function () { load(true); } }, '🔄 Segarkan'), renderDashboard(res.data));
    });
  }
  setChildren(root, h('h1', { class: 'page-title' }, '🏫 Dashboard Sekolah'), body);
  load(false);
  return root;
}

/* ---------- Rekap untuk pembaca (hanya lihat dan unduh) ---------- */
function renderRecapReadOnly(d) {
  const colHead = function (emoji, label) { return h('th', { class: 'colhead' }, h('span', {}, emoji), h('small', {}, label)); };
  const head = h('tr', {}, h('th', { class: 'stick' }, 'Nama'), d.kebiasaan.map(function (k) { return colHead(habitLook(k.id).emoji, k.nama); }), colHead('😴', 'Tidur'), colHead('📝', 'Catatan'));
  const rows = d.siswa.map(function (s) {
    return h('tr', {}, h('th', { class: 'stick' }, s.nama + ' (' + s.jk + ')'),
      s.kebiasaan.map(function (k) {
        return h('td', { class: 'rc ' + (k.kategori === 'Sudah Terbiasa' ? 'ok' : 'wait') }, h('strong', {}, k.hari), h('small', {}, k.persen + '%' + (k.paraf ? ' ✍' + k.paraf : '')));
      }),
      h('td', { class: 'rc' }, h('small', {}, s.tidur !== null ? fmtDuration(s.tidur) : '—')),
      h('td', { class: 'rc' }, h('small', {}, s.catatan || '—')));
  });
  const agg = h('tr', { class: 'extra' }, h('th', { class: 'stick' }, 'Sudah Terbiasa'),
    d.ringkas.map(function (r) { return h('td', { class: 'rc' }, h('strong', {}, r.sudah + '/' + r.dari), h('small', {}, 'rata² ' + r.rata_persen + '%')); }), h('td', {}), h('td', {}));
  return h('div', {},
    h('p', { class: 'field-hint' }, 'Kelas ' + d.kelas.nama + ' · ' + d.kelas.l + ' laki-laki, ' + d.kelas.p + ' perempuan · target Sudah Terbiasa ' + d.target + ' dari ' + d.dari_hari + ' hari.'),
    h('div', { class: 'cal-wrap' }, h('table', { class: 'cal' }, head, rows, agg)));
}

function viewReaderRecap(profile, settings) {
  const root = h('section', {}), head = h('div', {}), body = h('div', {});
  let kelas = [], pick = '', month = settings.hari_ini.substring(0, 7);
  function load() {
    if (!pick) { setChildren(body, h('div', { class: 'card center' }, h('p', { class: 'lead' }, 'Pilih kelas untuk melihat rekapnya.'))); return; }
    const nav = monthNav(month, settings.hari_ini, function (m) { month = m; load(); });
    setChildren(body, nav, loading());
    Api.call('rekap_kelas', { id_kelas: pick, bulan: month }, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, nav, errorBlock(res.error.pesan, load)); return; }
      const btn = h('button', { type: 'button', class: 'btn ghost', style: 'margin:12px 0' }, '⬇️ Unduh rekap (xlsx)');
      btn.addEventListener('click', function () {
        runBusy(btn, 'Menyiapkan berkas…', async function () {
          const r = await Api.call('ekspor_rekap_kelas', { id_kelas: pick, bulan: month }, { retries: 0 });
          if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
          saveBase64File(r.data.nama, r.data.mime, r.data.data);
          Toast.show('Berkas diunduh ✓', 'ok');
        });
      });
      setChildren(body, nav, btn, renderRecapReadOnly(res.data));
    });
  }
  setChildren(root, h('h1', { class: 'page-title' }, '📋 Rekap Kelas'), head, body, loading());
  Api.call('kelas_publik', {}, { retries: 2 }).then(function (res) {
    if (!res.ok) { setChildren(root, h('h1', { class: 'page-title' }, '📋 Rekap Kelas'), errorBlock(res.error.pesan, null)); return; }
    kelas = res.data.kelas;
    const sel = selectEl('rr-kelas', [['', 'Pilih kelas…']].concat(kelas.map(function (k) { return [k.id_kelas, 'Kelas ' + k.nama]; })), '');
    sel.addEventListener('change', function () { pick = sel.value; load(); });
    setChildren(root, h('h1', { class: 'page-title' }, '📋 Rekap Kelas'), field('Kelas', 'rr-kelas', sel), body);
    load();
  });
  return root;
}
