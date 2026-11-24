/**
 * ============================================================================
 * FILE KONTEN e-LKPD (SATU-SATUNYA FILE YANG DIGANTI UNTUK MATERI BARU)
 * ============================================================================
 * Guru dapat mengubah judul, tema warna, maskot, simbol bantuan, dan daftar soal
 * di file ini tanpa perlu menyentuh file mesin (siswa.js) maupun backend.
 *
 * CATATAN PENTING:
 * Karena daftar soal khusus belum diisi, bagian soal di bawah ini merupakan
 * KONTEN CONTOH (10 soal) yang memperagakan seluruh 11 tipe soal dan blok materi
 * pada bab Bilangan Berpangkat. Silakan edit sesuai kebutuhan pembelajaran Anda.
 */

window.ELKPD = {
  meta: {
    id: 'matematika-8-bilangan-berpangkat',
    judul: 'Petualangan Bilangan Berpangkat',
    subjudul: 'Menjelajahi Konsep dan Sifat Perpangkatan Bilangan Bulat',
    mapel: 'Matematika',
    kelas: 'VIII',
    bab: 'Bab 1 - Bilangan Berpangkat',
    guru: 'Gigih Ichyar Fauzan, S.Pd.',
    sekolah: 'SMP Negeri 2 Kedungbanteng',
    tenggat: '', // Opsional, contoh: '2026-12-31T23:59:00+07:00'
    adalahContoh: true // Menampilkan label pengingat ramah di bagian atas untuk guru
  },

  // Tema visual ceria bernuansa Biru Muda (otomatis disuntikkan ke variabel CSS)
  tema: {
    warnaUtama: '#0284c7', // Biru Langit Cerah (kontras tinggi dengan teks putih)
    warnaUtamaGelap: '#0369a1', // Biru Laut untuk hover & fokus
    warnaUtamaMuda: '#e0f2fe', // Biru Muda lembut untuk latar kartu/aksen
    warnaAksen: '#f59e0b', // Kuning Madu ceria untuk bintang & sorotan
    warnaLatar: '#f0f9ff', // Latar halaman biru sangat muda yang nyaman di mata
    warnaKartu: '#ffffff',
    warnaTeks: '#0f172a',
    fontJudul: "'Fredoka', 'Baloo 2', system-ui, -apple-system, sans-serif",
    fontIsi: "'Nunito', system-ui, -apple-system, sans-serif",
    maskot: {
      nama: 'Bimo si Penjelajah Angka',
      emoji: '🚀',
      sapaan: 'Halo Sobat Matematika SMPN 2 Kedungbanteng! Yuk taklukkan pangkat bersama Bimo!'
    },
    sampul: {
      ikon: '🪐',
      deskripsiSingkat: 'Belajar konsep perpangkatan, sifat operasi pangkat, dan penerapannya dengan cara yang seru!'
    }
  },

  // Bilah simbol matematika yang muncul saat siswa mengetik pada kolom isian
  bilahSimbol: {
    aktif: true,
    judul: 'Bilah Simbol Matematika',
    daftar: [
      { label: '×', sisip: '×', keterangan: 'Tanda kali' },
      { label: '÷', sisip: '÷', keterangan: 'Tanda bagi' },
      { label: '²', sisip: '²', keterangan: 'Pangkat dua' },
      { label: '³', sisip: '³', keterangan: 'Pangkat tiga' },
      { label: '⁴', sisip: '⁴', keterangan: 'Pangkat empat' },
      { label: 'ⁿ', sisip: 'ⁿ', keterangan: 'Pangkat n' },
      { label: '⁻', sisip: '⁻', keterangan: 'Pangkat negatif' },
      { label: '√', sisip: '√', keterangan: 'Akar kuadrat' },
      { label: '±', sisip: '±', keterangan: 'Kurang lebih' },
      { label: '≠', sisip: '≠', keterangan: 'Tidak sama dengan' },
      { label: '≤', sisip: '≤', keterangan: 'Kurang dari atau sama dengan' },
      { label: '≥', sisip: '≥', keterangan: 'Lebih dari atau sama dengan' },
      { label: '≈', sisip: '≈', keterangan: 'Kira-kira sama dengan' },
      { label: 'π', sisip: 'π', keterangan: 'Pi' },
      { label: '°', sisip: '°', keterangan: 'Derajat' },
      { label: '½', sisip: '½', keterangan: 'Setengah' }
    ]
  },

  // Aturan sebelum siswa diperbolehkan menekan tombol Kumpulkan
  aturanKumpul: {
    wajibMinimalFotoAtauGambar: true, // Syarat wajib minimal ada 1 foto atau gambar kanvas sebelum kumpul
    pesanSyaratFotoGambar:
      'Sebelum mengumpulkan, kamu wajib melampirkan minimal 1 hasil gambar kanvas atau foto coretan pekerjaanmu.'
  },

  // Daftar bagian dan 10 soal contoh yang memperagakan seluruh tipe soal
  bagian: [
    {
      id: 'bagian-1',
      judul: 'Bagian 1: Konsep Dasar Perpangkatan',
      maskotBagian: '🔭',
      petunjuk:
        'Bacalah pengantar singkat berikut dengan cermat, kemudian kerjakan soal nomor 1 sampai 3.',
      blok: [
        {
          jenis: 'bacaan',
          judul: 'Apa Itu Bilangan Berpangkat?',
          isi: 'Perpangkatan adalah perkalian berulang dari suatu bilangan yang sama. Jika $a$ adalah bilangan real dan $n$ adalah bilangan bulat positif, maka:\n$$a^n = \\underbrace{a \\times a \\times a \\times \\dots \\times a}_{n \\text{ faktor}}$$\nBilangan $a$ disebut **bilangan pokok (basis)**, sedangkan $n$ disebut **pangkat (eksponen)**. Contohnya: $2^4 = 2 \\times 2 \\times 2 \\times 2 = 16$.'
        },
        {
          jenis: 'tautan_video',
          judul: 'Video Pengantar: Memahami Perkalian Berulang',
          deskripsi: 'Tonton video singkat ini jika kamu ingin mengulang penjelasan konsep dasar bilangan berpangkat.',
          url: 'https://www.youtube.com/results?search_query=bilangan+berpangkat+kelas+8+smp',
          labelTombol: 'Buka Referensi Video Pembelajaran'
        },
        {
          jenis: 'soal',
          id: 's1',
          nomor: 1,
          tipe: 'pilihan_ganda',
          teks: 'Bentuk perpangkatan yang tepat untuk menyatakan perkalian berulang $(-3) \\times (-3) \\times (-3) \\times (-3) \\times (-3)$ adalah ...',
          pilihan: [
            '$(-3)^5$',
            '$-3^5$',
            '$5^{-3}$',
            '$(-5)^3$'
          ],
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's2',
          nomor: 2,
          tipe: 'benar_salah',
          teks: 'Perhatikan pernyataan berikut: Nilai dari $(-2)^4$ sama dengan nilai dari $-2^4$, yaitu $-16$. Apakah pernyataan tersebut benar atau salah?',
          labelBenar: 'Benar',
          labelSalah: 'Salah',
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's3',
          nomor: 3,
          tipe: 'isian_angka',
          teks: 'Hitunglah hasil dari $3^3 + 2^4 = \\dots$',
          satuan: '',
          placeholder: 'Ketik angka hasil perhitungan...',
          wajib: true
        }
      ]
    },
    {
      id: 'bagian-2',
      judul: 'Bagian 2: Menemukan Sifat-Sifat Operasi Pangkat',
      maskotBagian: '🧩',
      petunjuk:
        'Amati pola perkalian dan pembagian bilangan berpangkat pada soal nomor 4 sampai 7.',
      blok: [
        {
          jenis: 'gambar',
          judul: 'Ringkasan Sifat Bilangan Berpangkat',
          alt: 'Ilustrasi sifat perkalian dan pembagian bilangan berpangkat dengan basis sama',
          deskripsi: 'Gunakan sifat $a^m \\times a^n = a^{m+n}$ dan $a^m \\div a^n = a^{m-n}$ untuk menyelesaikan tantangan di bawah ini.',
          svgIlustrasi: `<svg viewBox="0 0 560 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram Sifat Pangkat">
            <rect x="8" y="8" width="262" height="134" rx="16" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
            <text x="139" y="42" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="16" font-weight="700" fill="#0369a1">Sifat Perkalian Basis Sama</text>
            <text x="139" y="78" text-anchor="middle" font-family="Nunito, sans-serif" font-size="20" font-weight="800" fill="#0f172a">aᵐ × aⁿ = aᵐ⁺ⁿ</text>
            <text x="139" y="114" text-anchor="middle" font-family="Nunito, sans-serif" font-size="14" fill="#334155">Contoh: 2³ × 2² = 2³⁺² = 2⁵ = 32</text>

            <rect x="290" y="8" width="262" height="134" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="421" y="42" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="16" font-weight="700" fill="#b45309">Sifat Pembagian Basis Sama</text>
            <text x="421" y="78" text-anchor="middle" font-family="Nunito, sans-serif" font-size="20" font-weight="800" fill="#0f172a">aᵐ ÷ aⁿ = aᵐ⁻ⁿ</text>
            <text x="421" y="114" text-anchor="middle" font-family="Nunito, sans-serif" font-size="14" fill="#334155">Contoh: 5⁶ ÷ 5⁴ = 5⁶⁻⁴ = 5² = 25</text>
          </svg>`
        },
        {
          jenis: 'soal',
          id: 's4',
          nomor: 4,
          tipe: 'teks_singkat',
          teks: 'Sederhanakan bentuk $p^7 \\times p^4 \\div p^3$ menjadi satu bilangan berpangkat sederhana! (Gunakan bilah simbol jika perlu)',
          placeholder: 'Contoh penulisan: p⁸',
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's5',
          nomor: 5,
          tipe: 'tabel_isian',
          teks: 'Lengkapilah tabel eksplorasi perpangkatan berikut ini dengan tepat:',
          kolom: ['Operasi Pangkat', 'Bentuk Pangkat Sederhana', 'Nilai Akhir'],
          baris: [
            { label: '$2^3 \\times 2^2$', selTetap: { 0: '2³ × 2²' } },
            { label: '$5^4 \\div 5^2$', selTetap: { 0: '5⁴ ÷ 5²' } },
            { label: '$(3^2)^2$', selTetap: { 0: '(3²)²' } }
          ],
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's6',
          nomor: 6,
          tipe: 'menjodohkan',
          teks: 'Pasangkan bentuk bilangan berpangkat di kolom kiri dengan nilainya yang tepat di kolom kanan:',
          pasangan: [
            { kiri: '$7^0$', pilihanKanan: ['1', '0', '1/8', '8', '1/9'] },
            { kiri: '$2^{-3}$', pilihanKanan: ['1', '0', '1/8', '8', '1/9'] },
            { kiri: '$3^{-2}$', pilihanKanan: ['1', '0', '1/8', '8', '1/9'] }
          ],
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's7',
          nomor: 7,
          tipe: 'urutkan',
          teks: 'Urutkan bilangan berpangkat berikut dari nilai yang **TERKECIL** ke nilai yang **TERBESAR** dengan menekan tombol panah atas/bawah:',
          itemAwal: [
            '$2^5$ (32)',
            '$5^2$ (25)',
            '$3^3$ (27)',
            '$10^1$ (10)'
          ],
          wajib: true
        }
      ]
    },
    {
      id: 'bagian-3',
      judul: 'Bagian 3: Pemecahan Masalah, Visualisasi & Refleksi',
      maskotBagian: '🎨',
      petunjuk:
        'Selesaikan soal cerita, buat sketsa pada kanvas, unggah foto coretan bukumu, dan isi refleksi belajarmu!',
      blok: [
        {
          jenis: 'soal',
          id: 's8',
          nomor: 8,
          tipe: 'uraian',
          teks: 'Sebuah bakteri membelah diri menjadi $2$ bagian setiap $15$ menit. Jika mula-mula terdapat $5$ bakteri di dalam wadah, berapa banyak bakteri setelah $1$ jam? Tuliskan langkah penyelesaianmu secara runtut!',
          placeholder: 'Tuliskan diketahui, ditanya, langkah perhitungan, dan kesimpulan...',
          wajib: true
        },
        {
          jenis: 'soal',
          id: 's9',
          nomor: 9,
          tipe: 'kanvas',
          teks: 'Gambarkan pohon faktor atau sketsa pembelahan bakteri dari Soal Nomor 8 pada papan kanvas di bawah ini! (Kamu juga dapat melampirkan foto coretan kertasmu jika diperlukan).',
          latar: 'grid', // Pilihan: 'polos', 'grid', 'garis_bilangan', 'koordinat', 'lingkaran'
          izinkanFotoTambahan: true,
          wajib: 'gambar_atau_foto'
        },
        {
          jenis: 'soal',
          id: 's10',
          nomor: 10,
          tipe: 'foto',
          teks: 'Foto hasil catatan atau coretan perhitunganmu di buku tulis Matematika untuk Bagian 1 sampai Bagian 3, lalu unggah di sini (maksimal 5 foto).',
          wajib: false
        },
        {
          jenis: 'soal',
          id: 's_refleksi',
          nomor: 11,
          tipe: 'skala_refleksi',
          teks: 'Refleksi Diri: Bagaimana perasaan dan pemahamanmu setelah mempelajari materi Bilangan Berpangkat hari ini?',
          opsi: [
            { nilai: 1, emoji: '😵‍💫', label: 'Masih bingung, perlu bimbingan' },
            { nilai: 2, emoji: '🤔', label: 'Mulai paham sebagian' },
            { nilai: 3, emoji: '🙂', label: 'Cukup paham dan bisa mengikuti' },
            { nilai: 4, emoji: '😄', label: 'Paham dengan baik!' },
            { nilai: 5, emoji: '🤩', label: 'Sangat paham & siap membantu teman!' }
          ],
          wajib: true
        }
      ]
    }
  ]
};