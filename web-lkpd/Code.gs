/**
 * ============================================================================
 * BACKEND e-LKPD INTERAKTIF - GOOGLE APPS SCRIPT
 * ============================================================================
 * Dibuat untuk: Gigih Ichyar Fauzan, S.Pd. (SMP Negeri 2 Kedungbanteng)
 * Mata Pelajaran: Matematika (Dapat digunakan ulang untuk semua mapel & bab)
 *
 * Cara penerapan singkat:
 * 1. Buat Google Spreadsheet baru, lalu buka menu Ekstensi > Apps Script.
 * 2. Salin seluruh isi file ini ke dalam editor Code.gs dan simpan.
 * 3. Jalankan fungsi `setup` satu kali dari toolbar editor untuk membuat
 *    semua tab Sheet, folder Google Drive, dan password awal guru.
 * 4. Klik Terapkan (Deploy) > Deployment baru > Aplikasi Web:
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 5. Salin URL Aplikasi Web yang muncul ke file `config.js` di frontend.
 * ============================================================================
 */

// Konstanta konfigurasi internal server
const KONFIG_SERVER = {
  NAMA_FOLDER_UTAMA: 'e-LKPD SMP Negeri 2 Kedungbanteng',
  PASSWORD_GURU_AWAL: 'GuruSMP2#2026', // Wajib diganti setelah deployment pertama
  DURASI_SESI_SISWA_JAM: 12,
  DURASI_SESI_GURU_JAM: 8,
  MAKS_PERCOBAAN_GAGAL: 5,
  DURASI_KUNCI_DETIK: 300, // 5 menit
  MAKS_UKURAN_BERKAS_BYTE: Math.round(2.5 * 1024 * 1024), // 2,5 MB
  MAKS_BERKAS_PER_SOAL: 5,
  WAKTU_TUNGGU_KUNCI_MS: 15000 // 15 detik menunggu LockService
};

// Definisi struktur seluruh tab Google Sheet yang dibutuhkan sistem
const STRUKTUR_SHEET = {
  Pengaturan: ['kunci', 'nilai', 'keterangan'],
  Kelas: ['id_kelas', 'nama_kelas', 'aktif'],
  Siswa: [
    'id_siswa',
    'kelas',
    'nama',
    'hash_pin',
    'salt',
    'status_reset',
    'percobaan_gagal',
    'waktu_kunci',
    'waktu_daftar'
  ],
  Sesi: ['token', 'peran', 'id_pengguna', 'kedaluwarsa', 'waktu_buat'],
  Pengerjaan: [
    'id_pengerjaan',
    'id_siswa',
    'id_lkpd',
    'status',
    'waktu_mulai',
    'waktu_kumpul',
    'waktu_ubah'
  ],
  Jawaban: ['id_pengerjaan', 'id_soal', 'teks', 'data_json', 'waktu_ubah'],
  Berkas: [
    'id_berkas',
    'id_pengerjaan',
    'id_soal',
    'jenis',
    'id_file_drive',
    'nama_file',
    'ukuran',
    'mime',
    'waktu_unggah'
  ],
  Nilai: ['id_pengerjaan', 'id_soal', 'skor', 'komentar', 'waktu_nilai'],
  Kunci: ['id_lkpd', 'id_soal', 'tipe', 'kunci_jawaban', 'toleransi', 'bobot'],
  Log: ['waktu', 'aksi', 'peran', 'id_pengguna', 'status', 'detail']
};

/**
 * ============================================================================
 * FUNGSI PEMASANGAN AWAL (JALANKAN SATU KALI OLEH GURU)
 * ============================================================================
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  // 1. Buat seluruh sheet beserta header kolom jika belum ada
  Object.keys(STRUKTUR_SHEET).forEach(function (namaSheet) {
    let sheet = ss.getSheetByName(namaSheet);
    const headerWajib = STRUKTUR_SHEET[namaSheet];

    if (!sheet) {
      sheet = ss.insertSheet(namaSheet);
      sheet.getRange(1, 1, 1, headerWajib.length).setValues([headerWajib]);
      sheet.getRange(1, 1, 1, headerWajib.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headerWajib.length).setValues([headerWajib]);
      sheet.getRange(1, 1, 1, headerWajib.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Hapus Sheet1 bawaan kosong jika semua sheet sistem sudah terbuat
  const sheetBawaan = ss.getSheetByName('Sheet1');
  if (sheetBawaan && ss.getSheets().length > 1 && sheetBawaan.getLastRow() === 0) {
    ss.deleteSheet(sheetBawaan);
  }

  // 2. Isi pengaturan awal jika tab Pengaturan masih kosong
  const sheetPengaturan = ss.getSheetByName('Pengaturan');
  if (sheetPengaturan.getLastRow() <= 1) {
    const pengaturanAwal = [
      ['lkpd_aktif', 'matematika-8-bilangan-berpangkat', 'ID LKPD yang sedang aktif digunakan'],
      ['judul_lkpd', 'Petualangan Bilangan Berpangkat', 'Judul LKPD untuk nama folder Google Drive'],
      ['tenggat', '', 'Batas waktu pengumpulan format ISO (kosongkan jika tanpa batas waktu)'],
      ['akses_dibuka', 'YA', 'Isi YA untuk membuka akses siswa, TIDAK untuk menutup'],
      ['skor_otomatis', 'TIDAK', 'Isi YA jika ingin menilai otomatis soal PG/BS/Angka dari tab Kunci'],
      ['tampilkan_skor_siswa', 'YA', 'Isi YA agar siswa dapat melihat nilai dan komentar guru'],
      ['nama_guru', 'Gigih Ichyar Fauzan, S.Pd.', 'Nama guru pengampu'],
      ['nama_sekolah', 'SMP Negeri 2 Kedungbanteng', 'Nama satuan pendidikan']
    ];
    sheetPengaturan.getRange(2, 1, pengaturanAwal.length, 3).setValues(pengaturanAwal);
  }

  // 3. Isi daftar kelas awal jika tab Kelas masih kosong
  const sheetKelas = ss.getSheetByName('Kelas');
  if (sheetKelas.getLastRow() <= 1) {
    const kelasAwal = [['KLS-1', 'VIII', 'YA']];
    sheetKelas.getRange(2, 1, kelasAwal.length, 3).setValues(kelasAwal);
  }

  // 4. Siapkan folder utama di Google Drive jika belum ada
  let rootFolderId = props.getProperty('ROOT_FOLDER_ID');
  let folderValid = false;
  if (rootFolderId) {
    try {
      const f = DriveApp.getFolderById(rootFolderId);
      if (f && !f.isTrashed()) {
        folderValid = true;
      }
    } catch (err) {
      folderValid = false;
    }
  }
  if (!folderValid) {
    const folderBaru = DriveApp.createFolder(KONFIG_SERVER.NAMA_FOLDER_UTAMA);
    rootFolderId = folderBaru.getId();
    props.setProperty('ROOT_FOLDER_ID', rootFolderId);
  }

  // 5. Siapkan password awal guru di Script Properties jika belum pernah diatur
  if (!props.getProperty('ADMIN_PASSWORD_HASH')) {
    const salt = Utilities.getUuid();
    const hash = hitungHashSha256_(salt, KONFIG_SERVER.PASSWORD_GURU_AWAL);
    props.setProperty('ADMIN_PASSWORD_SALT', salt);
    props.setProperty('ADMIN_PASSWORD_HASH', hash);
  }

  catatLog_('setup', 'sistem', 'setup', 'OK', 'Inisialisasi Sheet, Drive, dan Password Guru berhasil.');
  Logger.log('Setup selesai! ID Folder Drive Utama: ' + rootFolderId);
}

/**
 * Fungsi bantu yang dapat dijalankan guru langsung dari editor Apps Script
 * apabila lupa kata sandi admin.
 * @param {string} passwordBaru Minimal 6 karakter
 */
function aturPasswordGuru(passwordBaru) {
  if (!passwordBaru || String(passwordBaru).trim().length < 6) {
    throw new Error('Password baru guru minimal 6 karakter.');
  }
  const props = PropertiesService.getScriptProperties();
  const salt = Utilities.getUuid();
  const hash = hitungHashSha256_(salt, String(passwordBaru).trim());
  props.setProperty('ADMIN_PASSWORD_SALT', salt);
  props.setProperty('ADMIN_PASSWORD_HASH', hash);
  catatLog_('aturPasswordGuru', 'sistem', 'admin', 'OK', 'Password guru diperbarui manual lewat editor.');
  Logger.log('Password guru berhasil diperbarui.');
}

/**
 * ============================================================================
 * TITIK MASUK WEB APP (HTTP POST & GET)
 * ============================================================================
 */
function doGet(e) {
  // Jangan pernah mengekspos data sensitif lewat doGet
  return buatRespons_(true, 'OK', 'Layanan e-LKPD aktif. Gunakan metode POST untuk berkomunikasi.', {
    waktuServer: new Date().toISOString()
  });
}

function doPost(e) {
  let payload;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buatRespons_(false, 'FORMAT_TIDAK_VALID', 'Permintaan kosong tidak dapat diproses.', null);
    }
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return buatRespons_(false, 'FORMAT_TIDAK_VALID', 'Format data JSON tidak valid.', null);
  }

  const aksi = payload && payload.aksi ? String(payload.aksi).trim() : '';
  if (!aksi) {
    return buatRespons_(false, 'AKSI_TIDAK_DIKENAL', 'Parameter aksi wajib disertakan.', null);
  }

  try {
    switch (aksi) {
      // --- Aksi Publik (Tanpa Token) ---
      case 'infoPublik':
        return aksiInfoPublik_(payload);
      case 'cekSiswa':
        return aksiCekSiswa_(payload);
      case 'buatPin':
        return denganKunci_(function () {
          return aksiBuatPin_(payload);
        });
      case 'masukSiswa':
        return denganKunci_(function () {
          return aksiMasukSiswa_(payload);
        });
      case 'masukGuru':
        return denganKunci_(function () {
          return aksiMasukGuru_(payload);
        });

      // --- Aksi Khusus Siswa (Wajib Token Peran 'siswa') ---
      case 'muatPekerjaan':
        return denganKunci_(function () {
          return aksiMuatPekerjaan_(payload);
        });
      case 'simpanJawaban':
        return denganKunci_(function () {
          return aksiSimpanJawaban_(payload);
        });
      case 'unggahBerkas':
        return denganKunci_(function () {
          return aksiUnggahBerkas_(payload);
        });
      case 'hapusBerkas':
        return denganKunci_(function () {
          return aksiHapusBerkas_(payload);
        });
      case 'ambilBerkas':
        return aksiAmbilBerkas_(payload);
      case 'kumpulkan':
        return denganKunci_(function () {
          return aksiKumpulkan_(payload);
        });
      case 'lihatNilaiSaya':
        return aksiLihatNilaiSaya_(payload);

      // --- Aksi Khusus Guru (Wajib Token Peran 'guru') ---
      case 'daftarSiswa':
        return aksiDaftarSiswa_(payload);
      case 'lihatPekerjaan':
        return aksiLihatPekerjaan_(payload);
      case 'resetPin':
        return denganKunci_(function () {
          return aksiResetPin_(payload);
        });
      case 'bukaRevisi':
        return denganKunci_(function () {
          return aksiBukaRevisi_(payload);
        });
      case 'beriNilai':
        return denganKunci_(function () {
          return aksiBeriNilai_(payload);
        });
      case 'ambilBerkasGuru':
        return aksiAmbilBerkasGuru_(payload);
      case 'simpanPengaturan':
        return denganKunci_(function () {
          return aksiSimpanPengaturan_(payload);
        });
      case 'kelolaKunci':
        return denganKunci_(function () {
          return aksiKelolaKunci_(payload);
        });

      default:
        return buatRespons_(false, 'AKSI_TIDAK_DIKENAL', 'Aksi "' + aksi + '" tidak dikenali server.', null);
    }
  } catch (err) {
    const pesanAsli = err && err.message ? err.message : String(err);
    catatLog_(aksi, 'sistem', '-', 'GALAT', pesanAsli);

    // Deteksi pesan kuota Google Apps Script / Drive
    const pesanLower = pesanAsli.toLowerCase();
    if (
      pesanLower.indexOf('limit') !== -1 ||
      pesanLower.indexOf('quota') !== -1 ||
      pesanLower.indexOf('service invoked too many times') !== -1
    ) {
      return buatRespons_(
        false,
        'KUOTA_TERLAMPAUI',
        'Batas penggunaan harian layanan Google tercapai. Silakan tunggu beberapa saat atau hubungi guru.',
        null
      );
    }

    return buatRespons_(
      false,
      'GALAT_SERVER',
      'Terjadi kendala pada server. Silakan coba beberapa saat lagi.',
      null
    );
  }
}

/**
 * ============================================================================
 * IMPLEMENTASI AKSI PUBLIK (LOGIN & PENDAFTARAN PIN)
 * ============================================================================
 */

function aksiInfoPublik_() {
  const pengaturan = bacaSemuaPengaturan_();
  const daftarKelas = bacaDaftarKelas_(true);

  return buatRespons_(true, 'OK', 'Informasi publik berhasil dimuat.', {
    pengaturan: pengaturan,
    daftarKelas: daftarKelas,
    waktuServer: new Date().toISOString()
  });
}

function aksiCekSiswa_(payload) {
  const kelas = rapikanTeks_(payload.kelas);
  const nama = rapikanNama_(payload.nama);

  if (!kelas || !nama) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Pilih kelas dan isi nama lengkap terlebih dahulu.', null);
  }

  const siswa = cariSiswaByKelasNama_(kelas, nama);
  if (!siswa) {
    return buatRespons_(true, 'OK', 'Siswa baru, silakan buat PIN.', {
      statusAkun: 'baru',
      kelas: kelas,
      nama: nama
    });
  }

  // Cek apakah sedang dalam masa kunci sementara
  const sisaKunci = hitungSisaDetikKunci_(siswa.waktu_kunci);
  if (sisaKunci > 0) {
    return buatRespons_(true, 'OK', 'Akun terkunci sementara karena salah PIN berulang kali.', {
      statusAkun: 'terkunci',
      sisaDetik: sisaKunci,
      kelas: siswa.kelas,
      nama: siswa.nama
    });
  }

  if (String(siswa.status_reset).toUpperCase() === 'YA' || !siswa.hash_pin) {
    return buatRespons_(true, 'OK', 'Silakan buat PIN baru.', {
      statusAkun: 'perlu_pin',
      kelas: siswa.kelas,
      nama: siswa.nama
    });
  }

  return buatRespons_(true, 'OK', 'Masukkan PIN kamu untuk masuk.', {
    statusAkun: 'aktif',
    kelas: siswa.kelas,
    nama: siswa.nama
  });
}

function aksiBuatPin_(payload) {
  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Maaf, akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }

  const kelas = rapikanTeks_(payload.kelas);
  const nama = rapikanNama_(payload.nama);
  const pin = String(payload.pin || '').trim();

  if (!kelas || !nama) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Kelas dan nama lengkap wajib diisi.', null);
  }
  if (!validasiFormatPin_(pin)) {
    return buatRespons_(false, 'FORMAT_PIN_SALAH', 'PIN harus terdiri dari 4 sampai 6 angka.', null);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName('Siswa');
  const siswaAda = cariSiswaByKelasNama_(kelas, nama);
  const sekarang = new Date().toISOString();
  const salt = Utilities.getUuid();
  const hashPin = hitungHashSha256_(salt, pin);

  let idSiswa;
  let namaResmi = nama;
  let kelasResmi = kelas;

  if (!siswaAda) {
    // Daftarkan siswa baru
    idSiswa = 'SIS-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    sheetSiswa.appendRow([
      idSiswa,
      kelasResmi,
      namaResmi,
      hashPin,
      salt,
      'TIDAK',
      0,
      '',
      sekarang
    ]);
  } else {
    // Izinkan buat PIN hanya jika status_reset === 'YA' atau belum punya hash_pin
    if (String(siswaAda.status_reset).toUpperCase() !== 'YA' && siswaAda.hash_pin) {
      return buatRespons_(
        false,
        'PIN_SUDAH_ADA',
        'Akun ini sudah memiliki PIN aktif. Gunakan PIN tersebut atau minta guru mereset PIN.',
        null
      );
    }
    idSiswa = siswaAda.id_siswa;
    namaResmi = siswaAda.nama;
    kelasResmi = siswaAda.kelas;

    const baris = siswaAda._baris;
    sheetSiswa.getRange(baris, 4, 1, 5).setValues([[hashPin, salt, 'TIDAK', 0, '']]);
  }

  const token = buatSesiBaru_('siswa', idSiswa, KONFIG_SERVER.DURASI_SESI_SISWA_JAM);
  catatLog_('buatPin', 'siswa', idSiswa, 'OK', kelasResmi + ' - ' + namaResmi);

  return buatRespons_(true, 'OK', 'PIN berhasil dibuat! Selamat belajar.', {
    token: token,
    siswa: {
      idSiswa: idSiswa,
      kelas: kelasResmi,
      nama: namaResmi
    },
    pengaturan: pengaturan
  });
}

function aksiMasukSiswa_(payload) {
  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Maaf, akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }

  const kelas = rapikanTeks_(payload.kelas);
  const nama = rapikanNama_(payload.nama);
  const pin = String(payload.pin || '').trim();

  if (!kelas || !nama || !pin) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Isi kelas, nama lengkap, dan PIN kamu.', null);
  }

  const siswa = cariSiswaByKelasNama_(kelas, nama);
  if (!siswa) {
    return buatRespons_(
      false,
      'PERLU_BUAT_PIN',
      'Nama kamu belum terdaftar. Silakan buat PIN baru terlebih dahulu.',
      null
    );
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName('Siswa');
  const baris = siswa._baris;

  // Cek apakah sedang terkunci
  const sisaKunci = hitungSisaDetikKunci_(siswa.waktu_kunci);
  if (sisaKunci > 0) {
    return buatRespons_(
      false,
      'AKUN_TERKUNCI',
      'Terlalu banyak percobaan salah. Tunggu ' + Math.ceil(sisaKunci / 60) + ' menit lagi ya.',
      { sisaDetik: sisaKunci }
    );
  }

  // Cek apakah harus buat PIN baru
  if (String(siswa.status_reset).toUpperCase() === 'YA' || !siswa.hash_pin) {
    return buatRespons_(
      false,
      'PERLU_BUAT_PIN',
      'PIN kamu telah direset oleh guru. Silakan buat PIN baru.',
      null
    );
  }

  // Verifikasi hash PIN
  const hashMasukan = hitungHashSha256_(siswa.salt, pin);
  if (hashMasukan !== siswa.hash_pin) {
    const gagalBaru = (Number(siswa.percobaan_gagal) || 0) + 1;
    if (gagalBaru >= KONFIG_SERVER.MAKS_PERCOBAAN_GAGAL) {
      const waktuKunciBaru = new Date(Date.now() + KONFIG_SERVER.DURASI_KUNCI_DETIK * 1000).toISOString();
      sheetSiswa.getRange(baris, 7, 1, 2).setValues([[0, waktuKunciBaru]]);
      catatLog_('masukSiswa', 'siswa', siswa.id_siswa, 'TERKUNCI', 'Salah PIN 5x');
      return buatRespons_(
        false,
        'AKUN_TERKUNCI',
        'PIN salah 5 kali. Akun terkunci sementara selama 5 menit.',
        { sisaDetik: KONFIG_SERVER.DURASI_KUNCI_DETIK }
      );
    } else {
      sheetSiswa.getRange(baris, 7, 1, 2).setValues([[gagalBaru, '']]);
      const sisaPercobaan = KONFIG_SERVER.MAKS_PERCOBAAN_GAGAL - gagalBaru;
      return buatRespons_(
        false,
        'PIN_SALAH',
        'PIN belum tepat. Sisa kesempatan mencoba: ' + sisaPercobaan + ' kali.',
        { sisaPercobaan: sisaPercobaan }
      );
    }
  }

  // Login berhasil: reset penghitung salah dan buat token sesi
  sheetSiswa.getRange(baris, 7, 1, 2).setValues([[0, '']]);
  const token = buatSesiBaru_('siswa', siswa.id_siswa, KONFIG_SERVER.DURASI_SESI_SISWA_JAM);
  catatLog_('masukSiswa', 'siswa', siswa.id_siswa, 'OK', siswa.kelas + ' - ' + siswa.nama);

  return buatRespons_(true, 'OK', 'Berhasil masuk! Ayo lanjutkan belajarmu.', {
    token: token,
    siswa: {
      idSiswa: siswa.id_siswa,
      kelas: siswa.kelas,
      nama: siswa.nama
    },
    pengaturan: pengaturan
  });
}

function aksiMasukGuru_(payload) {
  const password = String(payload.password || '');
  if (!password) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Masukkan kata sandi guru terlebih dahulu.', null);
  }

  const cache = CacheService.getScriptCache();
  const kunciCache = 'GURU_LOGIN_LOCK';
  const infoKunci = cache.get(kunciCache);
  let state = infoKunci ? JSON.parse(infoKunci) : { gagal: 0, kunciSampai: 0 };

  const sekarangMs = Date.now();
  if (state.kunciSampai && state.kunciSampai > sekarangMs) {
    const sisaDetik = Math.ceil((state.kunciSampai - sekarangMs) / 1000);
    return buatRespons_(
      false,
      'AKUN_TERKUNCI',
      'Terlalu banyak percobaan masuk gagal. Coba lagi dalam ' + Math.ceil(sisaDetik / 60) + ' menit.',
      { sisaDetik: sisaDetik }
    );
  }

  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty('ADMIN_PASSWORD_SALT') || '';
  const hashTersimpan = props.getProperty('ADMIN_PASSWORD_HASH') || '';

  if (!hashTersimpan) {
    return buatRespons_(
      false,
      'GALAT_SERVER',
      'Password guru belum dikonfigurasi. Jalankan fungsi setup() di Apps Script.',
      null
    );
  }

  const hashMasukan = hitungHashSha256_(salt, password);
  if (hashMasukan !== hashTersimpan) {
    state.gagal = (state.gagal || 0) + 1;
    if (state.gagal >= KONFIG_SERVER.MAKS_PERCOBAAN_GAGAL) {
      state.gagal = 0;
      state.kunciSampai = sekarangMs + KONFIG_SERVER.DURASI_KUNCI_DETIK * 1000;
      cache.put(kunciCache, JSON.stringify(state), KONFIG_SERVER.DURASI_KUNCI_DETIK + 60);
      catatLog_('masukGuru', 'guru', 'admin', 'TERKUNCI', 'Salah password guru 5x');
      return buatRespons_(
        false,
        'AKUN_TERKUNCI',
        'Kata sandi salah 5 kali. Login guru dikunci selama 5 menit.',
        { sisaDetik: KONFIG_SERVER.DURASI_KUNCI_DETIK }
      );
    } else {
      cache.put(kunciCache, JSON.stringify(state), 900);
      const sisaPercobaan = KONFIG_SERVER.MAKS_PERCOBAAN_GAGAL - state.gagal;
      return buatRespons_(
        false,
        'PIN_SALAH',
        'Kata sandi guru salah. Sisa percobaan: ' + sisaPercobaan + ' kali.',
        { sisaPercobaan: sisaPercobaan }
      );
    }
  }

  // Berhasil login guru
  cache.remove(kunciCache);
  const token = buatSesiBaru_('guru', 'admin', KONFIG_SERVER.DURASI_SESI_GURU_JAM);
  const pengaturan = bacaSemuaPengaturan_();
  const daftarKelas = bacaDaftarKelas_(false);
  catatLog_('masukGuru', 'guru', 'admin', 'OK', 'Guru masuk ke dashboard');

  return buatRespons_(true, 'OK', 'Selamat datang di Dashboard Guru.', {
    token: token,
    pengaturan: pengaturan,
    daftarKelas: daftarKelas
  });
}

/**
 * ============================================================================
 * IMPLEMENTASI AKSI SISWA (DILINDUNGI TOKEN & KEPEMILIKAN DATA)
 * ============================================================================
 */

function aksiMuatPekerjaan_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }

  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const pengerjaan = dapatkanAtauBuatPengerjaan_(sesi.idPengguna, idLkpd);

  const jawaban = bacaJawabanPengerjaan_(pengerjaan.id_pengerjaan);
  const berkas = bacaBerkasPengerjaan_(pengerjaan.id_pengerjaan);

  let nilaiData = { diizinkan: false, daftar: [], totalSkor: null };
  if (pengaturan.tampilkan_skor_siswa === 'YA') {
    nilaiData = bacaNilaiPengerjaan_(pengerjaan.id_pengerjaan);
    nilaiData.diizinkan = true;
  }

  return buatRespons_(true, 'OK', 'Data pekerjaan berhasil dimuat.', {
    pengerjaan: {
      idPengerjaan: pengerjaan.id_pengerjaan,
      idLkpd: pengerjaan.id_lkpd,
      status: pengerjaan.status,
      waktuMulai: pengerjaan.waktu_mulai,
      waktuKumpul: pengerjaan.waktu_kumpul,
      waktuUbah: pengerjaan.waktu_ubah
    },
    jawaban: jawaban,
    berkas: berkas,
    nilai: nilaiData,
    pengaturan: pengaturan
  });
}

function aksiSimpanJawaban_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }
  if (apakahTenggatLewat_(pengaturan.tenggat)) {
    return buatRespons_(false, 'TENGGAT_LEWAT', 'Waktu pengumpulan sudah berakhir.', null);
  }

  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const pengerjaan = dapatkanAtauBuatPengerjaan_(sesi.idPengguna, idLkpd);

  if (pengerjaan.status === 'terkumpul') {
    return buatRespons_(
      false,
      'SUDAH_TERKUMPUL',
      'Pekerjaan sudah dikumpulkan dan terkunci. Hubungi guru jika perlu revisi.',
      null
    );
  }

  const daftarJawaban = Array.isArray(payload.daftarJawaban) ? payload.daftarJawaban : [];
  const waktuSekarang = simpanBatchJawaban_(pengerjaan.id_pengerjaan, daftarJawaban);

  return buatRespons_(true, 'OK', 'Jawaban tersimpan.', {
    waktuSimpan: waktuSekarang,
    jumlahDisimpan: daftarJawaban.length
  });
}

function aksiUnggahBerkas_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }
  if (apakahTenggatLewat_(pengaturan.tenggat)) {
    return buatRespons_(false, 'TENGGAT_LEWAT', 'Waktu pengumpulan sudah berakhir.', null);
  }

  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const idSoal = rapikanTeks_(payload.idSoal);
  const jenis = payload.jenis === 'gambar' ? 'gambar' : 'foto';
  const timpaGambar = Boolean(payload.timpaGambar);
  const base64Bersih = bersihkanPrefixBase64_(payload.base64Data);

  if (!idSoal || !base64Bersih) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Data soal dan berkas gambar wajib diisi.', null);
  }

  const pengerjaan = dapatkanAtauBuatPengerjaan_(sesi.idPengguna, idLkpd);
  if (pengerjaan.status === 'terkumpul') {
    return buatRespons_(
      false,
      'SUDAH_TERKUMPUL',
      'Pekerjaan sudah dikumpulkan. Tidak dapat mengunggah berkas lagi.',
      null
    );
  }

  // Dekode base64 ke byte array untuk validasi ukuran dan magic bytes
  let bytes;
  try {
    bytes = Utilities.base64Decode(base64Bersih);
  } catch (err) {
    return buatRespons_(false, 'FORMAT_TIDAK_VALID', 'Data gambar rusak atau tidak dapat dibaca.', null);
  }

  if (bytes.length > KONFIG_SERVER.MAKS_UKURAN_BERKAS_BYTE) {
    return buatRespons_(
      false,
      'BERKAS_TERLALU_BESAR',
      'Ukuran berkas melebihi batas maksimal 2,5 MB.',
      null
    );
  }

  // Deteksi tipe asli berkas dari header biner (magic bytes)
  const infoMime = deteksiMimeDariMagicBytes_(bytes);
  if (!infoMime) {
    return buatRespons_(
      false,
      'TIPE_BERKAS_DITOLAK',
      'Format gambar tidak didukung. Gunakan hanya JPG, PNG, atau WEBP.',
      null
    );
  }

  const berkasLama = bacaBerkasPengerjaan_(pengerjaan.id_pengerjaan).filter(function (b) {
    return b.idSoal === idSoal;
  });

  // Jika jenis 'gambar' (kanvas) dan timpaGambar aktif, hapus gambar kanvas sebelumnya di soal itu
  if (jenis === 'gambar' && timpaGambar) {
    berkasLama.forEach(function (b) {
      if (b.jenis === 'gambar') {
        hapusSatuBerkasInternal_(b.idBerkas);
      }
    });
  } else if (berkasLama.length >= KONFIG_SERVER.MAKS_BERKAS_PER_SOAL) {
    return buatRespons_(
      false,
      'MAKSIMAL_BERKAS',
      'Maksimal ' + KONFIG_SERVER.MAKS_BERKAS_PER_SOAL + ' berkas gambar per soal.',
      null
    );
  }

  const siswa = cariSiswaById_(sesi.idPengguna);
  const judulFolderLkpd = rapikanTeks_(payload.judulLkpd) || pengaturan.judul_lkpd || idLkpd;
  const folderTujuan = dapatkanFolderSiswaDrive_(
    judulFolderLkpd,
    siswa ? siswa.kelas : 'Umum',
    siswa ? siswa.nama : sesi.idPengguna
  );

  const idBerkas = 'BRK-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const namaAman =
    buatNamaFileAman_(idSoal + '_' + jenis + '_' + idBerkas) + '.' + infoMime.ekstensi;
  const blob = Utilities.newBlob(bytes, infoMime.mime, namaAman);
  const fileDrive = folderTujuan.createFile(blob);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetBerkas = ss.getSheetByName('Berkas');
  const waktuUnggah = new Date().toISOString();

  sheetBerkas.appendRow([
    idBerkas,
    pengerjaan.id_pengerjaan,
    idSoal,
    jenis,
    fileDrive.getId(),
    namaAman,
    bytes.length,
    infoMime.mime,
    waktuUnggah
  ]);

  perbaruiWaktuUbahPengerjaan_(pengerjaan.id_pengerjaan, waktuUnggah);

  return buatRespons_(true, 'OK', 'Gambar berhasil diunggah.', {
    berkas: {
      idBerkas: idBerkas,
      idSoal: idSoal,
      jenis: jenis,
      namaFile: namaAman,
      ukuran: bytes.length,
      mime: infoMime.mime,
      waktuUnggah: waktuUnggah
    }
  });
}

function aksiHapusBerkas_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idBerkas = rapikanTeks_(payload.idBerkas);
  if (!idBerkas) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'ID berkas wajib disertakan.', null);
  }

  const infoBerkas = cariBerkasById_(idBerkas);
  if (!infoBerkas) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Berkas tidak ditemukan.', null);
  }

  // Verifikasi kepemilikan pengerjaan
  const pengerjaan = cariPengerjaanById_(infoBerkas.id_pengerjaan);
  if (!pengerjaan || pengerjaan.id_siswa !== sesi.idPengguna) {
    return buatRespons_(false, 'AKSES_DITOLAK', 'Kamu tidak berhak menghapus berkas ini.', null);
  }

  if (pengerjaan.status === 'terkumpul') {
    return buatRespons_(
      false,
      'SUDAH_TERKUMPUL',
      'Pekerjaan sudah dikumpulkan dan terkunci.',
      null
    );
  }

  hapusSatuBerkasInternal_(idBerkas);
  return buatRespons_(true, 'OK', 'Berkas berhasil dihapus.', { idBerkas: idBerkas });
}

function aksiAmbilBerkas_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idBerkas = rapikanTeks_(payload.idBerkas);
  const infoBerkas = cariBerkasById_(idBerkas);
  if (!infoBerkas) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Berkas tidak ditemukan.', null);
  }

  // Pastikan hanya pemilik sah yang dapat mengunduh berkas ini
  const pengerjaan = cariPengerjaanById_(infoBerkas.id_pengerjaan);
  if (!pengerjaan || pengerjaan.id_siswa !== sesi.idPengguna) {
    return buatRespons_(false, 'AKSES_DITOLAK', 'Akses berkas ditolak.', null);
  }

  const hasilDrive = bacaBase64DariDrive_(infoBerkas);
  if (!hasilDrive) {
    return buatRespons_(false, 'GALAT_SERVER', 'File gambar tidak ditemukan di Google Drive.', null);
  }

  return buatRespons_(true, 'OK', 'Berkas berhasil diambil.', hasilDrive);
}

function aksiKumpulkan_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.akses_dibuka !== 'YA') {
    return buatRespons_(false, 'AKSES_DITUTUP', 'Akses pengerjaan e-LKPD sedang ditutup oleh guru.', null);
  }
  if (apakahTenggatLewat_(pengaturan.tenggat)) {
    return buatRespons_(false, 'TENGGAT_LEWAT', 'Batas waktu pengumpulan sudah terlewati.', null);
  }

  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const pengerjaan = dapatkanAtauBuatPengerjaan_(sesi.idPengguna, idLkpd);

  if (pengerjaan.status === 'terkumpul') {
    return buatRespons_(true, 'OK', 'Pekerjaan kamu sudah terkumpul sebelumnya.', {
      status: 'terkumpul',
      waktuKumpul: pengerjaan.waktu_kumpul
    });
  }

  // Simpan sisa jawaban jika dikirim bersamaan saat menekan tombol Kumpulkan
  if (Array.isArray(payload.daftarJawaban) && payload.daftarJawaban.length > 0) {
    simpanBatchJawaban_(pengerjaan.id_pengerjaan, payload.daftarJawaban);
  }

  // Jalankan penilaian otomatis jika diaktifkan oleh guru dan tersedia kunci di tab Kunci
  if (pengaturan.skor_otomatis === 'YA') {
    jalankanSkorOtomatis_(pengerjaan.id_pengerjaan, idLkpd);
  }

  const waktuKumpul = new Date().toISOString();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPengerjaan = ss.getSheetByName('Pengerjaan');
  sheetPengerjaan
    .getRange(pengerjaan._baris, 4, 1, 4)
    .setValues([['terkumpul', pengerjaan.waktu_mulai, waktuKumpul, waktuKumpul]]);

  catatLog_('kumpulkan', 'siswa', sesi.idPengguna, 'OK', 'LKPD: ' + idLkpd);

  return buatRespons_(true, 'OK', 'Selamat! Pekerjaanmu berhasil dikumpulkan.', {
    status: 'terkumpul',
    waktuKumpul: waktuKumpul
  });
}

function aksiLihatNilaiSaya_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'siswa');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  if (pengaturan.tampilkan_skor_siswa !== 'YA') {
    return buatRespons_(true, 'OK', 'Nilai belum ditampilkan oleh guru.', {
      diizinkan: false,
      daftar: [],
      totalSkor: null
    });
  }

  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const pengerjaan = cariPengerjaanSiswaLkpd_(sesi.idPengguna, idLkpd);
  if (!pengerjaan) {
    return buatRespons_(true, 'OK', 'Belum ada data pengerjaan.', {
      diizinkan: true,
      daftar: [],
      totalSkor: null
    });
  }

  const nilaiData = bacaNilaiPengerjaan_(pengerjaan.id_pengerjaan);
  nilaiData.diizinkan = true;

  return buatRespons_(true, 'OK', 'Data nilai berhasil dimuat.', nilaiData);
}

/**
 * ============================================================================
 * IMPLEMENTASI AKSI GURU (DASHBOARD, PENILAIAN, REVISI, PENGATURAN)
 * ============================================================================
 */

function aksiDaftarSiswa_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const filterKelas = rapikanTeks_(payload.kelas);

  const semuaSiswa = bacaTabelObjek_('Siswa');
  const semuaPengerjaan = bacaTabelObjek_('Pengerjaan').filter(function (p) {
    return String(p.id_lkpd) === idLkpd;
  });
  const semuaBerkas = bacaTabelObjek_('Berkas');
  const semuaNilai = bacaTabelObjek_('Nilai');

  // Petakan pengerjaan berdasarkan id_siswa
  const mapPengerjaan = {};
  semuaPengerjaan.forEach(function (p) {
    mapPengerjaan[p.id_siswa] = p;
  });

  // Hitung jumlah berkas per id_pengerjaan
  const hitungBerkas = {};
  semuaBerkas.forEach(function (b) {
    hitungBerkas[b.id_pengerjaan] = (hitungBerkas[b.id_pengerjaan] || 0) + 1;
  });

  // Hitung total skor per id_pengerjaan
  const mapNilai = {};
  semuaNilai.forEach(function (n) {
    if (!mapNilai[n.id_pengerjaan]) {
      mapNilai[n.id_pengerjaan] = { adaTotalKhusus: false, skorTotalKhusus: 0, jumlahSkorSoal: 0, sudahDinilai: false };
    }
    const skorAngka = Number(n.skor);
    if (!isNaN(skorAngka) && String(n.skor).trim() !== '') {
      mapNilai[n.id_pengerjaan].sudahDinilai = true;
      if (n.id_soal === '__TOTAL__') {
        mapNilai[n.id_pengerjaan].adaTotalKhusus = true;
        mapNilai[n.id_pengerjaan].skorTotalKhusus = skorAngka;
      } else {
        mapNilai[n.id_pengerjaan].jumlahSkorSoal += skorAngka;
      }
    }
  });

  const daftarHasil = [];
  semuaSiswa.forEach(function (s) {
    if (filterKelas && String(s.kelas) !== filterKelas) {
      return;
    }
    const p = mapPengerjaan[s.id_siswa];
    const idPengerjaan = p ? p.id_pengerjaan : '';
    const statusPengerjaan = p ? p.status : 'belum';
    const infoNilai = idPengerjaan ? mapNilai[idPengerjaan] : null;

    let totalSkor = null;
    if (infoNilai && infoNilai.sudahDinilai) {
      totalSkor = infoNilai.adaTotalKhusus
        ? infoNilai.skorTotalKhusus
        : Math.round(infoNilai.jumlahSkorSoal * 100) / 100;
    }

    daftarHasil.push({
      idSiswa: s.id_siswa,
      kelas: s.kelas,
      nama: s.nama,
      statusReset: String(s.status_reset).toUpperCase() === 'YA',
      idPengerjaan: idPengerjaan,
      status: statusPengerjaan,
      waktuMulai: p ? keIsoString_(p.waktu_mulai) : '',
      waktuKumpul: p ? keIsoString_(p.waktu_kumpul) : '',
      waktuUbah: p ? keIsoString_(p.waktu_ubah) : '',
      jumlahBerkas: idPengerjaan ? hitungBerkas[idPengerjaan] || 0 : 0,
      totalSkor: totalSkor
    });
  });

  // Urutkan berdasarkan kelas lalu nama siswa
  daftarHasil.sort(function (a, b) {
    if (a.kelas !== b.kelas) {
      return String(a.kelas).localeCompare(String(b.kelas), 'id');
    }
    return String(a.nama).localeCompare(String(b.nama), 'id');
  });

  return buatRespons_(true, 'OK', 'Daftar siswa berhasil dimuat.', {
    idLkpd: idLkpd,
    daftarSiswa: daftarHasil,
    daftarKelas: bacaDaftarKelas_(false)
  });
}

function aksiLihatPekerjaan_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idSiswa = rapikanTeks_(payload.idSiswa);
  if (!idSiswa) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'ID siswa wajib disertakan.', null);
  }

  const siswa = cariSiswaById_(idSiswa);
  if (!siswa) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Data siswa tidak ditemukan.', null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const pengerjaan = cariPengerjaanSiswaLkpd_(idSiswa, idLkpd);

  if (!pengerjaan) {
    return buatRespons_(true, 'OK', 'Siswa belum mulai mengerjakan LKPD ini.', {
      siswa: { idSiswa: siswa.id_siswa, kelas: siswa.kelas, nama: siswa.nama },
      pengerjaan: { idPengerjaan: '', idLkpd: idLkpd, status: 'belum', waktuMulai: '', waktuKumpul: '' },
      jawaban: [],
      berkas: [],
      nilai: { daftar: [], totalSkor: null }
    });
  }

  const jawaban = bacaJawabanPengerjaan_(pengerjaan.id_pengerjaan);
  const berkas = bacaBerkasPengerjaan_(pengerjaan.id_pengerjaan);
  const nilai = bacaNilaiPengerjaan_(pengerjaan.id_pengerjaan);

  return buatRespons_(true, 'OK', 'Detail pekerjaan siswa dimuat.', {
    siswa: { idSiswa: siswa.id_siswa, kelas: siswa.kelas, nama: siswa.nama },
    pengerjaan: {
      idPengerjaan: pengerjaan.id_pengerjaan,
      idLkpd: pengerjaan.id_lkpd,
      status: pengerjaan.status,
      waktuMulai: pengerjaan.waktu_mulai,
      waktuKumpul: pengerjaan.waktu_kumpul,
      waktuUbah: pengerjaan.waktu_ubah
    },
    jawaban: jawaban,
    berkas: berkas,
    nilai: nilai
  });
}

function aksiResetPin_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idSiswa = rapikanTeks_(payload.idSiswa);
  const siswa = cariSiswaById_(idSiswa);
  if (!siswa) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Siswa tidak ditemukan.', null);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName('Siswa');
  // Kosongkan hash_pin (kolom 4) & salt (kolom 5), set status_reset='YA' (kolom 6), reset gagal & kunci
  sheetSiswa.getRange(siswa._baris, 4, 1, 5).setValues([['', '', 'YA', 0, '']]);

  // Hapus sesi aktif milik siswa tersebut agar harus login ulang
  hapusSesiPengguna_('siswa', idSiswa);
  catatLog_('resetPin', 'guru', 'admin', 'OK', 'Reset PIN untuk ' + siswa.kelas + ' - ' + siswa.nama);

  return buatRespons_(
    true,
    'OK',
    'PIN untuk ' + siswa.nama + ' berhasil direset. Siswa dapat membuat PIN baru saat masuk.',
    { idSiswa: idSiswa }
  );
}

function aksiBukaRevisi_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idSiswa = rapikanTeks_(payload.idSiswa);
  const pengaturan = bacaSemuaPengaturan_();
  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;

  const pengerjaan = cariPengerjaanSiswaLkpd_(idSiswa, idLkpd);
  if (!pengerjaan) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Siswa belum memiliki data pengerjaan.', null);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPengerjaan = ss.getSheetByName('Pengerjaan');
  const waktuSekarang = new Date().toISOString();
  sheetPengerjaan.getRange(pengerjaan._baris, 4).setValue('sedang');
  sheetPengerjaan.getRange(pengerjaan._baris, 6, 1, 2).setValues([['', waktuSekarang]]);

  catatLog_('bukaRevisi', 'guru', 'admin', 'OK', 'Buka revisi siswa ' + idSiswa + ' LKPD ' + idLkpd);

  return buatRespons_(true, 'OK', 'Akses revisi berhasil dibuka untuk siswa.', {
    idSiswa: idSiswa,
    status: 'sedang'
  });
}

function aksiBeriNilai_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idSiswa = rapikanTeks_(payload.idSiswa);
  const pengaturan = bacaSemuaPengaturan_();
  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const daftarNilai = Array.isArray(payload.daftarNilai) ? payload.daftarNilai : [];

  if (!idSiswa || daftarNilai.length === 0) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Data siswa dan daftar nilai wajib diisi.', null);
  }

  const pengerjaan = dapatkanAtauBuatPengerjaan_(idSiswa, idLkpd);
  simpanBatchNilai_(pengerjaan.id_pengerjaan, daftarNilai);
  catatLog_('beriNilai', 'guru', 'admin', 'OK', 'Penilaian siswa ' + idSiswa);

  const hasilNilai = bacaNilaiPengerjaan_(pengerjaan.id_pengerjaan);
  return buatRespons_(true, 'OK', 'Nilai dan komentar berhasil disimpan.', {
    nilai: hasilNilai
  });
}

function aksiAmbilBerkasGuru_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const idBerkas = rapikanTeks_(payload.idBerkas);
  const infoBerkas = cariBerkasById_(idBerkas);
  if (!infoBerkas) {
    return buatRespons_(false, 'DATA_TIDAK_LENGKAP', 'Berkas tidak ditemukan.', null);
  }

  const hasilDrive = bacaBase64DariDrive_(infoBerkas);
  if (!hasilDrive) {
    return buatRespons_(false, 'GALAT_SERVER', 'File gambar tidak ditemukan di Google Drive.', null);
  }

  return buatRespons_(true, 'OK', 'Berkas berhasil diambil.', hasilDrive);
}

function aksiSimpanPengaturan_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Perbarui sheet Pengaturan
  if (payload.pengaturan && typeof payload.pengaturan === 'object') {
    const sheetPengaturan = ss.getSheetByName('Pengaturan');
    const data = sheetPengaturan.getDataRange().getValues();
    const mapBaris = {};
    for (let i = 1; i < data.length; i++) {
      mapBaris[String(data[i][0]).trim()] = i + 1;
    }

    const kunciDiizinkan = [
      'lkpd_aktif',
      'judul_lkpd',
      'tenggat',
      'akses_dibuka',
      'skor_otomatis',
      'tampilkan_skor_siswa',
      'nama_guru',
      'nama_sekolah'
    ];

    kunciDiizinkan.forEach(function (kunci) {
      if (Object.prototype.hasOwnProperty.call(payload.pengaturan, kunci)) {
        const nilaiBaru = String(payload.pengaturan[kunci] === null ? '' : payload.pengaturan[kunci]).trim();
        if (mapBaris[kunci]) {
          sheetPengaturan.getRange(mapBaris[kunci], 2).setValue(amanUntukSheet_(nilaiBaru));
        } else {
          sheetPengaturan.appendRow([kunci, amanUntukSheet_(nilaiBaru), '']);
        }
      }
    });
  }

  // 2. Perbarui sheet Kelas jika dikirim
  if (Array.isArray(payload.daftarKelas)) {
    const sheetKelas = ss.getSheetByName('Kelas');
    if (sheetKelas.getLastRow() > 1) {
      sheetKelas.getRange(2, 1, sheetKelas.getLastRow() - 1, 3).clearContent();
    }
    const barisKelasBaru = [];
    payload.daftarKelas.forEach(function (item, idx) {
      const namaKelas = typeof item === 'string' ? rapikanTeks_(item) : rapikanTeks_(item.nama_kelas || item.nama);
      const aktif = typeof item === 'string' ? 'YA' : item.aktif === false || item.aktif === 'TIDAK' ? 'TIDAK' : 'YA';
      if (namaKelas) {
        barisKelasBaru.push(['KLS-' + (idx + 1), amanUntukSheet_(namaKelas), aktif]);
      }
    });
    if (barisKelasBaru.length > 0) {
      sheetKelas.getRange(2, 1, barisKelasBaru.length, 3).setValues(barisKelasBaru);
    }
  }

  // 3. Perbarui password guru jika diisi
  if (payload.passwordBaru && String(payload.passwordBaru).trim().length > 0) {
    const pwBaru = String(payload.passwordBaru).trim();
    if (pwBaru.length < 6) {
      return buatRespons_(false, 'FORMAT_PIN_SALAH', 'Kata sandi baru guru minimal 6 karakter.', null);
    }
    const props = PropertiesService.getScriptProperties();
    const salt = Utilities.getUuid();
    const hash = hitungHashSha256_(salt, pwBaru);
    props.setProperty('ADMIN_PASSWORD_SALT', salt);
    props.setProperty('ADMIN_PASSWORD_HASH', hash);
  }

  catatLog_('simpanPengaturan', 'guru', 'admin', 'OK', 'Pengaturan sistem diperbarui');

  return buatRespons_(true, 'OK', 'Pengaturan berhasil disimpan.', {
    pengaturan: bacaSemuaPengaturan_(),
    daftarKelas: bacaDaftarKelas_(false)
  });
}

function aksiKelolaKunci_(payload) {
  const sesi = verifikasiSesi_(payload.token, 'guru');
  if (!sesi.valid) {
    return buatRespons_(false, 'SESI_TIDAK_VALID', sesi.pesan, null);
  }

  const pengaturan = bacaSemuaPengaturan_();
  const idLkpd = rapikanTeks_(payload.idLkpd) || pengaturan.lkpd_aktif;
  const mode = payload.mode === 'simpan' ? 'simpan' : 'baca';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetKunci = ss.getSheetByName('Kunci');

  if (mode === 'baca') {
    const semuaKunci = bacaTabelObjek_('Kunci').filter(function (k) {
      return String(k.id_lkpd) === idLkpd;
    });
    return buatRespons_(true, 'OK', 'Kunci jawaban dimuat.', {
      idLkpd: idLkpd,
      daftarKunci: semuaKunci.map(function (k) {
        return {
          idSoal: k.id_soal,
          tipe: k.tipe,
          kunciJawaban: bacaDariSheet_(k.kunci_jawaban),
          toleransi: k.toleransi,
          bobot: k.bobot
        };
      })
    });
  }

  // Mode simpan: ganti seluruh kunci untuk idLkpd terkait secara bersih
  const daftarKunci = Array.isArray(payload.daftarKunci) ? payload.daftarKunci : [];
  const dataLama = sheetKunci.getDataRange().getValues();
  const barisPertahankan = [STRUKTUR_SHEET.Kunci];

  for (let i = 1; i < dataLama.length; i++) {
    if (String(dataLama[i][0]).trim() !== idLkpd) {
      barisPertahankan.push(dataLama[i]);
    }
  }

  daftarKunci.forEach(function (item) {
    const idSoal = rapikanTeks_(item.idSoal);
    if (!idSoal) return;
    barisPertahankan.push([
      idLkpd,
      idSoal,
      rapikanTeks_(item.tipe || 'pilihan_ganda'),
      amanUntukSheet_(String(item.kunciJawaban || '')),
      item.toleransi !== undefined && item.toleransi !== '' ? Number(item.toleransi) : 0,
      item.bobot !== undefined && item.bobot !== '' ? Number(item.bobot) : 10
    ]);
  });

  sheetKunci.clearContents();
  sheetKunci.getRange(1, 1, barisPertahankan.length, STRUKTUR_SHEET.Kunci.length).setValues(barisPertahankan);

  return buatRespons_(true, 'OK', 'Kunci jawaban berhasil disimpan.', {
    idLkpd: idLkpd,
    jumlahKunci: daftarKunci.length
  });
}

/**
 * ============================================================================
 * FUNGSI PEMBANTU DATABASE SHEET, SKOR OTOMATIS, & GOOGLE DRIVE
 * ============================================================================
 */

function denganKunci_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(KONFIG_SERVER.WAKTU_TUNGGU_KUNCI_MS)) {
    return buatRespons_(
      false,
      'SERVER_SIBUK',
      'Server sedang ramai melayani siswa lain. Silakan coba lagi dalam beberapa detik.',
      null
    );
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function buatRespons_(ok, kode, pesan, data) {
  const objekRespons = {
    ok: Boolean(ok),
    kode: String(kode || (ok ? 'OK' : 'GALAT_SERVER')),
    pesan: String(pesan || ''),
    data: data === undefined ? null : data
  };
  return ContentService.createTextOutput(JSON.stringify(objekRespons)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function hitungHashSha256_(salt, rahasia) {
  const bahan = String(salt) + ':' + String(rahasia);
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    bahan,
    Utilities.Charset.UTF_8
  );
  return digest
    .map(function (byte) {
      const v = byte < 0 ? byte + 256 : byte;
      return ('0' + v.toString(16)).slice(-2);
    })
    .join('');
}

function validasiFormatPin_(pin) {
  return /^[0-9]{4,6}$/.test(String(pin));
}

function hitungSisaDetikKunci_(waktuKunciRaw) {
  const iso = keIsoString_(waktuKunciRaw);
  if (!iso) return 0;
  const targetMs = new Date(iso).getTime();
  if (isNaN(targetMs)) return 0;
  const sisaMs = targetMs - Date.now();
  return sisaMs > 0 ? Math.ceil(sisaMs / 1000) : 0;
}

function apakahTenggatLewat_(tenggatRaw) {
  const iso = keIsoString_(tenggatRaw);
  if (!iso) return false;
  const targetMs = new Date(iso).getTime();
  if (isNaN(targetMs)) return false;
  return Date.now() > targetMs;
}

function buatSesiBaru_(peran, idPengguna, durasiJam) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSesi = ss.getSheetByName('Sesi');
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();
  const sekarang = new Date();
  const kedaluwarsa = new Date(sekarang.getTime() + durasiJam * 3600 * 1000);

  sheetSesi.appendRow([
    token,
    peran,
    idPengguna,
    kedaluwarsa.toISOString(),
    sekarang.toISOString()
  ]);

  return token;
}

function verifikasiSesi_(tokenRaw, peranWajib) {
  const token = String(tokenRaw || '').trim();
  if (!token) {
    return { valid: false, pesan: 'Sesi tidak ditemukan. Silakan masuk kembali.' };
  }

  const daftarSesi = bacaTabelObjek_('Sesi');
  const sekarangMs = Date.now();

  for (let i = daftarSesi.length - 1; i >= 0; i--) {
    const s = daftarSesi[i];
    if (String(s.token) === token) {
      if (peranWajib && String(s.peran) !== peranWajib) {
        return { valid: false, pesan: 'Peran akun tidak sesuai untuk mengakses fitur ini.' };
      }
      const expIso = keIsoString_(s.kedaluwarsa);
      const expMs = new Date(expIso).getTime();
      if (isNaN(expMs) || expMs <= sekarangMs) {
        return { valid: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk kembali.' };
      }
      return {
        valid: true,
        token: token,
        peran: String(s.peran),
        idPengguna: String(s.id_pengguna)
      };
    }
  }

  return { valid: false, pesan: 'Token sesi tidak valid. Silakan masuk kembali.' };
}

function hapusSesiPengguna_(peran, idPengguna) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSesi = ss.getSheetByName('Sesi');
  const data = sheetSesi.getDataRange().getValues();
  if (data.length <= 1) return;

  const sisaBaris = [data[0]];
  for (let i = 1; i < data.length; i++) {
    if (!(String(data[i][1]) === peran && String(data[i][2]) === idPengguna)) {
      sisaBaris.push(data[i]);
    }
  }
  sheetSesi.clearContents();
  sheetSesi.getRange(1, 1, sisaBaris.length, sisaBaris[0].length).setValues(sisaBaris);
}

function bacaSemuaPengaturan_() {
  const baris = bacaTabelObjek_('Pengaturan');
  const hasil = {
    lkpd_aktif: 'matematika-8-bilangan-berpangkat',
    judul_lkpd: 'Petualangan Bilangan Berpangkat',
    tenggat: '',
    akses_dibuka: 'YA',
    skor_otomatis: 'TIDAK',
    tampilkan_skor_siswa: 'YA',
    nama_guru: 'Gigih Ichyar Fauzan, S.Pd.',
    nama_sekolah: 'SMP Negeri 2 Kedungbanteng'
  };
  baris.forEach(function (b) {
    const k = String(b.kunci || '').trim();
    if (k) {
      hasil[k] = bacaDariSheet_(b.nilai);
    }
  });
  return hasil;
}

function bacaDaftarKelas_(hanyaAktif) {
  const baris = bacaTabelObjek_('Kelas');
  const hasil = [];
  baris.forEach(function (b) {
    const aktif = String(b.aktif || 'YA').toUpperCase() === 'YA';
    if (!hanyaAktif || aktif) {
      hasil.push({
        idKelas: String(b.id_kelas || ''),
        nama: bacaDariSheet_(b.nama_kelas),
        aktif: aktif
      });
    }
  });
  return hasil;
}

function cariSiswaByKelasNama_(kelas, nama) {
  const daftar = bacaTabelObjek_('Siswa');
  const kelasNorm = kelas.toLowerCase();
  const namaNorm = nama.toLowerCase();

  for (let i = 0; i < daftar.length; i++) {
    const s = daftar[i];
    if (
      rapikanTeks_(s.kelas).toLowerCase() === kelasNorm &&
      rapikanNama_(s.nama).toLowerCase() === namaNorm
    ) {
      return s;
    }
  }
  return null;
}

function cariSiswaById_(idSiswa) {
  const daftar = bacaTabelObjek_('Siswa');
  for (let i = 0; i < daftar.length; i++) {
    if (String(daftar[i].id_siswa) === idSiswa) {
      return daftar[i];
    }
  }
  return null;
}

function cariPengerjaanSiswaLkpd_(idSiswa, idLkpd) {
  const daftar = bacaTabelObjek_('Pengerjaan');
  for (let i = 0; i < daftar.length; i++) {
    if (String(daftar[i].id_siswa) === idSiswa && String(daftar[i].id_lkpd) === idLkpd) {
      daftar[i].waktu_mulai = keIsoString_(daftar[i].waktu_mulai);
      daftar[i].waktu_kumpul = keIsoString_(daftar[i].waktu_kumpul);
      daftar[i].waktu_ubah = keIsoString_(daftar[i].waktu_ubah);
      return daftar[i];
    }
  }
  return null;
}

function cariPengerjaanById_(idPengerjaan) {
  const daftar = bacaTabelObjek_('Pengerjaan');
  for (let i = 0; i < daftar.length; i++) {
    if (String(daftar[i].id_pengerjaan) === idPengerjaan) {
      return daftar[i];
    }
  }
  return null;
}

function dapatkanAtauBuatPengerjaan_(idSiswa, idLkpd) {
  const ada = cariPengerjaanSiswaLkpd_(idSiswa, idLkpd);
  if (ada) return ada;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetPengerjaan = ss.getSheetByName('Pengerjaan');
  const idPengerjaan = 'PKJ-' + Utilities.getUuid().slice(0, 8).toUpperCase();
  const sekarang = new Date().toISOString();

  sheetPengerjaan.appendRow([idPengerjaan, idSiswa, idLkpd, 'sedang', sekarang, '', sekarang]);

  return {
    _baris: sheetPengerjaan.getLastRow(),
    id_pengerjaan: idPengerjaan,
    id_siswa: idSiswa,
    id_lkpd: idLkpd,
    status: 'sedang',
    waktu_mulai: sekarang,
    waktu_kumpul: '',
    waktu_ubah: sekarang
  };
}

function perbaruiWaktuUbahPengerjaan_(idPengerjaan, waktuIso) {
  const pengerjaan = cariPengerjaanById_(idPengerjaan);
  if (!pengerjaan) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName('Pengerjaan').getRange(pengerjaan._baris, 7).setValue(waktuIso);
}

function bacaJawabanPengerjaan_(idPengerjaan) {
  const semua = bacaTabelObjek_('Jawaban');
  const hasil = [];
  semua.forEach(function (j) {
    if (String(j.id_pengerjaan) === idPengerjaan) {
      hasil.push({
        idSoal: String(j.id_soal),
        teks: bacaDariSheet_(j.teks),
        dataJson: bacaDariSheet_(j.data_json),
        waktuUbah: keIsoString_(j.waktu_ubah)
      });
    }
  });
  return hasil;
}

function simpanBatchJawaban_(idPengerjaan, daftarJawaban) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetJawaban = ss.getSheetByName('Jawaban');
  const data = sheetJawaban.getDataRange().getValues();
  const waktuSekarang = new Date().toISOString();

  // Petakan indeks baris existing berdasarkan id_soal untuk idPengerjaan ini
  const indeksSoal = {};
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idPengerjaan) {
      indeksSoal[String(data[i][1])] = i;
    }
  }

  let adaPerubahan = false;
  daftarJawaban.forEach(function (item) {
    const idSoal = rapikanTeks_(item.idSoal);
    if (!idSoal) return;

    const teksAman = amanUntukSheet_(String(item.teks !== undefined && item.teks !== null ? item.teks : ''));
    const jsonString =
      item.dataJson !== undefined && item.dataJson !== null
        ? typeof item.dataJson === 'string'
          ? item.dataJson
          : JSON.stringify(item.dataJson)
        : '';
    const jsonAman = amanUntukSheet_(jsonString);

    if (Object.prototype.hasOwnProperty.call(indeksSoal, idSoal)) {
      const idx = indeksSoal[idSoal];
      data[idx][2] = teksAman;
      data[idx][3] = jsonAman;
      data[idx][4] = waktuSekarang;
      adaPerubahan = true;
    } else {
      data.push([idPengerjaan, idSoal, teksAman, jsonAman, waktuSekarang]);
      indeksSoal[idSoal] = data.length - 1;
      adaPerubahan = true;
    }
  });

  if (adaPerubahan) {
    sheetJawaban.getRange(1, 1, data.length, STRUKTUR_SHEET.Jawaban.length).setValues(data);
    perbaruiWaktuUbahPengerjaan_(idPengerjaan, waktuSekarang);
  }

  return waktuSekarang;
}

function bacaBerkasPengerjaan_(idPengerjaan) {
  const semua = bacaTabelObjek_('Berkas');
  const hasil = [];
  semua.forEach(function (b) {
    if (String(b.id_pengerjaan) === idPengerjaan) {
      hasil.push({
        idBerkas: String(b.id_berkas),
        idSoal: String(b.id_soal),
        jenis: String(b.jenis),
        namaFile: String(b.nama_file),
        ukuran: Number(b.ukuran) || 0,
        mime: String(b.mime),
        waktuUnggah: keIsoString_(b.waktu_unggah)
      });
    }
  });
  return hasil;
}

function cariBerkasById_(idBerkas) {
  const semua = bacaTabelObjek_('Berkas');
  for (let i = 0; i < semua.length; i++) {
    if (String(semua[i].id_berkas) === idBerkas) {
      return semua[i];
    }
  }
  return null;
}

function hapusSatuBerkasInternal_(idBerkas) {
  const info = cariBerkasById_(idBerkas);
  if (!info) return;

  // Pindahkan file di Drive ke tempat sampah (aman)
  if (info.id_file_drive) {
    try {
      const file = DriveApp.getFileById(String(info.id_file_drive));
      file.setTrashed(true);
    } catch (err) {
      // Abaikan jika file sudah terhapus manual di Drive
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetBerkas = ss.getSheetByName('Berkas');
  sheetBerkas.deleteRow(info._baris);
}

function bacaBase64DariDrive_(infoBerkas) {
  try {
    const file = DriveApp.getFileById(String(infoBerkas.id_file_drive));
    if (!file || file.isTrashed()) return null;
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    const mime = String(infoBerkas.mime || blob.getContentType() || 'image/jpeg');
    return {
      idBerkas: String(infoBerkas.id_berkas),
      idSoal: String(infoBerkas.id_soal),
      jenis: String(infoBerkas.jenis),
      namaFile: String(infoBerkas.nama_file),
      mime: mime,
      base64Data: 'data:' + mime + ';base64,' + base64
    };
  } catch (err) {
    return null;
  }
}

function bacaNilaiPengerjaan_(idPengerjaan) {
  const semua = bacaTabelObjek_('Nilai');
  const daftar = [];
  let adaTotalKhusus = false;
  let skorTotalKhusus = 0;
  let jumlahSkorSoal = 0;
  let adaNilaiAngka = false;

  semua.forEach(function (n) {
    if (String(n.id_pengerjaan) === idPengerjaan) {
      const skorRaw = String(n.skor === undefined || n.skor === null ? '' : n.skor).trim();
      const skorAngka = skorRaw !== '' && !isNaN(Number(skorRaw)) ? Number(skorRaw) : null;
      if (skorAngka !== null) {
        adaNilaiAngka = true;
        if (String(n.id_soal) === '__TOTAL__') {
          adaTotalKhusus = true;
          skorTotalKhusus = skorAngka;
        } else {
          jumlahSkorSoal += skorAngka;
        }
      }
      daftar.push({
        idSoal: String(n.id_soal),
        skor: skorAngka,
        komentar: bacaDariSheet_(n.komentar),
        waktuNilai: keIsoString_(n.waktu_nilai)
      });
    }
  });

  const totalSkor = adaNilaiAngka
    ? adaTotalKhusus
      ? skorTotalKhusus
      : Math.round(jumlahSkorSoal * 100) / 100
    : null;

  return {
    daftar: daftar,
    totalSkor: totalSkor
  };
}

function simpanBatchNilai_(idPengerjaan, daftarNilai) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNilai = ss.getSheetByName('Nilai');
  const data = sheetNilai.getDataRange().getValues();
  const waktuSekarang = new Date().toISOString();

  const indeksSoal = {};
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idPengerjaan) {
      indeksSoal[String(data[i][1])] = i;
    }
  }

  daftarNilai.forEach(function (item) {
    const idSoal = rapikanTeks_(item.idSoal);
    if (!idSoal) return;

    const skorVal =
      item.skor !== undefined && item.skor !== null && String(item.skor).trim() !== ''
        ? Number(item.skor)
        : '';
    const komentarAman = amanUntukSheet_(String(item.komentar || ''));

    if (Object.prototype.hasOwnProperty.call(indeksSoal, idSoal)) {
      const idx = indeksSoal[idSoal];
      data[idx][2] = skorVal;
      data[idx][3] = komentarAman;
      data[idx][4] = waktuSekarang;
    } else {
      data.push([idPengerjaan, idSoal, skorVal, komentarAman, waktuSekarang]);
      indeksSoal[idSoal] = data.length - 1;
    }
  });

  sheetNilai.getRange(1, 1, data.length, STRUKTUR_SHEET.Nilai.length).setValues(data);
}

/**
 * Penilaian otomatis di server berdasarkan tab Kunci (tidak pernah dikirim ke klien).
 * Mendukung pilihan_ganda, benar_salah, dan isian_angka (dengan toleransi & multi-jawaban).
 */
function jalankanSkorOtomatis_(idPengerjaan, idLkpd) {
  const daftarKunci = bacaTabelObjek_('Kunci').filter(function (k) {
    return String(k.id_lkpd) === idLkpd;
  });
  if (daftarKunci.length === 0) return;

  const jawabanSiswa = bacaJawabanPengerjaan_(idPengerjaan);
  const mapJawaban = {};
  jawabanSiswa.forEach(function (j) {
    mapJawaban[j.idSoal] = j;
  });

  const hasilNilai = [];
  daftarKunci.forEach(function (k) {
    const idSoal = String(k.id_soal);
    const tipe = String(k.tipe || '').toLowerCase();
    const kunciRaw = bacaDariSheet_(k.kunci_jawaban).trim();
    const toleransi = Number(k.toleransi) || 0;
    const bobot = Number(k.bobot) || 10;

    if (!kunciRaw) return;

    const jwb = mapJawaban[idSoal];
    const teksSiswa = jwb ? String(jwb.teks || '').trim() : '';
    let benar = false;

    // Mendukung beberapa alternatif jawaban benar dipisahkan tanda "|"
    const alternatifKunci = kunciRaw.split('|').map(function (s) {
      return s.trim();
    });

    if (tipe === 'isian_angka') {
      const angkaSiswa = parseFloat(teksSiswa.replace(',', '.'));
      if (!isNaN(angkaSiswa)) {
        benar = alternatifKunci.some(function (alt) {
          const angkaKunci = parseFloat(alt.replace(',', '.'));
          return !isNaN(angkaKunci) && Math.abs(angkaSiswa - angkaKunci) <= toleransi;
        });
      }
    } else if (tipe === 'pilihan_ganda' || tipe === 'benar_salah') {
      benar = alternatifKunci.some(function (alt) {
        return teksSiswa.toLowerCase() === alt.toLowerCase();
      });
    }

    hasilNilai.push({
      idSoal: idSoal,
      skor: benar ? bobot : 0,
      komentar: ''
    });
  });

  if (hasilNilai.length > 0) {
    simpanBatchNilai_(idPengerjaan, hasilNilai);
  }
}

/**
 * Mengelola struktur folder Google Drive: {ROOT_FOLDER}/{Judul LKPD}/{Kelas}/{Nama Siswa}
 */
function dapatkanFolderSiswaDrive_(judulLkpd, kelas, namaSiswa) {
  const props = PropertiesService.getScriptProperties();
  let rootId = props.getProperty('ROOT_FOLDER_ID');
  let rootFolder;

  try {
    rootFolder = rootId ? DriveApp.getFolderById(rootId) : null;
  } catch (err) {
    rootFolder = null;
  }

  if (!rootFolder || rootFolder.isTrashed()) {
    rootFolder = DriveApp.createFolder(KONFIG_SERVER.NAMA_FOLDER_UTAMA);
    props.setProperty('ROOT_FOLDER_ID', rootFolder.getId());
  }

  const folderLkpd = dapatkanAtauBuatSubfolder_(rootFolder, bersihkanNamaFolder_(judulLkpd || 'LKPD'));
  const folderKelas = dapatkanAtauBuatSubfolder_(folderLkpd, bersihkanNamaFolder_(kelas || 'Umum'));
  const folderSiswa = dapatkanAtauBuatSubfolder_(folderKelas, bersihkanNamaFolder_(namaSiswa || 'Siswa'));

  return folderSiswa;
}

function dapatkanAtauBuatSubfolder_(induk, namaSubfolder) {
  const iter = induk.getFoldersByName(namaSubfolder);
  while (iter.hasNext()) {
    const f = iter.next();
    if (!f.isTrashed()) return f;
  }
  return induk.createFolder(namaSubfolder);
}

/**
 * Validasi tipe gambar berdasarkan magic bytes (header biner) agar tidak bisa dipalsukan.
 */
function deteksiMimeDariMagicBytes_(bytes) {
  if (!bytes || bytes.length < 12) return null;
  const b = bytes.map(function (x) {
    return x < 0 ? x + 256 : x;
  });

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { mime: 'image/jpeg', ekstensi: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return { mime: 'image/png', ekstensi: 'png' };
  }

  // WEBP: "RIFF" (0..3) dan "WEBP" (8..11)
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return { mime: 'image/webp', ekstensi: 'webp' };
  }

  return null;
}

/**
 * ============================================================================
 * UTILITAS UMUM PEMBACAAN SHEET & SANITASI DATA
 * ============================================================================
 */

function bacaTabelObjek_(namaSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(namaSheet);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function (h) {
    return String(h).trim();
  });

  const hasil = [];
  for (let i = 1; i < values.length; i++) {
    const barisObj = { _baris: i + 1 };
    let barisKosong = true;
    for (let j = 0; j < headers.length; j++) {
      const val = values[i][j];
      if (val !== '' && val !== null && val !== undefined) {
        barisKosong = false;
      }
      barisObj[headers[j]] = val;
    }
    if (!barisKosong) {
      hasil.push(barisObj);
    }
  }
  return hasil;
}

function catatLog_(aksi, peran, idPengguna, status, detail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetLog = ss.getSheetByName('Log');
    if (!sheetLog) return;
    sheetLog.appendRow([
      new Date().toISOString(),
      String(aksi || ''),
      String(peran || ''),
      String(idPengguna || ''),
      String(status || ''),
      amanUntukSheet_(String(detail || '').slice(0, 500))
    ]);
  } catch (err) {
    // Jangan gagalkan proses utama bila logging gagal
  }
}

function keIsoString_(nilai) {
  if (!nilai) return '';
  if (nilai instanceof Date) {
    return isNaN(nilai.getTime()) ? '' : nilai.toISOString();
  }
  return String(nilai).trim();
}

function rapikanTeks_(teks) {
  if (teks === undefined || teks === null) return '';
  return String(teks).replace(/\s+/g, ' ').trim();
}

function rapikanNama_(nama) {
  return rapikanTeks_(nama);
}

function bersihkanPrefixBase64_(data) {
  if (!data) return '';
  const str = String(data).trim();
  const idx = str.indexOf('base64,');
  return idx !== -1 ? str.slice(idx + 7) : str;
}

function bersihkanNamaFolder_(nama) {
  return String(nama || 'Tanpa_Nama')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function buatNamaFileAman_(nama) {
  return String(nama || 'berkas')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

/**
 * Mencegah Google Sheets menafsirkan jawaban matematika seperti "-2^3" atau "= 8"
 * sebagai rumus spreadsheet dengan menambahkan penanda teks murni.
 */
function amanUntukSheet_(teks) {
  const str = String(teks === undefined || teks === null ? '' : teks);
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function bacaDariSheet_(teks) {
  const str = String(teks === undefined || teks === null ? '' : teks);
  if (str.charAt(0) === "'" && /^[=+\-@]/.test(str.slice(1))) {
    return str.slice(1);
  }
  return str;
}