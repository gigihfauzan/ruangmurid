/* ============================================================
 * js/siswa.js — Mesin utama halaman siswa
 * ============================================================
 * Mengatur alur: login → pengerjaan → kumpulkan → nilai.
 * TIDAK boleh berisi teks materi, nama bab, jumlah baris,
 * pilihan dropdown, atau teks materi — semuanya dari konten.js.
 *
 * Tipe soal didaftarkan via objek PENJENIS_SOAL. Untuk menambah
 * tipe baru, cukup daftarkan satu objek dengan metode:
 *   render(blok, wadah, ctx)        — render soal ke wadah
 *   ambilNilai(blok, wadah)         — ambil jawaban dari DOM
 *   sudahDiisi(blok, nilai)         — cek apakah sudah diisi
 *   isiNilaiAwal(blok, nilai, wadah) — isi dari jawaban tersimpan
 * tanpa mengubah alur utama.
 *
 * ctx = { pengerjaanId, token, onBerubah(idSoal), bersiarkanEdit }
 * ============================================================ */
(function () {
  'use strict';

  // Namespace mesin
  window.SISWA = {};
  const M = window.SISWA;

  // ============================================================
  // STATE APLIKASI
  // ============================================================
  const state = {
    sesi: null,                  // { token, peran, siswaId, nama, kelas }
    lkpd: null,                  // objek ELKPD dari konten.js
    pengerjaanId: null,
    statusPengerjaan: '',        // 'sedang' | 'terkumpul' | 'dinilai'
    revisiDibuka: false,
    jawaban: {},                 // { idSoal: { teks, data } }
    berkas: {},                  // { idSoal: [berkasMeta] }
    nilai: {},                   // { idSoal: { skor, komentar } }
    tampilkanNilai: false,
    bagianAktif: 0,              // index bagian yang ditampilkan
    perubahan: {},               // { idSoal: true } belum tersimpan
    simpanOtomatisTimer: null,
    kanvasInstance: {},          // { idSoal: instanceKanvas }
    fotoKomponen: {},            // { idSoal: instanceFoto }
    inputAktif: null,            // elemen input/textarea yang sedang fokus (untuk simbol)
    sedangMenyimpan: false,
    tersimpanOnline: true        // false jika ada cadangan offline belum sinkron
  };

  // ============================================================
  // REGISTRY TIPE SOAL
  // ============================================================
  // Setiap tipe punya: render, ambilNilai, sudahDiisi, isiNilaiAwal.
  // Menambah tipe baru = menambah entri di sini, tanpa ubah alur utama.
  const PENJENIS_SOAL = {

    // -------- teks_singkat --------
    'teks_singkat': {
      render: function (blok, wadah, ctx) {
        const input = UMUM.buatEl('input', {
          type: 'text', class: 'input-jawaban', 'data-id-soal': blok.id,
          placeholder: blok.placeholder || 'Tulis jawabanmu di sini...',
          autocomplete: 'off'
        });
        if (ctx.bersiarkanEdit) { input.disabled = true; }
        input.addEventListener('input', function () { ctx.onBerubah(blok.id); });
        input.addEventListener('focus', function () { state.inputAktif = input; });
        wadah.appendChild(input);
      },
      ambilNilai: function (blok, wadah) {
        const inp = wadah.querySelector('input[data-id-soal="' + blok.id + '"]');
        return { teks: inp ? inp.value : '', data: null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks && nilai.teks.trim());
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        const inp = wadah.querySelector('input[data-id-soal="' + blok.id + '"]');
        if (inp && nilai && nilai.teks) inp.value = nilai.teks;
      }
    },

    // -------- uraian --------
    'uraian': {
      render: function (blok, wadah, ctx) {
        const ta = UMUM.buatEl('textarea', {
          class: 'textarea-jawaban', 'data-id-soal': blok.id,
          rows: blok.baris || 4,
          placeholder: 'Tulis jawabanmu di sini...'
        });
        if (ctx.bersiarkanEdit) { ta.disabled = true; }
        ta.addEventListener('input', function () { ctx.onBerubah(blok.id); });
        ta.addEventListener('focus', function () { state.inputAktif = ta; });
        wadah.appendChild(ta);
      },
      ambilNilai: function (blok, wadah) {
        const ta = wadah.querySelector('textarea[data-id-soal="' + blok.id + '"]');
        return { teks: ta ? ta.value : '', data: null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks && nilai.teks.trim());
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        const ta = wadah.querySelector('textarea[data-id-soal="' + blok.id + '"]');
        if (ta && nilai && nilai.teks) ta.value = nilai.teks;
      }
    },

    // -------- pilihan_ganda --------
    'pilihan_ganda': {
      render: function (blok, wadah, ctx) {
        const grup = UMUM.buatEl('div', { class: 'pilihan-grup', role: 'radiogroup', 'aria-label': 'Pilihan jawaban' });
        const nama = 'pg_' + blok.id;
        const huruf = ['A', 'B', 'C', 'D', 'E', 'F'];
        (blok.pilihan || []).forEach(function (p, idx) {
          const id = nama + '_' + idx;
          const label = UMUM.buatEl('label', { class: 'pilihan-item', for: id });
          const radio = UMUM.buatEl('input', { type: 'radio', name: nama, id: id, value: huruf[idx], 'data-id-soal': blok.id, 'data-indeks': idx });
          if (ctx.bersiarkanEdit) { radio.disabled = true; }
          radio.addEventListener('change', function () { ctx.onBerubah(blok.id); });
          const teksPilihan = UMUM.buatEl('span', { class: 'pilihan-teks' });
          teksPilihan.appendChild(document.createTextNode(huruf[idx] + '. '));
          teksPilihan.appendChild(document.createTextNode(p));
          label.appendChild(radio);
          label.appendChild(teksPilihan);
          grup.appendChild(label);
        });
        wadah.appendChild(grup);
      },
      ambilNilai: function (blok, wadah) {
        const dipilih = wadah.querySelector('input[data-id-soal="' + blok.id + '"]:checked');
        return { teks: dipilih ? dipilih.value : '', data: dipilih ? { indeks: parseInt(dipilih.getAttribute('data-indeks'), 10) } : null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks);
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        if (!nilai || !nilai.teks) return;
        const radio = wadah.querySelector('input[data-id-soal="' + blok.id + '"][value="' + nilai.teks + '"]');
        if (radio) radio.checked = true;
      }
    },

    // -------- benar_salah --------
    'benar_salah': {
      render: function (blok, wadah, ctx) {
        const grup = UMUM.buatEl('div', { class: 'pilihan-grup bs-grup', role: 'radiogroup' });
        const nama = 'bs_' + blok.id;
        const opsi = [
          { val: 'benar', teks: '✅ Benar' },
          { val: 'salah', teks: '❌ Salah' }
        ];
        opsi.forEach(function (o) {
          const id = nama + '_' + o.val;
          const label = UMUM.buatEl('label', { class: 'pilihan-item', for: id });
          const radio = UMUM.buatEl('input', { type: 'radio', name: nama, id: id, value: o.val, 'data-id-soal': blok.id });
          if (ctx.bersiarkanEdit) { radio.disabled = true; }
          radio.addEventListener('change', function () { ctx.onBerubah(blok.id); });
          const span = UMUM.buatEl('span', { class: 'pilihan-teks', text: o.teks });
          label.appendChild(radio);
          label.appendChild(span);
          grup.appendChild(label);
        });
        wadah.appendChild(grup);
      },
      ambilNilai: function (blok, wadah) {
        const dipilih = wadah.querySelector('input[data-id-soal="' + blok.id + '"]:checked');
        return { teks: dipilih ? dipilih.value : '', data: null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks);
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        if (!nilai || !nilai.teks) return;
        const radio = wadah.querySelector('input[data-id-soal="' + blok.id + '"][value="' + nilai.teks + '"]');
        if (radio) radio.checked = true;
      }
    },

    // -------- isian_angka --------
    'isian_angka': {
      render: function (blok, wadah, ctx) {
        const bungkus = UMUM.buatEl('div', { class: 'isian-angka-bungkus' });
        const input = UMUM.buatEl('input', {
          type: 'number', class: 'input-jawaban input-angka', 'data-id-soal': blok.id,
          placeholder: 'Ketik angka...', inputmode: 'decimal', autocomplete: 'off'
        });
        if (ctx.bersiarkanEdit) { input.disabled = true; }
        input.addEventListener('input', function () { ctx.onBerubah(blok.id); });
        input.addEventListener('focus', function () { state.inputAktif = input; });
        bungkus.appendChild(input);
        if (blok.satuan) {
          bungkus.appendChild(UMUM.buatEl('span', { class: 'satuan', text: blok.satuan }));
        }
        wadah.appendChild(bungkus);
      },
      ambilNilai: function (blok, wadah) {
        const inp = wadah.querySelector('input[data-id-soal="' + blok.id + '"]');
        return { teks: inp ? inp.value : '', data: null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks && nilai.teks.trim() !== '');
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        const inp = wadah.querySelector('input[data-id-soal="' + blok.id + '"]');
        if (inp && nilai && nilai.teks) inp.value = nilai.teks;
      }
    },

    // -------- tabel_isian --------
    'tabel_isian': {
      render: function (blok, wadah, ctx) {
        const kolom = blok.kolom || [];
        const baris = blok.baris || [];
        const kolomIsian = blok.kolomIsian || [];
        const nilaiKolom = blok.nilaiKolom || {};

        const tabel = UMUM.buatEl('table', { class: 'tabel-isian' });
        // Header
        const thead = UMUM.buatEl('thead');
        const trHead = UMUM.buatEl('tr');
        kolom.forEach(function (k) {
          trHead.appendChild(UMUM.buatEl('th', { text: k }));
        });
        thead.appendChild(trHead);
        tabel.appendChild(thead);

        // Body
        const tbody = UMUM.buatEl('tbody');
        baris.forEach(function (barisItem, idxBaris) {
          const tr = UMUM.buatEl('tr');
          kolom.forEach(function (k, idxKolom) {
            const td = UMUM.buatEl('td');
            if (kolomIsian.indexOf(idxKolom) !== -1) {
              // Kolom isian siswa
              const input = UMUM.buatEl('input', {
                type: 'text', class: 'input-tabel', 'data-id-soal': blok.id,
                'data-baris': barisItem.id, 'data-kolom': idxKolom,
                placeholder: '...', autocomplete: 'off'
              });
              if (ctx.bersiarkanEdit) { input.disabled = true; }
              input.addEventListener('input', function () { ctx.onBerubah(blok.id); });
              input.addEventListener('focus', function () { state.inputAktif = input; });
              td.appendChild(input);
            } else if (nilaiKolom[idxKolom] && nilaiKolom[idxKolom][idxBaris] !== undefined) {
              // Kolom dengan nilai yang sudah ditentukan
              td.appendChild(document.createTextNode(String(nilaiKolom[idxKolom][idxBaris])));
            } else if (idxKolom === 0 && barisItem.label) {
              // Kolom pertama: label baris
              td.appendChild(document.createTextNode(barisItem.label));
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        tabel.appendChild(tbody);
        wadah.appendChild(tabel);
      },
      ambilNilai: function (blok, wadah) {
        const sel = {};
        UMUM.qsa('input.input-tabel[data-id-soal="' + blok.id + '"]', wadah).forEach(function (inp) {
          const b = inp.getAttribute('data-baris');
          const k = inp.getAttribute('data-kolom');
          sel[b + '_' + k] = inp.value;
        });
        return { teks: '', data: { sel: sel } };
      },
      sudahDiisi: function (blok, nilai) {
        if (!nilai || !nilai.data || !nilai.data.sel) return false;
        const sel = nilai.data.sel;
        for (const k in sel) {
          if (sel.hasOwnProperty(k) && sel[k] && String(sel[k]).trim()) return true;
        }
        return false;
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        if (!nilai || !nilai.data || !nilai.data.sel) return;
        UMUM.qsa('input.input-tabel[data-id-soal="' + blok.id + '"]', wadah).forEach(function (inp) {
          const b = inp.getAttribute('data-baris');
          const k = inp.getAttribute('data-kolom');
          const v = nilai.data.sel[b + '_' + k];
          if (v !== undefined) inp.value = v;
        });
      }
    },

    // -------- menjodohkan (dropdown) --------
    'menjodohkan': {
      render: function (blok, wadah, ctx) {
        const tabel = UMUM.buatEl('table', { class: 'tabel-jodoh' });
        const thead = UMUM.buatEl('thead');
        const tr = UMUM.buatEl('tr');
        tr.appendChild(UMUM.buatEl('th', { text: 'Soal' }));
        tr.appendChild(UMUM.buatEl('th', { text: 'Pilihan Jawaban' }));
        thead.appendChild(tr);
        tabel.appendChild(thead);
        const tbody = UMUM.buatEl('tbody');
        (blok.item || []).forEach(function (it) {
          const trBody = UMUM.buatEl('tr');
          const tdKiri = UMUM.buatEl('td', { class: 'jodoh-kiri' });
          tdKiri.appendChild(document.createTextNode(it.kiri));
          const tdKanan = UMUM.buatEl('td', { class: 'jodoh-kanan' });
          const select = UMUM.buatEl('select', { class: 'select-jodoh', 'data-id-soal': blok.id, 'data-item': it.id });
          select.appendChild(UMUM.buatEl('option', { value: '', text: '-- pilih --' }));
          (it.pilihan || []).forEach(function (p) {
            select.appendChild(UMUM.buatEl('option', { value: p, text: p }));
          });
          if (ctx.bersiarkanEdit) { select.disabled = true; }
          select.addEventListener('change', function () { ctx.onBerubah(blok.id); });
          tdKanan.appendChild(select);
          trBody.appendChild(tdKiri);
          trBody.appendChild(tdKanan);
          tbody.appendChild(trBody);
        });
        tabel.appendChild(tbody);
        wadah.appendChild(tabel);
      },
      ambilNilai: function (blok, wadah) {
        const pasangan = {};
        UMUM.qsa('select.select-jodoh[data-id-soal="' + blok.id + '"]', wadah).forEach(function (sel) {
          pasangan[sel.getAttribute('data-item')] = sel.value;
        });
        return { teks: '', data: { pasangan: pasangan } };
      },
      sudahDiisi: function (blok, nilai) {
        if (!nilai || !nilai.data || !nilai.data.pasangan) return false;
        const p = nilai.data.pasangan;
        for (const k in p) {
          if (p.hasOwnProperty(k) && p[k]) return true;
        }
        return false;
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        if (!nilai || !nilai.data || !nilai.data.pasangan) return;
        UMUM.qsa('select.select-jodoh[data-id-soal="' + blok.id + '"]', wadah).forEach(function (sel) {
          const v = nilai.data.pasangan[sel.getAttribute('data-item')];
          if (v) sel.value = v;
        });
      }
    },

    // -------- urutkan --------
    'urutkan': {
      render: function (blok, wadah, ctx) {
        const list = UMUM.buatEl('ol', { class: 'list-urut', 'data-id-soal': blok.id });
        // Urutan awal: pakai urutanAwal jika ada, jika tidak pakai urutan item.
        const urutanAwal = (blok.urutanAwal && blok.urutanAwal.length)
          ? blok.urutanAwal.slice()
          : (blok.item || []).map(function (i) { return i.id; });
        const itemMap = {};
        (blok.item || []).forEach(function (i) { itemMap[i.id] = i; });

        // Fungsi render ulang list berdasarkan urutan aktif (disimpan di list._urutan)
        function renderList() {
          const urutan = list._urutan;
          UMUM.kosongkan(list);
          urutan.forEach(function (idItem, idx) {
            const it = itemMap[idItem];
            if (!it) return;
            const li = UMUM.buatEl('li', { class: 'item-urut', 'data-id-item': idItem });
            li.appendChild(UMUM.buatEl('span', { class: 'urut-nomor', text: String(idx + 1) }));
            li.appendChild(UMUM.buatEl('span', { class: 'urut-teks', text: it.teks }));
            const grupBtn = UMUM.buatEl('div', { class: 'urut-tombol' });
            const btnNaik = UMUM.buatEl('button', { type: 'button', class: 'tombol-kecil', 'aria-label': 'Naikkan urutan', text: '▲' });
            btnNaik.disabled = idx === 0 || ctx.bersiarkanEdit;
            btnNaik.addEventListener('click', function () {
              if (idx > 0) {
                const tmp = urutan[idx - 1];
                urutan[idx - 1] = urutan[idx];
                urutan[idx] = tmp;
                renderList();
                ctx.onBerubah(blok.id);
              }
            });
            const btnTurun = UMUM.buatEl('button', { type: 'button', class: 'tombol-kecil', 'aria-label': 'Turunkan urutan', text: '▼' });
            btnTurun.disabled = idx === urutan.length - 1 || ctx.bersiarkanEdit;
            btnTurun.addEventListener('click', function () {
              if (idx < urutan.length - 1) {
                const tmp = urutan[idx + 1];
                urutan[idx + 1] = urutan[idx];
                urutan[idx] = tmp;
                renderList();
                ctx.onBerubah(blok.id);
              }
            });
            grupBtn.appendChild(btnNaik);
            grupBtn.appendChild(btnTurun);
            li.appendChild(grupBtn);
            list.appendChild(li);
          });
        }

        // Inisialisasi urutan aktif
        list._urutan = urutanAwal.slice();
        renderList();
        wadah.appendChild(list);
      },
      ambilNilai: function (blok, wadah) {
        const list = wadah.querySelector('ol.list-urut[data-id-soal="' + blok.id + '"]');
        const urutan = [];
        if (list && list._urutan) {
          urutan.push.apply(urutan, list._urutan);
        } else {
          UMUM.qsa('.item-urut', list).forEach(function (li) {
            urutan.push(li.getAttribute('data-id-item'));
          });
        }
        return { teks: '', data: { urutan: urutan } };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.data && nilai.data.urutan && nilai.data.urutan.length > 0);
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        // Ganti urutan aktif dengan urutan tersimpan, lalu render ulang.
        if (!nilai || !nilai.data || !nilai.data.urutan) return;
        const list = wadah.querySelector('ol.list-urut[data-id-soal="' + blok.id + '"]');
        if (!list) return;
        list._urutan = nilai.data.urutan.slice();
        // Render ulang manual (karena renderList tertutup di render()).
        const itemMap = {};
        (blok.item || []).forEach(function (i) { itemMap[i.id] = i; });
        const urutan = list._urutan;
        UMUM.kosongkan(list);
        urutan.forEach(function (idItem, idx) {
          const it = itemMap[idItem];
          if (!it) return;
          const li = UMUM.buatEl('li', { class: 'item-urut', 'data-id-item': idItem });
          li.appendChild(UMUM.buatEl('span', { class: 'urut-nomor', text: String(idx + 1) }));
          li.appendChild(UMUM.buatEl('span', { class: 'urut-teks', text: it.teks }));
          // Tombol nonaktif (edit dikunci sesuai status pengerjaan saat ini)
          const kunci = state.statusPengerjaan === 'terkumpul' && !state.revisiDibuka;
          const grupBtn = UMUM.buatEl('div', { class: 'urut-tombol' });
          const btnNaik = UMUM.buatEl('button', { type: 'button', class: 'tombol-kecil', 'aria-label': 'Naikkan urutan', text: '▲' });
          btnNaik.disabled = idx === 0 || kunci;
          btnNaik.addEventListener('click', function () {
            if (idx > 0) {
              const tmp = urutan[idx - 1];
              urutan[idx - 1] = urutan[idx];
              urutan[idx] = tmp;
              list._urutan = urutan;
              // Render ulang sederhana
              nilai.data.urutan = urutan.slice();
              PENJENIS_SOAL['urutkan'].isiNilaiAwal(blok, nilai, wadah);
              if (state.sesi) padaJawabanBerubah(blok.id);
            }
          });
          const btnTurun = UMUM.buatEl('button', { type: 'button', class: 'tombol-kecil', 'aria-label': 'Turunkan urutan', text: '▼' });
          btnTurun.disabled = idx === urutan.length - 1 || kunci;
          btnTurun.addEventListener('click', function () {
            if (idx < urutan.length - 1) {
              const tmp = urutan[idx + 1];
              urutan[idx + 1] = urutan[idx];
              urutan[idx] = tmp;
              list._urutan = urutan;
              nilai.data.urutan = urutan.slice();
              PENJENIS_SOAL['urutkan'].isiNilaiAwal(blok, nilai, wadah);
              if (state.sesi) padaJawabanBerubah(blok.id);
            }
          });
          grupBtn.appendChild(btnNaik);
          grupBtn.appendChild(btnTurun);
          li.appendChild(grupBtn);
          list.appendChild(li);
        });
      }
    },

    // -------- kanvas --------
    'kanvas': {
      render: function (blok, wadah, ctx) {
        const wadahKanvas = UMUM.buatEl('div', { class: 'kanvas-wadah' });
        const nilaiAwal = state.jawaban[blok.id] && state.jawaban[blok.id].data && state.jawaban[blok.id].data.gambar
          ? state.jawaban[blok.id].data.gambar : null;
        const inst = GAMBAR.buat(wadahKanvas, { latar: blok.latar || 'polos', nilaiAwal: nilaiAwal });
        state.kanvasInstance[blok.id] = inst;
        // Simpan gambar saat ada perubahan (debounce)
        const simpan = UMUM.debounce(function () {
          ctx.onBerubah(blok.id);
        }, 500);
        // Pasang listener perubahan pada canvas inst (cek berkala sederhana)
        // Karena gambar.js tidak punya event change, kita andalkan tombol simpan manual + simpan otomatis global.
        wadah.appendChild(wadahKanvas);
      },
      ambilNilai: function (blok, wadah) {
        const inst = state.kanvasInstance[blok.id];
        if (!inst) return { teks: '', data: null };
        const gambar = inst.ambilGambar();
        return { teks: '', data: { gambar: gambar } };
      },
      sudahDiisi: function (blok, nilai) {
        // Hanya mengandalkan instance kanvas (riwayat aksi menggambar).
        // Jangan pakai fallback nilai.data.gambar karena ambilNilai selalu
        // menghasilkan data URL (termasuk latar kosong).
        const inst = state.kanvasInstance[blok.id];
        if (inst && inst.sudahDiisi()) return true;
        return false;
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        const inst = state.kanvasInstance[blok.id];
        if (inst && nilai && nilai.data && nilai.data.gambar) {
          inst.isiNilaiAwal(nilai.data.gambar);
        }
      }
    },

    // -------- foto --------
    'foto': {
      render: function (blok, wadah, ctx) {
        const inst = FOTO.buatKomponen(wadah, {
          idSoal: blok.id,
          pengerjaanId: state.pengerjaanId,
          token: state.sesi ? state.sesi.token : null,
          sudahAda: state.berkas[blok.id] || [],
          onBerubah: function () { ctx.onBerubah(blok.id); }
        });
        state.fotoKomponen[blok.id] = inst;
      },
      ambilNilai: function (blok, wadah) {
        // Foto disimpan sebagai berkas terpisah di server, bukan di jawaban.
        // Namun kita catat jumlah berkas agar bisa dipakai untuk cek sudahDiisi.
        const inst = state.fotoKomponen[blok.id];
        return { teks: '', data: { jumlah: inst ? inst.ambilState().length : 0 } };
      },
      sudahDiisi: function (blok, nilai) {
        const inst = state.fotoKomponen[blok.id];
        if (inst && inst.sudahDiisi()) return true;
        // Fallback: cek daftar berkas di state
        const berkas = state.berkas[blok.id] || [];
        return berkas.length > 0;
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        // Berkas dimuat saat muatPekerjaan & sudah di-render via sudahAda.
        // Tidak ada aksi tambahan.
      }
    },

    // -------- skala_refleksi (emoji) --------
    'skala_refleksi': {
      render: function (blok, wadah, ctx) {
        const grup = UMUM.buatEl('div', { class: 'skala-grup', role: 'radiogroup', 'aria-label': 'Skala refleksi' });
        const nama = 'skala_' + blok.id;
        (blok.skala || []).forEach(function (s) {
          const id = nama + '_' + s.nilai;
          const label = UMUM.buatEl('label', { class: 'skala-item', for: id });
          const radio = UMUM.buatEl('input', { type: 'radio', name: nama, id: id, value: String(s.nilai), 'data-id-soal': blok.id });
          if (ctx.bersiarkanEdit) { radio.disabled = true; }
          radio.addEventListener('change', function () { ctx.onBerubah(blok.id); });
          const emoji = UMUM.buatEl('span', { class: 'skala-emoji', text: s.emoji, 'aria-hidden': 'true' });
          const lbl = UMUM.buatEl('span', { class: 'skala-label', text: s.label });
          label.appendChild(radio);
          label.appendChild(emoji);
          label.appendChild(lbl);
          grup.appendChild(label);
        });
        wadah.appendChild(grup);
      },
      ambilNilai: function (blok, wadah) {
        const dipilih = wadah.querySelector('input[data-id-soal="' + blok.id + '"]:checked');
        return { teks: dipilih ? dipilih.value : '', data: null };
      },
      sudahDiisi: function (blok, nilai) {
        return !!(nilai && nilai.teks);
      },
      isiNilaiAwal: function (blok, nilai, wadah) {
        if (!nilai || !nilai.teks) return;
        const radio = wadah.querySelector('input[data-id-soal="' + blok.id + '"][value="' + nilai.teks + '"]');
        if (radio) radio.checked = true;
      }
    }
  };

  // ============================================================
  // INIT & APLIKASI TEMA
  // ============================================================

  /** Menerapkan tema dari konten.js ke variabel CSS. */
  function terapkanTema() {
    const t = state.lkpd.tema || {};
    const root = document.documentElement;
    if (t.warnaUtama) root.style.setProperty('--warna-utama', t.warnaUtama);
    if (t.warnaUtamaGelap) root.style.setProperty('--warna-utama-gelap', t.warnaUtamaGelap);
    if (t.warnaAksen) root.style.setProperty('--warna-aksen', t.warnaAksen);
    if (t.warnaAksenGelap) root.style.setProperty('--warna-aksen-gelap', t.warnaAksenGelap);
    if (t.warnaLatar) root.style.setProperty('--warna-latar', t.warnaLatar);
    if (t.warnaKartu) root.style.setProperty('--warna-kartu', t.warnaKartu);
    if (t.warnaTeks) root.style.setProperty('--warna-teks', t.warnaTeks);
    if (t.warnaTeksLemah) root.style.setProperty('--warna-teks-lemah', t.warnaTeksLemah);
    if (t.warnaSukses) root.style.setProperty('--warna-sukses', t.warnaSukses);
    if (t.warnaBahaya) root.style.setProperty('--warna-bahaya', t.warnaBahaya);
    if (t.warnaInfo) root.style.setProperty('--warna-info', t.warnaInfo);
    if (t.fontJudul) root.style.setProperty('--font-judul', t.fontJudul);
    if (t.fontIsi) root.style.setProperty('--font-isi', t.fontIsi);
    if (t.fontMath) root.style.setProperty('--font-math', t.fontMath);
  }

  /** Inisialisasi aplikasi saat DOM siap. */
  function init() {
    state.lkpd = window.ELKPD;
    terapkanTema();
    // Update judul halaman
    document.title = state.lkpd.meta.judul + ' — ' + state.lkpd.meta.sekolah;
    // Isi teks header login dari konten.js (tidak ada teks materi tertanam)
    isiHeaderLogin();

    // Cek sesi tersimpan
    const sesi = UMUM.lsBaca('sesi');
    if (sesi && sesi.token && sesi.lkpdId === state.lkpd.meta.id) {
      state.sesi = sesi;
      // Coba muat pekerjaan dengan token yang ada
      muatPekerjaanLanjut();
    } else {
      tampilLayar('layar-login');
      isiDropdownKelas();
    }

    // Pasang event listener global
    pasangEventListener();
    // Pasang deteksi online/offline
    UMUM.saStatusBerubah(function(online) {
      if (online) {
        UMUM.toast('Kembali online. Menyinkronkan...', 'sukses');
        sinkronkanCadangan();
      } else {
        UMUM.toast('Kamu offline. Jawaban disimpan lokal dulu.', 'peringatan');
      }
    });
  }

  /** Mengisi dropdown kelas dari konfigurasi. */
  function isiDropdownKelas() {
    const sel = UMUM.el('login-kelas');
    if (!sel) return;
    UMUM.kosongkan(sel);
    sel.appendChild(UMUM.buatEl('option', { value: '', text: '-- Pilih Kelas --' }));
    (state.lkpd.daftarKelas || []).forEach(function (k) {
      sel.appendChild(UMUM.buatEl('option', { value: k, text: k }));
    });
  }

  /** Mengisi teks header halaman login dari konten.js (tidak ada teks tertanam di HTML). */
  function isiHeaderLogin() {
    const meta = state.lkpd.meta;
    const elJudulApp = UMUM.el('login-judul-app');
    if (elJudulApp) elJudulApp.textContent = 'e-LKPD ' + meta.mapel;
    const elSub = UMUM.el('login-subjudul');
    if (elSub) elSub.textContent = meta.judul;
    const elSekolah = UMUM.el('login-info-sekolah');
    if (elSekolah) elSekolah.textContent = meta.sekolah;
    const elGuru = UMUM.el('login-info-guru');
    if (elGuru) elGuru.textContent = 'Guru: ' + meta.guru;
    const elKakiTerkumpul = UMUM.el('terkumpul-kaki');
    if (elKakiTerkumpul) elKakiTerkumpul.textContent = 'e-LKPD — ' + meta.sekolah;
    const elKakiNilai = UMUM.el('nilai-kaki');
    if (elKakiNilai) elKakiNilai.textContent = 'e-LKPD — ' + meta.sekolah;
  }

  // ============================================================
  // MANAJEMEN LAYAR
  // ============================================================

  /** Menampilkan layar tertentu, menyembunyikan lainnya. */
  function tampilLayar(idLayar) {
    UMUM.qsa('.layar').forEach(function (l) { l.classList.remove('aktif'); });
    const layar = UMUM.el(idLayar);
    if (layar) layar.classList.add('aktif');
    window.scrollTo(0, 0);
  }

  // ============================================================
  // ALUR LOGIN
  // ============================================================

  function pasangEventListener() {
    // Tombol lanjut login (cek siswa)
    const btnLanjut = UMUM.el('btn-login-lanjut');
    if (btnLanjut) btnLanjut.addEventListener('click', klikLoginLanjut);

    // Tombol buat PIN
    const btnBuatPin = UMUM.el('btn-buat-pin');
    if (btnBuatPin) btnBuatPin.addEventListener('click', klikBuatPin);

    // Tombol masuk PIN
    const btnMasukPin = UMUM.el('btn-masuk-pin');
    if (btnMasukPin) btnMasukPin.addEventListener('click', klikMasukPin);

    // Tombol kembali dari buat/masuk PIN
    const btnKembaliBuat = UMUM.el('btn-buat-pin-kembali');
    if (btnKembaliBuat) btnKembaliBuat.addEventListener('click', function () { tampilLayar('layar-login'); });
    const btnKembaliMasuk = UMUM.el('btn-masuk-pin-kembali');
    if (btnKembaliMasuk) btnKembaliMasuk.addEventListener('click', function () { tampilLayar('layar-login'); });

    // Tombol navigasi bagian
    const btnSebelum = UMUM.el('btn-bagian-sebelum');
    if (btnSebelum) btnSebelum.addEventListener('click', function () { pindahBagian(state.bagianAktif - 1); });
    const btnSesudah = UMUM.el('btn-bagian-sesudah');
    if (btnSesudah) btnSesudah.addEventListener('click', function () { pindahBagian(state.bagianAktif + 1); });

    // Tombol simpan manual
    const btnSimpan = UMUM.el('btn-simpan');
    if (btnSimpan) btnSimpan.addEventListener('click', klikSimpanManual);

    // Tombol kumpulkan
    const btnKumpul = UMUM.el('btn-kumpulkan');
    if (btnKumpul) btnKumpul.addEventListener('click', klikKumpulkan);

    // Tombol keluar
    const btnKeluar = UMUM.el('btn-keluar');
    if (btnKeluar) btnKeluar.addEventListener('click', klikKeluar);

    // Tombol unduh pekerjaanku (di layar sukses/nilai)
    const btnUnduh = UMUM.el('btn-unduh-pekerjaanku');
    if (btnUnduh) btnUnduh.addEventListener('click', klikUnduhPekerjaan);
    const btnUnduh2 = UMUM.el('btn-unduh-pekerjaanku-2');
    if (btnUnduh2) btnUnduh2.addEventListener('click', klikUnduhPekerjaan);

    // Enter di input login
    const namaInput = UMUM.el('login-nama');
    if (namaInput) namaInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') klikLoginLanjut(); });
  }

  /** Klik tombol "Lanjut" di layar login (cek siswa). */
  function klikLoginLanjut() {
    const kelas = UMUM.el('login-kelas').value;
    const nama = UMUM.el('login-nama').value.trim();
    const galat = UMUM.el('login-galat');

    if (!kelas) { tampilGalat(galat, 'Pilih kelas dulu ya.'); return; }
    if (!UMUM.validasiNama(nama)) { tampilGalat(galat, 'Tulis nama lengkapmu (minimal 2 huruf).'); return; }

    sembunyikanGalat(galat);
    const btn = UMUM.el('btn-login-lanjut');
    btn.disabled = true; btn.textContent = 'Memeriksa...';

    API.cekSiswa(kelas, nama).then(function (res) {
      btn.disabled = false; btn.textContent = 'Lanjut';
      if (!res.ok) { tampilGalat(galat, res.pesan); return; }
      // Simpan info sementara
      state.sesi = { siswaId: res.data.siswaId, nama: res.data.nama, kelas: kelas, lkpdId: state.lkpd.meta.id };
      UMUM.lsTulis('siswaSementara', state.sesi);

      if (res.data.status === 'buat_pin') {
        tampilLayarBuatPin();
      } else {
        tampilLayarMasukPin();
      }
    });
  }

  function tampilLayarBuatPin() {
    UMUM.el('buat-pin-nama').textContent = state.sesi.nama;
    UMUM.el('buat-pin-kelas').textContent = state.sesi.kelas;
    UMUM.el('buat-pin-input').value = '';
    UMUM.el('buat-pin-konfirmasi').value = '';
    tampilLayar('layar-buat-pin');
    setTimeout(function () { UMUM.el('buat-pin-input').focus(); }, 100);
  }

  function tampilLayarMasukPin() {
    UMUM.el('masuk-pin-nama').textContent = state.sesi.nama;
    UMUM.el('masuk-pin-kelas').textContent = state.sesi.kelas;
    UMUM.el('masuk-pin-input').value = '';
    tampilLayar('layar-masuk-pin');
    setTimeout(function () { UMUM.el('masuk-pin-input').focus(); }, 100);
  }

  function klikBuatPin() {
    const pin = UMUM.el('buat-pin-input').value;
    const konf = UMUM.el('buat-pin-konfirmasi').value;
    const galat = UMUM.el('buat-pin-galat');

    if (!UMUM.validasiPin(pin)) { tampilGalat(galat, 'PIN harus 4–6 angka.'); return; }
    if (pin !== konf) { tampilGalat(galat, 'PIN dan konfirmasi tidak cocok.'); return; }

    sembunyikanGalat(galat);
    const btn = UMUM.el('btn-buat-pin');
    btn.disabled = true; btn.textContent = 'Membuat...';

    API.buatPin(state.sesi.siswaId, pin, konf).then(function (res) {
      btn.disabled = false; btn.textContent = 'Buat PIN & Masuk';
      if (!res.ok) { tampilGalat(galat, res.pesan); return; }
      // Simpan sesi
      state.sesi.token = res.data.token;
      state.sesi.peran = res.data.peran;
      UMUM.lsTulis('sesi', state.sesi);
      UMUM.lsHapus('siswaSementara');
      UMUM.toast('PIN berhasil dibuat. Selamat datang, ' + state.sesi.nama + '!', 'sukses');
      muatPekerjaanLanjut();
    });
  }

  function klikMasukPin() {
    const pin = UMUM.el('masuk-pin-input').value;
    const galat = UMUM.el('masuk-pin-galat');

    if (!UMUM.validasiPin(pin)) { tampilGalat(galat, 'PIN harus 4–6 angka.'); return; }

    sembunyikanGalat(galat);
    const btn = UMUM.el('btn-masuk-pin');
    btn.disabled = true; btn.textContent = 'Memeriksa...';

    API.masukSiswa(state.sesi.siswaId, pin).then(function (res) {
      btn.disabled = false; btn.textContent = 'Masuk';
      if (!res.ok) { tampilGalat(galat, res.pesan); return; }
      state.sesi.token = res.data.token;
      state.sesi.peran = res.data.peran;
      UMUM.lsTulis('sesi', state.sesi);
      UMUM.lsHapus('siswaSementara');
      muatPekerjaanLanjut();
    });
  }

  // ============================================================
  // MUAT PEKERJAAN
  // ============================================================

  function muatPekerjaanLanjut() {
    const token = state.sesi.token;
    const lkpdId = state.lkpd.meta.id;
    UMUM.toast('Memuat pekerjaanmu...', 'info', 2000);
    API.muatPekerjaan(lkpdId, token).then(function (res) {
      if (!res.ok) {
        // Jika token kedaluwarsa/tidak valid, hapus sesi.
        if (res.kode === 'TOKEN_TIDAK_VALID' || res.kode === 'HAK_AKSES_DITOLAK') {
          UMUM.lsHapus('sesi');
          state.sesi = null;
        }
        // Untuk semua galat (termasuk koneksi gagal), kembali ke layar login
        // agar siswa tidak terjebak di layar kosong. Sesi yang valid tetap
        // disimpan (kecuali token kedaluwarsa) sehingga bisa dicoba lagi.
        tampilLayar('layar-login');
        isiDropdownKelas();
        UMUM.toast(res.pesan, 'bahaya');
        return;
      }
      state.pengerjaanId = res.data.pengerjaanId;
      state.statusPengerjaan = res.data.status;
      state.revisiDibuka = res.data.revisiDibuka === 'true' || res.data.revisiDibuka === true;
      state.jawaban = res.data.jawaban || {};
      state.berkas = kelompokkanBerkas(res.data.berkas || []);
      state.nilai = res.data.nilai || {};
      state.tampilkanNilai = res.data.tampilkanNilai === true;
      state.bagianAktif = 0;
      // Muat cadangan lokal (jika ada yang belum sinkron)
      muatCadanganLokal();
      // Tampilkan layar kerja atau sukses tergantung status
      if (state.statusPengerjaan === 'terkumpul' && !state.revisiDibuka) {
        tampilLayarTerkumpul();
      } else if (state.statusPengerjaan === 'dinilai' && !state.revisiDibuka && state.tampilkanNilai) {
        tampilLayarNilai();
      } else {
        tampilLayarKerja();
      }
    });
  }

  /** Mengelompokkan daftar berkas per idSoal. */
  function kelompokkanBerkas(daftar) {
    const obj = {};
    daftar.forEach(function (b) {
      if (!obj[b.idSoal]) obj[b.idSoal] = [];
      obj[b.idSoal].push(b);
    });
    return obj;
  }

  // ============================================================
  // RENDER LAYAR KERJA
  // ============================================================

  function tampilLayarKerja() {
    renderHeader();
    renderBagian(state.bagianAktif);
    renderBilahSimbol();
    renderFooter();
    tampilLayar('layar-kerja');
    perbaruiStatusSimpan('Tersimpan otomatis', 'sukses');
  }

  /** Render header (judul, maskot, info siswa). */
  function renderHeader() {
    const header = UMUM.el('kerja-header');
    if (!header) return;
    UMUM.kosongkan(header);
    const infoKiri = UMUM.buatEl('div', { class: 'kerja-info' });
    infoKiri.appendChild(UMUM.buatEl('span', { class: 'kerja-judul', text: state.lkpd.meta.judul }));
    infoKiri.appendChild(UMUM.buatEl('span', { class: 'kerja-meta', text: state.lkpd.meta.mapel + ' • ' + state.lkpd.meta.kelas + ' • ' + state.lkpd.meta.bab }));
    const infoKanan = UMUM.buatEl('div', { class: 'kerja-siswa' });
    infoKanan.appendChild(UMUM.buatEl('span', { class: 'kerja-maskot', text: state.lkpd.tema.maskot, 'aria-hidden': 'true' }));
    infoKanan.appendChild(UMUM.buatEl('span', { class: 'kerja-nama', text: state.sesi.nama }));
    header.appendChild(infoKiri);
    header.appendChild(infoKanan);
  }

  /** Render satu bagian dan semua blok di dalamnya. */
  function renderBagian(idx) {
    const bagian = state.lkpd.bagian[idx];
    const wadah = UMUM.el('kerja-konten');
    UMUM.kosongkan(wadah);
    if (!bagian) return;

    // Banner status jika terkumpul/dinilai dengan revisi
    if (state.revisiDibuka) {
      const banner = UMUM.buatEl('div', { class: 'banner banner-info' });
      banner.appendChild(UMUM.buatEl('span', { text: '🔁 Revisi dibuka oleh guru. Kamu bisa mengubah jawaban lalu kumpulkan lagi.' }));
      wadah.appendChild(banner);
    }

    // Judul bagian & petunjuk
    const kepala = UMUM.buatEl('div', { class: 'bagian-kepala' });
    kepala.appendChild(UMUM.buatEl('span', { class: 'bagian-maskot', text: bagian.maskot || state.lkpd.tema.maskot, 'aria-hidden': 'true' }));
    kepala.appendChild(UMUM.buatEl('h2', { class: 'bagian-judul', text: bagian.judul }));
    if (bagian.petunjuk) {
      kepala.appendChild(UMUM.buatEl('p', { class: 'bagian-petunjuk', text: bagian.petunjuk }));
    }
    wadah.appendChild(kepala);

    // Konteks untuk renderer soal
    const ctx = {
      pengerjaanId: state.pengerjaanId,
      token: state.sesi.token,
      onBerubah: padaJawabanBerubah,
      bersiarkanEdit: state.statusPengerjaan === 'terkumpul' && !state.revisiDibuka
    };

    // Render setiap blok
    (bagian.blok || []).forEach(function (blok) {
      if (blok.jenis === 'bacaan') {
        wadah.appendChild(renderBacaan(blok));
      } else if (blok.jenis === 'gambar') {
        wadah.appendChild(renderGambarBlok(blok));
      } else if (blok.jenis === 'tautan_video') {
        wadah.appendChild(renderVideo(blok));
      } else if (blok.jenis === 'soal') {
        wadah.appendChild(renderSoal(blok, ctx));
      }
    });

    // Render navigasi bagian
    renderNavigasiBagian();

    // Isi nilai awal setelah render
    (bagian.blok || []).forEach(function (blok) {
      if (blok.jenis === 'soal' && PENJENIS_SOAL[blok.tipe]) {
        const kotakSoal = wadah.querySelector('[data-id-blok="' + blok.id + '"]');
        if (kotakSoal) {
          const wadahSoal = kotakSoal.querySelector('.soal-input');
          const nilai = state.jawaban[blok.id];
          if (nilai) {
            PENJENIS_SOAL[blok.tipe].isiNilaiAwal(blok, nilai, wadahSoal);
          }
        }
      }
    });

    // Update progres
    perbaruiProgres();
  }

  /** Render blok bacaan. */
  function renderBacaan(blok) {
    const kotak = UMUM.buatEl('div', { class: 'blok-bacaan' });
    if (blok.judul) kotak.appendChild(UMUM.buatEl('h3', { class: 'bacaan-judul', text: blok.judul }));
    // Pisahkan paragraf berdasarkan newline
    const paragraf = String(blok.isi || '').split('\n');
    paragraf.forEach(function (p) {
      if (p.trim()) kotak.appendChild(UMUM.buatEl('p', { class: 'bacaan-isi', text: p }));
    });
    return kotak;
  }

  /** Render blok gambar (ilustrasi). */
  function renderGambarBlok(blok) {
    const kotak = UMUM.buatEl('div', { class: 'blok-gambar' });
    if (blok.sumber) {
      const img = UMUM.buatEl('img', { src: blok.sumber, alt: blok.alt || 'Gambar ilustrasi', class: 'gambar-isi' });
      img.loading = 'lazy';
      kotak.appendChild(img);
    }
    if (blok.keterangan) {
      kotak.appendChild(UMUM.buatEl('p', { class: 'gambar-ket', text: blok.keterangan }));
    }
    return kotak;
  }

  /** Render blok tautan video. */
  function renderVideo(blok) {
    const kotak = UMUM.buatEl('div', { class: 'blok-video' });
    if (blok.judul) kotak.appendChild(UMUM.buatEl('h3', { class: 'video-judul', text: blok.judul }));
    const pembungkus = UMUM.buatEl('div', { class: 'video-bungkus' });
    // Hanya URL YouTube yang di-embed; URL lain jadi tautan
    if (blok.url && blok.url.indexOf('youtube.com') !== -1 || (blok.url && blok.url.indexOf('youtu.be') !== -1)) {
      let videoId = '';
      const m1 = blok.url.match(/[?&]v=([^&]+)/);
      const m2 = blok.url.match(/youtu\.be\/([^?&]+)/);
      if (m1) videoId = m1[1];
      else if (m2) videoId = m2[1];
      if (videoId) {
        const iframe = UMUM.buatEl('iframe', {
          src: 'https://www.youtube.com/embed/' + videoId,
          title: blok.judul || 'Video',
          frameborder: '0', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'allowfullscreen'
        });
        pembungkus.appendChild(iframe);
      }
    } else if (blok.url) {
      const a = UMUM.buatEl('a', { href: blok.url, target: '_blank', rel: 'noopener', text: '▶ Tonton video di sini' });
      pembungkus.appendChild(a);
    }
    kotak.appendChild(pembungkus);
    if (blok.keterangan) kotak.appendChild(UMUM.buatEl('p', { class: 'video-ket', text: blok.keterangan }));
    return kotak;
  }

  /** Render satu soal berdasarkan tipenya. */
  function renderSoal(blok, ctx) {
    const penjenis = PENJENIS_SOAL[blok.tipe];
    const kotak = UMUM.buatEl('div', { class: 'blok-soal', 'data-id-blok': blok.id });
    if (blok.tipe === 'kanvas') kotak.classList.add('soal-kanvas');
    if (blok.tipe === 'foto') kotak.classList.add('soal-foto');

    // Kepala soal: nomor & teks
    const kepala = UMUM.buatEl('div', { class: 'soal-kepala' });
    if (blok.nomor !== null && blok.nomor !== undefined) {
      kepala.appendChild(UMUM.buatEl('span', { class: 'soal-nomor', text: 'Soal ' + blok.nomor }));
    } else {
      kepala.appendChild(UMUM.buatEl('span', { class: 'soal-nomor soal-nomor-refleksi', text: 'Refleksi' }));
    }
    if (blok.wajib) {
      kepala.appendChild(UMUM.buatEl('span', { class: 'soal-wajib', text: blok.wajib === true ? 'Wajib diisi' : ('Wajib: ' + blok.wajib) }));
    }
    if (blok.teks) {
      kepala.appendChild(UMUM.buatEl('p', { class: 'soal-teks', text: blok.teks }));
    }
    kotak.appendChild(kepala);

    // Wadah input
    const wadahInput = UMUM.buatEl('div', { class: 'soal-input' });
    kotak.appendChild(wadahInput);

    if (penjenis) {
      penjenis.render(blok, wadahInput, ctx);
    } else {
      wadahInput.appendChild(UMUM.buatEl('p', { class: 'soal-tidak-dikenal', text: 'Tipe soal "' + blok.tipe + '" belum didukung.' }));
    }

    // Tampilkan nilai guru (jika sudah dinilai & tampil)
    if (state.tampilkanNilai && state.nilai[blok.id]) {
      const n = state.nilai[blok.id];
      const kotakNilai = UMUM.buatEl('div', { class: 'soal-nilai' });
      if (n.skor !== undefined && n.skor !== null && n.skor !== '') {
        kotakNilai.appendChild(UMUM.buatEl('span', { class: 'nilai-skor', text: 'Nilai: ' + n.skor }));
      }
      if (n.komentar) {
        kotakNilai.appendChild(UMUM.buatEl('span', { class: 'nilai-komentar', text: 'Komentar guru: ' + n.komentar }));
      }
      kotak.appendChild(kotakNilai);
    }

    return kotak;
  }

  /** Render bilah simbol matematika. */
  function renderBilahSimbol() {
    const bilah = UMUM.el('kerja-simbol');
    if (!bilah) return;
    UMUM.kosongkan(bilah);
    const label = UMUM.buatEl('span', { class: 'simbol-label', text: 'Sisipkan simbol:' });
    bilah.appendChild(label);
    (state.lkpd.simbol || []).forEach(function (s) {
      const btn = UMUM.buatEl('button', { type: 'button', class: 'simbol-tombol', text: s, 'aria-label': 'Sisipkan ' + s });
      btn.addEventListener('click', function () { sisipkanSimbol(s); });
      bilah.appendChild(btn);
    });
  }

  /** Menyisipkan simbol pada input/textarea yang sedang aktif. */
  function sisipkanSimbol(simbol) {
    const el = state.inputAktif;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) {
      UMUM.toast('Klik dulu kolom isian tempat menyisipkan simbol.', 'info');
      return;
    }
    const awal = el.selectionStart;
    const akhir = el.selectionEnd;
    const val = el.value;
    el.value = val.substring(0, awal) + simbol + val.substring(akhir);
    const posBaru = awal + simbol.length;
    el.focus();
    el.setSelectionRange(posBaru, posBaru);
    // Picu input event agar tersimpan
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Render navigasi bagian (sebelumnya / berikutnya). */
  function renderNavigasiBagian() {
    const nav = UMUM.el('kerja-nav');
    if (!nav) return;
    UMUM.kosongkan(nav);
    const total = state.lkpd.bagian.length;
    const info = UMUM.buatEl('span', { class: 'nav-info', text: 'Bagian ' + (state.bagianAktif + 1) + ' dari ' + total });
    nav.appendChild(info);
  }

  /** Pindah ke bagian lain (dengan simpan dulu jika ada perubahan). */
  function pindahBagian(idx) {
    if (idx < 0 || idx >= state.lkpd.bagian.length) return;
    // Simpan dulu perubahan kanvas & foto sebelum pindah
    simpanSemuaKeState();
    // Paksa simpan otomatis langsung
    if (Object.keys(state.perubahan).length > 0) {
      simpanOtomatisSekarang();
    }
    state.bagianAktif = idx;
    renderBagian(idx);
    window.scrollTo(0, 0);
  }

  /** Render footer dengan tombol simpan & kumpulkan. */
  function renderFooter() {
    const footer = UMUM.el('kerja-footer');
    if (!footer) return;
    // Tombol sudah ada di HTML; hanya atur status
    const btnKumpul = UMUM.el('btn-kumpulkan');
    if (state.statusPengerjaan === 'terkumpul' && !state.revisiDibuka) {
      btnKumpul.textContent = 'Sudah Dikumpulkan';
      btnKumpul.disabled = true;
    } else if (state.revisiDibuka) {
      btnKumpul.textContent = 'Kumpulkan Ulang';
      btnKumpul.disabled = false;
    } else {
      btnKumpul.textContent = 'Kumpulkan';
      btnKumpul.disabled = false;
    }
  }

  // ============================================================
  // SIMPAN OTOMATIS & MANUAL
  // ============================================================

  /** Dipanggil saat jawaban berubah. */
  function padaJawabanBerubah(idSoal) {
    // Simpan ke state dari DOM
    simpanSatuanKeState(idSoal);
    state.perubahan[idSoal] = true;
    state.tersimpanOnline = false;
    // Cadangan ke localStorage
    if (window.KONFIG_APLIKASI.cadanganOtomatis) {
      tulisCadanganLokal();
    }
    perbaruiStatusSimpan('Menyimpan...', 'info');
    // Jadwalkan simpan otomatis
    if (window.KONFIG_APLIKASI.simpanOtomatisAktif) {
      if (state.simpanOtomatisTimer) clearTimeout(state.simpanOtomatisTimer);
      state.simpanOtomatisTimer = setTimeout(simpanOtomatisSekarang, window.KONFIG_APLIKASI.simpanOtomatisJedaMs);
    }
  }

  /** Simpan satu soal dari DOM ke state.jawaban. */
  function simpanSatuanKeState(idSoal) {
    const blok = cariBlok(idSoal);
    if (!blok || !PENJENIS_SOAL[blok.tipe]) return;
    const wadahSoal = UMUM.qs('[data-id-blok="' + idSoal + '"] .soal-input');
    if (!wadahSoal) return;
    const nilai = PENJENIS_SOAL[blok.tipe].ambilNilai(blok, wadahSoal);
    state.jawaban[idSoal] = nilai;
  }

  /** Simpan semua soal di bagian aktif ke state. */
  function simpanSemuaKeState() {
    const bagian = state.lkpd.bagian[state.bagianAktif];
    if (!bagian) return;
    (bagian.blok || []).forEach(function (blok) {
      if (blok.jenis === 'soal' && PENJENIS_SOAL[blok.tipe]) {
        simpanSatuanKeState(blok.id);
      }
    });
  }

  /** Mencari blok soal berdasarkan id di seluruh LKPD. */
  function cariBlok(idSoal) {
    for (let i = 0; i < state.lkpd.bagian.length; i++) {
      const blok2 = state.lkpd.bagian[i].blok || [];
      for (let j = 0; j < blok2.length; j++) {
        if (blok2[j].jenis === 'soal' && blok2[j].id === idSoal) return blok2[j];
      }
    }
    return null;
  }

  /** Simpan otomatis: kirim hanya jawaban yang berubah. */
  function simpanOtomatisSekarang() {
    if (state.sedangMenyimpan) return;
    const berubah = Object.keys(state.perubahan);
    if (berubah.length === 0) return;
    // Cek apakah pekerjaan terkunci
    if (state.statusPengerjaan === 'terkumpul' && !state.revisiDibuka) {
      perbaruiStatusSimpan('Terkunci (sudah dikumpulkan)', 'info');
      return;
    }
    // Susun payload jawaban
    const jawabanArr = berubah.map(function (idSoal) {
      simpanSatuanKeState(idSoal);
      const j = state.jawaban[idSoal];
      return { idSoal: idSoal, teks: j.teks || '', data: j.data || null };
    });

    state.sedangMenyimpan = true;
    perbaruiStatusSimpan('Menyimpan...', 'info');
    API.simpanJawaban(state.pengerjaanId, jawabanArr, state.sesi.token).then(function (res) {
      state.sedangMenyimpan = false;
      if (res.ok) {
        // Bersihkan daftar perubahan yang berhasil
        berubah.forEach(function (id) { delete state.perubahan[id]; });
        state.tersimpanOnline = true;
        hapusCadanganLokal();
        perbaruiStatusSimpan('Tersimpan ' + new Date().toLocaleTimeString('id-ID'), 'sukses');
      } else {
        if (!navigator.onLine) {
          perbaruiStatusSimpan('Offline — disimpan lokal', 'peringatan');
        } else {
          perbaruiStatusSimpan('Gagal menyimpan. Coba lagi.', 'bahaya');
          UMUM.toast(res.pesan, 'bahaya', 5000);
        }
      }
    });
  }

  /** Simpan manual (tombol Simpan). */
  function klikSimpanManual() {
    simpanSemuaKeState();
    // Tandai semua soal di bagian ini sebagai berubah
    const bagian = state.lkpd.bagian[state.bagianAktif];
    if (bagian) {
      (bagian.blok || []).forEach(function (b) {
        if (b.jenis === 'soal') state.perubahan[b.id] = true;
      });
    }
    if (state.simpanOtomatisTimer) clearTimeout(state.simpanOtomatisTimer);
    simpanOtomatisSekarang();
  }

  /** Perbarui teks status simpan. */
  function perbaruiStatusSimpan(teks, tipe) {
    const node = UMUM.el('status-simpan');
    if (!node) return;
    node.textContent = teks;
    node.className = 'status-simpan status-' + (tipe || 'info');
  }

  // ============================================================
  // CADANGAN LOKAL (offline)
  // ============================================================

  function kunciCadangan() {
    return 'cadangan_' + state.lkpd.meta.id + '_' + state.sesi.siswaId;
  }

  function tulisCadanganLokal() {
    if (!state.sesi || !state.sesi.siswaId) return;
    UMUM.lsTulis(kunciCadangan(), {
      pengerjaanId: state.pengerjaanId,
      jawaban: state.jawaban,
      waktu: new Date().toISOString()
    });
  }

  function muatCadanganLokal() {
    if (!state.sesi || !state.sesi.siswaId) return;
    const cad = UMUM.lsBaca(kunciCadangan());
    if (cad && cad.jawaban) {
      // Gabungkan: cadangan lokal menimpa jika lebih baru
      Object.keys(cad.jawaban).forEach(function (idSoal) {
        if (!state.jawaban[idSoal] || !state.tersimpanOnline) {
          state.jawaban[idSoal] = cad.jawaban[idSoal];
          state.perubahan[idSoal] = true;
        }
      });
    }
  }

  function hapusCadanganLokal() {
    if (!state.sesi || !state.sesi.siswaId) return;
    UMUM.lsHapus(kunciCadangan());
  }

  /** Sinkronkan cadangan saat kembali online. */
  function sinkronkanCadangan() {
    if (Object.keys(state.perubahan).length > 0) {
      simpanOtomatisSekarang();
    }
  }

  // ============================================================
  // KUMPULKAN
  // ============================================================

  function klikKumpulkan() {
    // Pastikan semua bagian tersimpan ke state
    simpanSemuaKeState();

    // Validasi soal wajib
    const masalah = cekSoalWajib();
    if (masalah.length > 0) {
      const isi = UMUM.buatEl('div');
      isi.appendChild(UMUM.buatEl('p', { text: 'Beberapa soal wajib belum terpenuhi:' }));
      const ul = UMUM.buatEl('ul', { class: 'daftar-masalah' });
      masalah.forEach(function (m) {
        ul.appendChild(UMUM.buatEl('li', { text: m }));
      });
      isi.appendChild(ul);
      UMUM.modal({
        judul: 'Belum Boleh Mengumpulkan',
        isi: isi,
        tombol: [{ teks: 'Oke, saya periksa', tipe: 'primer' }]
      });
      return;
    }

    // Konfirmasi
    UMUM.konfirmasi(
      'Setelah dikumpulkan, jawaban akan terkunci. Kamu tidak bisa mengubah lagi sampai guru membuka revisi. Yakin ingin mengumpulkan sekarang?',
      'Kumpulkan Pekerjaan?'
    ).then(function (ya) {
      if (!ya) return;
      // Simpan dulu semua perubahan
      if (state.simpanOtomatisTimer) clearTimeout(state.simpanOtomatisTimer);
      simpanOtomatisSekarang();
      // Lalu kumpulkan
      lakukanKumpulkan();
    });
  }

  /** Cek semua soal wajib & soal kosong. */
  function cekSoalWajib() {
    const masalah = [];
    const bagianList = state.lkpd.bagian || [];
    for (let i = 0; i < bagianList.length; i++) {
      const blokList = bagianList[i].blok || [];
      for (let j = 0; j < blokList.length; j++) {
        const b = blokList[j];
        if (b.jenis !== 'soal') continue;
        const penjenis = PENJENIS_SOAL[b.tipe];
        if (!penjenis) continue;
        const nilai = state.jawaban[b.id];
        const terisi = penjenis.sudahDiisi(b, nilai);
        if (b.wajib) {
          if (b.wajib === true && !terisi) {
            masalah.push((b.nomor ? 'Soal ' + b.nomor : 'Soal ' + b.id) + ' wajib diisi.');
          } else if (b.wajib === 'gambar' && !terisi) {
            masalah.push((b.nomor ? 'Soal ' + b.nomor : 'Soal ' + b.id) + ' wajib digambar di kanvas.');
          } else if (b.wajib === 'foto' && !terisi) {
            masalah.push((b.nomor ? 'Soal ' + b.nomor : 'Soal ' + b.id) + ' wajib ada minimal 1 foto.');
          } else if (b.wajib === 'gambar_atau_foto' && !terisi) {
            masalah.push((b.nomor ? 'Soal ' + b.nomor : 'Soal ' + b.id) + ' wajib ada gambar atau foto.');
          }
        }
      }
    }
    return masalah;
  }

  function lakukanKumpulkan() {
    const btn = UMUM.el('btn-kumpulkan');
    btn.disabled = true; btn.textContent = 'Mengumpulkan...';
    API.kumpulkan(state.pengerjaanId, state.sesi.token).then(function (res) {
      btn.disabled = false; btn.textContent = 'Kumpulkan';
      if (!res.ok) {
        UMUM.toast(res.pesan, 'bahaya');
        return;
      }
      state.statusPengerjaan = 'terkumpul';
      state.revisiDibuka = false;
      hapusCadanganLokal();
      tampilLayarSukses();
    });
  }

  // ============================================================
  // LAYAR SUKSES & TERKUMPUL & NILAI
  // ============================================================

  function tampilLayarSukses() {
    const layar = UMUM.el('layar-sukses');
    tampilLayar('layar-sukses');
    // Picu konfeti (animasi sederhana)
    if (!UMUM.reducedMotion()) {
      buatKonfeti();
    }
    // Setelah 3 detik, tampilkan layar terkumpul
    setTimeout(function () {
      tampilLayarTerkumpul();
    }, 3500);
  }

  /** Animasi konfeti sederhana. */
  function buatKonfeti() {
    const wadah = UMUM.el('konfeti');
    if (!wadah) return;
    UMUM.kosongkan(wadah);
    const warna = ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < 40; i++) {
      const c = UMUM.buatEl('div', { class: 'konfeti-bagian' });
      c.style.left = Math.random() * 100 + '%';
      c.style.backgroundColor = warna[Math.floor(Math.random() * warna.length)];
      c.style.animationDelay = Math.random() * 0.5 + 's';
      c.style.animationDuration = (2 + Math.random() * 2) + 's';
      wadah.appendChild(c);
    }
    setTimeout(function () { UMUM.kosongkan(wadah); }, 5000);
  }

  function tampilLayarTerkumpul() {
    const layar = UMUM.el('layar-terkumpul');
    const info = UMUM.el('terkumpul-info');
    UMUM.kosongkan(info);
    info.appendChild(UMUM.buatEl('div', { class: 'terkumpul-ikon', text: '🎉' }));
    info.appendChild(UMUM.buatEl('h2', { text: 'Pekerjaan Kamu Sudah Dikumpulkan!' }));
    info.appendChild(UMUM.buatEl('p', { text: 'Terima kasih, ' + state.sesi.nama + '. Jawabanmu sudah terkirim ke ' + state.lkpd.meta.guru + '.' }));
    if (state.lkpd.meta.tenggat) {
      info.appendChild(UMUM.buatEl('p', { class: 'terkumpul-catatan', text: 'Kamu tidak bisa mengubah jawaban lagi sampai guru membuka revisi.' }));
    }
    // Tombol unduh (selalu tampil)
    const btnUnduh = UMUM.el('btn-unduh-pekerjaanku');
    if (btnUnduh) btnUnduh.style.display = '';
    tampilLayar('layar-terkumpul');
  }

  function tampilLayarNilai() {
    const layar = UMUM.el('layar-nilai');
    const info = UMUM.el('nilai-info');
    UMUM.kosongkan(info);
    info.appendChild(UMUM.buatEl('div', { class: 'nilai-ikon', text: '⭐' }));
    info.appendChild(UMUM.buatEl('h2', { text: 'Nilai Pekerjaanmu' }));
    // Hitung skor total
    let total = 0; let ada = false;
    Object.keys(state.nilai).forEach(function (id) {
      const s = Number(state.nilai[id].skor);
      if (!isNaN(s)) { total += s; ada = true; }
    });
    if (ada) {
      info.appendChild(UMUM.buatEl('div', { class: 'nilai-total', text: 'Skor Total: ' + total }));
    }
    // Daftar nilai per soal
    const daftar = UMUM.buatEl('div', { class: 'nilai-daftar' });
    (state.lkpd.bagian || []).forEach(function (bagian) {
      (bagian.blok || []).forEach(function (b) {
        if (b.jenis === 'soal' && state.nilai[b.id]) {
          const n = state.nilai[b.id];
          const kartu = UMUM.buatEl('div', { class: 'nilai-kartu' });
          kartu.appendChild(UMUM.buatEl('div', { class: 'nilai-kartu-kepala', text: (b.nomor ? 'Soal ' + b.nomor : 'Refleksi') }));
          if (n.skor !== undefined && n.skor !== null && n.skor !== '') {
            kartu.appendChild(UMUM.buatEl('div', { class: 'nilai-kartu-skor', text: 'Nilai: ' + n.skor }));
          }
          if (n.komentar) {
            kartu.appendChild(UMUM.buatEl('div', { class: 'nilai-kartu-komentar', text: '💬 ' + n.komentar }));
          }
          daftar.appendChild(kartu);
        }
      });
    });
    info.appendChild(daftar);
    tampilLayar('layar-nilai');
  }

  // ============================================================
  // UNDUH PEKERJAAN (PDF) — stub penuh di Tahap 3 (unduh.js)
  // ============================================================
  function klikUnduhPekerjaan() {
    if (window.UNDUH && UNDUH.buatPdfSiswa) {
      UNDUH.buatPdfSiswa({
        lkpd: state.lkpd,
        siswa: { nama: state.sesi.nama, kelas: state.sesi.kelas },
        pengerjaanId: state.pengerjaanId,
        jawaban: state.jawaban,
        berkas: state.berkas,
        nilai: state.nilai,
        token: state.sesi.token,
        mode: 'siswa',
        statusPengerjaan: state.statusPengerjaan,
        waktuKumpul: state.statusPengerjaan === 'terkumpul' ? new Date().toISOString() : ''
      });
    } else {
      UMUM.toast('Fitur unduh belum tersedia.', 'info');
    }
  }

  // ============================================================
  // KELUAR
  // ============================================================
  function klikKeluar() {
    UMUM.konfirmasi('Yakin ingin keluar? Jawabanmu tersimpan di server.', 'Keluar?').then(function (ya) {
      if (ya) {
        UMUM.lsHapus('sesi');
        state.sesi = null;
        state.jawaban = {};
        state.berkas = {};
        state.pengerjaanId = null;
        tampilLayar('layar-login');
        isiDropdownKelas();
        UMUM.el('login-nama').value = '';
      }
    });
  }

  // ============================================================
  // PROGRES
  // ============================================================
  function perbaruiProgres() {
    // Hitung total soal & soal terisi
    let total = 0, terisi = 0;
    (state.lkpd.bagian || []).forEach(function (bagian) {
      (bagian.blok || []).forEach(function (b) {
        if (b.jenis === 'soal' && b.nomor !== null && b.nomor !== undefined) {
          total++;
          const penjenis = PENJENIS_SOAL[b.tipe];
          if (penjenis && penjenis.sudahDiisi(b, state.jawaban[b.id])) terisi++;
        }
      });
    });
    const node = UMUM.el('progres-teks');
    if (node) node.textContent = 'Soal terisi: ' + terisi + ' dari ' + total;
    const bar = UMUM.el('progres-bar');
    if (bar) bar.style.width = (total > 0 ? Math.round(terisi / total * 100) : 0) + '%';
  }

  // ============================================================
  // PESAN GALAT
  // ============================================================
  function tampilGalat(node, pesan) {
    if (!node) return;
    node.textContent = pesan;
    node.style.display = 'block';
  }
  function sembunyikanGalat(node) {
    if (!node) return;
    node.textContent = '';
    node.style.display = 'none';
  }

  // ============================================================
  // MULAI
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
// ============================================================
// AKHIR FILE js/siswa.js
// ============================================================
