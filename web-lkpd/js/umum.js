/* ============================================================
 * js/umum.js — Fungsi utilitas umum
 * ============================================================
 * Berisi fungsi bantu yang dipakai di seluruh aplikasi:
 *  - Escape teks dari pengguna (cegah XSS)
 *  - Manipulasi DOM ringan
 *  - Debounce/throttle
 *  - Format waktu & tanggal (Bahasa Indonesia)
 *  - Toast & modal
 *  - Penyimpanan lokal (localStorage)
 *  - Deteksi status online/offline
 *
 * Semua fungsi di sini tidak memuat rahasia.
 * ============================================================ */
(function () {
  'use strict';

  // Namespace global untuk utilitas
  window.UMUM = {};

  // ----------------------------------------------------------
  // ESCAPE TEKS (mencegah XSS)
  // ----------------------------------------------------------

  /**
   * Meng-escape teks agar aman dimasukkan ke HTML (textContent dipakai
   * untuk teks isi, tapi fungsi ini dipakai saat harus menyusun string HTML
   * atau atribut dengan data dari pengguna).
   * @param {string} teks
   * @returns {string} Teks yang sudah di-escape
   */
  UMUM.escapeHtml = function (teks) {
    if (teks === null || teks === undefined) return '';
    return String(teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Meng-escape teks untuk dipakai sebagai nilai atribut HTML.
   * @param {string} teks
   * @returns {string}
   */
  UMUM.escapeAtribut = function (teks) {
    return UMUM.escapeHtml(teks); // sama dengan escapeHtml untuk keperluan kita
  };

  // ----------------------------------------------------------
  // MANIPULASI DOM RINGAN
  // ----------------------------------------------------------

  /** Alias document.getElementById. */
  UMUM.el = function (id) {
    return document.getElementById(id);
  };

  /** Alias querySelector. */
  UMUM.qs = function (selector, konteks) {
    return (konteks || document).querySelector(selector);
  };

  /** Alias querySelectorAll, mengembalikan array. */
  UMUM.qsa = function (selector, konteks) {
    return Array.prototype.slice.call((konteks || document).querySelectorAll(selector));
  };

  /**
   * Membuat elemen DOM dengan atribut & anak.
   * @param {string} tag Nama tag, mis. 'div'
   * @param {object} atribut Objek atribut, mis. { class: 'kartu', 'data-id': '1' }
   * @param {Array|string} anak Array elemen/node atau string teks (akan di-escape & di-set via textContent aman)
   * @returns {HTMLElement}
   */
  UMUM.buatEl = function (tag, atribut, anak) {
    const node = document.createElement(tag);
    if (atribut) {
      for (const k in atribut) {
        if (atribut.hasOwnProperty(k)) {
          if (k === 'class') {
            node.className = atribut[k];
          } else if (k === 'text') {
            node.textContent = atribut[k];
          } else if (k === 'html') {
            // Hanya untuk HTML statis tepercaya (bukan data pengguna)!
            node.innerHTML = atribut[k];
          } else if (k === 'style' && typeof atribut[k] === 'object') {
            for (const prop in atribut[k]) {
              if (atribut[k].hasOwnProperty(prop)) node.style[prop] = atribut[k][prop];
            }
          } else if (k.indexOf('on') === 0 && typeof atribut[k] === 'function') {
            node.addEventListener(k.substring(2).toLowerCase(), atribut[k]);
          } else {
            node.setAttribute(k, atribut[k]);
          }
        }
      }
    }
    if (anak !== undefined && anak !== null) {
      const arr = Array.isArray(anak) ? anak : [anak];
      for (let i = 0; i < arr.length; i++) {
        const a = arr[i];
        if (a === null || a === undefined) continue;
        if (typeof a === 'string' || typeof a === 'number') {
          node.appendChild(document.createTextNode(String(a)));
        } else if (a instanceof Node) {
          node.appendChild(a);
        }
      }
    }
    return node;
  };

  /** Menghapus semua anak elemen. */
  UMUM.kosongkan = function (node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  };

  /** Toggle kelas CSS. */
  UMUM.toggleKelas = function (node, kelas, aktif) {
    if (!node) return;
    if (aktif === undefined) {
      node.classList.toggle(kelas);
    } else if (aktif) {
      node.classList.add(kelas);
    } else {
      node.classList.remove(kelas);
    }
  };

  // ----------------------------------------------------------
  // DEBOUNCE & THROTTLE
  // ----------------------------------------------------------

  /**
   * Debounce: menunda pemanggilan fn sampai `tunggu` ms berlalu
   * sejak pemanggilan terakhir. Berguna untuk simpan otomatis.
   */
  UMUM.debounce = function (fn, tunggu) {
    let timer = null;
    return function () {
      const ctx = this, args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, tunggu);
    };
  };

  /**
   * Throttle: membatasi fn dipanggil maksimal sekali per `batas` ms.
   */
  UMUM.throttle = function (fn, batas) {
    let terakhir = 0, timer = null;
    return function () {
      const ctx = this, args = arguments;
      const sekarang = Date.now();
      const sisa = batas - (sekarang - terakhir);
      if (sisa <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        terakhir = sekarang;
        fn.apply(ctx, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          terakhir = Date.now();
          timer = null;
          fn.apply(ctx, args);
        }, sisa);
      }
    };
  };

  // ----------------------------------------------------------
  // FORMAT WAKTU & TANGGAL (Bahasa Indonesia)
  // ----------------------------------------------------------

  /** Nama bulan dalam Bahasa Indonesia. */
  const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  /**
   * Format string ISO ke tanggal Indonesia, mis. "Senin, 25 Desember 2025".
   * @param {string} iso String tanggal ISO (mis. dari server)
   * @returns {string}
   */
  UMUM.formatTanggal = function (iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return NAMA_HARI[d.getDay()] + ', ' + d.getDate() + ' ' + NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear();
  };

  /**
   * Format string ISO ke waktu Indonesia, mis. "25 Des 2025, 14:30".
   */
  UMUM.formatWaktu = function (iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + NAMA_BULAN[d.getMonth()].substring(0, 3) + ' ' + d.getFullYear() + ', ' + hh + ':' + mm;
  };

  /**
   * Format ukuran byte menjadi string ramah baca, mis. "1.2 MB".
   */
  UMUM.formatUkuran = function (byte) {
    if (!byte && byte !== 0) return '-';
    if (byte < 1024) return byte + ' B';
    if (byte < 1024 * 1024) return (byte / 1024).toFixed(1) + ' KB';
    return (byte / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ----------------------------------------------------------
  // TOAST (notifikasi singkat)
  // ----------------------------------------------------------

  let toastWadah = null;

  /** Memastikan wadah toast ada di DOM. */
  function pastikanToastWadah() {
    if (toastWadah) return toastWadah;
    toastWadah = UMUM.el('wadah-toast');
    if (!toastWadah) {
      toastWadah = UMUM.buatEl('div', { id: 'wadah-toast', class: 'wadah-toast', 'aria-live': 'polite', 'aria-atomic': 'true' });
      document.body.appendChild(toastWadah);
    }
    return toastWadah;
  }

  /**
   * Menampilkan toast (notifikasi singkat).
   * @param {string} pesan Isi pesan
   * @param {string} tipe 'info' | 'sukses' | 'bahaya' | 'peringatan'
   * @param {number} durasiMs Lama tampil (default 3500 ms)
   */
  UMUM.toast = function (pesan, tipe, durasiMs) {
    const wadah = pastikanToastWadah();
    const t = UMUM.buatEl('div', { class: 'toast toast-' + (tipe || 'info'), role: 'status' });
    const ikon = {
      info: 'ℹ️', sukses: '✅', bahaya: '⚠️', peringatan: '⭐'
    };
    const spanIkon = UMUM.buatEl('span', { class: 'toast-ikon', text: ikon[tipe] || ikon.info });
    const spanPesan = UMUM.buatEl('span', { class: 'toast-pesan', text: pesan });
    const tombolTutup = UMUM.buatEl('button', { class: 'toast-tutup', 'aria-label': 'Tutup pesan', text: '✕' });
    tombolTutup.addEventListener('click', function () { tutup(t); });
    t.appendChild(spanIkon);
    t.appendChild(spanPesan);
    t.appendChild(tombolTutup);
    wadah.appendChild(t);
    // Animasi masuk
    requestAnimationFrame(function () { t.classList.add('toast-muncul'); });
    const durasi = durasiMs || 3500;
    setTimeout(function () { tutup(t); }, durasi);

    function tutup(node) {
      node.classList.remove('toast-muncul');
      node.classList.add('toast-hilang');
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 300);
    }
  };

  // ----------------------------------------------------------
  // MODAL & KONFIRMASI
  // ----------------------------------------------------------

  let modalWadah = null;

  /** Memastikan wadah modal ada di DOM. */
  function pastikanModalWadah() {
    if (modalWadah) return modalWadah;
    modalWadah = UMUM.el('wadah-modal');
    if (!modalWadah) {
      modalWadah = UMUM.buatEl('div', { id: 'wadah-modal', class: 'wadah-modal', 'aria-hidden': 'true' });
      const lapis = UMUM.buatEl('div', { class: 'modal-lapis' });
      const kotak = UMUM.buatEl('div', { class: 'modal-kotak', role: 'dialog', 'aria-modal': 'true' });
      lapis.addEventListener('click', function () { UMUM.tutupModal(); });
      modalWadah.appendChild(lapis);
      modalWadah.appendChild(kotak);
      document.body.appendChild(modalWadah);
    }
    return modalWadah;
  }

  /**
   * Menampilkan modal dengan judul, isi (node/HTML tepercaya), dan tombol.
   * @param {object} opt { judul, isi (Node), tombol: [{teks, tipe, onClick}] }
   */
  UMUM.modal = function (opt) {
    const wadah = pastikanModalWadah();
    const kotak = wadah.querySelector('.modal-kotak');
    UMUM.kosongkan(kotak);

    if (opt.judul) {
      kotak.appendChild(UMUM.buatEl('h2', { class: 'modal-judul', text: opt.judul }));
    }
    if (opt.isi instanceof Node) {
      kotak.appendChild(opt.isi);
    } else if (typeof opt.isi === 'string') {
      // Hanya untuk HTML statis tepercaya; data pengguna harus pakai Node.
      const pembungkus = UMUM.buatEl('div', { class: 'modal-isi' });
      pembungkus.innerHTML = opt.isi;
      kotak.appendChild(pembungkus);
    }
    if (opt.tombol && opt.tombol.length) {
      const barTombol = UMUM.buatEl('div', { class: 'modal-tombol' });
      for (let i = 0; i < opt.tombol.length; i++) {
        const t = opt.tombol[i];
        const btn = UMUM.buatEl('button', {
          class: 'tombol tombol-' + (t.tipe || 'sekunder'),
          text: t.teks
        });
        btn.addEventListener('click', function () {
          if (t.onClick) t.onClick(btn);
          if (t.janganTutup !== true) UMUM.tutupModal();
        });
        barTombol.appendChild(btn);
      }
      kotak.appendChild(barTombol);
    }

    wadah.classList.add('modal-aktif');
    wadah.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-terbuka');
    // Fokus ke tombol pertama untuk aksesibilitas
    const fokusPertama = kotak.querySelector('button');
    if (fokusPertama) fokusPertama.focus();
  };

  /** Menutup modal. */
  UMUM.tutupModal = function () {
    if (!modalWadah) return;
    modalWadah.classList.remove('modal-aktif');
    modalWadah.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-terbuka');
  };

  /**
   * Dialog konfirmasi sederhana. Mengembalikan Promise<boolean>.
   * @param {string} pesan
   * @param {string} judul
   * @returns {Promise<boolean>} true jika konfirmasi, false jika batal
   */
  UMUM.konfirmasi = function (pesan, judul) {
    return new Promise(function (resolve) {
      UMUM.modal({
        judul: judul || 'Konfirmasi',
        isi: UMUM.buatEl('p', { class: 'modal-pesan', text: pesan }),
        tombol: [
          { teks: 'Batal', tipe: 'sekunder', onClick: function () { resolve(false); } },
          { teks: 'Ya, lanjutkan', tipe: 'primer', onClick: function () { resolve(true); } }
        ]
      });
    });
  };

  // ----------------------------------------------------------
  // PENYIMPANAN LOKAL (localStorage)
  // ----------------------------------------------------------

  /** Membaca nilai dari localStorage dengan prefix aplikasi. */
  UMUM.lsBaca = function (kunci) {
    try {
      const v = localStorage.getItem(window.KONFIG_APLIKASI.localStoragePrefix + kunci);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  };

  /** Menulis nilai ke localStorage dengan prefix aplikasi. */
  UMUM.lsTulis = function (kunci, nilai) {
    try {
      localStorage.setItem(window.KONFIG_APLIKASI.localStoragePrefix + kunci, JSON.stringify(nilai));
      return true;
    } catch (e) {
      return false;
    }
  };

  /** Menghapus nilai dari localStorage. */
  UMUM.lsHapus = function (kunci) {
    try {
      localStorage.removeItem(window.KONFIG_APLIKASI.localStoragePrefix + kunci);
    } catch (e) { /* abaikan */ }
  };

  // ----------------------------------------------------------
  // DETEKSI ONLINE/OFFLINE
  // ----------------------------------------------------------

  /** Mengembalikan true jika browser online. */
  UMUM.online = function () {
    return navigator.onLine;
  };

  /** Mendaftarkan callback saat status online/offline berubah. */
  UMUM.saStatusBerubah = function (callback) {
    window.addEventListener('online', function () { callback(true); });
    window.addEventListener('offline', function () { callback(false); });
  };

  // ----------------------------------------------------------
  // URL & UNDUH FILE (di browser)
  // ----------------------------------------------------------

  /**
   * Memicu unduhan file dari blob.
   * @param {Blob} blob Data file
   * @param {string} nama Nama file
   */
  UMUM.unduhBlob = function (blob, nama) {
    const url = URL.createObjectURL(blob);
    const a = UMUM.buatEl('a', { href: url, download: nama });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  /**
   * Memicu unduhan dari string data base64.
   * @param {string} base64 Data base64 (tanpa prefix data URI)
   * @param {string} mime Tipe MIME
   * @param {string} nama Nama file
   */
  UMUM.unduhBase64 = function (base64, mime, nama) {
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: mime });
    UMUM.unduhBlob(blob, nama);
  };

  // ----------------------------------------------------------
  // VALIDASI UMUM
  // ----------------------------------------------------------

  /** Validasi format PIN (4–6 angka). */
  UMUM.validasiPin = function (pin) {
    if (!pin) return false;
    return /^\d{4,6}$/.test(String(pin));
  };

  /** Validasi nama (2–60 karakter). */
  UMUM.validasiNama = function (nama) {
    if (!nama) return false;
    const t = String(nama).trim();
    return t.length >= 2 && t.length <= 60;
  };

  /** Menghasilkan ID unik sisi klien (untuk keperluan DOM). */
  UMUM.buatUid = function (prefix) {
    return (prefix || 'uid_') + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  };

  // ----------------------------------------------------------
  // HELPER KONVERSI
  // ----------------------------------------------------------

  /**
   * Mengubah byte array ke string hex (dipakai jika perlu di klien).
   */
  UMUM.bytesKeHex = function (bytes) {
    return Array.prototype.map.call(bytes, function (b) {
      return ('0' + ((b & 0xFF).toString(16))).slice(-2);
    }).join('');
  };

  // ----------------------------------------------------------
  // Aksesibilitas: hormati prefers-reduced-motion
  // ----------------------------------------------------------

  /** Mengembalikan true jika pengguna meminta gerakan dikurangi. */
  UMUM.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

})();
// ============================================================
// AKHIR FILE js/umum.js
// ============================================================
