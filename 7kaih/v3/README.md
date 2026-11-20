# Panduan Aplikasi Catatan Harian 7KAIH

**Gerakan Tujuh Kebiasaan Anak Indonesia Hebat** — aplikasi pengisian catatan harian untuk SMP berbasis Google Apps Script + Google Sheets, dengan frontend di GitHub Pages.

Tujuh kebiasaan resmi: **Bangun Pagi, Beribadah, Berolahraga, Makan Sehat dan Bergizi, Gemar Belajar, Bermasyarakat, Tidur Cepat**.

---

## Daftar Isi
1. [Ringkasan untuk Guru](#1-ringkasan-untuk-guru)
2. [Panduan Pemasangan](#2-panduan-pemasangan)
3. [Panduan Pemakaian per Peran](#3-panduan-pemakaian-per-peran)
4. [Pemeliharaan Berkala](#4-pemeliharaan-berkala)
5. [Daftar Uji](#5-daftar-uji)
6. [Skenario 672 Siswa Bergelombang](#6-skenario-672-siswa-bergelombang)
7. [Penanganan Masalah (Troubleshooting)](#7-penanganan-masalah-troubleshooting)
8. [Struktur File](#8-struktur-file)
9. [Keamanan & Performa](#9-keamanan--performa)

---

## 1. Ringkasan untuk Guru

Aplikasi ini menggantikan catatan harian kertas dari Buku Panduan Kemendikdasmen (jenjang SMP, Maret 2025). Semua data tersimpan di Google Sheets. Siswa mengisi harian via HP/web; wali kelas memantau & memberi paraf digital; admin mengelola seluruh pengaturan tanpa menyentuh kode; kepala sekolah/BK melihat dashboard.

Empat peran: **Admin Utama**, **Wali Kelas**, **Siswa**, **Pembaca (Kepsek/BK)**.

Aplikasi dipakai bertahun-tahun tanpa dibuat ulang: hal yang berubah tiap tahun (tahun ajaran, kelas, wali, form, kriteria) diatur dari menu admin. Data tahun lama diarsipkan supaya aplikasi tetap cepat.

---

## 2. Panduan Pemasangan

### Bagian 1 — Database (Google Sheet)
1. Buka <https://sheets.google.com> > klik **+ (Blank)** > beri nama `Database 7KAIH`.
2. Di spreadsheet, klik **Ekstensi > Apps Script**. Terbuka editor Apps Script.

### Bagian 2 — Kode Apps Script
3. Hapus isi `Code.gs`. Buat file (klik **+ > Script** untuk `.gs`, **+ > HTML** untuk `.html`) dengan nama dan isi sebagai berikut:
   - `Constants.gs` — konstanta, peran, pengaturan bawaan, whitelist aksi.
   - `Utils.gs` — tanggal WIB, hash PIN, sanitasi, validasi, normalisasi tanggal.
   - `Cache.gs` — cache + akses sheet + baca pengaturan.
   - `Lock.gs` — LockService non-fatal.
   - `Auth.gs` — sesi, login, ganti PIN, batasi percobaan.
   - `Setup.gs` — `setupDatabase()`, data bawaan, akun/tahun uji, pembersih duplikat.
   - `Router.gs` — doGet/doPost/apiRoute, whitelist, handler dasar, menu.
   - `Siswa.gs` — aksi siswa (isi, kalender, ringkasan, refleksi, stiker, definisi).
   - `Wali.gs` — aksi wali (kelola siswa, pemantauan, paraf, rekap, catatan).
   - `Admin.gs` — aksi admin (pengaturan, tahun/kelas/form/akun/naik kelas/pengumuman/lihat/log).
   - `Ekspor.gs` — ekspor xlsx Lampiran 3 + shared rekap.
   - `Dashboard.gs` — dashboard sekolah + aksi pembaca.
   - `Backup.gs` — backup harian + pengarsipan tahun ajaran.
4. **Project Settings** (roda gigi) > centang **Show appsscript.json manifest file in editor** > buka `appsscript.json` > pastikan:
   ```json
   {
     "timeZone": "Asia/Jakarta",
     "runtimeVersion": "V8",
     "webApp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE" },
     "exceptionLogging": "STACKDRIVER"
   }
   ```
5. Pilih fungsi **`setupDatabase`** di dropdown > **Run** > **Review permissions** > pilih akun Google Anda > **Allow**. Akan muncul dialog dengan **PIN admin awal: `123456`** (wajib ganti saat login pertama). Cek spreadsheet: 13 sheet terbuat, pengaturan terisi, 7 kebiasaan + form bawaan ada.
6. (Opsional, untuk uji) Jalankan **`buatAkunTes`** (akun wali/pembaca/siswa uji) dan **`buatTahunAjaranTes`** (tahun aktif uji).
7. Jalankan **`authorizeEkspor`** sekali untuk mengotorisasi ekspor xlsx (izin `UrlFetchApp` + `DriveApp`).

### Bagian 3 — Deploy web app
8. **Deploy > New deployment** > ikon roda gigi > **Web app**. Isi:
   - **Description**: `7KAIH`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
   - Klik **Deploy**. Salin **URL web app** (akhiran `/exec`).
   - Setiap kali menambah layanan baru (mis. setelah Tahap 6 ekspor), buat **versi deployment baru** agar izin baru berlaku.

### Bagian 4 — Frontend (GitHub Pages)
9. Buat repository GitHub (Public), mis. `catatan-7kaih`. Unggah file:
   - `index.html`, `style.css`, `config.js`
   - `app.js`, `siswa.js`, `wali.js`, `admin.js`, `pembaca.js`
   - `PANDUAN.md` (file ini), `README.md`
10. **Settings > Pages** > **Source**: Deploy from a branch > **Branch**: `main` / `/ (root)` > **Save**. Tunggu ~1 menit. URL: `https://USER.github.io/catatan-7kaih/`.
11. Buka `config.js` di GitHub (ikon pensil) > ganti `PASTE_URL_EXEC_ANDA_DI_SINI` dengan **URL web app** dari langkah 8 > **Commit**.
12. (Opsional, domain sendiri) **Settings > Pages > Custom domain** > ketik domain (mis. `catanan.sekolahku.sch.id`) > **Save**. Tambah record DNS:
    - Subdomain: **CNAME**, Name `catatan`, Target `USER.github.io`.
    - Domain akar: 4 **A records**: `185.199.108.153`, `.109.153`, `.110.153`, `.111.153`.
    - Tunggu HTTPS aktif, centang **Enforce HTTPS**.
13. Di sheet **Pengaturan**, isi kunci `URL_FRONTEND` dengan alamat domain Anda. **Deploy ulang** web app agar `doGet` mengalihkan URL Apps Script ke domain Anda.

### Bagian 5 — Mulai pakai
14. Buka domain Anda > login admin (`admin` / `123456`) > ganti PIN saat diminta.
15. Atur: **Identitas Sekolah**, **Tahun Ajaran**, **Kelas & Wali**, **Form 7 Kebiasaan** (bila perlu), **Kriteria & Aturan**, **Akun** (tambah wali/pembaca).
16. Wali login > **Kelola Siswa** (tambah/impor).
17. Siswa login dengan **NISN + PIN awal** (6 digit terakhir NISN) > ganti PIN > mulai mengisi.

---

## 3. Panduan Pemakaian per Peran

### Siswa (HP)
- **Isi Hari Ini**: pilih tanggal (hari ini atau maks 2 hari ke belakang) > tandai 7 kebiasaan ✓ Sudah / ✗ Belum > isi **jam bangun** & **jam tidur** > centang **Diketahui orang tua** > **Simpan**.
- **Kalender Bulanan**: lihat rekap v/x per tanggal, jam bangun/tidur, jumlah paraf.
- **Ringkasan Bulan**: kategori Sudah/Belum Terbiasa per kebiasaan + rata-rata durasi tidur.
- **Refleksi Bulanan**: isi kesimpulan & tindak lanjut per kebiasaan bersama orang tua di akhir bulan.
- **Definisi 7 Kebiasaan**: ringkasan panduan resmi.
- **Stiker**: lengkapi 7 kebiasaan ✓ hari ini → stiker muncul; berturut-turut menambah rentetan.
- Lupa PIN? Hubungi wali kelas/admin untuk direset.

### Wali Kelas
- **Kelola Siswa**: tambah satu per satu atau **impor massal** (`NISN,Nama,L/P` per baris). **Edit** (modal: NISN/Nama/L/P), **Reset PIN**, **Nonaktifkan**.
- **Pemantauan Hari Ini**: daftar belum mengisi & perlu perhatian (3 hari kosong / kurang tidur). Nada mendukung.
- **Validasi (Paraf)**: pilih siswa + tanggal > tandai paraf per kebiasaan; atau **Paraf Massal** untuk rentang tanggal (hanya kebiasaan yang sudah dilakukan/v).
- **Rekap Bulanan**: matriks siswa × 7 kebiasaan (jumlah hari), kategori, catatan wali per siswa, **Unduh xlsx** (Lampiran 3).
- **Refleksi Siswa**: lihat refleksi siswa per bulan (read-only).

### Admin Utama
- **Dashboard**: rekap sekolah (isi hari ini, rata-rata per kebiasaan, per kelas).
- **Identitas Sekolah**: nama, NPSN, kota, provinsi, kepala sekolah + NIP, nama aplikasi, sambutan, warna tema, logo, URL frontend.
- **Tahun Ajaran & Libur**: buat tahun aktif, tambah libur, **Arsipkan & Pindah Data** tahun lama.
- **Kelas & Wali**: tambah kelas, assign wali, atur **jadwal buka-tutup pengisian per kelas** (bergelombang).
- **Form 7 Kebiasaan**: ubah nama/urutan/aktif kebiasaan & isian, tambah isian. Versi form baru otomatis; data lama tetap terbaca.
- **Kriteria & Aturan**: rentang bangun pagi, durasi tidur ideal, ambang "Sudah Terbiasa", batas hari mundur, hari dihitung, wajib/opsional ortu & refleksi.
- **Akun & Keamanan**: tambah/edit (modal) admin/wali/pembaca, reset PIN, nonaktifkan, lihat **Log Aktivitas**.
- **Naik Kelas**: 3 tools — (1) Luluskan Kelas 9, (2) Naik Otomatis 7A→8A, (3) Atur Ulang via impor `NISN,Kelas Baru` (untuk sekolah yang mengacak).
- **Pengumuman**: tambah/aktifkan/nonaktifkan → tampil di beranda siswa.
- **Ekspor xlsx**: unduh per kelas (3 lembar: Rekap Lampiran 3 + Kategori + Data Harian) atau semua kelas (satu sheet per kelas + Ringkasan Sekolah).
- **Backup**: atur folder Drive, retensi, **Aktifkan Backup Harian** (pukul ~02:00 WIB).
- **Lihat sebagai Wali**: buka tampilan wali untuk kelas mana pun; tombol **Kembali ke Admin**.
- **Log Aktivitas**: 60 aktivitas terbaru.

### Pembaca (Kepsek/BK)
- **Dashboard**: rekap sekolah (read-only).
- **Rekap Kelas**: pilih kelas + bulan > lihat rekap & unduh xlsx. Tidak mengubah data.

---

## 4. Pemeliharaan Berkala

- **Awal tahun ajaran**: buat tahun ajaran baru (set aktif) > buat/atur kelas & wali > **Naik Kelas** > wali tambah/impor siswa baru.
- **Harian**: wali pemantauan + paraf; admin cek dashboard bila perlu.
- **Bulanan**: wali unduh xlsx Lampiran 3; admin cek dashboard & ekspor semua kelas bila diminta dinas.
- **Akhir tahun ajaran**: **Tahun Ajaran > Arsipkan & Pindah Data** (data jurnal/refleksi tahun itu pindah ke spreadsheet arsip, database aktif kembali ringan). Simpan URL arsip di tempat aman.
- **Backup**: pastikan **Backup Harian** aktif. Cek folder Drive secara berkala. Bila perlu pemulihan, buka backup terbaru, salin data ke database aktif (manual).
- **Penghapusan uji**: setelah pakai sungguhan, hapus akun uji (`wali`/`kepsek`/`1234567890`) dan fungsi `buatAkunTes`/`buatTahunAjaranTes`/`authorizeEkspor` bila tidak dipakai.

---

## 5. Daftar Uji

### A. Fungsional dasar
- [ ] Login semua peran; PIN awal wajib diganti saat login pertama.
- [ ] Login gagal 5× → akun terkunci 5 menit.
- [ ] Refresh halaman → tetap login (tidak berkedip ke login).
- [ ] Token tidak di URL; sesi berakhir 8 jam.

### B. Siswa
- [ ] Isi 7 kebiasaan + jam bangun/tidur + centang ortu → Simpan → refresh → data tetap.
- [ ] Tidak bisa isi tanggal depan / >2 hari ke belakang.
- [ ] Stiker muncul saat 7 kebiasaan ✓; rentetan naik bila berurutan.
- [ ] Kalender, Ringkasan, Refleksi, Definisi tampil benar.
- [ ] Simpan ulang hari sama → 1 baris (tidak dobel).

### C. Wali kelas
- [ ] Tambah/impor siswa; edit (modal); reset PIN; nonaktifkan.
- [ ] Pemantauan: belum isi & perlu perhatian tampil.
- [ ] Paraf per kebiasaan (toggle) + paraf massal rentang tanggal.
- [ ] Rekap + catatan wali + unduh xlsx.

### D. Admin utama
- [ ] Identitas, kriteria, aturan tersimpan & berdampak.
- [ ] Tahun ajaran + libur; kelas + wali + jadwal.
- [ ] Form builder → versi baru; data lama tetap terbaca.
- [ ] Akun staff (modal edit); Naik Kelas (3 tools); Pengumuman tampil di siswa.
- [ ] Dashboard; Ekspor per kelas & semua kelas; Lihat sebagai wali (label kelas); Log.
- [ ] Backup: isi folder ID → Simpan → Backup Sekarang → file muncul di folder Drive + URL ditampilkan.
- [ ] Aktifkan Backup Harian → status Aktif (cek editor: `triggerBackupAktif()` → true).

### E. Pengarsipan
- [ ] Admin > Tahun Ajaran > Arsipkan & Pindah Data → data tahun itu pindah ke spreadsheet arsip (URL ditampilkan); sheet aktif berkurang; tahun bertanda Arsip.

### F. Ekspor xlsx
- [ ] Wali/Pembaca/Admin unduh → berkas `.xlsx` (Lampiran 3 + Kategori + Data Harian).
- [ ] Format Lampiran 3: identitas sekolah, tabel 7 kolom + Catatan, blok tanda tangan kepala sekolah & wali kelas dengan NIP.

### G. Keamanan
- [ ] Wali A tidak bisa akses siswa kelas wali B.
- [ ] Pembaca tidak bisa memanggil aksi admin/wali.
- [ ] Siswa tidak bisa aksi wali/admin.
- [ ] Log aktivitas mencatat aksi admin/wali.

---

## 6. Skenario 672 Siswa Bergelombang

Batas Apps Script: **30 eksekusi bersamaan** per pengguna, **6 menit** per eksekusi. Untuk 672 siswa, gunakan pengisian bergelombang:

1. Siapkan ~18 kelas (mis. 7A–7F, 8A–8F, 9A–9F), ~37 siswa/kelas (total 672). Impor massal per kelas.
2. Admin atur **jadwal buka-tutup per kelas** (menu Kelas & Wali) agar bergelombang, mis.:
   - 7A: 06:00–06:30
   - 7B: 06:30–07:00
   - 7C: 07:00–07:30
   - … dan seterusnya.
   Sehingga tidak ada 30 siswa mengisi pada detik yang sama.
3. Uji: minta semua siswa mengisi pada jendela masing-masing. Verifikasi:
   - Tidak ada error "Sistem sibuk" (LockService non-fatal menangani lonjakan).
   - Semua 672 baris tersimpan di sheet `Jurnal` (cek jumlah baris di sheet).
   - Rekap & dashboard hitung benar.
   - Ekspor "semua kelas" selesai < 6 menit (bila lebih, gunakan ekspor per kelas).
4. Setelah tahun selesai: **Arsipkan & Pindah Data** tahun itu → database aktif kembali ringan → pengisian tahun baru tetap cepat.

**Tips performa:**
- `getJurnalsBySiswaIds` baca sheet sekali per aksi. Bila data sangat besar (multiple tahun tidak diarsip), pertimbangkan arsip berkala.
- Ekspor "semua kelas" untuk data ekstrem bisa mendekati 6 menit — gunakan per kelas bila perlu.
- Backup harian menjaga pemulihan cepat bila ada kerusakan data.

---

## 7. Penanganan Masalah (Troubleshooting)

### Login gagal / "Sesi berakhir"
- Cek apakah sesi sudah >8 jam → login ulang.
- Cek apakah akun dikunci (5× gagal) → tunggu 5 menit atau admin reset PIN.
- Cek apakah akun dinonaktifkan → admin aktifkan kembali.

### Pengisian siswa "hilang" setelah refresh
- Pastikan tanggal di sheet `Jurnal` tersimpan sebagai teks (normalisasi `normTanggal` menangani konversi otomatis oleh Sheets).
- Jalankan **`bersihkanJurnalGanda`** (menu 7KAIH > Bersihkan Jurnal Ganda) bila ada baris dobel.
- Pastikan tahun ajaran aktif (admin > Tahun Ajaran).

### Ekspor xlsx gagal: "tidak memiliki izin untuk memanggil UrlFetchApp"
- Jalankan fungsi **`authorizeEkspor`** dari editor Apps Script > otorisasi izin baru (UrlFetchApp + DriveApp).
- Buat **deployment versi baru** (Deploy > New deployment > Web app).

### Backup: notifikasi "berhasil" tapi file tidak muncul
- Pastikan **ID Folder** benar (bukan URL lengkap). Cara: buka folder di Drive, salin bagian URL setelah `/folders/`. Aplikasi otomatis mengekstrak ID dari URL, tetapi pastikan folder dapat diakses akun Google Anda.
- Tekan **Simpan Pengaturan** lagi — bila folder tidak ditemukan, akan muncul error (bukan "berhasil").
- Tekan **Backup Sekarang** — bila sukses, nama file + URL ditampilkan.
- Cek menu Backup: status "Folder: [nama folder]" → bila "belum diset / tidak ditemukan", perbaiki ID folder.

### "Sistem sibuk, coba beberapa saat lagi"
- LockService non-fatal: seharusnya jarang muncul. Bila muncul, tunggu beberapa detik lalu ulangi.
- Bila terus muncul, cek eksekusi tertahan di editor Apps Script (jalanan eksekusi) — hentikan bila ada yang macet.

### Naik Kelas salah
- **Sekolah yang mengacak kelas**: gunakan **Tool 3 (Atur Ulang via impor)** dengan pemetaan `NISN,Kelas Baru`, BUKAN Tool 2 (Naik Otomatis).
- **Selalu backup dulu** sebelum Naik Kelas massal.

### Tampilan masih bertema lama
- Pengaturan di-cache 10 menit. Jalankan **`clearPengaturanCache()`** di editor untuk paksa segar, atau tunggu.
- Untuk warna tema: frontend GitHub memakai `style.css` (tema biru muda). `WARNA_TEMA` di Pengaturan adalah referensi.

### Custom domain belum HTTPS
- Tunggu hingga 30 menit – 24 jam untuk sertifikat GitHub Pages. Centang **Enforce HTTPS** setelah aktif.

---

## 8. Struktur File

### Apps Script (sisi server, di editor)
```
Constants.gs   Utils.gs   Cache.gs   Lock.gs   Auth.gs
Setup.gs       Router.gs  Siswa.gs   Wali.gs   Admin.gs
Ekspor.gs      Dashboard.gs   Backup.gs
appsscript.json   (manifest, timeZone Asia/Jakarta)
```

### GitHub Pages (frontend, di repo)
```
index.html   style.css   config.js
app.js       siswa.js    wali.js    admin.js   pembaca.js
PANDUAN.md   README.md
```

### Sheet database (13 sheet)
`Pengaturan, TahunAjaran, Libur, Kelas, Akun, Siswa, Kebiasaan, FieldForm, VersiForm, Jurnal, Refleksi, Pengumuman, Log`

---

## 9. Keamanan & Performa

**Keamanan**
- PIN & kata sandi di-hash + salt (SHA-256 via `Utilities.computeDigest`).
- Sesi = token acak di CacheService (TTL 8 jam); token di body JSON, bukan URL.
- Server cek peran & kepemilikan data di setiap aksi (whitelist `ACTIONS`).
- Wajib ganti PIN saat login pertama (`harus_ganti_pin`).
- Batasi percobaan login (5× gagal → kunci 5 menit).
- Sanitasi semua input: anti injeksi formula Sheet (awalan `= + - @`), anti XSS (escape HTML).
- Data siswa minimal: NISN, nama, jenis kelamin, kelas. Tidak menyimpan agama. Isian Beribadah netral.
- Soft delete (nonaktif, bukan hapus). Log aktivitas admin/wali.

**Performa**
- Baca/tulis per blok (`getValues`/`setValues`), bukan per sel.
- CacheService untuk pengaturan (10 menit).
- LockService non-fatal pada penulisan (tidak memblokir siswa).
- Satu pemanggilan server per pengisian harian.
- Pengisian bergelombang per kelas (jadwal buka-tutup).
- Normalisasi tanggal/jam saat baca (tahan auto-konversi Sheets).
- Dedup baris baca (ambil `diubah` terbaru).
- Pengarsipan tahun ajaran: data lama pindah ke spreadsheet arsip → database aktif tetap kecil.
- Backup harian ke folder Drive (retensi default 30 hari).

**Zona waktu**: Asia/Jakarta. Tanggal dari server, bukan perangkat siswa.

---

## Penutup

Aplikasi ini bersifat **modular per tahap** dan dirancang awet bertahun-tahun. Semua hal yang berubah tiap tahun diatur dari menu admin (tanpa kode). Untuk penyesuaian format Lampiran 3 versi sekolah, kolom ekspor kustom, atau integrasi lain, hubungi pengembang.

Selamat memakai aplikasi Catatan Harian 7KAIH.
