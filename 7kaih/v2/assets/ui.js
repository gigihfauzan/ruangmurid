/** ui.js — pembantu tampilan. Teks dari server SELALU dipasang lewat teks (bukan innerHTML) agar aman dari XSS. */

function append_(el, c) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { append_(el, x); }); return; }
  el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
}

/** h('div', {class:'x', onclick:fn}, anak1, anak2) */
function h(tag, attrs) {
  const el = document.createElement(tag);
  const a = attrs || {};
  Object.keys(a).forEach(function (k) {
    const v = a[k];
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') el.className = v;
    else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  });
  for (let i = 2; i < arguments.length; i++) append_(el, arguments[i]);
  return el;
}

function setChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  for (let i = 1; i < arguments.length; i++) append_(el, arguments[i]);
}

/* ---------- Warna ---------- */
const Color = {
  parse: function (hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return [26, 115, 232];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  mix: function (hex, withHex, t) {
    const a = Color.parse(hex), b = Color.parse(withHex);
    return 'rgb(' + a.map(function (v, i) { return Math.round(v * (1 - t) + b[i] * t); }).join(',') + ')';
  },
  soft: function (hex) { return Color.mix(hex, '#ffffff', 0.88); },
  ink: function (hex) { return Color.mix(hex, '#000000', 0.45); }
};

/* ---------- Tujuh kebiasaan (urutan resmi). Tahap 3 akan membacanya dari server. ---------- */
const HABITS = [
  { id: 'K1', nama: 'Bangun Pagi', emoji: '🌅', c: '#f59e0b' },
  { id: 'K2', nama: 'Beribadah', emoji: '🕊️', c: '#8b5cf6' },
  { id: 'K3', nama: 'Berolahraga', emoji: '🏃', c: '#ef4444' },
  { id: 'K4', nama: 'Makan Sehat dan Bergizi', emoji: '🥗', c: '#16a34a' },
  { id: 'K5', nama: 'Gemar Belajar', emoji: '📚', c: '#3b82f6' },
  { id: 'K6', nama: 'Bermasyarakat', emoji: '🤝', c: '#ec4899' },
  { id: 'K7', nama: 'Tidur Cepat', emoji: '😴', c: '#6366f1' }
];

function habitCard(hb) {
  const el = h('div', { class: 'habit-card' },
    h('span', { class: 'habit-emoji', 'aria-hidden': 'true' }, hb.emoji),
    h('span', { class: 'habit-name' }, hb.nama));
  el.style.setProperty('--c', hb.c);
  el.style.setProperty('--c-soft', Color.soft(hb.c));
  el.style.setProperty('--c-ink', Color.ink(hb.c));
  return el;
}

function habitDots() {
  return h('div', { class: 'dots', 'aria-hidden': 'true' }, HABITS.map(function (hb) {
    const d = h('span');
    d.style.background = hb.c;
    return d;
  }));
}

/* ---------- Formulir ---------- */
function field(label, id, control, hint) {
  return h('div', { class: 'field' },
    h('label', { class: 'field-label', for: id }, label),
    control,
    hint ? h('span', { class: 'field-hint' }, hint) : null);
}

function passwordField(input) {
  const btn = h('button', {
    type: 'button', class: 'eye', 'aria-label': 'Tampilkan atau sembunyikan isian',
    onclick: function () {
      const hide = input.type === 'password';
      input.type = hide ? 'text' : 'password';
      btn.textContent = hide ? 'Tutup' : 'Lihat';
    }
  }, 'Lihat');
  return h('div', { class: 'input-wrap' }, input, btn);
}

/** Menonaktifkan tombol dan menampilkan label sibuk selama fn berjalan. */
async function runBusy(btn, label, fn) {
  if (btn.disabled) return;
  const old = btn.textContent;
  btn.disabled = true;
  btn.classList.add('busy');
  btn.textContent = label;
  try { return await fn(); } finally {
    btn.disabled = false;
    btn.classList.remove('busy');
    btn.textContent = old;
  }
}

/* ---------- Toast dan modal ---------- */
const Toast = {
  show: function (msg, kind) {
    const box = document.getElementById('toast');
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 3800);
  }
};

function openModal(title, body) {
  const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const onKey = function (e) { if (e.key === 'Escape') close(); };
  function close() {
    overlay.remove();
    document.body.classList.remove('noscroll');
    document.removeEventListener('keydown', onKey);
  }
  overlay.appendChild(h('div', { class: 'modal' },
    h('div', { class: 'modal-head' }, h('h2', {}, title),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Tutup', onclick: close }, '✕')),
    body));
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.classList.add('noscroll');
  document.body.appendChild(overlay);
  return { close: close };
}

/* ---------- Teks ---------- */
function firstName(nama) { return String(nama || '').trim().split(/\s+/)[0] || ''; }

function formatDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return '';
  const p = s.split('-').map(Number);
  try {
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return s; }
}
