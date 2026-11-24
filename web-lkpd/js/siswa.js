/**
 * ============================================================================
 * MESIN UTAMA HALAMAN SISWA (js/siswa.js)
 * ============================================================================
 * Prinsip Arsitektur:
 * - Tidak memuat nama bab, jumlah baris tabel, opsi dropdown, atau teks soal
 *   tertanam di sini; seluruhnya dibaca dinamis dari window.ELKPD (konten.js).
 * - Mendukung pendaftaran tipe soal baru secara modular melalui:
 *   SiswaApp.daftarTipeSoal(namaTipe, { render, ambilNilai, sudahDiisi, isiNilaiAwal })
 */

window.SiswaApp = (function () {
  'use strict';

  // Registri tipe soal (extensible tanpa mengubah alur utama)
  const REGISTRI_TIPE_SOAL = {};

  function daftarTipeSoal(namaTipe, definisi) {
    if (!namaTipe || !definisi) return;
    REGISTRI_TIPE_SOAL[String(namaTipe).toLowerCase()] = definisi;
  }

  // Status aplikasi aktif di memori
  const state = {
    lkpd: null,
    pengaturanServer: {},
    daftarKelas: [],
    sesi: null, // { token, siswa: { idSiswa, kelas, nama } }
    pengerjaan: {
      idPengerjaan: '',
      status: 'sedang', // 'sedang' | 'terkumpul'
      waktuMulai: '',
      waktuKumpul: ''
    },
    jawabanMap: {}, // { [idSoal]: { teks, dataJson } }
    perubahanTertunda: {}, // { [idSoal]: true }
    berkasDaftar: [], // [{ idBerkas, idSoal, jenis, namaFile, ukuran, mime }]
    cacheDataUrlBerkas: {}, // { [idBerkas]: 'data:image/...' }
    nilai: { diizinkan: false, daftar: [], totalSkor: null },
    indeksBagianAktif: 0,
    timerSimpanOtomatis: null,
    sedangMenyimpan: false,
    elemenInputAktif: null,
    komponenKanvasMap: {}
  };

  /**
   * ==========================================================================
   * PENDAFTARAN 11 TIPE SOAL WAJIB
   * ==========================================================================
   */

  // 1. Teks Singkat
  daftarTipeSoal('teks_singkat', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'input-teks';
      input.placeholder = soal.placeholder || 'Ketik jawaban singkatmu di sini...';
      input.disabled = terkunci;
      input.value = nilaiAwal && nilaiAwal.teks ? nilaiAwal.teks : '';
      input.setAttribute('aria-label', 'Jawaban soal nomor ' + soal.nomor);

      input.addEventListener('input', function () {
        onUbah({ teks: input.value, dataJson: '' });
      });
      kontainer.appendChild(input);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 2. Uraian
  daftarTipeSoal('uraian', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const area = document.createElement('textarea');
      area.className = 'input-area';
      area.rows = soal.baris || 4;
      area.placeholder = soal.placeholder || 'Tuliskan jawaban dan langkah pengerjaanmu di sini...';
      area.disabled = terkunci;
      area.value = nilaiAwal && nilaiAwal.teks ? nilaiAwal.teks : '';
      area.setAttribute('aria-label', 'Jawaban uraian soal nomor ' + soal.nomor);

      area.addEventListener('input', function () {
        onUbah({ teks: area.value, dataJson: '' });
      });
      kontainer.appendChild(area);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 3. Pilihan Ganda
  daftarTipeSoal('pilihan_ganda', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const grup = document.createElement('div');
      grup.className = 'daftar-opsi-pilihan';
      grup.setAttribute('role', 'radiogroup');
      grup.setAttribute('aria-label', 'Pilihan jawaban soal ' + soal.nomor);

      const pilihanList = Array.isArray(soal.pilihan) ? soal.pilihan : [];
      const terpilihSaatIni = nilaiAwal && nilaiAwal.teks ? String(nilaiAwal.teks) : '';

      pilihanList.forEach(function (teksOpsi, idx) {
        const huruf = String.fromCharCode(65 + idx);
        const label = document.createElement('label');
        label.className = 'opsi-radio-kartu' + (terpilihSaatIni === teksOpsi ? ' terpilih' : '');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'pg_' + soal.id;
        radio.value = teksOpsi;
        radio.checked = terpilihSaatIni === teksOpsi;
        radio.disabled = terkunci;

        const spanTeks = document.createElement('span');
        spanTeks.innerHTML =
          '<strong>' + huruf + '.</strong> ' + window.Umum.formatTeksMateriAman(teksOpsi);

        radio.addEventListener('change', function () {
          grup.querySelectorAll('.opsi-radio-kartu').forEach(function (el) {
            el.classList.remove('terpilih');
          });
          label.classList.add('terpilih');
          onUbah({ teks: teksOpsi, dataJson: JSON.stringify({ indeks: idx, huruf: huruf }) });
        });

        label.appendChild(radio);
        label.appendChild(spanTeks);
        grup.appendChild(label);
      });

      kontainer.appendChild(grup);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 4. Benar / Salah
  daftarTipeSoal('benar_salah', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const grup = document.createElement('div');
      grup.className = 'grup-benar-salah';
      grup.setAttribute('role', 'radiogroup');

      const opsiBS = [
        { nilai: soal.labelBenar || 'Benar', ikon: '✅' },
        { nilai: soal.labelSalah || 'Salah', ikon: '❌' }
      ];
      const terpilih = nilaiAwal && nilaiAwal.teks ? String(nilaiAwal.teks) : '';

      opsiBS.forEach(function (item) {
        const label = document.createElement('label');
        label.className = 'opsi-radio-kartu' + (terpilih === item.nilai ? ' terpilih' : '');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'bs_' + soal.id;
        radio.value = item.nilai;
        radio.checked = terpilih === item.nilai;
        radio.disabled = terkunci;

        const span = document.createElement('span');
        span.textContent = item.ikon + ' ' + item.nilai;

        radio.addEventListener('change', function () {
          grup.querySelectorAll('.opsi-radio-kartu').forEach(function (el) {
            el.classList.remove('terpilih');
          });
          label.classList.add('terpilih');
          onUbah({ teks: item.nilai, dataJson: '' });
        });

        label.appendChild(radio);
        label.appendChild(span);
        grup.appendChild(label);
      });

      kontainer.appendChild(grup);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 5. Isian Angka
  daftarTipeSoal('isian_angka', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const baris = document.createElement('div');
      baris.style.cssText = 'display:flex;align-items:center;gap:10px;max-width:340px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.className = 'input-teks';
      input.placeholder = soal.placeholder || 'Masukkan angka...';
      input.disabled = terkunci;
      input.value = nilaiAwal && nilaiAwal.teks ? nilaiAwal.teks : '';
      input.setAttribute('aria-label', 'Isian angka soal ' + soal.nomor);

      input.addEventListener('input', function () {
        // Izinkan angka, tanda minus, titik, dan koma desimal
        const bersih = input.value.replace(/[^0-9.,-]/g, '');
        if (bersih !== input.value) input.value = bersih;
        onUbah({ teks: bersih, dataJson: '' });
      });

      baris.appendChild(input);

      if (soal.satuan) {
        const spanSatuan = document.createElement('span');
        spanSatuan.style.fontWeight = '800';
        spanSatuan.textContent = soal.satuan;
        baris.appendChild(spanSatuan);
      }

      kontainer.appendChild(baris);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 6. Tabel Isian (baris dan kolom bebas diatur dari konten.js)
  daftarTipeSoal('tabel_isian', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const kolom = Array.isArray(soal.kolom) ? soal.kolom : [];
      const baris = Array.isArray(soal.baris) ? soal.baris : [];

      let matriks = [];
      if (nilaiAwal && nilaiAwal.dataJson) {
        try {
          const parsed = JSON.parse(nilaiAwal.dataJson);
          if (Array.isArray(parsed)) matriks = parsed;
        } catch (err) {
          matriks = [];
        }
      }

      // Pastikan ukuran matriks sesuai konfigurasi baris x kolom
      for (let r = 0; r < baris.length; r++) {
        if (!Array.isArray(matriks[r])) matriks[r] = [];
        for (let c = 0; c < kolom.length; c++) {
          const tetap =
            baris[r] && baris[r].selTetap && baris[r].selTetap[c] !== undefined
              ? String(baris[r].selTetap[c])
              : null;
          if (tetap !== null) {
            matriks[r][c] = tetap;
          } else if (matriks[r][c] === undefined) {
            matriks[r][c] = '';
          }
        }
      }

      const bungkus = document.createElement('div');
      bungkus.className = 'wadah-tabel-gulir';

      const tabel = document.createElement('table');
      tabel.className = 'tabel-isian';

      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
      kolom.forEach(function (judulKolom) {
        const th = document.createElement('th');
        th.innerHTML = window.Umum.formatTeksMateriAman(judulKolom);
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      tabel.appendChild(thead);

      const tbody = document.createElement('tbody');
      baris.forEach(function (itemBaris, idxBaris) {
        const tr = document.createElement('tr');
        kolom.forEach(function (_, idxKolom) {
          const td = document.createElement('td');
          const nilaiTetap =
            itemBaris && itemBaris.selTetap && itemBaris.selTetap[idxKolom] !== undefined
              ? String(itemBaris.selTetap[idxKolom])
              : null;

          if (nilaiTetap !== null) {
            td.style.fontWeight = '700';
            td.innerHTML = window.Umum.formatTeksMateriAman(nilaiTetap);
          } else {
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'input-teks';
            inp.style.minHeight = '44px';
            inp.disabled = terkunci;
            inp.value = matriks[idxBaris][idxKolom] || '';
            inp.setAttribute(
              'aria-label',
              'Baris ' + (idxBaris + 1) + ' kolom ' + (kolom[idxKolom] || idxKolom + 1)
            );

            inp.addEventListener('input', function () {
              matriks[idxBaris][idxKolom] = inp.value;
              const ringkasanTeks = matriks
                .map(function (row) {
                  return row.join(' | ');
                })
                .join(' ; ');
              onUbah({ teks: ringkasanTeks, dataJson: JSON.stringify(matriks) });
            });

            td.appendChild(inp);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      tabel.appendChild(tbody);
      bungkus.appendChild(tabel);
      kontainer.appendChild(bungkus);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai, soal) {
      if (!nilai || !nilai.dataJson) return false;
      try {
        const matriks = JSON.parse(nilai.dataJson);
        if (!Array.isArray(matriks)) return false;
        const baris = Array.isArray(soal.baris) ? soal.baris : [];
        const kolom = Array.isArray(soal.kolom) ? soal.kolom : [];

        // Minimal satu sel isian diisi (dan semua sel yang wajib diisi terisi)
        let adaSelIsian = false;
        for (let r = 0; r < baris.length; r++) {
          for (let c = 0; c < kolom.length; c++) {
            const tetap =
              baris[r] && baris[r].selTetap && baris[r].selTetap[c] !== undefined;
            if (!tetap) {
              adaSelIsian = true;
              const isi = matriks[r] && matriks[r][c] ? String(matriks[r][c]).trim() : '';
              if (!isi) return false;
            }
          }
        }
        return adaSelIsian;
      } catch (err) {
        return false;
      }
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 7. Menjodohkan (Dropdown)
  daftarTipeSoal('menjodohkan', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const pasangan = Array.isArray(soal.pasangan) ? soal.pasangan : [];
      let jawabanArray = new Array(pasangan.length).fill('');

      if (nilaiAwal && nilaiAwal.dataJson) {
        try {
          const parsed = JSON.parse(nilaiAwal.dataJson);
          if (Array.isArray(parsed)) {
            jawabanArray = pasangan.map(function (_, i) {
              return parsed[i] || '';
            });
          }
        } catch (err) {
          // Gunakan default kosong
        }
      }

      const daftar = document.createElement('div');
      daftar.className = 'daftar-jodoh';

      pasangan.forEach(function (item, idx) {
        const baris = document.createElement('div');
        baris.className = 'baris-jodoh';

        const kiri = document.createElement('div');
        kiri.style.fontWeight = '700';
        kiri.innerHTML =
          (idx + 1) + '. ' + window.Umum.formatTeksMateriAman(item.kiri || '');

        const select = document.createElement('select');
        select.className = 'input-pilih';
        select.disabled = terkunci;
        select.setAttribute('aria-label', 'Pasangan untuk ' + (item.kiri || 'item ' + (idx + 1)));

        const optKosong = document.createElement('option');
        optKosong.value = '';
        optKosong.textContent = '-- Pilih pasangan yang tepat --';
        select.appendChild(optKosong);

        const opsiKanan = Array.isArray(item.pilihanKanan) ? item.pilihanKanan : [];
        opsiKanan.forEach(function (pil) {
          const opt = document.createElement('option');
          opt.value = pil;
          opt.textContent = pil;
          if (jawabanArray[idx] === pil) opt.selected = true;
          select.appendChild(opt);
        });

        select.addEventListener('change', function () {
          jawabanArray[idx] = select.value;
          const ringkas = pasangan
            .map(function (p, i) {
              return (p.kiri || '') + ' -> ' + (jawabanArray[i] || '?');
            })
            .join(' ; ');
          onUbah({ teks: ringkas, dataJson: JSON.stringify(jawabanArray) });
        });

        baris.appendChild(kiri);
        baris.appendChild(select);
        daftar.appendChild(baris);
      });

      kontainer.appendChild(daftar);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai, soal) {
      if (!nilai || !nilai.dataJson) return false;
      try {
        const arr = JSON.parse(nilai.dataJson);
        const jumlah = Array.isArray(soal.pasangan) ? soal.pasangan.length : 0;
        return (
          Array.isArray(arr) &&
          arr.length === jumlah &&
          arr.every(function (v) {
            return String(v || '').trim().length > 0;
          })
        );
      } catch (err) {
        return false;
      }
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 8. Urutkan
  daftarTipeSoal('urutkan', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const awalList = Array.isArray(soal.itemAwal) ? soal.itemAwal.slice() : [];
      let urutanSaatIni = awalList.slice();
      let pernahDiubah = false;

      if (nilaiAwal && nilaiAwal.dataJson) {
        try {
          const parsed = JSON.parse(nilaiAwal.dataJson);
          if (Array.isArray(parsed) && parsed.length === awalList.length) {
            urutanSaatIni = parsed;
            pernahDiubah = true;
          }
        } catch (err) {
          // Abaikan
        }
      }

      const daftar = document.createElement('div');
      daftar.className = 'daftar-urut';

      function renderDaftar() {
        daftar.innerHTML = '';
        urutanSaatIni.forEach(function (teksItem, idx) {
          const baris = document.createElement('div');
          baris.className = 'item-urut';

          const spanTeks = document.createElement('span');
          spanTeks.innerHTML =
            '<strong style="color:var(--warna-utama);">#' +
            (idx + 1) +
            '</strong> ' +
            window.Umum.formatTeksMateriAman(teksItem);

          const kontrol = document.createElement('div');
          kontrol.className = 'kontrol-urut';

          const btnNaik = document.createElement('button');
          btnNaik.type = 'button';
          btnNaik.className = 'tombol-urut';
          btnNaik.textContent = '⬆️';
          btnNaik.title = 'Geser ke atas';
          btnNaik.disabled = terkunci || idx === 0;
          btnNaik.addEventListener('click', function () {
            const temp = urutanSaatIni[idx - 1];
            urutanSaatIni[idx - 1] = urutanSaatIni[idx];
            urutanSaatIni[idx] = temp;
            pernahDiubah = true;
            renderDaftar();
            window.Umum.renderMatematika(daftar);
            onUbah({
              teks: urutanSaatIni.join(' -> '),
              dataJson: JSON.stringify(urutanSaatIni)
            });
          });

          const btnTurun = document.createElement('button');
          btnTurun.type = 'button';
          btnTurun.className = 'tombol-urut';
          btnTurun.textContent = '⬇️';
          btnTurun.title = 'Geser ke bawah';
          btnTurun.disabled = terkunci || idx === urutanSaatIni.length - 1;
          btnTurun.addEventListener('click', function () {
            const temp = urutanSaatIni[idx + 1];
            urutanSaatIni[idx + 1] = urutanSaatIni[idx];
            urutanSaatIni[idx] = temp;
            pernahDiubah = true;
            renderDaftar();
            window.Umum.renderMatematika(daftar);
            onUbah({
              teks: urutanSaatIni.join(' -> '),
              dataJson: JSON.stringify(urutanSaatIni)
            });
          });

          kontrol.appendChild(btnNaik);
          kontrol.appendChild(btnTurun);
          baris.appendChild(spanTeks);
          baris.appendChild(kontrol);
          daftar.appendChild(baris);
        });
      }

      renderDaftar();
      kontainer.appendChild(daftar);

      if (!pernahDiubah && !terkunci) {
        // Tambahkan tombol konfirmasi urutan jika susunan awal kebetulan sudah benar
        const btnKonfirmasiUrutan = document.createElement('button');
        btnKonfirmasiUrutan.type = 'button';
        btnKonfirmasiUrutan.className = 'tombol tombol-sekunder';
        btnKonfirmasiUrutan.style.marginTop = '10px';
        btnKonfirmasiUrutan.textContent = '✅ Gunakan Susunan Ini';
        btnKonfirmasiUrutan.addEventListener('click', function () {
          onUbah({
            teks: urutanSaatIni.join(' -> '),
            dataJson: JSON.stringify(urutanSaatIni)
          });
          window.Umum.tampilkanToast('Susunan urutan dicatat.', 'sukses');
        });
        kontainer.appendChild(btnKonfirmasiUrutan);
      }
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && nilai.dataJson && String(nilai.dataJson).length > 2);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 9. Kanvas Gambar (latar: polos, grid, garis_bilangan, koordinat, lingkaran)
  daftarTipeSoal('kanvas', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah, konteks) {
      const komponen = window.KanvasLKPD.buatKomponenKanvas({
        kontainer: kontainer,
        idSoal: soal.id,
        latar: soal.latar || 'polos',
        terkunci: terkunci,
        onSimpanGambar: async function (dataUrlPng) {
          const sukses = await unggahBerkasSoal(soal.id, 'gambar', dataUrlPng, true);
          if (sukses) {
            onUbah({ teks: 'Gambar kanvas tersimpan', dataJson: JSON.stringify({ adaGambar: true }) });
          }
          return sukses;
        }
      });

      state.komponenKanvasMap[soal.id] = komponen;

      // Jika sudah ada gambar kanvas tersimpan di server, muat ke dalam papan kanvas
      const berkasKanvas = state.berkasDaftar.find(function (b) {
        return b.idSoal === soal.id && b.jenis === 'gambar';
      });
      if (berkasKanvas) {
        ambilDanTampilkanGambarKanvas(berkasKanvas.idBerkas, komponen);
      }

      // Jika soal kanvas juga mengizinkan foto tambahan, tampilkan panel unggah foto di bawahnya
      if (soal.izinkanFotoTambahan) {
        const pemisah = document.createElement('div');
        pemisah.style.marginTop = '14px';
        pemisah.innerHTML =
          '<p style="font-weight:800;font-size:0.92rem;margin:0 0 8px;">📷 Atau unggah foto coretan kertas untuk soal ini (opsional):</p>';
        kontainer.appendChild(pemisah);
        renderPanelUnggahFoto(soal, kontainer, terkunci);
      }
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai, soal) {
      return state.berkasDaftar.some(function (b) {
        return b.idSoal === soal.id;
      });
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 10. Foto (unggah gambar dari kamera/galeri dengan validasi & kompresi <= 2 MB)
  daftarTipeSoal('foto', {
    render: function (soal, kontainer, nilaiAwal, terkunci) {
      renderPanelUnggahFoto(soal, kontainer, terkunci);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai, soal) {
      return state.berkasDaftar.some(function (b) {
        return b.idSoal === soal.id;
      });
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  // 11. Skala Refleksi (Emoji)
  daftarTipeSoal('skala_refleksi', {
    render: function (soal, kontainer, nilaiAwal, terkunci, onUbah) {
      const opsiList = Array.isArray(soal.opsi) ? soal.opsi : [];
      const grup = document.createElement('div');
      grup.className = 'grup-refleksi';

      const terpilihNilai = nilaiAwal && nilaiAwal.teks ? String(nilaiAwal.teks) : '';

      opsiList.forEach(function (item) {
        const labelTeks = String(item.label || item.nilai);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tombol-refleksi' + (terpilihNilai === labelTeks ? ' terpilih' : '');
        btn.disabled = terkunci;

        const spanEmoji = document.createElement('span');
        spanEmoji.className = 'emoji-besar';
        spanEmoji.textContent = item.emoji || '🙂';

        const spanLabel = document.createElement('span');
        spanLabel.textContent = labelTeks;

        btn.addEventListener('click', function () {
          grup.querySelectorAll('.tombol-refleksi').forEach(function (el) {
            el.classList.remove('terpilih');
          });
          btn.classList.add('terpilih');
          onUbah({
            teks: labelTeks,
            dataJson: JSON.stringify({ nilai: item.nilai, emoji: item.emoji, label: labelTeks })
          });
        });

        btn.appendChild(spanEmoji);
        btn.appendChild(spanLabel);
        grup.appendChild(btn);
      });

      kontainer.appendChild(grup);
    },
    ambilNilai: function (nilaiTersimpan) {
      return nilaiTersimpan || { teks: '', dataJson: '' };
    },
    sudahDiisi: function (nilai) {
      return Boolean(nilai && String(nilai.teks || '').trim().length > 0);
    },
    isiNilaiAwal: function (nilai) {
      return nilai || { teks: '', dataJson: '' };
    }
  });

  /**
   * ==========================================================================
   * PANEL UNGGAH FOTO & GALERI BERKAS PER SOAL
   * ==========================================================================
   */
  function renderPanelUnggahFoto(soal, kontainer, terkunci) {
    const bungkus = document.createElement('div');
    bungkus.className = 'wadah-kanvas-komponen';

    const berkasSoalIni = state.berkasDaftar.filter(function (b) {
      return b.idSoal === soal.id && b.jenis === 'foto';
    });
    const maksPerSoal =
      (window.KONFIG && window.KONFIG.BERKAS && window.KONFIG.BERKAS.MAKS_PER_SOAL) || 5;

    const infoBaris = document.createElement('div');
    infoBaris.style.cssText =
      'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;';

    const teksInfo = document.createElement('span');
    teksInfo.style.cssText = 'font-size:0.9rem;font-weight:700;color:#334155;';
    teksInfo.textContent =
      'Foto terunggah: ' + berkasSoalIni.length + ' dari maksimal ' + maksPerSoal + ' foto (JPG/PNG/WEBP, maks 2 MB)';

    infoBaris.appendChild(teksInfo);

    if (!terkunci && berkasSoalIni.length < maksPerSoal) {
      const labelUnggah = document.createElement('label');
      labelUnggah.className = 'tombol tombol-utama';
      labelUnggah.style.minHeight = '44px';
      labelUnggah.textContent = '📸 Pilih / Ambil Foto';

      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = 'image/jpeg,image/png,image/webp';
      inputFile.className = 'tersembunyi';

      inputFile.addEventListener('change', async function () {
        const file = inputFile.files && inputFile.files[0];
        if (!file) return;
        inputFile.value = '';

        labelUnggah.textContent = '⏳ Mengompres & mengunggah...';
        labelUnggah.style.pointerEvents = 'none';

        try {
          const hasilKompres = await window.FotoLKPD.prosesDanKompresFoto(file);
          await unggahBerkasSoal(soal.id, 'foto', hasilKompres.dataUrl, false);
        } catch (err) {
          window.Umum.tampilkanToast(err.message || 'Gagal memproses foto.', 'bahaya');
        } finally {
          labelUnggah.textContent = '📸 Pilih / Ambil Foto';
          labelUnggah.style.pointerEvents = 'auto';
        }
      });

      labelUnggah.appendChild(inputFile);
      infoBaris.appendChild(labelUnggah);
    }

    bungkus.appendChild(infoBaris);

    // Galeri foto yang sudah ada
    if (berkasSoalIni.length > 0) {
      const galeri = document.createElement('div');
      galeri.className = 'galeri-berkas';

      berkasSoalIni.forEach(function (brk) {
        const kartu = document.createElement('div');
        kartu.className = 'kartu-berkas-item';

        const img = document.createElement('img');
        img.className = 'pratinjau-berkas-img';
        img.alt = brk.namaFile || 'Foto pekerjaan siswa';
        img.src =
          state.cacheDataUrlBerkas[brk.idBerkas] ||
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="100%" height="100%" fill="%23e0f2fe"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%230369a1">Memuat foto...</text></svg>';

        if (!state.cacheDataUrlBerkas[brk.idBerkas]) {
          muatPratinjauBerkas(brk.idBerkas, img);
        }

        img.addEventListener('click', function () {
          if (state.cacheDataUrlBerkas[brk.idBerkas]) {
            bukaModalPratinjau(state.cacheDataUrlBerkas[brk.idBerkas]);
          }
        });

        const namaSpan = document.createElement('div');
        namaSpan.style.cssText =
          'font-size:0.78rem;font-weight:700;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        namaSpan.textContent = brk.namaFile;

        kartu.appendChild(img);
        kartu.appendChild(namaSpan);

        if (!terkunci) {
          const btnHapus = document.createElement('button');
          btnHapus.type = 'button';
          btnHapus.className = 'tombol tombol-bahaya-kecil';
          btnHapus.textContent = '🗑️ Hapus';
          btnHapus.addEventListener('click', function () {
            hapusBerkasSoal(brk.idBerkas);
          });
          kartu.appendChild(btnHapus);
        }

        galeri.appendChild(kartu);
      });

      bungkus.appendChild(galeri);
    }

    kontainer.appendChild(bungkus);
  }

  async function muatPratinjauBerkas(idBerkas, elemenImg) {
    if (!state.sesi) return;
    const res = await window.ApiLKPD.kirim('ambilBerkas', {
      token: state.sesi.token,
      idBerkas: idBerkas
    });
    if (res && res.ok && res.data && res.data.base64Data) {
      state.cacheDataUrlBerkas[idBerkas] = res.data.base64Data;
      if (elemenImg) elemenImg.src = res.data.base64Data;
    }
  }

  async function ambilDanTampilkanGambarKanvas(idBerkas, komponenKanvas) {
    if (!state.sesi) return;
    if (state.cacheDataUrlBerkas[idBerkas]) {
      komponenKanvas.muatGambarDariDataUrl(state.cacheDataUrlBerkas[idBerkas]);
      return;
    }
    const res = await window.ApiLKPD.kirim('ambilBerkas', {
      token: state.sesi.token,
      idBerkas: idBerkas
    });
    if (res && res.ok && res.data && res.data.base64Data) {
      state.cacheDataUrlBerkas[idBerkas] = res.data.base64Data;
      komponenKanvas.muatGambarDariDataUrl(res.data.base64Data);
    }
  }

  async function unggahBerkasSoal(idSoal, jenis, base64Data, timpaGambar) {
    if (!state.sesi || !state.lkpd) return false;
    const res = await window.ApiLKPD.kirim('unggahBerkas', {
      token: state.sesi.token,
      idLkpd: state.lkpd.meta.id,
      judulLkpd: state.lkpd.meta.judul,
      idSoal: idSoal,
      jenis: jenis,
      timpaGambar: Boolean(timpaGambar),
      base64Data: base64Data
    });

    if (!res || !res.ok) {
      window.Umum.tampilkanToast(
        (res && res.pesan) || 'Gagal mengunggah gambar. Coba lagi.',
        'bahaya'
      );
      return false;
    }

    const berkasBaru = res.data.berkas;
    if (jenis === 'gambar' && timpaGambar) {
      state.berkasDaftar = state.berkasDaftar.filter(function (b) {
        return !(b.idSoal === idSoal && b.jenis === 'gambar');
      });
    }
    state.berkasDaftar.push(berkasBaru);
    state.cacheDataUrlBerkas[berkasBaru.idBerkas] = base64Data;

    window.Umum.tampilkanToast('Gambar berhasil diunggah!', 'sukses');
    perbaruiProgres();
    if (jenis === 'foto') {
      renderBagianAktif();
    }
    return true;
  }

  async function hapusBerkasSoal(idBerkas) {
    if (!state.sesi) return;
    const res = await window.ApiLKPD.kirim('hapusBerkas', {
      token: state.sesi.token,
      idBerkas: idBerkas
    });
    if (!res || !res.ok) {
      window.Umum.tampilkanToast((res && res.pesan) || 'Gagal menghapus foto.', 'bahaya');
      return;
    }

    state.berkasDaftar = state.berkasDaftar.filter(function (b) {
      return b.idBerkas !== idBerkas;
    });
    delete state.cacheDataUrlBerkas[idBerkas];

    window.Umum.tampilkanToast('Foto dihapus.', 'sukses');
    perbaruiProgres();
    renderBagianAktif();
  }

  /**
   * ==========================================================================
   * INISIALISASI HALAMAN & AUTENTIKASI SISWA
   * ==========================================================================
   */
  async function mulai() {
    state.lkpd = window.ELKPD;
    if (!state.lkpd) {
      document.getElementById('tajuk-judul').textContent = 'Konten LKPD tidak ditemukan';
      return;
    }

    window.Umum.terapkanTema(state.lkpd.tema);
    renderTajukIdentitas();
    pasangEventLogin();
    pasangEventRuangKerja();
    siapkanBilahSimbol();

    // Muat info publik dari server (daftar kelas & pengaturan aktif)
    const bannerServer = document.getElementById('banner-status-server');
    const teksServer = document.getElementById('teks-status-server');
    bannerServer.classList.remove('tersembunyi');
    teksServer.textContent = 'Menghubungkan ke server sekolah...';

    const info = await window.ApiLKPD.kirim('infoPublik', {}, { maksCoba: 1 });
    if (info && info.ok && info.data) {
      bannerServer.classList.add('tersembunyi');
      state.pengaturanServer = info.data.pengaturan || {};
      state.daftarKelas =
        Array.isArray(info.data.daftarKelas) && info.data.daftarKelas.length > 0
          ? info.data.daftarKelas.map(function (k) {
              return k.nama;
            })
          : (window.KONFIG && window.KONFIG.IDENTITAS_BAWAAN.daftarKelas) || ['VIII'];
    } else {
      bannerServer.className = 'banner banner-peringatan';
      teksServer.textContent =
        (info && info.pesan) ||
        'Menggunakan daftar kelas bawaan karena server belum merespons.';
      state.daftarKelas =
        (window.KONFIG && window.KONFIG.IDENTITAS_BAWAAN.daftarKelas) || ['VIII'];
    }

    isiDropdownKelas(state.daftarKelas);

    // Cek apakah siswa masih memiliki sesi tersimpan di perangkat ini
    const sesiTersimpan = window.Umum.bacaSesiSiswa();
    if (sesiTersimpan && sesiTersimpan.token && sesiTersimpan.siswa) {
      state.sesi = sesiTersimpan;
      await masukKeRuangKerja();
    }
  }

  function renderTajukIdentitas() {
    const meta = state.lkpd.meta || {};
    const tema = state.lkpd.tema || {};
    const maskot = tema.maskot || {};

    document.title = (meta.judul || 'e-LKPD') + ' - ' + (meta.sekolah || '');
    document.getElementById('tajuk-judul').textContent = meta.judul || 'Lembar Kerja Interaktif';
    document.getElementById('tajuk-subjudul').textContent = meta.subjudul || meta.bab || '';
    document.getElementById('tajuk-maskot').textContent = maskot.emoji || '🚀';

    document.getElementById('login-maskot-emoji').textContent = maskot.emoji || '🚀';
    document.getElementById('login-sapaan-maskot').textContent = maskot.sapaan || '';

    const wadahChip = document.getElementById('tajuk-chip-meta');
    wadahChip.innerHTML = '';
    [
      meta.mapel ? '📚 ' + meta.mapel : '',
      meta.kelas ? '🎓 Kelas ' + meta.kelas : '',
      meta.guru ? '👨‍🏫 ' + meta.guru : '',
      meta.sekolah ? '🏫 ' + meta.sekolah : ''
    ]
      .filter(Boolean)
      .forEach(function (teks) {
        const span = document.createElement('span');
        span.className = 'chip-meta';
        span.textContent = teks;
        wadahChip.appendChild(span);
      });

    if (meta.adalahContoh) {
      document.getElementById('banner-contoh-login').classList.remove('tersembunyi');
    }
  }

  function isiDropdownKelas(daftar) {
    const select = document.getElementById('pilih-kelas');
    select.innerHTML = '';
    const optAwal = document.createElement('option');
    optAwal.value = '';
    optAwal.textContent = '-- Pilih Kelas --';
    select.appendChild(optAwal);

    daftar.forEach(function (namaKelas) {
      const opt = document.createElement('option');
      opt.value = namaKelas;
      opt.textContent = 'Kelas ' + namaKelas;
      select.appendChild(opt);
    });

    if (daftar.length === 1) {
      select.value = daftar[0];
    }
  }

  function pasangEventLogin() {
    const form = document.getElementById('form-login-siswa');
    const pilihKelas = document.getElementById('pilih-kelas');
    const inputNama = document.getElementById('input-nama-siswa');
    const areaPin = document.getElementById('area-pin-lanjut');
    const grupKonfirmasi = document.getElementById('grup-konfirmasi-pin');
    const teksStatusAkun = document.getElementById('teks-status-akun');
    const labelPin = document.getElementById('label-input-pin');
    const inputPin = document.getElementById('input-pin-siswa');
    const inputKonfirmasi = document.getElementById('input-konfirmasi-pin');
    const btnSubmit = document.getElementById('tombol-submit-login');
    const btnGanti = document.getElementById('tombol-ganti-nama');

    let modeLogin = 'cek'; // 'cek' | 'masuk' | 'buat_pin'

    function tampilkanGalatLogin(pesan) {
      const kotak = document.getElementById('pesan-galat-login');
      const teks = document.getElementById('teks-galat-login');
      if (!pesan) {
        kotak.classList.add('tersembunyi');
        return;
      }
      teks.textContent = pesan;
      kotak.classList.remove('tersembunyi');
    }

    btnGanti.addEventListener('click', function () {
      modeLogin = 'cek';
      pilihKelas.disabled = false;
      inputNama.disabled = false;
      areaPin.classList.add('tersembunyi');
      grupKonfirmasi.classList.add('tersembunyi');
      btnGanti.classList.add('tersembunyi');
      inputPin.value = '';
      inputKonfirmasi.value = '';
      btnSubmit.textContent = 'Lanjutkan ➡️';
      tampilkanGalatLogin('');
    });

    form.addEventListener('submit', async function (evt) {
      evt.preventDefault();
      tampilkanGalatLogin('');

      const kelas = pilihKelas.value.trim();
      const nama = inputNama.value.trim();

      if (!kelas) {
        tampilkanGalatLogin('Pilih kelas kamu terlebih dahulu ya.');
        pilihKelas.focus();
        return;
      }
      if (nama.length < 2) {
        tampilkanGalatLogin('Ketik nama lengkapmu terlebih dahulu (minimal 2 huruf).');
        inputNama.focus();
        return;
      }

      btnSubmit.disabled = true;

      try {
        if (modeLogin === 'cek') {
          btnSubmit.textContent = '⏳ Memeriksa nama...';
          const resCek = await window.ApiLKPD.kirim('cekSiswa', { kelas: kelas, nama: nama });

          if (!resCek || !resCek.ok) {
            tampilkanGalatLogin((resCek && resCek.pesan) || 'Gagal memeriksa akun siswa.');
            btnSubmit.textContent = 'Lanjutkan ➡️';
            return;
          }

          const statusAkun = resCek.data.statusAkun;
          if (statusAkun === 'terkunci') {
            const menit = Math.ceil((resCek.data.sisaDetik || 300) / 60);
            tampilkanGalatLogin(
              'Akun kamu terkunci sementara karena salah PIN berulang kali. Coba lagi dalam ' +
                menit +
                ' menit.'
            );
            btnSubmit.textContent = 'Lanjutkan ➡️';
            return;
          }

          pilihKelas.disabled = true;
          inputNama.disabled = true;
          areaPin.classList.remove('tersembunyi');
          btnGanti.classList.remove('tersembunyi');

          if (statusAkun === 'baru' || statusAkun === 'perlu_pin') {
            modeLogin = 'buat_pin';
            grupKonfirmasi.classList.remove('tersembunyi');
            labelPin.textContent = '3. Buat PIN Baru (4–6 Angka)';
            teksStatusAkun.textContent =
              statusAkun === 'perlu_pin'
                ? 'PIN kamu telah direset oleh guru. Silakan buat PIN baru.'
                : 'Selamat datang! Karena ini pertama kali kamu masuk, buat PIN 4–6 angka untuk melindungi pekerjaanmu.';
            btnSubmit.textContent = '🔐 Simpan PIN & Mulai Mengerjakan';
          } else {
            modeLogin = 'masuk';
            grupKonfirmasi.classList.add('tersembunyi');
            labelPin.textContent = '3. Masukkan PIN Kamu (4–6 Angka)';
            teksStatusAkun.textContent = 'Halo ' + resCek.data.nama + '! Masukkan PIN kamu untuk melanjutkan.';
            btnSubmit.textContent = '🚀 Masuk ke LKPD';
          }
          inputPin.focus();
          return;
        }

        // Validasi format PIN
        const pin = inputPin.value.trim();
        if (!/^[0-9]{4,6}$/.test(pin)) {
          tampilkanGalatLogin('PIN harus berisi 4 sampai 6 angka saja (contoh: 2408).');
          inputPin.focus();
          return;
        }

        if (modeLogin === 'buat_pin') {
          const konf = inputKonfirmasi.value.trim();
          if (pin !== konf) {
            tampilkanGalatLogin('Ulangan PIN tidak sama. Pastikan kedua kolom PIN sama persis.');
            inputKonfirmasi.focus();
            return;
          }

          btnSubmit.textContent = '⏳ Menyimpan PIN...';
          const resBuat = await window.ApiLKPD.kirim('buatPin', {
            kelas: kelas,
            nama: nama,
            pin: pin
          });
          if (!resBuat || !resBuat.ok) {
            tampilkanGalatLogin((resBuat && resBuat.pesan) || 'Gagal membuat PIN.');
            btnSubmit.textContent = '🔐 Simpan PIN & Mulai Mengerjakan';
            return;
          }

          state.sesi = {
            token: resBuat.data.token,
            siswa: resBuat.data.siswa
          };
          window.Umum.simpanSesiSiswa(state.sesi);
          await masukKeRuangKerja();
          return;
        }

        if (modeLogin === 'masuk') {
          btnSubmit.textContent = '⏳ Memeriksa PIN...';
          const resMasuk = await window.ApiLKPD.kirim('masukSiswa', {
            kelas: kelas,
            nama: nama,
            pin: pin
          });
          if (!resMasuk || !resMasuk.ok) {
            tampilkanGalatLogin((resMasuk && resMasuk.pesan) || 'Gagal masuk.');
            btnSubmit.textContent = '🚀 Masuk ke LKPD';
            return;
          }

          state.sesi = {
            token: resMasuk.data.token,
            siswa: resMasuk.data.siswa
          };
          window.Umum.simpanSesiSiswa(state.sesi);
          await masukKeRuangKerja();
        }
      } finally {
        btnSubmit.disabled = false;
      }
    });
  }

  /**
   * ==========================================================================
   * RUANG PENGERJAAN SISWA & SINKRONISASI JAWABAN
   * ==========================================================================
   */
  async function masukKeRuangKerja() {
    document.getElementById('tampilan-login').classList.add('tersembunyi');
    document.getElementById('tampilan-kerja').classList.remove('tersembunyi');

    document.getElementById('badge-kelas-aktif').textContent = 'Kelas ' + state.sesi.siswa.kelas;
    document.getElementById('nama-siswa-aktif').textContent = state.sesi.siswa.nama;

    aturIndikatorSimpan('menyimpan', '⏳ Memuat pekerjaanmu...');

    const res = await window.ApiLKPD.kirim('muatPekerjaan', {
      token: state.sesi.token,
      idLkpd: state.lkpd.meta.id
    });

    if (!res || !res.ok) {
      if (res && res.kode === 'SESI_TIDAK_VALID') {
        window.Umum.hapusSesiSiswa();
        window.Umum.tampilkanToast('Sesi berakhir, silakan masuk kembali.', 'peringatan');
        location.reload();
        return;
      }
      aturIndikatorSimpan('offline', '⚠️ Mode Offline (Gagal memuat server)');
    } else {
      state.pengerjaan = res.data.pengerjaan;
      state.berkasDaftar = Array.isArray(res.data.berkas) ? res.data.berkas : [];
      state.nilai = res.data.nilai || { diizinkan: false, daftar: [], totalSkor: null };

      // Isi jawaban dari server
      state.jawabanMap = {};
      (res.data.jawaban || []).forEach(function (j) {
        state.jawabanMap[j.idSoal] = {
          teks: j.teks || '',
          dataJson: j.dataJson || ''
        };
      });

      // Gabungkan cadangan lokal jika ada jawaban offline yang belum sempat terkirim
      const cadangan = window.Umum.bacaCadanganLokal(
        state.sesi.siswa.idSiswa,
        state.lkpd.meta.id
      );
      if (cadangan && cadangan.jawaban && state.pengerjaan.status !== 'terkumpul') {
        Object.keys(cadangan.jawaban).forEach(function (idSoal) {
          if (!state.jawabanMap[idSoal] && cadangan.jawaban[idSoal]) {
            state.jawabanMap[idSoal] = cadangan.jawaban[idSoal];
            state.perubahanTertunda[idSoal] = true;
          }
        });
      }

      aturIndikatorSimpan('tersimpan', '✅ Semua tersimpan');
    }

    perbaruiTampilanStatusTerkumpul();
    renderKartuNilaiGuru();
    renderNavigasiBagian();
    renderBagianAktif();
    perbaruiProgres();

    // Jika ada cadangan lokal tertunda saat baru online, segera kirimkan
    if (Object.keys(state.perubahanTertunda).length > 0) {
      jadwalkanSimpanOtomatis();
    }
  }

  function perbaruiTampilanStatusTerkumpul() {
    const terkumpul = state.pengerjaan.status === 'terkumpul';
    const banner = document.getElementById('banner-terkumpul');
    const btnSimpan = document.getElementById('tombol-simpan-manual');
    const btnKumpul = document.getElementById('tombol-kumpulkan-utama');

    if (terkumpul) {
      banner.classList.remove('tersembunyi');
      document.getElementById('detail-waktu-kumpul').textContent =
        'Dikumpulkan pada: ' + window.Umum.formatWaktuIndonesia(state.pengerjaan.waktuKumpul);
      btnSimpan.disabled = true;
      btnKumpul.classList.add('tersembunyi');
      aturIndikatorSimpan('tersimpan', '🔒 Terkumpul & Terkunci');
    } else {
      banner.classList.add('tersembunyi');
      btnSimpan.disabled = false;
      btnKumpul.classList.remove('tersembunyi');
    }
  }

  function renderKartuNilaiGuru() {
    const kartu = document.getElementById('kartu-nilai-guru');
    const isiTotal = document.getElementById('isi-skor-total');
    const daftarKomentar = document.getElementById('daftar-komentar-soal');

    if (!state.nilai || !state.nilai.diizinkan) {
      kartu.classList.add('tersembunyi');
      return;
    }

    const adaSkor = state.nilai.totalSkor !== null && state.nilai.totalSkor !== undefined;
    const daftar = Array.isArray(state.nilai.daftar) ? state.nilai.daftar : [];
    const adaKomentar = daftar.some(function (n) {
      return n.komentar && String(n.komentar).trim().length > 0;
    });

    if (!adaSkor && !adaKomentar) {
      kartu.classList.add('tersembunyi');
      return;
    }

    kartu.classList.remove('tersembunyi');
    isiTotal.innerHTML = '';

    if (adaSkor) {
      const kotak = document.createElement('div');
      kotak.className = 'kotak-skor-besar';
      kotak.innerHTML =
        '<span style="font-weight:800;color:#166534;">Nilai Kamu:</span>' +
        '<span class="angka-skor-besar">' +
        window.Umum.escapeHtml(state.nilai.totalSkor) +
        '</span>';
      isiTotal.appendChild(kotak);
    }

    daftarKomentar.innerHTML = '';
    daftar.forEach(function (item) {
      if (!item.komentar && (item.skor === null || item.idSoal === '__TOTAL__')) return;
      const baris = document.createElement('div');
      baris.style.cssText =
        'background:#ffffff;border-radius:12px;padding:10px 14px;margin-top:8px;border:1px solid #bbf7d0;';
      const judulItem = item.idSoal === '__TOTAL__' ? 'Catatan Umum Guru' : 'Soal ' + item.idSoal;
      const skorTeks = item.skor !== null && item.idSoal !== '__TOTAL__' ? ' (Skor: ' + item.skor + ')' : '';
      baris.innerHTML =
        '<strong>' +
        window.Umum.escapeHtml(judulItem + skorTeks) +
        ':</strong> ' +
        window.Umum.escapeHtml(item.komentar || '-');
      daftarKomentar.appendChild(baris);
    });
  }

  function renderNavigasiBagian() {
    const nav = document.getElementById('navigasi-bagian');
    nav.innerHTML = '';
    const daftarBagian = state.lkpd.bagian || [];

    daftarBagian.forEach(function (bagian, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-bagian' + (idx === state.indeksBagianAktif ? ' aktif' : '');
      btn.textContent = (bagian.maskotBagian || '📘') + ' ' + bagian.judul;
      btn.addEventListener('click', function () {
        state.indeksBagianAktif = idx;
        renderNavigasiBagian();
        renderBagianAktif();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      nav.appendChild(btn);
    });
  }

  function renderBagianAktif() {
    const wadah = document.getElementById('wadah-konten-bagian');
    wadah.innerHTML = '';

    const daftarBagian = state.lkpd.bagian || [];
    const bagian = daftarBagian[state.indeksBagianAktif];
    if (!bagian) return;

    const terkunci = state.pengerjaan.status === 'terkumpul';

    // Header Bagian
    const headerBagian = document.createElement('div');
    headerBagian.className = 'kartu-bagian-header';
    headerBagian.innerHTML =
      '<div class="ikon-maskot-bagian" aria-hidden="true">' +
      window.Umum.escapeHtml(bagian.maskotBagian || '📘') +
      '</div>' +
      '<div>' +
      '<h2 style="margin:0 0 4px;font-family:var(--font-judul);color:var(--warna-utama-gelap);">' +
      window.Umum.escapeHtml(bagian.judul) +
      '</h2>' +
      '<p style="margin:0;color:var(--warna-teks-sekunder);font-size:0.95rem;">' +
      window.Umum.formatTeksMateriAman(bagian.petunjuk || '') +
      '</p>' +
      '</div>';
    wadah.appendChild(headerBagian);

    // Render seluruh blok (bacaan, gambar, tautan_video, soal)
    (bagian.blok || []).forEach(function (blok) {
      if (blok.jenis === 'bacaan') {
        const divBacaan = document.createElement('article');
        divBacaan.className = 'blok-bacaan';
        divBacaan.innerHTML =
          (blok.judul ? '<h3>📖 ' + window.Umum.escapeHtml(blok.judul) + '</h3>' : '') +
          '<div>' +
          window.Umum.formatTeksMateriAman(blok.isi || '') +
          '</div>';
        wadah.appendChild(divBacaan);
      } else if (blok.jenis === 'gambar') {
        const divGambar = document.createElement('figure');
        divGambar.className = 'blok-gambar';
        if (blok.judul) {
          const h3 = document.createElement('h3');
          h3.style.cssText = 'margin:0 0 10px;font-family:var(--font-judul);color:var(--warna-utama-gelap);';
          h3.textContent = blok.judul;
          divGambar.appendChild(h3);
        }
        if (blok.svgIlustrasi) {
          const bungkusSvg = document.createElement('div');
          bungkusSvg.innerHTML = blok.svgIlustrasi;
          divGambar.appendChild(bungkusSvg);
        } else if (blok.url) {
          const img = document.createElement('img');
          img.src = blok.url;
          img.alt = blok.alt || blok.judul || 'Gambar materi';
          divGambar.appendChild(img);
        }
        if (blok.deskripsi) {
          const cap = document.createElement('figcaption');
          cap.style.cssText = 'margin-top:8px;font-size:0.9rem;color:var(--warna-teks-sekunder);';
          cap.innerHTML = window.Umum.formatTeksMateriAman(blok.deskripsi);
          divGambar.appendChild(cap);
        }
        wadah.appendChild(divGambar);
      } else if (blok.jenis === 'tautan_video') {
        const divVideo = document.createElement('div');
        divVideo.className = 'blok-video';
        divVideo.innerHTML =
          '<div style="flex:1;min-width:220px;">' +
          '<strong style="display:block;font-family:var(--font-judul);font-size:1.05rem;color:#92400e;">🎬 ' +
          window.Umum.escapeHtml(blok.judul || 'Video Pembelajaran') +
          '</strong>' +
          '<span style="font-size:0.9rem;color:#78350f;">' +
          window.Umum.escapeHtml(blok.deskripsi || '') +
          '</span>' +
          '</div>';

        const tautan = document.createElement('a');
        tautan.href = blok.url || '#';
        tautan.target = '_blank';
        tautan.rel = 'noopener noreferrer';
        tautan.className = 'tombol tombol-aksen';
        tautan.textContent = '▶️ ' + (blok.labelTombol || 'Tonton Video');
        divVideo.appendChild(tautan);
        wadah.appendChild(divVideo);
      } else if (blok.jenis === 'soal') {
        const kartuSoal = buatElemenKartuSoal(blok, terkunci);
        wadah.appendChild(kartuSoal);
      }
    });

    // Atur tombol navigasi bawah
    const btnSebelumnya = document.getElementById('tombol-bagian-sebelumnya');
    const btnBerikutnya = document.getElementById('tombol-bagian-berikutnya');
    const btnKumpul = document.getElementById('tombol-kumpulkan-utama');

    btnSebelumnya.disabled = state.indeksBagianAktif === 0;
    const bagianTerakhir = state.indeksBagianAktif >= daftarBagian.length - 1;
    btnBerikutnya.classList.toggle('tersembunyi', bagianTerakhir);

    if (!terkunci) {
      btnKumpul.classList.toggle('tersembunyi', !bagianTerakhir);
    }

    // Render rumus matematika KaTeX setelah seluruh DOM bagian terpasang
    window.Umum.renderMatematika(wadah);
  }

  function buatElemenKartuSoal(soal, terkunci) {
    const tipe = String(soal.tipe || 'teks_singkat').toLowerCase();
    const definisi = REGISTRI_TIPE_SOAL[tipe];

    const kartu = document.createElement('section');
    kartu.className = 'kartu-soal';
    kartu.id = 'kartu_soal_' + soal.id;

    const kepala = document.createElement('div');
    kepala.className = 'kepala-soal';

    const lencanaNomor = document.createElement('span');
    lencanaNomor.className = 'nomor-soal-lencana';
    lencanaNomor.textContent = 'Soal ' + soal.nomor;

    const lencanaWajib = document.createElement('span');
    if (soal.wajib) {
      lencanaWajib.className = 'label-wajib';
      lencanaWajib.textContent =
        soal.wajib === 'gambar_atau_foto' ? 'Wajib Gambar/Foto' : 'Wajib Diisi';
    } else {
      lencanaWajib.className = 'label-opsional';
      lencanaWajib.textContent = 'Opsional';
    }

    kepala.appendChild(lencanaNomor);
    kepala.appendChild(lencanaWajib);

    const pertanyaan = document.createElement('div');
    pertanyaan.className = 'teks-pertanyaan';
    pertanyaan.innerHTML = window.Umum.formatTeksMateriAman(soal.teks || '');

    const wadahInput = document.createElement('div');

    kartu.appendChild(kepala);
    kartu.appendChild(pertanyaan);
    kartu.appendChild(wadahInput);

    if (!definisi) {
      wadahInput.textContent = 'Tipe soal "' + tipe + '" belum terdaftar.';
      return kartu;
    }

    const nilaiAwal = definisi.isiNilaiAwal(state.jawabanMap[soal.id], soal);

    definisi.render(
      soal,
      wadahInput,
      nilaiAwal,
      terkunci,
      function (nilaiBaru) {
        if (terkunci) return;
        state.jawabanMap[soal.id] = nilaiBaru;
        state.perubahanTertunda[soal.id] = true;

        // Simpan cadangan offline seketika
        window.Umum.simpanCadanganLokal(
          state.sesi.siswa.idSiswa,
          state.lkpd.meta.id,
          state.jawabanMap
        );

        kartu.classList.remove('sorot-wajib');
        perbaruiStatusKartuTerjawab(kartu, soal, definisi);
        perbaruiProgres();
        jadwalkanSimpanOtomatis();
      },
      { state: state }
    );

    perbaruiStatusKartuTerjawab(kartu, soal, definisi);
    return kartu;
  }

  function perbaruiStatusKartuTerjawab(kartu, soal, definisi) {
    const sudah = definisi.sudahDiisi(state.jawabanMap[soal.id], soal);
    kartu.classList.toggle('terjawab', sudah);
  }

  function ambilSemuaSoal() {
    const hasil = [];
    (state.lkpd.bagian || []).forEach(function (bag) {
      (bag.blok || []).forEach(function (b) {
        if (b.jenis === 'soal') hasil.push(b);
      });
    });
    return hasil;
  }

  function perbaruiProgres() {
    const semuaSoal = ambilSemuaSoal();
    let terjawab = 0;

    semuaSoal.forEach(function (soal) {
      const def = REGISTRI_TIPE_SOAL[String(soal.tipe || '').toLowerCase()];
      if (def && def.sudahDiisi(state.jawabanMap[soal.id], soal)) {
        terjawab++;
      }
    });

    const total = semuaSoal.length;
    const persen = total > 0 ? Math.round((terjawab / total) * 100) : 0;

    document.getElementById('label-progres-soal').textContent =
      'Soal ' + terjawab + ' dari ' + total + ' terjawab';
    document.getElementById('lencana-bintang-progres').textContent =
      (persen === 100 ? '🌟 ' : '⭐ ') + persen + '%';
    document.getElementById('isi-progres').style.width = persen + '%';
    document.getElementById('bar-progres-aria').setAttribute('aria-valuenow', String(persen));
  }

  /**
   * ==========================================================================
   * SIMPAN OTOMATIS BERKELOMPOK (BATCH DEBOUNCE 3 DETIK) & OFFLINE SYNC
   * ==========================================================================
   */
  function aturIndikatorSimpan(kelasStatus, teks) {
    const el = document.getElementById('indikator-simpan');
    if (!el) return;
    el.className = 'indikator-simpan ' + (kelasStatus || '');
    el.textContent = teks;
  }

  function jadwalkanSimpanOtomatis() {
    if (state.pengerjaan.status === 'terkumpul') return;
    aturIndikatorSimpan('', '✏️ Perubahan belum tersimpan...');

    if (state.timerSimpanOtomatis) {
      clearTimeout(state.timerSimpanOtomatis);
    }

    const jeda =
      (window.KONFIG && window.KONFIG.JARINGAN && window.KONFIG.JARINGAN.JEDA_SIMPAN_OTOMATIS_MS) ||
      3000;

    state.timerSimpanOtomatis = setTimeout(function () {
      kirimPerubahanJawaban(false);
    }, jeda);
  }

  async function kirimPerubahanJawaban(tampilkanNotifManual) {
    if (!state.sesi || state.pengerjaan.status === 'terkumpul') return true;

    const daftarIdBerubah = Object.keys(state.perubahanTertunda);
    if (daftarIdBerubah.length === 0) {
      if (tampilkanNotifManual) {
        window.Umum.tampilkanToast('Semua jawabanmu sudah tersimpan.', 'sukses');
      }
      aturIndikatorSimpan('tersimpan', '✅ Semua tersimpan');
      return true;
    }

    if (state.sedangMenyimpan) return false;
    state.sedangMenyimpan = true;
    aturIndikatorSimpan('menyimpan', '⏳ Menyimpan jawaban...');

    const paketJawaban = daftarIdBerubah.map(function (idSoal) {
      const j = state.jawabanMap[idSoal] || { teks: '', dataJson: '' };
      return {
        idSoal: idSoal,
        teks: j.teks || '',
        dataJson: j.dataJson || ''
      };
    });

    try {
      const res = await window.ApiLKPD.kirim('simpanJawaban', {
        token: state.sesi.token,
        idLkpd: state.lkpd.meta.id,
        daftarJawaban: paketJawaban
      });

      if (res && res.ok) {
        // Hapus hanya ID yang sudah terkirim (jaga jika ada ketikan baru saat sedang mengirim)
        daftarIdBerubah.forEach(function (id) {
          delete state.perubahanTertunda[id];
        });
        aturIndikatorSimpan('tersimpan', '✅ Tersimpan otomatis');
        if (tampilkanNotifManual) {
          window.Umum.tampilkanToast('Jawaban berhasil disimpan!', 'sukses');
        }
        return true;
      } else {
        const isOffline = res && (res.kode === 'OFFLINE' || res.kode === 'KONEKSI_PUTUS');
        aturIndikatorSimpan(
          isOffline ? 'offline' : 'galat',
          isOffline ? '📴 Offline - Tersimpan di perangkat' : '⚠️ Gagal simpan, akan dicoba lagi'
        );
        if (tampilkanNotifManual) {
          window.Umum.tampilkanToast(
            (res && res.pesan) || 'Gagal menyimpan ke server. Jawaban aman di perangkat.',
            'peringatan'
          );
        }
        return false;
      }
    } finally {
      state.sedangMenyimpan = false;
    }
  }

  /**
   * ==========================================================================
   * PEMERIKSAAN WAJIB & PENGUMPULAN PEKERJAAN
   * ==========================================================================
   */
  function periksaSyaratSebelumKumpul() {
    const semuaSoal = ambilSemuaSoal();
    const soalWajibKurang = [];
    let soalKosongBiasa = 0;

    semuaSoal.forEach(function (soal) {
      const def = REGISTRI_TIPE_SOAL[String(soal.tipe || '').toLowerCase()];
      const terisi = def ? def.sudahDiisi(state.jawabanMap[soal.id], soal) : false;

      if (!terisi) {
        if (soal.wajib) {
          soalWajibKurang.push(soal);
        } else {
          soalKosongBiasa++;
        }
      }
    });

    const aturan = state.lkpd.aturanKumpul || {};
    const kurangFotoAtauGambarGlobal =
      Boolean(aturan.wajibMinimalFotoAtauGambar) && state.berkasDaftar.length === 0;

    return {
      soalWajibKurang: soalWajibKurang,
      soalKosongBiasa: soalKosongBiasa,
      kurangFotoAtauGambarGlobal: kurangFotoAtauGambarGlobal,
      pesanSyaratFotoGambar:
        aturan.pesanSyaratFotoGambar ||
        'Kamu wajib melampirkan minimal 1 foto atau gambar kanvas sebelum mengumpulkan.'
    };
  }

  function tampilkanModalKonfirmasi(judul, htmlIsi, daftarTombol) {
    const modal = document.getElementById('modal-konfirmasi');
    document.getElementById('judul-modal-konfirmasi').textContent = judul;
    const isi = document.getElementById('isi-modal-konfirmasi');
    isi.innerHTML = htmlIsi;

    const wadahAksi = document.getElementById('aksi-modal-konfirmasi');
    wadahAksi.innerHTML = '';
    daftarTombol.forEach(function (t) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tombol ' + (t.kelas || 'tombol-sekunder');
      btn.textContent = t.label;
      btn.addEventListener('click', function () {
        modal.classList.add('tersembunyi');
        if (typeof t.onKlik === 'function') t.onKlik();
      });
      wadahAksi.appendChild(btn);
    });

    modal.classList.remove('tersembunyi');
  }

  function bukaModalPratinjau(src) {
    const modal = document.getElementById('modal-pratinjau-gambar');
    document.getElementById('img-pratinjau-penuh').src = src;
    modal.classList.remove('tersembunyi');
  }

  function mulaiProsesKumpulkan() {
    const hasilCek = periksaSyaratSebelumKumpul();

    if (hasilCek.soalWajibKurang.length > 0 || hasilCek.kurangFotoAtauGambarGlobal) {
      let pesanHtml = '<p>Beberapa syarat wajib belum terpenuhi sebelum mengumpulkan:</p><ul>';

      if (hasilCek.kurangFotoAtauGambarGlobal) {
        pesanHtml +=
          '<li><strong>Lampiran Foto/Gambar:</strong> ' +
          window.Umum.escapeHtml(hasilCek.pesanSyaratFotoGambar) +
          '</li>';
      }

      hasilCek.soalWajibKurang.forEach(function (s) {
        pesanHtml +=
          '<li><strong>Soal Nomor ' +
          window.Umum.escapeHtml(s.nomor) +
          '</strong> belum dikerjakan.</li>';
      });
      pesanHtml += '</ul>';

      const soalPertamaKurang = hasilCek.soalWajibKurang[0];
      tampilkanModalKonfirmasi('Belum Bisa Dikumpulkan', pesanHtml, [
        {
          label: 'Periksa Soal Sekarang',
          kelas: 'tombol-utama',
          onKlik: function () {
            if (soalPertamaKurang) {
              lompatKeSoal(soalPertamaKurang.id);
            }
          }
        }
      ]);
      return;
    }

    let konfirmasiHtml =
      '<p>Apakah kamu yakin ingin mengumpulkan pekerjaan sekarang?</p>' +
      '<p style="color:#475569;font-size:0.92rem;">Setelah dikumpulkan, jawaban akan <strong>dikunci</strong> dan tidak bisa diubah lagi kecuali dibuka oleh Bapak/Ibu Guru.</p>';

    if (hasilCek.soalKosongBiasa > 0) {
      konfirmasiHtml +=
        '<div class="banner banner-peringatan" style="margin:10px 0;">' +
        '<span class="banner-ikon">💡</span>' +
        '<div>Masih ada <strong>' +
        hasilCek.soalKosongBiasa +
        ' soal opsional</strong> yang belum diisi. Kamu tetap boleh mengumpulkan.</div></div>';
    }

    tampilkanModalKonfirmasi('Siap Mengumpulkan Pekerjaan?', konfirmasiHtml, [
      { label: 'Batal, Cek Lagi', kelas: 'tombol-sekunder' },
      {
        label: '🚀 Ya, Kumpulkan Sekarang',
        kelas: 'tombol-sukses',
        onKlik: eksekusiKumpulkanKeServer
      }
    ]);
  }

  async function eksekusiKumpulkanKeServer() {
    const btnKumpul = document.getElementById('tombol-kumpulkan-utama');
    btnKumpul.disabled = true;
    btnKumpul.textContent = '⏳ Mengumpulkan...';

    try {
      // Kirim semua jawaban terakhir agar tidak ada yang tertinggal
      const semuaJawaban = Object.keys(state.jawabanMap).map(function (idSoal) {
        return {
          idSoal: idSoal,
          teks: state.jawabanMap[idSoal].teks || '',
          dataJson: state.jawabanMap[idSoal].dataJson || ''
        };
      });

      const res = await window.ApiLKPD.kirim('kumpulkan', {
        token: state.sesi.token,
        idLkpd: state.lkpd.meta.id,
        daftarJawaban: semuaJawaban
      });

      if (!res || !res.ok) {
        window.Umum.tampilkanToast(
          (res && res.pesan) || 'Gagal mengumpulkan pekerjaan. Coba lagi.',
          'bahaya'
        );
        return;
      }

      state.perubahanTertunda = {};
      state.pengerjaan.status = 'terkumpul';
      state.pengerjaan.waktuKumpul = res.data.waktuKumpul || new Date().toISOString();

      perbaruiTampilanStatusTerkumpul();
      renderBagianAktif();
      window.Umum.luncurkanKonfeti();
      window.Umum.tampilkanToast('Selamat! Pekerjaanmu berhasil dikumpulkan 🎉', 'sukses');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Muat ulang nilai jika fitur skor otomatis diaktifkan
      await muatNilaiTerbaruSiswa(false);
    } finally {
      btnKumpul.disabled = false;
      btnKumpul.textContent = '🚀 Kumpulkan Pekerjaan';
    }
  }

  async function muatNilaiTerbaruSiswa(tampilkanToastInfo) {
    if (!state.sesi) return;
    const res = await window.ApiLKPD.kirim('lihatNilaiSaya', {
      token: state.sesi.token,
      idLkpd: state.lkpd.meta.id
    });
    if (res && res.ok && res.data) {
      state.nilai = res.data;
      renderKartuNilaiGuru();
      if (tampilkanToastInfo) {
        window.Umum.tampilkanToast('Status penilaian berhasil diperbarui.', 'sukses');
      }
    }
  }

  function lompatKeSoal(idSoal) {
    const daftarBagian = state.lkpd.bagian || [];
    for (let i = 0; i < daftarBagian.length; i++) {
      const ketemu = (daftarBagian[i].blok || []).some(function (b) {
        return b.jenis === 'soal' && b.id === idSoal;
      });
      if (ketemu) {
        state.indeksBagianAktif = i;
        renderNavigasiBagian();
        renderBagianAktif();
        setTimeout(function () {
          const el = document.getElementById('kartu_soal_' + idSoal);
          if (el) {
            el.classList.add('sorot-wajib');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 80);
        return;
      }
    }
  }

  /**
   * ==========================================================================
   * BILAH SIMBOL MATEMATIKA & EVENT RUANG KERJA
   * ==========================================================================
   */
  function siapkanBilahSimbol() {
    const bilahKonfig = state.lkpd.bilahSimbol;
    const bilahEl = document.getElementById('bilah-simbol');
    const wadahTombol = document.getElementById('daftar-tombol-simbol');

    if (!bilahKonfig || !bilahKonfig.aktif || !Array.isArray(bilahKonfig.daftar)) {
      bilahEl.classList.add('tersembunyi');
      return;
    }

    document.getElementById('judul-bilah-simbol').textContent =
      '🧮 ' + (bilahKonfig.judul || 'Bilah Simbol Matematika');
    wadahTombol.innerHTML = '';

    bilahKonfig.daftar.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tombol-simbol';
      btn.textContent = item.label;
      btn.title = item.keterangan || item.label;
      btn.addEventListener('mousedown', function (e) {
        // Cegah kehilangan fokus dari input yang sedang diketik siswa
        e.preventDefault();
      });
      btn.addEventListener('click', function () {
        sisipkanSimbolKeInputAktif(item.sisip || item.label);
      });
      wadahTombol.appendChild(btn);
    });

    // Tampilkan bilah simbol saat siswa fokus pada input teks atau textarea
    document.addEventListener('focusin', function (evt) {
      const target = evt.target;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search'))) &&
        !target.disabled &&
        document.getElementById('tampilan-kerja') &&
        !document.getElementById('tampilan-kerja').classList.contains('tersembunyi')
      ) {
        state.elemenInputAktif = target;
        bilahEl.classList.remove('tersembunyi');
      }
    });

    document.getElementById('tombol-tutup-simbol').addEventListener('click', function () {
      bilahEl.classList.add('tersembunyi');
    });
  }

  function sisipkanSimbolKeInputAktif(simbol) {
    const el = state.elemenInputAktif;
    if (!el || el.disabled) {
      window.Umum.tampilkanToast('Ketuk kolom jawaban terlebih dahulu sebelum memilih simbol.', 'peringatan');
      return;
    }

    const awal = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length;
    const akhir = typeof el.selectionEnd === 'number' ? el.selectionEnd : el.value.length;
    const teksSebelum = el.value.slice(0, awal);
    const teksSesudah = el.value.slice(akhir);

    el.value = teksSebelum + simbol + teksSesudah;
    const posisiBaru = awal + simbol.length;
    el.focus();
    if (typeof el.setSelectionRange === 'function') {
      el.setSelectionRange(posisiBaru, posisiBaru);
    }

    // Picu event input agar sistem simpan otomatis menangkap perubahan
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function pasangEventRuangKerja() {
    document.getElementById('tombol-simpan-manual').addEventListener('click', function () {
      kirimPerubahanJawaban(true);
    });

    document.getElementById('tombol-keluar-siswa').addEventListener('click', function () {
      window.Umum.hapusSesiSiswa();
      location.reload();
    });

    document.getElementById('tombol-bagian-sebelumnya').addEventListener('click', function () {
      if (state.indeksBagianAktif > 0) {
        state.indeksBagianAktif--;
        renderNavigasiBagian();
        renderBagianAktif();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('tombol-bagian-berikutnya').addEventListener('click', function () {
      const totalBagian = (state.lkpd.bagian || []).length;
      if (state.indeksBagianAktif < totalBagian - 1) {
        state.indeksBagianAktif++;
        renderNavigasiBagian();
        renderBagianAktif();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('tombol-kumpulkan-utama').addEventListener('click', function () {
      mulaiProsesKumpulkan();
    });

    document.getElementById('tombol-muat-ulang-nilai').addEventListener('click', function () {
      muatNilaiTerbaruSiswa(true);
    });

    document.getElementById('tombol-unduh-pekerjaanku').addEventListener('click', function () {
      // Pada Tahap 3 akan dihubungkan ke modul js/unduh.js (PDF terstruktur lengkap)
      if (window.UnduhLKPD && typeof window.UnduhLKPD.unduhPdfSiswa === 'function') {
        window.UnduhLKPD.unduhPdfSiswa({
          lkpd: state.lkpd,
          siswa: state.sesi.siswa,
          pengerjaan: state.pengerjaan,
          jawabanMap: state.jawabanMap,
          berkasDaftar: state.berkasDaftar,
          cacheDataUrlBerkas: state.cacheDataUrlBerkas,
          nilai: state.nilai
        });
      } else {
        window.print();
      }
    });

    document.getElementById('tombol-tutup-pratinjau').addEventListener('click', function () {
      document.getElementById('modal-pratinjau-gambar').classList.add('tersembunyi');
    });

    // Otomatis sinkronkan cadangan lokal ketika koneksi internet kembali online
    window.addEventListener('online', function () {
      window.Umum.tampilkanToast('Koneksi internet tersambung kembali. Menyinkronkan jawaban...', 'sukses');
      if (Object.keys(state.perubahanTertunda).length > 0) {
        kirimPerubahanJawaban(false);
      } else {
        aturIndikatorSimpan('tersimpan', '✅ Kembali online');
      }
    });

    window.addEventListener('offline', function () {
      aturIndikatorSimpan('offline', '📴 Offline - Jawaban aman di perangkat');
    });
  }

  document.addEventListener('DOMContentLoaded', mulai);

  return {
    daftarTipeSoal: daftarTipeSoal,
    ambilState: function () {
      return state;
    }
  };
})();