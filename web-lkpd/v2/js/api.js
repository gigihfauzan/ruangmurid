/* ============================================================
 * js/api.js — Klien API untuk Google Apps Script Web App
 * ============================================================
 * Mengatur semua panggilan ke backend. Fitur:
 *  - POST dengan Content-Type "text/plain" (menghindari preflight CORS)
 *  - Batas waktu (timeout) & percobaan ulang otomatis
 *  - Pemetaan kode galat server ke pesan ramah anak
 *  - Penanganan koneksi buruk (offline, kuota terlampaui)
 *
 * Tidak ada rahasia di sini. URL Web App diambil dari config.js.
 * ============================================================ */
(function () {
  'use strict';

  window.API = {};

  const KONFIG = window.KONFIG_APLIKASI;

  // ----------------------------------------------------------
  // PEMETAAN KODE GALAT → PESAN RAMAH ANAK
  // ----------------------------------------------------------

  /** Peta kode galat server ke pesan yang mudah dipahami siswa SMP. */
  const PETA_GALAT = {
    'OK': '',  // tidak ada galat
    'VALIDASI_GAGAL': 'Isian belum lengkap atau belum benar. Periksa lagi ya.',
    'KREDENSIAL_SALAH': 'Kata sandi salah. Coba lagi.',
    'PIN_BELUM_DIBUAT': 'PIN belum dibuat. Silakan buat PIN terlebih dahulu.',
    'PIN_TIDAK_COCOK': 'PIN salah. Coba lagi ya.',
    'PIN_TERKUNCI': 'Akun terkunci sementara karena salah PIN berulang. Tunggu beberapa menit lalu coba lagi.',
    'PIN_SUDAH_ADA': 'PIN sudah pernah dibuat. Silakan masuk dengan PIN Anda.',
    'TOKEN_TIDAK_VALID': 'Sesi kamu sudah berakhir. Silakan masuk lagi.',
    'HAK_AKSES_DITOLAK': 'Kamu tidak boleh mengakses bagian ini.',
    'TIDAK_DITEMUKAN': 'Data tidak ditemukan.',
    'PENGERJAAN_DIKUNCI': 'Pekerjaan sudah dikumpulkan dan terkunci. Minta guru membuka revisi untuk mengubah.',
    'TENGGAT_LEWAT': 'Waktu pengumpulan sudah habis.',
    'AKSES_DITUTUP': 'Akses LKPD sedang ditutup oleh guru.',
    'BERKAS_TERLALU_BESAR': 'Berkas terlalu besar (maksimal 2,5 MB).',
    'BERKAS_JENIS_TIDAK_DIIZINKAN': 'Jenis berkas tidak didukung. Hanya JPG, PNG, dan WEBP.',
    'BERKAS_MELEBIHI_BATAS': 'Maksimal 5 berkas per soal.',
    'KUNCI_TIDAK_TERSEDIA': 'Server sedang sibuk. Coba lagi sebentar ya.',
    'KUOTA_TERLAMPAUI': 'Kuota server penuh untuk sementara. Coba lagi beberapa menit lagi.',
    'KESALAHAN_SERVER': 'Ada gangguan di server. Coba lagi ya.',
    'AKSI_TIDAK_DIKENAL': 'Permintaan tidak dikenal.'
  };

  /**
   * Mengubah kode galat server menjadi pesan ramah anak.
   * @param {string} kode Kode galat dari server
   * @param {string} pesanServer Pesan asli dari server (sebagai fallback)
   * @returns {string} Pesan ramah anak
   */
  API.pesanGalat = function (kode, pesanServer) {
    if (PETA_GALAT[kode]) return PETA_GALAT[kode];
    if (pesanServer) return pesanServer;
    return 'Terjadi kesalahan. Coba lagi ya.';
  };

  // ----------------------------------------------------------
  // FUNGSI UTAMA: panggilApi
  // ----------------------------------------------------------

  /**
   * Memanggil aksi backend dengan timeout & percobaan ulang.
   *
   * @param {string} aksi Nama aksi (mis. 'cekSiswa')
   * @param {object} payload Data tambahan (token otomatis ditambahkan jika ada)
   * @param {object} opt { cobaMaks, jeda, timeoutMs, token } (opsional)
   * @returns {Promise<object>} Respons server { ok, kode, data }
   */
  API.panggil = function (aksi, payload, opt) {
    opt = opt || {};
    const cobaMaks = opt.cobaMaks !== undefined ? opt.cobaMaks : KONFIG.apiMaksCoba;
    const jeda = opt.jedaCobaMs || KONFIG.apiJedaCobaMs;
    const timeoutMs = opt.timeoutMs || KONFIG.apiTimeoutMs;

    // Susun body: tambahkan aksi & token
    const body = Object.assign({}, payload || {}, { aksi: aksi });
    // Token: ambil dari opt.token, atau dari sesi tersimpan
    if (opt.token) {
      body.token = opt.token;
    } else {
      const sesi = UMUM.lsBaca('sesi');
      if (sesi && sesi.token) body.token = sesi.token;
    }

    const bodyStr = JSON.stringify(body);

    // Fungsi fetch dengan timeout via AbortController
    function fetchSekali() {
      return new Promise(function (resolve, reject) {
        const controller = new AbortController();
        const timer = setTimeout(function () {
          controller.abort();
        }, timeoutMs);

        fetch(KONFIG.urlWebApp, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: bodyStr,
          signal: controller.signal
        }).then(function (resp) {
          clearTimeout(timer);
          // Cek content-type
          const ct = resp.headers.get('content-type') || '';
          if (ct.indexOf('application/json') === -1 && ct.indexOf('text/plain') === -1) {
            // Mungkin halaman error HTML dari Google
            reject(new Error('Respons bukan JSON. Mungkin URL Web App salah atau ada error.'));
            return;
          }
          return resp.text().then(function (teks) {
            let json;
            try {
              json = JSON.parse(teks);
            } catch (e) {
              reject(new Error('Tidak bisa membaca respons server (format tidak valid).'));
              return;
            }
            resolve(json);
          });
        }).catch(function (err) {
          clearTimeout(timer);
          if (err.name === 'AbortError') {
            reject(new Error('Waktu tunggu habis. Periksa koneksi internetmu.'));
          } else {
            reject(err);
          }
        });
      });
    }

    // Percobaan ulang dengan jeda
    function coba(percobaan) {
      return fetchSekali().then(function (resp) {
        // Jika server mengembalikan kuota terlampaui atau kunci tidak tersedia, coba lagi
        if (!resp.ok && (resp.kode === 'KUOTA_TERLAMPAUI' || resp.kode === 'KUNCI_TIDAK_TERSEDIA')) {
          if (percobaan < cobaMaks) {
            return jedaLaluCoba(percobaan + 1);
          }
        }
        return resp;
      }).catch(function (err) {
        // Error jaringan → coba lagi
        if (percobaan < cobaMaks) {
          return jedaLaluCoba(percobaan + 1, err);
        }
        throw err;
      });
    }

    function jedaLaluCoba(percobaan, errTerakhir) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          coba(percobaan).then(resolve, reject);
        }, jeda);
      });
    }

    return coba(1);
  };

  // ----------------------------------------------------------
  // BUNGKUS HASIL: panggilAman
  // ----------------------------------------------------------

  /**
   * Membungkus panggilan API dengan penanganan error seragam.
   * Mengembalikan { ok: boolean, data, pesan } tanpa melempar exception.
   *
   * @returns {Promise<{ok:boolean, data:object, pesan:string, kode:string}>}
   */
  API.panggilAman = function (aksi, payload, opt) {
    return API.panggil(aksi, payload, opt).then(function (resp) {
      if (resp && resp.ok) {
        return { ok: true, data: resp.data || {}, pesan: '', kode: 'OK' };
      }
      // Server merespons tapi gagal
      const kode = (resp && resp.kode) || 'KESALAHAN_SERVER';
      const pesanServer = resp && resp.data && resp.data.pesan ? resp.data.pesan : '';
      const pesan = API.pesanGalat(kode, pesanServer);
      return { ok: false, data: resp && resp.data ? resp.data : {}, pesan: pesan, kode: kode };
    }).catch(function (err) {
      // Error jaringan / timeout
      const pesan = navigator.onLine
        ? 'Tidak bisa terhubung ke server. ' + (err.message || '')
        : 'Kamu sedang offline. Periksa koneksi internet lalu coba lagi.';
      return { ok: false, data: {}, pesan: pesan, kode: 'KONEKSI_GAGAL' };
    });
  };

  // ----------------------------------------------------------
  // API KONKRET PER AKSI (pembungkus tipis untuk keterbacaan)
  // ----------------------------------------------------------

  /** cekSiswa: cek apakah siswa sudah terdaftar & punya PIN. */
  API.cekSiswa = function (kelas, nama) {
    return API.panggilAman('cekSiswa', { kelas: kelas, nama: nama });
  };

  /** buatPin: buat PIN baru (pertama kali). */
  API.buatPin = function (siswaId, pin, konfirmasiPin) {
    return API.panggilAman('buatPin', { siswaId: siswaId, pin: pin, konfirmasiPin: konfirmasiPin });
  };

  /** masukSiswa: login siswa dengan PIN. */
  API.masukSiswa = function (siswaId, pin) {
    return API.panggilAman('masukSiswa', { siswaId: siswaId, pin: pin });
  };

  /** muatPekerjaan: ambil/buat pengerjaan untuk LKPD. */
  API.muatPekerjaan = function (lkpdId, token) {
    return API.panggilAman('muatPekerjaan', { lkpdId: lkpdId }, { token: token });
  };

  /** simpanJawaban: kirim kelompok jawaban yang berubah. */
  API.simpanJawaban = function (pengerjaanId, jawabanArr, token) {
    return API.panggilAman('simpanJawaban', { pengerjaanId: pengerjaanId, jawaban: jawabanArr }, { token: token });
  };

  /** unggahBerkas: unggah satu berkas foto/gambar. */
  API.unggahBerkas = function (pengerjaanId, idSoal, jenis, nama, dataBase64, token) {
    return API.panggilAman('unggahBerkas', {
      pengerjaanId: pengerjaanId, idSoal: idSoal, jenis: jenis,
      nama: nama, dataBase64: dataBase64
    }, { token: token, timeoutMs: 60000, cobaMaks: 2 });
  };

  /** hapusBerkas: hapus satu berkas milik siswa. */
  API.hapusBerkas = function (pengerjaanId, berkasId, token) {
    return API.panggilAman('hapusBerkas', { pengerjaanId: pengerjaanId, berkasId: berkasId }, { token: token });
  };

  /** ambilBerkas: ambil data base64 berkas milik siswa. */
  API.ambilBerkas = function (pengerjaanId, berkasId, token) {
    return API.panggilAman('ambilBerkas', { pengerjaanId: pengerjaanId, berkasId: berkasId }, { token: token, timeoutMs: 60000 });
  };

  /** kumpulkan: kunci pengerjaan siswa. */
  API.kumpulkan = function (pengerjaanId, token) {
    return API.panggilAman('kumpulkan', { pengerjaanId: pengerjaanId }, { token: token });
  };

  /** lihatNilaiSaya: siswa lihat nilai miliknya sendiri. */
  API.lihatNilaiSaya = function (pengerjaanId, token) {
    return API.panggilAman('lihatNilaiSaya', { pengerjaanId: pengerjaanId }, { token: token });
  };

  // ----------------------------------------------------------
  // API GURU
  // ----------------------------------------------------------

  /** masukGuru: login guru dengan kata sandi. */
  API.masukGuru = function (kataSandi) {
    return API.panggilAman('masukGuru', { kataSandi: kataSandi });
  };

  /** daftarSiswa: daftar siswa per kelas dengan status pengerjaan. */
  API.daftarSiswa = function (kelas, lkpdId, token) {
    return API.panggilAman('daftarSiswa', { kelas: kelas, lkpdId: lkpdId }, { token: token });
  };

  /** lihatPekerjaan: guru lihat pekerjaan satu siswa lengkap. */
  API.lihatPekerjaan = function (pengerjaanId, token) {
    return API.panggilAman('lihatPekerjaan', { pengerjaanId: pengerjaanId }, { token: token });
  };

  /** resetPin: guru reset PIN siswa. */
  API.resetPin = function (siswaId, token) {
    return API.panggilAman('resetPin', { siswaId: siswaId }, { token: token });
  };

  /** bukaRevisi: guru buka/tutup revisi pengerjaan. */
  API.bukaRevisi = function (pengerjaanId, buka, token) {
    return API.panggilAman('bukaRevisi', { pengerjaanId: pengerjaanId, buka: buka }, { token: token });
  };

  /** beriNilai: guru memberi nilai & komentar per soal. */
  API.beriNilai = function (pengerjaanId, nilaiArr, token) {
    return API.panggilAman('beriNilai', { pengerjaanId: pengerjaanId, nilai: nilaiArr }, { token: token });
  };

  /** ambilBerkasGuru: guru ambil data base64 berkas. */
  API.ambilBerkasGuru = function (berkasId, token) {
    return API.panggilAman('ambilBerkasGuru', { berkasId: berkasId }, { token: token, timeoutMs: 60000 });
  };

  /** simpanPengaturan: guru simpan pengaturan. */
  API.simpanPengaturan = function (pengaturan, token) {
    return API.panggilAman('simpanPengaturan', { pengaturan: pengaturan }, { token: token });
  };

  /** bacaPengaturan: guru baca pengaturan saat ini. */
  API.bacaPengaturan = function (token) {
    return API.panggilAman('bacaPengaturan', {}, { token: token });
  };

})();
// ============================================================
// AKHIR FILE js/api.js
// ============================================================
