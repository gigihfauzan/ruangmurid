// siswa.js — layar siswa (Tahap 3).
(function () {
  var S = {};
  App.state.tanggalIsi = ''; App.state.bulanKal = ''; App.state.bulanRing = ''; App.state.bulanRef = '';

  App.bukaMenuSiswa = function (key) {
    if (key === 'isi') bukaIsi();
    else if (key === 'kalender') bukaKalender();
    else if (key === 'ringkasan') bukaRingkasan();
    else if (key === 'refleksi') bukaRefleksi();
    else if (key === 'definisi') bukaDefinisi();
  };

  function bukaIsi() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('siswa.jurnalHari', { tanggal: App.state.tanggalIsi || '' }, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      App.state.tanggalIsi = res.data.tanggal; renderIsi(res.data);
    });
  }
  function renderField(f, val) {
    var id = 'field_' + f.kode;
    var lab = '<label class="label kecil-label" for="' + id + '">' + App.escapeHtml(f.label) + (f.wajib ? ' *' : '') + '</label>';
    if (f.tipe === 'jam') return lab + '<input id="' + id + '" class="input" type="time" value="' + App.escapeAttr(val) + '">';
    if (f.tipe === 'angka') return lab + '<input id="' + id + '" class="input" type="number" inputmode="numeric" value="' + App.escapeAttr(val) + '">';
    if (f.tipe === 'teks_panjang') return lab + '<textarea id="' + id + '" class="input" rows="3">' + App.escapeHtml(val) + '</textarea>';
    if (f.tipe === 'pilihan') { var opts = (f.opsi && f.opsi.pilihan) || []; var o = '<option value="">— pilih —</option>'; opts.forEach(function (op) { o += '<option value="' + App.escapeAttr(op) + '"' + (op === val ? ' selected' : '') + '>' + App.escapeHtml(op) + '</option>'; }); return lab + '<select id="' + id + '" class="input">' + o + '</select>'; }
    return lab + '<input id="' + id + '" class="input" type="text" value="' + App.escapeAttr(val) + '">';
  }
  function renderIsi(data) {
    var j = data.jurnal, form = data.form, status = (j && j.status) || {}, jawaban = (j && j.jawaban_tambahan) || {};
    var html = '<h2><span class="titik titik-kuning"></span>Isi Hari Ini</h2><div class="chip-row">';
    for (var k = data.batasMundur; k >= 0; k--) { var tgl = App.addDaysYmd(data.hariIni, -k); html += '<button class="chip' + (tgl === data.tanggal ? ' aktif' : '') + '" data-tgl="' + tgl + '">' + App.formatTglPendek(tgl) + '</button>'; }
    html += '</div>';
    if (!data.editable) html += '<p class="muted kecil">Tanggal ini hanya untuk dilihat.</p>';
    form.habits.forEach(function (h) {
      var st = status['status_' + h.kode] || '';
      html += '<div class="habit-row"><div class="habit-nama">' + App.escapeHtml(h.nama) + '</div><div class="vx-group">';
      html += '<button class="vx vx-v' + (st === 'v' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="v">&#10003; Sudah</button>';
      html += '<button class="vx vx-x' + (st === 'x' ? ' aktif' : '') + '" data-kode="' + h.kode + '" data-val="x">&#10007; Belum</button></div>';
      (form.fields || []).filter(function (f) { return f.id_kebiasaan === h.id && f.kode !== 'status_' + h.kode; }).forEach(function (f) {
        var val = ''; if (f.kode === 'jam_bangun') val = (j && j.jam_bangun) || ''; else if (f.kode === 'jam_tidur') val = (j && j.jam_tidur) || ''; else val = jawaban[f.kode] || '';
        html += renderField(f, val);
      });
      html += '</div>';
    });
    html += '<label class="cek"><input type="checkbox" id="ortuChk"' + (j && j.diketahui_ortu ? ' checked' : '') + '> Diketahui orang tua/wali</label>';
    html += '<button id="btnSimpanIsi" class="btn btn-block"' + (data.editable ? '' : ' disabled') + '>Simpan</button><p id="isiErr" class="pesan-err"></p>';
    App.el('konten').innerHTML = html;
    Array.prototype.forEach.call(App.el('konten').querySelectorAll('.chip'), function (c) { c.addEventListener('click', function () { App.state.tanggalIsi = c.getAttribute('data-tgl'); bukaIsi(); }); });
    Array.prototype.forEach.call(App.el('konten').querySelectorAll('.vx'), function (btn) { btn.addEventListener('click', function () { var kode = btn.getAttribute('data-kode'); Array.prototype.forEach.call(App.el('konten').querySelectorAll('.vx[data-kode="' + kode + '"]'), function (b) { b.classList.remove('aktif'); }); btn.classList.add('aktif'); }); });
    App.el('btnSimpanIsi').addEventListener('click', function () { simpanIsi(data); });
  }
  function simpanIsi(data) {
    var status = {}, jamBangun = '', jamTidur = '', jawaban = {};
    data.form.habits.forEach(function (h) { var sel = App.el('konten').querySelector('.vx[data-kode="' + h.kode + '"].aktif'); status['status_' + h.kode] = sel ? sel.getAttribute('data-val') : ''; });
    (data.form.fields || []).forEach(function (f) { if (f.kode.indexOf('status_') === 0) return; var node = App.el('field_' + f.kode); if (!node) return; var v = node.value; if (f.kode === 'jam_bangun') jamBangun = v; else if (f.kode === 'jam_tidur') jamTidur = v; else jawaban[f.kode] = v; });
    App.setErr('isiErr', ''); App.setLoading('btnSimpanIsi', true);
    App.api('siswa.simpanJurnal', { tanggal: App.state.tanggalIsi, status: status, jamBangun: jamBangun, jamTidur: jamTidur, jawabanTambahan: jawaban, diketahuiOrtu: App.el('ortuChk').checked }, App.state.token).then(function (res) {
      App.setLoading('btnSimpanIsi', false);
      if (!res || !res.ok) { App.setErr('isiErr', (res && res.error) || 'Gagal.'); return; }
      App.toast('Tersimpan! Kerja bagus.', 'ok');
      App.api('siswa.stiker', {}, App.state.token).then(function (r) { if (r && r.ok && r.data && r.data.lengkapHariIni) App.toast('Luar biasa! 7 kebiasaan lengkap. Rentetan: ' + r.data.rentetan + ' hari.', 'ok'); });
      bukaIsi();
    });
  }
  function bukaKalender() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('siswa.kalender', { bulan: App.state.bulanKal || '' }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.bulanKal = res.data.bulan; renderKalender(res.data); });
  }
  function renderKalender(data) {
    var total = data.totalHari, html = '<h2><span class="titik titik-hijau"></span>Kalender Bulanan</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="kalPrev">&laquo;</button><span>' + App.formatBulan(data.bulan) + '</span><button class="chip" id="kalNext">&raquo;</button></div>';
    html += '<div class="kal-scroll"><table class="kal"><thead><tr><th>Kebiasaan</th>'; for (var d = 1; d <= total; d++) html += '<th>' + d + '</th>'; html += '</tr></thead><tbody>';
    data.habits.forEach(function (h) {
      html += '<tr><td class="kal-nama">' + App.escapeHtml(h.nama) + '</td>';
      for (var d2 = 1; d2 <= total; d2++) { var pt = data.perTanggal[data.bulan + '-' + ('0' + d2).slice(-2)]; var st = pt && pt.status ? (pt.status['status_' + h.kode] || '') : ''; html += '<td class="kal-cell ' + (st === 'v' ? 'cell-v' : st === 'x' ? 'cell-x' : '') + '">' + (st === 'v' ? '&#10003;' : st === 'x' ? '&#10007;' : '') + '</td>'; }
      html += '</tr>';
    });
    html += '<tr><td class="kal-nama">Jam Bangun</td>'; for (var d3 = 1; d3 <= total; d3++) { var p3 = data.perTanggal[data.bulan + '-' + ('0' + d3).slice(-2)]; html += '<td class="kal-cell kecil">' + (p3 && p3.jamBangun ? App.escapeHtml(p3.jamBangun) : '') + '</td>'; } html += '</tr>';
    html += '<tr><td class="kal-nama">Jam Tidur</td>'; for (var d4 = 1; d4 <= total; d4++) { var p4 = data.perTanggal[data.bulan + '-' + ('0' + d4).slice(-2)]; html += '<td class="kal-cell kecil">' + (p4 && p4.jamTidur ? App.escapeHtml(p4.jamTidur) : '') + '</td>'; } html += '</tr>';
    html += '<tr><td class="kal-nama">Paraf</td>'; for (var d5 = 1; d5 <= total; d5++) { var p5 = data.perTanggal[data.bulan + '-' + ('0' + d5).slice(-2)]; var pr = p5 ? p5.paraf : 0; html += '<td class="kal-cell' + (pr ? ' paraf' : '') + '">' + (pr ? pr : '') + '</td>'; } html += '</tr>';
    html += '</tbody></table></div><p class="muted kecil">&#10003; = dilakukan, &#10007; = belum. Angka di baris Paraf = jumlah kebiasaan divalidasi guru.</p>';
    App.el('konten').innerHTML = html;
    App.el('kalPrev').addEventListener('click', function () { App.state.bulanKal = App.geserBulan(data.bulan, -1); bukaKalender(); });
    App.el('kalNext').addEventListener('click', function () { App.state.bulanKal = App.geserBulan(data.bulan, 1); bukaKalender(); });
  }
  function bukaRingkasan() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-hijau"></span>Ringkasan Bulan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('siswa.ringkasan', { bulan: App.state.bulanRing || '' }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.bulanRing = res.data.bulan; renderRingkasan(res.data); });
  }
  function renderRingkasan(data) {
    var html = '<h2><span class="titik titik-hijau"></span>Ringkasan ' + App.formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="ringPrev">&laquo;</button><span>' + App.formatBulan(data.bulan) + '</span><button class="chip" id="ringNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    data.perHabit.forEach(function (h) {
      var badge = h.kategori === 'Sudah Terbiasa' ? 'badge-ok' : 'badge-belum';
      html += '<div class="ring-item"><div class="ring-nama">' + App.escapeHtml(h.nama) + '</div><div class="ring-bar"><div class="ring-fill" style="width:' + h.persen + '%"></div></div><div class="ring-meta">' + h.hariV + '/' + h.totalHari + ' hari &middot; ' + h.persen + '% <span class="badge ' + badge + '">' + h.kategori + '</span></div></div>';
    });
    html += '<div class="card-mini"><b>Rata-rata durasi tidur:</b> ' + (data.avgDurasiTidurJam ? data.avgDurasiTidurJam + ' jam' : 'belum ada data') + ' (dari ' + data.jumlahHariTidurLengkap + ' hari lengkap).</div>';
    App.el('konten').innerHTML = html;
    App.el('ringPrev').addEventListener('click', function () { App.state.bulanRing = App.geserBulan(data.bulan, -1); bukaRingkasan(); });
    App.el('ringNext').addEventListener('click', function () { App.state.bulanRing = App.geserBulan(data.bulan, 1); bukaRingkasan(); });
  }
  function bukaRefleksi() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-koral"></span>Refleksi Bulanan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('siswa.refleksiGet', { bulan: App.state.bulanRef || '' }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.state.bulanRef = res.data.bulan; renderRefleksi(res.data); });
  }
  function renderRefleksi(data) {
    var html = '<h2><span class="titik titik-koral"></span>Refleksi ' + App.formatBulan(data.bulan) + '</h2>';
    html += '<div class="bulan-nav"><button class="chip" id="refPrev">&laquo;</button><span>' + App.formatBulan(data.bulan) + '</span><button class="chip" id="refNext">&raquo;</button></div>';
    html += '<p class="muted kecil">Isi bersama orang tua/wali di akhir bulan.</p>';
    data.habits.forEach(function (h) {
      var item = (data.isi && data.isi[h.kode]) || {};
      html += '<div class="ref-item"><div class="ref-nama">' + App.escapeHtml(h.nama) + '</div>';
      html += '<label class="label kecil-label">Kesimpulan / Refleksi</label><textarea id="ref_' + h.kode + '_k" class="input" rows="2">' + App.escapeHtml(item.kesimpulan || '') + '</textarea>';
      html += '<label class="label kecil-label">Tindak Lanjut</label><textarea id="ref_' + h.kode + '_t" class="input" rows="2">' + App.escapeHtml(item.tindakLanjut || '') + '</textarea></div>';
    });
    if (data.catatanWali) html += '<div class="card-mini"><b>Catatan Wali Kelas:</b> ' + App.escapeHtml(data.catatanWali) + '</div>';
    html += '<button id="btnSimpanRef" class="btn btn-block">Simpan Refleksi</button><p id="refErr" class="pesan-err"></p>';
    App.el('konten').innerHTML = html;
    App.el('refPrev').addEventListener('click', function () { App.state.bulanRef = App.geserBulan(data.bulan, -1); bukaRefleksi(); });
    App.el('refNext').addEventListener('click', function () { App.state.bulanRef = App.geserBulan(data.bulan, 1); bukaRefleksi(); });
    App.el('btnSimpanRef').addEventListener('click', function () { simpanRefleksi(data); });
  }
  function simpanRefleksi(data) {
    var isi = {};
    data.habits.forEach(function (h) { var k = App.el('ref_' + h.kode + '_k'), t = App.el('ref_' + h.kode + '_t'); isi[h.kode] = { kesimpulan: k ? k.value : '', tindakLanjut: t ? t.value : '' }; });
    App.setLoading('btnSimpanRef', true);
    App.api('siswa.refleksiSimpan', { bulan: data.bulan, isi: isi }, App.state.token).then(function (res) { App.setLoading('btnSimpanRef', false); if (!res || !res.ok) { App.setErr('refErr', (res && res.error) || 'Gagal.'); return; } App.toast('Refleksi tersimpan.', 'ok'); });
  }
  function bukaDefinisi() {
    App.el('konten').innerHTML = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('siswa.definisi', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      var html = '<h2><span class="titik titik-kuning"></span>Definisi 7 Kebiasaan</h2>';
      res.data.habits.forEach(function (h) { html += '<div class="def-item"><div class="def-nama">' + h.urutan + '. ' + App.escapeHtml(h.nama) + '</div><div class="def-isi">' + App.escapeHtml(h.definisi) + '</div></div>'; });
      App.el('konten').innerHTML = html;
    });
  }
})();
