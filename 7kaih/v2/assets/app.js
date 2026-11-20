(async function () {
  const $ = function (id) { return document.getElementById(id); };
  const res = await Api.call('ping', {}, { retries: 2 });
  const chip = $('status');
  if (!res.ok) {
    chip.className = 'chip chip-err';
    chip.textContent = res.error.pesan;
    return;
  }
  const d = res.data;
  document.documentElement.style.setProperty('--tema', d.warna_tema);
  document.title = d.nama_aplikasi;
  $('judul').textContent = d.nama_aplikasi;
  $('sambutan').textContent = d.teks_sambutan;
  $('sekolah').textContent = d.nama_sekolah;
  chip.className = 'chip chip-ok';
  chip.textContent = 'Terhubung ke server · ' + d.hari_ini;
})();