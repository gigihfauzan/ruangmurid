# Panduan Penerapan Backend e-LKPD Interaktif (Google Sheet + Apps Script)

Panduan ini disusun khusus agar mudah diikuti oleh guru tanpa latar belakang pemrograman.

---

## Langkah 1: Menyiapkan Google Spreadsheet & Apps Script

1. Buka [Google Drive](https://drive.google.com) menggunakan akun Google guru.
2. Klik **+ Baru (New)** > **Google Spreadsheet (Google Sheets)** > **Spreadsheet kosong**.
3. Beri nama file Spreadsheet di pojok kiri atas, misalnya: `Database e-LKPD Matematika - SMPN 2 Kedungbanteng`.
4. Pada menu atas Spreadsheet, klik **Ekstensi (Extensions)** > **Apps Script**.
5. Hapus seluruh kode bawaan (`function myFunction() {}`) di dalam editor `Code.gs`.
6. Salin seluruh isi file `apps-script/Code.gs` dari proyek ini dan tempelkan ke editor `Code.gs`.
7. Klik ikon **Simpan (Save)** atau tekan `Ctrl + S`.

---

## Langkah 2: Menjalankan Instalasi Otomatis (`setup`)

1. Di bagian atas editor Apps Script, pastikan pilihan fungsi di sebelah tombol **Jalankan (Run)** bertuliskan `setup`.
2. Klik tombol **Jalankan (Run)**.
3. Akan muncul jendela **Otorisasi diperlukan (Authorization required)**:
   - Klik **Tinjau izin (Review permissions)**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Lanjutan (Advanced)** > **Buka ... (tidak aman) / Go to ... (unsafe)**.
   - Klik **Izinkan (Allow)** agar skrip dapat membuat tab Sheet dan folder Google Drive.
4. Kembali ke tab Google Spreadsheet Anda. Secara otomatis akan terbentuk 10 tab:
   - `Pengaturan`, `Kelas`, `Siswa`, `Sesi`, `Pengerjaan`, `Jawaban`, `Berkas`, `Nilai`, `Kunci`, dan `Log`.
5. **Penting – Mengganti Password Awal Guru:**
   - Password awal setelah `setup` adalah `GuruSMP2#2026`.
   - Anda dapat menggantinya langsung lewat Dashboard Guru nanti, atau sekarang melalui editor Apps Script dengan mengubah sementara parameter di fungsi `aturPasswordGuru` lalu menjalankannya.

---

## Langkah 3: Menerbitkan Aplikasi Web (Deploy Web App)

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Terapkan (Deploy)** > **Deployment baru (New deployment)**.
2. Klik ikon roda gigi di sebelah *Pilih jenis (Select type)*, lalu pilih **Aplikasi web (Web app)**.
3. Isi konfigurasi berikut dengan tepat:
   - **Deskripsi:** `Versi 1 - e-LKPD Matematika`
   - **Jalankan sebagai (Execute as):** **Saya (Me)** *(wajib, agar siswa tidak perlu izin akses langsung ke Sheet/Drive Anda)*
   - **Yang memiliki akses (Who has access):** **Siapa saja (Anyone)** *(wajib, agar halaman Netlify dapat terhubung)*
4. Klik **Terapkan (Deploy)**.
5. Salin **URL Aplikasi Web** yang berakhiran `/exec` (contoh: `https://script.google.com/macros/s/AKfycbx.../exec`). URL ini akan ditempelkan ke file `config.js` pada Tahap 2.

### Cara Memperbarui Kode di Kemudian Hari (Update Versi)
Jika suatu saat Anda mengubah kode di `Code.gs`, perubahan **tidak otomatis aktif** sebelum membuat versi deployment baru:
1. Klik **Terapkan (Deploy)** > **Kelola deployment (Manage deployments)**.
2. Klik ikon pensil (**Edit**) pada deployment yang aktif.
3. Pada dropdown **Versi (Version)**, pilih **Versi baru (New version)**.
4. Klik **Terapkan (Deploy)**. *(URL `/exec` tetap sama sehingga `config.js` tidak perlu diubah).*

---

## Struktur Tab Google Sheet

| Nama Tab | Fungsi Utama |
| :--- | :--- |
| **Pengaturan** | Menyimpan `lkpd_aktif`, `judul_lkpd`, `tenggat`, `akses_dibuka`, `skor_otomatis`, dan `tampilkan_skor_siswa`. |
| **Kelas** | Daftar kelas yang muncul di pilihan login siswa (bawaan: `VIII`). |
| **Siswa** | Identitas siswa, *hash* PIN terenkripsi, salt, status reset, dan penghitung kunci sementara. |
| **Sesi** | Token akses sementara untuk siswa dan guru. |
| **Pengerjaan** | Status pengerjaan tiap siswa per LKPD (`sedang` atau `terkumpul`), waktu mulai, dan waktu kumpul. |
| **Jawaban** | Jawaban teks maupun data terstruktur (tabel/pilihan/urutan) per soal. |
| **Berkas** | Metadata foto dan gambar kanvas siswa yang tersimpan aman di folder privat Google Drive. |
| **Nilai** | Skor dan komentar guru per soal maupun skor total (`__TOTAL__`). |
| **Kunci** | Kunci jawaban rahasia untuk fitur penilaian otomatis (tidak pernah dikirim ke browser siswa). |
| **Log** | Catatan aktivitas penting dan pencatatan galat server. |