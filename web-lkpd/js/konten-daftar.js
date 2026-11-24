/**
 * ============================================================================
 * DAFTAR e-LKPD MULTI-BAB (konten-daftar.js)
 * ============================================================================
 * Digunakan ketika saklar `FITUR.MULTI_BAB` di `config.js` diaktifkan (`true`).
 * Guru dapat mendaftarkan lebih dari satu bab/LKPD di sini, dengan objek
 * konten masing-masing (atau menggunakan `window.ELKPD` sebagai bab utama).
 */

window.DAFTAR_ELKPD = [
  {
    id: 'matematika-8-bilangan-berpangkat',
    judul: 'Petualangan Bilangan Berpangkat',
    bab: 'Bab 1 - Bilangan Berpangkat',
    kelas: 'VIII',
    mapel: 'Matematika',
    maskot: '🚀',
    ringkasan: 'Konsep perkalian berulang, sifat perpangkatan, kanvas sketsa, dan refleksi diri.',
    konten: function () {
      return window.ELKPD;
    }
  },
  {
    id: 'matematika-8-akar-notasi-ilmiah',
    judul: 'Eksplorasi Bentuk Akar & Notasi Ilmiah',
    bab: 'Bab 1B - Bentuk Akar & Bentuk Baku',
    kelas: 'VIII',
    mapel: 'Matematika',
    maskot: '📐',
    ringkasan: 'Latihan lanjutan menyederhanakan bentuk akar dan penulisan bentuk baku/ilmiah.',
    konten: function () {
      var dasar = window.ELKPD || {};
      return Object.assign({}, dasar, {
        meta: Object.assign({}, dasar.meta || {}, {
          id: 'matematika-8-akar-notasi-ilmiah',
          judul: 'Eksplorasi Bentuk Akar & Notasi Ilmiah',
          subjudul: 'Mengenal Bentuk Akar dan Penulisan Notasi Ilmiah dalam Sains',
          bab: 'Bab 1B - Bentuk Akar & Notasi Ilmiah',
          adalahContoh: true
        }),
        bagian: [
          {
            id: 'bagian-akar-1',
            judul: 'Bagian 1: Bentuk Akar & Notasi Ilmiah',
            maskotBagian: '📐',
            petunjuk: 'Kerjakan soal contoh bab lanjutan berikut ini.',
            blok: [
              {
                jenis: 'bacaan',
                judul: 'Notasi Ilmiah (Bentuk Baku)',
                isi: 'Bentuk baku dari suatu bilangan positif dituliskan sebagai $a \\times 10^n$ dengan $1 \\le a < 10$ dan $n$ bilangan bulat.'
              },
              {
                jenis: 'soal',
                id: 'a1',
                nomor: 1,
                tipe: 'pilihan_ganda',
                teks: 'Bentuk baku dari bilangan $450.000$ adalah ...',
                pilihan: ['$4,5 \\times 10^5$', '$45 \\times 10^4$', '$0,45 \\times 10^6$', '$4,5 \\times 10^4$'],
                wajib: true
              },
              {
                jenis: 'soal',
                id: 'a2',
                nomor: 2,
                tipe: 'isian_angka',
                teks: 'Hitunglah nilai dari $\\sqrt{144} + \\sqrt{25}$ = ...',
                placeholder: 'Ketik hasil angka...',
                wajib: true
              }
            ]
          }
        ]
      });
    }
  }
];