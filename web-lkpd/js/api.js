/**
 * ============================================================================
 * MODUL KOMUNIKASI BACKEND GOOGLE APPS SCRIPT (FETCH, TIMEOUT, RETRY)
 * ============================================================================
 * Menggunakan POST dengan Content-Type "text/plain" agar bebas dari preflight CORS
 * saat di-hosting di Netlify maupun dibuka langsung di perangkat siswa.
 */

window.ApiLKPD = (function () {
  'use strict';

  // Pemetaan kode galat server ke pesan ramah anak/guru
  const PESAN_RAMAH_KODE = {
    FORMAT_TIDAK_VALID: 'Data yang dikirim belum sesuai format. Silakan coba lagi.',
    AKSI_TIDAK_DIKENAL: 'Perintah tidak dikenali oleh server.',
    DATA_TIDAK_LENGKAP: 'Masih ada kolom yang belum diisi lengkap.',
    FORMAT_PIN_SALAH: 'PIN harus terdiri dari 4 sampai 6 angka.',
    PIN_SUDAH_ADA: 'Akun ini sudah memiliki PIN. Masukkan PIN kamu atau minta guru meresetnya.',
    PIN_SALAH: 'PIN yang kamu masukkan belum tepat. Coba periksa kembali ya.',
    PERLU_BUAT_PIN: 'Silakan buat PIN baru terlebih dahulu.',
    AKUN_TERKUNCI: 'Terlalu banyak percobaan salah. Tunggu beberapa menit sebelum mencoba lagi.',
    SESI_TIDAK_VALID: 'Sesi kamu telah berakhir. Silakan masuk kembali.',
    AKSES_DITUTUP: 'Akses pengerjaan e-LKPD sedang ditutup oleh guru.',
    AKSES_DITOLAK: 'Kamu tidak memiliki izin untuk mengakses data ini.',
    TENGGAT_LEWAT: 'Batas waktu pengumpulan tugas sudah berakhir.',
    SUDAH_TERKUMPUL: 'Pekerjaan sudah dikumpulkan dan terkunci. Hubungi guru jika perlu revisi.',
    BERKAS_TERLALU_BESAR: 'Ukuran foto terlalu besar (maksimal 2,5 MB).',
    TIPE_BERKAS_DITOLAK: 'Format gambar harus JPG, PNG, atau WEBP.',
    MAKSIMAL_BERKAS: 'Jumlah foto untuk soal ini sudah mencapai batas maksimal (5 foto).',
    SERVER_SIBUK: 'Server sedang ramai melayani banyak siswa. Sedang mencoba ulang...',
    KUOTA_TERLAMPAUI:
      'Batas layanan harian Google tercapai. Tunggu beberapa saat atau beri tahu Bapak/Ibu Guru.',
    GALAT_SERVER: 'Terjadi gangguan sementara pada server. Silakan coba beberapa saat lagi.'
  };

  function cekKonfigurasiUrl() {
    const url = window.KONFIG && window.KONFIG.URL_WEB_APP ? window.KONFIG.URL_WEB_APP.trim() : '';
    if (!url || url.indexOf('GANTI_DENGAN_ID_DEPLOYMENT_ANDA') !== -1) {
      return {
        valid: false,
        pesan:
          'URL Web App Google Apps Script belum diatur di file config.js. Silakan hubungi guru.'
      };
    }
    return { valid: true, url: url };
  }

  /**
   * Mengirim permintaan JSON ke Google Apps Script dengan batas waktu (timeout)
   * dan percobaan ulang otomatis (retry) apabila jaringan tidak stabil.
   */
  async function kirim(aksi, payload, opsi) {
    const cekUrl = cekKonfigurasiUrl();
    if (!cekUrl.valid) {
      return {
        ok: false,
        kode: 'KONFIG_BELUM_DIISI',
        pesan: cekUrl.pesan,
        data: null
      };
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        ok: false,
        kode: 'OFFLINE',
        pesan: 'Perangkat sedang offline (tidak ada internet). Jawabanmu tetap aman tersimpan di perangkat ini.',
        data: null
      };
    }

    const pengaturanJaringan = (window.KONFIG && window.KONFIG.JARINGAN) || {};
    const batasWaktuMs = (opsi && opsi.timeoutMs) || pengaturanJaringan.BATAS_WAKTU_MS || 20000;
    const maksCoba =
      opsi && typeof opsi.maksCoba === 'number'
        ? opsi.maksCoba
        : pengaturanJaringan.MAKS_COBA_ULANG !== undefined
          ? pengaturanJaringan.MAKS_COBA_ULANG
          : 2;

    const tubuhPermintaan = JSON.stringify(Object.assign({ aksi: aksi }, payload || {}));
    let percobaan = 0;

    while (percobaan <= maksCoba) {
      percobaan++;
      const pengontrol = new AbortController();
      const timerBatal = setTimeout(function () {
        pengontrol.abort();
      }, batasWaktuMs);

      try {
        const respons = await fetch(cekUrl.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: tubuhPermintaan,
          signal: pengontrol.signal,
          redirect: 'follow'
        });

        clearTimeout(timerBatal);

        if (!respons.ok) {
          throw new Error('HTTP_STATUS_' + respons.status);
        }

        const hasil = await respons.json();

        // Jika server sibuk (LockService penuh), coba ulang otomatis setelah jeda singkat
        if (hasil && hasil.kode === 'SERVER_SIBUK' && percobaan <= maksCoba) {
          await tungguMs_(900 * percobaan);
          continue;
        }

        if (hasil && !hasil.ok) {
          hasil.pesan = hasil.pesan || PESAN_RAMAH_KODE[hasil.kode] || PESAN_RAMAH_KODE.GALAT_SERVER;
        }
        return hasil;
      } catch (err) {
        clearTimeout(timerBatal);
        const adalahTimeout = err && err.name === 'AbortError';

        if (percobaan <= maksCoba) {
          await tungguMs_(800 * percobaan);
          continue;
        }

        return {
          ok: false,
          kode: adalahTimeout ? 'TIMEOUT' : 'KONEKSI_PUTUS',
          pesan: adalahTimeout
            ? 'Koneksi ke server terlalu lama (batas waktu habis). Periksa sinyal internet lalu tekan Coba Lagi.'
            : 'Gagal terhubung ke server. Periksa koneksi internetmu lalu tekan Coba Lagi.',
          data: null
        };
      }
    }
  }

  function tungguMs_(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  return {
    kirim: kirim,
    PESAN_RAMAH_KODE: PESAN_RAMAH_KODE
  };
})();