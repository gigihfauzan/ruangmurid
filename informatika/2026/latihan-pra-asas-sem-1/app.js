// =========================================================================
// KONFIGURASI UTAMA (TEMPEL URL WEB APP GOOGLE APPS SCRIPT INFORMATIKA DI SINI)
// =========================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwaDMRQnI40cyi2xocXHLQ7TmrNV-boRKJtkk65WCmiOJ7bB7aBdaaiLaTvWsDZ4wnR9w/exec"; // <-- Ganti dengan URL https://script.google.com/macros/s/.../exec dari Google Sheet Informatika IX

// =========================================================================
// PETA GAMBAR & BLOK KODE VEKTOR (SVG) UNTUK SOAL INFORMATIKA IX
// =========================================================================
function buildPictoBlockOptionSvg(mode) {
  if (mode === "SVG_15_A") {
    return `<svg viewBox="0 0 380 46" class="w-full max-w-sm h-11">
      <rect x="2" y="4" width="376" height="38" rx="8" fill="#8b5cf6" stroke="#6d28d9" stroke-width="1.5"/>
      <text x="16" y="27" fill="#ffffff" font-size="13" font-weight="bold">say</text>
      <rect x="46" y="9" width="212" height="28" rx="14" fill="#10b981" stroke="#047857" stroke-width="1.2"/>
      <text x="58" y="27" fill="#ffffff" font-size="12" font-weight="bold">join</text>
      <rect x="88" y="13" width="46" height="20" rx="10" fill="#ffffff"/>
      <text x="111" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">Hay</text>
      <rect x="140" y="13" width="110" height="20" rx="10" fill="#f97316"/>
      <text x="195" y="27" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">namaPengguna</text>
      <text x="266" y="27" fill="#ffffff" font-size="13" font-weight="bold">for</text>
      <rect x="290" y="13" width="26" height="20" rx="10" fill="#ffffff"/>
      <text x="303" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">2</text>
      <text x="323" y="27" fill="#ffffff" font-size="12" font-weight="bold">seconds</text>
    </svg>`;
  }
  if (mode === "SVG_15_B") {
    return `<svg viewBox="0 0 380 46" class="w-full max-w-sm h-11">
      <rect x="2" y="4" width="376" height="38" rx="8" fill="#8b5cf6" stroke="#6d28d9" stroke-width="1.5"/>
      <text x="16" y="27" fill="#ffffff" font-size="13" font-weight="bold">say</text>
      <rect x="46" y="9" width="212" height="28" rx="14" fill="#10b981" stroke="#047857" stroke-width="1.2"/>
      <text x="58" y="27" fill="#ffffff" font-size="12" font-weight="bold">join</text>
      <rect x="88" y="13" width="110" height="20" rx="10" fill="#f97316"/>
      <text x="143" y="27" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">namaPengguna</text>
      <rect x="204" y="13" width="46" height="20" rx="10" fill="#ffffff"/>
      <text x="227" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">Hay</text>
      <text x="266" y="27" fill="#ffffff" font-size="13" font-weight="bold">for</text>
      <rect x="290" y="13" width="26" height="20" rx="10" fill="#ffffff"/>
      <text x="303" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">2</text>
      <text x="323" y="27" fill="#ffffff" font-size="12" font-weight="bold">seconds</text>
    </svg>`;
  }
  if (mode === "SVG_15_C") {
    return `<svg viewBox="0 0 380 46" class="w-full max-w-sm h-11">
      <rect x="2" y="4" width="376" height="38" rx="8" fill="#8b5cf6" stroke="#6d28d9" stroke-width="1.5"/>
      <text x="16" y="27" fill="#ffffff" font-size="13" font-weight="bold">say</text>
      <rect x="46" y="13" width="46" height="20" rx="10" fill="#ffffff"/>
      <text x="69" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">Hay</text>
      <text x="100" y="27" fill="#ffffff" font-size="13" font-weight="bold">for</text>
      <rect x="124" y="9" width="192" height="28" rx="14" fill="#10b981" stroke="#047857" stroke-width="1.2"/>
      <text x="136" y="27" fill="#ffffff" font-size="12" font-weight="bold">join</text>
      <rect x="166" y="13" width="110" height="20" rx="10" fill="#f97316"/>
      <text x="221" y="27" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">namaPengguna</text>
      <rect x="282" y="13" width="26" height="20" rx="10" fill="#ffffff"/>
      <text x="295" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">2</text>
      <text x="323" y="27" fill="#ffffff" font-size="12" font-weight="bold">seconds</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 380 46" class="w-full max-w-sm h-11">
    <rect x="2" y="4" width="376" height="38" rx="8" fill="#8b5cf6" stroke="#6d28d9" stroke-width="1.5"/>
    <text x="16" y="27" fill="#ffffff" font-size="13" font-weight="bold">say</text>
    <rect x="46" y="9" width="128" height="28" rx="14" fill="#10b981" stroke="#047857" stroke-width="1.2"/>
    <text x="58" y="27" fill="#ffffff" font-size="12" font-weight="bold">join</text>
    <rect x="88" y="13" width="46" height="20" rx="10" fill="#ffffff"/>
    <text x="111" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">Hay</text>
    <rect x="140" y="13" width="26" height="20" rx="10" fill="#ffffff"/>
    <text x="153" y="27" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">2</text>
    <text x="182" y="27" fill="#ffffff" font-size="13" font-weight="bold">for</text>
    <rect x="206" y="13" width="110" height="20" rx="10" fill="#f97316"/>
    <text x="261" y="27" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="bold">namaPengguna</text>
    <text x="323" y="27" fill="#ffffff" font-size="12" font-weight="bold">seconds</text>
  </svg>`;
}

const SVG_DIAGRAMS = {
  SVG_15_PROMPT: `<svg viewBox="0 0 340 132" class="w-80 mx-auto my-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
    <path d="M 10,20 Q 55,2 100,20 L 165,20 L 165,42 L 10,42 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
    <text x="22" y="33" fill="#ffffff" font-size="13" font-weight="bold">when ⚑ clicked</text>
    <rect x="10" y="45" width="295" height="36" rx="6" fill="#06b6d4" stroke="#0e7490" stroke-width="1.5"/>
    <text x="22" y="67" fill="#ffffff" font-size="13" font-weight="bold">ask</text>
    <rect x="52" y="51" width="168" height="24" rx="12" fill="#ffffff"/>
    <text x="136" y="67" text-anchor="middle" fill="#1e293b" font-size="12" font-weight="bold">What's your name?</text>
    <text x="228" y="67" fill="#ffffff" font-size="13" font-weight="bold">and wait</text>
    <rect x="10" y="84" width="318" height="36" rx="6" fill="#ea580c" stroke="#9a3412" stroke-width="1.5"/>
    <text x="22" y="106" fill="#ffffff" font-size="13" font-weight="bold">set</text>
    <rect x="50" y="90" width="132" height="24" rx="6" fill="#c2410c"/>
    <text x="116" y="106" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">namaPengguna ▾</text>
    <text x="190" y="106" fill="#ffffff" font-size="13" font-weight="bold">to</text>
    <rect x="212" y="90" width="96" height="24" rx="12" fill="#06b6d4"/>
    <text x="260" y="106" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">answer</text>
  </svg>`,

  SVG_16: `<svg viewBox="0 0 330 330" class="w-80 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-3 font-mono text-xs">
    <text x="14" y="22" font-weight="bold" fill="#0f172a">⌄ 📁 File_Ku</text>
    <text x="34" y="44" font-weight="bold" fill="#1e293b">⌄ 📁 Foto</text>
    <text x="56" y="66" font-weight="bold" fill="#334155">⌄ 📁 HP_APRL</text>
    <text x="80" y="86" fill="#2563eb">📄 senja.png</text>
    <text x="80" y="106" fill="#2563eb">📄 bareng.png</text>
    <text x="58" y="126" fill="#2563eb">📄 20221016_02.png</text>
    <text x="58" y="146" fill="#2563eb">📄 20221016_12.png</text>
    <text x="34" y="170" font-weight="bold" fill="#1e293b">⌄ 📁 Informatika</text>
    <text x="56" y="192" font-weight="bold" fill="#334155">⌄ 📁 Berpikir_Komputasional</text>
    <text x="78" y="214" font-weight="bold" fill="#334155">⌄ 📁 Struktur_Data</text>
    <text x="102" y="234" fill="#2563eb">📄 tree.png</text>
    <text x="102" y="254" fill="#2563eb">📄 graph.png</text>
    <text x="58" y="274" fill="#2563eb">📄 flowchart.png</text>
    <text x="58" y="294" fill="#2563eb">📄 pseudocode.png</text>
    <text x="34" y="314" font-weight="bold" fill="#1e293b">⌄ 📁 Video  →  🎬 jalan.mp4</text>
  </svg>`,

  SVG_17: `<svg viewBox="0 0 430 220" class="w-full max-w-md mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
    <defs>
      <marker id="arr17" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,1 L7,4 L0,7 Z" fill="#334155"/>
      </marker>
    </defs>
    <!-- Edges -->
    <line x1="100" y1="165" x2="65" y2="128" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="135" y1="165" x2="225" y2="128" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="72" y1="90" x2="115" y2="54" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="225" y1="90" x2="175" y2="54" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="152" y1="54" x2="162" y2="88" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="190" y1="90" x2="245" y2="54" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="265" y1="90" x2="275" y2="54" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="305" y1="54" x2="355" y2="88" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="275" y1="126" x2="305" y2="164" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <line x1="340" y1="164" x2="365" y2="128" stroke="#334155" stroke-width="2" marker-end="url(#arr17)"/>
    <!-- Nodes -->
    <rect x="85" y="16" width="115" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="142" y="39" text-anchor="middle" font-size="12" font-weight="bold">Lurik Show</text>

    <rect x="225" y="16" width="115" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="282" y="39" text-anchor="middle" font-size="12" font-weight="bold">Kembang Api</text>

    <rect x="10" y="90" width="95" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="57" y="113" text-anchor="middle" font-size="12" font-weight="bold">Drum Band</text>

    <rect x="115" y="90" width="85" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="157" y="113" text-anchor="middle" font-size="12" font-weight="bold">Gamelan</text>

    <rect x="210" y="90" width="115" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="267" y="113" text-anchor="middle" font-size="12" font-weight="bold">Pidato Bupati</text>

    <rect x="333" y="90" width="88" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="377" y="113" text-anchor="middle" font-size="12" font-weight="bold">Penutupan</text>

    <rect x="65" y="166" width="105" height="36" rx="8" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1.8"/>
    <text x="117" y="189" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e3a8a">Musik Lokal</text>

    <rect x="275" y="166" width="85" height="36" rx="8" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
    <text x="317" y="189" text-anchor="middle" font-size="12" font-weight="bold">Undian</text>
  </svg>`,

  SVG_18: `<svg viewBox="0 0 420 270" class="w-full max-w-md mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
    <!-- Edges -->
    <g stroke="#334155" stroke-width="2.6">
      <line x1="125" y1="36" x2="160" y2="96"/>
      <line x1="42" y1="82" x2="160" y2="96"/>
      <line x1="42" y1="82" x2="42" y2="165"/>
      <line x1="42" y1="165" x2="160" y2="96"/>
      <line x1="160" y1="96" x2="105" y2="225"/>
      <line x1="160" y1="96" x2="275" y2="112"/>
      <line x1="105" y1="225" x2="165" y2="215"/>
      <line x1="165" y1="215" x2="295" y2="215"/>
      <line x1="275" y1="112" x2="295" y2="215"/>
      <line x1="275" y1="112" x2="380" y2="55"/>
      <line x1="270" y1="36" x2="380" y2="55"/>
      <line x1="295" y1="215" x2="380" y2="55"/>
      <line x1="380" y1="55" x2="375" y2="148"/>
      <line x1="295" y1="215" x2="360" y2="225"/>
      <line x1="375" y1="148" x2="360" y2="225"/>
    </g>
    <!-- Nodes -->
    <g font-size="13" font-weight="bold" text-anchor="middle">
      <circle cx="125" cy="36" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="125" y="41">L</text>
      <circle cx="42" cy="82" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="42" y="87">G</text>
      <circle cx="42" cy="165" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="42" y="170">F</text>
      <circle cx="160" cy="96" r="16" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.2"/><text x="160" y="101">J</text>
      <circle cx="105" cy="225" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="105" y="230">C</text>
      <circle cx="165" cy="215" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="165" y="220">E</text>
      <circle cx="275" cy="112" r="16" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.2"/><text x="275" y="117">B</text>
      <circle cx="270" cy="36" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="270" y="41">I</text>
      <circle cx="380" cy="55" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="380" y="60">D</text>
      <circle cx="295" cy="215" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="295" y="220">A</text>
      <circle cx="375" cy="148" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="375" y="153">K</text>
      <circle cx="360" cy="225" r="16" fill="#fff" stroke="#0f172a" stroke-width="2"/><text x="360" y="230">H</text>
    </g>
  </svg>`,

  SVG_21: `<svg viewBox="0 0 460 190" class="w-full max-w-lg mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2 font-sans">
    <g font-size="11" font-weight="bold" text-anchor="middle">
      <!-- Senin -->
      <text x="115" y="16" fill="#0f172a">Senin</text>
      <g transform="translate(10,22)">
        <rect x="0" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="17" y="16">1</text>
        <rect x="35" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="16">2</text>
        <rect x="70" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="87" y="16">3</text>
        <rect x="105" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="122" y="16">4</text>
        <rect x="140" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="157" y="16">5</text>
        <rect x="175" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="192" y="16">6</text>
        <rect x="0" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="17" y="40">7</text>
        <rect x="35" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="40">8</text>
        <rect x="70" y="24" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="87" y="40">9</text>
        <rect x="105" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="122" y="40">10</text>
        <rect x="140" y="24" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="157" y="40">11</text>
        <rect x="175" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="192" y="40">12</text>
      </g>
      <!-- Selasa -->
      <text x="345" y="16" fill="#0f172a">Selasa</text>
      <g transform="translate(240,22)">
        <rect x="0" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="17" y="16">1</text>
        <rect x="35" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="16">2</text>
        <rect x="70" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="87" y="16">3</text>
        <rect x="105" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="122" y="16">4</text>
        <rect x="140" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="157" y="16">5</text>
        <rect x="175" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="192" y="16">6</text>
        <rect x="0" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="17" y="40">7</text>
        <rect x="35" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="40">8</text>
        <rect x="70" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="87" y="40">9</text>
        <rect x="105" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="122" y="40">10</text>
        <rect x="140" y="24" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="157" y="40">11</text>
        <rect x="175" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="192" y="40">12</text>
      </g>
      <!-- Rabu -->
      <text x="115" y="96" fill="#0f172a">Rabu</text>
      <g transform="translate(10,102)">
        <rect x="0" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="17" y="16">1</text>
        <rect x="35" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="52" y="16">2</text>
        <rect x="70" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="87" y="16">3</text>
        <rect x="105" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="122" y="16">4</text>
        <rect x="140" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="157" y="16">5</text>
        <rect x="175" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="192" y="16">6</text>
        <rect x="0" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="17" y="40">7</text>
        <rect x="35" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="40">8</text>
        <rect x="70" y="24" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="87" y="40">9</text>
        <rect x="105" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="122" y="40">10</text>
        <rect x="140" y="24" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="157" y="40">11</text>
        <rect x="175" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="192" y="40">12</text>
      </g>
      <!-- Kamis -->
      <text x="345" y="96" fill="#0f172a">Kamis</text>
      <g transform="translate(240,102)">
        <rect x="0" y="0" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="17" y="16">1</text>
        <rect x="35" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="16">2</text>
        <rect x="70" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="87" y="16">3</text>
        <rect x="105" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="122" y="16">4</text>
        <rect x="140" y="0" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="157" y="16">5</text>
        <rect x="175" y="0" width="35" height="24" fill="#94a3b8" stroke="#334155"/><text x="192" y="16">6</text>
        <rect x="0" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="17" y="40">7</text>
        <rect x="35" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="52" y="40">8</text>
        <rect x="70" y="24" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="87" y="40">9</text>
        <rect x="105" y="24" width="35" height="24" fill="#cbd5e1" stroke="#334155"/><text x="122" y="40">10</text>
        <rect x="140" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="157" y="40">11</text>
        <rect x="175" y="24" width="35" height="24" fill="#ffffff" stroke="#334155"/><text x="192" y="40">12</text>
      </g>
    </g>
    <text x="230" y="176" text-anchor="middle" font-size="10" fill="#475569">Keterangan: Kotak berarsir gelap = Ruangan digunakan | Kotak putih = Ruangan kosong</text>
  </svg>`,

  SVG_33: `<svg viewBox="0 0 420 250" class="w-full max-w-md mx-auto my-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
    <!-- Roads -->
    <g stroke="#64748b" stroke-width="4" stroke-linecap="round">
      <line x1="115" y1="205" x2="65" y2="130"/>
      <line x1="115" y1="205" x2="210" y2="130"/>
      <line x1="115" y1="205" x2="345" y2="130"/>
      <line x1="65" y1="130" x2="210" y2="130"/>
      <line x1="65" y1="130" x2="345" y2="42"/>
      <line x1="210" y1="130" x2="345" y2="42"/>
      <line x1="210" y1="130" x2="345" y2="130"/>
      <line x1="345" y1="42" x2="345" y2="130"/>
    </g>
    <!-- Weights -->
    <g font-size="12" font-weight="bold" text-anchor="middle">
      <circle cx="78" cy="172" r="11" fill="#fff" stroke="#334155"/><text x="78" y="176">10</text>
      <circle cx="168" cy="172" r="11" fill="#fff" stroke="#334155"/><text x="168" y="176">5</text>
      <circle cx="242" cy="172" r="11" fill="#fff" stroke="#334155"/><text x="242" y="176">15</text>
      <circle cx="138" cy="122" r="11" fill="#fff" stroke="#334155"/><text x="138" y="126">15</text>
      <circle cx="195" cy="82" r="11" fill="#fff" stroke="#334155"/><text x="195" y="86">20</text>
      <circle cx="275" cy="82" r="11" fill="#fff" stroke="#334155"/><text x="275" y="86">10</text>
      <circle cx="278" cy="122" r="11" fill="#fff" stroke="#334155"/><text x="278" y="126">10</text>
      <circle cx="362" cy="88" r="11" fill="#fff" stroke="#334155"/><text x="362" y="92">10</text>
    </g>
    <!-- Places -->
    <g font-size="11" font-weight="bold" text-anchor="middle">
      <rect x="65" y="192" width="100" height="32" rx="8" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.8"/>
      <text x="115" y="212" fill="#1e3a8a">🏠 Rumah</text>

      <rect x="12" y="112" width="104" height="32" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
      <text x="64" y="132">🏥 Rumah Sakit</text>

      <rect x="156" y="112" width="108" height="32" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
      <text x="210" y="132">📚 Perpustakaan</text>

      <rect x="292" y="24" width="106" height="32" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
      <text x="345" y="44">🧁 Toko Kue</text>

      <rect x="302" y="112" width="88" height="32" rx="8" fill="#ffffff" stroke="#0f172a" stroke-width="1.8"/>
      <text x="346" y="132">☕ Kafe</text>
    </g>
  </svg>`
};

// =========================================================================
// BANK SOAL BAWAAN INFORMATIKA IX (TANPA KUNCI JAWABAN DI FRONTEND)
// =========================================================================
let QUESTIONS_BANK = [
  {
    no: 1,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Dalam dunia komputer, struktur data merujuk pada ….",
    options: [
      { key: "A", label: "cara menyimpan data yang tidak efisien" },
      { key: "B", label: "sebuah algoritma pencarian jalur terpendek" },
      { key: "C", label: "metode untuk memanipulasi data dalam bahasa pemrograman" },
      { key: "D", label: "cara agar organisasi dan penyimpanan data agar dapat diakses dan dikelola secara efisien" }
    ]
  },
  {
    no: 2,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Contoh aplikasi yang memanfaatkan struktur <em>tree</em> adalah ….",
    options: [
      { key: "A", label: "sistem navigasi peta digital" },
      { key: "B", label: "sistem manajemen basis data" },
      { key: "C", label: "sistem manajemen antrean transaksi" },
      { key: "D", label: "sistem pencarian teks dalam dokumen" }
    ]
  },
  {
    no: 3,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Dalam struktur data <em>tree</em>, jika sebuah node memiliki lebih dari satu node induk maka ….",
    options: [
      { key: "A", label: "node tersebut tidak valid dan tidak dapat diterima dalam struktur data tree" },
      { key: "B", label: "node tersebut disebut sebagai node anak" },
      { key: "C", label: "node tersebut disebut sebagai leaf node" },
      { key: "D", label: "node tersebut disebut sebagai root node" }
    ]
  },
  {
    no: 4,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: `<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs sm:text-sm mb-3 space-y-1">
             <div>/Britney</div>
             <div>/Britney/Games/Flip_flop.app</div>
             <div>/Britney/Office/Ms. Word/Nilai.doc</div>
           </div>
           Sebuah server menampilkan data yang tersimpan seperti di atas. Jika dianalogikan dengan struktur <em>tree</em>, tinggi pohon dari penggalan data di atas adalah ….`,
    options: [
      { key: "A", label: "1" },
      { key: "B", label: "2" },
      { key: "C", label: "3" },
      { key: "D", label: "4" }
    ]
  },
  {
    no: 5,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Contoh penerapan struktur data <em>graph</em> dalam kehidupan sehari-hari adalah ….",
    options: [
      { key: "A", label: "daftar kontak dalam ponsel" },
      { key: "B", label: "daftar belanja saat berbelanja di swalayan" },
      { key: "C", label: "riwayat pesanan di situs e-commerce" },
      { key: "D", label: "daftar playlist musik di aplikasi streaming musik" }
    ]
  },
  {
    no: 6,
    type: "PG",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Struktur data yang lebih cocok untuk menyimpan dan mengakses data secara berurutan dengan waktu akses yang cepat adalah ….",
    options: [
      { key: "A", label: "linked list" },
      { key: "B", label: "stack" },
      { key: "C", label: "queue" },
      { key: "D", label: "array" }
    ]
  },
  {
    no: 7,
    type: "PG",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: "Ekspresi Boolean merupakan ….",
    options: [
      { key: "A", label: "ekspresi yang hanya terdiri atas variabel-variabel huruf" },
      { key: "B", label: "ekspresi matematika yang hanya menggunakan angka bulat" },
      { key: "C", label: "ekspresi yang hanya terdiri atas tanda-tanda operasi matematika" },
      { key: "D", label: "ekspresi yang hanya menghasilkan nilai benar atau salah (true atau false)" }
    ]
  },
  {
    no: 8,
    type: "PG",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: "Operator yang digunakan untuk logika dasar adalah ….",
    options: [
      { key: "A", label: "OR, XOR, NAND" },
      { key: "B", label: "AND, OR, NOT" },
      { key: "C", label: "NOT, NOR, XOR" },
      { key: "D", label: "AND, NOR, NAND" }
    ]
  },
  {
    no: 9,
    type: "PG",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: "Hasil dari operasi logika <strong>AND</strong> jika operan pertama <em>true</em> dan operan kedua <em>false</em> adalah ….",
    options: [
      { key: "A", label: "true" },
      { key: "B", label: "false" },
      { key: "C", label: "tidak dapat ditentukan" },
      { key: "D", label: "tergantung pada operasi lain" }
    ]
  },
  {
    no: 10,
    type: "PG",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: "Contoh yang tepat dari integrasi konten perkantoran adalah ….",
    options: [
      { key: "A", label: "menggunakan Google Workspace untuk menyimpan dan berbagi dokumen antar aplikasi" },
      { key: "B", label: "menggabungkan spreadsheet dari Microsoft Excel ke Adobe Acrobat" },
      { key: "C", label: "menyimpan file dokumen di aplikasi perpesanan seperti Whatsapp" },
      { key: "D", label: "mentransfer presentasi dari PowerPoint ke Instagram" }
    ]
  },
  {
    no: 11,
    type: "PG",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: "Kasus berikut yang menggambarkan penggunaan <em>object linking</em> adalah ….",
    options: [
      { key: "A", label: "Rena mengambil gambar tangkapan layar dari sebuah grafik yang ia buat di Microsoft Excel, lalu menempelkannya pada dokumen Microsoft Word" },
      { key: "B", label: "Lizo menginput data pada sebuah lembar kerja di Microsoft Excel, lalu menduplikasi sebagian data ke lembar presentasi" },
      { key: "C", label: "Gavin membuat tabel pada Microsoft Excel, lalu menyalinnya pada lembar presentasi" },
      { key: "D", label: "Hika menautkan tabel yang dia buat di Microsoft Excel ke dokumen Word" }
    ]
  },
  {
    no: 12,
    type: "PG",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: "Ketika kamu menyalin sebuah tabel dari Microsoft Excel, lalu hendak menempelkannya ke dokumen Word, muncul beberapa pilihan <em>paste</em>, dua di antaranya <strong>Link &amp; Use Destination Style</strong> dan <strong>Link &amp; Keep Source Formatting</strong>. Perbedaan keduanya yang benar adalah ….",
    options: [
      { key: "A", label: "Link & Use Destination Style: Tabel akan ditempel dengan menyesuaikan format pada dokumen tujuan | Link & Keep Source Formatting: Tabel akan ditempel sesuai format asal tabel tersebut" },
      { key: "B", label: "Link & Use Destination Style: Ketika tabel pada Excel diedit, tabel pada Word akan mengikuti perubahannya | Link & Keep Source Formatting: Ketika tabel pada Excel diedit, tabel pada Word tidak ada perubahan" },
      { key: "C", label: "Link & Use Destination Style: Tabel akan muncul sebagai gambar | Link & Keep Source Formatting: Tabel akan muncul sebagai grafik" },
      { key: "D", label: "Link & Use Destination Style: Tabel yang ditempel tidak dapat diedit | Link & Keep Source Formatting: Tabel yang ditempel dapat diedit" }
    ]
  },
  {
    no: 13,
    type: "PG",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             Mira sedang membuka Instagramnya dan melihat sebuah unggahan foto kawanan gajah dengan caption “Yuk main-main sama gajah di #WayKambas”. Mira ingin tahu lebih lanjut tentang gajah di Way Kambas, sehingga dia mencari informasi di Google. Setelah memperoleh informasi yang cukup, Mira kembali membuka Instagramnya, lalu menyukai dan mengomentari unggahan tersebut.
           </div>
           Berdasarkan bacaan tersebut, aktivitas Mira yang menunjukkan <strong>jejak digital pasif</strong> adalah ….`,
    options: [
      { key: "A", label: "membuka instagram" },
      { key: "B", label: "menambah daftar riwayat pencarian" },
      { key: "C", label: "menyukai dan mengomentari unggahan" },
      { key: "D", label: "melihat unggahan gajah di Way Kambas" }
    ]
  },
  {
    no: 14,
    type: "PG",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: "Hasil konversi bilangan desimal $15$ ke dalam sistem bilangan biner adalah ….",
    options: [
      { key: "A", label: "$1010$" },
      { key: "B", label: "$1101$" },
      { key: "C", label: "$1111$" },
      { key: "D", label: "$1001$" }
    ]
  },
  {
    no: 15,
    type: "PG",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: "Perhatikan blok kode berikut!<br/>Dalam programnya, Ethan ingin menampilkan pesan sapaan selama $2$ detik di layar berdasarkan nama yang dimasukkan pengguna. Kode blok berikut yang menunjukkan penggunaan blok <strong>[Join]</strong> dengan benar dalam PictoBlox untuk mencapai tujuan tersebut adalah ….",
    svgCode: "SVG_15_PROMPT",
    options: [
      { key: "A", label: buildPictoBlockOptionSvg("SVG_15_A") },
      { key: "B", label: buildPictoBlockOptionSvg("SVG_15_B") },
      { key: "C", label: buildPictoBlockOptionSvg("SVG_15_C") },
      { key: "D", label: buildPictoBlockOptionSvg("SVG_15_D") }
    ]
  },
  {
    no: 16,
    type: "PGK",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             Lula sedang mempelajari antarmuka pengguna berbasis teks (<em>command line</em>) di komputernya. Dia mencoba mengakses file-file di komputernya dengan baris perintah. Gambar di bawah merupakan penggalan struktur data file di komputer Lula.
           </div>
           Baris perintah berikut yang <strong>benar</strong> untuk mengakses file-file di komputer Lula adalah …. (Pilih semua jawaban yang benar)`,
    svgCode: "SVG_16",
    options: [
      { key: "A", label: "<code>File_Ku/Video/jalan.mp4</code>" },
      { key: "B", label: "<code>File_Ku/HP_APRL/senja.png</code>" },
      { key: "C", label: "<code>File_Ku/Foto/20221016_02.png</code>" },
      { key: "D", label: "<code>File_Ku/Foto/Informatika/Struktur_Data/graph.png</code>" }
    ]
  },
  {
    no: 17,
    type: "PGK",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             Sebuah kota akan mengadakan beberapa acara dalam rangka HUT-RI. Acara-acara tersebut harus berlangsung sesuai dengan urutan tertentu yang disajikan dalam <em>graph</em> di bawah. Tanda panah menunjukkan suatu acara harus sudah berlangsung sebelum acara berikutnya. Misalnya, ‘Lurik Show’ hanya dapat dilakukan setelah ‘Drum Band’ dan ‘Pidato Bupati’ selesai.
           </div>
           Pernyataan berikut yang <strong>sesuai</strong> dengan struktur data acara HUT-RI adalah …. (Pilih semua jawaban yang benar)`,
    svgCode: "SVG_17",
    options: [
      { key: "A", label: "Acara ‘Gamelan’ dilaksanakan pertama kali." },
      { key: "B", label: "Acara ‘Undian’ dilakukan setelah ‘Pidato Bupati’." },
      { key: "C", label: "Acara ‘Drum Band’ dilakukan setelah acara ‘Lurik Show’." },
      { key: "D", label: "Acara ‘Kembang Api’ baru bisa dilaksanakan setelah ‘Gamelan’ dan ‘Pidato Bupati’ dilakukan." }
    ]
  },
  {
    no: 18,
    type: "PGK",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             Sebuah jaringan telekomunikasi di sebuah instansi digambarkan dengan sebuah <em>graph</em> seperti gambar di bawah. Huruf menggambarkan lokasi kantor cabang dari instansi tersebut. Setiap kali ada suatu informasi, setiap kantor cabang akan menginformasikan ke cabang lain sesuai jalur telekomunikasi yang terhubung dengannya.
           </div>
           Pernyataan berikut yang <strong>sesuai</strong> dengan struktur data <em>graph</em> di bawah adalah …. (Pilih semua jawaban yang benar)`,
    svgCode: "SVG_18",
    options: [
      { key: "A", label: "Ketika kantor cabang J menerima pesan, mereka hanya dapat menginformasikan ke cabang B, L, dan C." },
      { key: "B", label: "J menjadi kantor cabang yang paling banyak dapat mentransfer pesan ke kantor cabang lain." },
      { key: "C", label: "Saat H mendapat pesan, pesan dapat berjalan ke A dan A meneruskannya ke B dan D." },
      { key: "D", label: "Kantor cabang E hanya menerima informasi dari C." }
    ]
  },
  {
    no: 19,
    type: "PGK",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3 space-y-2">
             <div class="font-bold text-slate-900">Sistem Bilangan dalam Dunia Modern</div>
             <p>Seorang remaja bernama Ethan menyadari bahwa pemahaman tentang sistem bilangan memberinya keunggulan di banyak bidang. Dia belajar bahwa sistem bilangan biner digunakan dalam komputer untuk menyimpan dan memproses informasi. Dia juga menyadari bahwa bahasa pemrograman yang digunakan untuk membuat aplikasi dan perangkat lunak didasarkan pada logika Matematika yang mendasari sistem bilangan. Dengan semangat, Ethan mulai mengeksplorasi lebih dalam. Dia belajar tentang algoritma enkripsi yang melindungi data online dengan menggunakan konsep Matematika dari sistem bilangan. Dia juga menemukan bahwa sistem bilangan heksadesimal digunakan dalam desain warna digital, grafis komputer, dan dalam menganalisis data besar.</p>
           </div>
           Pernyataan yang <strong>sesuai</strong> dengan bacaan di atas adalah …. (Pilih semua jawaban yang benar)`,
    options: [
      { key: "A", label: "Sistem bilangan heksadesimal digunakan dalam menganalisis data besar." },
      { key: "B", label: "Ethan menemukan bahwa sistem bilangan biner digunakan dalam menganalisis data besar." },
      { key: "C", label: "Bahasa pemrograman didasarkan pada logika matematika yang mendasari sistem bilangan." },
      { key: "D", label: "Ethan menyadari bahwa pemahaman tentang sistem bilangan memberinya keunggulan di banyak bidang." }
    ]
  },
  {
    no: 20,
    type: "PGK",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3 space-y-2">
             <div class="font-bold text-slate-900">Meningkatkan Kreativitas Menggunakan PictoBlox</div>
             <p>Shopia ingin memperluas keterampilannya dengan memulai petualangan baru dengan PictoBlox, platform pemrograman visual yang inovatif. Dengan PictoBlox, Shopia menemukan cara yang menyenangkan dan mudah untuk mengembangkan kreativitasnya melalui coding. Melalui fitur-fitur yang interaktif dan intuitif, Shopia dapat dengan cepat membuat animasi, permainan, dan proyek kreatif lainnya. Dengan antarmuka yang ramah pengguna dan berbagai kode blok yang mudah dipahami, Shopia merasa termotivasi untuk terus mengembangkan keterampilan pemrogramannya.</p>
           </div>
           Alasan Shopia tertarik untuk menggunakan PictoBlox adalah …. (Pilih semua jawaban yang benar)`,
    options: [
      { key: "A", label: "fitur-fitur interaktif dan intuitif" },
      { key: "B", label: "antarmuka ramah pengguna" },
      { key: "C", label: "tantangan yang rumit dalam pemrograman" },
      { key: "D", label: "ketersediaan berbagai bahasa pemrograman" }
    ]
  },
  {
    no: 21,
    type: "BS",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Yani menjadi petugas pengatur ruang untuk ekstrakurikuler. Ia memiliki catatan ruangan yang digunakan selama 1 minggu (kotak berarsir menunjukkan ruangan yang <strong>digunakan</strong> pada hari itu).<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    svgCode: "SVG_21",
    statement: "Jika ada kegiatan ekstrakurikuler baru yang akan menggunakan ruangan setiap hari (Senin–Kamis), Yani dapat merekomendasikan ruangan 2 dan 5."
  },
  {
    no: 22,
    type: "BS",
    topic: "Berpikir Komputasional",
    weight: 2,
    text: "Perhatikan kembali catatan penggunaan ruangan ekstrakurikuler milik Yani.<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    svgCode: "SVG_21",
    statement: "Jika ada kegiatan ekstrakurikuler baru yang ingin menggunakan ruangan hari Senin dan Kamis, Yani memiliki 6 ruangan kosong."
  },
  {
    no: 23,
    type: "BS",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             <strong>OLE Bantu Tingkatkan Produktivitas:</strong> Dengan menggunakan OLE (<em>Object Linking and Embedding</em>), Tian dapat menyematkan dan menautkan spreadsheet Excel ke dalam dokumen Microsoft Word secara dinamis sehingga perubahan pada data asli akan langsung tecermin dalam dokumen yang terhubung.
           </div>
           Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:`,
    statement: "Jika Tian mengubah data di spreadsheet Excel asli, perubahan tersebut tidak akan tecermin dalam dokumen Word tempat spreadsheet ditautkan."
  },
  {
    no: 24,
    type: "BS",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 2,
    text: "Berdasarkan bacaan <strong>OLE Bantu Tingkatkan Produktivitas</strong> di atas, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    statement: "Fitur OLE memungkinkan Tian untuk tidak lagi membuat salinan terpisah dari objek atau data yang ingin disematkan."
  },
  {
    no: 25,
    type: "BS",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             Alin memiliki lima kartu berisi angka desimal: <strong>Kartu Biru = 2</strong>, <strong>Kartu Merah = 11</strong>, <strong>Kartu Kuning = 16</strong>, <strong>Kartu Hijau = 223</strong>, dan <strong>Kartu Oranye = 2001</strong>.
           </div>
           Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:`,
    statement: "Angka dalam Kartu Merah jika dikonversi dalam sistem bilangan heksadesimal adalah B."
  },
  {
    no: 26,
    type: "ISIAN",
    topic: "Berpikir Komputasional",
    weight: 4,
    text: "<em>Computational thinking</em> atau berpikir komputasional merupakan kemampuan untuk ….",
    placeholder: "Tuliskan pengertian singkat berpikir komputasional..."
  },
  {
    no: 27,
    type: "ISIAN",
    topic: "Berpikir Komputasional",
    weight: 4,
    text: "Struktur data yang paling cocok untuk menyimpan informasi terkait struktur pengurus di dalam kelas adalah ….",
    placeholder: "Contoh: Tree / Graph / Array..."
  },
  {
    no: 28,
    type: "ISIAN",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 4,
    text: "Selain <em>cut</em> dan <em>copy</em>, perintah yang terdapat pada grup perintah <strong>Clipboard</strong> adalah ….",
    placeholder: "Tuliskan nama perintah pada Clipboard..."
  },
  {
    no: 29,
    type: "ISIAN",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 4,
    text: "Menu (tab) yang mencakup perintah menambahkan tabel ke dalam dokumen adalah ….",
    placeholder: "Tuliskan nama tab menu..."
  },
  {
    no: 30,
    type: "ISIAN",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 4,
    text: "Nilai desimal dari bilangan oktal $64_8$ adalah ….",
    placeholder: "Tuliskan angka hasil konversi desimal..."
  },
  {
    no: 31,
    type: "URAIAN",
    topic: "Berpikir Komputasional",
    weight: 6,
    text: "Perhatikan kembali gambar jaringan telekomunikasi berikut!<br/>Kantor cabang mana yang dipilih untuk meneruskan sebuah informasi jika kita menginginkan informasi tersebut tersebar ke semua cabang dengan segera? Berikan penjelasan yang mendukung jawabanmu!",
    svgCode: "SVG_18",
    placeholder: "Tuliskan kantor cabang yang dipilih beserta penjelasannya..."
  },
  {
    no: 32,
    type: "URAIAN",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 6,
    text: "Jelaskan perbedaan antara <strong>ekspresi logika</strong> dan <strong>ekspresi aritmatika</strong>! Berikan contoh yang mendukung penjelasanmu!",
    placeholder: "Tuliskan perbedaan dan contoh ekspresi logika serta aritmatika..."
  },
  {
    no: 33,
    type: "URAIAN",
    topic: "Berpikir Komputasional",
    weight: 6,
    text: "Tedi perlu menuju ke empat tempat berikut (Rumah Sakit, Perpustakaan, Toko Kue, dan Kafe). Angka di jalan menunjukkan lama waktu (dalam menit) yang dibutuhkan dari satu tempat ke tempat lainnya.<br/>Berapa waktu tersingkat yang Tedi butuhkan untuk pergi dari <strong>Rumah</strong> kemudian mengunjungi keempat tempat tersebut dan kembali ke <strong>Rumah</strong>? Tuliskan rutenya!",
    svgCode: "SVG_33",
    placeholder: "Tuliskan rute perjalanan dan total waktu tersingkat..."
  },
  {
    no: 34,
    type: "URAIAN",
    topic: "Teknologi Informasi dan Komunikasi",
    weight: 6,
    text: "Heidi akan menyalin sebuah tabel dari satu dokumen Word ke dokumen Word lainnya. Saat akan melakukan <em>paste</em>, Heidi melihat pilihan <strong>Keep Original Table Formatting</strong>, <strong>Cell Content</strong>, dan <strong>Keep Text Only</strong>. Manakah jenis <em>paste</em> yang Heidi gunakan agar tabelnya tidak berubah? Jelaskan!",
    placeholder: "Tuliskan jenis paste yang dipilih beserta penjelasannya..."
  },
  {
    no: 35,
    type: "URAIAN",
    topic: "Sistem Komputer & Algoritma Pemrograman",
    weight: 6,
    text: "Apa perbedaan antara <strong>PictoBlox</strong> dan <strong>Scratch</strong>? Jelaskan setidaknya tiga perbedaan utama di antara keduanya!",
    placeholder: "Tuliskan minimal tiga perbedaan utama PictoBlox dan Scratch..."
  }
];

// =========================================================================
// STATE APLIKASI & PENYIMPANAN LOKAL (TERPISAH DARI MAPEL LAIN)
// =========================================================================
const STORAGE_KEY_SESSION = "pra_asas_inf9_session_v1";
const STORAGE_KEY_LOCAL_DB = "pra_asas_inf9_local_submissions_v1";
const STORAGE_KEY_LOCAL_CFG = "pra_asas_inf9_local_config_v1";

let appConfig = {
  isOpen: true,
  durationMinutes: 90,
  requireToken: false,
  sessionToken: "",
  pgkPartialScore: true,
  showExplanation: false,
  oneAttempt: true,
  shuffleQuestions: false,
  shuffleOptions: false
};

let examState = {
  student: null,
  questionOrder: [],
  optionOrders: {},
  answers: {},
  doubtful: {},
  tabSwitchCount: 0,
  currentIndex: 0,
  endTime: null
};

let timerInterval = null;
let lastTabSwitchAt = 0;
let adminPasswordCache = "";
let adminSubmissions = [];
let adminKeysMap = {};
let activeGradingSubmission = null;

// =========================================================================
// INISIALISASI HALAMAN & PENDETEKSI PINDAH TAB RINGAN
// =========================================================================
window.addEventListener("DOMContentLoaded", async () => {
  populateAbsenDropdown();
  loadLocalConfig();
  await fetchBootstrapFromServer();
  restorePreviousSessionIfAny();
  setupTabSwitchTracker();
});

function populateAbsenDropdown() {
  const sel = document.getElementById("f-absen");
  for (let i = 1; i <= 36; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = "No. Absen " + i;
    sel.appendChild(opt);
  }
}

function loadLocalConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCAL_CFG);
    if (saved) appConfig = { ...appConfig, ...JSON.parse(saved) };
  } catch (e) {}
  applyConfigToUI();
}

async function fetchBootstrapFromServer() {
  const badge = document.getElementById("server-mode-badge");
  if (!APPS_SCRIPT_URL) {
    badge.classList.remove("hidden");
    return;
  }
  badge.textContent = "Terhubung ke Server";
  badge.className = "hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200";
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=getBootstrap&t=" + Date.now());
    const data = await res.json();
    if (data && data.ok) {
      if (data.config) {
        appConfig = { ...appConfig, ...data.config };
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        QUESTIONS_BANK = data.questions;
      }
      applyConfigToUI();
    } else {
      showToast("Skrip Apps Script perlu di-deploy ulang sebagai New Version agar sinkronisasi berjalan.", "warning");
    }
  } catch (err) {
    showToast("Gagal memuat pengaturan terbaru dari server, memakai pengaturan cadangan.", "warning");
  }
}

function applyConfigToUI() {
  document.getElementById("info-duration-text").textContent = appConfig.durationMinutes + " Menit";
  document.getElementById("info-subtitle-count").textContent = `Tahun Ajaran 2026/2027 • ${QUESTIONS_BANK.length} Butir Soal`;
  document.getElementById("hud-total-q").textContent = QUESTIONS_BANK.length;

  const closedBanner = document.getElementById("exam-closed-banner");
  closedBanner.classList.toggle("hidden", !!appConfig.isOpen);

  const needsToken = !!(appConfig.requireToken || (appConfig.sessionToken && appConfig.sessionToken.trim() !== ""));
  document.getElementById("token-field-wrap").classList.toggle("hidden", !needsToken);

  validateStartButton();
}

function setupTabSwitchTracker() {
  const recordSwitch = () => {
    const examView = document.getElementById("view-exam");
    if (!examView || examView.classList.contains("hidden")) return;
    const now = Date.now();
    if (now - lastTabSwitchAt < 2000) return;
    lastTabSwitchAt = now;
    examState.tabSwitchCount = (examState.tabSwitchCount || 0) + 1;
    saveSessionToStorage();
    showToast(`Perpindahan layar tercatat (${examState.tabSwitchCount}x). Tetap fokus mengerjakan soal ya!`, "warning");
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) recordSwitch();
  });
  window.addEventListener("blur", recordSwitch);
}

// =========================================================================
// FORMAT NAMA CAPITAL EACH WORD & VALIDASI FORMULIR AWAL
// =========================================================================
function toCapitalEachWord(str, trimEdges = false) {
  let cleaned = str.replace(/\s{2,}/g, " ");
  if (trimEdges) cleaned = cleaned.trim();
  return cleaned.replace(/\b([a-zA-ZÀ-ÿ])/g, (m) => m.toUpperCase());
}

function onNamaInput(el) {
  const pos = el.selectionStart;
  el.value = toCapitalEachWord(el.value, false);
  try { el.setSelectionRange(pos, pos); } catch (e) {}
  validateStartButton();
}

function onNamaBlur(el) {
  el.value = toCapitalEachWord(el.value, true);
  validateStartButton();
}

function validateStartButton() {
  const nama = document.getElementById("f-nama").value.trim();
  const absen = document.getElementById("f-absen").value;
  const kelas = document.getElementById("f-kelas").value;
  const tokenWrapVisible = !document.getElementById("token-field-wrap").classList.contains("hidden");
  const tokenVal = document.getElementById("f-token").value.trim();

  const btn = document.getElementById("btn-start-exam");
  const tokenOk = !tokenWrapVisible || tokenVal.length >= 2;
  btn.disabled = !(appConfig.isOpen && nama.length >= 2 && absen !== "" && kelas !== "" && tokenOk);
}

function restorePreviousSessionIfAny() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.student && parsed.endTime && Date.now() < parsed.endTime) {
      document.getElementById("f-nama").value = parsed.student.nama;
      document.getElementById("f-absen").value = parsed.student.absen;
      document.getElementById("f-kelas").value = parsed.student.kelas;
      document.getElementById("resume-notice").classList.remove("hidden");
      validateStartButton();
    }
  } catch (e) {}
}

// =========================================================================
// MEMULAI PENGERJAAN SOAL (TERMASUK VALIDASI TOKEN SESI)
// =========================================================================
async function handleStartExam(e) {
  e.preventDefault();
  if (!appConfig.isOpen) {
    showToast("Latihan soal sedang ditutup oleh guru.", "error");
    return;
  }

  const nama = toCapitalEachWord(document.getElementById("f-nama").value, true);
  const absen = document.getElementById("f-absen").value;
  const kelas = document.getElementById("f-kelas").value;
  const tokenInput = document.getElementById("f-token").value.trim().toUpperCase();
  const btn = document.getElementById("btn-start-exam");

  if (APPS_SCRIPT_URL && appConfig.requireToken) {
    btn.disabled = true;
    btn.textContent = "Memeriksa Token...";
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "verifySessionStart", student: { nama, absen, kelas }, token: tokenInput })
      });
      const check = await res.json();
      btn.disabled = false;
      btn.textContent = "Mulai Mengerjakan";
      if (!check.ok) {
        showToast(check.message || "Token sesi salah atau Anda sudah pernah mengerjakan.", "error");
        return;
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Mulai Mengerjakan";
      showToast("Gagal memeriksa token ke server: " + err.message, "error");
      return;
    }
  } else if (!APPS_SCRIPT_URL && appConfig.sessionToken && appConfig.sessionToken.trim() !== "") {
    if (tokenInput !== appConfig.sessionToken.trim().toUpperCase()) {
      showToast("Token sesi tidak sesuai dengan pengaturan guru.", "error");
      return;
    }
  }

  let resumed = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const prev = JSON.parse(raw);
      if (
        prev.student &&
        prev.student.nama === nama &&
        prev.student.absen === absen &&
        prev.student.kelas === kelas &&
        Date.now() < prev.endTime
      ) {
        examState = prev;
        if (!examState.doubtful) examState.doubtful = {};
        resumed = true;
        showToast("Melanjutkan pengerjaan dari jawaban tersimpan.", "info");
      }
    }
  } catch (err) {}

  if (!resumed) {
    let order = QUESTIONS_BANK.map((_, idx) => idx);
    if (appConfig.shuffleQuestions) {
      order = shuffleArray(order);
    }
    const optOrders = {};
    QUESTIONS_BANK.forEach((q) => {
      if (q.type === "PG" || q.type === "PGK") {
        const keys = q.options.map((o) => o.key);
        optOrders[q.no] = appConfig.shuffleOptions ? shuffleArray(keys) : keys;
      }
    });

    examState = {
      student: { nama, absen, kelas },
      questionOrder: order,
      optionOrders: optOrders,
      answers: {},
      doubtful: {},
      tabSwitchCount: 0,
      currentIndex: 0,
      endTime: Date.now() + appConfig.durationMinutes * 60 * 1000
    };
    saveSessionToStorage();
  }

  document.getElementById("hud-nama").textContent = examState.student.nama;
  document.getElementById("hud-meta").textContent = `Kelas ${examState.student.kelas} • No. Absen ${examState.student.absen}`;

  switchView("view-exam");
  renderQuestionNavGrid();
  renderCurrentQuestion();
  startCountdownTimer();
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function saveSessionToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(examState));
  } catch (e) {}
}

function startCountdownTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const updateTick = () => {
    const diff = Math.max(0, Math.floor((examState.endTime - Date.now()) / 1000));
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    document.getElementById("hud-timer").textContent = `${m}:${s}`;
    if (diff <= 300) {
      document.getElementById("hud-timer-box").className = "px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 text-xs sm:text-sm font-extrabold";
    }
    if (diff === 0) {
      clearInterval(timerInterval);
      showToast("Waktu habis! Jawaban Anda sedang dikirim otomatis.", "warning");
      submitAnswersToServer();
    }
  };
  updateTick();
  timerInterval = setInterval(updateTick, 1000);
}

// =========================================================================
// RENDER SOAL, BILAH SIMBOL & TANDA RAGU-RAGU
// =========================================================================
function renderDiagramHtml(q) {
  if (q.svgCode && SVG_DIAGRAMS[q.svgCode]) {
    return `<div>${SVG_DIAGRAMS[q.svgCode]}</div>`;
  }
  if (q.svgCode && q.svgCode.startsWith("http")) {
    return `<div class="my-2 text-center"><img src="${escapeHtml(q.svgCode)}" alt="Gambar Soal ${q.no}" class="max-h-56 mx-auto rounded-xl border border-slate-200" /></div>`;
  }
  return "";
}

function renderOptionLabel(rawLabel) {
  if (rawLabel && rawLabel.startsWith("SVG_15_")) {
    return buildPictoBlockOptionSvg(rawLabel);
  }
  return rawLabel || "";
}

function createMathSymbolBar(qNo, fieldId) {
  const symbols = ["→", "∧", "∨", "¬", "≠", "≤", "≥", "×", "÷", "^"];
  const bar = document.createElement("div");
  bar.className = "flex flex-wrap items-center gap-1.5 mb-2.5 p-2 rounded-xl bg-slate-100 border border-slate-200";

  const label = document.createElement("span");
  label.className = "text-xs font-bold text-slate-600 mr-1";
  label.textContent = "Sisipkan Simbol:";
  bar.appendChild(label);

  symbols.forEach((sym) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = sym;
    btn.className = "w-9 h-9 rounded-lg bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-slate-300 text-slate-900 font-extrabold text-sm shadow-2xs";
    btn.onclick = () => insertSymbolAtCursor(qNo, fieldId, sym);
    bar.appendChild(btn);
  });

  return bar;
}

function insertSymbolAtCursor(qNo, fieldId, sym) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  const before = field.value.substring(0, start);
  const after = field.value.substring(end);
  field.value = before + sym + after;
  field.focus();
  const newPos = start + sym.length;
  try { field.setSelectionRange(newPos, newPos); } catch (e) {}
  selectAnswer(qNo, field.value, false);
}

function renderCurrentQuestion() {
  const qIdx = examState.questionOrder[examState.currentIndex];
  const q = QUESTIONS_BANK[qIdx];
  const savedAns = examState.answers[q.no] || "";
  const isDoubt = !!(examState.doubtful && examState.doubtful[q.no]);

  const typeLabelMap = {
    PG: "Pilihan Ganda",
    PGK: "Pilihan Ganda Kompleks",
    BS: "Benar / Salah",
    ISIAN: "Isian Singkat",
    URAIAN: "Uraian"
  };

  document.getElementById("q-badge-no").textContent = `Soal ${examState.currentIndex + 1} dari ${QUESTIONS_BANK.length} (#${q.no})`;
  document.getElementById("q-badge-type").textContent = typeLabelMap[q.type] || q.type;
  document.getElementById("q-badge-topic").textContent = q.topic || "Informatika IX";

  const btnDoubt = document.getElementById("btn-doubt");
  if (isDoubt) {
    btnDoubt.textContent = "★ Ditandai Ragu-Ragu";
    btnDoubt.className = "touch-btn px-4 sm:px-5 py-3 rounded-xl border-2 border-amber-500 bg-amber-400 text-slate-950 font-extrabold text-sm";
  } else {
    btnDoubt.textContent = "Tandai Ragu-Ragu";
    btnDoubt.className = "touch-btn px-4 sm:px-5 py-3 rounded-xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-sm";
  }

  const promptEl = document.getElementById("q-prompt");
  promptEl.innerHTML = `<div>${q.text}</div>${renderDiagramHtml(q)}`;

  const optionsEl = document.getElementById("q-options");
  optionsEl.innerHTML = "";

  if (q.type === "PG") {
    const orderKeys = examState.optionOrders[q.no] || ["A", "B", "C", "D"];
    const letters = ["A", "B", "C", "D"];
    const wrap = document.createElement("div");
    wrap.className = "space-y-3";

    orderKeys.forEach((origKey, idx) => {
      const optObj = q.options.find((o) => o.key === origKey);
      if (!optObj) return;
      const isSelected = savedAns === origKey;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `touch-btn w-full text-left p-4 rounded-xl border-2 flex items-center gap-3.5 transition ${
        isSelected
          ? "border-indigo-600 bg-indigo-50 text-indigo-950 font-bold"
          : "border-slate-200 hover:border-indigo-300 bg-white text-slate-800"
      }`;
      btn.innerHTML = `
        <span class="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
        }">${letters[idx]}</span>
        <span class="text-base flex-1">${renderOptionLabel(optObj.label)}</span>
      `;
      btn.onclick = () => selectAnswer(q.no, origKey);
      wrap.appendChild(btn);
    });
    optionsEl.appendChild(wrap);
  } else if (q.type === "PGK") {
    const orderKeys = examState.optionOrders[q.no] || ["A", "B", "C", "D"];
    const letters = ["A", "B", "C", "D"];
    const selectedList = savedAns ? savedAns.split(",").map((s) => s.trim()) : [];

    const hint = document.createElement("div");
    hint.className = "mb-3 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold";
    hint.textContent = "Pilihan Ganda Kompleks: Pilih semua jawaban yang benar (boleh lebih dari satu pilihan).";
    optionsEl.appendChild(hint);

    const wrap = document.createElement("div");
    wrap.className = "space-y-3";

    orderKeys.forEach((origKey, idx) => {
      const optObj = q.options.find((o) => o.key === origKey);
      if (!optObj) return;
      const isSelected = selectedList.includes(origKey);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `touch-btn w-full text-left p-4 rounded-xl border-2 flex items-center gap-3.5 transition ${
        isSelected
          ? "border-indigo-600 bg-indigo-50 text-indigo-950 font-bold"
          : "border-slate-200 hover:border-indigo-300 bg-white text-slate-800"
      }`;
      btn.innerHTML = `
        <span class="w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-extrabold shrink-0 ${
          isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-400 bg-white text-transparent"
        }">✓</span>
        <span class="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
        }">${letters[idx]}</span>
        <span class="text-base flex-1">${renderOptionLabel(optObj.label)}</span>
      `;
      btn.onclick = () => toggleMultiAnswer(q.no, origKey);
      wrap.appendChild(btn);
    });
    optionsEl.appendChild(wrap);
  } else if (q.type === "BS") {
    optionsEl.innerHTML = `
      <div class="rounded-xl border border-slate-200 overflow-hidden mb-4">
        <div class="bg-slate-100 px-4 py-2.5 text-xs font-extrabold uppercase text-slate-600">Pernyataan</div>
        <div class="p-4 text-base font-medium text-slate-900 bg-slate-50/50">${q.statement || ""}</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button type="button" onclick="selectAnswer(${q.no}, 'Benar')" class="touch-btn py-4 px-5 rounded-xl border-2 font-extrabold text-base ${
          savedAns === "Benar"
            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
        }">Benar</button>
        <button type="button" onclick="selectAnswer(${q.no}, 'Salah')" class="touch-btn py-4 px-5 rounded-xl border-2 font-extrabold text-base ${
          savedAns === "Salah"
            ? "border-rose-600 bg-rose-50 text-rose-900"
            : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
        }">Salah</button>
      </div>
    `;
  } else if (q.type === "ISIAN") {
    const fieldId = "ans-input-" + q.no;
    optionsEl.appendChild(createMathSymbolBar(q.no, fieldId));
    const inp = document.createElement("input");
    inp.type = "text";
    inp.id = fieldId;
    inp.value = savedAns;
    inp.placeholder = q.placeholder || "Ketik jawaban singkat Anda...";
    inp.className = "touch-btn w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 text-base font-semibold focus:outline-none focus:border-indigo-600";
    inp.oninput = (e) => selectAnswer(q.no, e.target.value, false);
    optionsEl.appendChild(inp);
  } else if (q.type === "URAIAN") {
    const fieldId = "ans-textarea-" + q.no;
    optionsEl.appendChild(createMathSymbolBar(q.no, fieldId));
    const ta = document.createElement("textarea");
    ta.id = fieldId;
    ta.rows = 5;
    ta.value = savedAns;
    ta.placeholder = q.placeholder || "Tuliskan penjelasan dan jawaban lengkap Anda...";
    ta.className = "w-full p-4 rounded-xl border-2 border-slate-300 text-base focus:outline-none focus:border-indigo-600";
    ta.oninput = (e) => selectAnswer(q.no, e.target.value, false);
    optionsEl.appendChild(ta);
  }

  document.getElementById("btn-prev").disabled = examState.currentIndex === 0;
  const isLast = examState.currentIndex === QUESTIONS_BANK.length - 1;
  document.getElementById("btn-next").classList.toggle("hidden", isLast);
  document.getElementById("btn-finish").classList.toggle("hidden", !isLast);

  updateAnsweredCounter();
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.getElementById("view-exam"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }
}

function selectAnswer(qNo, value, rerender = true) {
  examState.answers[qNo] = value;
  saveSessionToStorage();
  updateAnsweredCounter();
  renderQuestionNavGrid();
  if (rerender) renderCurrentQuestion();
}

function toggleMultiAnswer(qNo, optionKey) {
  const currentRaw = examState.answers[qNo] || "";
  const set = new Set(currentRaw ? currentRaw.split(",").map((s) => s.trim()).filter(Boolean) : []);
  if (set.has(optionKey)) {
    set.delete(optionKey);
  } else {
    set.add(optionKey);
  }
  const combined = Array.from(set).sort().join(",");
  selectAnswer(qNo, combined, true);
}

function toggleDoubtCurrent() {
  const qIdx = examState.questionOrder[examState.currentIndex];
  const q = QUESTIONS_BANK[qIdx];
  if (!examState.doubtful) examState.doubtful = {};
  examState.doubtful[q.no] = !examState.doubtful[q.no];
  saveSessionToStorage();
  renderQuestionNavGrid();
  renderCurrentQuestion();
}

function moveQuestion(delta) {
  const next = examState.currentIndex + delta;
  if (next >= 0 && next < QUESTIONS_BANK.length) {
    jumpToQuestion(next);
  }
}

function jumpToQuestion(idx) {
  examState.currentIndex = idx;
  saveSessionToStorage();
  renderQuestionNavGrid();
  renderCurrentQuestion();
}

function renderQuestionNavGrid() {
  const grid = document.getElementById("q-nav-grid");
  grid.innerHTML = "";
  examState.questionOrder.forEach((qIdx, dispIdx) => {
    const q = QUESTIONS_BANK[qIdx];
    const ans = (examState.answers[q.no] || "").trim();
    const isDoubt = !!(examState.doubtful && examState.doubtful[q.no]);
    const isCurrent = dispIdx === examState.currentIndex;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = dispIdx + 1;

    let colorClass = "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100";
    if (isDoubt) {
      colorClass = "bg-amber-400 text-slate-950 border-amber-500 font-extrabold";
    } else if (ans !== "") {
      colorClass = "bg-emerald-600 text-white border-emerald-600";
    }

    btn.className = `h-10 rounded-xl font-bold text-xs border transition ${
      isCurrent ? "ring-2 ring-indigo-600 ring-offset-1 " : ""
    }${colorClass}`;
    btn.onclick = () => jumpToQuestion(dispIdx);
    grid.appendChild(btn);
  });
}

function updateAnsweredCounter() {
  let count = 0;
  QUESTIONS_BANK.forEach((q) => {
    if ((examState.answers[q.no] || "").trim() !== "") count++;
  });
  document.getElementById("hud-answered").textContent = count;
}

// =========================================================================
// KONFIRMASI & PENGIRIMAN JAWABAN KE GOOGLE APPS SCRIPT
// =========================================================================
function askConfirmSubmit() {
  let answered = 0;
  let doubtCount = 0;
  QUESTIONS_BANK.forEach((q) => {
    if ((examState.answers[q.no] || "").trim() !== "") answered++;
    if (examState.doubtful && examState.doubtful[q.no]) doubtCount++;
  });
  const unanswered = QUESTIONS_BANK.length - answered;
  let msg =
    unanswered > 0
      ? `Anda baru menjawab ${answered} dari ${QUESTIONS_BANK.length} soal (masih ada ${unanswered} soal kosong).`
      : `Semua ${QUESTIONS_BANK.length} soal sudah terjawab.`;

  if (doubtCount > 0) {
    msg += ` Masih ada ${doubtCount} soal yang ditandai Ragu-Ragu (kuning).`;
  }
  msg += ` Apakah Anda yakin ingin mengumpulkan jawaban sekarang?`;

  openConfirmDialog("Kumpulkan Jawaban Latihan?", msg, () => {
    submitAnswersToServer();
  });
}

async function submitAnswersToServer() {
  document.getElementById("submit-error-banner").classList.add("hidden");
  const btnFinish = document.getElementById("btn-finish");
  if (btnFinish) btnFinish.disabled = true;

  const payload = {
    action: "submitExam",
    student: examState.student,
    answers: examState.answers,
    tabSwitches: examState.tabSwitchCount || 0,
    submittedAt: new Date().toISOString()
  };

  if (APPS_SCRIPT_URL) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.ok) {
        if (result.duplicate) {
          showToast(result.message || "Identitas ini sudah pernah mengumpulkan jawaban.", "error");
          if (btnFinish) btnFinish.disabled = false;
          return;
        }
        throw new Error(result.message || "Gagal memproses nilai di server.");
      }
      clearInterval(timerInterval);
      localStorage.removeItem(STORAGE_KEY_SESSION);
      showStudentResult(result);
    } catch (err) {
      if (btnFinish) btnFinish.disabled = false;
      document.getElementById("submit-error-banner").classList.remove("hidden");
      document.getElementById("submit-error-detail").textContent =
        "Detail kendala: " + err.message + ". Jawaban Anda aman di perangkat ini, silakan tekan Coba Lagi.";
      showToast("Gagal mengirim jawaban. Silakan coba lagi.", "error");
    }
    return;
  }

  clearInterval(timerInterval);
  localStorage.removeItem(STORAGE_KEY_SESSION);
  if (btnFinish) btnFinish.disabled = false;
  showToast("Mode Pratinjau: Kunci jawaban tersimpan aman di Code.gs. Pasang APPS_SCRIPT_URL untuk penilaian otomatis.", "info");
  switchView("view-result");
  document.getElementById("res-identity").textContent = `${examState.student.nama} • Kelas ${examState.student.kelas} • No. Absen ${examState.student.absen}`;
  document.getElementById("res-score").textContent = "-";
  document.getElementById("res-encouragement").textContent = "Jawaban Anda tercatat pada mode pratinjau. Setelah Google Apps Script terhubung, nilai otomatis dan penguasaan per topik akan tampil di sini.";
  document.getElementById("res-topic-list").innerHTML = `<div class="text-xs text-slate-500">Hubungkan Google Apps Script untuk menampilkan persentase penguasaan materi.</div>`;
}

function showStudentResult(result) {
  switchView("view-result");
  document.getElementById("res-identity").textContent = `${examState.student.nama} • Kelas ${examState.student.kelas} • No. Absen ${examState.student.absen}`;
  document.getElementById("res-score").textContent = result.totalScore;

  let msg = "Terus berlatih! Pelajari kembali materi di bawah ini agar makin siap menghadapi ASAS Informatika.";
  if (result.totalScore >= 85) msg = "Luar biasa! Pemahamanmu sudah sangat mantap untuk menghadapi ASAS Informatika.";
  else if (result.totalScore >= 70) msg = "Bagus! Tingkatkan ketelitian pada topik yang masih di bawah 75% agar nilaimu semakin maksimal saat ASAS.";
  document.getElementById("res-encouragement").textContent = msg;

  const topicListEl = document.getElementById("res-topic-list");
  if (Array.isArray(result.topicBreakdown) && result.topicBreakdown.length > 0) {
    topicListEl.innerHTML = result.topicBreakdown
      .map((t) => {
        const pct = Math.round(t.pct);
        const barColor = pct >= 75 ? "bg-emerald-600" : pct >= 55 ? "bg-amber-500" : "bg-rose-600";
        return `
        <div>
          <div class="flex justify-between text-xs font-bold mb-1">
            <span class="text-slate-800">${escapeHtml(t.topic)}</span>
            <span class="text-slate-700">${t.earned}/${t.max} poin (${pct}%)</span>
          </div>
          <div class="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div class="h-full ${barColor}" style="width: ${pct}%"></div>
          </div>
        </div>`;
      })
      .join("");
  }

  const expBox = document.getElementById("res-explanation-box");
  const expList = document.getElementById("res-explanation-list");
  if (result.showExplanation && Array.isArray(result.review)) {
    expBox.classList.remove("hidden");
    expList.innerHTML = result.review
      .map(
        (item) => `
      <div class="p-4 rounded-xl border ${item.isCorrect ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}">
        <div class="flex items-center justify-between text-xs font-extrabold">
          <span>Soal No. ${item.no}</span>
          <span class="${item.isCorrect ? "text-emerald-700" : "text-rose-700"}">${item.isCorrect ? "Benar" : item.earned > 0 ? "Benar Sebagian" : "Perlu Diperbaiki"} (${item.earned}/${item.max})</span>
        </div>
        <div class="text-xs text-slate-700 mt-1">Jawaban Anda: <strong>${escapeHtml(item.studentAns || "-")}</strong> | Kunci: <strong>${escapeHtml(item.correctKey)}</strong></div>
        <div class="text-xs text-slate-600 mt-1.5">${item.explanation}</div>
      </div>`
      )
      .join("");
    if (typeof renderMathInElement === "function") {
      renderMathInElement(expList, {
        delimiters: [{ left: "$", right: "$", display: false }],
        throwOnError: false
      });
    }
  } else {
    expBox.classList.add("hidden");
  }
}

function restartForNextStudent() {
  document.getElementById("login-form").reset();
  document.getElementById("resume-notice").classList.add("hidden");
  validateStartButton();
  goHome();
}

// =========================================================================
// HALAMAN ADMIN: LOGIN, PENGATURAN, KOREKSI MANUAL, HAPUS & ANALISIS
// =========================================================================
function openAdminGate() {
  if (adminPasswordCache) {
    switchView("view-admin");
    loadAdminData();
  } else {
    switchView("view-admin-login");
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById("admin-pass").value;
  const btn = document.getElementById("btn-admin-submit");
  btn.disabled = true;
  btn.textContent = "Memeriksa...";

  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetDashboard", password: pass })
      });
      const data = await res.json();
      btn.disabled = false;
      btn.textContent = "Masuk";
      if (!data.ok) {
        showToast(data.message || "Kata sandi admin salah!", "error");
        return;
      }
      adminPasswordCache = pass;
      adminSubmissions = data.submissions || [];
      if (data.adminKeys) adminKeysMap = data.adminKeys;
      if (!data.adminKeys) {
        showToast("Perhatian: Apps Script masih menjalankan versi lama. Silakan Deploy -> New Version.", "warning");
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) QUESTIONS_BANK = data.questions;
      if (data.config) {
        appConfig = { ...appConfig, ...data.config };
        syncSettingsCheckboxes();
      }
      switchView("view-admin");
      renderAdminTables();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Masuk";
      showToast("Gagal terhubung ke server: " + err.message, "error");
    }
    return;
  }

  btn.disabled = false;
  btn.textContent = "Masuk";
  if (pass !== "admin2026") {
    showToast("Kata sandi pratinjau salah (gunakan: admin2026).", "error");
    return;
  }
  adminPasswordCache = pass;
  try {
    adminSubmissions = JSON.parse(localStorage.getItem(STORAGE_KEY_LOCAL_DB) || "[]");
  } catch (err) {
    adminSubmissions = [];
  }
  syncSettingsCheckboxes();
  switchView("view-admin");
  renderAdminTables();
}

async function loadAdminData() {
  if (APPS_SCRIPT_URL && adminPasswordCache) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "adminGetDashboard", password: adminPasswordCache })
      });
      const data = await res.json();
      if (data.ok) {
        adminSubmissions = data.submissions || [];
        if (data.adminKeys) adminKeysMap = data.adminKeys;
        if (Array.isArray(data.questions) && data.questions.length > 0) QUESTIONS_BANK = data.questions;
        if (data.config) {
          appConfig = { ...appConfig, ...data.config };
          syncSettingsCheckboxes();
        }
      }
    } catch (e) {}
  }
  renderAdminTables();
}

function syncSettingsCheckboxes() {
  document.getElementById("cfg-isOpen").checked = !!appConfig.isOpen;
  document.getElementById("cfg-duration").value = appConfig.durationMinutes || 90;
  document.getElementById("cfg-requireToken").checked = !!appConfig.requireToken;
  document.getElementById("cfg-sessionToken").value = appConfig.sessionToken || "";
  document.getElementById("cfg-pgkPartial").checked = appConfig.pgkPartialScore !== false;
  document.getElementById("cfg-showExplanation").checked = !!appConfig.showExplanation;
  document.getElementById("cfg-oneAttempt").checked = !!appConfig.oneAttempt;
  document.getElementById("cfg-shuffleQ").checked = !!appConfig.shuffleQuestions;
  document.getElementById("cfg-shuffleOpt").checked = !!appConfig.shuffleOptions;
}

async function saveAdminSettings() {
  const tokenClean = document.getElementById("cfg-sessionToken").value.trim().toUpperCase();
  const reqTokenChecked = document.getElementById("cfg-requireToken").checked;
  if (reqTokenChecked && !tokenClean) {
    showToast("Isi kode Token Sesi terlebih dahulu jika Wajib Token Sesi dicentang.", "warning");
    return;
  }
  const updated = {
    isOpen: document.getElementById("cfg-isOpen").checked,
    durationMinutes: Math.max(5, parseInt(document.getElementById("cfg-duration").value || "90", 10)),
    sessionToken: tokenClean,
    requireToken: reqTokenChecked && tokenClean !== "",
    pgkPartialScore: document.getElementById("cfg-pgkPartial").checked,
    showExplanation: document.getElementById("cfg-showExplanation").checked,
    oneAttempt: document.getElementById("cfg-oneAttempt").checked,
    shuffleQuestions: document.getElementById("cfg-shuffleQ").checked,
    shuffleOptions: document.getElementById("cfg-shuffleOpt").checked
  };
  appConfig = updated;
  localStorage.setItem(STORAGE_KEY_LOCAL_CFG, JSON.stringify(appConfig));
  applyConfigToUI();

  if (APPS_SCRIPT_URL && adminPasswordCache) {
    const btn = document.getElementById("btn-save-settings");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
    }
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "adminSaveConfig",
          password: adminPasswordCache,
          config: appConfig
        })
      });
      const data = await res.json();
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Simpan Pengaturan";
      }
      if (data.ok) {
        if (data.config) {
          appConfig = { ...appConfig, ...data.config };
          localStorage.setItem(STORAGE_KEY_LOCAL_CFG, JSON.stringify(appConfig));
          syncSettingsCheckboxes();
          applyConfigToUI();
        }
        const tokInfo = appConfig.sessionToken
          ? `Token aktif tersimpan: "${appConfig.sessionToken}"`
          : "Mode tanpa token (bebas masuk)";
        showToast(`Pengaturan tersimpan di Google Sheets! ${tokInfo}.`, "success");
        return;
      } else {
        showToast(data.message || "Gagal menyimpan pengaturan ke server.", "error");
        return;
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Simpan Pengaturan";
      }
      showToast("Gagal menyimpan pengaturan ke server: " + err.message, "error");
      return;
    }
  }
  showToast("Pengaturan disimpan pada mode pratinjau.", "success");
}

function switchAdminTab(tabName) {
  ["siswa", "anates", "materi", "kelas", "soal"].forEach((t) => {
    document.getElementById("admin-tab-" + t).classList.toggle("hidden", t !== tabName);
    const btn = document.getElementById("tab-btn-" + t);
    if (t === tabName) {
      btn.className = "px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm";
    } else {
      btn.className = "px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-sm";
    }
  });
}

// =========================================================================
// DATA UJI SIMULASI ADMIN (TERSIMPAN KE GOOGLE SHEETS)
// =========================================================================
async function loadTenSampleStudents() {
  if (APPS_SCRIPT_URL && adminPasswordCache) {
    const btn = document.getElementById("btn-load-sample");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Menyimpan Data Uji...";
    }
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "adminSeedSampleData",
          password: adminPasswordCache
        })
      });
      const data = await res.json();
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Muat 10 Data Uji";
      }
      if (!data.ok) {
        showToast(data.message || "Gagal menyimpan 10 data uji ke Google Sheets.", "error");
        return;
      }
      await loadAdminData();
      showToast("10 data uji berhasil disimpan ke Google Sheets & sheet analisis ANATES diperbarui!", "success");
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Muat 10 Data Uji";
      }
      showToast("Kesalahan koneksi saat menyimpan data uji: " + err.message, "error");
    }
    return;
  }

  const sampleNames = [
    ["[UJI] Alya Putri Ramadhani", "1", "IX A"],
    ["[UJI] Bagas Pratama Wijaya", "4", "IX A"],
    ["[UJI] Citra Kirana Dewi", "7", "IX B"],
    ["[UJI] Dimas Aditya Nugroho", "12", "IX B"],
    ["[UJI] Eka Sari Wulandari", "15", "IX C"],
    ["[UJI] Fajar Ramadhan", "19", "IX D"],
    ["[UJI] Gita Permata Sari", "22", "IX E"],
    ["[UJI] Hendra Kusuma", "25", "IX F"],
    ["[UJI] Indah Lestari", "30", "IX G"],
    ["[UJI] Joko Susilo", "34", "IX G"]
  ];
  const targetScores = [94, 88, 82, 74, 68, 62, 54, 46, 38, 24];
  const generated = sampleNames.map((info, idx) => {
    const answers = {};
    const itemScores = {};
    let acc = 0;
    const target = targetScores[idx];
    QUESTIONS_BANK.forEach((q) => {
      const isCorrect = q.no === 4 ? idx < 2 : acc + q.weight <= target;
      if (isCorrect) {
        answers[q.no] = q.type === "PG" ? "A" : q.type === "PGK" ? "A,C" : q.type === "BS" ? "Benar" : "Contoh Benar";
        itemScores[q.no] = q.weight;
        acc += q.weight;
      } else {
        answers[q.no] = q.type === "PG" || q.type === "PGK" ? (idx % 2 === 0 ? "B" : "C") : q.type === "BS" ? "Salah" : "-";
        itemScores[q.no] = 0;
      }
    });
    return {
      nama: info[0],
      absen: info[1],
      kelas: info[2],
      tabSwitches: idx === 7 ? 2 : 0,
      answers,
      itemScores,
      totalScore: acc,
      submittedAt: new Date(Date.now() - idx * 60000).toISOString()
    };
  });
  adminSubmissions = generated;
  localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(generated));
  renderAdminTables();
  showToast("10 data uji dimuat pada mode pratinjau lokal.", "success");
}

function clearSampleStudents() {
  openConfirmDialog(
    "Hapus Semua Data Uji ([UJI])?",
    "Seluruh baris peserta uji coba bertanda [UJI] akan dihapus dari Google Sheets dan tabel analisis akan dihitung ulang. Data siswa asli tidak akan terhapus.",
    async () => {
      if (APPS_SCRIPT_URL && adminPasswordCache) {
        try {
          const res = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "adminClearSampleData",
              password: adminPasswordCache
            })
          });
          const data = await res.json();
          if (!data.ok) {
            showToast(data.message || "Gagal menghapus data uji.", "error");
            return;
          }
          await loadAdminData();
          showToast(data.message || "Data uji berhasil dibersihkan dari Google Sheets.", "success");
        } catch (err) {
          showToast("Kesalahan koneksi: " + err.message, "error");
        }
        return;
      }

      adminSubmissions = adminSubmissions.filter((s) => !String(s.nama || "").startsWith("[UJI]"));
      localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(adminSubmissions));
      renderAdminTables();
      showToast("Data uji dihapus dari pratinjau lokal.", "success");
    }
  );
}

// =========================================================================
// FITUR I: INISIALISASI BANK SOAL KE GOOGLE SHEETS
// =========================================================================
async function initBankSoalSheet() {
  if (!APPS_SCRIPT_URL || !adminPasswordCache) {
    showToast("Hubungkan Google Apps Script terlebih dahulu untuk membuat tab Bank Soal di Google Sheets.", "warning");
    return;
  }
  openConfirmDialog(
    "Inisialisasi Sheet 'Bank Soal'?",
    "Sistem akan membuat tab 'Bank Soal' di Google Sheets Anda dan mengisinya dengan 35 soal Informatika IX beserta kunci jawabannya agar mudah diedit langsung dari spreadsheet. Lanjutkan?",
    async () => {
      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "adminInitBankSoal",
            password: adminPasswordCache
          })
        });
        const data = await res.json();
        if (data.ok) {
          showToast(data.message || "Sheet 'Bank Soal' berhasil dibuat di Google Sheets!", "success");
          await loadAdminData();
        } else {
          showToast(data.message || "Gagal menginisialisasi sheet Bank Soal.", "error");
        }
      } catch (err) {
        showToast("Kesalahan koneksi: " + err.message, "error");
      }
    }
  );
}

// =========================================================================
// KOREKSI MANUAL ISIAN/URAIAN & HAPUS PESERTA (ADMIN)
// =========================================================================
function openGradingModal(origIdx) {
  const sub = adminSubmissions[origIdx];
  if (!sub) return;
  activeGradingSubmission = { origIdx, sub };

  document.getElementById("grading-student-title").textContent = "Koreksi: " + sub.nama;
  document.getElementById("grading-student-meta").textContent = `Kelas ${sub.kelas} • No. Absen ${sub.absen} • Nilai Saat Ini: ${sub.totalScore}`;

  const listEl = document.getElementById("grading-items-list");
  const manualItems = QUESTIONS_BANK.filter((q) => q.type === "ISIAN" || q.type === "URAIAN");

  listEl.innerHTML = manualItems
    .map((q) => {
      const ans = (sub.answers && sub.answers[q.no]) || "(Tidak dijawab)";
      const curScore = Number((sub.itemScores && sub.itemScores[q.no]) || 0);
      const keyText = adminKeysMap[q.no] ? String(adminKeysMap[q.no]) : "-";
      const plainQ = q.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-extrabold text-indigo-700">Soal No. ${q.no} (${q.type} • Maks ${q.weight} poin)</span>
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-700">Skor:</label>
            <input type="number" data-qno="${q.no}" min="0" max="${q.weight}" step="0.5" value="${curScore}" class="manual-score-input w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-extrabold text-center text-sm" />
          </div>
        </div>
        <div class="text-xs text-slate-600">${escapeHtml(plainQ)}</div>
        <div class="p-3 rounded-lg bg-white border border-slate-200 text-xs">
          <div class="text-slate-500 font-semibold">Jawaban Siswa:</div>
          <div class="text-slate-900 font-bold mt-0.5 whitespace-pre-wrap">${escapeHtml(String(ans))}</div>
        </div>
        <div class="text-xs text-emerald-700 font-semibold">Acuan Kunci: ${escapeHtml(keyText)}</div>
      </div>`;
    })
    .join("");

  const modal = document.getElementById("grading-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeGradingModal() {
  const modal = document.getElementById("grading-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  activeGradingSubmission = null;
}

async function saveManualGrading() {
  if (!activeGradingSubmission) return;
  const { origIdx, sub } = activeGradingSubmission;
  const updatedScores = { ...(sub.itemScores || {}) };

  document.querySelectorAll("#grading-items-list .manual-score-input").forEach((inp) => {
    const qNo = Number(inp.getAttribute("data-qno"));
    const maxW = Number(inp.getAttribute("max") || 6);
    const val = Math.max(0, Math.min(maxW, Number(inp.value || 0)));
    updatedScores[qNo] = val;
  });

  let newTotal = 0;
  QUESTIONS_BANK.forEach((q) => {
    newTotal += Number(updatedScores[q.no] || 0);
  });
  newTotal = Math.round(newTotal * 100) / 100;

  if (APPS_SCRIPT_URL && adminPasswordCache) {
    const btn = document.getElementById("btn-save-grading");
    btn.disabled = true;
    btn.textContent = "Menyimpan...";
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "adminUpdateScores",
          password: adminPasswordCache,
          rowNumber: sub.rowNumber,
          submittedAt: sub.submittedAt,
          nama: sub.nama,
          itemScores: updatedScores
        })
      });
      const data = await res.json();
      btn.disabled = false;
      btn.textContent = "Simpan Koreksi";
      if (!data.ok) {
        showToast(data.message || "Gagal menyimpan hasil koreksi.", "error");
        return;
      }
      closeGradingModal();
      await loadAdminData();
      showToast(`Koreksi berhasil disimpan! Nilai baru ${sub.nama}: ${data.totalScore}`, "success");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Simpan Koreksi";
      showToast("Kesalahan koneksi: " + err.message, "error");
    }
    return;
  }

  adminSubmissions[origIdx].itemScores = updatedScores;
  adminSubmissions[origIdx].totalScore = newTotal;
  localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(adminSubmissions));
  closeGradingModal();
  renderAdminTables();
  showToast(`Koreksi disimpan pada mode pratinjau. Nilai baru: ${newTotal}`, "success");
}

function askDeleteSubmission(origIdx) {
  const sub = adminSubmissions[origIdx];
  if (!sub) return;
  openConfirmDialog(
    "Hapus Data & Izinkan Ulang?",
    `Data hasil milik ${sub.nama} (Kelas ${sub.kelas}, Absen ${sub.absen}) akan dihapus dari database sehingga siswa tersebut dapat mengerjakan ulang. Lanjutkan?`,
    async () => {
      if (APPS_SCRIPT_URL && adminPasswordCache) {
        try {
          const res = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              action: "adminDeleteSubmission",
              password: adminPasswordCache,
              rowNumber: sub.rowNumber,
              submittedAt: sub.submittedAt,
              nama: sub.nama
            })
          });
          const data = await res.json();
          if (!data.ok) {
            showToast(data.message || "Gagal menghapus data siswa.", "error");
            return;
          }
          await loadAdminData();
          showToast(`Data ${sub.nama} berhasil dihapus.`, "success");
        } catch (err) {
          showToast("Kesalahan koneksi: " + err.message, "error");
        }
        return;
      }

      adminSubmissions.splice(origIdx, 1);
      localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(adminSubmissions));
      renderAdminTables();
      showToast(`Data ${sub.nama} dihapus dari pratinjau lokal.`, "success");
    }
  );
}

// =========================================================================
// PERHITUNGAN PSIKOMETRI ALA ANATES & PENGUASAAN PER TOPIK
// =========================================================================
function computePsychometrics(rows) {
  const N = rows.length;
  if (N === 0) {
    return { mean: 0, sd: 0, max: 0, min: 0, kr20: 0, items: [], classRecap: [], topicRecap: [] };
  }

  const totals = rows.map((r) => Number(r.totalScore || 0));
  const mean = totals.reduce((a, b) => a + b, 0) / N;
  const variance = totals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / N;
  const sd = Math.sqrt(variance);
  const max = Math.max(...totals);
  const min = Math.min(...totals);

  const sorted = [...rows].sort((a, b) => Number(b.totalScore) - Number(a.totalScore));
  const kGroup = Math.max(1, Math.round(0.27 * N));
  const upperGroup = sorted.slice(0, kGroup);
  const lowerGroup = sorted.slice(N - kGroup);

  let sumPQ = 0;

  const items = QUESTIONS_BANK.map((q) => {
    const maxW = q.weight;
    let sumItemScore = 0;
    let countFullCorrect = 0;
    const optionCounts = { A: 0, B: 0, C: 0, D: 0 };

    rows.forEach((r) => {
      const sc = Number((r.itemScores && r.itemScores[q.no]) || 0);
      sumItemScore += sc;
      if (sc >= maxW) countFullCorrect++;

      if (q.type === "PG" || q.type === "PGK") {
        String((r.answers && r.answers[q.no]) || "")
          .toUpperCase()
          .split(",")
          .map((s) => s.trim())
          .forEach((ans) => {
            if (optionCounts[ans] !== undefined) optionCounts[ans]++;
          });
      }
    });

    const P = sumItemScore / (N * maxW);
    let pCat = "Sedang";
    if (P > 0.7) pCat = "Mudah";
    else if (P < 0.3) pCat = "Sukar";

    const upperMean =
      upperGroup.reduce((acc, r) => acc + Number((r.itemScores && r.itemScores[q.no]) || 0), 0) /
      (kGroup * maxW);
    const lowerMean =
      lowerGroup.reduce((acc, r) => acc + Number((r.itemScores && r.itemScores[q.no]) || 0), 0) /
      (kGroup * maxW);
    const D = upperMean - lowerMean;

    let dCat = "Jelek";
    if (D >= 0.4) dCat = "Sangat Baik";
    else if (D >= 0.3) dCat = "Baik";
    else if (D >= 0.2) dCat = "Cukup";

    let rPbis = 0;
    if (sd > 0) {
      const meanItem = sumItemScore / N;
      let cov = 0;
      let varItem = 0;
      rows.forEach((r) => {
        const xi = Number((r.itemScores && r.itemScores[q.no]) || 0);
        const yt = Number(r.totalScore || 0);
        cov += (xi - meanItem) * (yt - mean);
        varItem += Math.pow(xi - meanItem, 2);
      });
      const sdItem = Math.sqrt(varItem / N);
      if (sdItem > 0) rPbis = cov / (N * sdItem * sd);
    }

    const pProp = countFullCorrect / N;
    sumPQ += pProp * (1 - pProp);

    let distractorSummary = "-";
    let hasBadDistractor = false;
    if (q.type === "PG" || q.type === "PGK") {
      const keyRaw = adminKeysMap[q.no] || "";
      const keyArr = Array.isArray(keyRaw) ? keyRaw : String(keyRaw).split(",").map((s) => s.trim());
      const parts = ["A", "B", "C", "D"].map((opt) => {
        const cnt = optionCounts[opt];
        const pct = Math.round((cnt / N) * 100);
        if (keyRaw && keyArr.includes(opt)) return `${opt}*:${cnt}(${pct}%)`;
        const active = pct >= 5 && cnt >= 1;
        if (!active) hasBadDistractor = true;
        return `${opt}:${cnt}(${pct}%${active ? "" : "!"})`;
      });
      distractorSummary = parts.join(" ");
    }

    let rec = "Dipakai";
    if (D < 0.2) rec = "Buang / Ganti";
    else if (D < 0.3 || P > 0.85 || P < 0.2 || hasBadDistractor) rec = "Revisi";

    return {
      no: q.no,
      type: q.type,
      topic: q.topic || "Umum",
      countCorrect: countFullCorrect,
      P,
      pCat,
      D,
      dCat,
      rPbis,
      optionCounts,
      distractorSummary,
      rec
    };
  });

  const k = QUESTIONS_BANK.length;
  const kr20 = variance > 0 && k > 1 ? (k / (k - 1)) * (1 - sumPQ / variance) : 0;

  const topicMap = {};
  QUESTIONS_BANK.forEach((q) => {
    const t = q.topic || "Umum";
    if (!topicMap[t]) topicMap[t] = { topic: t, qNos: [], maxWeight: 0, totalEarnedAllStudents: 0 };
    topicMap[t].qNos.push(q.no);
    topicMap[t].maxWeight += q.weight;
    rows.forEach((r) => {
      topicMap[t].totalEarnedAllStudents += Number((r.itemScores && r.itemScores[q.no]) || 0);
    });
  });

  const topicRecap = Object.values(topicMap).map((tm) => {
    const avgPct = tm.maxWeight > 0 ? (tm.totalEarnedAllStudents / (N * tm.maxWeight)) * 100 : 0;
    return {
      topic: tm.topic,
      qNos: tm.qNos.join(", "),
      maxWeight: tm.maxWeight,
      avgPct
    };
  });

  const classes = ["IX A", "IX B", "IX C", "IX D", "IX E", "IX F", "IX G"];
  const classRecap = classes.map((cls) => {
    const sub = rows.filter((r) => r.kelas === cls);
    if (sub.length === 0) return { kelas: cls, count: 0, mean: 0, max: 0, min: 0 };
    const sc = sub.map((s) => Number(s.totalScore || 0));
    return {
      kelas: cls,
      count: sub.length,
      mean: sc.reduce((a, b) => a + b, 0) / sub.length,
      max: Math.max(...sc),
      min: Math.min(...sc)
    };
  });

  return { mean, sd, max, min, kr20, items, classRecap, topicRecap };
}

function renderAdminTables() {
  const filterCls = document.getElementById("admin-class-filter").value;
  const indexedSubmissions = adminSubmissions.map((s, origIdx) => ({ ...s, _origIdx: origIdx }));
  const filtered =
    filterCls === "ALL"
      ? indexedSubmissions
      : indexedSubmissions.filter((s) => s.kelas === filterCls);

  const stats = computePsychometrics(filtered);

  document.getElementById("stat-count").textContent = filtered.length;
  document.getElementById("stat-mean").textContent = stats.mean.toFixed(2);
  document.getElementById("stat-max").textContent = stats.max;
  document.getElementById("stat-min").textContent = stats.min;
  document.getElementById("stat-kr20").textContent = stats.kr20.toFixed(2);

  // 1. Tabel Hasil Siswa
  const tbodySiswa = document.getElementById("tbody-hasil-siswa");
  if (filtered.length === 0) {
    tbodySiswa.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">Belum ada data peserta. Klik "Muat 10 Data Uji" untuk melihat contoh analisis.</td></tr>`;
  } else {
    tbodySiswa.innerHTML = filtered
      .map((s, i) => {
        const sw = Number(s.tabSwitches || 0);
        const swBadge =
          sw > 0
            ? `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">${sw}x keluar</span>`
            : `<span class="text-xs text-slate-400">0x</span>`;
        return `
        <tr class="hover:bg-slate-50">
          <td class="p-3.5 font-semibold">${i + 1}</td>
          <td class="p-3.5 font-bold text-slate-900">${escapeHtml(s.nama)}</td>
          <td class="p-3.5">${escapeHtml(String(s.absen))}</td>
          <td class="p-3.5"><span class="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-xs">${escapeHtml(s.kelas)}</span></td>
          <td class="p-3.5">${swBadge}</td>
          <td class="p-3.5 font-extrabold text-indigo-700">${s.totalScore}</td>
          <td class="p-3.5 text-xs text-slate-500">${new Date(s.submittedAt).toLocaleString("id-ID")}</td>
          <td class="p-3.5 text-right whitespace-nowrap space-x-1.5">
            <button type="button" onclick="openGradingModal(${s._origIdx})" class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200">
              Koreksi
            </button>
            <button type="button" onclick="askDeleteSubmission(${s._origIdx})" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200">
              Hapus
            </button>
          </td>
        </tr>`;
      })
      .join("");
  }

  // 2. Tabel Analisis Butir ANATES
  const tbodyAnates = document.getElementById("tbody-anates");
  if (filtered.length === 0) {
    tbodyAnates.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">Data analisis akan muncul setelah ada peserta.</td></tr>`;
  } else {
    tbodyAnates.innerHTML = stats.items
      .map((it) => {
        const recColor =
          it.rec === "Dipakai"
            ? "bg-emerald-100 text-emerald-800"
            : it.rec === "Revisi"
            ? "bg-amber-100 text-amber-800"
            : "bg-rose-100 text-rose-800";
        return `
        <tr class="hover:bg-slate-50">
          <td class="p-3 font-extrabold">${it.no}</td>
          <td class="p-3 text-xs font-bold">${it.type}</td>
          <td class="p-3 text-xs text-slate-600">${escapeHtml(it.topic)}</td>
          <td class="p-3"><strong>${it.P.toFixed(2)}</strong> <span class="text-xs text-slate-500">(${it.pCat})</span></td>
          <td class="p-3"><strong>${it.D.toFixed(2)}</strong> <span class="text-xs text-slate-500">(${it.dCat})</span></td>
          <td class="p-3 font-semibold">${it.rPbis.toFixed(2)}</td>
          <td class="p-3 text-xs font-mono">${escapeHtml(it.distractorSummary)}</td>
          <td class="p-3"><span class="px-2.5 py-1 rounded-lg text-xs font-extrabold ${recColor}">${it.rec}</span></td>
        </tr>`;
      })
      .join("");
  }

  // 3. Tabel Penguasaan per Topik Materi
  const tbodyMateri = document.getElementById("tbody-rekap-materi");
  if (filtered.length === 0) {
    tbodyMateri.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada data peserta.</td></tr>`;
  } else {
    tbodyMateri.innerHTML = stats.topicRecap
      .map((tm) => {
        const statusBadge =
          tm.avgPct >= 75
            ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">Tuntas Baik</span>`
            : tm.avgPct >= 55
            ? `<span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">Perlu Penguatan</span>`
            : `<span class="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">Prioritas Remedial</span>`;
        return `
        <tr class="hover:bg-slate-50">
          <td class="p-3.5 font-extrabold text-slate-900">${escapeHtml(tm.topic)}</td>
          <td class="p-3.5 text-xs text-slate-600">${escapeHtml(tm.qNos)}</td>
          <td class="p-3.5 font-semibold">${tm.maxWeight} poin</td>
          <td class="p-3.5 font-extrabold text-indigo-700">${tm.avgPct.toFixed(1)}%</td>
          <td class="p-3.5">${statusBadge}</td>
        </tr>`;
      })
      .join("");
  }

  // 4. Tabel Rekap per Kelas
  const tbodyKelas = document.getElementById("tbody-rekap-kelas");
  tbodyKelas.innerHTML = stats.classRecap
    .map(
      (c) => `
    <tr class="hover:bg-slate-50">
      <td class="p-3.5 font-extrabold">${c.kelas}</td>
      <td class="p-3.5">${c.count} siswa</td>
      <td class="p-3.5 font-bold text-indigo-700">${c.count ? c.mean.toFixed(2) : "-"}</td>
      <td class="p-3.5">${c.count ? c.max : "-"}</td>
      <td class="p-3.5">${c.count ? c.min : "-"}</td>
    </tr>`
    )
    .join("");

  // 5. Tabel Ringkasan Bank Soal
  const tbodySoal = document.getElementById("tbody-bank-soal");
  tbodySoal.innerHTML = QUESTIONS_BANK.map((q) => {
    const plain = q.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const keyDisp = adminKeysMap[q.no]
      ? Array.isArray(adminKeysMap[q.no])
        ? adminKeysMap[q.no].join(", ")
        : String(adminKeysMap[q.no])
      : "(Di server Code.gs)";
    return `
    <tr class="hover:bg-slate-50">
      <td class="p-3 font-extrabold">${q.no}</td>
      <td class="p-3 text-xs font-bold">${q.type}</td>
      <td class="p-3 text-xs text-slate-600">${escapeHtml(q.topic || "-")}</td>
      <td class="p-3 font-semibold">${q.weight}</td>
      <td class="p-3 text-xs text-slate-700 max-w-md truncate">${escapeHtml(plain)}</td>
      <td class="p-3 text-xs font-bold text-emerald-700">${escapeHtml(keyDisp)}</td>
    </tr>`;
  }).join("");
}

// =========================================================================
// EKSPOR SPREADSHEET (.XLSX) 5 SHEET
// =========================================================================
function downloadExcelWorkbook() {
  if (adminSubmissions.length === 0) {
    showToast("Belum ada data siswa untuk diunduh.", "warning");
    return;
  }
  const stats = computePsychometrics(adminSubmissions);
  const wb = XLSX.utils.book_new();

  const header1 = ["No", "Nama Lengkap", "No Absen", "Kelas", "Pindah Layar", "Nilai (0-100)", "Waktu Kirim"];
  QUESTIONS_BANK.forEach((q) => header1.push(`Jwb_${q.no}`, `Skor_${q.no}`));
  const rows1 = [header1];
  adminSubmissions.forEach((s, idx) => {
    const r = [idx + 1, s.nama, s.absen, s.kelas, Number(s.tabSwitches || 0), s.totalScore, s.submittedAt];
    QUESTIONS_BANK.forEach((q) => {
      r.push((s.answers && s.answers[q.no]) || "", Number((s.itemScores && s.itemScores[q.no]) || 0));
    });
    rows1.push(r);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows1), "Hasil Siswa");

  const rows2 = [
    ["ANALISIS BUTIR SOAL (METODE ANATES) — PRA-ASAS INFORMATIKA KELAS IX"],
    ["Rumus Tingkat Kesukaran (P) = Skor Diperoleh / (N x Skor Maks) | Kategori: >0,70 Mudah; 0,30-0,70 Sedang; <0,30 Sukar"],
    ["Rumus Daya Pembeda (D) = Rata-rata 27% Atas - Rata-rata 27% Bawah | Kategori: >=0,40 Sangat Baik; 0,30-0,39 Baik; 0,20-0,29 Cukup; <0,20 Jelek"],
    [],
    ["No Butir", "Tipe", "Topik Materi", "Jumlah Benar Penuh", "Tingkat Kesukaran (P)", "Kategori P", "Daya Pembeda (D)", "Kategori D", "Korelasi Point-Biserial", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Status Pengecoh", "Rekomendasi"]
  ];
  stats.items.forEach((it) => {
    rows2.push([
      it.no,
      it.type,
      it.topic,
      it.countCorrect,
      Number(it.P.toFixed(3)),
      it.pCat,
      Number(it.D.toFixed(3)),
      it.dCat,
      Number(it.rPbis.toFixed(3)),
      it.type === "PG" || it.type === "PGK" ? it.optionCounts.A : "-",
      it.type === "PG" || it.type === "PGK" ? it.optionCounts.B : "-",
      it.type === "PG" || it.type === "PGK" ? it.optionCounts.C : "-",
      it.type === "PG" || it.type === "PGK" ? it.optionCounts.D : "-",
      it.distractorSummary,
      it.rec
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows2), "Analisis Butir ANATES");

  const rows3 = [["Topik Materi", "Nomor Butir", "Bobot Maksimal", "Rata-rata Penguasaan (%)"]];
  stats.topicRecap.forEach((tm) => {
    rows3.push([tm.topic, tm.qNos, tm.maxWeight, Number(tm.avgPct.toFixed(2))]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows3), "Rekap per Materi");

  const rows4 = [
    ["STATISTIK TES KESELURUHAN"],
    ["Jumlah Peserta (N)", adminSubmissions.length],
    ["Jumlah Butir Soal (k)", QUESTIONS_BANK.length],
    ["Rata-rata Nilai", Number(stats.mean.toFixed(2))],
    ["Simpangan Baku (SD)", Number(stats.sd.toFixed(2))],
    ["Nilai Tertinggi", stats.max],
    ["Nilai Terendah", stats.min],
    ["Reliabilitas Tes (KR-20)", Number(stats.kr20.toFixed(3))],
    ["Interpretasi KR-20", stats.kr20 >= 0.7 ? "Reliabel (Tinggi)" : "Perlu Peningkatan Reliabilitas"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows4), "Statistik Tes");

  const rows5 = [["Kelas", "Jumlah Peserta", "Rata-rata Nilai", "Nilai Tertinggi", "Nilai Terendah"]];
  stats.classRecap.forEach((c) => {
    rows5.push([c.kelas, c.count, Number(c.mean.toFixed(2)), c.max, c.min]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows5), "Rekap per Kelas");

  XLSX.writeFile(wb, "Hasil_dan_Analisis_ANATES_PraASAS_Informatika9.xlsx");
  showToast("File Excel (.xlsx) 5 sheet berhasil diunduh.", "success");
}

// =========================================================================
// UTILITAS UI
// =========================================================================
function switchView(id) {
  ["view-login", "view-exam", "view-result", "view-admin-login", "view-admin"].forEach((v) => {
    document.getElementById(v).classList.toggle("hidden", v !== id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  switchView("view-login");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message, type = "info") {
  const box = document.getElementById("toast-box");
  const el = document.createElement("div");
  const colors = {
    info: "bg-slate-900 text-white",
    success: "bg-emerald-700 text-white",
    warning: "bg-amber-600 text-white",
    error: "bg-rose-700 text-white"
  };
  el.className = `${colors[type] || colors.info} px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm font-semibold pointer-events-auto`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function openConfirmDialog(title, desc, onConfirm) {
  const dlg = document.getElementById("confirm-dialog");
  document.getElementById("dialog-title").textContent = title;
  document.getElementById("dialog-desc").textContent = desc;
  dlg.classList.remove("hidden");
  dlg.classList.add("flex");

  const close = () => {
    dlg.classList.add("hidden");
    dlg.classList.remove("flex");
  };
  document.getElementById("dialog-cancel").onclick = close;
  document.getElementById("dialog-ok").onclick = () => {
    close();
    onConfirm();
  };
}
