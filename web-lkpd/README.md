<!-- ... existing code ... -->
| **Kunci** | Kunci jawaban rahasia untuk fitur penilaian otomatis (tidak pernah dikirim ke browser siswa). | 
| **Log** | Catatan aktivitas penting dan pencatatan galat server. | 

## Langkah 4: Menerbitkan Frontend Statis ke Netlify

1. Pastikan seluruh file proyek berada dalam satu folder yang rapi:
   - `index.html`, `guru.html`, `style.css`, `config.js`, `konten.js`, `konten-daftar.js`
   - Folder `js/` (`umum.js`, `api.js`, `gambar.js`, `foto.js`, `siswa.js`, `guru.js`, `unduh.js`)
   - Folder `apps-script/` (`Code.gs`) dan `README.md`
2. Buka `config.js` dan ganti `URL_WEB_APP` dengan URL `/exec` dari Langkah 3.
3. Masuk ke [Netlify](https://app.netlify.com) > **Add new site** > **Deploy manually (Drag & drop)**, lalu tarik folder proyek ke area unggah.
4. Netlify akan memberikan tautan situs aktif (contoh: `https://elkpd-smpn2-kedungbanteng.netlify.app`). Bagikan tautan ini kepada siswa, sedangkan tautan `https://.../guru.html` digunakan khusus oleh guru.

## Cara Menggunakan Ulang untuk Mapel, Kelas, atau Bab Baru

- **Mengganti Bab / Materi / Tema:** Cukup edit `konten.js` (ubah `meta`, `tema` warna & maskot, `bilahSimbol`, dan `bagian`/`blok`), lalu unggah ulang ke Netlify. Mesin di `js/siswa.js` akan otomatis menyesuaikan.
- **Mengaktifkan Multi-Bab:** Ubah `FITUR.MULTI_BAB: true` di `config.js`, tambahkan entri bab di `konten-daftar.js`, dan perbarui `lkpd_aktif` di tab **Pengaturan** pada Dashboard Guru.
- **Mengaktifkan Skor Otomatis:** Buka tab **Kunci Skor Otomatis** di Dashboard Guru untuk mengisi kunci jawaban, toleransi angka, dan bobot; lalu ubah **Skor Otomatis di Server** menjadi `YA` di tab **Pengaturan**.