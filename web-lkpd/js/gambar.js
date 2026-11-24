/* ============================================================
 * js/gambar.js — Kanvas gambar untuk siswa
 * ============================================================
 * Modul ini menyediakan kanvas menggambar dengan fitur:
 *  - Alat: pena, garis lurus, penghapus
 *  - Warna & ketebalan
 *  - Undo, redo, hapus semua
 *  - Ekspor ke PNG (data URL)
 *  - Latar: polos, grid, garis_bilangan, koordinat, lingkaran
 *  - Dukungan sentuh (mobile) & mouse
 *
 * Setiap soal tipe "kanvas" membuat instance baru.
 * ============================================================ */
(function () {
  'use strict';

  window.GAMBAR = {};

  // Daftar warna yang tersedia di palet
  const PALET = ['#1e293b', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
  const KETEBALAN = [2, 4, 6, 10];

  /**
   * Membuat instance kanvas menggambar.
   * @param {HTMLElement} wadah Elemen tempat kanvas & toolbar ditempatkan
   * @param {object} opt { latar: 'grid'|'polos'|..., tinggi: number, nilaiAwal: 'data:image/png;base64,...' }
   * @returns {object} Instance kanvas dengan metode { ambilGambar, isiNilaiAwal, sudahDiisi, hapus }
   */
  GAMBAR.buat = function (wadah, opt) {
    opt = opt || {};
    const latar = opt.latar || 'polos';
    const tinggi = opt.tinggi || 320;

    // State alat
    let alat = 'pena';         // 'pena' | 'garis' | 'hapus'
    let warna = PALET[0];
    let ketebalan = KETEBALAN[1];

    // Undo/redo stack (menyimpan dataURL gambar)
    const riwayat = [];
    const riwayatMaju = [];
    const MAKS_RIWAYAT = 30;

    // State gambar garis
    let sedangGambar = false;
    let titikAwal = null;       // {x,y} untuk garis
    let snapshot = null;         // dataURL sebelum preview garis

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'kanvas-gambar';
    canvas.setAttribute('aria-label', 'Kanvas menggambar');
    canvas.setAttribute('role', 'img');
    const ctx = canvas.getContext('2d');

    // Atur ukuran kanvas responsif (lebar = lebar wadah, tinggi tetap)
    function aturUkuran() {
      const lebar = wadah.clientWidth || 320;
      const rasio = window.devicePixelRatio || 1;
      // Simpan gambar saat ini sebelum resize
      const gambarLama = canvas.width > 0 ? canvas.toDataURL() : null;
      canvas.style.width = lebar + 'px';
      canvas.style.height = tinggi + 'px';
      canvas.width = lebar * rasio;
      canvas.height = tinggi * rasio;
      ctx.setTransform(rasio, 0, 0, rasio, 0, 0);
      gambarLatar();
      // Kembalikan gambar lama jika ada
      if (gambarLama) {
        const img = new Image();
        img.onload = function () { ctx.drawImage(img, 0, 0, lebar, tinggi); };
        img.src = gambarLama;
      }
    }

    /** Menggambar latar kanvas sesuai tipe. */
    function gambarLatar() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Nunito, sans-serif';

      if (latar === 'grid') {
        // Grid 20px
        const step = 20;
        ctx.beginPath();
        for (let x = step; x < w; x += step) {
          ctx.moveTo(x, 0); ctx.lineTo(x, h);
        }
        for (let y = step; y < h; y += step) {
          ctx.moveTo(0, y); ctx.lineTo(w, y);
        }
        ctx.stroke();
      } else if (latar === 'garis_bilangan') {
        // Garis bilangan horizontal di tengah dengan tanda
        const y = h / 2;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, y); ctx.lineTo(w - 20, y);
        ctx.stroke();
        // Tanda angka -5 sampai 5
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const step = (w - 40) / 10;
        for (let i = 0; i <= 10; i++) {
          const x = 20 + i * step;
          ctx.beginPath();
          ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8);
          ctx.stroke();
          ctx.textAlign = 'center';
          ctx.fillText(String(i - 5), x, y + 24);
        }
      } else if (latar === 'koordinat') {
        // Sistem koordinat kartesius
        const cx = w / 2, cy = h / 2;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        // Sumbu
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);  // X
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);  // Y
        ctx.stroke();
        // Grid halus
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const step = 20;
        ctx.beginPath();
        for (let x = cx % step; x < w; x += step) {
          ctx.moveTo(x, 0); ctx.lineTo(x, h);
        }
        for (let y = cy % step; y < h; y += step) {
          ctx.moveTo(0, y); ctx.lineTo(w, y);
        }
        ctx.stroke();
      } else if (latar === 'lingkaran') {
        // Beberapa lingkaran konsentris sebagai panduan
        const cx = w / 2, cy = h / 2;
        const rMaks = Math.min(w, h) / 2 - 10;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let r = rMaks / 4; r <= rMaks; r += rMaks / 4) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Garis silang
        ctx.beginPath();
        ctx.moveTo(cx - rMaks, cy); ctx.lineTo(cx + rMaks, cy);
        ctx.moveTo(cx, cy - rMaks); ctx.lineTo(cx, cy + rMaks);
        ctx.stroke();
      }
      // 'polos' → hanya latar putih, sudah diisi di atas
    }

    /** Mendapat koordinat relatif kanvas dari event mouse/touch. */
    function dapatKoordinat(e) {
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if (e.touches && e.touches.length) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      return { x: x, y: y };
    }

    /** Menyimpan snapshot ke riwayat (undo). */
    function simpanRiwayat() {
      if (riwayat.length >= MAKS_RIWAYAT) riwayat.shift();
      riwayat.push(canvas.toDataURL());
      riwayatMaju.length = 0; // hapus redo setelah aksi baru
      perbaruiTombolUndoRedo();
    }

    /** Memulai menggambar. */
    function mulaiGambar(e) {
      e.preventDefault();
      sedangGambar = true;
      titikAwal = dapatKoordinat(e);
      // Untuk pena/hapus: mulai path
      if (alat === 'pena' || alat === 'hapus') {
        ctx.beginPath();
        ctx.moveTo(titikAwal.x, titikAwal.y);
      } else if (alat === 'garis') {
        // Simpan snapshot untuk preview garis
        snapshot = canvas.toDataURL();
      }
    }

    /** Menggambar saat mouse/touch bergerak. */
    function gerakGambar(e) {
      if (!sedangGambar) return;
      e.preventDefault();
      const p = dapatKoordinat(e);
      if (alat === 'pena') {
        ctx.strokeStyle = warna;
        ctx.lineWidth = ketebalan;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (alat === 'hapus') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = ketebalan * 3;
        ctx.lineCap = 'round';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      } else if (alat === 'garis') {
        // Preview garis lurus: kembalikan snapshot lalu gambar garis sementara
        const img = new Image();
        const p1 = titikAwal, p2 = p;
        img.onload = function () {
          ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
          gambarLatar();
          ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
          ctx.strokeStyle = warna;
          ctx.lineWidth = ketebalan;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        };
        img.src = snapshot;
      }
    }

    /** Selesai menggambar. */
    function selesaiGambar(e) {
      if (!sedangGambar) return;
      e.preventDefault();
      sedangGambar = false;
      simpanRiwayat();
    }

    // Event listener mouse
    canvas.addEventListener('mousedown', mulaiGambar);
    canvas.addEventListener('mousemove', gerakGambar);
    canvas.addEventListener('mouseup', selesaiGambar);
    canvas.addEventListener('mouseleave', selesaiGambar);
    // Event listener touch
    canvas.addEventListener('touchstart', mulaiGambar, { passive: false });
    canvas.addEventListener('touchmove', gerakGambar, { passive: false });
    canvas.addEventListener('touchend', selesaiGambar, { passive: false });
    canvas.addEventListener('touchcancel', selesaiGambar, { passive: false });

    // ---- Membangun toolbar ----
    const toolbar = UMUM.buatEl('div', { class: 'kanvas-toolbar' });

    // Grup alat
    const grupAlat = UMUM.buatEl('div', { class: 'kanvas-grup', role: 'group', 'aria-label': 'Pilih alat' });
    function tombolAlat(nama, ikon, label) {
      const b = UMUM.buatEl('button', { class: 'kanvas-tombol', 'data-alat': nama, 'aria-label': label, title: label, type: 'button' });
      b.textContent = ikon;
      b.addEventListener('click', function () {
        alat = nama;
        perbaruiAlatAktif();
      });
      return b;
    }
    const btnPena = tombolAlat('pena', '✏️', 'Pena');
    const btnGaris = tombolAlat('garis', '📏', 'Garis lurus');
    const btnHapus = tombolAlat('hapus', '🧽', 'Penghapus');
    grupAlat.appendChild(btnPena);
    grupAlat.appendChild(btnGaris);
    grupAlat.appendChild(btnHapus);
    toolbar.appendChild(grupAlat);

    function perbaruiAlatAktif() {
      UMUM.qsa('.kanvas-tombol[data-alat]', toolbar).forEach(function (b) {
        b.classList.toggle('aktif', b.getAttribute('data-alat') === alat);
      });
    }

    // Grup warna
    const grupWarna = UMUM.buatEl('div', { class: 'kanvas-grup', role: 'group', 'aria-label': 'Pilih warna' });
    PALET.forEach(function (w) {
      const b = UMUM.buatEl('button', {
        class: 'kanvas-warna' + (w === warna ? ' aktif' : ''),
        'data-warna': w,
        'aria-label': 'Warna ' + w,
        title: 'Warna',
        type: 'button',
        style: { backgroundColor: w, borderColor: w === '#ffffff' ? '#cbd5e1' : 'transparent' }
      });
      b.addEventListener('click', function () {
        warna = w;
        alat = 'pena';
        UMUM.qsa('.kanvas-warna', toolbar).forEach(function (x) { x.classList.remove('aktif'); });
        b.classList.add('aktif');
        perbaruiAlatAktif();
      });
      grupWarna.appendChild(b);
    });
    toolbar.appendChild(grupWarna);

    // Grup ketebalan
    const grupTebal = UMUM.buatEl('div', { class: 'kanvas-grup', role: 'group', 'aria-label': 'Pilih ketebalan' });
    KETEBALAN.forEach(function (k) {
      const b = UMUM.buatEl('button', {
        class: 'kanvas-tebal' + (k === ketebalan ? ' aktif' : ''),
        'data-tebal': k,
        'aria-label': 'Ketebalan ' + k + ' piksel',
        title: 'Ketebalan',
        type: 'button'
      });
      const titik = UMUM.buatEl('span', { class: 'kanvas-titik', style: { width: (k * 1.5) + 'px', height: (k * 1.5) + 'px' } });
      b.appendChild(titik);
      b.addEventListener('click', function () {
        ketebalan = k;
        UMUM.qsa('.kanvas-tebal', toolbar).forEach(function (x) { x.classList.remove('aktif'); });
        b.classList.add('aktif');
      });
      grupTebal.appendChild(b);
    });
    toolbar.appendChild(grupTebal);

    // Grup aksi (undo/redo/clear)
    const grupAksi = UMUM.buatEl('div', { class: 'kanvas-grup', role: 'group', 'aria-label': 'Aksi' });
    const btnUndo = UMUM.buatEl('button', { class: 'kanvas-tombol', 'aria-label': 'Batal langkah terakhir (undo)', title: 'Undo', type: 'button' });
    btnUndo.textContent = '↩️';
    btnUndo.addEventListener('click', function () { undo(); });
    const btnRedo = UMUM.buatEl('button', { class: 'kanvas-tombol', 'aria-label': 'Ulangi langkah (redo)', title: 'Redo', type: 'button' });
    btnRedo.textContent = '↪️';
    btnRedo.addEventListener('click', function () { redo(); });
    const btnClear = UMUM.buatEl('button', { class: 'kanvas-tombol', 'aria-label': 'Hapus semua gambar', title: 'Hapus semua', type: 'button' });
    btnClear.textContent = '🗑️';
    btnClear.addEventListener('click', function () {
      UMUM.konfirmasi('Hapus semua gambar di kanvas ini? Tindakan ini tidak bisa dibatalkan.', 'Hapus Semua').then(function (ya) {
        if (ya) hapusSemua();
      });
    });
    grupAksi.appendChild(btnUndo);
    grupAksi.appendChild(btnRedo);
    grupAksi.appendChild(btnClear);
    toolbar.appendChild(grupAksi);

    function perbaruiTombolUndoRedo() {
      btnUndo.disabled = riwayat.length <= 1;
      btnRedo.disabled = riwayatMaju.length === 0;
    }

    /** Undo: kembalikan ke state sebelumnya. */
    function undo() {
      if (riwayat.length <= 1) return;
      riwayatMaju.push(riwayat.pop());
      const terakhir = riwayat[riwayat.length - 1];
      pulihkanDari(terakhir);
      perbaruiTombolUndoRedo();
    }

    /** Redo: batalkan undo. */
    function redo() {
      if (riwayatMaju.length === 0) return;
      const state = riwayatMaju.pop();
      riwayat.push(state);
      pulihkanDari(state);
      perbaruiTombolUndoRedo();
    }

    /** Memulihkan gambar dari dataURL. */
    function pulihkanDari(dataUrl) {
      const img = new Image();
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        gambarLatar();
        ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      };
      img.src = dataUrl;
    }

    /** Hapus semua gambar (kembali ke latar). */
    function hapusSemua() {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      gambarLatar();
      simpanRiwayat();
    }

    // Susun struktur DOM
    wadah.appendChild(toolbar);
    wadah.appendChild(canvas);

    // Inisialisasi
    aturUkuran();
    simpanRiwayat();
    perbaruiAlatAktif();
    perbaruiTombolUndoRedo();

    // Nilai awal (jika ada jawaban tersimpan)
    if (opt.nilaiAwal) {
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
        simpanRiwayat();
      };
      img.src = opt.nilaiAwal;
    }

    // Responsif: atur ulang saat resize
    let timerResize = null;
    window.addEventListener('resize', function () {
      if (timerResize) clearTimeout(timerResize);
      timerResize = setTimeout(aturUkuran, 200);
    });

    // ---- API instance ----
    return {
      /** Mengembalikan gambar sebagai data URL PNG. */
      ambilGambar: function () {
        return canvas.toDataURL('image/png');
      },
      /** Mengisi kanvas dari data URL (untuk memulihkan jawaban tersimpan). */
      isiNilaiAwal: function (dataUrl) {
        const img = new Image();
        img.onload = function () {
          ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
          gambarLatar();
          ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
          simpanRiwayat();
        };
        img.src = dataUrl;
      },
      /** Cek apakah kanvas sudah digambar (bukan hanya latar). */
      sudahDiisi: function () {
        // Bandingkan dengan latar kosong: jika berbeda, berarti ada gambar
        // Cara sederhana: cek apakah riwayat terakhir berbeda dari snapshot awal.
        // Karena simpanRiwayat dipanggil setelah setiap aksi, riwayat.length > 1 berarti ada gambar.
        return riwayat.length > 1;
      },
      /** Hapus semua & reset (dipanggil saat reset jawaban). */
      hapus: hapusSemua,
      /** Elemen kanvas (untuk query). */
      elemen: canvas
    };
  };

})();
// ============================================================
// AKHIR FILE js/gambar.js
// ============================================================
