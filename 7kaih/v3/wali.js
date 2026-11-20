// wali.js — layar wali kelas (Tahap 4). Header rekap pakai nama lengkap.
(function () {
  App.state.siswaListWali = []; App.state.bulanRekap = ''; App.state.bulanRefSiswa = '';

  App.bukaMenuWali = function (key) {
    if (key === 'siswa') bukaKelola();
    else if (key === 'pantau') bukaPemantauan();
    else if (key === 'validasi') bukaValidasi();
    else if (key === 'rekap') bukaRekap();
    else if (key === 'refsiswa') bukaRefleksiSiswa();
  };

  function bukaKelola() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Kelola Siswa</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.siswaList', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.siswaListWali = res.data.siswa; App.state.hariIni = res.data.hariIni; renderKelola(res.data); });
  }
  function renderKelola(data) {
    var html = '<h2><span class="titik titik-kuning"></span>Kelola Siswa</h2>';
    html += '<div class="habit-row"><div class="habit-nama">Tambah Siswa</div>';
    html += '<input id="tnNisn" class="input" placeholder="NISN (6-12 digit)" inputmode="numeric">';
    html += '<input id="tnNama" class="input" style="margin-top:8px" placeholder="Nama lengkap">';
    html += '<select id="tnJk" class="input" style="margin-top:8px"><option value="">Jenis kelamin</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>';
    html += '<button id="btnTambah" class="btn btn-block">Tambah</button><p id="tnErr" class="pesan-err"></p></div>';
    html += '<div class="habit-row"><div class="habit-nama">Impor Massal</div>';
    html += '<p class="muted kecil">Tempel: <b>NISN, Nama, L/P</b> per baris (koma/tab).</p>';
    html += '<textarea id="imporTxt" class="input" rows="5" placeholder="1234567890,Andi Pratama,L&#10;..."></textarea>';
    html += '<button id="btnImpor" class="btn btn-block btn-ghost">Impor</button><p id="imporHasil" class="muted kecil"></p></div>';
    html += '<div class="habit-nama" style="margin-top:14px">Daftar Siswa (' + data.siswa.length + ')</div>';
    if (!data.siswa.length) html += '<p class="muted">Belum ada siswa.</p>';
    data.siswa.forEach(function (s, idx) {
      html += '<div class="siswa-item"><div class="siswa-info"><b>' + (idx + 1) + '. ' + App.escapeHtml(s.nama) + '</b> — ' + App.escapeHtml(s.nisn) + ' (' + s.jk + ')';
      html += '<br><span class="muted kecil">Isi hari ini: ' + (s.isiHariIni ? 'Ya' : 'Belum') + ' · Terakhir: ' + (s.tglTerakhir || '-') + '</span></div>';
      html += '<div class="siswa-aksi"><button class="chip" data-act="edit" data-id="' + s.id + '">Edit</button><button class="chip" data-act="reset" data-id="' + s.id + '">Reset PIN</button><button class="chip" data-act="nonaktif" data-id="' + s.id + '">Nonaktifkan</button></div></div>';
    });
    App.el('konten').innerHTML = html;
    App.el('btnTambah').addEventListener('click', tambahSiswa);
    App.el('btnImpor').addEventListener('click', imporSiswa);
    Array.prototype.forEach.call(App.el('konten').querySelectorAll('.siswa-aksi .chip'), function (btn) { btn.addEventListener('click', function () { aksiSiswa(btn.getAttribute('data-act'), btn.getAttribute('data-id')); }); });
  }
  function tambahSiswa() {
    var nisn = App.el('tnNisn').value.trim(), nama = App.el('tnNama').value.trim(), jk = App.el('tnJk').value;
    App.setErr('tnErr', '');
    if (!/^\d{6,12}$/.test(nisn)) { App.setErr('tnErr', 'NISN 6-12 digit.'); return; }
    if (!nama) { App.setErr('tnErr', 'Nama wajib.'); return; }
    if (!jk) { App.setErr('tnErr', 'Pilih L/P.'); return; }
    App.setLoading('btnTambah', true);
    App.api('wali.siswaTambah', { nisn: nisn, nama: nama, jk: jk }, App.state.token).then(function (res) { App.setLoading('btnTambah', false); if (!res || !res.ok) { App.setErr('tnErr', (res && res.error) || 'Gagal.'); return; } App.toast('Siswa ditambahkan. PIN awal: ' + res.data.pin + ' (wajib ganti).', 'ok'); bukaKelola(); });
  }
  function imporSiswa() {
    var txt = App.el('imporTxt').value.trim(), hasil = App.el('imporHasil');
    if (!txt) { hasil.textContent = 'Tempel data dulu.'; return; }
    var lines = txt.split(/\r?\n/), rows = [];
    lines.forEach(function (line) { line = line.trim(); if (!line) return; var parts = line.split(/[,\t]/).map(function (p) { return p.trim(); }); if (parts.length >= 3) rows.push({ nisn: parts[0], nama: parts.slice(1, -1).join(' '), jk: parts[parts.length - 1] }); else if (parts.length === 2) rows.push({ nisn: parts[0], nama: parts[1], jk: '' }); });
    if (!rows.length) { hasil.textContent = 'Format tidak terbaca.'; return; }
    App.el('btnImpor').disabled = true;
    App.api('wali.siswaImpor', { rows: rows }, App.state.token).then(function (res) { App.el('btnImpor').disabled = false; if (!res || !res.ok) { hasil.textContent = (res && res.error) || 'Gagal.'; return; } var d = res.data; hasil.textContent = 'Berhasil: ' + d.sukses + '. Gagal: ' + d.errors.length + (d.errors.length ? ' — ' + d.errors.join('; ') : ''); if (d.sukses > 0) { App.toast(d.sukses + ' siswa diimpor.', 'ok'); bukaKelola(); } });
  }
  function aksiSiswa(act, id) {
    if (act === 'edit') {
      var s = null;
      for (var i = 0; i < App.state.siswaListWali.length; i++) if (App.state.siswaListWali[i].id === id) { s = App.state.siswaListWali[i]; break; }
      if (!s) return;
      App.modalForm('Edit Siswa', [
        { kunci: 'nisn', label: 'NISN', val: s.nisn },
        { kunci: 'nama', label: 'Nama', val: s.nama },
        { kunci: 'jk', label: 'Jenis Kelamin', val: s.jk, type: 'select', opts: [{ v: 'L', l: 'Laki-laki' }, { v: 'P', l: 'Perempuan' }] }
      ], function (v) {
        App.api('wali.siswaEdit', { idSiswa: id, nisn: v.nisn, nama: v.nama, jk: v.jk }, App.state.token).then(function (res) { if (res && res.ok) { App.toast('Diperbarui.', 'ok'); bukaKelola(); } else App.toast((res && res.error) || 'Gagal.', 'err'); });
      });
    } else if (act === 'reset') { if (!window.confirm('Reset PIN siswa?')) return; App.api('wali.siswaResetPin', { idSiswa: id }, App.state.token).then(function (res) { if (res && res.ok) App.toast('PIN direset ke: ' + res.data.pin, 'ok'); else App.toast((res && res.error) || 'Gagal.', 'err'); }); }
    else if (act === 'nonaktif') { if (!window.confirm('Nonaktifkan siswa ini?')) return; App.api('wali.siswaNonaktif', { idSiswa: id, aktif: false }, App.state.token).then(function (res) { if (res && res.ok) { App.toast('Dinonaktifkan.', 'ok'); bukaKelola(); } else App.toast((res && res.error) || 'Gagal.', 'err'); }); }
  }
  function bukaPemantauan() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Pemantauan Hari Ini</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.pemantauan', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } renderPemantauan(res.data); });
  }
  function renderPemantauan(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Pemantauan Hari Ini</h2><p class="muted kecil">Tanggal: ' + data.tanggal + ' · Total: ' + data.totalSiswa + '</p>';
    html += '<div class="habit-nama">Belum mengisi (' + data.belumIsi.length + ')</div>';
    if (!data.belumIsi.length) html += '<p class="muted">Semua sudah mengisi.</p>';
    data.belumIsi.forEach(function (s) { html += '<div class="siswa-item"><div class="siswa-info">' + App.escapeHtml(s.nama) + ' (' + App.escapeHtml(s.nisn) + ')</div></div>'; });
    html += '<div class="habit-nama" style="margin-top:14px">Perlu perhatian (' + data.perhatian.length + ')</div>';
    if (!data.perhatian.length) html += '<p class="muted">Tidak ada.</p>';
    data.perhatian.forEach(function (s) { html += '<div class="siswa-item"><div class="siswa-info"><b>' + App.escapeHtml(s.nama) + '</b><br><span class="muted kecil">' + App.escapeHtml(s.alasan) + '</span></div></div>'; });
    html += '<p class="muted kecil" style="margin-top:12px">Pendekatan mendukung, bukan menghakimi.</p>';
    App.el('konten').innerHTML = html;
  }
  function bukaValidasi() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Validasi (Paraf)</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.siswaList', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.siswaListWali = res.data.siswa; App.state.hariIni = res.data.hariIni; renderValidasiShell(); });
  }
  function renderValidasiShell() {
    var today = App.state.hariIni || '';
    var html = '<h2><span class="titik titik-koral"></span>Validasi (Paraf Digital)</h2>';
    html += '<label class="label">Tanggal</label><input id="valTgl" class="input" type="date" value="' + today + '">';
    html += '<label class="label">Siswa</label><select id="valSiswa" class="input">';
    App.state.siswaListWali.forEach(function (s) { html += '<option value="' + s.id + '">' + App.escapeHtml(s.nama) + ' (' + App.escapeHtml(s.nisn) + ')</option>'; });
    html += '</select><button id="btnTampilVal" class="btn btn-block">Tampilkan</button><div id="valDetail"></div>';
    html += '<hr class="garis-pemisah"><div class="habit-nama">Paraf Massal</div><p class="muted kecil">Tandai paraf semua siswa pada rentang tanggal, hanya kebiasaan yang sudah dilakukan (v).</p>';
    html += '<label class="label">Dari</label><input id="valMulai" class="input" type="date" value="' + today + '"><label class="label">Sampai</label><input id="valAkhir" class="input" type="date" value="' + today + '">';
    html += '<button id="btnMassal" class="btn btn-block btn-ghost">Paraf Massal</button><p id="massalHasil" class="muted kecil"></p>';
    App.el('konten').innerHTML = html;
    App.el('btnTampilVal').addEventListener('click', tampilkanValidasi);
    App.el('btnMassal').addEventListener('click', massalParaf);
  }
  function tampilkanValidasi() { var tgl = App.el('valTgl').value, sid = App.el('valSiswa').value; App.el('valDetail').innerHTML = '<p class="muted"><span class="spinner"></span> Memuat…</p>'; App.api('wali.validasiGet', { idSiswa: sid, tanggal: tgl }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('valDetail').innerHTML = '<p class="muted">' + App.escapeHtml((res && res.error) || 'Gagal') + '</p>'; return; } renderValidasiDetail(res.data); }); }
  function renderValidasiDetail(data) {
    var j = data.jurnal, html = '<div class="habit-nama" style="margin-top:10px">' + App.escapeHtml(data.siswa.nama) + '</div>';
    if (!j) { html += '<p class="muted kecil">Siswa belum mengisi tanggal ini.</p>'; App.el('valDetail').innerHTML = html; return; }
    data.form.habits.forEach(function (h) {
      var st = (j.status && j.status['status_' + h.kode]) || '', paraf = (j.validasi_guru && j.validasi_guru['status_' + h.kode]);
      html += '<div class="habit-row"><div class="habit-nama">' + App.escapeHtml(h.nama) + '</div><div class="vx-group">';
      html += '<span class="vx-info ' + (st === 'v' ? 'cell-v' : st === 'x' ? 'cell-x' : '') + '">' + (st === 'v' ? '✓ Dilakukan' : st === 'x' ? '✗ Belum' : '— Kosong') + '</span>';
      html += '<button class="vx ' + (paraf ? 'aktif vx-v' : '') + '" data-kode="status_' + h.kode + '">' + (paraf ? '✓ Paraf' : 'Paraf') + '</button></div></div>';
    });
    App.el('valDetail').innerHTML = html;
    Array.prototype.forEach.call(App.el('valDetail').querySelectorAll('.vx[data-kode]'), function (btn) { btn.addEventListener('click', function () { App.api('wali.validasiSet', { idSiswa: data.siswa.id, tanggal: App.el('valTgl').value, kode: btn.getAttribute('data-kode') }, App.state.token).then(function (res) { if (res && res.ok) tampilkanValidasi(); else App.toast((res && res.error) || 'Gagal.', 'err'); }); }); });
  }
  function massalParaf() { var mulai = App.el('valMulai').value, akhir = App.el('valAkhir').value, hasil = App.el('massalHasil'); if (!mulai || !akhir) { hasil.textContent = 'Isi tanggal.'; return; } App.el('btnMassal').disabled = true; App.api('wali.validasiMassal', { mulai: mulai, akhir: akhir }, App.state.token).then(function (res) { App.el('btnMassal').disabled = false; if (res && res.ok) { hasil.textContent = res.data.baris + ' baris diperbarui.'; App.toast('Paraf massal selesai.', 'ok'); } else hasil.textContent = (res && res.error) || 'Gagal.'; }); }
  function bukaRekap() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Rekap Bulanan Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.rekapBulan', { bulan: App.state.bulanRekap || '' }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.bulanRekap = res.data.bulan; renderRekap(res.data); });
  }
  function renderRekap(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Rekap ' + App.formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="rekPrev">&laquo;</button><span>' + App.formatBulan(data.bulan) + '</span><button class="chip" id="rekNext">&raquo;</button></div>';
    html += '<button id="btnUnduhRekap" class="btn btn-block btn-ghost" style="margin-top:12px">Unduh xlsx (Lampiran 3)</button><p id="unduhHasil" class="muted kecil"></p>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    
    //Header pakai NAMA LENGKAP kebiasaan
    html += '<div class="kal-scroll"><table class="kal rekap-tbl"><thead><tr><th>No</th><th>Nama</th><th>L/P</th>';
    data.habits.forEach(function (h) { html += '<th class="th-habit">' + App.escapeHtml(h.nama) + '</th>'; });
    html += '<th>Catatan Wali</th></tr></thead><tbody>';
    data.siswa.forEach(function (s, idx) {
      html += '<tr><td>' + (idx + 1) + '</td><td class="kal-nama">' + App.escapeHtml(s.nama) + '</td><td>' + s.jk + '</td>';
      s.perHabit.forEach(function (h) { html += '<td class="kal-cell ' + (h.kategori === 'Sudah Terbiasa' ? 'cell-v' : '') + '" title="' + App.escapeAttr(h.kategori) + '">' + h.hariV + '</td>'; });
      html += '<td><input class="input-catatan" data-id="' + s.id + '" value="' + App.escapeAttr(s.catatanWali || '') + '" placeholder="catatan…"></td></tr>';
    });
    html += '</tbody></table></div><p class="muted kecil">Angka = jumlah hari melakukan. Hijau = Sudah Terbiasa. Catatan tersimpan saat berpindah kolom.</p>';
    //App.el('konten').innerHTML = html;
    //App.el('rekPrev').addEventListener('click', function () { App.state.bulanRekap = App.geserBulan(data.bulan, -1); bukaRekap(); });
    //App.el('rekNext').addEventListener('click', function () { App.state.bulanRekap = App.geserBulan(data.bulan, 1); bukaRekap(); });
    //html += '<p class="muted kecil">Angka = jumlah hari melakukan. Hijau = Sudah Terbiasa. Catatan tersimpan saat berpindah kolom.</p>';
    App.el('konten').innerHTML = html;
    App.el('rekPrev').addEventListener('click', function () { App.state.bulanRekap = App.geserBulan(data.bulan, -1); bukaRekap(); });
    App.el('rekNext').addEventListener('click', function () { App.state.bulanRekap = App.geserBulan(data.bulan, 1); bukaRekap(); });
    App.el('btnUnduhRekap').addEventListener('click', function () {
      App.setLoading('btnUnduhRekap', true); App.el('unduhHasil').textContent = 'Menyusun xlsx…';
      App.api('wali.eksporKelas', { bulan: data.bulan }, App.state.token).then(function (r) {
        App.setLoading('btnUnduhRekap', false);
        if (r && r.ok) { App.unduhFile(r.data.file, r.data.nama); App.el('unduhHasil').textContent = 'Terunduh: ' + r.data.nama; }
        else App.el('unduhHasil').textContent = (r && r.error) || 'Gagal.';
      });
    });
    Array.prototype.forEach.call(App.el('konten').querySelectorAll('.input-catatan'), function (inp) { inp.addEventListener('change', function () { App.api('wali.catatanSet', { idSiswa: inp.getAttribute('data-id'), bulan: data.bulan, catatan: inp.value }, App.state.token).then(function (res) { if (res && res.ok) App.toast('Catatan tersimpan.', 'ok'); else App.toast((res && res.error) || 'Gagal.', 'err'); }); }); });
  }
  function bukaRefleksiSiswa() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Refleksi Siswa</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.siswaList', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.siswaListWali = res.data.siswa; App.state.hariIni = res.data.hariIni; renderRefleksiSiswaShell(); });
  }
  function renderRefleksiSiswaShell() {
    var bulan = App.state.bulanRefSiswa || App.monthKey(App.state.hariIni);
    var html = '<h2><span class="titik titik-koral"></span>Refleksi Siswa</h2>';
    html += '<label class="label">Siswa</label><select id="refSiswa" class="input">';
    App.state.siswaListWali.forEach(function (s) { html += '<option value="' + s.id + '">' + App.escapeHtml(s.nama) + '</option>'; });
    html += '</select><label class="label">Bulan</label><input id="refBulan" class="input" type="month" value="' + bulan + '"><button id="btnTampilRef" class="btn btn-block">Tampilkan</button><div id="refDetail"></div>';
    App.el('konten').innerHTML = html;
    App.el('btnTampilRef').addEventListener('click', tampilkanRefleksiSiswa);
  }
  function tampilkanRefleksiSiswa() {
    var sid = App.el('refSiswa').value, bulan = App.el('refBulan').value || App.monthKey(App.state.hariIni); App.state.bulanRefSiswa = bulan;
    App.el('refDetail').innerHTML = '<p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('wali.refleksiSiswaGet', { idSiswa: sid, bulan: bulan }, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('refDetail').innerHTML = '<p class="muted">' + App.escapeHtml((res && res.error) || 'Gagal') + '</p>'; return; }
      var d = res.data, html = '<div class="habit-nama" style="margin-top:10px">' + App.escapeHtml(d.siswa.nama) + '</div>';
      if (!d.isi || !Object.keys(d.isi).length) html += '<p class="muted kecil">Siswa belum mengisi refleksi bulan ini.</p>';
      d.habits.forEach(function (h) { var item = d.isi[h.kode] || {}; html += '<div class="ref-item"><div class="ref-nama">' + App.escapeHtml(h.nama) + '</div><p class="muted kecil"><b>Kesimpulan:</b> ' + App.escapeHtml(item.kesimpulan || '-') + '</p><p class="muted kecil"><b>Tindak lanjut:</b> ' + App.escapeHtml(item.tindakLanjut || '-') + '</p></div>'; });
      if (d.catatanWali) html += '<div class="card-mini"><b>Catatan Anda:</b> ' + App.escapeHtml(d.catatanWali) + '</div>';
      App.el('refDetail').innerHTML = html;
    });
  }
})();
