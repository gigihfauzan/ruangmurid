# e-LKPD Interaktif — Panduan Penerapan

e-Lembar Kerja Peserta Didik interaktif untuk siswa SMP.
Backend: **Google Apps Script + Google Sheet + Google Drive**.
Frontend: **HTML, CSS, JavaScript murni** (tanpa framework, siap diunggah ke Netlify).

**Mata pelajaran:** Matematika • **Kelas:** VIII • **Bab:** Bilangan Berpangkat
**Guru:** Gigih Ichyar Fauzan, S.Pd. • **Sekolah:** SMP Negeri 2 Kedungbanteng

---

## Daftar Isi

1. [Tahap 1 — Backend (Apps Script)](#tahap-1--backend-apps-script) ← *bagian ini*
2. Tahap 2 — Halaman Siswa *(akan datang)*
3. Tahap 3 — Dashboard Guru & Unduh *(akan datang)*
4. Tahap 4 — Fitur Opsional & Polesan *(akan datang)*

---

## Tahap 1 — Backend (Apps Script)

Bagian ini menjelaskan cara memasang dan menguji **backend** e-LKPD: satu file
`Code.gs` di Google Apps Script yang menyimpan data di Google Sheet dan berkas
gambar/foto di Google Drive.

### 1.1 Prasyarat

- Akun Google (Gmail atau Google Workspace for Education).
- Browser modern (Chrome, Edge, Firefox).
- Tidak perlu menginstal apa pun di komputer — semuanya dikerjakan di browser.

### 1.2 Struktur File Tahap 1

```
e-lkpd/
├── apps-script/
│   └── Code.gs      ← (file ini) seluruh kode backend
└── README.md        ← (file ini) panduan penerapan
```

### 1.3 Cara Memasang Backend — Langkah demi Langkah

#### Langkah 1 — Buka Google Apps Script

1. Buka https://script.google.com di browser.
2. Klik **New project** (Proyek baru) di pojok kiri atas.
3. Akan terbuka editor dengan file `Code.gs` berisi beberapa baris contoh.
   Hapus **semua** isi file tersebut.

#### Langkah 2 — Tempel Kode Backend

1. Buka file `e-lkpd/apps-script/Code.gs` di komputer Anda.
2. Salin **seluruh** isi file.
3. Tempel ke editor Apps Script (menggantikan kode contoh yang sudah dihapus).
4. Klik ikon **disket** (Save) atau tekan `Ctrl+S`. Beri nama proyek, misalnya
   `e-LKPD Backend`.

#### Langkah 3 — Jalankan setup() Satu Kali

Fungsi `setup()` membuat semua sheet, folder Drive, dan pengaturan default.

1. Di editor Apps Script, pastikan dropdown fungsi (di toolbar) menampilkan
   **setup**. Jika belum, klik dropdown dan pilih `setup`.
2. Klik **Run** (tombol play) atau tekan `Ctrl+Enter`.
3. Saat pertama kali menjalankan, Google akan meminta izin:
   - Klik **Review permissions** (Tinjau izin).
   - Pilih akun Google Anda.
   - Klik **Advanced** (Lanjutan) → **Go to e-LKPD Backend (unsafe)**
     *(ini normal karena aplikasi Anda sendiri yang belum diverifikasi).*
   - Klik **Allow** (Izinkan).
4. Tunggu hingga muncul pesan: `Setup selesai. Spreadsheet ID: ... Folder ID: ...`
   di panel eksekusi (Execution log).
5. **Catat** Spreadsheet ID dan Folder ID jika perlu (opsional, sudah disimpan
   otomatis di Script Properties).

> Hasil setup():
> - Spreadsheet baru bernama "e-LKPD Database" dibuat di Google Drive Anda.
> - Folder "e-LKPD-Berkas" dibuat di root Drive untuk menyimpan foto/gambar siswa.
> - Kata sandi guru default adalah `admin123` — **wajib diganti** di Langkah 4.

#### Langkah 4 — Ganti Kata Sandi Guru

Kata sandi guru disimpan sebagai **hash SHA-256 + salt** di Script Properties
(tidak ada di kode atau sheet), sehingga aman.

1. Di editor Apps Script, ganti fungsi di dropdown menjadi **gantiKataSandiGuru**.
2. Klik panah kecil di samping **Run** → **Run with parameters...**
   *(atau jalankan dengan cara berikut)*:
   - Sebagai alternatif, di dalam editor cari baris fungsi `gantiKataSandiGuru`,
     lalu salin baris ini ke **function baris terakhir file**:
     ```javascript
     function jalankanGantiSandi() {
       gantiKataSandiGuru('GantiDenganKataSandiRahasiaAnda');
     }
     ```
     kemudian jalankan fungsi `jalankanGantiSandi`.
3. Cara termudah: buka konsol Executions atau gunakan **Debug** dengan menambah
   baris pemanggilan. Pilih kata sandi yang mudah Anda ingat namun sulit ditebak
   (min. 6 karakter, disarankan campuran huruf & angka).
4. Setelah berhasil, **hapus** baris `jalankanGantiSandi` tersebut agar kata
   sandi tidak tertinggal di kode.

> **PENTING:** Jangan pernah menulis kata sandi guru di file `config.js` atau
> file klien lainnya. Kata sandi hanya diketik saat login di halaman guru.

#### Langkah 5 — Deploy sebagai Web App

Agar bisa dipanggil dari halaman web (Netlify), kode harus di-deploy sebagai Web App.

1. Klik **Deploy** (di pojok kanan atas) → **New deployment**.
2. Klik ikon roda gigi ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description:** `e-LKPD v1`
   - **Execute as:** `Me` (akun Anda)
   - **Who has access:** `Anyone`
     *(agar siswa bisa mengakses tanpa login Google; data tetap aman karena
     setiap aksi memvalidasi token).*
4. Klik **Deploy**.
5. Saat pertama deploy, akan muncul jendela otorisasi lagi — klik **Allow**.
6. **Salin URL Web App** yang muncul (format: `https://script.google.com/macros/s/.../exec`).
   Simpan di tempat aman. URL ini akan ditempatkan di `config.js` pada Tahap 2.

> URL Web App bersifat **publik** (siapa pun yang tahu URL bisa mengakses),
> tetapi setiap aksi non-login memvalidasi token, peran, dan kepemilikan data,
> sehingga data tetap aman. Asumsi: semua klien tidak tepercaya.

#### Langkah 6 — Mengganti Versi Saat Memperbarui Kode

Setiap kali Anda mengubah `Code.gs` dan ingin perubahan tersebut aktif:

1. Klik **Deploy** → **Manage deployments**.
2. Pilih deployment yang ada → klik ikon **pensil** (Edit).
3. Di bagian **Version**, pilih **New version** (bukan "Version 1" lama).
4. Klik **Deploy**.
5. URL tidak berubah, tetapi kode baru sudah aktif.

> Jika lupa membuat versi baru, perubahan kode **tidak akan berlaku** untuk
> pengguna meskipun sudah Anda simpan di editor.

### 1.4 Struktur Google Sheet

Setelah `setup()`, spreadsheet "e-LKPD Database" berisi sheet berikut:

| Sheet | Kolom | Keterangan |
|-------|-------|------------|
| **Pengaturan** | `kunci`, `nilai`, `catatan` | Pengaturan global (daftar kelas, tenggat, akses, dll.) |
| **Kelas** | `id`, `nama`, `catatan` | Daftar kelas (saat ini tidak wajib diisi manual) |
| **Siswa** | `id`, `kelas`, `nama`, `hashPin`, `salt`, `statusReset`, `percobaanGagal`, `waktuKunci`, `dibuatPada` | Data akun siswa. PIN disimpan sebagai hash, bukan teks biasa. |
| **Sesi** | `token`, `peran`, `idPengguna`, `lkpdId`, `waktuBuat`, `waktuKedaluwarsa` | Token login aktif. Sesi siswa 12 jam, guru 8 jam. |
| **Pengerjaan** | `id`, `siswaId`, `lkpdId`, `status`, `waktuMulai`, `waktuKumpul`, `revisiDibuka` | Satu baris per siswa per LKPD. Status: `belum`/`sedang`/`terkumpul`/`dinilai`. |
| **Jawaban** | `pengerjaanId`, `idSoal`, `teks`, `data`, `waktuUbah` | Jawaban teks siswa. `data` menyimpan struktur JSON (tabel, urutan, dll.) |
| **Berkas** | `id`, `pengerjaanId`, `idSoal`, `jenis`, `fileId`, `nama`, `ukuran`, `mime`, `waktu` | Metadata berkas di Drive. `jenis` = `foto`/`gambar`. |
| **Nilai** | `pengerjaanId`, `idSoal`, `skor`, `komentar`, `waktu` | Nilai & komentar guru per soal. |
| **Kunci** | `lkpdId`, `idSoal`, `tipe`, `jawabanBenar`, `toleransi`, `wajib`, `bobot` | Kunci jawaban untuk skor otomatis (Tahap 4). Kosong sampai diisi guru. |
| **Log** | `waktu`, `level`, `sumber`, `pesan` | Catatan aktivitas & error (maks 5000 baris). |

### 1.5 Struktur Folder Google Drive

Berkas siswa disimpan dengan struktur berikut (semua **private**, tidak publik):

```
e-LKPD-Berkas/                          ← folder utama (dibuat setup)
└── {Judul LKPD}/                       ← contoh: "Mengenal Bilangan Berpangkat"
    └── {Kelas}/                        ← contoh: "VIII"
        └── {Nama Siswa}/               ← contoh: "Budi Santoso"
            ├── berkas_1234567.jpg      ← foto/gambar siswa
            └── gambar_kanvas.png
```

### 1.6 Daftar Aksi (API)

Klien memanggil dengan `fetch POST`, `Content-Type: "text/plain"`,
body = JSON string. Respons selalu `{ ok, kode, data }`.

#### Aksi Siswa

| Aksi | Perlu Token | Input Utama | Output |
|------|-------------|-------------|--------|
| `cekSiswa` | tidak | `kelas`, `nama` | `status` (`buat_pin`/`perlu_pin`), `siswaId`, `nama` |
| `buatPin` | tidak | `siswaId`, `pin`, `konfirmasiPin` | `token`, `peran` |
| `masukSiswa` | tidak | `siswaId`, `pin` | `token`, `peran` |
| `muatPekerjaan` | ya (siswa) | `lkpdId` | `pengerjaanId`, `status`, `jawaban`, `berkas`, `nilai` |
| `simpanJawaban` | ya (siswa) | `pengerjaanId`, `jawaban[]` | `tersimpan` |
| `unggahBerkas` | ya (siswa) | `pengerjaanId`, `idSoal`, `jenis`, `nama`, `dataBase64` | `berkasId`, `nama`, `ukuran`, `mime` |
| `hapusBerkas` | ya (siswa) | `pengerjaanId`, `berkasId` | `terhapus` |
| `ambilBerkas` | ya (siswa) | `pengerjaanId`, `berkasId` | `dataBase64`, `nama`, `mime` |
| `kumpulkan` | ya (siswa) | `pengerjaanId` | `status`, `waktuKumpul` |
| `lihatNilaiSaya` | ya (siswa) | `pengerjaanId` | `nilai`, `skorTotal` |

#### Aksi Guru

| Aksi | Perlu Token | Input Utama | Output |
|------|-------------|-------------|--------|
| `masukGuru` | tidak | `kataSandi` | `token`, `peran` |
| `daftarSiswa` | ya (guru) | `kelas`, `lkpdId` | `siswa[]` |
| `lihatPekerjaan` | ya (guru) | `pengerjaanId` | `siswa`, `pengerjaan`, `jawaban`, `berkas`, `nilai` |
| `resetPin` | ya (guru) | `siswaId` | `tereset` |
| `bukaRevisi` | ya (guru) | `pengerjaanId`, `buka` | `status`, `revisiDibuka` |
| `beriNilai` | ya (guru) | `pengerjaanId`, `nilai[]` | `tersimpan`, `status` |
| `ambilBerkasGuru` | ya (guru) | `berkasId` | `dataBase64`, `nama`, `mime` |
| `simpanPengaturan` | ya (guru) | `pengaturan` | `tersimpan` |

### 1.7 Kode Galat (Error Code)

Klien memetakan kode berikut ke pesan ramah anak:

| Kode | Arti | Pesan ke Siswa (contoh) |
|------|------|--------------------------|
| `OK` | Berhasil | — |
| `VALIDASI_GAGAL` | Input tidak valid | "Isian belum lengkap atau salah." |
| `KREDENSIAL_SALAH` | Login guru salah | "Kata sandi salah." |
| `PIN_BELUM_DIBUAT` | Siswa belum buat PIN | "PIN belum dibuat. Silakan buat PIN." |
| `PIN_TIDAK_COCOK` | PIN salah (masih ada kesempatan) | "PIN salah. Sisa percobaan: 3." |
| `PIN_TERKUNCI` | Terkunci sementara | "Akun terkunci. Coba lagi dalam 5 menit." |
| `PIN_SUDAH_ADA` | Coba buat PIN padahal sudah ada | "PIN sudah ada. Silakan masuk." |
| `TOKEN_TIDAK_VALID` | Sesi hilang/kedaluwarsa | "Sesi berakhir. Silakan masuk lagi." |
| `HAK_AKSES_DITOLAK` | Akses tidak diizinkan | "Anda tidak boleh mengakses ini." |
| `TIDAK_DITEMUKAN` | Data tidak ada | "Data tidak ditemukan." |
| `PENGERJAAN_DIKUNCI` | Sudah dikumpul, belum revisi | "Pekerjaan terkunci. Minta guru membuka revisi." |
| `TENGGAT_LEWAT` | Tenggat sudah lewat | "Waktu pengumpulan sudah habis." |
| `AKSES_DITUTUP` | Guru menutup akses | "Akses sedang ditutup guru." |
| `BERKAS_TERLALU_BESAR` | File > 2,5 MB | "Foto terlalu besar (maks 2,5 MB)." |
| `BERKAS_JENIS_TIDAK_DIIZINKAN` | Tipe tidak didukung | "Hanya foto JPG, PNG, WEBP." |
| `BERKAS_MELEBIHI_BATAS` | > 5 file per soal | "Maksimal 5 foto per soal." |
| `KUNCI_TIDAK_TERSEDIA` | Server sibuk (LockService) | "Server sibuk. Coba lagi sebentar." |
| `KUOTA_TERLAMPAUI` | Kuota Apps Script habis | "Kuota penuh. Coba lagi nanti." |
| `KESALAHAN_SERVER` | Error tak terduga | "Ada gangguan. Coba lagi." |
| `AKSI_TIDAK_DIKENAL` | Aksi tidak dikenal | (error dev) |

### 1.8 Catatan Keamanan

- **PIN siswa** di-hash dengan **SHA-256 + salt** per siswa. PIN asli tidak
  pernah disimpan atau dikirim ke klien.
- **Kata sandi guru** disimpan sebagai hash di **Script Properties** (bukan di
  kode atau sheet).
- **Token sesi** terpisah antara siswa dan guru. Sesi siswa 12 jam, guru 8 jam.
- **Setiap aksi non-login** memvalidasi token, peran, dan kepemilikan data.
  Siswa hanya bisa mengakses pengerjaan miliknya sendiri.
- **Batas percobaan PIN salah**: 5 kali, lalu akun terkunci 5 menit.
- **LockService** membungkus semua penulisan ke Sheet agar aman saat banyak
  siswa menyimpan bersamaan.
- **Setelah terkumpul**, penyimpanan dan unggahan ditolak sampai guru membuka
  revisi.
- **Berkas**: tipe diperiksa dari **magic bytes** (bukan klaim klien), ukuran
  maks 2,5 MB, maks 5 per soal, disimpan private di Drive.
- **Tidak ada rahasia di klien** — `config.js` (Tahap 2) hanya berisi URL Web App.
- **URL Web App dianggap publik** — semua klien diperlakukan tidak tepercaya.

### 1.9 Pengujian Manual per Aksi

Setelah setup() dan deploy, uji setiap aksi dengan tool seperti
[curl](https://curl.se/), [Postman](https://www.postman.com/), atau ekstensi
browser "REST Client". Ganti `URL_WEB_APP` dengan URL Anda.

#### Persiapan

Catat dulu URL Web App Anda, misalnya:
`https://script.google.com/macros/s/AKfyc.../exec`

#### Uji 1 — Health Check (GET)

Memastikan Web App aktif.

```bash
curl "URL_WEB_APP"
```

**Harapan:** `{"ok":true,"kode":"OK","data":{"aplikasi":"e-LKPD","versi":"1.0.0","status":"aktif"}}`

#### Uji 2 — cekSiswa (siswa baru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"cekSiswa","kelas":"VIII","nama":"Budi Santoso"}'
```

**Harapan:** `{"ok":true,"kode":"OK","data":{"status":"buat_pin","siswaId":"sw_...","nama":"Budi Santoso"}}`

Cek sheet **Siswa**: harus muncul 1 baris baru dengan nama Budi, `hashPin` kosong.

#### Uji 3 — buatPin

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"buatPin","siswaId":"sw_...","pin":"1234","konfirmasiPin":"1234"}'
```

(ganti `sw_...` dengan siswaId dari Uji 2)

**Harapan:** `{"ok":true,"kode":"OK","data":{"token":"tok_...","peran":"siswa"}}`

Cek sheet **Siswa**: `hashPin` dan `salt` sekarang terisi.
Cek sheet **Sesi**: muncul baris baru dengan token tersebut.
**Catat token** untuk uji berikutnya.

#### Uji 4 — cekSiswa (siswa lama)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"cekSiswa","kelas":"VIII","nama":"Budi Santoso"}'
```

**Harapan:** `{"ok":true,...,"data":{"status":"perlu_pin","siswaId":"sw_...","nama":"Budi Santoso"}}`

#### Uji 5 — masukSiswa (PIN benar)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"masukSiswa","siswaId":"sw_...","pin":"1234"}'
```

**Harapan:** `{"ok":true,...,"data":{"token":"tok_...","peran":"siswa"}}`

#### Uji 6 — masukSiswa (PIN salah)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"masukSiswa","siswaId":"sw_...","pin":"9999"}'
```

**Harapan:** `{"ok":false,"kode":"PIN_TIDAK_COCOK","data":{"pesan":"PIN salah. Sisa percobaan: 4."}}`

Ulangi 5 kali untuk memicu kunci:
**Harapan setelah 5x:** `{"ok":false,"kode":"PIN_TERKUNCI",...}`

> Setelah terkunci, tunggu 5 menit atau jalankan `hapusDataUjiCoba()` lalu ulang.

#### Uji 7 — muatPekerjaan

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"muatPekerjaan","token":"tok_...","lkpdId":"lkpd_bilangan_pangkat"}'
```

**Harapan:** `{"ok":true,...,"data":{"pengerjaanId":"pk_...","status":"sedang","jawaban":{},"berkas":[],"nilai":{},...}}`

Cek sheet **Pengerjaan**: muncul baris baru. **Catat pengerjaanId**.

#### Uji 8 — simpanJawaban

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"simpanJawaban","token":"tok_...","pengerjaanId":"pk_...","jawaban":[{"idSoal":"s1","teks":"2^3 = 8","data":null}]}'
```

**Harapan:** `{"ok":true,...,"data":{"tersimpan":1}}`

Cek sheet **Jawaban**: muncul baris dengan `teks` = "2^3 = 8".

#### Uji 9 — unggahBerkas

Siapkan file gambar kecil (mis. `foto.jpg`, < 2,5 MB). Encode ke base64.
Di Linux/Mac: `base64 -w0 foto.jpg`. Salin hasilnya sebagai `BASE64_DATA`.

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"unggahBerkas","token":"tok_...","pengerjaanId":"pk_...","idSoal":"s3","jenis":"foto","nama":"foto1.jpg","dataBase64":"BASE64_DATA"}'
```

**Harapan:** `{"ok":true,...,"data":{"berkasId":"br_...","nama":"foto1.jpg","ukuran":...,"mime":"image/jpeg",...}}`

Cek sheet **Berkas**: muncul baris baru.
Cek Google Drive: folder `e-LKPD-Berkas/LKPD Contoh/VIII/Budi Santoso/`
berisi file `foto1.jpg`.

#### Uji 10 — ambilBerkas

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"ambilBerkas","token":"tok_...","pengerjaanId":"pk_...","berkasId":"br_..."}'
```

**Harapan:** `{"ok":true,...,"data":{"berkasId":"br_...","nama":"foto1.jpg","mime":"image/jpeg","dataBase64":"..."}}`

#### Uji 11 — kumpulkan

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"kumpulkan","token":"tok_...","pengerjaanId":"pk_..."}'
```

**Harapan:** `{"ok":true,...,"data":{"status":"terkumpul","waktuKumpul":"2025-..."}}`

Cek sheet **Pengerjaan**: status berubah jadi `terkumpul`, `waktuKumpul` terisi.

#### Uji 12 — simpanJawaban setelah dikumpulkan (harus ditolak)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"simpanJawaban","token":"tok_...","pengerjaanId":"pk_...","jawaban":[{"idSoal":"s1","teks":"diedit ulang","data":null}]}'
```

**Harapan:** `{"ok":false,"kode":"PENGERJAAN_DIKUNCI",...}`

#### Uji 13 — masukGuru

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"masukGuru","kataSandi":"KATA_SANDI_GURU_ANDA"}'
```

**Harapan:** `{"ok":true,...,"data":{"token":"tok_...","peran":"guru"}}`

**Catat token guru** untuk uji berikutnya.

#### Uji 14 — daftarSiswa (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"daftarSiswa","token":"tok_guru...","kelas":"VIII","lkpdId":"lkpd_bilangan_pangkat"}'
```

**Harapan:** `{"ok":true,...,"data":{"siswa":[{"id":"sw_...","nama":"Budi Santoso","kelas":"VIII","status":"terkumpul","waktuKumpul":"...","pengerjaanId":"pk_...","jumlahFoto":1}],"lkpdId":"lkpd_bilangan_pangkat"}}`

#### Uji 15 — lihatPekerjaan (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"lihatPekerjaan","token":"tok_guru...","pengerjaanId":"pk_..."}'
```

**Harapan:** Respons berisi `siswa`, `pengerjaan`, `jawaban`, `berkas`, `nilai`.

#### Uji 16 — bukaRevisi (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"bukaRevisi","token":"tok_guru...","pengerjaanId":"pk_...","buka":true}'
```

**Harapan:** `{"ok":true,...,"data":{"status":"sedang","revisiDibuka":"true"}}`

Setelah ini, siswa bisa simpan jawaban lagi (ulangi Uji 8 — sekarang harus berhasil).

#### Uji 17 — beriNilai (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"beriNilai","token":"tok_guru...","pengerjaanId":"pk_...","nilai":[{"idSoal":"s1","skor":90,"komentar":"Bagus!"}]}'
```

**Harapan:** `{"ok":true,...,"data":{"tersimpan":1,"status":"dinilai"}}`

Cek sheet **Nilai**: muncul baris dengan skor 90.

#### Uji 18 — resetPin (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"resetPin","token":"tok_guru...","siswaId":"sw_..."}'
```

**Harapan:** `{"ok":true,...,"data":{"tereset":true}}`

Cek sheet **Siswa**: `hashPin`, `salt` kosong, `statusReset` = `perlu_buat_pin`.

#### Uji 19 — simpanPengaturan (guru)

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"simpanPengaturan","token":"tok_guru...","pengaturan":{"aksesBuka":true,"tenggat":"","tampilkanNilaiSiswa":false,"infoLkpd":{"id":"lkpd_bilangan_pangkat","judul":"Mengenal Bilangan Berpangkat","mapel":"Matematika","kelas":"VIII"}}}'
```

**Harapan:** `{"ok":true,...,"data":{"tersimpan":true}}`

Cek sheet **Pengaturan**: baris `lkpdJudul` berubah jadi "Mengenal Bilangan Berpangkat".

#### Uji 20 — Token tidak valid

```bash
curl -X POST "URL_WEB_APP" \
  -H "Content-Type: text/plain" \
  -d '{"aksi":"muatPekerjaan","token":"tok_palsu","lkpdId":"lkpd_bilangan_pangkat"}'
```

**Harapan:** `{"ok":false,"kode":"TOKEN_TIDAK_VALID",...}`

### 1.10 Pembersihan Data Uji Coba

Jika ingin menghapus semua data siswa/sesi/pengerjaan/jawaban/berkas/nilai/log
(kembali ke kondisi bersih tanpa menghapus pengaturan dan kata sandi guru):

1. Di editor Apps Script, pilih fungsi **hapusDataUjiCoba**.
2. Klik **Run**.
3. Berkas di Google Drive folder `e-LKPD-Berkas` **tidak otomatis terhapus**
   — hapus manual jika perlu (klik kanan folder → Hapus).

### 1.11 Pembaruan Kode

Setiap kali Anda mengubah `Code.gs`:

1. Simpan (`Ctrl+S`).
2. Klik **Deploy** → **Manage deployments**.
3. Edit deployment → **Version: New version** → **Deploy**.
4. Uji dengan `curl URL_WEB_APP` (GET) untuk memastikan masih aktif.

### 1.12 Batasan & Catatan

- **Kuota Apps Script**: ada batas harian untuk eksekusi, email, dll. Jika
  terlampaui, respons `KUOTA_TERLAMPAUI`. Lihat
  https://script.google.com/home/myexecutions untuk pemakaian.
- **Ukuran respons**: base64 berkas maks 2,5 MB per berkas. Untuk berkas sangat
  besar, klien mengambil satu per satu (bukan serentak).
- **Berkas tidak publik**: file di Drive hanya bisa diakses melalui aksi
  `ambilBerkas`/`ambilBerkasGuru` ber-token, bukan via URL langsung.
- **PIN siswa**: 4–6 angka. Jangan gunakan tanggal lahir atau angka mudah ditebak.
- **Tenggat**: jika diisi (format ISO 8601, mis. `2025-12-31T23:59:59`), siswa
  tidak bisa mengumpulkan setelah lewat tenggat. Bisa dikosongkan (tanpa tenggat).

### 1.13 Asumsi yang Diambil di Tahap 1

1. **Pemeriksaan soal wajib & kosong** dilakukan di sisi klien (Tahap 2) untuk
   UX yang cepat. Server tidak menyimpan daftar soal (konten ada di `konten.js`
   sisi klien). Risiko: siswa bisa "memaksa" kumpulkan tanpa mengisi soal wajib,
   tetapi ini hanya merugikan siswa sendiri (nilai kurang). Guru tetap bisa
   membuka revisi.
2. **Satu LKPD aktif** per sesi (multi-bab di Tahap 4). `lkpdId` dikirim klien
   dari `konten.js`.
3. **Tampilan nilai siswa** diatur via pengaturan `tampilkanNilaiSiswa`
   (default `false`). Guru mengaktifkan setelah selesai menilai.
4. **Sheet Kunci** sudah dibuat (kosong) untuk skor otomatis di Tahap 4.
5. **Folder judul LKPD** mengambil dari pengaturan `lkpdJudul` (default
   "LKPD Contoh"). Guru mengganti via `simpanPengaturan` di dashboard (Tahap 3)
   atau mengedit sheet Pengaturan langsung.

---

**Tahap 1 selesai.** Setelah pengujian manual lulus, lanjut ke Tahap 2
(halaman siswa). Konfirmasi kepada pengembang untuk melanjutkan.
