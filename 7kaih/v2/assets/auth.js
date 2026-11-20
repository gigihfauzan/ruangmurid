/** auth.js — layar masuk dan ganti PIN/kata sandi. */

function renderLogin(root, settings, onLoggedIn) {
  let mode = 'siswa';
  const msg = h('p', { class: 'form-msg', role: 'alert' });
  const nisn = h('input', { class: 'input', id: 'f-nisn', inputmode: 'numeric', maxlength: '10', autocomplete: 'username', placeholder: '10 angka NISN' });
  const pin = h('input', { class: 'input', id: 'f-pin', type: 'password', inputmode: 'numeric', maxlength: '6', autocomplete: 'current-password', placeholder: '6 angka' });
  const user = h('input', { class: 'input', id: 'f-user', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', placeholder: 'Username' });
  const pass = h('input', { class: 'input', id: 'f-pass', type: 'password', autocomplete: 'current-password', maxlength: '64', placeholder: 'Kata sandi' });

  const boxSiswa = h('div', { class: 'fields' }, field('NISN', 'f-nisn', nisn), field('PIN', 'f-pin', passwordField(pin)));
  const boxStaf = h('div', { class: 'fields', hidden: true }, field('Username', 'f-user', user), field('Kata sandi', 'f-pass', passwordField(pass)));

  const tabSiswa = h('button', { type: 'button', role: 'tab', 'aria-selected': 'true', onclick: function () { setMode('siswa'); } }, '🎒 Siswa');
  const tabStaf = h('button', { type: 'button', role: 'tab', 'aria-selected': 'false', onclick: function () { setMode('staf'); } }, '🧑‍🏫 Guru / Staf');
  const btn = h('button', { type: 'submit', class: 'btn' }, 'Masuk');

  function setMode(m) {
    mode = m;
    boxSiswa.hidden = m !== 'siswa';
    boxStaf.hidden = m !== 'staf';
    tabSiswa.setAttribute('aria-selected', String(m === 'siswa'));
    tabStaf.setAttribute('aria-selected', String(m === 'staf'));
    msg.textContent = '';
    (m === 'siswa' ? nisn : user).focus();
  }
  function setMsg(t) { msg.textContent = t; }

  async function submit() {
    setMsg('');
    let res, secret;
    if (mode === 'siswa') {
      const n = nisn.value.trim();
      if (!/^\d{10}$/.test(n)) return setMsg('NISN terdiri dari 10 angka.');
      if (!/^\d{6}$/.test(pin.value)) return setMsg('PIN terdiri dari 6 angka.');
      secret = pin.value;
      res = await Api.call('login_siswa', { nisn: n, pin: secret }, { retries: 2 });
    } else {
      if (!user.value.trim() || !pass.value) return setMsg('Isi username dan kata sandi.');
      secret = pass.value;
      res = await Api.call('login_staf', { username: user.value.trim(), password: secret }, { retries: 2 });
    }
    if (!res.ok) { setMsg(res.error.pesan); pin.value = ''; pass.value = ''; return; }
    Api.setToken(res.data.token);
    onLoggedIn(res.data.user, secret);
  }

  const form = h('form', {
    class: 'auth-form', novalidate: true,
    onsubmit: function (e) { e.preventDefault(); runBusy(btn, 'Memeriksa…', submit); }
  },
    h('div', { class: 'seg', role: 'tablist' }, tabSiswa, tabStaf), boxSiswa, boxStaf, msg, btn);

  const logo = (settings.logo_url && /^https:\/\//.test(settings.logo_url))
    ? h('img', { class: 'auth-logo', src: settings.logo_url, alt: 'Logo sekolah' })
    : h('div', { class: 'auth-logo emoji', 'aria-hidden': 'true' }, '🌱');

  setChildren(root, h('div', { class: 'auth' },
    h('div', { class: 'auth-card' }, logo,
      h('h1', {}, settings.nama_aplikasi),
      h('p', { class: 'auth-school' }, settings.nama_sekolah),
      h('p', { class: 'auth-lead' }, settings.teks_sambutan),
      form, habitDots())));
}

/** Formulir ganti PIN/kata sandi. oldSecret kosong = minta isian sandi saat ini. */
function buildChangeForm(profile, oldSecret, onDone) {
  const isStudent = profile.peran === 'siswa';
  const noun = isStudent ? 'PIN' : 'kata sandi';
  const msg = h('p', { class: 'form-msg', role: 'alert' });
  const mk = function (id, ac) {
    return h('input', { class: 'input', id: id, type: 'password', autocomplete: ac, maxlength: isStudent ? '6' : '64', inputmode: isStudent ? 'numeric' : null });
  };
  const old = mk('f-old', 'current-password'), nw = mk('f-new', 'new-password'), nw2 = mk('f-new2', 'new-password');
  const btn = h('button', { type: 'submit', class: 'btn' }, 'Simpan ' + noun + ' baru');

  const rows = [];
  if (!oldSecret) rows.push(field(noun[0].toUpperCase() + noun.slice(1) + ' saat ini', 'f-old', passwordField(old)));
  rows.push(
    field(noun[0].toUpperCase() + noun.slice(1) + ' baru', 'f-new', passwordField(nw),
      isStudent ? '6 angka, jangan berurutan atau kembar.' : 'Minimal 8 karakter, memuat huruf dan angka.'),
    field('Ulangi ' + noun + ' baru', 'f-new2', passwordField(nw2)));

  async function submit() {
    msg.textContent = '';
    const a = nw.value, lama = oldSecret || old.value;
    if (!lama) { msg.textContent = 'Isi ' + noun + ' saat ini.'; return; }
    if (isStudent && !/^\d{6}$/.test(a)) { msg.textContent = 'PIN baru harus 6 angka.'; return; }
    if (!isStudent && (a.length < 8 || !/[A-Za-z]/.test(a) || !/\d/.test(a))) { msg.textContent = 'Kata sandi minimal 8 karakter, memuat huruf dan angka.'; return; }
    if (a !== nw2.value) { msg.textContent = 'Ketikan ulang belum sama. Coba lagi ya.'; return; }
    const res = await Api.call('ganti_kredensial', { lama: lama, baru: a }, { retries: 0 });
    if (!res.ok) { msg.textContent = res.error.pesan; return; }
    Toast.show(noun[0].toUpperCase() + noun.slice(1) + ' berhasil diganti 🎉', 'ok');
    onDone();
  }
  return h('form', {
    class: 'auth-form', novalidate: true,
    onsubmit: function (e) { e.preventDefault(); runBusy(btn, 'Menyimpan…', submit); }
  }, h('div', { class: 'fields' }, rows), msg, btn);
}

/** Layar wajib ganti PIN/kata sandi setelah login pertama. */
function renderForcedChange(root, profile, oldSecret, onDone, onLogout) {
  const isStudent = profile.peran === 'siswa';
  setChildren(root, h('div', { class: 'auth' }, h('div', { class: 'auth-card' },
    h('div', { class: 'auth-logo emoji', 'aria-hidden': 'true' }, '🔐'),
    h('h1', {}, isStudent ? 'Buat PIN barumu' : 'Buat kata sandi baru'),
    h('p', { class: 'auth-lead' }, isStudent
      ? 'Biar akunmu aman, ganti PIN awal dengan PIN buatanmu sendiri. Pilih 6 angka yang mudah kamu ingat, tapi sulit ditebak orang lain.'
      : 'Demi keamanan, ganti kata sandi sementara dengan kata sandi pribadi Anda sebelum melanjutkan.'),
    buildChangeForm(profile, oldSecret, onDone),
    h('button', { type: 'button', class: 'btn ghost', style: 'margin-top:10px', onclick: onLogout }, 'Keluar'))));
}
