/** backup.js — Tahap 7: cadangan, pemulihan, dan arsip tahun ajaran (admin). */
EXTRA_VIEWS.admin.cadangan = viewAdminBackup;

function viewAdminBackup() {
  const root = h('section', {}), tabsBox = h('div', {}), body = h('div', {});
  let cur = 'cadangan';
  function show() {
    setChildren(tabsBox, chipTabs([{ id: 'cadangan', t: 'Cadangan' }, { id: 'arsip', t: 'Arsip tahun ajaran' }], cur, function (id) { cur = id; show(); }));
    if (cur === 'cadangan') backupTab(body); else archiveTab(body);
  }
  setChildren(root, h('h1', { class: 'page-title' }, '💾 Cadangan & Arsip'), tabsBox, body);
  show();
  return root;
}

function openRestore(b, onDone) {
  const conf = h('input', { class: 'input', id: 'rs-conf', placeholder: 'PULIHKAN', autocomplete: 'off' });
  formModal('Pulihkan dari cadangan', [
    h('div', { class: 'banner' }, '⚠️ Semua data aplikasi akan DIGANTI dengan isi cadangan "' + b.nama + '". Perubahan setelah cadangan itu akan hilang, termasuk sandi yang sudah diganti. Cadangan pengaman dibuat otomatis lebih dulu. Proses bisa beberapa menit; jangan menutup halaman, dan sebaiknya lakukan di luar jam pemakaian.'),
    field('Ketik PULIHKAN untuk melanjutkan', 'rs-conf', conf)
  ], 'Pulihkan sekarang', async function () {
    const r = await Api.call('cadangan_pulihkan', { id_berkas: b.id, konfirmasi: conf.value.trim() }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show('Data dipulihkan ✓ Muat ulang halaman.', 'ok');
    onDone();
    return '';
  });
}

function backupTab(body) {
  function load() {
    setChildren(body, loading());
    Api.call('cadangan_info', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      const d = res.data, st = d.pengaturan;
      const aktif = checkRow('bk-aktif', 'Cadangan otomatis harian aktif', st.backup_aktif);
      const jam = h('input', { class: 'input', id: 'bk-jam', type: 'number', min: '0', max: '23', inputmode: 'numeric' });
      const simpan = h('input', { class: 'input', id: 'bk-simpan', type: 'number', min: '3', max: '60', inputmode: 'numeric' });
      jam.value = st.backup_jam; simpan.value = st.backup_simpan;
      const msg = h('p', { class: 'form-msg', role: 'alert' });
      const bSave = h('button', { type: 'button', class: 'btn' }, 'Simpan pengaturan cadangan');
      bSave.addEventListener('click', function () {
        runBusy(bSave, 'Menyimpan…', async function () {
          msg.textContent = '';
          const r = await Api.call('cadangan_pengaturan', { backup_aktif: aktif.get(), backup_jam: jam.value, backup_simpan: simpan.value }, { retries: 0 });
          if (!r.ok) { msg.textContent = r.error.pesan; return; }
          Toast.show('Pengaturan cadangan tersimpan ✓', 'ok');
          load();
        });
      });
      const bNow = h('button', { type: 'button', class: 'btn ghost' }, '💾 Cadangkan sekarang');
      bNow.addEventListener('click', function () {
        runBusy(bNow, 'Membuat cadangan…', async function () {
          const r = await Api.call('cadangan_sekarang', {}, { retries: 0 });
          if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
          Toast.show('Cadangan dibuat ✓', 'ok');
          load();
        });
      });
      const trig = d.pemicu
        ? h('span', { class: 'tag ok' }, '⏰ Pemicu harian aktif')
        : h('button', {
          type: 'button', class: 'btn', onclick: function () {
            Api.call('cadangan_pasang_pemicu', {}, { retries: 0 }).then(function (r) {
              if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
              Toast.show('Pemicu terpasang pukul ' + r.data.jam + ':00 WIB ✓', 'ok');
              load();
            });
          }
        }, '⏰ Aktifkan pencadangan otomatis');
      setChildren(body,
        h('div', { class: 'card' },
          h('p', {}, d.pemicu ? 'Cadangan otomatis berjalan setiap hari sekitar pukul ' + st.backup_jam + ':00 WIB.' : '⚠️ Pemicu cadangan otomatis belum terpasang.'),
          trig,
          h('div', { class: 'fields', style: 'margin-top:12px' }, aktif.el, field('Jam cadangan (0–23, WIB)', 'bk-jam', jam), field('Jumlah cadangan harian yang disimpan', 'bk-simpan', simpan)),
          msg, bSave),
        h('div', { class: 'btn-row' }, bNow, h('a', { class: 'btn ghost', href: d.folder_url, target: '_blank', rel: 'noopener', style: 'text-align:center;line-height:54px;text-decoration:none' }, '📂 Buka folder')),
        h('h2', { class: 'section-title' }, 'Daftar cadangan'),
        d.daftar.length ? d.daftar.map(function (b) {
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, b.nama), h('span', { class: 'field-hint' }, 'Dibuat ' + b.dibuat + ' WIB')),
            h('div', { class: 'sbtns' },
              h('a', { class: 'mini', href: b.url, target: '_blank', rel: 'noopener', style: 'display:inline-flex;align-items:center;text-decoration:none' }, 'Buka'),
              h('button', { type: 'button', class: 'mini danger', onclick: function () { openRestore(b, load); } }, 'Pulihkan')));
        }) : h('p', { class: 'field-hint' }, 'Belum ada cadangan. Klik "Cadangkan sekarang".'));
    });
  }
  load();
}

function archiveTab(body) {
  function load() {
    setChildren(body, loading());
    Api.call('arsip_daftar', {}, { retries: 2 }).then(function (res) {
      if (!res.ok) { setChildren(body, errorBlock(res.error.pesan, load)); return; }
      const d = res.data;
      const ret = h('input', { class: 'input', id: 'ar-ret', type: 'number', min: '1', max: '20', inputmode: 'numeric' });
      ret.value = d.retensi_tahun;
      const bRet = h('button', { type: 'button', class: 'mini' }, 'Simpan');
      bRet.addEventListener('click', function () {
        runBusy(bRet, '…', async function () {
          const r = await Api.call('cadangan_pengaturan', { retensi_tahun: ret.value }, { retries: 0 });
          if (!r.ok) { Toast.show(r.error.pesan, 'err'); return; }
          Toast.show('Masa simpan arsip tersimpan ✓', 'ok');
          load();
        });
      });
      setChildren(body,
        h('div', { class: 'banner info' }, 'Setelah tahun ajaran berakhir, catatan harian dan refleksinya dipindahkan ke spreadsheet arsip supaya aplikasi tetap cepat. Siswa dan wali tidak lagi melihat catatan tahun itu di aplikasi. Data tetap bisa dibuka di Google Drive.'),
        h('div', { class: 'card' }, field('Masa simpan arsip (tahun setelah tahun ajaran berakhir)', 'ar-ret', ret, 'Arsip hanya bisa dihapus setelah masa ini lewat, dan selalu atas perintah Anda.'), bRet),
        h('h2', { class: 'section-title' }, 'Tahun ajaran'),
        d.tahun.map(function (t) {
          let aksi = null, tag;
          if (t.diarsipkan) tag = h('span', { class: 'tag ok' }, 'Sudah diarsipkan');
          else if (!t.selesai) tag = h('span', { class: 'tag wait' }, 'Belum berakhir');
          else {
            tag = h('span', { class: 'tag ok' }, 'Siap diarsipkan');
            aksi = h('button', { type: 'button', class: 'mini', onclick: function () { openArchiveYear(t, load); } }, '📦 Arsipkan');
          }
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, 'Tahun ajaran ' + t.nama), h('span', { class: 'field-hint' }, t.mulai + ' s/d ' + t.akhir + ' · ' + t.semester.join(', '))),
            h('div', { class: 'stags' }, tag), aksi);
        }),
        h('h2', { class: 'section-title' }, 'Arsip tersimpan'),
        d.arsip.length ? d.arsip.map(function (a) {
          return h('div', { class: 'srow' },
            h('div', { class: 'sinfo' }, h('strong', {}, 'Arsip ' + a.nama), h('span', { class: 'field-hint' }, 'Dibuat ' + a.tanggal + ' · ' + a.jurnal + ' catatan harian, ' + a.refleksi + ' refleksi' + (a.lewat_retensi ? ' · masa simpan lewat' : ''))),
            h('div', { class: 'sbtns' },
              h('a', { class: 'mini', href: a.url, target: '_blank', rel: 'noopener', style: 'display:inline-flex;align-items:center;text-decoration:none' }, 'Buka'),
              a.lewat_retensi ? h('button', { type: 'button', class: 'mini danger', onclick: function () { openArchiveDelete(a, load); } }, 'Hapus') : null));
        }) : h('p', { class: 'field-hint' }, 'Belum ada arsip.'));
    });
  }
  load();
}

function openArchiveYear(t, onDone) {
  const conf = h('input', { class: 'input', id: 'ay-conf', placeholder: 'ARSIPKAN', autocomplete: 'off' });
  formModal('Arsipkan tahun ajaran ' + t.nama, [
    h('div', { class: 'banner' }, '⚠️ Catatan harian dan refleksi tahun ajaran ' + t.nama + ' dipindahkan ke spreadsheet arsip, lalu dihapus dari data aktif setelah jumlah barisnya diverifikasi. Cadangan pengaman dibuat otomatis. Proses bisa 1–3 menit; jangan menutup halaman.'),
    field('Ketik ARSIPKAN untuk melanjutkan', 'ay-conf', conf)
  ], 'Arsipkan sekarang', async function () {
    const r = await Api.call('arsip_tutup_tahun', { nama: t.nama, konfirmasi: conf.value.trim() }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show('Diarsipkan: ' + r.data.jurnal + ' catatan harian ✓', 'ok');
    onDone();
    return '';
  });
}

function openArchiveDelete(a, onDone) {
  const conf = h('input', { class: 'input', id: 'ad-conf', placeholder: 'HAPUS ARSIP', autocomplete: 'off' });
  formModal('Hapus arsip ' + a.nama, [
    h('div', { class: 'banner' }, '⚠️ Arsip dipindahkan ke tempat sampah Google Drive (bisa dipulihkan dari sana selama 30 hari) dan dihapus dari daftar.'),
    field('Ketik HAPUS ARSIP untuk melanjutkan', 'ad-conf', conf)
  ], 'Hapus arsip', async function () {
    const r = await Api.call('arsip_hapus', { id: a.id, konfirmasi: conf.value.trim() }, { retries: 0 });
    if (!r.ok) return r.error.pesan;
    Toast.show('Arsip dihapus', 'ok');
    onDone();
    return '';
  });
}
