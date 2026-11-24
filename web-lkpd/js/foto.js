/* ============================================================
 * js/foto.js — Unggah foto dengan validasi & kompresi
 * ============================================================
 * Fitur:
 *  - Validasi tipe file (JPG, JPEG, PNG, WEBP) di sisi klien
 *    (server juga memvalidasi via magic bytes)
 *  - Kompresi otomatis ke maksimal 2 MB (resize + kualitas JPEG)
 *  - Maksimal 5 foto per soal
 *  - Pratinjau thumbnail
 *  - Hapus foto
 *
 * Catatan: keamanan tipe & ukuran SEBELUM unggah ada di sini,
 * tapi validasi sebenarnya ada di server (magic bytes).
 * ============================================================ */
(function () {
  'use strict';

  window.FOTO = {};

  const KONFIG = window.KONFIG_APLIKASI;

  /**
   * Memeriksa tipe file dari ekstensi & tipe MIME yang dilaporkan browser.
   * Catatan: ini hanya pemeriksaan awal; server memeriksa magic bytes.
   * @param {File} file
   * @returns {boolean} true jika tipe diizinkan
   */
  FOTO.validasiTipe = function (file) {
    if (!file) return false;
    const nama = (file.name || '').toLowerCase();
    const mime = file.type || '';
    for (let i = 0; i < KONFIG.fotoFormat.length; i++) {
      const fmt = KONFIG.fotoFormat[i];
      if (nama.endsWith('.' + fmt)) return true;
    }
    // Cek MIME juga
    if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') return true;
    return false;
  };

  /**
   * Membaca file gambar dan mengembalikan elemen <img> via Promise.
   * @param {File} file
   * @returns {Promise<HTMLImageElement>}
   */
  function bacaGambar(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('Tidak bisa membaca berkas.')); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('Berkas bukan gambar yang valid.')); };
        img.onload = function () { resolve(img); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Mengompresi gambar ke maksimum ukuran byte tertentu.
   * Strategi: turunkan kualitas bertahap; jika masih terlalu besar, resize.
   * Mengembalikan data URL (data:image/jpeg;base64,...).
   *
   * @param {HTMLImageElement} img
   * @param {number} maksByte Ukuran maksimum (default dari config)
   * @returns {Promise<string>} data URL hasil kompresi
   */
  FOTO.kompresi = function (img, maksByte) {
    maksByte = maksByte || KONFIG.fotoMaksByte;
    const ukuranMaksPx = KONFIG.fotoUkuranMaksPx;

    return new Promise(function (resolve) {
      // Hitung ukuran awal dengan mempertahankan rasio, batasi sisi terpanjang
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > ukuranMaksPx || h > ukuranMaksPx) {
        if (w > h) {
          h = Math.round(h * ukuranMaksPx / w);
          w = ukuranMaksPx;
        } else {
          w = Math.round(w * ukuranMaksPx / h);
          h = ukuranMaksPx;
        }
      }
      // Buat canvas untuk kompresi
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Coba kualitas bertahap hingga di bawah maksByte
      let kualitas = KONFIG.fotoKualitasMulai;
      function cobaKualitas(q) {
        const dataUrl = canvas.toDataURL('image/jpeg', q);
        // Estimasi ukuran base64: panjang * 3/4
        const ukuran = Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);
        if (ukuran <= maksByte || q <= 0.3) {
          resolve(dataUrl);
        } else {
          // Turunkan kualitas
          kualitas = Math.max(0.3, q - 0.15);
          cobaKualitas(kualitas);
        }
      }
      cobaKualitas(kualitas);
    });
  };

  /**
   * Memproses satu file: validasi → baca → kompresi → kembalikan base64 bersih.
   * @param {File} file
   * @returns {Promise<{ok:boolean, dataBase64?:string, pesan?:string, nama?:string}>}
   */
  FOTO.proses = function (file) {
    if (!FOTO.validasiTipe(file)) {
      return Promise.resolve({ ok: false, pesan: 'Jenis berkas tidak didukung. Hanya JPG, PNG, dan WEBP.' });
    }
    return bacaGambar(file).then(function (img) {
      return FOTO.kompresi(img).then(function (dataUrl) {
        // Hapus prefix "data:image/jpeg;base64,"
        const koma = dataUrl.indexOf(',');
        const base64 = koma !== -1 ? dataUrl.substring(koma + 1) : dataUrl;
        return { ok: true, dataBase64: base64, nama: file.name, dataUrl: dataUrl };
      });
    }).catch(function (err) {
      return { ok: false, pesan: err.message || 'Gagal memproses berkas.' };
    });
  };

  /**
   * Membuat komponen unggah foto untuk satu soal.
   * @param {HTMLElement} wadah Elemen tempat komponen ditempatkan
   * @param {object} opt { idSoal, pengerjaanId, token, sudahAda: [berkasMeta...], onBerubah }
   * @returns {object} { ambilState, refresh }
   */
  FOTO.buatKomponen = function (wadah, opt) {
    opt = opt || {};
    const idSoal = opt.idSoal;
    const pengerjaanId = opt.pengerjaanId;
    const token = opt.token;
    let daftarBerkas = (opt.sudahAda || []).slice(); // array metadata {id, nama, ...}

    // Struktur DOM
    const pembungkus = UMUM.buatEl('div', { class: 'foto-komponen' });

    // Area pratinjau thumbnail
    const grid = UMUM.buatEl('div', { class: 'foto-grid' });

    // Tombol unggah
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
    input.multiple = true;
    input.style.display = 'none';
    input.setAttribute('aria-label', 'Pilih foto');

    const tombolUnggah = UMUM.buatEl('button', {
      class: 'tombol tombol-primer foto-tombol-unggah',
      type: 'button'
    });
    tombolUnggah.innerHTML = '<span class="ikon">📷</span> <span>Pilih Foto</span>';
    tombolUnggah.addEventListener('click', function () { input.click(); });

    const info = UMUM.buatEl('p', { class: 'foto-info', text: 'Maksimal ' + KONFIG.fotoMaksPerSoal + ' foto. Jenis: JPG, PNG, WEBP. Akan dikompresi otomatis.' });

    // Indikator unggah sedang berjalan
    const indikator = UMUM.buatEl('div', { class: 'foto-indikator', 'aria-live': 'polite' });
    indikator.style.display = 'none';

    input.addEventListener('change', function () {
      const files = Array.prototype.slice.call(input.files);
      input.value = ''; // reset agar bisa pilih file yang sama lagi
      tanganiFile(files);
    });

    pembungkus.appendChild(grid);
    pembungkus.appendChild(tombolUnggah);
    pembungkus.appendChild(input);
    pembungkus.appendChild(info);
    pembungkus.appendChild(indikator);
    wadah.appendChild(pembungkus);

    // Render ulang thumbnail
    function renderGrid() {
      UMUM.kosongkan(grid);
      daftarBerkas.forEach(function (b) {
        const kartu = UMUM.buatEl('div', { class: 'foto-thumb' });
        // Thumbnail (dimuat dari server via ambilBerkas)
        const img = UMUM.buatEl('img', { alt: b.nama, class: 'foto-thumb-img' });
        img.loading = 'lazy';
        // Jika ada dataUrl lokal (baru diunggah), pakai itu
        if (b.dataUrl) {
          img.src = b.dataUrl;
        } else {
          // Ambil dari server
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="90"%3E%3Crect width="100%25" height="100%25" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="10" fill="%2394a3b8"%3E...%3C/text%3E%3C/svg%3E';
          if (token && pengerjaanId && b.id) {
            API.ambilBerkas(pengerjaanId, b.id, token).then(function (res) {
              if (res.ok && res.data && res.data.dataBase64) {
                img.src = 'data:' + (b.mime || 'image/jpeg') + ';base64,' + res.data.dataBase64;
              }
            });
          }
        }
        const nama = UMUM.buatEl('span', { class: 'foto-thumb-nama', text: b.nama, title: b.nama });
        const tombolHapus = UMUM.buatEl('button', { class: 'foto-thumb-hapus', type: 'button', 'aria-label': 'Hapus foto ' + b.nama, title: 'Hapus foto' });
        tombolHapus.textContent = '✕';
        tombolHapus.addEventListener('click', function () {
          UMUM.konfirmasi('Hapus foto ini?', 'Hapus Foto').then(function (ya) {
            if (ya) hapusBerkas(b);
          });
        });
        // Perbesar saat klik thumbnail
        img.addEventListener('click', function () {
          UMUM.modal({
            judul: b.nama,
            isi: UMUM.buatEl('img', { src: img.src, alt: b.nama, class: 'foto-besar' }),
            tombol: [{ teks: 'Tutup', tipe: 'sekunder' }]
          });
        });
        kartu.appendChild(img);
        kartu.appendChild(nama);
        kartu.appendChild(tombolHapus);
        grid.appendChild(kartu);
      });
      // Tombol "+ tambah" tetap ada jika belum mencapai maks
      tombolUnggah.disabled = daftarBerkas.length >= KONFIG.fotoMaksPerSoal;
      tombolUnggah.style.opacity = tombolUnggah.disabled ? '0.5' : '1';
      // Panggil callback
      if (opt.onBerubah) opt.onBerubah(daftarBerkas);
    }

    /** Menangani beberapa file sekaligus, urut (bukan serentak). */
    function tanganiFile(files) {
      if (daftarBerkas.length >= KONFIG.fotoMaksPerSoal) {
        UMUM.toast('Sudah mencapai maksimum ' + KONFIG.fotoMaksPerSoal + ' foto.', 'peringatan');
        return;
      }
      indikator.style.display = 'block';
      let i = 0;
      const sisaSlot = KONFIG.fotoMaksPerSoal - daftarBerkas.length;
      const akanProses = files.slice(0, sisaSlot);
      if (files.length > sisaSlot) {
        UMUM.toast('Hanya ' + sisaSlot + ' foto yang diunggah (mencapai batas maksimal).', 'peringatan');
      }

      function prosesBerikutnya() {
        if (i >= akanProses.length) {
          indikator.style.display = 'none';
          renderGrid();
          return;
        }
        const file = akanProses[i];
        i++;
        indikator.textContent = 'Memproses foto ' + i + ' dari ' + akanProses.length + '...';
        FOTO.proses(file).then(function (hasil) {
          if (!hasil.ok) {
            UMUM.toast(hasil.pesan, 'bahaya');
            return prosesBerikutnya();
          }
          // Unggah ke server
          indikator.textContent = 'Mengunggah foto ' + i + ' dari ' + akanProses.length + '...';
          API.unggahBerkas(pengerjaanId, idSoal, 'foto', hasil.nama, hasil.dataBase64, token).then(function (res) {
            if (res.ok && res.data) {
              daftarBerkas.push({
                id: res.data.berkasId,
                nama: res.data.nama,
                ukuran: res.data.ukuran,
                mime: res.data.mime,
                waktu: res.data.waktu,
                dataUrl: hasil.dataUrl
              });
            } else {
              UMUM.toast('Gagal mengunggah: ' + res.pesan, 'bahaya');
            }
            prosesBerikutnya();
          });
        });
      }
      prosesBerikutnya();
    }

    /** Menghapus berkas (dari server & daftar). */
    function hapusBerkas(b) {
      if (b.id && token && pengerjaanId) {
        API.hapusBerkas(pengerjaanId, b.id, token).then(function (res) {
          if (res.ok) {
            daftarBerkas = daftarBerkas.filter(function (x) { return x.id !== b.id; });
            renderGrid();
            UMUM.toast('Foto dihapus.', 'sukses');
          } else {
            UMUM.toast('Gagal menghapus: ' + res.pesan, 'bahaya');
          }
        });
      } else {
        // Berkas lokal belum tersimpan
        daftarBerkas = daftarBerkas.filter(function (x) { return x !== b; });
        renderGrid();
      }
    }

    // Render awal
    renderGrid();

    // ---- API instance ----
    return {
      /** Mengembalikan daftar berkas saat ini. */
      ambilState: function () { return daftarBerkas; },
      /** Refresh tampilan (mis. setelah memuat dari server). */
      refresh: function (berkasBaru) {
        daftarBerkas = (berkasBaru || []).slice();
        renderGrid();
      },
      /** Cek apakah ada minimal 1 foto. */
      sudahDiisi: function () { return daftarBerkas.length > 0; }
    };
  };

})();
// ============================================================
// AKHIR FILE js/foto.js
// ============================================================
