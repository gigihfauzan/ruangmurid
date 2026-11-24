/**
 * ============================================================================
 * KONFIGURASI UTAMA APLIKASI e-LKPD INTERAKTIF
 * ============================================================================
 * File ini TIDAK memuat rahasia (kata sandi / kunci jawaban).
 * Guru cukup mengisi URL_WEB_APP setelah melakukan Deploy di Google Apps Script.
 */

window.KONFIG = {
  // Tempelkan URL Aplikasi Web dari Google Apps Script (berakhiran /exec)
  URL_WEB_APP: 'https://script.google.com/macros/s/AKfycbyclzhJfxwWNPHnqFQPLyKPlU-DUYJukWW-_NMeL_-VbsTVjcbfHV2iKq-vDYvsUj9m/exec',

  // Identitas tampilan bawaan sebelum terhubung ke server
  IDENTITAS_BAWAAN: {
    namaGuru: 'Gigih Ichyar Fauzan, S.Pd.',
    namaSekolah: 'SMP Negeri 2 Kedungbanteng',
    daftarKelas: ['VIII']
  },

  // Pengaturan jaringan & penyimpanan otomatis
  JARINGAN: {
    BATAS_WAKTU_MS: 20000, // 20 detik timeout per permintaan
    MAKS_COBA_ULANG: 2, // Percobaan ulang otomatis jika jaringan tersendat
    JEDA_SIMPAN_OTOMATIS_MS: 3000 // Jeda 3 detik setelah berhenti mengetik
  },

  // Pengaturan berkas unggahan & kanvas
  BERKAS: {
    MAKS_UKURAN_BYTE: 2 * 1024 * 1024, // Kompres otomatis hingga maksimal 2 MB
    MAKS_PER_SOAL: 5, // Maksimal 5 foto/gambar per soal
    TIPE_DIIZINKAN: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    DIMENSI_MAKS_PX: 1600 // Lebar/tinggi maksimal setelah kompresi agar hemat kuota
  },

  // Saklar fitur opsional (dapat dinyalakan atau dimatikan kapan saja)
  FITUR: {
    // 1. Skor otomatis di server (kunci jawaban disimpan rahasia di tab Kunci Sheet)
    SKOR_OTOMATIS: true,

    // 2. Multi-bab (jika true, siswa memilih bab dari konten-daftar.js setelah login)
    MULTI_BAB: false,

    // 3. Penulisan rumus matematika rapi dengan KaTeX ($...$ dan $$...$$)
    MATEMATIKA_KATEX: true
  }
};