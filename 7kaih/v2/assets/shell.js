/** shell.js — kerangka tampilan per peran. Isi tiap halaman dibuat di tahap yang tertera. */

const MENUS = {
  siswa: [
    { id: 'hari-ini', label: 'Hari Ini', emoji: '✅', tahap: 3, desc: 'Catat tujuh kebiasaanmu hari ini.' },
    { id: 'kalender', label: 'Kalender', emoji: '🗓️', tahap: 3, desc: 'Lihat catatan sebulan penuh seperti lembar kertas resmi.' },
    { id: 'ringkasan', label: 'Ringkasan', emoji: '📊', tahap: 3, desc: 'Lihat perkembangan tiap kebiasaan bulan ini.' },
    { id: 'refleksi', label: 'Refleksi', emoji: '📝', tahap: 3, desc: 'Tulis refleksi bulanan bersama orang tua atau wali.' },
    { id: 'stiker', label: 'Stiker', emoji: '⭐', tahap: 3, desc: 'Kumpulkan stiker dari kebiasaan baikmu.' }
  ],
  wali: [
    { id: 'pemantauan', label: 'Pemantauan', emoji: '👀', tahap: 4, desc: 'Siapa yang sudah mengisi hari ini dan siapa yang perlu disapa.' },
    { id: 'siswa', label: 'Siswa', emoji: '👥', tahap: 4, desc: 'Kelola data siswa kelas Anda, impor dari Excel, dan reset PIN.' },
    { id: 'validasi', label: 'Validasi', emoji: '✍️', tahap: 4, desc: 'Paraf digital per siswa, tanggal, dan kebiasaan.' },
    { id: 'rekap', label: 'Rekap', emoji: '📋', tahap: 4, desc: 'Rekap bulanan kelas dan catatan wali kelas.' },
    { id: 'refleksi', label: 'Refleksi', emoji: '📝', tahap: 4, desc: 'Baca refleksi bulanan siswa.' }
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', emoji: '🏫', tahap: 6, desc: 'Rekap sekolah per kelas dan per kebiasaan.' },
    { id: 'pengaturan', label: 'Pengaturan', emoji: '⚙️', tahap: 5, desc: 'Tahun ajaran, kriteria, aturan pengisian, identitas sekolah, dan form.' },
    { id: 'kelas', label: 'Kelas', emoji: '🧑‍🏫', tahap: 5, desc: 'Kelas, wali kelas, jadwal pengisian, dan Naik Kelas.' },
    { id: 'akun', label: 'Akun', emoji: '🔐', tahap: 5, desc: 'Kelola admin, wali kelas, dan pembaca.' },
    { id: 'lihat-wali', label: 'Lihat Wali', emoji: '🔎', tahap: 5, desc: 'Buka tampilan wali kelas mana pun.' },
    { id: 'pengumuman', label: 'Pengumuman', emoji: '📣', tahap: 5, desc: 'Pengumuman singkat di beranda siswa.' },
    { id: 'ekspor', label: 'Ekspor', emoji: '📤', tahap: 6, desc: 'Unduh rekap dan data harian dalam format xlsx.' }
  ],
  pembaca: [
    { id: 'dashboard', label: 'Dashboard', emoji: '🏫', tahap: 6, desc: 'Rekap sekolah per kelas dan per kebiasaan.' },
    { id: 'rekap', label: 'Rekap', emoji: '📋', tahap: 6, desc: 'Rekap bulanan semua kelas (hanya lihat).' }
  ]
};
const PANDUAN = { id: 'panduan', label: 'Panduan', emoji: '📖', tahap: 3, desc: 'Penjelasan singkat tiap kebiasaan.' };

function soonNote(tahap, text) {
  return h('div', { class: 'soon' }, h('span', { class: 'pill soft' }, 'Segera hadir · Tahap ' + tahap), h('p', {}, text));
}

function viewSoon(item) {
  return h('section', {},
    h('h1', { class: 'page-title' }, item.emoji + ' ' + item.label),
    h('div', { class: 'card center' },
      h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, item.emoji),
      h('p', { class: 'lead' }, item.desc),
      soonNote(item.tahap, 'Bagian ini sedang disiapkan.')));
}

function viewToday(profile, settings) {
  const kelas = (profile.kelas && profile.kelas[0]) ? 'Kelas ' + profile.kelas[0].nama : '';
  return h('section', {},
    h('div', { class: 'hero-card' },
      h('p', { class: 'hero-date' }, formatDate(settings.hari_ini)),
      h('h1', {}, 'Halo, ' + firstName(profile.nama) + '! 👋'),
      h('p', {}, settings.teks_sambutan),
      kelas ? h('span', { class: 'pill' }, kelas) : null),
    h('h2', { class: 'section-title' }, 'Tujuh Kebiasaan Hebat'),
    h('div', { class: 'habit-grid' }, HABITS.map(habitCard)),
    soonNote(3, 'Pengisian harian akan aktif di tahap berikutnya.'));
}

function viewGuide() {
  return h('section', {},
    h('h1', { class: 'page-title' }, '📖 Panduan 7 Kebiasaan'),
    h('div', { class: 'habit-grid' }, HABITS.map(habitCard)),
    soonNote(3, 'Penjelasan lengkap tiap kebiasaan akan tampil di sini.'));
}

function renderShell(root, profile, settings, actions) {
  const menu = MENUS[profile.peran] || [];
  const content = h('main', { class: 'content', id: 'content', tabindex: '-1' });
  const links = menu.map(function (item) {
    return h('a', { href: '#/' + item.id, class: 'nav-item', 'data-id': item.id },
      h('span', { class: 'nav-emoji', 'aria-hidden': 'true' }, item.emoji),
      h('span', { class: 'nav-label' }, item.label));
  });
  const nav = h('nav', { class: 'nav', 'aria-label': 'Menu utama' }, links);

  const isStudent = profile.peran === 'siswa';
  const roleLabel = { admin: 'Admin', wali: 'Wali Kelas', pembaca: 'Pembaca', siswa: 'Siswa' }[profile.peran] || '';
  const menuBox = h('div', { class: 'menu', hidden: true },
    h('div', { class: 'menu-head' }, h('strong', {}, profile.nama), h('span', {}, roleLabel)),
    h('button', { type: 'button', class: 'menu-item', onclick: function () { menuBox.hidden = true; actions.onChangeSecret(); } },
      isStudent ? '🔑 Ganti PIN' : '🔑 Ganti kata sandi'),
    isStudent ? h('a', { class: 'menu-item', href: '#/panduan', onclick: function () { menuBox.hidden = true; } }, '📖 Panduan 7 Kebiasaan') : null,
    h('button', { type: 'button', class: 'menu-item danger', onclick: actions.onLogout }, '🚪 Keluar'));
  const userBtn = h('button', {
    type: 'button', class: 'user-chip', 'aria-haspopup': 'true',
    onclick: function (e) { e.stopPropagation(); menuBox.hidden = !menuBox.hidden; }
  }, h('span', { class: 'avatar', 'aria-hidden': 'true' }, firstName(profile.nama).charAt(0).toUpperCase()),
    h('span', { class: 'user-name' }, firstName(profile.nama)));

  const logo = (settings.logo_url && /^https:\/\//.test(settings.logo_url))
    ? h('img', { class: 'brand-logo', src: settings.logo_url, alt: '' }) : h('span', { class: 'brand-emoji', 'aria-hidden': 'true' }, '🌱');
  const top = h('header', { class: 'topbar' },
    h('div', { class: 'brand' }, logo, h('span', { class: 'brand-name' }, settings.nama_aplikasi)),
    h('div', { class: 'user-wrap' }, userBtn, menuBox));

  setChildren(root, h('div', { class: 'shell' }, top, nav, content));

  if (renderShell.closer) document.removeEventListener('click', renderShell.closer);
  renderShell.closer = function () { menuBox.hidden = true; };
  document.addEventListener('click', renderShell.closer);

  function route() {
    const m = /^#\/([a-z-]+)/.exec(location.hash);
    const id = m ? m[1] : '';
    const item = menu.filter(function (x) { return x.id === id; })[0] || (isStudent && id === 'panduan' ? PANDUAN : null) || menu[0];
    if (!item) return;
    links.forEach(function (a) {
      const on = a.getAttribute('data-id') === item.id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    let view;
    try {
      if (isStudent && typeof STUDENT_VIEWS !== 'undefined' && STUDENT_VIEWS[item.id]) {
        view = STUDENT_VIEWS[item.id](profile, settings);
      } else if (profile.peran === 'wali') {
        if (typeof TEACHER_VIEWS === 'undefined') throw new Error('Berkas assets/teacher.js belum termuat. Periksa unggahan dan index.html.');
        view = TEACHER_VIEWS[item.id] ? TEACHER_VIEWS[item.id](profile, settings) : viewSoon(item);
      } else {
        view = viewSoon(item);
      }
    } catch (e) {
      if (window.console) console.error(e);
      view = h('div', { class: 'card center' },
        h('div', { class: 'big-emoji', 'aria-hidden': 'true' }, '🛠️'),
        h('p', { class: 'form-msg' }, 'Halaman ini gagal ditampilkan: ' + (e && e.message ? e.message : e)),
        h('p', { class: 'field-hint' }, 'Muat ulang paksa halaman (Ctrl+F5). Jika pesan yang sama muncul, kirimkan pesan di atas.'));
    }
    setChildren(content, view);
    window.scrollTo(0, 0);
  }
}
