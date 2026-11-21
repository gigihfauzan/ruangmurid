/** teacher.js — halaman wali kelas: Pemantauan, Siswa, Validasi, Rekap, Refleksi. */

const TEACHER_VIEWS = {
  pemantauan: viewMonitor, siswa: viewStudents, validasi: viewValidation, rekap: viewRecap, refleksi: viewClassReflection
};
const TeacherState = { kelasId: null };

/** Kerangka: judul, pilihan kelas (jika lebih dari satu), lalu isi lewat build(kelasId, body). */
function teacherFrame(profile, title, build) {
  const root = h('section', {}), kelas = profile.kelas || [];
  if (!kelas.length) {
    setChildren(root, h('h1', { class: 'page-title' }, title),
      h('div', { class: 'card center' }, h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🏫'),
        h('p', { class: 'lead' }, 'Belum ada kelas yang ditugaskan kepada Anda. Silakan hubungi admin.')));
    return root;
  }
  if (!kelas.some(function (k) { return k.id === TeacherState.kelasId; })) TeacherState.kelasId = kelas[0].id;
  const head = h('div', {}), body = h('div', {});
  function drawHead() {
    setChildren(head, h('h1', { class: 'page-title' }, title),
      kelas.length > 1
        ? h('div', { class: 'chips', role: 'group', 'aria-label': 'Pilih kelas' }, kelas.map(function (k) {
          return h('button', {
            type: 'button', class: 'chip-btn', 'aria-pressed': String(k.id === TeacherState.kelasId),
            onclick: function () { TeacherState.kelasId = k.id; drawHead(); build(k.id, body); }
          }, 'Kelas ' + k.nama);
        }))
        : h('p', { class: 'field-hint' }, 'Kelas ' + kelas[0].nama));
  }
  drawHead();
  setChildren(root, head, body);
  build(TeacherState.kelasId, body);
  return root;
}

function confirmDialog(title, message, okLabel, onOk) {
  let m;
  const ok = h('button', { type: 'button', class: 'btn' }, okLabel);
  ok.addEventListener('click', function () {
    runBusy(ok, 'Memproses…', async function () { await onOk(); m.close(); });
  });
  m = openModal(title, h('div', {}, h('p', {}, message), ok,
    h('button', { type: 'button', class: 'btn ghost', style: 'margin-top:10px', onclick: function () { m.close(); } }, 'Batal')));
}

function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return false; });
  return Promise.resolve(false);
}

function printCredentials(title, items) {
  let pa = document.getElementById('print-area');
  if (!pa) { pa = h('div', { id: 'print-area' }); document.body.appendChild(pa); }
  setChildren(pa, h('h2', {}, title), h('p', {}, 'Dicetak ' + formatDate(State.settings.hari_ini)),
    credTable(items),
    h('p', {}, 'Setiap siswa wajib mengganti PIN saat masuk pertama. Rahasiakan PIN dan jangan dibagikan.'));
  window.addEventListener('afterprint', function () { setChildren(pa); }, { once: true });
  window.print();
}

function credTable(items) {
  return h('table', { class: 'plain' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Nama'), h('th', {}, 'NISN'), h('th', {}, 'PIN'))),
    h('tbody', {}, items.map(function (i) {
      return h('tr', {}, h('td', {}, i.nama), h('td', {}, i.nisn), h('td', { class: 'pin-cell' }, i.pin));
    })));
}

/** PIN awal hanya tampil sekali. Setelah ditutup tidak bisa dilihat lagi (hanya bisa direset). */
function showCredentials(title, items) {
  const text = items.map(function (i) { return i.nama + '\t' + i.nisn + '\t' + i.pin; }).join('\n');
  const btnCopy = h('button', { type: 'button', class: 'btn ghost' }, '📋 Salin');
  btnCopy.addEventListener('click', function () {
    copyText(text).then(function (ok) { Toast.show(ok ? 'Tersalin ✓' : 'Tidak bisa menyalin. Gunakan tombol Cetak.', ok ? 'ok' : 'err'); });
  });
  const btnPrint = h('button', { type: 'button', class: 'btn' }, '🖨️ Cetak');
  btnPrint.addEventListener('click', function () { printCredentials(title, items); });
  openModal(title, h('div', {},
    h('div', { class: 'banner' }, '⚠️ PIN hanya tampil sekarang. Salin atau cetak sebelum menutup. Jika terlewat, PIN bisa direset kapan saja.'),
    h('div', { class: 'cal-wrap' }, credTable(items)),
    h('div', { class: 'btn-row' }, btnCopy, btnPrint)));
}

/* ---------- Impor dari Excel ---------- */
function normJk(v) {
  const s = String(v || '').trim().toLowerCase();
  if (['l', 'lk', 'laki', 'laki-laki', 'laki laki', 'pria', 'cowok'].indexOf(s) >= 0) return 'L';
  if (['p', 'pr', 'perempuan', 'wanita', 'cewek'].indexOf(s) >= 0) return 'P';
  return String(v || '').trim().toUpperCase();
}

/** Mengurai data tempel (tab dari Excel, atau ; , dari CSV). Baris judul dilewati. */
function parseImport(text) {
  const rows = [];
  text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (ln, i) {
    const delim = ln.indexOf('\t') >= 0 ? '\t' : (ln.indexOf(';') >= 0 ? ';' : ',');
    const cells = ln.split(delim).map(function (c) { return c.trim().replace(/^"(.*)"$/, '$1').trim(); });
    if (i === 0 && /nisn/i.test(cells[0])) return;
    let nisn = cells[0] || '';
    if (/^\d{5,9}$/.test(nisn)) nisn = nisn.padStart(10, '0'); // nol di depan hilang saat dari Excel
    rows.push([nisn, cells[1] || '', normJk(cells[2])]);
  });
  return rows;
}

function downloadTemplate() {
  const csv = '\ufeffNISN,Nama,L/P\r\n0012345678,Contoh Siswa Satu,L\r\n0012345679,Contoh Siswa Dua,P\r\n';
  try {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = h('a', { href: url, download: 'template-siswa.csv' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  } catch (e) {
    Toast.show('Tidak dapat membuat berkas. Ketik manual dengan kolom: NISN, Nama, L/P.', 'err');
  }
}

function openImport(kelasId, onDone) {
  const ta = h('textarea', { class: 'input', id: 'imp-text', rows: '8', placeholder: 'Tempel dari Excel di sini…\n0012345678\tBudi Santoso\tL' });
  const out = h('div', {});
  const btnCheck = h('button', { type: 'button', class: 'btn' }, 'Periksa data');
  const btnSave = h('button', { type: 'button', class: 'btn', hidden: true }, 'Simpan');
  let m, rowsData = [];

  function renderPreview(d) {
    setChildren(out,
      h('p', { class: 'field-hint' }, d.jumlah_ok + ' baris siap disimpan' + (d.jumlah_gagal ? ', ' + d.jumlah_gagal + ' perlu diperbaiki.' : '.')),
      h('div', { class: 'cal-wrap' }, h('table', { class: 'plain' },
        h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'NISN'), h('th', {}, 'Nama'), h('th', {}, 'L/P'), h('th', {}, 'Hasil'))),
        h('tbody', {}, d.results.map(function (r) {
          return h('tr', {}, h('td', {}, r.baris), h('td', {}, r.nisn), h('td', {}, r.nama), h('td', {}, r.jk),
            h('td', {}, r.ok ? h('span', { class: 'tag ok' }, 'Siap') : h('span', { class: 'tag wait' }, r.pesan)));
        })))));
    btnSave.textContent = 'Simpan ' + d.jumlah_ok + ' siswa';
    btnSave.hidden = d.jumlah_ok === 0;
  }

  btnCheck.addEventListener('click', function () {
    runBusy(btnCheck, 'Memeriksa…', async function () {
      rowsData = parseImport(ta.value);
      btnSave.hidden = true;
      if (!rowsData.length) { setChildren(out, h('p', { class: 'form-msg' }, 'Belum ada data. Tempel dulu dari Excel ya.')); return; }
      const res = await Api.call('siswa_impor', { id_kelas: kelasId, baris: rowsData, simulasi: true }, { retries: 1 });
      if (!res.ok) { setChildren(out, h('p', { class: 'form-msg' }, res.error.pesan)); return; }
      renderPreview(res.data);
    });
  });
  btnSave.addEventListener('click', function () {
    runBusy(btnSave, 'Menyimpan…', async function () {
      const res = await Api.call('siswa_impor', { id_kelas: kelasId, baris: rowsData, simulasi: false }, { retries: 0 });
      if (!res.ok) { Toast.show(res.error.pesan, 'err'); return; }
      m.close();
      const ok = res.data.results.filter(function (r) { return r.ok; });
      if (ok.length) showCredentials('PIN awal siswa baru', ok.map(function (r) { return { nama: r.nama, nisn: r.nisn, pin: r.pin }; }));
      if (res.data.jumlah_gagal) Toast.show(res.data.jumlah_gagal + ' baris tidak disimpan.', 'err');
      onDone();
    });
  });

  m = openModal('Impor siswa dari Excel', h('div', {},
    h('ol', { class: 'steps' },
      h('li', {}, 'Siapkan tiga kolom: NISN, Nama, L/P.'),
      h('li', {}, 'Salin dari Excel lalu tempel di kotak di bawah.'),
      h('li', {}, 'Klik Periksa data, lalu Simpan.')),
    h('p', { class: 'field-hint' }, 'NISN 10 angka. Nol di depan yang hilang dari Excel akan dilengkapi otomatis. Maksimal 80 siswa sekali impor.'),
    h('button', { type: 'button', class: 'btn ghost', style: 'margin:8px 0 12px', onclick: downloadTemplate }, '⬇️ Unduh template (CSV)'),
    field('Data siswa', 'imp-text', ta), btnCheck, out, h('div', { style: 'margin-top:12px' }, btnSave)));
}

/* ---------- Tambah dan ubah siswa ---------- */
function openStudentForm(kelasId, student, onDone) {
  const isEdit = !!student;
  const msg = h('p', { class: 'form-msg', role: 'alert' });
  const nisn = h('input', { class: 'input', id: 'sf-nisn', inputmode: 'numeric', maxlength: '10' });
  const nama = h('input', { class: 'input', id: 'sf-nama', maxlength: '100', autocomplete: 'off' });
  const jk = h('select', { class: 'input', id: 'sf-jk' }, h('option', { value: 'L' }, 'Laki-laki'), h('option', { value: 'P' }, 'Perempuan'));
  if (isEdit) { nisn.value = student.nisn; nama.value = student.nama; jk.value = student.jk; }
  const btn = h('button', { type: 'submit', class: 'btn' }, isEdit ? 'Simpan perubahan' : 'Tambah siswa');
  let m;
  async function submit() {
    msg.textContent = '';
    if (!/^\d{10}$/.test(nisn.value.trim())) { msg.textContent = 'NISN terdiri dari 10 angka.'; return; }
    if (nama.value.trim().length < 2) { msg.textContent = 'Isi nama siswa.'; return; }
    const payload = { id_kelas: kelasId, nisn: nisn.value.trim(), nama: nama.value, jk: jk.value };
    const res = isEdit
      ? await Api.call('siswa_ubah', Object.assign({ id_siswa: student.id_siswa }, payload), { retries: 0 })
      : await Api.call('siswa_tambah', payload, { retries: 0 });
    if (!res.ok) { msg.textContent = res.error.pesan; return; }
    m.close();
    if (isEdit) Toast.show('Data siswa diperbarui ✓', 'ok');
    else showCredentials('PIN awal ' + res.data.siswa.nama, [{ nama: res.data.siswa.nama, nisn: res.data.siswa.nisn, pin: res.data.pin }]);
    onDone();
  }
  m = openModal(isEdit ? 'Ubah data siswa' : 'Tambah siswa', h('form', {
    class: 'auth-form', novalidate: true,
    onsubmit: function (e) { e.preventDefault(); runBusy(btn, 'Menyimpan…', submit); }
  }, h('div', { class: 'fields' }, field('NISN', 'sf-nisn', nisn, '10 angka'), field('Nama lengkap', 'sf-nama', nama), field('Jenis kelamin', 'sf-jk', jk)), msg, btn));
}

/* ---------- Halaman Siswa ---------- */
function viewStudents(profile) {
  return teacherFrame(profile, '👥 Siswa', function (kelasId, body) {
    function load() {
      setChildren(body, loading());
      Api.call('kelas_siswa', { id_kelas: kelasId }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
        draw(res.data);
      });
    }
    function setStatus(s, status) {
      Api.call('siswa_status', { id_kelas: kelasId, id_siswa: s.id_siswa, status: status }, { retries: 1 }).then(function (r) {
        if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
        Toast.show(status === 'aktif' ? s.nama + ' diaktifkan ✓' : s.nama + ' dinonaktifkan', 'ok');
        load();
      });
    }
    function rowFor(s) {
      const last = s.login_terakhir ? 'Terakhir masuk ' + s.login_terakhir.substring(0, 10) : 'Belum pernah masuk';
      return h('div', { class: 'srow' + (s.status === 'aktif' ? '' : ' off') },
        h('div', { class: 'sinfo' }, h('strong', {}, s.nama),
          h('span', { class: 'field-hint' }, s.nisn + ' · ' + (s.jk === 'L' ? 'Laki-laki' : 'Perempuan') + ' · ' + last)),
        h('div', { class: 'stags' },
          s.status === 'aktif' ? null : h('span', { class: 'tag wait' }, 'Nonaktif'),
          s.terkunci ? h('span', { class: 'tag wait' }, '🔒 Terkunci') : null,
          s.wajib_ganti ? h('span', { class: 'tag wait' }, 'PIN awal') : null),
        h('div', { class: 'sbtns' },
          h('button', { type: 'button', class: 'mini', onclick: function () { openStudentForm(kelasId, s, load); } }, '✏️ Ubah'),
          h('button', {
            type: 'button', class: 'mini', onclick: function () {
              confirmDialog('Reset PIN ' + s.nama + '?', 'PIN baru akan dibuat dan akun dibuka kuncinya. Siswa diminta mengganti PIN saat masuk.', 'Reset PIN', async function () {
                const r = await Api.call('siswa_reset_pin', { id_kelas: kelasId, id_siswa: s.id_siswa }, { retries: 0 });
                if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
                showCredentials('PIN baru ' + r.data.nama, [{ nama: r.data.nama, nisn: r.data.nisn, pin: r.data.pin }]);
                load();
              });
            }
          }, '🔑 Reset PIN'),
          s.status === 'aktif'
            ? h('button', {
              type: 'button', class: 'mini danger', onclick: function () {
                confirmDialog('Nonaktifkan ' + s.nama + '?', 'Siswa tidak bisa masuk dan tidak dihitung di pemantauan dan rekap. Datanya tetap tersimpan, dan bisa diaktifkan lagi.', 'Nonaktifkan', async function () { setStatus(s, 'nonaktif'); });
              }
            }, 'Nonaktifkan')
            : h('button', { type: 'button', class: 'mini', onclick: function () { setStatus(s, 'aktif'); } }, 'Aktifkan')));
    }
    function draw(d) {
      setChildren(body,
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('strong', {}, d.jumlah.aktif), h('span', {}, 'siswa aktif')),
          h('div', { class: 'stat' }, h('strong', {}, d.jumlah.l), h('span', {}, 'laki-laki')),
          h('div', { class: 'stat' }, h('strong', {}, d.jumlah.p), h('span', {}, 'perempuan'))),
        h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn', onclick: function () { openStudentForm(kelasId, null, load); } }, '➕ Tambah siswa'),
          h('button', { type: 'button', class: 'btn ghost', onclick: function () { openImport(kelasId, load); } }, '📥 Impor dari Excel')),
        d.siswa.length ? d.siswa.map(rowFor)
          : h('div', { class: 'card center' }, h('div', { class: 'big-emoji' }, '🧒'), h('p', { class: 'lead' }, 'Belum ada siswa di kelas ini. Tambahkan satu per satu atau impor dari Excel.')));
    }
    load();
  });
}

/* ---------- Pemantauan hari ini ---------- */
function reasonText(x) {
  if (x.kode === 'tidak_mengisi') return 'Belum mengisi ' + x.hari + ' hari terakhir. Mungkin perlu disapa dengan hangat 💛';
  if (x.kode === 'tidur_kurang') return 'Durasi tidur beberapa malam terakhir di bawah ' + x.jam + ' jam. Bisa diajak ngobrol tentang jam tidurnya 🌙';
  return '';
}

function viewMonitor(profile) {
  return teacherFrame(profile, '👀 Pemantauan Hari Ini', function (kelasId, body) {
    function load(fresh) {
      setChildren(body, loading());
      Api.call('pemantauan', { id_kelas: kelasId, segarkan: !!fresh }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, function () { load(true); })); return; }
        draw(res.data);
      });
    }
    function draw(d) {
      const pct = d.jumlah ? Math.round(d.sudah * 100 / d.jumlah) : 0;
      const belum = d.siswa.filter(function (s) { return !s.isi; });
      const sudah = d.siswa.filter(function (s) { return s.isi; });
      const att = d.siswa.filter(function (s) { return s.perhatian.length; });
      const bar = h('span', {});
      bar.style.width = pct + '%';
      setChildren(body,
        h('div', { class: 'hero-card' },
          h('p', { class: 'hero-date' }, formatDate(d.hari_ini) + ' · diperbarui ' + d.dibuat + ' WIB'),
          h('h1', {}, d.sudah + ' dari ' + d.jumlah + ' siswa sudah mengisi'),
          h('div', { class: 'progress light' }, bar),
          h('p', {}, pct + '% hari ini. Terima kasih sudah mendampingi mereka 💛')),
        h('button', { type: 'button', class: 'btn ghost', style: 'margin:12px 0', onclick: function () { load(true); } }, '🔄 Segarkan'),
        h('h2', { class: 'section-title' }, 'Perlu disapa 💛'),
        att.length ? att.map(function (s) {
          return h('div', { class: 'att' }, h('strong', {}, s.nama), s.perhatian.map(function (x) { return h('p', { class: 'field-hint' }, reasonText(x)); }));
        }) : h('p', { class: 'field-hint' }, 'Tidak ada yang perlu perhatian khusus saat ini. Keren!'),
        h('h2', { class: 'section-title' }, 'Belum mengisi hari ini (' + belum.length + ')'),
        belum.length ? h('div', { class: 'names' }, belum.map(function (s) { return h('span', { class: 'name-chip' }, s.nama); }))
          : h('p', { class: 'field-hint' }, 'Semua siswa sudah mengisi hari ini 🎉'),
        h('details', { class: 'about' }, h('summary', {}, 'Sudah mengisi (' + sudah.length + ')'),
          h('div', { class: 'names', style: 'margin-top:8px' }, sudah.map(function (s) {
            return h('span', { class: 'name-chip' }, s.nama + ' · ' + s.jumlah_v + '/' + d.jumlah_kebiasaan);
          }))));
    }
    load(false);
  });
}

/* ---------- Validasi paraf ---------- */
function viewValidation(profile, settings) {
  return teacherFrame(profile, '✍️ Validasi Paraf', function (kelasId, body) {
    let tanggal = settings.hari_ini, data = null;

    function dateBar() {
      const inp = h('input', { type: 'date', class: 'input', id: 'v-date', value: tanggal, max: settings.hari_ini });
      inp.addEventListener('change', function () {
        if (inp.value && inp.value <= settings.hari_ini) { tanggal = inp.value; load(); }
      });
      return h('div', { class: 'card' }, field('Tanggal catatan', 'v-date', inp));
    }
    function load() {
      setChildren(body, dateBar(), loading());
      Api.call('validasi_hari', { id_kelas: kelasId, tanggal: tanggal }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(body, dateBar(), errorBlock(res.error.pesan, load)); return; }
        data = res.data;
        draw();
      });
    }
    function draw() {
      const counts = {};
      const head = h('tr', {}, h('th', { class: 'stick' }, 'Siswa'), data.kebiasaan.map(function (k) {
        counts[k.id] = h('small', {}, '✍ ' + data.total_paraf[k.id]);
        return h('th', { class: 'colhead' }, h('span', {}, habitLook(k.id).emoji), h('small', {}, k.nama), counts[k.id]);
      }));
      function cell(sw, k) {
        const v = sw.s[k.id];
        if (!sw.ada) return h('td', { class: 'cell off' }, '—');
        if (v === 'x') return h('td', { class: 'cell no' }, '✕');
        if (v !== 'v') return h('td', { class: 'cell' }, '');
        const on = !!sw.val[k.id];
        const b = h('button', { type: 'button', class: 'paraf' + (on ? ' on' : ''), 'aria-pressed': String(on), 'aria-label': 'Paraf ' + k.nama + ' ' + sw.nama }, on ? '✍️' : '○');
        b.addEventListener('click', function () {
          const want = !sw.val[k.id];
          b.disabled = true;
          Api.call('validasi_set', { id_kelas: kelasId, id_siswa: sw.id_siswa, tanggal: data.tanggal, id_kebiasaan: k.id, nilai: want }, { retries: 1 }).then(function (r) {
            b.disabled = false;
            if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
            if (want) sw.val[k.id] = true; else delete sw.val[k.id];
            data.total_paraf[k.id] += want ? 1 : -1;
            counts[k.id].textContent = '✍ ' + data.total_paraf[k.id];
            b.classList.toggle('on', want); b.setAttribute('aria-pressed', String(want)); b.textContent = want ? '✍️' : '○';
          });
        });
        return h('td', { class: 'cell yes' }, b);
      }
      const rows = data.siswa.map(function (sw) {
        return h('tr', {}, h('th', { class: 'stick' }, sw.nama), data.kebiasaan.map(function (k) { return cell(sw, k); }));
      });

      /* Validasi massal */
      const dari = h('input', { type: 'date', class: 'input', id: 'b-dari', value: tanggal, max: settings.hari_ini });
      const sampai = h('input', { type: 'date', class: 'input', id: 'b-sampai', value: tanggal, max: settings.hari_ini });
      const checks = data.kebiasaan.map(function (k) {
        const c = h('input', { type: 'checkbox', class: 'chk', checked: true });
        return { k: k, c: c, el: h('label', { class: 'ortu', style: 'margin:6px 0' }, c, h('span', {}, habitLook(k.id).emoji + ' ' + k.nama)) };
      });
      function bulk(nilai) {
        const ids = checks.filter(function (x) { return x.c.checked; }).map(function (x) { return x.k.id; });
        if (!ids.length) { Toast.show('Pilih minimal satu kebiasaan.', 'err'); return; }
        if (!dari.value || !sampai.value) { Toast.show('Isi tanggal awal dan akhir.', 'err'); return; }
        confirmDialog(nilai ? 'Beri paraf massal?' : 'Batalkan paraf massal?',
          (nilai ? 'Paraf akan diberikan' : 'Paraf akan dibatalkan') + ' untuk seluruh siswa kelas ini, tanggal ' + dari.value + ' sampai ' + sampai.value +
          ', pada kebiasaan terpilih' + (nilai ? ' yang berstatus Sudah.' : '.'),
          nilai ? 'Beri paraf' : 'Batalkan paraf', async function () {
            const r = await Api.call('validasi_massal', { id_kelas: kelasId, dari: dari.value, sampai: sampai.value, kebiasaan: ids, nilai: nilai }, { retries: 0 });
            if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
            Toast.show((nilai ? r.data.paraf + ' paraf ditambahkan ✓' : r.data.paraf + ' paraf dibatalkan'), 'ok');
            load();
          });
      }
      setChildren(body, dateBar(),
        h('p', { class: 'field-hint' }, 'Ketuk ○ untuk memberi paraf (✍️) pada kebiasaan yang dilakukan siswa. Paraf hanya untuk kebiasaan berstatus ✓.'),
        h('div', { class: 'cal-wrap' }, h('table', { class: 'cal' }, head, rows)),
        h('details', { class: 'about card', style: 'margin-top:16px' }, h('summary', {}, 'Validasi massal satu kelas'),
          h('div', { class: 'fields', style: 'margin-top:12px' }, field('Dari tanggal', 'b-dari', dari), field('Sampai tanggal', 'b-sampai', sampai),
            h('div', {}, h('strong', {}, 'Kebiasaan'), checks.map(function (x) { return x.el; }))),
          h('div', { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn', onclick: function () { bulk(true); } }, '✍️ Beri paraf'),
            h('button', { type: 'button', class: 'btn ghost', onclick: function () { bulk(false); } }, 'Batalkan paraf')),
          h('p', { class: 'field-hint' }, 'Maksimal 31 hari sekali proses.')));
    }
    load();
  });
}

/* ---------- Rekap bulanan ---------- */
function openNote(siswa, bulan, onSaved) {
  const ta = h('textarea', { class: 'input', id: 'note-text', rows: '5', maxlength: '500', placeholder: 'Catatan wali kelas untuk ' + siswa.nama + '…' });
  ta.value = siswa.catatan || '';
  const btn = h('button', { type: 'button', class: 'btn' }, 'Simpan catatan');
  let m;
  btn.addEventListener('click', function () {
    runBusy(btn, 'Menyimpan…', async function () {
      const r = await Api.call('catatan_simpan', { id_kelas: TeacherState.kelasId, id_siswa: siswa.id_siswa, bulan: bulan, catatan: ta.value }, { retries: 1 });
      if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
      siswa.catatan = ta.value.trim();
      Toast.show('Catatan tersimpan ✓', 'ok');
      m.close();
      onSaved();
    });
  });
  m = openModal('Catatan: ' + siswa.nama, h('div', {}, field('Catatan', 'note-text', ta, 'Maksimal 500 karakter. Siswa dapat membaca catatan ini di halaman Refleksi.'), btn));
}

function renderRecap(d, redraw) {
  const colHead = function (emoji, label) { return h('th', { class: 'colhead' }, h('span', {}, emoji), h('small', {}, label)); };
  const head = h('tr', {}, h('th', { class: 'stick' }, 'Nama'),
    d.kebiasaan.map(function (k) { return colHead(habitLook(k.id).emoji, k.nama); }), colHead('😴', 'Tidur'), colHead('📝', 'Catatan'));
  const rows = d.siswa.map(function (s) {
    return h('tr', {},
      h('th', { class: 'stick' }, h('button', {
        type: 'button', class: 'linkbtn', onclick: function () {
          const body = h('div', {}, d.kebiasaan.map(function (k) {
            const x = s.kebiasaan.filter(function (y) { return y.id === k.id; })[0];
            return h('div', { class: 'drow' }, h('span', {}, habitLook(k.id).emoji + ' ' + k.nama),
              h('span', {}, x ? x.hari + ' hari · ' + x.persen + '% · ' + x.kategori + (x.paraf ? ' · ✍️' + x.paraf : '') : '—'));
          }), h('div', { class: 'drow' }, h('span', {}, '😴 Rata-rata tidur'), h('span', {}, s.tidur !== null ? fmtDuration(s.tidur) : '—')),
          h('div', { class: 'drow' }, h('span', {}, '📝 Refleksi terisi'), h('span', {}, s.refleksi_terisi + ' kebiasaan')));
          openModal(s.nama + ' (' + s.jk + ')', body);
        }
      }, s.nama, h('small', {}, ' ' + s.jk))),
      s.kebiasaan.map(function (k) {
        return h('td', { class: 'rc ' + (k.kategori === 'Sudah Terbiasa' ? 'ok' : 'wait') }, h('strong', {}, k.hari),
          h('small', {}, k.persen + '%' + (k.paraf ? ' ✍' + k.paraf : '')));
      }),
      h('td', { class: 'rc' }, s.tidur !== null ? h('small', {}, fmtDuration(s.tidur)) : h('small', {}, '—')),
      h('td', { class: 'rc' }, h('button', { type: 'button', class: 'mini', 'aria-label': 'Catatan ' + s.nama, onclick: function () { openNote(s, d.bulan, redraw); } }, s.catatan ? '📝✓' : '📝')));
  });
  const agg = h('tr', { class: 'extra' }, h('th', { class: 'stick' }, 'Sudah Terbiasa'),
    d.ringkas.map(function (r) { return h('td', { class: 'rc' }, h('strong', {}, r.sudah + '/' + r.dari), h('small', {}, 'rata² ' + r.rata_persen + '%')); }),
    h('td', {}), h('td', {}));
  return h('div', {},
    h('p', { class: 'field-hint' }, 'Kelas ' + d.kelas.nama + ' · ' + d.kelas.l + ' laki-laki, ' + d.kelas.p + ' perempuan · target Sudah Terbiasa ' + d.target + ' dari ' + d.dari_hari + ' hari. Ketuk nama untuk detail.'),
    h('div', { class: 'cal-wrap' }, h('table', { class: 'cal' }, head, rows, agg)),
    h('p', { class: 'field-hint' }, 'Angka besar = jumlah hari melakukan. Hijau = Sudah Terbiasa, kuning = Belum Terbiasa. ✍ = jumlah paraf.'));
}

function viewRecap(profile, settings) {
  return teacherFrame(profile, '📋 Rekap Bulanan', function (kelasId, body) {
    let month = settings.hari_ini.substring(0, 7), last = null;
    function load() {
      const nav = monthNav(month, settings.hari_ini, function (m) { month = m; load(); });
      setChildren(body, nav, loading());
      Api.call('rekap_kelas', { id_kelas: kelasId, bulan: month }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(body, nav, errorBlock(res.error.pesan, load)); return; }
        last = res.data;
        setChildren(body, nav, renderRecap(last, function () { setChildren(body, nav, renderRecap(last, arguments.callee)); }));
      });
    }
    load();
  });
}

/* ---------- Refleksi kelas ---------- */
function viewClassReflection(profile, settings) {
  return teacherFrame(profile, '📝 Refleksi Siswa', function (kelasId, body) {
    let month = settings.hari_ini.substring(0, 7);
    function openDetail(s) {
      const holder = h('div', {}, loading());
      openModal('Refleksi ' + s.nama, holder);
      Api.call('refleksi_siswa', { id_kelas: kelasId, id_siswa: s.id_siswa, bulan: month }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(holder, h('p', { class: 'form-msg' }, res.error.pesan)); return; }
        const d = res.data, isi = d.refleksi.isi || {};
        const note = h('textarea', { class: 'input', id: 'rn-text', rows: '4', maxlength: '500', placeholder: 'Catatan wali kelas…' });
        note.value = d.refleksi.catatan_wali || '';
        const btn = h('button', { type: 'button', class: 'btn' }, 'Simpan catatan');
        btn.addEventListener('click', function () {
          runBusy(btn, 'Menyimpan…', async function () {
            const r = await Api.call('catatan_simpan', { id_kelas: kelasId, id_siswa: s.id_siswa, bulan: month, catatan: note.value }, { retries: 1 });
            if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
            Toast.show('Catatan tersimpan ✓', 'ok');
          });
        });
        setChildren(holder, d.form.kebiasaan.map(function (k) {
          const r = d.ringkasan.filter(function (x) { return x.id === k.id; })[0], v = isi[k.id] || {}, look = habitLook(k.id);
          const card = h('div', { class: 'sum-card' },
            h('div', { class: 'sum-head' }, h('span', { class: 'fill-emoji', 'aria-hidden': 'true' }, look.emoji), h('strong', {}, k.nama),
              r ? h('span', { class: 'tag ' + (r.kategori === 'Sudah Terbiasa' ? 'ok' : 'wait') }, r.kategori) : null),
            h('p', { class: 'field-hint' }, 'Kesimpulan / refleksi'), h('p', { class: 'prewrap' }, v.kesimpulan || '—'),
            h('p', { class: 'field-hint' }, 'Tindak lanjut'), h('p', { class: 'prewrap' }, v.tindak_lanjut || '—'));
          applyLook(card, look.c);
          return card;
        }), field('Catatan wali kelas', 'rn-text', note), btn);
      });
    }
    function load() {
      const nav = monthNav(month, settings.hari_ini, function (m) { month = m; load(); });
      setChildren(body, nav, loading());
      Api.call('refleksi_kelas', { id_kelas: kelasId, bulan: month }, { retries: 2 }).then(function (res) {
        if (!res.ok) { setChildren(body, nav, errorBlock(res.error.pesan, load)); return; }
        const d = res.data;
        setChildren(body, nav, d.siswa.map(function (s) {
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, s.nama),
              h('span', { class: 'field-hint' }, 'Refleksi terisi ' + s.terisi + ' dari ' + d.total + ' kebiasaan' + (s.ada_catatan ? ' · ada catatan wali' : ''))),
            h('button', { type: 'button', class: 'mini', onclick: function () { openDetail(s); } }, 'Baca'));
        }));
      });
    }
    load();
  });
}
