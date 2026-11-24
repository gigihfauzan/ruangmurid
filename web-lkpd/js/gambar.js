/**
 * ============================================================================
 * MODUL KANVAS GAMBAR INTERAKTIF SISWA
 * ============================================================================
 * Fitur:
 * - Latar pilihan dari konten.js: polos, grid, garis_bilangan, koordinat, lingkaran
 * - Alat gambar: pena bebas, garis lurus (pratinjau real-time), penghapus
 * - Pengaturan warna & ketebalan garis
 * - Undo, Redo, Hapus Semua
 * - Ekspor PNG & unggah ke Google Drive lewat Apps Script
 */

window.KanvasLKPD = (function () {
  'use strict';

  /**
   * Menggambar latar belakang matematis pada konteks kanvas.
   */
  function gambarLatarMatematis(ctx, lebar, tinggi, jenisLatar) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lebar, tinggi);

    const latar = String(jenisLatar || 'polos').toLowerCase();

    if (latar === 'grid') {
      const jarak = 24;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      for (let x = jarak; x < lebar; x += jarak) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tinggi);
        ctx.stroke();
      }
      for (let y = jarak; y < tinggi; y += jarak) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(lebar, y);
        ctx.stroke();
      }
    } else if (latar === 'garis_bilangan') {
      const tengahY = Math.round(tinggi / 2);
      const marginX = 36;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginX, tengahY);
      ctx.lineTo(lebar - marginX, tengahY);
      ctx.stroke();

      // Panah kiri dan kanan
      ctx.beginPath();
      ctx.moveTo(marginX, tengahY);
      ctx.lineTo(marginX + 10, tengahY - 6);
      ctx.moveTo(marginX, tengahY);
      ctx.lineTo(marginX + 10, tengahY + 6);
      ctx.moveTo(lebar - marginX, tengahY);
      ctx.lineTo(lebar - marginX - 10, tengahY - 6);
      ctx.moveTo(lebar - marginX, tengahY);
      ctx.lineTo(lebar - marginX - 10, tengahY + 6);
      ctx.stroke();

      // Titik skala -5 sampai 5
      const tengahX = Math.round(lebar / 2);
      const langkah = Math.floor((lebar - marginX * 2) / 12);
      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.textAlign = 'center';
      for (let n = -5; n <= 5; n++) {
        const px = tengahX + n * langkah;
        ctx.beginPath();
        ctx.moveTo(px, tengahY - 7);
        ctx.lineTo(px, tengahY + 7);
        ctx.stroke();
        ctx.fillText(String(n), px, tengahY + 22);
      }
    } else if (latar === 'koordinat') {
      const jarak = 24;
      const tengahX = Math.round(lebar / 2 / jarak) * jarak;
      const tengahY = Math.round(tinggi / 2 / jarak) * jarak;

      // Grid halus
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      for (let x = 0; x <= lebar; x += jarak) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tinggi);
        ctx.stroke();
      }
      for (let y = 0; y <= tinggi; y += jarak) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(lebar, y);
        ctx.stroke();
      }

      // Sumbu X dan Y
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, tengahY);
      ctx.lineTo(lebar, tengahY);
      ctx.moveTo(tengahX, 0);
      ctx.lineTo(tengahX, tinggi);
      ctx.stroke();

      ctx.font = 'bold 12px Nunito, sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.fillText('X', lebar - 16, tengahY - 8);
      ctx.fillText('Y', tengahX + 10, 16);
      ctx.fillText('O', tengahX - 14, tengahY + 15);
    } else if (latar === 'lingkaran') {
      const tengahX = Math.round(lebar / 2);
      const tengahY = Math.round(tinggi / 2);
      const radius = Math.min(lebar, tinggi) * 0.36;

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tengahX, tengahY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Titik pusat
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(tengahX, tengahY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Membuat instance komponen kanvas lengkap di dalam kontainer yang diberikan.
   */
  function buatKomponenKanvas(opsi) {
    const kontainer = opsi.kontainer;
    const idSoal = opsi.idSoal;
    const jenisLatar = opsi.latar || 'polos';
    const terkunci = Boolean(opsi.terkunci);
    const onSimpanGambar = opsi.onSimpanGambar;

    const bungkus = document.createElement('div');
    bungkus.className = 'wadah-kanvas-komponen';

    // Bilah alat kanvas
    const bilahAlat = document.createElement('div');
    bilahAlat.className = 'bilah-alat-kanvas';

    const state = {
      alat: 'pena', // 'pena' | 'garis' | 'hapus'
      warna: '#0f172a',
      tebal: 3,
      sedangMenggambar: false,
      titikAwal: null,
      snapshotSebelumGaris: null,
      riwayatUndo: [],
      riwayatRedo: [],
      adaCoretanBaru: false
    };

    function buatTombolAlat(teks, judul, nilaiAlat) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tombol-alat' + (state.alat === nilaiAlat ? ' aktif' : '');
      btn.textContent = teks;
      btn.title = judul;
      btn.disabled = terkunci;
      btn.addEventListener('click', function () {
        state.alat = nilaiAlat;
        bilahAlat.querySelectorAll('[data-grup-alat="1"]').forEach(function (el) {
          el.classList.remove('aktif');
        });
        btn.classList.add('aktif');
      });
      btn.setAttribute('data-grup-alat', '1');
      return btn;
    }

    const btnPena = buatTombolAlat('✏️ Pena', 'Pena bebas', 'pena');
    const btnGaris = buatTombolAlat('📏 Garis', 'Tarik garis lurus', 'garis');
    const btnHapus = buatTombolAlat('🧽 Hapus', 'Penghapus', 'hapus');

    // Pemilih warna
    const inputWarna = document.createElement('input');
    inputWarna.type = 'color';
    inputWarna.className = 'pilihan-warna-kanvas';
    inputWarna.value = state.warna;
    inputWarna.title = 'Pilih warna tinta';
    inputWarna.disabled = terkunci;
    inputWarna.addEventListener('input', function () {
      state.warna = inputWarna.value;
      if (state.alat === 'hapus') {
        btnPena.click();
      }
    });

    // Pemilih ketebalan
    const pilihTebal = document.createElement('select');
    pilihTebal.className = 'tombol-alat';
    pilihTebal.title = 'Ketebalan garis';
    pilihTebal.disabled = terkunci;
    [
      { label: 'Tipis (2px)', val: 2 },
      { label: 'Sedang (4px)', val: 4 },
      { label: 'Tebal (7px)', val: 7 }
    ].forEach(function (t) {
      const opt = document.createElement('option');
      opt.value = String(t.val);
      opt.textContent = t.label;
      if (t.val === 4) opt.selected = true;
      pilihTebal.appendChild(opt);
    });
    state.tebal = 4;
    pilihTebal.addEventListener('change', function () {
      state.tebal = Number(pilihTebal.value) || 4;
    });

    // Tombol Undo, Redo, Hapus Semua
    const btnUndo = document.createElement('button');
    btnUndo.type = 'button';
    btnUndo.className = 'tombol-alat';
    btnUndo.textContent = '↩️ Undo';
    btnUndo.disabled = terkunci;

    const btnRedo = document.createElement('button');
    btnRedo.type = 'button';
    btnRedo.className = 'tombol-alat';
    btnRedo.textContent = '↪️ Redo';
    btnRedo.disabled = terkunci;

    const btnBersih = document.createElement('button');
    btnBersih.type = 'button';
    btnBersih.className = 'tombol-alat';
    btnBersih.textContent = '🗑️ Hapus Semua';
    btnBersih.disabled = terkunci;

    bilahAlat.appendChild(btnPena);
    bilahAlat.appendChild(btnGaris);
    bilahAlat.appendChild(btnHapus);
    bilahAlat.appendChild(inputWarna);
    bilahAlat.appendChild(pilihTebal);
    bilahAlat.appendChild(btnUndo);
    bilahAlat.appendChild(btnRedo);
    bilahAlat.appendChild(btnBersih);

    // Elemen kanvas utama
    const bingkai = document.createElement('div');
    bingkai.className = 'bingkai-kanvas';

    const kanvas = document.createElement('canvas');
    kanvas.className = 'kanvas-gambar';
    kanvas.width = 760;
    kanvas.height = 340;
    kanvas.setAttribute('aria-label', 'Papan gambar untuk soal ' + idSoal);

    bingkai.appendChild(kanvas);

    // Bilah bawah kanvas: status & tombol simpan gambar ke server
    const bilahBawah = document.createElement('div');
    bilahBawah.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;';

    const infoKanvas = document.createElement('span');
    infoKanvas.style.cssText = 'font-size:0.86rem;font-weight:700;color:#475569;';
    infoKanvas.textContent = terkunci
      ? 'Kanvas dikunci karena pekerjaan sudah dikumpulkan.'
      : 'Gambar pada papan di atas, lalu tekan "Simpan Gambar" agar tersimpan ke server.';

    const btnSimpanGambar = document.createElement('button');
    btnSimpanGambar.type = 'button';
    btnSimpanGambar.className = 'tombol tombol-utama';
    btnSimpanGambar.style.minHeight = '44px';
    btnSimpanGambar.textContent = '🖼️ Simpan Gambar Kanvas';
    btnSimpanGambar.disabled = terkunci;

    bilahBawah.appendChild(infoKanvas);
    bilahBawah.appendChild(btnSimpanGambar);

    bungkus.appendChild(bilahAlat);
    bungkus.appendChild(bingkai);
    bungkus.appendChild(bilahBawah);
    kontainer.appendChild(bungkus);

    const ctx = kanvas.getContext('2d');
    gambarLatarMatematis(ctx, kanvas.width, kanvas.height, jenisLatar);

    function simpanStateUndo() {
      if (state.riwayatUndo.length >= 25) {
        state.riwayatUndo.shift();
      }
      state.riwayatUndo.push(kanvas.toDataURL('image/png'));
      state.riwayatRedo = [];
    }

    function pulihkanDataUrl(dataUrl) {
      const img = new Image();
      img.onload = function () {
        ctx.clearRect(0, 0, kanvas.width, kanvas.height);
        ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
      };
      img.src = dataUrl;
    }

    // Simpan kondisi awal kosong
    simpanStateUndo();

    btnUndo.addEventListener('click', function () {
      if (terkunci || state.riwayatUndo.length <= 1) return;
      const sekarang = state.riwayatUndo.pop();
      state.riwayatRedo.push(sekarang);
      const sebelumnya = state.riwayatUndo[state.riwayatUndo.length - 1];
      pulihkanDataUrl(sebelumnya);
    });

    btnRedo.addEventListener('click', function () {
      if (terkunci || state.riwayatRedo.length === 0) return;
      const berikut = state.riwayatRedo.pop();
      state.riwayatUndo.push(berikut);
      pulihkanDataUrl(berikut);
    });

    btnBersih.addEventListener('click', function () {
      if (terkunci) return;
      gambarLatarMatematis(ctx, kanvas.width, kanvas.height, jenisLatar);
      simpanStateUndo();
      state.adaCoretanBaru = false;
      infoKanvas.textContent = 'Kanvas dibersihkan.';
    });

    function ambilKoordinatPointer(evt) {
      const rect = kanvas.getBoundingClientRect();
      const skalaX = kanvas.width / rect.width;
      const skalaY = kanvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * skalaX,
        y: (evt.clientY - rect.top) * skalaY
      };
    }

    kanvas.addEventListener('pointerdown', function (evt) {
      if (terkunci) return;
      evt.preventDefault();
      kanvas.setPointerCapture(evt.pointerId);
      state.sedangMenggambar = true;
      const pos = ambilKoordinatPointer(evt);
      state.titikAwal = pos;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (state.alat === 'hapus') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = state.tebal * 4;
      } else {
        ctx.strokeStyle = state.warna;
        ctx.lineWidth = state.tebal;
      }

      if (state.alat === 'garis') {
        state.snapshotSebelumGaris = ctx.getImageData(0, 0, kanvas.width, kanvas.height);
      } else {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    });

    kanvas.addEventListener('pointermove', function (evt) {
      if (!state.sedangMenggambar || terkunci) return;
      evt.preventDefault();
      const pos = ambilKoordinatPointer(evt);

      if (state.alat === 'garis') {
        if (state.snapshotSebelumGaris) {
          ctx.putImageData(state.snapshotSebelumGaris, 0, 0);
        }
        ctx.beginPath();
        ctx.moveTo(state.titikAwal.x, state.titikAwal.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      state.adaCoretanBaru = true;
    });

    function akhiriGoresan() {
      if (!state.sedangMenggambar) return;
      state.sedangMenggambar = false;
      state.snapshotSebelumGaris = null;
      simpanStateUndo();
      infoKanvas.textContent = 'Ada perubahan gambar belum disimpan ke server.';
    }

    kanvas.addEventListener('pointerup', akhiriGoresan);
    kanvas.addEventListener('pointercancel', akhiriGoresan);

    btnSimpanGambar.addEventListener('click', async function () {
      if (terkunci || typeof onSimpanGambar !== 'function') return;
      btnSimpanGambar.disabled = true;
      const labelAsli = btnSimpanGambar.textContent;
      btnSimpanGambar.textContent = '⏳ Mengunggah gambar...';

      try {
        const dataUrlPng = kanvas.toDataURL('image/png');
        const sukses = await onSimpanGambar(dataUrlPng);
        if (sukses) {
          state.adaCoretanBaru = false;
          infoKanvas.textContent = '✅ Gambar kanvas tersimpan di server.';
        }
      } finally {
        btnSimpanGambar.disabled = false;
        btnSimpanGambar.textContent = labelAsli;
      }
    });

    return {
      muatGambarDariDataUrl: function (dataUrl) {
        if (!dataUrl) return;
        const img = new Image();
        img.onload = function () {
          ctx.clearRect(0, 0, kanvas.width, kanvas.height);
          ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
          simpanStateUndo();
          infoKanvas.textContent = '✅ Gambar sebelumnya dimuat dari server.';
        };
        img.src = dataUrl;
      },
      eksporPng: function () {
        return kanvas.toDataURL('image/png');
      }
    };
  }

  return {
    buatKomponenKanvas: buatKomponenKanvas,
    gambarLatarMatematis: gambarLatarMatematis
  };
})();