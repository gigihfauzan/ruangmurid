/* ============================================================
 * konten-daftar.js — Daftar LKPD untuk fitur multi-bab (Tahap 4)
 * ============================================================
 * File ini berisi daftar LKPD yang tersedia. Setiap entri
 * merujuk ke file konten terpisah (satu file per bab).
 *
 * Pada Tahap 2 & 3 (fitur multiBab = false), file ini minimal
 * hanya berisi satu LKPD aktif. Siswa tidak memilih LKPD —
 * langsung mengerjakan ELKPD dari konten.js.
 *
 * Ketika fitur multiBab diaktifkan (Tahap 4), file ini akan
 * berisi banyak entri dan siswa memilih LKPD setelah login.
 * ============================================================ */

// Daftar LKPD. Setiap entri: { id, judul, mapel, kelas, bab, file }
// `file` adalah nama file JS (tanpa path) yang berisi objek ELKPD
// untuk bab tersebut. File dimuat dinamis saat dipilih.
window.KONTEN_DAFTAR = {

  // LKPD aktif default (yang ada di konten.js)
  aktifId: 'lkpd_bilangan_pangkat',

  // Daftar semua LKPD yang tersedia
  daftar: [
    {
      id: 'lkpd_bilangan_pangkat',
      judul: 'Petualangan Bilangan Berpangkat',
      mapel: 'Matematika',
      kelas: 'VIII',
      bab: 'Bilangan Berpangkat',
      guru: 'Gigih Ichyar Fauzan, S.Pd.',
      sekolah: 'SMP Negeri 2 Kedungbanteng',
      file: 'konten.js'   // file yang berisi window.ELKPD untuk bab ini
    }
    // Tambah entri LKPD lain di sini saat fitur multiBab aktif (Tahap 4):
    // , { id: 'lkpd_teorema_pythagoras', judul: '...', ..., file: 'konten-pythagoras.js' }
  ]

};

// ============================================================
// AKHIR FILE konten-daftar.js
// ============================================================
