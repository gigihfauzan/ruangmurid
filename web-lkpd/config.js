/* ============================================================
 * config.js — Konfigurasi umum aplikasi e-LKPD
 * ============================================================
 * File ini adalah SATU-SATUNYA tempat untuk:
 *  - URL Web App Google Apps Script
 *  - Pengaturan global (batas, jeda, saklar fitur)
 *
 * JANGAN taruh kata sandi, kunci jawaban, atau rahasia apa pun
 * di file ini. URL Web App bersifat publik dan aman karena setiap
 * aksi memvalidasi token di sisi server.
 *
 * Ganti urlWebApp di bawah dengan URL dari Deploy → Web app.
 * ============================================================ */

// Objek konfigurasi global, diakses via window.KONFIG_APLIKASI
window.KONFIG_APLIKASI = {

  // URL Web App Google Apps Script (dari Deploy → New deployment → Web app).
  // Contoh format: 'https://script.google.com/macros/s/AKfyc.../exec'
  // GANTI nilai ini dengan URL Anda sebelum dipakai siswa.
  urlWebApp: 'https://script.google.com/macros/s/AKfycbwCN20yWJad5aDC570VPBEHzY-_lG2Q6VcWuA9i1WrdFcsphSLgsD_fHFXHeLIzmpGX/exec',

  // --- Pengaturan simpan otomatis ---
  simpanOtomatisAktif: true,        // aktifkan simpan otomatis
  simpanOtomatisJedaMs: 3000,       // jeda 3 detik setelah perubahan terakhir, lalu kirim jawaban yang berubah

  // --- Batas berkas (foto & gambar kanvas) ---
  fotoMaksPerSoal: 5,               // maksimum 5 berkas per soal (sesuai server)
  fotoMaksByte: 2 * 1024 * 1024,     // kompresi otomatis ke maksimal 2 MB sebelum unggah
  fotoFormat: ['jpg', 'jpeg', 'png', 'webp'], // tipe yang diizinkan (validasi sisi klien)
  fotoKualitasMulai: 0.85,          // kualitas awal kompresi JPEG/WEBP (0–1)
  fotoUkuranMaksPx: 1600,           // sisi terpanjang maksimum saat resize (px)

  // --- Batas waktu & percobaan ulang API ---
  apiTimeoutMs: 30000,              // batas waktu satu panggilan (30 detik)
  apiMaksCoba: 3,                   // maksimum percobaan ulang otomatis
  apiJedaCobaMs: 2000,              // jeda antar percobaan ulang (ms)

  // --- Fitur opsional (saklar) ---
  // Detail implementasi di Tahap 4. Saklar di sini mengatur apakah
  // fitur aktif. Untuk Tahap 2 & 3 semua false (dasar).
  fitur: {
    skorOtomatis: false,            // penilaian otomatis di server (Tahap 4)
    multiBab: false,                // banyak LKPD dalam satu deploy (Tahap 4)
    matematikaKatex: false,         // rumus matematika rapi dengan KaTeX (Tahap 4)
  },

  // --- Penyimpanan lokal (cadangan saat offline) ---
  localStoragePrefix: 'elkpd_',    // prefix untuk semua kunci localStorage
  cadanganOtomatis: true,           // simpan jawaban ke localStorage saat offline, sinkron saat online

  // --- Nama versi aplikasi (untuk tampilan & log) ---
  versi: '1.0.0',
};

// ============================================================
// AKHIR FILE config.js
// ============================================================
