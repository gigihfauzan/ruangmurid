/* ============================================================
 * konten.js — SATU-SATUNYA file konten LKPD
 * ============================================================
 * File ini berisi seluruh isi LKPD: judul, tema, teks, daftar
 * bagian, dan soal. Mesin (siswa.js) TIDAK boleh berisi teks
 * materi, nama bab, jumlah baris tabel, atau pilihan dropdown —
 * semuanya datang dari sini.
 *
 * INI ADALAH KONTEN CONTOH (10 soal) yang memperagakan SEMUA
 * tipe soal. Beri label jelas bahwa ini contoh yang harus
 * diganti guru. Ganti seluruh isi objek ELKPD di bawah untuk
 * materi baru.
 *
 * Tipe soal yang didukung:
 *  teks_singkat, uraian, pilihan_ganda, benar_salah,
 *  isian_angka, tabel_isian, menjodohkan, urutkan, kanvas,
 *  foto, skala_refleksi
 * Blok non-soal: bacaan, gambar, tautan_video
 * ============================================================ */

// Objek ELKPD global, dibaca oleh mesin siswa.js
window.ELKPD = {

  // --- Metadata LKPD ---
  meta: {
    id: 'lkpd_bilangan_pangkat',            // ID unik LKPD (dipakai server untuk memisahkan data)
    judul: 'Petualangan Bilangan Berpangkat', // judul yang menarik untuk siswa
    mapel: 'Matematika',
    kelas: 'VIII',
    bab: 'Bilangan Berpangkat',
    guru: 'Gigih Ichyar Fauzan, S.Pd.',
    sekolah: 'SMP Negeri 2 Kedungbanteng',
    tenggat: '',                             // format ISO, mis. '2025-12-31T23:59:59'. Kosong = tanpa tenggat.
    petunjukUmum: 'Kerjakan soal-soal berikut secara berurutan. Jawaban tersimpan otomatis. Pastikan menekan tombol "Kumpulkan" di akhir setelah selesai.',
  },

  // --- Tema (warna, font, maskot) ---
  // Tema diterapkan ke variabel CSS saat halaman dimuat.
  // Ubah di sini untuk mengganti tema tanpa menyentuh style.css.
  tema: {
    warnaUtama: '#3b82f6',     // biru muda (sesuai pilihan guru)
    warnaUtamaGelap: '#2563eb',
    warnaAksen: '#fbbf24',     // kuning ceria
    warnaAksenGelap: '#f59e0b',
    warnaLatar: '#eff6ff',      // latar lembut biru muda
    warnaKartu: '#ffffff',
    warnaTeks: '#1e293b',
    warnaTeksLemah: '#64748b',
    warnaSukses: '#22c55e',
    warnaBahaya: '#ef4444',
    warnaInfo: '#0ea5e9',
    fontJudul: "'Fredoka', 'Nunito', sans-serif",
    fontIsi: "'Nunito', system-ui, sans-serif",
    fontMath: "'Nunito', monospace",
    maskot: '🦊',              // rubah ceria (SVG/emoji)
    maskotNama: 'Paksi si Rubah',
    sampul: '',                // URL gambar sampul opsional (kosong = pakai maskot)
  },

  // --- Daftar kelas untuk pilihan login ---
  // Pilihan dropdown kelas di halaman login mengambil dari sini.
  daftarKelas: ['VIII'],

  // --- Bilah simbol matematika ---
  // Tombol-tombol ini menyisipkan teks pada kolom isian aktif.
  // Disesuaikan untuk mapel Matematika.
  simbol: ['²', '³', '^', '√', '≤', '≥', '≠', '≈', 'π', '°', '×', '÷', '±', '½', '∞', '⋅'],

  // --- Daftar bagian dan soal ---
  // Setiap bagian punya id, judul, petunjuk, dan daftar blok.
  // Blok bisa berupa "bacaan", "gambar", "tautan_video", atau "soal".
  bagian: [

    // ============== BAGIAN 1 ==============
    {
      id: 'b1',
      judul: 'Bagian 1 — Mengenal Bilangan Berpangkat',
      petunjuk: 'Pelajari bacaan berikut, lalu kerjakan soal 1 sampai 5.',
      maskot: '🦊',
      blok: [

        // --- Bacaan pengantar ---
        {
          jenis: 'bacaan',
          judul: 'Apa itu Bilangan Berpangkat?',
          isi: 'Bilangan berpangkat adalah cara menuliskan perkalian berulang dari suatu bilangan. ' +
               'Bentuk umumnya aⁿ, dibaca "a pangkat n", di mana a disebut bilangan pokok (basis) dan n disebut pangkat (eksponen). ' +
               'Contoh: 2³ = 2 × 2 × 2 = 8. Artinya, bilangan 2 dikalikan dengan dirinya sendiri sebanyak 3 kali. ' +
               'Khusus untuk pangkat nol, berlaku a⁰ = 1 untuk setiap a ≠ 0.'
        },

        // --- Soal 1: pilihan ganda ---
        {
          jenis: 'soal',
          id: 's1',
          nomor: 1,
          tipe: 'pilihan_ganda',
          teks: 'Hasil dari 2³ adalah ...',
          pilihan: ['6', '8', '9', '16'],
          wajib: true
        },

        // --- Soal 2: benar / salah ---
        {
          jenis: 'soal',
          id: 's2',
          nomor: 2,
          tipe: 'benar_salah',
          teks: 'Setiap bilangan (kecuali 0) jika dipangkatkan nol, hasilnya sama dengan 0.',
          wajib: true
        },

        // --- Soal 3: isian angka ---
        {
          jenis: 'soal',
          id: 's3',
          nomor: 3,
          tipe: 'isian_angka',
          teks: 'Hasil dari 5² = ...',
          satuan: '',     // opsional, ditampilkan setelah kolom
          wajib: true
        },

        // --- Soal 4: tabel isian (baris & kolom bebas) ---
        {
          jenis: 'soal',
          id: 's4',
          nomor: 4,
          tipe: 'tabel_isian',
          teks: 'Lengkapi tabel berikut. Isi kolom "Hasil" dengan nilai yang benar.',
          kolom: ['Bilangan Pokok', 'Pangkat', 'Hasil'],
          baris: [
            { id: 'r1', label: '3' },   // baris 1: 3 pangkat 2
            { id: 'r2', label: '4' },   // baris 2: 4 pangkat 3
            { id: 'r3', label: '2' }    // baris 3: 2 pangkat 5
          ],
          // konfigurasi kolom isian: kolom ke-2 (index 2) adalah "Hasil" yang diisi siswa
          kolomIsian: [2],  // index kolom yang dapat diisi siswa
          // nilai pangkat untuk tiap baris (ditampilkan sebagai petunjuk di kolom "Pangkat")
          nilaiKolom: {
            1: ['2', '3', '5']   // kolom index 1 ("Pangkat") sudah terisi: baris1=2, baris2=3, baris3=5
          },
          wajib: true
        },

        // --- Soal 5: teks singkat ---
        {
          jenis: 'soal',
          id: 's5',
          nomor: 5,
          tipe: 'teks_singkat',
          teks: 'Tuliskan bentuk pangkat dari perkalian 2 × 2 × 2 × 2.',
          placeholder: 'Contoh: aⁿ',
          wajib: false
        }

      ]
    },

    // ============== BAGIAN 2 ==============
    {
      id: 'b2',
      judul: 'Bagian 2 — Sifat dan Operasi Bilangan Berpangkat',
      petunjuk: 'Pelajari bacaan, lalu kerjakan soal 6 sampai 10. Soal 9 wajib digambar di kanvas dan soal 10 wajib diunggah fotonya.',
      maskot: '🦊',
      blok: [

        // --- Bacaan sifat pangkat ---
        {
          jenis: 'bacaan',
          judul: 'Sifat-sifat Pangkat',
          isi: 'Beberapa sifat penting bilangan berpangkat:\n' +
               '1. aᵐ × aⁿ = a^(m+n)  (perkalian pangkat sebasis)\n' +
               '2. aᵐ ÷ aⁿ = a^(m−n)  (pembagian pangkat sebasis)\n' +
               '3. (aᵐ)ⁿ = a^(m×n)  (pangkat dari pangkat)\n' +
               '4. a⁰ = 1, untuk a ≠ 0\n' +
               '5. a⁻ⁿ = 1/aⁿ  (pangkat negatif)'
        },

        // --- Soal 6: uraian ---
        {
          jenis: 'soal',
          id: 's6',
          nomor: 6,
          tipe: 'uraian',
          teks: 'Jelaskan dengan kalimatmu sendiri, apa yang dimaksud dengan 2⁴. Berapa hasilnya?',
          baris: 4,        // tinggi textarea (jumlah baris)
          wajib: true
        },

        // --- Soal 7: menjodohkan (dropdown) ---
        {
          jenis: 'soal',
          id: 's7',
          nomor: 7,
          tipe: 'menjodohkan',
          teks: 'Pasangkan bentuk pangkat di sebelah kiri dengan hasilnya di sebelah kanan dengan memilih dari dropdown.',
          // setiap item punya id, label kiri, dan daftar pilihan dropdown
          item: [
            { id: 'i1', kiri: '2³', pilihan: ['6', '8', '9', '16'] },
            { id: 'i2', kiri: '3²', pilihan: ['6', '8', '9', '16'] },
            { id: 'i3', kiri: '5²', pilihan: ['10', '25', '15', '20'] },
            { id: 'i4', kiri: '4²', pilihan: ['8', '12', '16', '20'] }
          ],
          wajib: true
        },

        // --- Soal 8: urutkan ---
        {
          jenis: 'soal',
          id: 's8',
          nomor: 8,
          tipe: 'urutkan',
          teks: 'Urutkan bilangan berikut dari yang terkecil ke terbesar. Gunakan tombol Naik/Turun untuk mengatur urutan.',
          // item ditampilkan dalam urutan awal acak; siswa menyusun ulang
          item: [
            { id: 'u1', teks: '2³' },   // 8
            { id: 'u2', teks: '3²' },   // 9
            { id: 'u3', teks: '4¹' },   // 4
            { id: 'u4', teks: '5⁰' }    // 1
          ],
          urutanAwal: ['u4', 'u3', 'u1', 'u2'], // urutan tampil awal (acak)
          wajib: true
        },

        // --- Soal 9: kanvas (latar grid) ---
        {
          jenis: 'soal',
          id: 's9',
          nomor: 9,
          tipe: 'kanvas',
          teks: 'Gambar persegi panjang yang menunjukkan luas 2² × 3 satuan luas pada kanvas berikut. Gunakan alat gambar yang tersedia.',
          latar: 'grid',     // pilihan: polos, grid, garis_bilangan, koordinat, lingkaran
          wajib: 'gambar'    // wajib ada gambar sebelum boleh mengumpulkan
        },

        // --- Soal 10: foto (wajib unggah) ---
        {
          jenis: 'soal',
          id: 's10',
          nomor: 10,
          tipe: 'foto',
          teks: 'Foto pekerjaan tulis tanganmu tentang soal nomor 6 sampai 8 di atas. Pastikan foto terang dan jelas. Maksimal 5 foto.',
          wajib: 'foto'      // wajib ada foto sebelum boleh mengumpulkan
        },

        // --- Blok refleksi: skala_refleksi (emoji) ---
        // Tipe skala_refleksi: siswa memilih emoji yang mewakili perasaan/confidence.
        // Tidak bernomor (nomor null) — sebagai penutup refleksi.
        {
          jenis: 'soal',
          id: 's11',
          nomor: null,
          tipe: 'skala_refleksi',
          teks: 'Setelah mengerjakan LKPD ini, bagaimana perasaanmu tentang materi Bilangan Berpangkat?',
          skala: [
            { nilai: 1, emoji: '😣', label: 'Sangat sulit' },
            { nilai: 2, emoji: '😕', label: 'Sulit' },
            { nilai: 3, emoji: '🙂', label: 'Biasa saja' },
            { nilai: 4, emoji: '😊', label: 'Mudah' },
            { nilai: 5, emoji: '🤩', label: 'Sangat mudah' }
          ],
          wajib: false
        }

      ]
    }

  ] // akhir bagian

}; // akhir window.ELKPD

// ============================================================
// CATATAN KONFIGURASI TAMBAHAN
// ============================================================
// - Konten di atas adalah CONTOH. Guru WAJIB menggantinya.
// - Untuk membuat LKPD baru, cukup ganti seluruh objek ELKPD.
// - Tipe soal baru dapat didaftarkan di siswa.js (lihat PENJENIS_SOAL).
// - Kunci jawaban TIDAK ada di file ini (hanya di server, sheet Kunci).
// ============================================================
