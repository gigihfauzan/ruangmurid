/** app.js — memulai aplikasi: ping, pulihkan sesi, tampilkan layar yang sesuai. */
const State = { settings: null, profile: null };
const appRoot = function () { return document.getElementById('app'); };

function applyTheme(hex) {
  const safe = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#1a73e8';
  const s = document.documentElement.style;
  s.setProperty('--tema', safe);
  s.setProperty('--tema-soft', Color.soft(safe));
  s.setProperty('--tema-ink', Color.ink(safe));
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', safe);
}

function renderLoading() {
  setChildren(appRoot(), h('div', { class: 'center-screen' }, h('div', { class: 'spinner' }), h('p', {}, 'Memuat…')));
}

function renderFatal(text) {
  setChildren(appRoot(), h('div', { class: 'center-screen' },
    h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '📡'),
    h('p', { class: 'form-msg' }, text),
    h('button', { type: 'button', class: 'btn', style: 'max-width:260px', onclick: function () { location.reload(); } }, 'Coba lagi')));
}

function showLogin() {
  State.profile = null;
  renderLogin(appRoot(), State.settings, function (user, secret) { enter(user, secret); });
}

function showApp() {
  renderShell(appRoot(), State.profile, State.settings, {
    onLogout: doLogout,
    onChangeSecret: function () {
      let modal;
      const form = buildChangeForm(State.profile, null, function () { modal.close(); });
      modal = openModal(State.profile.peran === 'siswa' ? 'Ganti PIN' : 'Ganti kata sandi', form);
    }
  });
}

function enter(profile, secret) {
  State.profile = profile;
  if (!profile.wajib_ganti) { showApp(); return; }
  renderForcedChange(appRoot(), profile, secret, async function () {
    const me = await Api.call('profil', {}, { retries: 2 });
    if (me.ok) { State.profile = me.data; showApp(); } else { showLogin(); }
  }, doLogout);
}

async function doLogout() {
  await Api.call('logout', {}, { retries: 0 });
  Api.setToken(null);
  showLogin();
}

(async function boot() {
  renderLoading();
  const ping = await Api.call('ping', {}, { retries: 2 });
  if (!ping.ok) { renderFatal(ping.error.pesan); return; }
  State.settings = ping.data;
  applyTheme(ping.data.warna_tema);
  document.title = ping.data.nama_aplikasi;
  window.addEventListener('sesi-habis', function () { Toast.show('Sesi berakhir. Silakan masuk lagi.'); showLogin(); });
  if (Api.hasToken()) {
    const me = await Api.call('profil', {}, { retries: 1 });
    if (me.ok) { enter(me.data, null); return; }
  }
  showLogin();
})();
