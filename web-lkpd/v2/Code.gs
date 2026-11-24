/**
 * ============================================================
 * e-LKPD Interaktif — Backend Google Apps Script (Web App)
 * ============================================================
 * Web App untuk mengelola e-Lembar Kerja Peserta Didik interaktif.
 * Penyimpanan: Google Sheet (data) + Google Drive (berkas gambar/foto).
 *
 * CARA PEMASANGAN (ringkas, detail di README.md):
 *  1. Buka https://script.google.com → New project.
 *  2. Hapus kode default, tempel seluruh isi file ini.
 *  3. Jalankan fungsi setup() satu kali (Run → Run function → setup).
 *     Beri izin akses ke Spreadsheet, Drive, dan Script saat diminta.
 *  4. Ganti kata sandi guru: jalankan gantiKataSandiGuru('kataSandiBaru').
 *  5. Deploy: Deploy → New deployment → Web app.
 *       - Execute as: "Me"
 *       - Who has access: "Anyone"
 *     Salin URL Web App.
 *  6. Tempel URL tersebut ke config.js di sisi klien (setelah Tahap 2).
 *  7. Setiap kali mengubah kode: Deploy → Manage deployments →
 *     Edit → Version: "New version" → Deploy (agar perubahan tampil).
 *
 * Catatan keamanan:
 *  - Klien memanggil dengan POST Content-Type "text/plain" (menghindari
 *    preflight CORS). Body adalah JSON string.
 *  - Asumsi: URL Web App publik dan semua klien tidak tepercaya.
 *  - Setiap aksi non-login memvalidasi token, peran, dan kepemilikan data.
 * ============================================================
 */

// ============================================================
// KONFIGURASI & KONSTANTA
// ============================================================

const KONFIG = {
  // Identitas aplikasi
  NAMA_APLIKASI: 'e-LKPD',
  VERSI: '1.0.0',

  // Nama-nama sheet di Google Sheet
  SHEET_PENGATURAN: 'Pengaturan',
  SHEET_KELAS: 'Kelas',
  SHEET_SISWA: 'Siswa',
  SHEET_SESI: 'Sesi',
  SHEET_PENGERJAAN: 'Pengerjaan',
  SHEET_JAWABAN: 'Jawaban',
  SHEET_BERKAS: 'Berkas',
  SHEET_NILAI: 'Nilai',
  SHEET_KUNCI: 'Kunci',   // Jawaban kunci untuk skor otomatis (Tahap 4)
  SHEET_LOG: 'Log',

  // Keamanan
  PERCOBAAN_PIN_MAKS: 5,        // Maksimum percobaan PIN salah sebelum terkunci
  MENIT_KUNCI: 5,                // Durasi kunci sementara (menit)
  SESI_SISWA_MENIT: 720,         // Umur sesi siswa (12 jam)
  SESI_GURU_MENIT: 480,          // Umur sesi guru (8 jam)

  // Batas berkas
  BERKAS_MAKS_BYTE: 2.5 * 1024 * 1024,  // 2,5 MB setelah decode base64
  BERKAS_MAKS_PER_SOAL: 5,              // Maksimum 5 berkas per soal
  MIME_DIIZINKAN: ['image/jpeg', 'image/png', 'image/webp'],

  // Folder Drive utama untuk menyimpan berkas siswa
  FOLDER_UTAMA_NAMA: 'e-LKPD-Berkas',

  // Kata sandi guru default (HARUS diganti setelah setup via gantiKataSandiGuru)
  DEFAULT_KATA_SANDI_GURU: 'admin123',
};

// Kunci (key) Script Properties
const PROP_KATA_SANDI_GURU_HASH = 'KATA_SANDI_GURU_HASH';
const PROP_KATA_SANDI_GURU_SALT = 'KATA_SANDI_GURU_SALT';
const PROP_ID_SPREADSHEET = 'ID_SPREADSHEET';
const PROP_ID_FOLDER_UTAMA = 'ID_FOLDER_UTAMA';

// Aksi yang TIDAK memerlukan token (publik/login)
const AKSI_PUBLIK = ['cekSiswa', 'buatPin', 'masukSiswa', 'masukGuru'];

// ============================================================
// ROUTER UTAMA
// ============================================================

/**
 * Pintu masuk semua permintaan POST dari klien.
 * Body berupa JSON string dengan Content-Type "text/plain".
 */
function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!body) {
      return kirimGagal('VALIDASI_GAGAL', 'Permintaan kosong.');
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch (errParse) {
      return kirimGagal('VALIDASI_GAGAL', 'Format JSON tidak valid.');
    }

    const aksi = payload.aksi;
    if (!aksi) {
      return kirimGagal('VALIDASI_GAGAL', 'Field "aksi" wajib diisi.');
    }

    // Untuk aksi non-publik, validasi token terlebih dahulu
    let konteks = null;
    if (AKSI_PUBLIK.indexOf(aksi) === -1) {
      konteks = validasiToken(payload.token);
      if (!konteks.valid) {
        return kirimGagal('TOKEN_TIDAK_VALID', konteks.pesan || 'Sesi tidak valid.');
      }
    }

    return ruteAksi(aksi, payload, konteks);

  } catch (err) {
    catatLog('ERROR', 'doPost', (err && err.stack) ? err.stack : String(err));
    const pesanErr = String((err && err.message) ? err.message : err);
    // Tangani kuota Apps Script terlampaui
    if (pesanErr.toLowerCase().indexOf('quota') !== -1) {
      return kirimGagal('KUOTA_TERLAMPAUI', 'Kuota Google Apps Script terlampaui. Coba lagi beberapa menit lagi.');
    }
    return kirimGagal('KESALAHAN_SERVER', 'Terjadi kesalahan tak terduga di server.');
  }
}

/**
 * doGet HANYA untuk pemeriksaan status (health check).
 * TIDAK mengembalikan data sensitif apa pun.
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      kode: 'OK',
      data: { aplikasi: KONFIG.NAMA_APLIKASI, versi: KONFIG.VERSI, status: 'aktif' }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Router aksi ke fungsi penangan masing-masing.
 */
function ruteAksi(aksi, payload, konteks) {
  const peta = {
    // ---- Aksi Siswa ----
    'cekSiswa': function() { return aksiCekSiswa(payload); },
    'buatPin': function() { return aksiBuatPin(payload); },
    'masukSiswa': function() { return aksiMasukSiswa(payload); },
    'muatPekerjaan': function() { return aksiMuatPekerjaan(payload, konteks); },
    'simpanJawaban': function() { return aksiSimpanJawaban(payload, konteks); },
    'unggahBerkas': function() { return aksiUnggahBerkas(payload, konteks); },
    'hapusBerkas': function() { return aksiHapusBerkas(payload, konteks); },
    'ambilBerkas': function() { return aksiAmbilBerkas(payload, konteks); },
    'kumpulkan': function() { return aksiKumpulkan(payload, konteks); },
    'lihatNilaiSaya': function() { return aksiLihatNilaiSaya(payload, konteks); },
    // ---- Aksi Guru ----
    'masukGuru': function() { return aksiMasukGuru(payload); },
    'daftarSiswa': function() { return aksiDaftarSiswa(payload, konteks); },
    'lihatPekerjaan': function() { return aksiLihatPekerjaan(payload, konteks); },
    'resetPin': function() { return aksiResetPin(payload, konteks); },
    'bukaRevisi': function() { return aksiBukaRevisi(payload, konteks); },
    'beriNilai': function() { return aksiBeriNilai(payload, konteks); },
    'ambilBerkasGuru': function() { return aksiAmbilBerkasGuru(payload, konteks); },
    'simpanPengaturan': function() { return aksiSimpanPengaturan(payload, konteks); },
    'bacaPengaturan': function() { return aksiBacaPengaturan(payload, konteks); },
  };

  if (peta[aksi]) {
    return peta[aksi]();
  }
  return kirimGagal('AKSI_TIDAK_DIKENAL', 'Aksi "' + aksi + '" tidak dikenal.');
}

// ============================================================
// FUNGSI PEMASANGAN (SETUP) — jalankan satu kali
// ============================================================

/**
 * Membuat seluruh sheet, folder Drive, dan pengaturan default.
 * Jalankan fungsi ini SATU KALI setelah menempel kode ini ke editor.
 * Setelah selesai, jalankan juga gantiKataSandiGuru('kataSandiBaru').
 */
function setup() {
  // 1. Ambil atau buat Spreadsheet
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    ss = SpreadsheetApp.create('e-LKPD Database');
  }

  // Simpan ID spreadsheet di Script Properties
  PropertiesService.getScriptProperties().setProperty(PROP_ID_SPREADSHEET, ss.getId());

  // 2. Buat semua sheet dengan header masing-masing
  buatSheet(ss, KONFIG.SHEET_PENGATURAN, ['kunci', 'nilai', 'catatan']);
  buatSheet(ss, KONFIG.SHEET_KELAS, ['id', 'nama', 'catatan']);
  buatSheet(ss, KONFIG.SHEET_SISWA, [
    'id', 'kelas', 'nama', 'hashPin', 'salt', 'statusReset',
    'percobaanGagal', 'waktuKunci', 'dibuatPada'
  ]);
  buatSheet(ss, KONFIG.SHEET_SESI, [
    'token', 'peran', 'idPengguna', 'lkpdId', 'waktuBuat', 'waktuKedaluwarsa'
  ]);
  buatSheet(ss, KONFIG.SHEET_PENGERJAAN, [
    'id', 'siswaId', 'lkpdId', 'status', 'waktuMulai', 'waktuKumpul', 'revisiDibuka'
  ]);
  buatSheet(ss, KONFIG.SHEET_JAWABAN, [
    'pengerjaanId', 'idSoal', 'teks', 'data', 'waktuUbah'
  ]);
  buatSheet(ss, KONFIG.SHEET_BERKAS, [
    'id', 'pengerjaanId', 'idSoal', 'jenis', 'fileId', 'nama', 'ukuran', 'mime', 'waktu'
  ]);
  buatSheet(ss, KONFIG.SHEET_NILAI, [
    'pengerjaanId', 'idSoal', 'skor', 'komentar', 'waktu'
  ]);
  buatSheet(ss, KONFIG.SHEET_KUNCI, [
    'lkpdId', 'idSoal', 'tipe', 'jawabanBenar', 'toleransi', 'wajib', 'bobot'
  ]);
  buatSheet(ss, KONFIG.SHEET_LOG, [
    'waktu', 'level', 'sumber', 'pesan'
  ]);

  // 3. Isi pengaturan default jika masih kosong
  const sheetPengaturan = ss.getSheetByName(KONFIG.SHEET_PENGATURAN);
  if (sheetPengaturan.getLastRow() < 2) {
    const defaultPengaturan = [
      ['daftarKelas', '["VIII"]', 'Daftar kelas yang tersedia (format JSON array)'],
      ['lkpdAktifId', '', 'ID LKPD yang sedang aktif'],
      ['aksesBuka', 'true', 'Apakah akses siswa dibuka (true/false)'],
      ['tenggat', '', 'Tenggat pengumpulan (format ISO, kosong = tanpa tenggat)'],
      ['tampilkanNilaiSiswa', 'false', 'Apakah siswa boleh melihat nilai setelah dinilai'],
      ['lkpdJudul', 'LKPD Contoh', 'Judul LKPD aktif (dipakai untuk nama folder Drive)'],
    ];
    sheetPengaturan.getRange(2, 1, defaultPengaturan.length, 3).setValues(defaultPengaturan);
  }

  // 4. Buat folder Drive utama untuk berkas
  const folderUtama = getOrCreateFolderDrive(KONFIG.FOLDER_UTAMA_NAMA, DriveApp.getRootFolder());
  PropertiesService.getScriptProperties().setProperty(PROP_ID_FOLDER_UTAMA, folderUtama.getId());

  // 5. Set kata sandi guru default jika belum ada
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_KATA_SANDI_GURU_HASH)) {
    const salt = buatSalt();
    const hash = hashPin(KONFIG.DEFAULT_KATA_SANDI_GURU, salt);
    props.setProperty(PROP_KATA_SANDI_GURU_SALT, salt);
    props.setProperty(PROP_KATA_SANDI_GURU_HASH, hash);
  }

  catatLog('INFO', 'setup', 'Setup selesai. Spreadsheet & folder siap.');
  return 'Setup selesai.\nSpreadsheet ID: ' + ss.getId() + '\nFolder ID: ' + folderUtama.getId() + '\n\nPENTING: Jalankan gantiKataSandiGuru("kataSandiBaru") untuk mengganti kata sandi guru default.';
}

/**
 * Membuat sheet jika belum ada, dengan header yang ditentukan.
 * Jika sheet sudah ada tapi kosong, tulis header.
 */
function buatSheet(ss, nama, header) {
  let sheet = ss.getSheetByName(nama);
  if (!sheet) {
    sheet = ss.insertSheet(nama);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Mengganti kata sandi guru. Jalankan dari editor Apps Script.
 * @param {string} sandiBaru Kata sandi baru (minimal 6 karakter).
 * @returns {string} Pesan konfirmasi.
 */
function gantiKataSandiGuru(sandiBaru) {
  if (!sandiBaru || String(sandiBaru).length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }
  const props = PropertiesService.getScriptProperties();
  const salt = buatSalt();
  const hash = hashPin(String(sandiBaru), salt);
  props.setProperty(PROP_KATA_SANDI_GURU_SALT, salt);
  props.setProperty(PROP_KATA_SANDI_GURU_HASH, hash);
  catatLog('INFO', 'gantiKataSandiGuru', 'Kata sandi guru diganti.');
  return 'Kata sandi guru berhasil diganti.';
}

/**
 * Menghapus SEMUA data uji coba (siswa, sesi, pengerjaan, jawaban, berkas, nilai, log).
 * PERHATIAN: Hanya untuk pembersihan saat pengembangan. Jalankan dari editor.
 * Tidak menghapus pengaturan dan kata sandi guru.
 * Berkas di Drive perlu dihapus manual (folder e-LKPD-Berkas).
 */
function hapusDataUjiCoba() {
  const daftarSheet = [
    KONFIG.SHEET_SISWA, KONFIG.SHEET_SESI, KONFIG.SHEET_PENGERJAAN,
    KONFIG.SHEET_JAWABAN, KONFIG.SHEET_BERKAS, KONFIG.SHEET_NILAI, KONFIG.SHEET_LOG
  ];
  const ss = getSpreadsheet();
  for (let i = 0; i < daftarSheet.length; i++) {
    const sheet = ss.getSheetByName(daftarSheet[i]);
    if (sheet) {
      const barisTerakhir = sheet.getLastRow();
      if (barisTerakhir > 1) {
        sheet.getRange(2, 1, barisTerakhir - 1, sheet.getLastColumn()).clearContent();
      }
    }
  }
  catatLog('INFO', 'hapusDataUjiCoba', 'Data uji coba dihapus.');
  return 'Data uji coba dihapus. Berkas di Drive perlu dihapus manual jika perlu.';
}

// ============================================================
// UTILITAS SPREADSHEET
// ============================================================

/** Mengambil spreadsheet aktif (berdasarkan ID di Script Properties). */
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(PROP_ID_SPREADSHEET);
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Mengambil sheet berdasarkan nama. */
function getSheet(nama) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(nama);
  if (!sheet) {
    throw new Error('Sheet "' + nama + '" tidak ditemukan. Jalankan setup() terlebih dahulu.');
  }
  return sheet;
}

/**
 * Membaca semua baris sheet sebagai array objek.
 * Kunci objek = nama header. Tambahan field "_baris" (nomor baris, 1-indexed)
 * untuk operasi update/hapus.
 */
function bacaSemua(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const header = data[0];
  const hasil = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    let kosong = true;
    for (let j = 0; j < header.length; j++) {
      const kunci = String(header[j]).trim();
      if (kunci) {
        obj[kunci] = data[i][j];
        if (data[i][j] !== '' && data[i][j] !== null) kosong = false;
      }
    }
    obj._baris = i + 1;
    if (!kosong) hasil.push(obj);
  }
  return hasil;
}

/**
 * Mencari baris pertama yang cocok dengan kriteria (field = nilai).
 * @returns Objek baris (dengan _baris) atau null.
 */
function cariBaris(sheet, kriteria) {
  const semua = bacaSemua(sheet);
  for (let i = 0; i < semua.length; i++) {
    let cocok = true;
    for (const k in kriteria) {
      if (String(semua[i][k]) !== String(kriteria[k])) {
        cocok = false;
        break;
      }
    }
    if (cocok) return semua[i];
  }
  return null;
}

/** Menambah baris baru ke sheet berdasarkan objek. */
function tambahBaris(sheet, obj) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = header.map(function(kolom) {
    const kunci = String(kolom).trim();
    return obj[kunci] !== undefined ? obj[kunci] : '';
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

/** Memperbarui baris tertentu berdasarkan nomor baris (_baris). */
function perbaruiBaris(sheet, baris, obj) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = header.map(function(kolom) {
    const kunci = String(kolom).trim();
    return obj[kunci] !== undefined ? obj[kunci] : '';
  });
  sheet.getRange(baris, 1, 1, header.length).setValues([row]);
}

/** Menghapus baris tertentu berdasarkan nomor baris. */
function hapusBaris(sheet, baris) {
  sheet.deleteRow(baris);
}

// ============================================================
// UTILITAS CRYPTO & TOKEN
// ============================================================

/** Membuat salt acak (64 karakter hex). */
function buatSalt() {
  const acak = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(Math.random()) + String(Date.now()) + String(Utilities.getUuid()),
    Utilities.Charset.UTF_8
  );
  return bytesKeHex(acak);
}

/** Hash PIN / kata sandi dengan SHA-256 + salt. */
function hashPin(pin, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + String(pin),
    Utilities.Charset.UTF_8
  );
  return bytesKeHex(digest);
}

/** Konversi array byte ke string hex. */
function bytesKeHex(bytes) {
  return bytes.map(function(b) {
    return ('0' + ((b & 0xFF).toString(16))).slice(-2);
  }).join('');
}

/** Membuat token sesi unik. */
function buatToken() {
  return 'tok_' + Utilities.getUuid().replace(/-/g, '');
}

/** Membuat ID unik generik dengan prefix. */
function buatId(prefix) {
  return (prefix || 'id_') + Utilities.getUuid().replace(/-/g, '').substring(0, 12);
}

// ============================================================
// MANAJEMEN SESI
// ============================================================

/**
 * Membuat sesi baru dan menyimpannya di sheet Sesi.
 * @param {string} peran "siswa" atau "guru".
 * @param {string} idPengguna ID siswa atau "guru".
 * @param {string} lkpdId ID LKPD (opsional).
 * @returns {string} Token sesi.
 */
function buatSesi(peran, idPengguna, lkpdId) {
  const sheet = getSheet(KONFIG.SHEET_SESI);
  const token = buatToken();
  const sekarang = new Date();
  const umurMenit = peran === 'guru' ? KONFIG.SESI_GURU_MENIT : KONFIG.SESI_SISWA_MENIT;
  const kedaluwarsa = new Date(sekarang.getTime() + umurMenit * 60000);

  tambahBaris(sheet, {
    'token': token,
    'peran': peran,
    'idPengguna': idPengguna,
    'lkpdId': lkpdId || '',
    'waktuBuat': sekarang.toISOString(),
    'waktuKedaluwarsa': kedaluwarsa.toISOString()
  });

  return token;
}

/**
 * Memvalidasi token dan mengembalikan konteks pengguna.
 * @returns {object} { valid, peran, idPengguna, lkpdId, barisSesi } atau { valid: false, pesan }.
 */
function validasiToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, pesan: 'Token tidak ada.' };
  }
  const sheet = getSheet(KONFIG.SHEET_SESI);
  const baris = cariBaris(sheet, { 'token': token });
  if (!baris) {
    return { valid: false, pesan: 'Token tidak dikenal. Silakan masuk lagi.' };
  }
  const kedaluwarsa = new Date(baris.waktuKedaluwarsa);
  if (kedaluwarsa < new Date()) {
    // Hapus sesi yang sudah kedaluwarsa
    hapusBaris(sheet, baris._baris);
    return { valid: false, pesan: 'Sesi kedaluwarsa. Silakan masuk lagi.' };
  }
  return {
    valid: true,
    peran: baris.peran,
    idPengguna: baris.idPengguna,
    lkpdId: baris.lkpdId,
    barisSesi: baris._baris
  };
}

// ============================================================
// UTILITAS DRIVE (BERKAS)
// ============================================================

/** Mengambil folder utama tempat semua berkas disimpan. */
function getFolderUtamaDrive() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(PROP_ID_FOLDER_UTAMA);
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      // Folder hilang, buat ulang
    }
  }
  return getOrCreateFolderDrive(KONFIG.FOLDER_UTAMA_NAMA, DriveApp.getRootFolder());
}

/**
 * Membuat atau mengambil folder berdasarkan nama di dalam parent.
 */
function getOrCreateFolderDrive(nama, parent) {
  const iterator = parent.getFoldersByName(nama);
  if (iterator.hasNext()) {
    return iterator.next();
  }
  return parent.createFolder(nama);
}

/**
 * Mendapatkan (atau membuat) struktur folder untuk berkas:
 * {FOLDER_UTAMA}/{judulLkpd}/{kelas}/{namaSiswa}
 */
function getFolderUntukBerkas(judulLkpd, kelas, namaSiswa) {
  const root = getFolderUtamaDrive();
  const folder1 = getOrCreateFolderDrive(sanitasiNamaFolder(judulLkpd) || 'Tanpa-Judul', root);
  const folder2 = getOrCreateFolderDrive(sanitasiNamaFolder(kelas) || 'Tanpa-Kelas', folder1);
  const folder3 = getOrCreateFolderDrive(sanitasiNamaFolder(namaSiswa) || 'Tanpa-Nama', folder2);
  return folder3;
}

/** Membersihkan nama folder/file dari karakter ilegal. */
function sanitasiNamaFolder(nama) {
  if (!nama) return '';
  return String(nama)
    .replace(/[\\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}

/**
 * Menyimpan berkas ke Drive. Berkas dibuat private (tidak publik).
 */
function simpanBerkasDrive(folder, namaFile, mime, blob) {
  const file = folder.createFile(blob);
  file.setName(sanitasiNamaFolder(namaFile));
  // Pastikan berkas TIDAK publik (hanya pemilik/script yang bisa akses)
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
  } catch (e) {
    catatLog('PERINGATAN', 'simpanBerkasDrive', 'Tidak bisa setel sharing: ' + e);
  }
  return file;
}

/** Menghapus berkas dari Drive (pindahkan ke sampah). */
function hapusBerkasDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return true;
  } catch (err) {
    catatLog('PERINGATAN', 'hapusBerkasDrive', 'Gagal hapus berkas ' + fileId + ': ' + err);
    return false;
  }
}

// ============================================================
// VALIDASI BERKAS
// ============================================================

/**
 * Mendeteksi tipe MIME berdasarkan magic bytes (signature file),
 * bukan sekadar klaim klien. Mendeteksi JPEG, PNG, dan WebP.
 * @returns {string|null} Tipe MIME terdeteksi, atau null jika tidak dikenali.
 */
function deteksiMimeDariBase64(base64) {
  try {
    const potong = base64.substring(0, Math.min(base64.length, 40));
    const bytes = Utilities.base64Decode(potong);
    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }
    // WebP: RIFF....WEBP
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Memvalidasi berkas yang akan diunggah:
 *  - Hapus prefix data URI jika ada.
 *  - Cek ukuran setelah decode.
 *  - Deteksi tipe dari magic bytes.
 * @returns {object} { ok, mime, ukuran, base64Bersih } atau { ok: false, kode, pesan }.
 */
function validasiBerkas(base64) {
  if (!base64 || typeof base64 !== 'string') {
    return { ok: false, kode: 'VALIDASI_GAGAL', pesan: 'Data berkas kosong.' };
  }
  // Hapus prefix data URI jika ada (contoh: "data:image/jpeg;base64,....")
  let bersih = base64;
  if (bersih.indexOf('data:') === 0) {
    const koma = bersih.indexOf(',');
    if (koma !== -1) bersih = bersih.substring(koma + 1);
  }
  // Hapus whitespace
  bersih = bersih.replace(/\s/g, '');

  // Cek ukuran setelah decode (estimasi: panjang base64 * 3/4)
  const byteLength = Math.floor(bersih.length * 3 / 4);
  if (byteLength > KONFIG.BERKAS_MAKS_BYTE) {
    return {
      ok: false,
      kode: 'BERKAS_TERLALU_BESAR',
      pesan: 'Berkas melebihi batas ' + (KONFIG.BERKAS_MAKS_BYTE / (1024 * 1024)) + ' MB.'
    };
  }
  // Deteksi tipe dari magic bytes
  const mimeNyata = deteksiMimeDariBase64(bersih);
  if (!mimeNyata) {
    return {
      ok: false,
      kode: 'BERKAS_JENIS_TIDAK_DIIZINKAN',
      pesan: 'Tipe berkas tidak dikenali. Hanya JPG, PNG, dan WEBP yang diizinkan.'
    };
  }
  if (KONFIG.MIME_DIIZINKAN.indexOf(mimeNyata) === -1) {
    return {
      ok: false,
      kode: 'BERKAS_JENIS_TIDAK_DIIZINKAN',
      pesan: 'Tipe berkas tidak diizinkan. Hanya JPG, PNG, dan WEBP.'
    };
  }
  return { ok: true, mime: mimeNyata, ukuran: byteLength, base64Bersih: bersih };
}

// ============================================================
// PENGGUNAAN LOCKSERVICE
// ============================================================

/**
 * Menjalankan fungsi di dalam kunci script (LockService) agar aman
 * saat banyak siswa menyimpan secara bersamaan.
 * @returns {object} { sukses: true, data } atau { sukses: false, kode, pesan }.
 */
function jalankanDenganKunci(fungsi) {
  const kunci = LockService.getScriptLock();
  const dapat = kunci.tryLock(10000); // tunggu maksimal 10 detik
  if (!dapat) {
    return {
      sukses: false,
      kode: 'KUNCI_TIDAK_TERSEDIA',
      pesan: 'Server sedang sibuk. Coba lagi sebentar.'
    };
  }
  try {
    const hasil = fungsi();
    return { sukses: true, data: hasil };
  } finally {
    kunci.releaseLock();
  }
}

// ============================================================
// LOGGING
// ============================================================

/** Mencatat pesan ke sheet Log (dibatasi 5000 baris terakhir). */
function catatLog(level, sumber, pesan) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(KONFIG.SHEET_LOG);
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), level, sumber, String(pesan).substring(0, 500)]);
    if (sheet.getLastRow() > 5000) {
      sheet.deleteRow(2); // hapus baris terlama (setelah header)
    }
  } catch (err) {
    // Abaikan error logging agar tidak mengganggu alur utama
  }
}

// ============================================================
// PENGIRIM RESPONS
// ============================================================

/** Mengirim respons sukses dengan format JSON seragam. */
function kirimSukses(data, kode) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, kode: kode || 'OK', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Mengirim respons gagal dengan format JSON seragam. */
function kirimGagal(kode, pesan) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, kode: kode, data: { pesan: pesan } }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// VALIDASI UMUM & PENGATURAN
// ============================================================

/** Validasi nama siswa (2–60 karakter). */
function validasiNama(nama) {
  if (!nama || typeof nama !== 'string') return false;
  const trimmed = nama.trim();
  return trimmed.length >= 2 && trimmed.length <= 60;
}

/** Validasi format PIN (4–6 angka). */
function validasiPinFormat(pin) {
  if (!pin) return false;
  return /^\d{4,6}$/.test(String(pin));
}

/** Membaca seluruh pengaturan sebagai objek { kunci: nilai }. */
function bacaPengaturan() {
  const sheet = getSheet(KONFIG.SHEET_PENGATURAN);
  const semua = bacaSemua(sheet);
  const obj = {};
  for (let i = 0; i < semua.length; i++) {
    obj[semua[i].kunci] = semua[i].nilai;
  }
  return obj;
}

/** Menyimpan satu pasangan pengaturan (kunci = nilai). */
function simpanPengaturanKV(kunci, nilai) {
  const sheet = getSheet(KONFIG.SHEET_PENGATURAN);
  const baris = cariBaris(sheet, { 'kunci': kunci });
  if (baris) {
    perbaruiBaris(sheet, baris._baris, { 'kunci': kunci, 'nilai': nilai, 'catatan': baris.catatan || '' });
  } else {
    tambahBaris(sheet, { 'kunci': kunci, 'nilai': nilai, 'catatan': '' });
  }
}

/** Mengambil judul LKPD berdasarkan ID (untuk penamaan folder Drive). */
function getJudulLkpd(lkpdId) {
  const pengaturan = bacaPengaturan();
  // Coba ambil dari info LKPD spesifik
  const infoStr = pengaturan['infoLkpd_' + lkpdId];
  if (infoStr) {
    try {
      const info = JSON.parse(infoStr);
      if (info.judul) return info.judul;
    } catch (e) { /* abaikan */ }
  }
  return pengaturan.lkpdJudul || lkpdId || 'LKPD';
}

// ============================================================
// AKSI SISWA
// ============================================================

/**
 * cekSiswa: memeriksa apakah siswa sudah terdaftar dan punya PIN.
 * Jika belum terdaftar, membuat record siswa baru (tanpa PIN).
 *
 * Input : { aksi: "cekSiswa", kelas, nama }
 * Output: { status: "buat_pin" | "perlu_pin", siswaId, nama }
 */
function aksiCekSiswa(payload) {
  const kelas = payload.kelas;
  const nama = (payload.nama || '').trim();

  if (!kelas || !validasiNama(nama)) {
    return kirimGagal('VALIDASI_GAGAL', 'Kelas dan nama lengkap wajib diisi dengan benar.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheet = getSheet(KONFIG.SHEET_SISWA);
    const siswa = cariBaris(sheet, { 'kelas': kelas, 'nama': nama });

    if (siswa) {
      // Cek apakah sudah punya PIN
      if (siswa.hashPin && siswa.salt) {
        return { status: 'perlu_pin', siswaId: siswa.id, nama: siswa.nama };
      } else {
        return { status: 'buat_pin', siswaId: siswa.id, nama: siswa.nama };
      }
    }

    // Siswa belum terdaftar — buat record baru (tanpa PIN)
    const idBaru = buatId('sw_');
    const sekarang = new Date().toISOString();
    tambahBaris(sheet, {
      'id': idBaru,
      'kelas': kelas,
      'nama': nama,
      'hashPin': '',
      'salt': '',
      'statusReset': '',
      'percobaanGagal': 0,
      'waktuKunci': '',
      'dibuatPada': sekarang
    });
    catatLog('INFO', 'cekSiswa', 'Siswa baru: ' + idBaru + ' (' + kelas + '/' + nama + ')');
    return { status: 'buat_pin', siswaId: idBaru, nama: nama };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  return kirimSukses(hasil.data);
}

/**
 * buatPin: membuat PIN baru untuk siswa pertama kali (dengan konfirmasi).
 *
 * Input : { aksi: "buatPin", siswaId, pin, konfirmasiPin }
 * Output: { token, peran }
 */
function aksiBuatPin(payload) {
  const siswaId = payload.siswaId;
  const pin = String(payload.pin || '');
  const konfirmasi = String(payload.konfirmasiPin || '');

  if (!siswaId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID siswa hilang. Silakan mulai dari awal.');
  }
  if (!validasiPinFormat(pin)) {
    return kirimGagal('VALIDASI_GAGAL', 'PIN harus terdiri dari 4–6 angka.');
  }
  if (pin !== konfirmasi) {
    return kirimGagal('VALIDASI_GAGAL', 'PIN dan konfirmasi PIN tidak cocok.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheet = getSheet(KONFIG.SHEET_SISWA);
    const siswa = cariBaris(sheet, { 'id': siswaId });
    if (!siswa) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Siswa tidak ditemukan.' };
    }
    if (siswa.hashPin && siswa.salt) {
      return { _gagal: true, kode: 'PIN_SUDAH_ADA', pesan: 'PIN sudah pernah dibuat. Silakan masuk dengan PIN Anda.' };
    }
    const salt = buatSalt();
    const hash = hashPin(pin, salt);
    perbaruiBaris(sheet, siswa._baris, {
      'id': siswa.id,
      'kelas': siswa.kelas,
      'nama': siswa.nama,
      'hashPin': hash,
      'salt': salt,
      'statusReset': '',
      'percobaanGagal': 0,
      'waktuKunci': '',
      'dibuatPada': siswa.dibuatPada
    });
    catatLog('INFO', 'buatPin', 'PIN dibuat untuk siswa ' + siswaId);
    return { ok: true };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);

  // Buat sesi siswa
  const token = buatSesi('siswa', siswaId, '');
  return kirimSukses({ token: token, peran: 'siswa' });
}

/**
 * masukSiswa: verifikasi PIN untuk siswa yang sudah punya PIN.
 * Menerapkan batas percobaan salah (5 kali) lalu kunci 5 menit.
 *
 * Input : { aksi: "masukSiswa", siswaId, pin }
 * Output: { token, peran }
 */
function aksiMasukSiswa(payload) {
  const siswaId = payload.siswaId;
  const pin = String(payload.pin || '');

  if (!siswaId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID siswa hilang. Silakan mulai dari awal.');
  }
  if (!validasiPinFormat(pin)) {
    return kirimGagal('VALIDASI_GAGAL', 'PIN harus terdiri dari 4–6 angka.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheet = getSheet(KONFIG.SHEET_SISWA);
    const siswa = cariBaris(sheet, { 'id': siswaId });
    if (!siswa) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Siswa tidak ditemukan.' };
    }
    if (!siswa.hashPin || !siswa.salt) {
      return { _gagal: true, kode: 'PIN_BELUM_DIBUAT', pesan: 'PIN belum dibuat. Silakan buat PIN terlebih dahulu.' };
    }

    // Cek kunci sementara karena terlalu banyak percobaan salah
    if (siswa.waktuKunci) {
      const waktuKunci = new Date(siswa.waktuKunci);
      if (waktuKunci > new Date()) {
        const sisaMenit = Math.ceil((waktuKunci - new Date()) / 60000);
        return { _gagal: true, kode: 'PIN_TERKUNCI', pesan: 'Akun terkunci sementara karena salah PIN berulang. Coba lagi dalam ' + sisaMenit + ' menit.' };
      } else {
        // Masa kunci sudah lewat, reset percobaan
        perbaruiBaris(sheet, siswa._baris, {
          'percobaanGagal': 0,
          'waktuKunci': ''
        });
      }
    }

    // Verifikasi PIN
    const hashInput = hashPin(pin, siswa.salt);
    if (hashInput !== siswa.hashPin) {
      // Ambil percobaan terbaru
      const siswaBaru = cariBaris(sheet, { 'id': siswaId });
      const percobaan = Number(siswaBaru.percobaanGagal || 0) + 1;
      if (percobaan >= KONFIG.PERCOBAAN_PIN_MAKS) {
        const waktuBuka = new Date(Date.now() + KONFIG.MENIT_KUNCI * 60000).toISOString();
        perbaruiBaris(sheet, siswaBaru._baris, {
          'percobaanGagal': percobaan,
          'waktuKunci': waktuBuka
        });
        catatLog('PERINGATAN', 'masukSiswa', 'Siswa ' + siswaId + ' terkunci setelah ' + percobaan + ' kali salah.');
        return { _gagal: true, kode: 'PIN_TERKUNCI', pesan: 'PIN salah ' + percobaan + ' kali. Akun terkunci ' + KONFIG.MENIT_KUNCI + ' menit.' };
      } else {
        perbaruiBaris(sheet, siswaBaru._baris, {
          'percobaanGagal': percobaan
        });
        const sisa = KONFIG.PERCOBAAN_PIN_MAKS - percobaan;
        return { _gagal: true, kode: 'PIN_TIDAK_COCOK', pesan: 'PIN salah. Sisa percobaan: ' + sisa + '.' };
      }
    }

    // PIN benar — reset percobaan gagal
    perbaruiBaris(sheet, siswa._baris, {
      'percobaanGagal': 0,
      'waktuKunci': ''
    });
    return { ok: true };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);

  const token = buatSesi('siswa', siswaId, '');
  return kirimSukses({ token: token, peran: 'siswa' });
}

/**
 * muatPekerjaan: memuat atau membuat pengerjaan untuk siswa pada LKPD tertentu.
 * Mengembalikan jawaban, daftar berkas (metadata), dan nilai (jika diizinkan).
 *
 * Input : { aksi: "muatPekerjaan", token, lkpdId }
 * Output: { pengerjaanId, status, waktuMulai, waktuKumpul, revisiDibuka,
 *           jawaban: {...}, berkas: [...], nilai: {...}, tampilkanNilai }
 */
function aksiMuatPekerjaan(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const lkpdId = payload.lkpdId;
  if (!lkpdId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID LKPD wajib diisi.');
  }

  // Cek akses dibuka/ditutup
  const pengaturan = bacaPengaturan();
  if (pengaturan.aksesBuka === 'false' || pengaturan.aksesBuka === false) {
    return kirimGagal('AKSES_DITUTUP', 'Akses LKPD sedang ditutup oleh guru.');
  }

  const siswaId = konteks.idPengguna;

  const hasil = jalankanDenganKunci(function() {
    const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
    let pengerjaan = cariBaris(sheetPen, { 'siswaId': siswaId, 'lkpdId': lkpdId });

    if (!pengerjaan) {
      // Buat pengerjaan baru
      const idBaru = buatId('pk_');
      const sekarang = new Date().toISOString();
      tambahBaris(sheetPen, {
        'id': idBaru,
        'siswaId': siswaId,
        'lkpdId': lkpdId,
        'status': 'sedang',
        'waktuMulai': sekarang,
        'waktuKumpul': '',
        'revisiDibuka': ''
      });
      return {
        pengerjaanId: idBaru,
        status: 'sedang',
        waktuMulai: sekarang,
        waktuKumpul: '',
        revisiDibuka: ''
      };
    }

    return {
      pengerjaanId: pengerjaan.id,
      status: pengerjaan.status,
      waktuMulai: pengerjaan.waktuMulai,
      waktuKumpul: pengerjaan.waktuKumpul,
      revisiDibuka: pengerjaan.revisiDibuka
    };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  const pen = hasil.data;
  const pengerjaanId = pen.pengerjaanId;

  // Baca jawaban
  const sheetJawaban = getSheet(KONFIG.SHEET_JAWABAN);
  const semuaJawaban = bacaSemua(sheetJawaban);
  const jawabanObj = {};
  for (let i = 0; i < semuaJawaban.length; i++) {
    if (semuaJawaban[i].pengerjaanId === pengerjaanId) {
      let dataParsed = null;
      try { dataParsed = JSON.parse(semuaJawaban[i].data); } catch (e) { dataParsed = null; }
      jawabanObj[semuaJawaban[i].idSoal] = {
        teks: semuaJawaban[i].teks,
        data: dataParsed,
        waktuUbah: semuaJawaban[i].waktuUbah
      };
    }
  }

  // Baca daftar berkas (metadata saja, bukan data file)
  const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
  const semuaBerkas = bacaSemua(sheetBerkas);
  const berkasArr = [];
  for (let i = 0; i < semuaBerkas.length; i++) {
    if (semuaBerkas[i].pengerjaanId === pengerjaanId) {
      berkasArr.push({
        id: semuaBerkas[i].id,
        idSoal: semuaBerkas[i].idSoal,
        jenis: semuaBerkas[i].jenis,
        nama: semuaBerkas[i].nama,
        ukuran: semuaBerkas[i].ukuran,
        mime: semuaBerkas[i].mime,
        waktu: semuaBerkas[i].waktu
      });
    }
  }

  // Baca nilai (hanya jika sudah dikumpulkan/dinilai DAN guru mengizinkan tampil)
  let tampilkanNilai = false;
  const nilaiObj = {};
  if (pen.status === 'terkumpul' || pen.status === 'dinilai') {
    tampilkanNilai = pengaturan.tampilkanNilaiSiswa === 'true' || pengaturan.tampilkanNilaiSiswa === true;
    if (tampilkanNilai) {
      const sheetNilai = getSheet(KONFIG.SHEET_NILAI);
      const semuaNilai = bacaSemua(sheetNilai);
      for (let i = 0; i < semuaNilai.length; i++) {
        if (semuaNilai[i].pengerjaanId === pengerjaanId) {
          nilaiObj[semuaNilai[i].idSoal] = {
            skor: semuaNilai[i].skor,
            komentar: semuaNilai[i].komentar
          };
        }
      }
    }
  }

  return kirimSukses({
    pengerjaanId: pengerjaanId,
    status: pen.status,
    waktuMulai: pen.waktuMulai,
    waktuKumpul: pen.waktuKumpul,
    revisiDibuka: pen.revisiDibuka,
    jawaban: jawabanObj,
    berkas: berkasArr,
    nilai: nilaiObj,
    tampilkanNilai: tampilkanNilai
  });
}

/**
 * simpanJawaban: menyimpan kelompok jawaban yang berubah.
 *
 * Input : { aksi: "simpanJawaban", token, pengerjaanId, jawaban: [{ idSoal, teks, data }] }
 * Output: { tersimpan: jumlah }
 */
function aksiSimpanJawaban(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const jawabanArr = payload.jawaban || [];

  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }
  if (!Array.isArray(jawabanArr)) {
    return kirimGagal('VALIDASI_GAGAL', 'Field "jawaban" harus berupa array.');
  }

  // Validasi kepemilikan & status (di luar kunci agar pesan cepat)
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }
  if (pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }
  // Tolak jika sudah terkumpul dan revisi belum dibuka
  if (pengerjaan.status === 'terkumpul' || pengerjaan.status === 'dinilai') {
    if (pengerjaan.revisiDibuka !== 'true' && pengerjaan.revisiDibuka !== true) {
      return kirimGagal('PENGERJAAN_DIKUNCI', 'Pekerjaan sudah dikumpulkan dan terkunci. Minta guru membuka revisi untuk mengubah.');
    }
  }

  // Cek tenggat
  const pengaturan = bacaPengaturan();
  if (pengaturan.tenggat) {
    const tenggat = new Date(pengaturan.tenggat);
    if (!isNaN(tenggat.getTime()) && tenggat < new Date() && pengerjaan.status === 'sedang') {
      return kirimGagal('TENGGAT_LEWAT', 'Tenggat pengumpulan sudah lewat.');
    }
  }

  const hasil = jalankanDenganKunci(function() {
    const sheetJawaban = getSheet(KONFIG.SHEET_JAWABAN);
    const sekarang = new Date().toISOString();
    let jumlah = 0;

    for (let i = 0; i < jawabanArr.length; i++) {
      const j = jawabanArr[i];
      if (!j.idSoal) continue;
      const teks = j.teks || '';
      const dataStr = j.data ? JSON.stringify(j.data) : '';

      // Cari baris jawaban yang sudah ada
      const semua = bacaSemua(sheetJawaban);
      let ditemukan = null;
      for (let k = 0; k < semua.length; k++) {
        if (semua[k].pengerjaanId === pengerjaanId && semua[k].idSoal === j.idSoal) {
          ditemukan = semua[k];
          break;
        }
      }
      if (ditemukan) {
        perbaruiBaris(sheetJawaban, ditemukan._baris, {
          'pengerjaanId': pengerjaanId,
          'idSoal': j.idSoal,
          'teks': teks,
          'data': dataStr,
          'waktuUbah': sekarang
        });
      } else {
        tambahBaris(sheetJawaban, {
          'pengerjaanId': pengerjaanId,
          'idSoal': j.idSoal,
          'teks': teks,
          'data': dataStr,
          'waktuUbah': sekarang
        });
      }
      jumlah++;
    }
    return { tersimpan: jumlah };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  return kirimSukses(hasil.data);
}

/**
 * unggahBerkas: mengunggah satu berkas gambar/foto ke Drive.
 * Memvalidasi: tipe (magic bytes), ukuran (maks 2,5 MB), dan jumlah per soal (maks 5).
 *
 * Input : { aksi: "unggahBerkas", token, pengerjaanId, idSoal, jenis, nama, dataBase64 }
 * Output: { berkasId, nama, ukuran, mime, waktu }
 */
function aksiUnggahBerkas(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const idSoal = payload.idSoal;
  const jenis = payload.jenis || 'foto'; // "foto" atau "gambar"
  const namaFile = payload.nama || ('berkas_' + Date.now());
  const base64 = payload.dataBase64;

  if (!pengerjaanId || !idSoal || !base64) {
    return kirimGagal('VALIDASI_GAGAL', 'Data berkas tidak lengkap.');
  }

  // Validasi kepemilikan & status
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }
  if (pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }
  if (pengerjaan.status === 'terkumpul' || pengerjaan.status === 'dinilai') {
    if (pengerjaan.revisiDibuka !== 'true' && pengerjaan.revisiDibuka !== true) {
      return kirimGagal('PENGERJAAN_DIKUNCI', 'Pekerjaan sudah dikumpulkan dan terkunci.');
    }
  }

  // Validasi berkas (tipe, ukuran)
  const validasi = validasiBerkas(base64);
  if (!validasi.ok) {
    return kirimGagal(validasi.kode, validasi.pesan);
  }

  const hasil = jalankanDenganKunci(function() {
    // Cek jumlah berkas per soal
    const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
    const semua = bacaSemua(sheetBerkas);
    let jumlahSoal = 0;
    for (let i = 0; i < semua.length; i++) {
      if (semua[i].pengerjaanId === pengerjaanId && semua[i].idSoal === idSoal) {
        jumlahSoal++;
      }
    }
    if (jumlahSoal >= KONFIG.BERKAS_MAKS_PER_SOAL) {
      return { _gagal: true, kode: 'BERKAS_MELEBIHI_BATAS', pesan: 'Maksimal ' + KONFIG.BERKAS_MAKS_PER_SOAL + ' berkas per soal.' };
    }

    // Ambil info siswa & judul LKPD untuk struktur folder Drive
    const sheetSiswa = getSheet(KONFIG.SHEET_SISWA);
    const siswa = cariBaris(sheetSiswa, { 'id': pengerjaan.siswaId });
    const judulLkpd = getJudulLkpd(pengerjaan.lkpdId);

    const folder = getFolderUntukBerkas(
      judulLkpd,
      siswa ? siswa.kelas : 'Kelas',
      siswa ? siswa.nama : 'Siswa'
    );

    // Simpan file ke Drive
    const blob = Utilities.newBlob(
      Utilities.base64Decode(validasi.base64Bersih),
      validasi.mime,
      namaFile
    );
    const file = simpanBerkasDrive(folder, namaFile, validasi.mime, blob);

    // Catat di sheet Berkas
    const idBerkas = buatId('br_');
    const sekarang = new Date().toISOString();
    tambahBaris(sheetBerkas, {
      'id': idBerkas,
      'pengerjaanId': pengerjaanId,
      'idSoal': idSoal,
      'jenis': jenis,
      'fileId': file.getId(),
      'nama': file.getName(),
      'ukuran': validasi.ukuran,
      'mime': validasi.mime,
      'waktu': sekarang
    });

    return {
      berkasId: idBerkas,
      nama: file.getName(),
      ukuran: validasi.ukuran,
      mime: validasi.mime,
      waktu: sekarang
    };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);
  return kirimSukses(hasil.data);
}

/**
 * hapusBerkas: menghapus berkas milik siswa (dari Drive dan sheet).
 *
 * Input : { aksi: "hapusBerkas", token, pengerjaanId, berkasId }
 * Output: { terhapus: true }
 */
function aksiHapusBerkas(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const berkasId = payload.berkasId;

  if (!pengerjaanId || !berkasId) {
    return kirimGagal('VALIDASI_GAGAL', 'Data tidak lengkap.');
  }

  // Validasi kepemilikan & status
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }
  if (pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }
  if (pengerjaan.status === 'terkumpul' || pengerjaan.status === 'dinilai') {
    if (pengerjaan.revisiDibuka !== 'true' && pengerjaan.revisiDibuka !== true) {
      return kirimGagal('PENGERJAAN_DIKUNCI', 'Pekerjaan sudah dikumpulkan dan terkunci.');
    }
  }

  const hasil = jalankanDenganKunci(function() {
    const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
    const berkas = cariBaris(sheetBerkas, { 'id': berkasId, 'pengerjaanId': pengerjaanId });
    if (!berkas) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Berkas tidak ditemukan.' };
    }
    hapusBerkasDrive(berkas.fileId);
    hapusBaris(sheetBerkas, berkas._baris);
    return { terhapus: true };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);
  return kirimSukses(hasil.data);
}

/**
 * ambilBerkas: mengambil data berkas milik siswa (sebagai base64).
 * Hanya pemilik yang boleh mengambil.
 *
 * Input : { aksi: "ambilBerkas", token, pengerjaanId, berkasId }
 * Output: { berkasId, nama, mime, dataBase64 }
 */
function aksiAmbilBerkas(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const berkasId = payload.berkasId;

  if (!pengerjaanId || !berkasId) {
    return kirimGagal('VALIDASI_GAGAL', 'Data tidak lengkap.');
  }

  // Validasi kepemilikan
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan || pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }

  const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
  const berkas = cariBaris(sheetBerkas, { 'id': berkasId, 'pengerjaanId': pengerjaanId });
  if (!berkas) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Berkas tidak ditemukan.');
  }

  try {
    const file = DriveApp.getFileById(berkas.fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64 = Utilities.base64Encode(bytes);
    return kirimSukses({
      berkasId: berkasId,
      nama: berkas.nama,
      mime: berkas.mime,
      dataBase64: base64
    });
  } catch (err) {
    catatLog('ERROR', 'ambilBerkas', err.toString());
    return kirimGagal('KESALAHAN_SERVER', 'Gagal membaca berkas dari Drive.');
  }
}

/**
 * kumpulkan: mengunci pengerjaan siswa (status -> "terkumpul").
 * Pemeriksaan soal wajib & kosong dilakukan di sisi klien (Tahap 2).
 *
 * Input : { aksi: "kumpulkan", token, pengerjaanId }
 * Output: { status: "terkumpul", waktuKumpul }
 */
function aksiKumpulkan(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }

  // Validasi kepemilikan
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }
  if (pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }

  // Cek tenggat
  const pengaturan = bacaPengaturan();
  if (pengaturan.tenggat) {
    const tenggat = new Date(pengaturan.tenggat);
    if (!isNaN(tenggat.getTime()) && tenggat < new Date()) {
      return kirimGagal('TENGGAT_LEWAT', 'Tenggat pengumpulan sudah lewat.');
    }
  }

  const hasil = jalankanDenganKunci(function() {
    // Refresh data pengerjaan (mungkin berubah)
    const sheet = getSheet(KONFIG.SHEET_PENGERJAAN);
    const pen = cariBaris(sheet, { 'id': pengerjaanId });
    if (!pen) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Pengerjaan tidak ditemukan.' };
    }
    if (pen.status === 'terkumpul' || pen.status === 'dinilai') {
      if (pen.revisiDibuka === 'true' || pen.revisiDibuka === true) {
        // Revisi dibuka guru — izinkan kumpulkan ulang
      } else {
        return { _gagal: true, kode: 'PENGERJAAN_DIKUNCI', pesan: 'Pekerjaan sudah dikumpulkan.' };
      }
    }
    const sekarang = new Date().toISOString();
    perbaruiBaris(sheet, pen._baris, {
      'id': pen.id,
      'siswaId': pen.siswaId,
      'lkpdId': pen.lkpdId,
      'status': 'terkumpul',
      'waktuMulai': pen.waktuMulai,
      'waktuKumpul': sekarang,
      'revisiDibuka': ''
    });
    catatLog('INFO', 'kumpulkan', 'Pengerjaan ' + pengerjaanId + ' dikumpulkan.');
    return { status: 'terkumpul', waktuKumpul: sekarang };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);
  return kirimSukses(hasil.data);
}

/**
 * lihatNilaiSaya: siswa melihat nilai dan komentar (hanya miliknya sendiri).
 * Hanya tersedia jika guru mengaktifkan tampilan nilai.
 *
 * Input : { aksi: "lihatNilaiSaya", token, pengerjaanId }
 * Output: { nilai: {...}, skorTotal, tampilkanNilai }
 */
function aksiLihatNilaiSaya(payload, konteks) {
  if (konteks.peran !== 'siswa') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk siswa.');
  }
  const pengerjaanId = payload.pengerjaanId;
  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }

  // Validasi kepemilikan
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan || pengerjaan.siswaId !== konteks.idPengguna) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Anda tidak boleh mengakses pengerjaan ini.');
  }

  const pengaturan = bacaPengaturan();
  const tampilkan = pengaturan.tampilkanNilaiSiswa === 'true' || pengaturan.tampilkanNilaiSiswa === true;
  if (!tampilkan) {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Penilaian belum tersedia untuk dilihat.');
  }

  const sheetNilai = getSheet(KONFIG.SHEET_NILAI);
  const semuaNilai = bacaSemua(sheetNilai);
  const nilaiObj = {};
  let skorTotal = 0;
  let adaNilai = false;
  for (let i = 0; i < semuaNilai.length; i++) {
    if (semuaNilai[i].pengerjaanId === pengerjaanId) {
      nilaiObj[semuaNilai[i].idSoal] = {
        skor: semuaNilai[i].skor,
        komentar: semuaNilai[i].komentar
      };
      const skor = Number(semuaNilai[i].skor);
      if (!isNaN(skor)) {
        skorTotal += skor;
        adaNilai = true;
      }
    }
  }

  return kirimSukses({
    nilai: nilaiObj,
    skorTotal: adaNilai ? skorTotal : null,
    tampilkanNilai: true
  });
}

// ============================================================
// AKSI GURU
// ============================================================

/**
 * masukGuru: verifikasi kata sandi guru (hash di Script Properties).
 *
 * Input : { aksi: "masukGuru", kataSandi }
 * Output: { token, peran: "guru" }
 */
function aksiMasukGuru(payload) {
  const kataSandi = String(payload.kataSandi || '');
  if (!kataSandi) {
    return kirimGagal('VALIDASI_GAGAL', 'Kata sandi wajib diisi.');
  }

  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty(PROP_KATA_SANDI_GURU_SALT);
  const hash = props.getProperty(PROP_KATA_SANDI_GURU_HASH);

  if (!salt || !hash) {
    return kirimGagal('KESALAHAN_SERVER', 'Kata sandi guru belum diatur. Jalankan setup() lalu gantiKataSandiGuru().');
  }

  const hashInput = hashPin(kataSandi, salt);
  if (hashInput !== hash) {
    catatLog('PERINGATAN', 'masukGuru', 'Percobaan login guru gagal.');
    return kirimGagal('KREDENSIAL_SALAH', 'Kata sandi salah.');
  }

  const token = buatSesi('guru', 'guru', '');
  catatLog('INFO', 'masukGuru', 'Guru berhasil masuk.');
  return kirimSukses({ token: token, peran: 'guru' });
}

/**
 * daftarSiswa: daftar siswa per kelas dengan status pengerjaan.
 *
 * Input : { aksi: "daftarSiswa", token, kelas, lkpdId }
 * Output: { siswa: [{ id, nama, kelas, status, waktuKumpul, pengerjaanId, jumlahFoto }], lkpdId }
 */
function aksiDaftarSiswa(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const kelasFilter = payload.kelas || '';
  const lkpdId = payload.lkpdId || bacaPengaturan().lkpdAktifId || '';

  const sheetSiswa = getSheet(KONFIG.SHEET_SISWA);
  const semuaSiswa = bacaSemua(sheetSiswa);
  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const semuaPen = bacaSemua(sheetPen);
  const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
  const semuaBerkas = bacaSemua(sheetBerkas);

  const hasil = [];
  for (let i = 0; i < semuaSiswa.length; i++) {
    const s = semuaSiswa[i];
    if (kelasFilter && s.kelas !== kelasFilter) continue;
    if (!s.hashPin) continue; // lewati siswa yang belum membuat PIN

    // Cari pengerjaan untuk LKPD ini
    let pen = null;
    for (let k = 0; k < semuaPen.length; k++) {
      if (semuaPen[k].siswaId === s.id && semuaPen[k].lkpdId === lkpdId) {
        pen = semuaPen[k];
        break;
      }
    }
    // Hitung jumlah berkas
    let jumlahFoto = 0;
    if (pen) {
      for (let m = 0; m < semuaBerkas.length; m++) {
        if (semuaBerkas[m].pengerjaanId === pen.id) jumlahFoto++;
      }
    }

    hasil.push({
      id: s.id,
      nama: s.nama,
      kelas: s.kelas,
      statusReset: s.statusReset || '',
      status: pen ? pen.status : 'belum',
      waktuKumpul: pen ? pen.waktuKumpul : '',
      pengerjaanId: pen ? pen.id : '',
      jumlahFoto: jumlahFoto
    });
  }

  // Urutkan berdasarkan nama
  hasil.sort(function(a, b) {
    return String(a.nama).localeCompare(String(b.nama));
  });

  return kirimSukses({ siswa: hasil, lkpdId: lkpdId });
}

/**
 * lihatPekerjaan: guru melihat pekerjaan satu siswa lengkap.
 *
 * Input : { aksi: "lihatPekerjaan", token, pengerjaanId }
 * Output: { siswa, pengerjaan, jawaban, berkas, nilai }
 */
function aksiLihatPekerjaan(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const pengerjaanId = payload.pengerjaanId;
  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }

  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }

  const sheetSiswa = getSheet(KONFIG.SHEET_SISWA);
  const siswa = cariBaris(sheetSiswa, { 'id': pengerjaan.siswaId });

  // Baca jawaban
  const sheetJawaban = getSheet(KONFIG.SHEET_JAWABAN);
  const semuaJawaban = bacaSemua(sheetJawaban);
  const jawabanObj = {};
  for (let i = 0; i < semuaJawaban.length; i++) {
    if (semuaJawaban[i].pengerjaanId === pengerjaanId) {
      let dataParsed = null;
      try { dataParsed = JSON.parse(semuaJawaban[i].data); } catch (e) { dataParsed = null; }
      jawabanObj[semuaJawaban[i].idSoal] = {
        teks: semuaJawaban[i].teks,
        data: dataParsed,
        waktuUbah: semuaJawaban[i].waktuUbah
      };
    }
  }

  // Baca berkas (metadata)
  const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
  const semuaBerkas = bacaSemua(sheetBerkas);
  const berkasArr = [];
  for (let i = 0; i < semuaBerkas.length; i++) {
    if (semuaBerkas[i].pengerjaanId === pengerjaanId) {
      berkasArr.push({
        id: semuaBerkas[i].id,
        idSoal: semuaBerkas[i].idSoal,
        jenis: semuaBerkas[i].jenis,
        nama: semuaBerkas[i].nama,
        ukuran: semuaBerkas[i].ukuran,
        mime: semuaBerkas[i].mime,
        waktu: semuaBerkas[i].waktu
      });
    }
  }

  // Baca nilai
  const sheetNilai = getSheet(KONFIG.SHEET_NILAI);
  const semuaNilai = bacaSemua(sheetNilai);
  const nilaiObj = {};
  for (let i = 0; i < semuaNilai.length; i++) {
    if (semuaNilai[i].pengerjaanId === pengerjaanId) {
      nilaiObj[semuaNilai[i].idSoal] = {
        skor: semuaNilai[i].skor,
        komentar: semuaNilai[i].komentar
      };
    }
  }

  return kirimSukses({
    siswa: siswa ? { id: siswa.id, nama: siswa.nama, kelas: siswa.kelas } : null,
    pengerjaan: {
      id: pengerjaan.id,
      lkpdId: pengerjaan.lkpdId,
      status: pengerjaan.status,
      waktuMulai: pengerjaan.waktuMulai,
      waktuKumpul: pengerjaan.waktuKumpul,
      revisiDibuka: pengerjaan.revisiDibuka
    },
    jawaban: jawabanObj,
    berkas: berkasArr,
    nilai: nilaiObj
  });
}

/**
 * resetPin: guru mereset PIN siswa (siswa harus membuat PIN baru saat masuk).
 *
 * Input : { aksi: "resetPin", token, siswaId }
 * Output: { tereset: true }
 */
function aksiResetPin(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const siswaId = payload.siswaId;
  if (!siswaId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID siswa wajib diisi.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheet = getSheet(KONFIG.SHEET_SISWA);
    const siswa = cariBaris(sheet, { 'id': siswaId });
    if (!siswa) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Siswa tidak ditemukan.' };
    }
    perbaruiBaris(sheet, siswa._baris, {
      'id': siswa.id,
      'kelas': siswa.kelas,
      'nama': siswa.nama,
      'hashPin': '',
      'salt': '',
      'statusReset': 'perlu_buat_pin',
      'percobaanGagal': 0,
      'waktuKunci': '',
      'dibuatPada': siswa.dibuatPada
    });
    // Hapus semua sesi siswa ini agar harus login ulang
    const sheetSesi = getSheet(KONFIG.SHEET_SESI);
    const semuaSesi = bacaSemua(sheetSesi);
    for (let i = semuaSesi.length - 1; i >= 0; i--) {
      if (semuaSesi[i].idPengguna === siswaId) {
        hapusBaris(sheetSesi, semuaSesi[i]._baris);
      }
    }
    catatLog('INFO', 'resetPin', 'PIN siswa ' + siswaId + ' direset oleh guru.');
    return { tereset: true };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);
  return kirimSukses(hasil.data);
}

/**
 * bukaRevisi: guru membuka/menutup revisi (siswa bisa/kembali tidak bisa edit).
 *
 * Input : { aksi: "bukaRevisi", token, pengerjaanId, buka }
 * Output: { status, revisiDibuka }
 */
function aksiBukaRevisi(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const buka = payload.buka !== false; // default true jika tidak disebut

  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheet = getSheet(KONFIG.SHEET_PENGERJAAN);
    const pen = cariBaris(sheet, { 'id': pengerjaanId });
    if (!pen) {
      return { _gagal: true, kode: 'TIDAK_DITEMUKAN', pesan: 'Pengerjaan tidak ditemukan.' };
    }
    // Jika dibuka: status kembali "sedang" dan revisiDibuka=true
    // Jika ditutup: status kembali "terkumpul" dan revisiDibuka kosong
    const statusBaru = buka ? 'sedang' : 'terkumpul';
    perbaruiBaris(sheet, pen._baris, {
      'id': pen.id,
      'siswaId': pen.siswaId,
      'lkpdId': pen.lkpdId,
      'status': statusBaru,
      'waktuMulai': pen.waktuMulai,
      'waktuKumpul': pen.waktuKumpul,
      'revisiDibuka': buka ? 'true' : ''
    });
    catatLog('INFO', 'bukaRevisi', 'Revisi pengerjaan ' + pengerjaanId + (buka ? ' dibuka' : ' ditutup') + '.');
    return { status: statusBaru, revisiDibuka: buka ? 'true' : '' };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  if (hasil.data._gagal) return kirimGagal(hasil.data.kode, hasil.data.pesan);
  return kirimSukses(hasil.data);
}

/**
 * beriNilai: guru memberi nilai dan komentar per soal.
 * Status pengerjaan berubah menjadi "dinilai".
 *
 * Input : { aksi: "beriNilai", token, pengerjaanId, nilai: [{ idSoal, skor, komentar }] }
 * Output: { tersimpan: jumlah, status: "dinilai" }
 */
function aksiBeriNilai(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const pengerjaanId = payload.pengerjaanId;
  const nilaiArr = payload.nilai || [];

  if (!pengerjaanId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID pengerjaan wajib diisi.');
  }

  const sheetPen = getSheet(KONFIG.SHEET_PENGERJAAN);
  const pengerjaan = cariBaris(sheetPen, { 'id': pengerjaanId });
  if (!pengerjaan) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Pengerjaan tidak ditemukan.');
  }

  const hasil = jalankanDenganKunci(function() {
    const sheetNilai = getSheet(KONFIG.SHEET_NILAI);
    const sekarang = new Date().toISOString();
    let jumlah = 0;

    for (let i = 0; i < nilaiArr.length; i++) {
      const n = nilaiArr[i];
      if (!n.idSoal) continue;
      const skor = (n.skor !== undefined && n.skor !== null) ? n.skor : '';
      const komentar = n.komentar || '';

      // Cari baris nilai yang sudah ada
      const semua = bacaSemua(sheetNilai);
      let ditemukan = null;
      for (let k = 0; k < semua.length; k++) {
        if (semua[k].pengerjaanId === pengerjaanId && semua[k].idSoal === n.idSoal) {
          ditemukan = semua[k];
          break;
        }
      }
      if (ditemukan) {
        perbaruiBaris(sheetNilai, ditemukan._baris, {
          'pengerjaanId': pengerjaanId,
          'idSoal': n.idSoal,
          'skor': skor,
          'komentar': komentar,
          'waktu': sekarang
        });
      } else {
        tambahBaris(sheetNilai, {
          'pengerjaanId': pengerjaanId,
          'idSoal': n.idSoal,
          'skor': skor,
          'komentar': komentar,
          'waktu': sekarang
        });
      }
      jumlah++;
    }

    // Update status pengerjaan menjadi "dinilai"
    const sheet = getSheet(KONFIG.SHEET_PENGERJAAN);
    const pen = cariBaris(sheet, { 'id': pengerjaanId });
    if (pen) {
      perbaruiBaris(sheet, pen._baris, {
        'id': pen.id,
        'siswaId': pen.siswaId,
        'lkpdId': pen.lkpdId,
        'status': 'dinilai',
        'waktuMulai': pen.waktuMulai,
        'waktuKumpul': pen.waktuKumpul,
        'revisiDibuka': pen.revisiDibuka
      });
    }

    catatLog('INFO', 'beriNilai', 'Nilai disimpan untuk pengerjaan ' + pengerjaanId + ' (' + jumlah + ' soal).');
    return { tersimpan: jumlah, status: 'dinilai' };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  return kirimSukses(hasil.data);
}

/**
 * ambilBerkasGuru: guru mengambil data berkas (base64) untuk melihat/mengunduh.
 *
 * Input : { aksi: "ambilBerkasGuru", token, berkasId }
 * Output: { berkasId, nama, mime, dataBase64 }
 */
function aksiAmbilBerkasGuru(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const berkasId = payload.berkasId;
  if (!berkasId) {
    return kirimGagal('VALIDASI_GAGAL', 'ID berkas wajib diisi.');
  }

  const sheetBerkas = getSheet(KONFIG.SHEET_BERKAS);
  const berkas = cariBaris(sheetBerkas, { 'id': berkasId });
  if (!berkas) {
    return kirimGagal('TIDAK_DITEMUKAN', 'Berkas tidak ditemukan.');
  }

  try {
    const file = DriveApp.getFileById(berkas.fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64 = Utilities.base64Encode(bytes);
    return kirimSukses({
      berkasId: berkasId,
      nama: berkas.nama,
      mime: berkas.mime,
      dataBase64: base64
    });
  } catch (err) {
    catatLog('ERROR', 'ambilBerkasGuru', err.toString());
    return kirimGagal('KESALAHAN_SERVER', 'Gagal membaca berkas dari Drive.');
  }
}

/**
 * simpanPengaturan: guru menyimpan pengaturan (LKPD aktif, tenggat, akses, kelas, info LKPD).
 *
 * Input : { aksi: "simpanPengaturan", token, pengaturan: {...} }
 * Output: { tersimpan: true }
 */
function aksiSimpanPengaturan(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const pengaturan = payload.pengaturan || {};

  const hasil = jalankanDenganKunci(function() {
    if (pengaturan.lkpdAktifId !== undefined) {
      simpanPengaturanKV('lkpdAktifId', pengaturan.lkpdAktifId);
    }
    if (pengaturan.tenggat !== undefined) {
      simpanPengaturanKV('tenggat', pengaturan.tenggat);
    }
    if (pengaturan.aksesBuka !== undefined) {
      simpanPengaturanKV('aksesBuka', String(pengaturan.aksesBuka));
    }
    if (pengaturan.daftarKelas !== undefined) {
      simpanPengaturanKV('daftarKelas', JSON.stringify(pengaturan.daftarKelas));
    }
    if (pengaturan.tampilkanNilaiSiswa !== undefined) {
      simpanPengaturanKV('tampilkanNilaiSiswa', String(pengaturan.tampilkanNilaiSiswa));
    }
    if (pengaturan.infoLkpd !== undefined && pengaturan.infoLkpd && pengaturan.infoLkpd.id) {
      const info = pengaturan.infoLkpd;
      simpanPengaturanKV('lkpdJudul', info.judul || '');
      simpanPengaturanKV('infoLkpd_' + info.id, JSON.stringify(info));
    }
    return { tersimpan: true };
  });

  if (!hasil.sukses) return kirimGagal(hasil.kode, hasil.pesan);
  catatLog('INFO', 'simpanPengaturan', 'Pengaturan disimpan oleh guru.');
  return kirimSukses(hasil.data);
}

/**
 * bacaPengaturan: guru membaca pengaturan saat ini untuk ditampilkan di dashboard.
 *
 * Input : { aksi: "bacaPengaturan", token }
 * Output: { lkpdAktifId, aksesBuka, tenggat, daftarKelas, tampilkanNilaiSiswa, lkpdJudul }
 */
function aksiBacaPengaturan(payload, konteks) {
  if (konteks.peran !== 'guru') {
    return kirimGagal('HAK_AKSES_DITOLAK', 'Aksi ini hanya untuk guru.');
  }
  const p = bacaPengaturan();
  let daftarKelas = [];
  try {
    daftarKelas = JSON.parse(p.daftarKelas || '[]');
  } catch (e) {
    daftarKelas = [];
  }
  return kirimSukses({
    lkpdAktifId: p.lkpdAktifId || '',
    aksesBuka: p.aksesBuka === 'true' || p.aksesBuka === true,
    tenggat: p.tenggat || '',
    daftarKelas: daftarKelas,
    tampilkanNilaiSiswa: p.tampilkanNilaiSiswa === 'true' || p.tampilkanNilaiSiswa === true,
    lkpdJudul: p.lkpdJudul || ''
  });
}

// ============================================================
// AKHIR FILE Code.gs
// ============================================================
