// pembaca.js — dashboard & rekap kelas (read-only) untuk kepsek/BK.
(function () {
  App.state.bulanRekapPembaca = ''; App.state.kelasPembaca = ''; App.state.siswaListPembaca = [];

  App.bukaMenuPembaca = function (key) {
    if (key === 'dashboard') bukaDashboard();
    else if (key === 'rekap') bukaRekap();
  };

  function bukaDashboard() {
    App.el('konten').innerHTML = '<h2>Dashboard Sekolah</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('pembaca.dashboard', {}, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; } App.renderDashboard(res.data); });
  }

  function bukaRekap() {
    App.el('konten').innerHTML = '<h2>Rekap Kelas</h2><p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('pembaca.kelasList', {}, App.state.token).then(function (res) {
      if (!res || !res.ok) { App.el('konten').innerHTML = '<p class="muted">Gagal.</p>'; return; }
      App.state.siswaListPembaca = res.data.kelas;
      var bulan = App.state.bulanRekapPembaca || App.monthKey(App.state.hariIni);
      var html = '<h2><span class="titik titik-hijau"></span>Rekap Kelas</h2>';
      html += '<label class="label">Kelas</label><select id="rpKelas" class="input">';
      res.data.kelas.forEach(function (k) { html += '<option value="' + k.id + '"' + (k.id === App.state.kelasPembaca ? ' selected' : '') + '>' + App.escapeHtml(k.nama) + '</option>'; });
      html += '</select><label class="label">Bulan</label><input id="rpBulan" class="input" type="month" value="' + bulan + '">';
      html += '<button id="btnRpTampil" class="btn btn-block">Tampilkan</button><div id="rpDetail"></div>';
      App.el('konten').innerHTML = html;
      App.el('btnRpTampil').addEventListener('click', tampilkan);
    });
  }
  function tampilkan() {
    var idKelas = App.el('rpKelas').value, bulan = App.el('rpBulan').value || App.monthKey(App.state.hariIni);
    App.state.kelasPembaca = idKelas; App.state.bulanRekapPembaca = bulan;
    App.el('rpDetail').innerHTML = '<p class="muted"><span class="spinner"></span> Memuat…</p>';
    App.api('pembaca.rekapBulan', { idKelas: idKelas, bulan: bulan }, App.state.token).then(function (res) { if (!res || !res.ok) { App.el('rpDetail').innerHTML = '<p class="muted">' + App.escapeHtml((res && res.error) || 'Gagal') + '</p>'; return; } render(res.data, idKelas); });
  }
  function render(data, idKelas) {
    var html = '<div class="bulan-nav"><span>' + App.formatBulan(data.bulan) + '</span></div>';
    html += '<p class="muted kecil">Ambang "Sudah Terbiasa": minimal ' + data.ambangHari + ' dari ' + data.totalHari + ' hari.</p>';
    html += '<div class="kal-scroll"><table class="kal rekap-tbl"><thead><tr><th>No</th><th>Nama</th><th>L/P</th>';
    data.habits.forEach(function (h) { html += '<th class="th-habit">' + App.escapeHtml(h.nama) + '</th>'; });
    html += '<th>Catatan Wali</th></tr></thead><tbody>';
    data.siswa.forEach(function (s, idx) {
      html += '<tr><td>' + (idx + 1) + '</td><td class="kal-nama">' + App.escapeHtml(s.nama) + '</td><td>' + s.jk + '</td>';
      s.perHabit.forEach(function (h) { html += '<td class="kal-cell ' + (h.kategori === 'Sudah Terbiasa' ? 'cell-v' : '') + '">' + h.hariV + '</td>'; });
      html += '<td class="kal-cell kecil">' + App.escapeHtml(s.catatanWali || '-') + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<button id="btnRpUnduh" class="btn btn-block btn-ghost" style="margin-top:12px">Unduh xlsx (Lampiran 3)</button><p id="rpUnduhHasil" class="muted kecil"></p>';
    App.el('rpDetail').innerHTML = html;
    App.el('btnRpUnduh').addEventListener('click', function () {
      App.setLoading('btnRpUnduh', true); App.el('rpUnduhHasil').textContent = 'Menyusun xlsx…';
      App.api('pembaca.eksporKelas', { idKelas: idKelas, bulan: data.bulan }, App.state.token).then(function (r) {
        App.setLoading('btnRpUnduh', false);
        if (r && r.ok) { App.unduhFile(r.data.file, r.data.nama); App.el('rpUnduhHasil').textContent = 'Terunduh: ' + r.data.nama; }
        else App.el('rpUnduhHasil').textContent = (r && r.error) || 'Gagal.';
      });
    });
  }
})();
