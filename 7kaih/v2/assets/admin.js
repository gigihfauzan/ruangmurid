/** admin.js — halaman admin utama: Pengaturan, Kelas, Akun, Lihat Wali, Pengumuman. */

const ADMIN_VIEWS = {
  pengaturan: viewAdminSettings, kelas: viewAdminClasses, akun: viewAdminAccounts,
  'lihat-wali': viewAdminAsTeacher, pengumuman: viewAdminAnnouncements
};

const FIELD_TYPE_LABEL = { centang: 'Centang ✓/✕', jam: 'Jam', angka: 'Angka', pilihan: 'Pilihan', teks_singkat: 'Teks singkat', teks_panjang: 'Teks panjang' };

/* ---------- Pembantu ---------- */
function chipTabs(items, current, onPick) {
  return h('div', { class: 'chips', role: 'tablist' }, items.map(function (it) {
    return h('button', {
      type: 'button', class: 'chip-btn', role: 'tab', 'aria-pressed': String(it.id === current),
      onclick: function () { onPick(it.id); }
    }, it.t);
  }));
}

function checkRow(id, label, checked) {
  const c = h('input', { type: 'checkbox', class: 'chk', id: id || null });
  c.checked = !!checked;
  return { el: h('label', { class: 'ortu', for: id || null, style: 'margin:6px 0' }, c, h('span', {}, label)), get: function () { return c.checked; } };
}

function selectEl(id, options, value) {
  const s = h('select', { class: 'input', id: id || null }, options.map(function (o) { return h('option', { value: o[0] }, o[1]); }));
  s.value = (value === undefined || value === null) ? '' : value;
  return s;
}

function textEl(id, value, max) {
  const i = h('input', { class: 'input', id: id || null, maxlength: String(max || 100), autocomplete: 'off' });
  i.value = value || '';
  return i;
}

/** Jendela berisi formulir. onSubmit mengembalikan teks galat, atau '' bila berhasil (jendela ditutup). */
function formModal(title, children, label, onSubmit) {
  const msg = h('p', { class: 'form-msg', role: 'alert' });
  const btn = h('button', { type: 'submit', class: 'btn' }, label);
  let m;
  m = openModal(title, h('form', {
    class: 'auth-form', novalidate: true,
    onsubmit: function (e) {
      e.preventDefault();
      runBusy(btn, 'Menyimpan…', async function () {
        msg.textContent = '';
        const err = await onSubmit();
        if (err) { msg.textContent = err; return; }
        m.close();
      });
    }
  }, h('div', { class: 'fields' }, children), msg, btn));
  return m;
}

function arrows(up, down) {
  return h('div', { class: 'arrows' },
    h('button', { type: 'button', class: 'mini', 'aria-label': 'Naik', onclick: up }, '▲'),
    h('button', { type: 'button', class: 'mini', 'aria-label': 'Turun', onclick: down }, '▼'));
}

function refreshSettings() {
  return Api.call('ping', {}, { retries: 1 }).then(function (res) {
    if (!res.ok) return;
    State.settings = res.data;
    applyTheme(res.data.warna_tema);
    document.title = res.data.nama_aplikasi;
    const b = document.querySelector('.brand-name');
    if (b) b.textContent = res.data.nama_aplikasi;
  });
}

/* ================= PENGATURAN ================= */
function settingControl(d, value) {
  const id = 'st-' + d.k;
  if (d.t === 'tombol') {
    const c = h('input', { type: 'checkbox', class: 'chk', id: id });
    c.checked = value === 'ya';
    return {
      el: h('label', { class: 'ortu', for: id, style: 'margin:0' }, c, h('span', {}, d.label + (d.bantuan ? ' — ' + d.bantuan : ''))),
      read: function () { return c.checked; }
    };
  }
  let ctl;
  if (d.t === 'panjang') ctl = h('textarea', { class: 'input', id: id, rows: '3', maxlength: String(d.len || 200) });
  else if (d.t === 'jam') ctl = h('input', { class: 'input', id: id, type: 'time' });
  else if (d.t === 'angka') ctl = h('input', { class: 'input', id: id, type: 'number', inputmode: 'decimal', min: String(d.min), max: String(d.max), step: d.int ? '1' : '0.5' });
  else if (d.t === 'pilihan') ctl = h('select', { class: 'input', id: id }, d.opsi.map(function (o) { return h('option', { value: o[0] }, o[1]); }));
  else if (d.t === 'warna') ctl = h('input', { class: 'input color', id: id, type: 'color' });
  else if (d.t === 'url') ctl = h('input', { class: 'input', id: id, type: 'url', placeholder: 'https://…', maxlength: String(d.len || 300) });
  else ctl = h('input', { class: 'input', id: id, maxlength: String(d.len || 100) });
  ctl.value = (value === undefined || value === null) ? '' : value;
  return { el: field(d.label + (d.req ? ' *' : ''), id, ctl, d.bantuan), read: function () { return ctl.value; } };
}

function adminSettingsGroup(body, group, hintEl) {
  setChildren(body, loading());
  Api.call('pengaturan_baca', {}, { retries: 2 }).then(function (res) {
    if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, function () { adminSettingsGroup(body, group, hintEl); })); return; }
    const defs = res.data.definisi.filter(function (d) { return d.g === group; });
    const readers = {};
    const controls = defs.map(function (d) {
      const c = settingControl(d, res.data.nilai[d.k]);
      readers[d.k] = c.read;
      return c.el;
    });
    const msg = h('p', { class: 'form-msg', role: 'alert' });
    const btn = h('button', { type: 'button', class: 'btn' }, 'Simpan pengaturan');
    btn.addEventListener('click', function () {
      runBusy(btn, 'Menyimpan…', async function () {
        msg.textContent = '';
        const nilai = {};
        defs.forEach(function (d) { nilai[d.k] = readers[d.k](); });
        const r = await Api.call('pengaturan_simpan', { nilai: nilai }, { retries: 0 });
        if (!r.ok) { msg.textContent = r.error.pesan; return; }
        Toast.show(r.data.diubah ? 'Pengaturan tersimpan ✓' : 'Tidak ada yang berubah.', 'ok');
        refreshSettings();
      });
    });
    setChildren(body, h('div', { class: 'card' }, hintEl || null, h('div', { class: 'fields' }, controls), msg, btn));
  });
}

function viewAdminSettings() {
  const root = h('section', {}), tabsBox = h('div', {}), body = h('div', {});
  const tabs = [
    { id: 'identitas', t: 'Identitas' }, { id: 'kriteria', t: 'Kriteria' }, { id: 'pengisian', t: 'Aturan pengisian' },
    { id: 'tahun', t: 'Tahun ajaran & libur' }, { id: 'form', t: 'Form kebiasaan' }, { id: 'ekspor', t: 'Template ekspor' }, { id: 'keamanan', t: 'Keamanan' }
  ];
  const hints = {
    identitas: h('div', { class: 'banner info' }, 'Logo: unggah gambar ke GitHub (misalnya assets/logo.png), lalu isi alamat lengkapnya (https://…). NIP wali kelas diisi di menu Akun.'),
    kriteria: h('div', { class: 'banner info' }, 'Ambang awal: minimal 2/3 dari jumlah hari dalam bulan. Perubahan berlaku untuk perhitungan selanjutnya.'),
    ekspor: h('div', { class: 'banner info' }, 'Pengaturan ini dipakai saat unduh xlsx di Tahap 6.')
  };
  let cur = 'identitas';
  function show() {
    setChildren(tabsBox, chipTabs(tabs, cur, function (id) { cur = id; show(); }));
    if (cur === 'tahun') adminYears(body);
    else if (cur === 'form') adminFormBuilder(body);
    else adminSettingsGroup(body, cur, hints[cur]);
  }
  setChildren(root, h('h1', { class: 'page-title' }, '⚙️ Pengaturan'), tabsBox, body);
  show();
  return root;
}

/* ---------- Tahun ajaran dan libur ---------- */
function openYearForm(t, onDone) {
  const nama = textEl('y-nama', t ? t.nama : '', 20);
  const sem = selectEl('y-sem', [['Ganjil', 'Ganjil'], ['Genap', 'Genap']], t ? t.semester : 'Ganjil');
  const mulai = h('input', { class: 'input', id: 'y-mulai', type: 'date' });
  const akhir = h('input', { class: 'input', id: 'y-akhir', type: 'date' });
  mulai.value = t ? t.tanggal_mulai : ''; akhir.value = t ? t.tanggal_akhir : '';
  const aktif = checkRow('y-aktif', 'Jadikan periode aktif', t ? t.aktif === 'ya' : false);
  formModal(t ? 'Ubah periode' : 'Tambah periode',
    [field('Tahun ajaran (contoh 2026/2027)', 'y-nama', nama), field('Semester', 'y-sem', sem), field('Tanggal mulai', 'y-mulai', mulai), field('Tanggal akhir', 'y-akhir', akhir), aktif.el],
    'Simpan', async function () {
      const r = await Api.call('tahun_simpan', {
        id_tahun: t ? t.id_tahun : '', nama: nama.value, semester: sem.value, tanggal_mulai: mulai.value, tanggal_akhir: akhir.value, aktif: aktif.get()
      }, { retries: 0 });
      if (!r.ok) return r.error.pesan;
      Toast.show('Tersimpan ✓', 'ok'); onDone(); return '';
    });
}

function openHolidayForm(l, onDone) {
  const mulai = h('input', { class: 'input', id: 'l-mulai', type: 'date' });
  const akhir = h('input', { class: 'input', id: 'l-akhir', type: 'date' });
  mulai.value = l ? l.tanggal_mulai : ''; akhir.value = l ? l.tanggal_akhir : '';
  const ket = textEl('l-ket', l ? l.keterangan : '', 100);
  formModal(l ? 'Ubah hari libur' : 'Tambah hari libur',
    [field('Keterangan', 'l-ket', ket), field('Tanggal mulai', 'l-mulai', mulai), field('Tanggal akhir (kosongkan bila satu hari)', 'l-akhir', akhir)],
    'Simpan', async function () {
      const r = await Api.call('libur_simpan', { id_libur: l ? l.id_libur : '', tanggal_mulai: mulai.value, tanggal_akhir: akhir.value, keterangan: ket.value }, { retries: 0 });
      if (!r.ok) return r.error.pesan;
      Toast.show('Tersimpan ✓', 'ok'); onDone(); return '';
    });
}

function adminYears(body) {
  function load() {
    setChildren(body, loading());
    Api.call('tahun_daftar', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      const d = res.data;
      setChildren(body,
        h('p', { class: 'field-hint' }, 'Pengisian siswa hanya bisa pada tanggal yang berada di dalam salah satu periode di bawah ini.'),
        h('button', { type: 'button', class: 'btn', onclick: function () { openYearForm(null, load); } }, '➕ Tambah periode'),
        d.tahun.map(function (t) {
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, t.nama + ' · ' + t.semester), h('span', { class: 'field-hint' }, t.tanggal_mulai + ' s/d ' + t.tanggal_akhir)),
            t.aktif === 'ya' ? h('span', { class: 'tag ok' }, 'Aktif') : null,
            h('button', { type: 'button', class: 'mini', onclick: function () { openYearForm(t, load); } }, '✏️ Ubah'));
        }),
        h('h2', { class: 'section-title' }, 'Hari libur'),
        h('p', { class: 'field-hint' }, 'Hari libur dipakai bila aturan "hari yang dihitung" adalah Senin–Jumat.'),
        h('button', { type: 'button', class: 'btn ghost', onclick: function () { openHolidayForm(null, load); } }, '➕ Tambah hari libur'),
        d.libur.length ? d.libur.map(function (l) {
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, l.keterangan), h('span', { class: 'field-hint' }, l.tanggal_mulai + (l.tanggal_akhir !== l.tanggal_mulai ? ' s/d ' + l.tanggal_akhir : ''))),
            h('div', { class: 'sbtns' },
              h('button', { type: 'button', class: 'mini', onclick: function () { openHolidayForm(l, load); } }, '✏️ Ubah'),
              h('button', {
                type: 'button', class: 'mini danger', onclick: function () {
                  confirmDialog('Hapus hari libur?', l.keterangan + ' (' + l.tanggal_mulai + ') akan dihapus.', 'Hapus', async function () {
                    const r = await Api.call('libur_hapus', { id_libur: l.id_libur }, { retries: 0 });
                    if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                    load();
                  });
                }
              }, 'Hapus')));
        }) : h('p', { class: 'field-hint' }, 'Belum ada hari libur.'));
    });
  }
  load();
}

/* ---------- Pembuat form 7 kebiasaan ---------- */
function adminFormBuilder(body) {
  let model = null, versi = '', hist = [];

  function load() {
    setChildren(body, loading());
    Api.call('form_baca', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      model = { kebiasaan: JSON.parse(JSON.stringify(res.data.kebiasaan)), fields: JSON.parse(JSON.stringify(res.data.fields)) };
      versi = res.data.versi;
      hist = res.data.riwayat;
      draw();
    });
  }
  function fieldsOf(idK) { return model.fields.filter(function (f) { return (f.id_kebiasaan || '') === idK; }); }
  function moveHabit(i, d) {
    const j = i + d;
    if (j < 0 || j >= model.kebiasaan.length) return;
    const t = model.kebiasaan[i]; model.kebiasaan[i] = model.kebiasaan[j]; model.kebiasaan[j] = t;
    draw();
  }
  function moveField(f, d) {
    const list = fieldsOf(f.id_kebiasaan || ''), j = list.indexOf(f) + d;
    if (j < 0 || j >= list.length) return;
    const a = model.fields.indexOf(f), b = model.fields.indexOf(list[j]);
    const t = model.fields[a]; model.fields[a] = model.fields[b]; model.fields[b] = t;
    draw();
  }

  function fieldRow(f) {
    const label = h('input', { class: 'input', maxlength: '60', 'aria-label': 'Nama isian' });
    label.value = f.label;
    label.addEventListener('input', function () { f.label = label.value; });
    const pet = h('input', { class: 'input', maxlength: '120', placeholder: 'Petunjuk (opsional)', 'aria-label': 'Petunjuk' });
    pet.value = f.petunjuk || '';
    pet.addEventListener('input', function () { f.petunjuk = pet.value; });
    const wj = h('input', { type: 'checkbox', class: 'chk', 'aria-label': 'Wajib' });
    wj.checked = !!f.wajib;
    wj.addEventListener('change', function () { f.wajib = wj.checked; });
    const ak = h('input', { type: 'checkbox', class: 'chk', 'aria-label': 'Aktif' });
    ak.checked = !!f.aktif;
    ak.addEventListener('change', function () { f.aktif = ak.checked; });
    let op = null;
    if (f.tipe === 'pilihan') {
      op = h('textarea', { class: 'input', rows: '3', placeholder: 'Satu pilihan per baris', 'aria-label': 'Pilihan' });
      op.value = (f.opsi || []).join('\n');
      op.addEventListener('input', function () { f.opsi = op.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); });
    }
    let habitSel = null;
    if (f.simpan_di === 'tambahan') {
      habitSel = selectEl('', [['', 'Umum (bagian bawah)']].concat(model.kebiasaan.map(function (k) { return [k.id, k.nama]; })), f.id_kebiasaan || '');
      habitSel.setAttribute('aria-label', 'Letak isian');
      habitSel.addEventListener('change', function () { f.id_kebiasaan = habitSel.value; draw(); });
    }
    return h('div', { class: 'frow' },
      h('div', { class: 'line' }, label),
      h('div', { class: 'line' },
        h('span', { class: 'tag wait' }, FIELD_TYPE_LABEL[f.tipe] || f.tipe),
        h('label', {}, wj, ' Wajib'), h('label', {}, ak, ' Aktif'),
        arrows(function () { moveField(f, -1); }, function () { moveField(f, 1); })),
      pet, op, habitSel);
  }

  function habitCard(k, i) {
    const look = habitLook(k.id);
    const nm = h('input', { class: 'input', maxlength: '40', 'aria-label': 'Nama kebiasaan' });
    nm.value = k.nama;
    nm.addEventListener('input', function () { k.nama = nm.value; });
    const ds = h('textarea', { class: 'input', rows: '2', maxlength: '400', placeholder: 'Penjelasan singkat (tampil di halaman Panduan siswa)', 'aria-label': 'Penjelasan' });
    ds.value = k.deskripsi || '';
    ds.addEventListener('input', function () { k.deskripsi = ds.value; });
    const ak = h('input', { type: 'checkbox', class: 'chk', 'aria-label': 'Aktif' });
    ak.checked = !!k.aktif;
    ak.addEventListener('change', function () { k.aktif = ak.checked; });
    const card = h('div', { class: 'hcard' },
      h('div', { class: 'line' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), nm,
        arrows(function () { moveHabit(i, -1); }, function () { moveHabit(i, 1); })),
      h('label', { class: 'line' }, ak, ' Kebiasaan aktif'),
      ds,
      fieldsOf(k.id).map(fieldRow),
      h('button', { type: 'button', class: 'mini', onclick: function () { openAddField(k.id); } }, '➕ Tambah isian'));
    applyLook(card, look.c);
    return card;
  }

  function openAddField(idK) {
    const label = textEl('af-label', '', 60);
    const tipe = selectEl('af-tipe', Object.keys(FIELD_TYPE_LABEL).map(function (t) { return [t, FIELD_TYPE_LABEL[t]]; }), 'teks_singkat');
    const hab = selectEl('af-hab', [['', 'Umum (bagian bawah)']].concat(model.kebiasaan.map(function (k) { return [k.id, k.nama]; })), idK);
    const opsi = h('textarea', { class: 'input', id: 'af-opsi', rows: '3', placeholder: 'Satu pilihan per baris' });
    const wj = checkRow('af-wajib', 'Wajib diisi', false);
    formModal('Tambah isian', [
      field('Nama isian', 'af-label', label), field('Jenis isian', 'af-tipe', tipe), field('Letak', 'af-hab', hab),
      field('Pilihan (hanya untuk jenis Pilihan)', 'af-opsi', opsi), wj.el
    ], 'Tambahkan', async function () {
      if (!label.value.trim()) return 'Isi nama isian.';
      const op = opsi.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (tipe.value === 'pilihan' && op.length < 2) return 'Isian jenis Pilihan membutuhkan minimal 2 pilihan.';
      model.fields.push({
        id_field: '', id_kebiasaan: hab.value, label: label.value.trim(), tipe: tipe.value, wajib: wj.get(),
        opsi: tipe.value === 'pilihan' ? op : [], petunjuk: '', aktif: true, simpan_di: 'tambahan'
      });
      draw();
      return '';
    });
  }

  function save() {
    const catatan = h('input', { class: 'input', id: 'fv-cat', maxlength: '200', placeholder: 'Contoh: menambah isian menu sarapan' });
    formModal('Simpan sebagai versi baru', [
      h('p', {}, 'Perubahan membuat versi form baru. Catatan harian lama tetap terbaca dengan versinya. Siswa yang sedang membuka halaman Hari Ini perlu memuat ulang.'),
      field('Catatan perubahan (opsional)', 'fv-cat', catatan)
    ], 'Simpan versi baru', async function () {
      const r = await Api.call('form_simpan', { kebiasaan: model.kebiasaan, fields: model.fields, catatan: catatan.value }, { retries: 0 });
      if (!r.ok) return r.error.pesan;
      Toast.show(r.data.berubah ? 'Form versi ' + r.data.versi + ' aktif ✓' : 'Tidak ada perubahan.', 'ok');
      load();
      return '';
    });
  }

  function draw() {
    setChildren(body,
      h('div', { class: 'banner info' }, 'Versi form aktif: ' + versi + '. Isian tidak dihapus, hanya dinonaktifkan, supaya data lama tetap terbaca.'),
      model.kebiasaan.map(habitCard),
      (function () {
        const c = h('div', { class: 'hcard' }, h('strong', {}, '📎 Isian umum'), fieldsOf('').map(fieldRow),
          h('button', { type: 'button', class: 'mini', onclick: function () { openAddField(''); } }, '➕ Tambah isian umum'));
        applyLook(c, '#64748b');
        return c;
      })(),
      h('button', { type: 'button', class: 'btn', style: 'margin-top:12px', onclick: save }, '💾 Simpan sebagai versi baru'),
      h('h2', { class: 'section-title' }, 'Riwayat versi'),
      h('div', { class: 'cal-wrap' }, h('table', { class: 'plain' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Versi'), h('th', {}, 'Dibuat'), h('th', {}, 'Oleh'), h('th', {}, 'Catatan'))),
        h('tbody', {}, hist.map(function (v) {
          return h('tr', {}, h('td', {}, v.versi + (v.aktif ? ' ✓' : '')), h('td', {}, v.dibuat), h('td', {}, v.dibuat_oleh), h('td', {}, v.catatan));
        })))));
  }
  load();
}

/* ================= KELAS ================= */
function suggestClassName(nama, tingkat) {
  if (tingkat === '8') return nama.replace(/VIII/i, function (m) { return m === m.toLowerCase() ? 'ix' : 'IX'; }).replace(/\b8/, '9');
  if (tingkat === '7') return nama.replace(/VII(?!I)/i, function (m) { return m === m.toLowerCase() ? 'viii' : 'VIII'; }).replace(/\b7/, '8');
  return nama;
}

function openClassForm(k, waliList, onDone) {
  const nama = textEl('k-nama', k ? k.nama : '', 30);
  const tingkat = selectEl('k-tingkat', [['7', 'Kelas 7'], ['8', 'Kelas 8'], ['9', 'Kelas 9']], k ? k.tingkat : '7');
  const wali = selectEl('k-wali', [['', '— belum ada —']].concat(waliList.map(function (w) { return [w.id_akun, w.nama + ' (' + w.username + ')']; })), k ? k.id_wali : '');
  const aktif = checkRow('k-aktif', 'Pengisian dibuka untuk kelas ini', k ? k.pengisian_aktif : true);
  const jb = h('input', { class: 'input', id: 'k-jb', type: 'time' });
  const jt = h('input', { class: 'input', id: 'k-jt', type: 'time' });
  jb.value = k ? k.jam_buka : ''; jt.value = k ? k.jam_tutup : '';
  const status = selectEl('k-status', [['aktif', 'Aktif'], ['arsip', 'Arsip']], k ? k.status : 'aktif');
  const kids = [field('Nama kelas (contoh VII A)', 'k-nama', nama), field('Tingkat', 'k-tingkat', tingkat), field('Wali kelas', 'k-wali', wali), aktif.el,
    field('Jam buka pengisian', 'k-jb', jb, 'Kosongkan jam buka dan tutup bila pengisian selalu terbuka.'), field('Jam tutup pengisian', 'k-jt', jt)];
  if (k) kids.push(field('Status', 'k-status', status));
  formModal(k ? 'Ubah kelas' : 'Tambah kelas', kids, 'Simpan', async function () {
    const r = await Api.call('kelas_simpan', {
      id_kelas: k ? k.id_kelas : '', nama: nama.value, tingkat: tingkat.value, id_wali: wali.value,
      pengisian_aktif: aktif.get(), jam_buka: jb.value, jam_tutup: jt.value, status: status.value
    }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show('Kelas tersimpan ✓', 'ok'); onDone(); return '';
  });
}

function openClassStudents(k, d, onDone) {
  const holder = h('div', {}, loading());
  openModal('Siswa kelas ' + k.nama, holder);
  Api.call('kelas_siswa', { id_kelas: k.id_kelas }, { retries: 2 }).then(function (res) {
    if (!res.ok) { setChildren(holder, h('p', { class: 'form-msg' }, res.error.pesan)); return; }
    const targets = d.kelas.filter(function (x) { return x.status === 'aktif' && x.id_kelas !== k.id_kelas; })
      .map(function (x) { return [x.id_kelas, 'Kelas ' + x.nama]; });
    if (!res.data.siswa.length) { setChildren(holder, h('p', { class: 'field-hint' }, 'Belum ada siswa di kelas ini.')); return; }
    setChildren(holder, h('p', { class: 'field-hint' }, 'Catatan lama siswa tetap tercatat di kelas asalnya.'), res.data.siswa.map(function (s) {
      const sel = selectEl('', [['', 'Pindahkan ke…']].concat(targets), '');
      sel.setAttribute('aria-label', 'Kelas tujuan untuk ' + s.nama);
      const btn = h('button', { type: 'button', class: 'mini' }, '↔️ Pindah');
      btn.addEventListener('click', function () {
        if (!sel.value) { Toast.show('Pilih kelas tujuan dulu.', 'err'); return; }
        runBusy(btn, '…', async function () {
          const r = await Api.call('siswa_pindah', { id_siswa: s.id_siswa, id_kelas: sel.value }, { retries: 0 });
          if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
          Toast.show(s.nama + ' dipindahkan ✓', 'ok');
          const row = btn.closest('.srow');
          if (row) row.remove();
          onDone();
        });
      });
      return h('div', { class: 'srow' },
        h('div', { class: 'sinfo' }, h('strong', {}, s.nama), h('span', { class: 'field-hint' }, s.nisn + (s.status === 'aktif' ? '' : ' · ' + s.status))), sel, btn);
    }));
  });
}

function openPromotion(d, onDone) {
  const act = d.kelas.filter(function (k) { return k.status === 'aktif'; });
  const t7 = act.filter(function (k) { return k.tingkat === '7'; });
  const t8 = act.filter(function (k) { return k.tingkat === '8'; });
  const t9 = act.filter(function (k) { return k.tingkat === '9'; });
  const names = {}, lulus = {};
  function nameRow(k) {
    const inp = h('input', { class: 'input', maxlength: '30', style: 'max-width:150px', 'aria-label': 'Nama baru untuk ' + k.nama });
    inp.value = suggestClassName(k.nama, k.tingkat);
    names[k.id_kelas] = inp;
    return h('div', { class: 'drow' }, h('span', {}, k.nama + ' (' + k.jumlah_aktif + ' siswa) →'), inp);
  }
  const conf = h('input', { class: 'input', id: 'nk-conf', placeholder: 'NAIK KELAS', autocomplete: 'off' });
  const kids = [
    h('div', { class: 'banner' }, '⚠️ Lakukan setelah tahun ajaran berakhir. Kelas 9 diarsipkan dan siswanya berstatus lulus (tidak bisa masuk lagi). Sebaiknya cadangkan dulu: Google Sheet → Berkas → Buat salinan.'),
    h('strong', {}, 'Kelas 7 menjadi kelas 8'), t7.length ? t7.map(nameRow) : h('p', { class: 'field-hint' }, 'Tidak ada kelas 7 aktif.'),
    h('strong', {}, 'Kelas 8 menjadi kelas 9'), t8.length ? t8.map(nameRow) : h('p', { class: 'field-hint' }, 'Tidak ada kelas 8 aktif.'),
    h('strong', {}, 'Kelas 9 lulus'),
    t9.length ? t9.map(function (k) { const c = checkRow('', k.nama + ' (' + k.jumlah_aktif + ' siswa) lulus', true); lulus[k.id_kelas] = c; return c.el; })
      : h('p', { class: 'field-hint' }, 'Tidak ada kelas 9 aktif.'),
    field('Ketik NAIK KELAS untuk melanjutkan', 'nk-conf', conf)
  ];
  formModal('🎓 Naik Kelas', kids, 'Jalankan Naik Kelas', async function () {
    const pemetaan = t7.concat(t8).map(function (k) { return { id_kelas: k.id_kelas, nama_baru: names[k.id_kelas].value }; });
    const ids = t9.filter(function (k) { return lulus[k.id_kelas].get(); }).map(function (k) { return k.id_kelas; });
    const r = await Api.call('naik_kelas', { pemetaan: pemetaan, lulus: ids, konfirmasi: conf.value.trim() }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show(r.data.naik + ' kelas naik, ' + r.data.lulus_siswa + ' siswa lulus ✓', 'ok');
    onDone();
    return '';
  });
}

function viewAdminClasses() {
  const root = h('section', {}), body = h('div', {});
  function load() {
    setChildren(body, loading());
    Api.call('kelas_daftar', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      draw(res.data);
    });
  }
  function draw(d) {
    setChildren(body,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn', onclick: function () { openClassForm(null, d.wali, load); } }, '➕ Tambah kelas'),
        h('button', { type: 'button', class: 'btn ghost', onclick: function () { openPromotion(d, load); } }, '🎓 Naik Kelas')),
      d.kelas.length ? d.kelas.map(function (k) {
        const jadwal = (k.jam_buka && k.jam_tutup) ? 'Dibuka ' + k.jam_buka + '–' + k.jam_tutup : 'Pengisian selalu terbuka';
        return h('div', { class: 'srow' + (k.status === 'aktif' ? '' : ' off') },
          h('div', { class: 'sinfo' }, h('strong', {}, 'Kelas ' + k.nama + ' (tingkat ' + k.tingkat + ')'),
            h('span', { class: 'field-hint' }, 'Wali: ' + (k.wali_nama || 'belum ada') + ' · ' + k.jumlah_aktif + ' siswa · ' + (k.pengisian_aktif ? jadwal : 'Pengisian ditutup'))),
          h('div', { class: 'stags' }, k.status === 'aktif' ? null : h('span', { class: 'tag wait' }, 'Arsip')),
          h('div', { class: 'sbtns' },
            h('button', { type: 'button', class: 'mini', onclick: function () { openClassStudents(k, d, load); } }, '👥 Siswa'),
            h('button', { type: 'button', class: 'mini', onclick: function () { openClassForm(k, d.wali, load); } }, '✏️ Ubah'),
            h('button', {
              type: 'button', class: 'mini danger', onclick: function () {
                confirmDialog('Hapus kelas ' + k.nama + '?', 'Kelas hanya bisa dihapus bila tidak memiliki siswa.', 'Hapus', async function () {
                  const r = await Api.call('kelas_hapus', { id_kelas: k.id_kelas }, { retries: 0 });
                  if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                  load();
                });
              }
            }, 'Hapus')));
      }) : h('div', { class: 'card center' }, h('div', { class: 'big-emoji' }, '🏫'), h('p', { class: 'lead' }, 'Belum ada kelas. Tambahkan kelas pertama.')));
  }
  setChildren(root, h('h1', { class: 'page-title' }, '🧑‍🏫 Kelas'), body);
  load();
  return root;
}

/* ================= AKUN ================= */
function showAccountCredential(title, akun, password) {
  const btnCopy = h('button', { type: 'button', class: 'btn' }, '📋 Salin');
  btnCopy.addEventListener('click', function () {
    copyText(akun.nama + '\t' + akun.username + '\t' + password).then(function (ok) { Toast.show(ok ? 'Tersalin ✓' : 'Tidak bisa menyalin. Catat manual.', ok ? 'ok' : 'err'); });
  });
  openModal(title, h('div', {},
    h('div', { class: 'banner' }, '⚠️ Sandi sementara hanya tampil sekarang. Serahkan kepada pemilik akun. Ia wajib menggantinya saat masuk pertama.'),
    h('div', { class: 'cal-wrap' }, h('table', { class: 'plain' }, h('tbody', {},
      h('tr', {}, h('th', {}, 'Nama'), h('td', {}, akun.nama)),
      h('tr', {}, h('th', {}, 'Username'), h('td', {}, akun.username)),
      h('tr', {}, h('th', {}, 'Sandi sementara'), h('td', { class: 'pin-cell' }, password))))),
    h('div', { style: 'margin-top:12px' }, btnCopy)));
}

function openAccountForm(a, onDone) {
  const peran = selectEl('a-peran', [['wali', 'Wali kelas'], ['admin', 'Admin utama'], ['pembaca', 'Pembaca (kepala sekolah/guru BK)']], a ? a.peran : 'wali');
  const user = textEl('a-user', a ? a.username : '', 30);
  const nama = textEl('a-nama', a ? a.nama : '', 100);
  const nip = textEl('a-nip', a ? a.nip : '', 30);
  const kids = a
    ? [field('Nama lengkap', 'a-nama', nama), field('NIP', 'a-nip', nip, 'Dipakai pada tanda tangan rekap.')]
    : [field('Peran', 'a-peran', peran), field('Username', 'a-user', user, 'Huruf kecil, angka, titik, garis bawah, atau strip.'), field('Nama lengkap', 'a-nama', nama), field('NIP', 'a-nip', nip, 'Opsional.')];
  formModal(a ? 'Ubah akun' : 'Tambah akun', kids, 'Simpan', async function () {
    if (a) {
      const r = await Api.call('akun_ubah', { id_akun: a.id_akun, nama: nama.value, nip: nip.value }, { retries: 0 });
      if (!r.ok) return r.error.pesan;
      Toast.show('Akun diperbarui ✓', 'ok');
    } else {
      const r = await Api.call('akun_buat', { peran: peran.value, username: user.value, nama: nama.value, nip: nip.value }, { retries: 0 });
      if (!r.ok) return r.error.pesan;
      showAccountCredential('Akun baru dibuat', r.data.akun, r.data.password);
    }
    onDone();
    return '';
  });
}

function viewAdminAccounts() {
  const root = h('section', {}), tabsBox = h('div', {}), body = h('div', {});
  let cur = 'akun';
  const PERAN = [['admin', 'Admin utama'], ['wali', 'Wali kelas'], ['pembaca', 'Pembaca']];

  function accounts() {
    setChildren(body, loading());
    Api.call('akun_daftar', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, accounts)); return; }
      const d = res.data;
      function row(a) {
        const info = [a.username, a.nip ? 'NIP ' + a.nip : '', a.kelas.length ? 'Kelas ' + a.kelas.join(', ') : '', a.login_terakhir ? 'Terakhir masuk ' + a.login_terakhir.substring(0, 10) : 'Belum pernah masuk']
          .filter(Boolean).join(' · ');
        return h('div', { class: 'srow' + (a.aktif ? '' : ' off') },
          h('div', { class: 'sinfo' }, h('strong', {}, a.nama), h('span', { class: 'field-hint' }, info)),
          h('div', { class: 'stags' }, a.aktif ? null : h('span', { class: 'tag wait' }, 'Nonaktif'),
            a.terkunci ? h('span', { class: 'tag wait' }, '🔒 Terkunci') : null, a.wajib_ganti ? h('span', { class: 'tag wait' }, 'Sandi awal') : null),
          h('div', { class: 'sbtns' },
            h('button', { type: 'button', class: 'mini', onclick: function () { openAccountForm(a, accounts); } }, '✏️ Ubah'),
            h('button', {
              type: 'button', class: 'mini', onclick: function () {
                confirmDialog('Reset sandi ' + a.nama + '?', 'Sandi sementara baru dibuat dan akun dibuka kuncinya. Pemilik wajib menggantinya saat masuk.', 'Reset sandi', async function () {
                  const r = await Api.call('akun_reset', { id_akun: a.id_akun }, { retries: 0 });
                  if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                  showAccountCredential('Sandi baru', r.data.akun, r.data.password);
                  accounts();
                });
              }
            }, '🔑 Reset sandi'),
            h('button', {
              type: 'button', class: 'mini', onclick: function () {
                Api.call('akun_status', { id_akun: a.id_akun, aktif: !a.aktif }, { retries: 0 }).then(function (r) {
                  if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                  accounts();
                });
              }
            }, a.aktif ? 'Nonaktifkan' : 'Aktifkan'),
            h('button', {
              type: 'button', class: 'mini danger', onclick: function () {
                confirmDialog('Hapus akun ' + a.nama + '?', 'Akun tidak bisa lagi dipakai masuk. Wali kelas yang masih bertugas tidak bisa dihapus.', 'Hapus', async function () {
                  const r = await Api.call('akun_hapus', { id_akun: a.id_akun }, { retries: 0 });
                  if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                  accounts();
                });
              }
            }, 'Hapus')));
      }
      setChildren(body,
        d.admin_aktif < 2 ? h('div', { class: 'banner' }, '⚠️ Baru ' + d.admin_aktif + ' admin utama aktif. Sebaiknya ada minimal dua agar aplikasi tidak bergantung pada satu orang.') : null,
        h('button', { type: 'button', class: 'btn', onclick: function () { openAccountForm(null, accounts); } }, '➕ Tambah akun'),
        PERAN.map(function (pr) {
          const list = d.akun.filter(function (a) { return a.peran === pr[0]; });
          return h('div', {}, h('h2', { class: 'section-title' }, pr[1] + ' (' + list.length + ')'),
            list.length ? list.map(row) : h('p', { class: 'field-hint' }, 'Belum ada.'));
        }));
    });
  }

  function logs() {
    setChildren(body, loading());
    Api.call('log_baca', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, logs)); return; }
      const all = res.data.log;
      const kinds = {};
      all.forEach(function (x) { kinds[x.aksi] = true; });
      const filter = selectEl('lg-f', [['', 'Semua aktivitas']].concat(Object.keys(kinds).sort().map(function (k) { return [k, k]; })), '');
      const tbl = h('div', {});
      function paint() {
        const list = all.filter(function (x) { return !filter.value || x.aksi === filter.value; });
        setChildren(tbl, h('div', { class: 'cal-wrap' }, h('table', { class: 'plain logtable' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Waktu'), h('th', {}, 'Pelaku'), h('th', {}, 'Aktivitas'), h('th', {}, 'Target'), h('th', {}, 'Rincian'))),
          h('tbody', {}, list.map(function (x) {
            return h('tr', {}, h('td', {}, x.waktu), h('td', {}, (x.nama || '—') + (x.peran ? ' (' + x.peran + ')' : '')), h('td', {}, x.aksi), h('td', {}, x.target), h('td', {}, x.detail));
          })))));
      }
      filter.addEventListener('change', paint);
      setChildren(body, h('p', { class: 'field-hint' }, '300 aktivitas terakhir (terbaru di atas). Sandi dan PIN tidak pernah dicatat.'), field('Saring', 'lg-f', filter), tbl);
      paint();
    });
  }

  function show() {
    setChildren(tabsBox, chipTabs([{ id: 'akun', t: 'Akun' }, { id: 'log', t: 'Log aktivitas' }], cur, function (id) { cur = id; show(); }));
    if (cur === 'akun') accounts(); else logs();
  }
  setChildren(root, h('h1', { class: 'page-title' }, '🔐 Akun & Keamanan'), tabsBox, body);
  show();
  return root;
}

/* ================= LIHAT SEBAGAI WALI KELAS ================= */
function viewAdminAsTeacher(profile, settings) {
  const root = h('section', {}), head = h('div', {}), body = h('div', {});
  let kelas = [], pick = '', tab = 'pemantauan';
  const tabs = [
    { id: 'pemantauan', t: '👀 Pemantauan' }, { id: 'siswa', t: '👥 Siswa' }, { id: 'validasi', t: '✍️ Validasi' },
    { id: 'rekap', t: '📋 Rekap' }, { id: 'refleksi', t: '📝 Refleksi' }
  ];
  function render() {
    const k = kelas.filter(function (x) { return x.id_kelas === pick; })[0];
    if (!k) { setChildren(body, h('div', { class: 'card center' }, h('p', { class: 'lead' }, 'Pilih kelas untuk dilihat.'))); return; }
    TeacherState.kelasId = k.id_kelas;
    const pseudo = { id: profile.id, peran: 'wali', nama: profile.nama, wajib_ganti: false, adminView: true, kelas: [{ id: k.id_kelas, nama: k.nama }] };
    setChildren(body,
      h('div', { class: 'banner info' }, '🔎 Anda melihat sebagai wali kelas ' + k.nama + '. Perubahan tercatat atas nama Anda.'),
      TEACHER_VIEWS[tab](pseudo, settings));
  }
  function drawHead() {
    const sel = selectEl('lw-kelas', [['', 'Pilih kelas…']].concat(kelas.map(function (k) { return [k.id_kelas, 'Kelas ' + k.nama]; })), pick);
    sel.addEventListener('change', function () { pick = sel.value; render(); });
    setChildren(head, h('h1', { class: 'page-title' }, '🔎 Lihat sebagai Wali Kelas'), field('Kelas', 'lw-kelas', sel),
      chipTabs(tabs, tab, function (id) { tab = id; drawHead(); render(); }));
  }
  setChildren(root, head, body);
  setChildren(head, loading());
  Api.call('kelas_daftar', {}, { retries: 2 }).then(function (res) {
    if (!res.ok) { setChildren(head, errorBlock(res.error.pesan, null)); return; }
    kelas = res.data.kelas.filter(function (k) { return k.status === 'aktif'; });
    drawHead();
    render();
  });
  return root;
}

/* ================= PENGUMUMAN ================= */
function openAnnForm(a, kelas, onDone) {
  const judul = textEl('p-judul', a ? a.judul : '', 80);
  const isi = h('textarea', { class: 'input', id: 'p-isi', rows: '4', maxlength: '400' });
  isi.value = a ? a.isi : '';
  const target = selectEl('p-target', [['semua', 'Semua kelas']].concat(kelas.map(function (k) { return [k.id_kelas, 'Kelas ' + k.nama]; })), a ? a.target : 'semua');
  const mulai = h('input', { class: 'input', id: 'p-mulai', type: 'date' });
  const selesai = h('input', { class: 'input', id: 'p-selesai', type: 'date' });
  mulai.value = a ? a.mulai : ''; selesai.value = a ? a.selesai : '';
  const aktif = checkRow('p-aktif', 'Tampilkan pengumuman ini', a ? a.aktif === 'ya' : true);
  formModal(a ? 'Ubah pengumuman' : 'Pengumuman baru', [
    field('Judul', 'p-judul', judul), field('Isi', 'p-isi', isi), field('Untuk', 'p-target', target),
    field('Tampil mulai (opsional)', 'p-mulai', mulai), field('Tampil sampai (opsional)', 'p-selesai', selesai), aktif.el
  ], 'Simpan', async function () {
    const r = await Api.call('pengumuman_simpan', {
      id_pengumuman: a ? a.id_pengumuman : '', judul: judul.value, isi: isi.value, target: target.value,
      mulai: mulai.value, selesai: selesai.value, aktif: aktif.get()
    }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show('Pengumuman tersimpan ✓', 'ok'); onDone(); return '';
  });
}

function viewAdminAnnouncements() {
  const root = h('section', {}), body = h('div', {});
  function load() {
    setChildren(body, loading());
    Api.call('pengumuman_daftar', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      const d = res.data;
      const nm = {};
      d.kelas.forEach(function (k) { nm[k.id_kelas] = k.nama; });
      setChildren(body,
        h('p', { class: 'field-hint' }, 'Pengumuman tampil di beranda siswa (halaman Hari Ini), paling banyak 5 sekaligus.'),
        h('button', { type: 'button', class: 'btn', onclick: function () { openAnnForm(null, d.kelas, load); } }, '➕ Pengumuman baru'),
        d.pengumuman.length ? d.pengumuman.map(function (a) {
          const rentang = (a.mulai || a.selesai) ? ' · ' + (a.mulai || '…') + ' s/d ' + (a.selesai || '…') : '';
          return h('div', { class: 'srow' + (a.aktif === 'ya' ? '' : ' off') },
            h('div', { class: 'sinfo' }, h('strong', {}, a.judul),
              h('span', { class: 'field-hint' }, (a.target === 'semua' ? 'Semua kelas' : 'Kelas ' + (nm[a.target] || '?')) + rentang),
              a.isi ? h('span', { class: 'prewrap' }, a.isi) : null),
            h('div', { class: 'sbtns' },
              h('button', { type: 'button', class: 'mini', onclick: function () { openAnnForm(a, d.kelas, load); } }, '✏️ Ubah'),
              h('button', {
                type: 'button', class: 'mini danger', onclick: function () {
                  confirmDialog('Hapus pengumuman?', a.judul, 'Hapus', async function () {
                    const r = await Api.call('pengumuman_hapus', { id_pengumuman: a.id_pengumuman }, { retries: 0 });
                    if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                    load();
                  });
                }
              }, 'Hapus')));
        }) : h('div', { class: 'card center' }, h('div', { class: 'big-emoji' }, '📣'), h('p', { class: 'lead' }, 'Belum ada pengumuman.')));
    });
  }
  setChildren(root, h('h1', { class: 'page-title' }, '📣 Pengumuman'), body);
  load();
  return root;
}
