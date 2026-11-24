/**
 * ============================================================================
 * MODUL UNGGAH, VALIDASI & KOMPRESI FOTO SISWA
 * ============================================================================
 * Fitur:
 * - Validasi tipe berkas: JPG, JPEG, PNG, WEBP
 * - Kompresi otomatis menggunakan HTML5 Canvas hingga maksimal 2 MB
 * - Batas maksimal 5 berkas per soal
 */

window.FotoLKPD = (function () {
  'use strict';

  const TIPE_VALID = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Memvalidasi dan mengompresi file gambar menjadi dataURL <= 2 MB.
   */
  function prosesDanKompresFoto(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('Tidak ada berkas yang dipilih.'));
        return;
      }

      const tipe = String(file.type || '').toLowerCase();
      if (TIPE_VALID.indexOf(tipe) === -1) {
        reject(new Error('Format foto harus JPG, JPEG, PNG, atau WEBP.'));
        return;
      }

      const batasByte =
        (window.KONFIG && window.KONFIG.BERKAS && window.KONFIG.BERKAS.MAKS_UKURAN_BYTE) ||
        2 * 1024 * 1024;
      const dimensiMaks =
        (window.KONFIG && window.KONFIG.BERKAS && window.KONFIG.BERKAS.DIMENSI_MAKS_PX) || 1600;

      const pembaca = new FileReader();
      pembaca.onerror = function () {
        reject(new Error('Gagal membaca berkas foto dari perangkat.'));
      };

      pembaca.onload = function (e) {
        const img = new Image();
        img.onerror = function () {
          reject(new Error('Berkas bukan gambar yang valid atau rusak.'));
        };

        img.onload = function () {
          let lebar = img.width;
          let tinggi = img.height;

          // Perkecil dimensi proporsional jika melebihi dimensi maksimal
          if (lebar > dimensiMaks || tinggi > dimensiMaks) {
            if (lebar >= tinggi) {
              tinggi = Math.round((tinggi * dimensiMaks) / lebar);
              lebar = dimensiMaks;
            } else {
              lebar = Math.round((lebar * dimensiMaks) / tinggi);
              tinggi = dimensiMaks;
            }
          }

          const kanvas = document.createElement('canvas');
          kanvas.width = lebar;
          kanvas.height = tinggi;
          const ctx = kanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, lebar, tinggi);
          ctx.drawImage(img, 0, 0, lebar, tinggi);

          // Kompres bertahap hingga ukuran terdekode di bawah batasByte (2 MB)
          let kualitas = 0.86;
          let hasilDataUrl = kanvas.toDataURL('image/jpeg', kualitas);

          while (estimasiUkuranBase64(hasilDataUrl) > batasByte && kualitas > 0.35) {
            kualitas -= 0.1;
            hasilDataUrl = kanvas.toDataURL('image/jpeg', kualitas);
          }

          // Jika masih melebihi 2 MB, perkecil dimensi 75% sekali lagi
          if (estimasiUkuranBase64(hasilDataUrl) > batasByte) {
            kanvas.width = Math.round(lebar * 0.75);
            kanvas.height = Math.round(tinggi * 0.75);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, kanvas.width, kanvas.height);
            ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
            hasilDataUrl = kanvas.toDataURL('image/jpeg', 0.75);
          }

          if (estimasiUkuranBase64(hasilDataUrl) > batasByte) {
            reject(new Error('Ukuran foto masih melebihi 2 MB setelah kompresi. Gunakan foto beresolusi lebih kecil.'));
            return;
          }

          resolve({
            dataUrl: hasilDataUrl,
            ukuranPerkiraan: estimasiUkuranBase64(hasilDataUrl),
            namaAsli: file.name || 'foto_siswa.jpg'
          });
        };

        img.src = e.target.result;
      };

      pembaca.readAsDataURL(file);
    });
  }

  function estimasiUkuranBase64(dataUrl) {
    const idx = dataUrl.indexOf('base64,');
    const b64 = idx !== -1 ? dataUrl.slice(idx + 7) : dataUrl;
    return Math.ceil((b64.length * 3) / 4);
  }

  return {
    prosesDanKompresFoto: prosesDanKompresFoto
  };
})();