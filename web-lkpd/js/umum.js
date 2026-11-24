/**
 * ============================================================================
 * MODUL UTILITAS UMUM (KEAMANAN DOM, TEMA, KATEX, SESI, KONFETI)
 * ============================================================================
 */

window.Umum = (function () {
  'use strict';

  const KUNCI_SESI_SISWA = 'ELKPD_SESI_SISWA_V1';
  const KUNCI_CADANGAN_PREFIX = 'ELKPD_CADANGAN_';

  /**
   * Menyaring teks mentah agar aman dimasukkan ke dalam HTML (mencegah XSS).
   */
  function escapeHtml(teks) {
    if (teks === undefined || teks === null) return '';
    return String(teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Memformat teks materi ringan (tebal **...** dan baris baru) secara aman
   * dengan tetap menjaga pembatas rumus matematika $...$ dan $$...$$.
   */
  function formatTeksMateriAman(teks) {
    const aman = escapeHtml(teks);
    return aman
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Merender rumus matematika dengan KaTeX jika fitur diaktifkan dan pustaka termuat.
   * Jika KaTeX gagal dimuat, teks biasa tetap tampil dengan rapi tanpa galat.
   */
  function renderMatematika(elemenTarget) {
    if (!elemenTarget) return;
    const fiturAktif = window.KONFIG && window.KONFIG.FITUR && window.KONFIG.FITUR.MATEMATIKA_KATEX;
    if (!fiturAktif) return;

    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(elemenTarget, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        // Fallback aman: biarkan teks asli tetap terbaca
      }
    }
  }

  /**
   * Menerapkan tema warna dan font dari objek ELKPD.tema ke variabel CSS root.
   */
  function terapkanTema(tema) {
    if (!tema) return;
    const root = document.documentElement.style;
    if (tema.warnaUtama) root.setProperty('--warna-utama', tema.warnaUtama);
    if (tema.warnaUtamaGelap) root.setProperty('--warna-utama-gelap', tema.warnaUtamaGelap);
    if (tema.warnaUtamaMuda) root.setProperty('--warna-utama-muda', tema.warnaUtamaMuda);
    if (tema.warnaAksen) root.setProperty('--warna-aksen', tema.warnaAksen);
    if (tema.warnaLatar) root.setProperty('--warna-latar', tema.warnaLatar);
    if (tema.warnaKartu) root.setProperty('--warna-kartu', tema.warnaKartu);
    if (tema.warnaTeks) root.setProperty('--warna-teks', tema.warnaTeks);
    if (tema.fontJudul) root.setProperty('--font-judul', tema.fontJudul);
    if (tema.fontIsi) root.setProperty('--font-isi', tema.fontIsi);
  }

  /**
   * Menampilkan notifikasi singkat (toast) yang ramah anak.
   */
  function tampilkanToast(pesan, jenis) {
    const wadah = document.getElementById('wadah-toast');
    if (!wadah) return;

    const item = document.createElement('div');
    item.className = 'item-toast ' + (jenis || '');
    item.textContent = pesan;
    wadah.appendChild(item);

    setTimeout(function () {
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 320);
    }, 3500);
  }

  /**
   * Memformat waktu ISO menjadi format Indonesia yang mudah dibaca.
   */
  function formatWaktuIndonesia(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    try {
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (err) {
      return d.toLocaleString();
    }
  }

  /**
   * Manajemen sesi siswa di localStorage agar siswa tidak terputus saat halaman segar ulang.
   */
  function simpanSesiSiswa(dataSesi) {
    try {
      localStorage.setItem(KUNCI_SESI_SISWA, JSON.stringify(dataSesi));
    } catch (err) {
      // Abaikan jika penyimpanan penuh
    }
  }

  function bacaSesiSiswa() {
    try {
      const raw = localStorage.getItem(KUNCI_SESI_SISWA);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function hapusSesiSiswa() {
    try {
      localStorage.removeItem(KUNCI_SESI_SISWA);
    } catch (err) {
      // Abaikan
    }
  }

  /**
   * Cadangan jawaban lokal per siswa & LKPD untuk perlindungan saat offline.
   */
  function simpanCadanganLokal(idSiswa, idLkpd, objekJawaban) {
    try {
      const kunci = KUNCI_CADANGAN_PREFIX + idSiswa + '_' + idLkpd;
      localStorage.setItem(
        kunci,
        JSON.stringify({
          waktu: new Date().toISOString(),
          jawaban: objekJawaban
        })
      );
    } catch (err) {
      // Abaikan jika kuota localStorage penuh
    }
  }

  function bacaCadanganLokal(idSiswa, idLkpd) {
    try {
      const kunci = KUNCI_CADANGAN_PREFIX + idSiswa + '_' + idLkpd;
      const raw = localStorage.getItem(kunci);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Efek animasi konfeti ceria saat siswa selesai mengumpulkan LKPD.
   * Menghormati preferensi aksesibilitas prefers-reduced-motion.
   */
  function luncurkanKonfeti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const kanvas = document.getElementById('kanvas-konfeti');
    if (!kanvas) return;

    kanvas.classList.remove('tersembunyi');
    const ctx = kanvas.getContext('2d');
    kanvas.width = window.innerWidth;
    kanvas.height = window.innerHeight;

    const warna = ['#0284c7', '#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];
    const partikel = [];
    for (let i = 0; i < 110; i++) {
      partikel.push({
        x: Math.random() * kanvas.width,
        y: Math.random() * kanvas.height - kanvas.height,
        w: 8 + Math.random() * 8,
        h: 6 + Math.random() * 6,
        warna: warna[i % warna.length],
        kecepatanY: 2.5 + Math.random() * 3.5,
        kecepatanX: -1.5 + Math.random() * 3,
        sudut: Math.random() * 360,
        putar: -4 + Math.random() * 8
      });
    }

    let frame = 0;
    function gambarFrame() {
      frame++;
      ctx.clearRect(0, 0, kanvas.width, kanvas.height);
      partikel.forEach(function (p) {
        p.y += p.kecepatanY;
        p.x += p.kecepatanX;
        p.sudut += p.putar;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.sudut * Math.PI) / 180);
        ctx.fillStyle = p.warna;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frame < 160) {
        requestAnimationFrame(gambarFrame);
      } else {
        ctx.clearRect(0, 0, kanvas.width, kanvas.height);
        kanvas.classList.add('tersembunyi');
      }
    }

    requestAnimationFrame(gambarFrame);
  }

  return {
    escapeHtml: escapeHtml,
    formatTeksMateriAman: formatTeksMateriAman,
    renderMatematika: renderMatematika,
    terapkanTema: terapkanTema,
    tampilkanToast: tampilkanToast,
    formatWaktuIndonesia: formatWaktuIndonesia,
    simpanSesiSiswa: simpanSesiSiswa,
    bacaSesiSiswa: bacaSesiSiswa,
    hapusSesiSiswa: hapusSesiSiswa,
    simpanCadanganLokal: simpanCadanganLokal,
    bacaCadanganLokal: bacaCadanganLokal,
    luncurkanKonfeti: luncurkanKonfeti
  };
})();