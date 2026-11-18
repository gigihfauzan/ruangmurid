// =========================================================================
// KONFIGURASI UTAMA (TEMPEL URL WEB APP GOOGLE APPS SCRIPT DI BAWAH INI)
// =========================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwL3IcE8NeUXYDyKbW686tQexl0YVCirEABoyCreojDEg_F2tb_ef1mnAZFWZP-qpxLXA/exec"; // <-- Ganti dengan URL https://script.google.com/macros/s/.../exec setelah deploy

// =========================================================================
// PETA GAMBAR VEKTOR (SVG) UNTUK SOAL BERGAMBAR
// =========================================================================
const SVG_DIAGRAMS = {
  SVG_2: `<svg viewBox="0 0 260 115" class="w-60 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
            <rect x="25" y="18" width="210" height="78" fill="#eff6ff" stroke="#1e293b" stroke-width="2.5"/>
            <text x="130" y="63" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">L = 1 cm²</text>
          </svg>`,
  SVG_8: `<svg viewBox="0 0 280 165" class="w-64 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
            <polygon points="35,135 245,135 105,28" fill="#f8fafc" stroke="#0f172a" stroke-width="2.2"/>
            <line x1="105" y1="28" x2="105" y2="135" stroke="#0f172a" stroke-width="2.2"/>
            <path d="M 55,135 A 20,20 0 0,0 48,120" fill="none" stroke="#2563eb" stroke-width="1.8"/>
            <path d="M 218,135 A 26,26 0 0,1 225,119" fill="none" stroke="#2563eb" stroke-width="1.8"/>
            <text x="105" y="20" text-anchor="middle" font-size="14" font-weight="bold">A</text>
            <text x="24" y="142" text-anchor="middle" font-size="14" font-weight="bold">B</text>
            <text x="105" y="153" text-anchor="middle" font-size="14" font-weight="bold">D</text>
            <text x="256" y="142" text-anchor="middle" font-size="14" font-weight="bold">C</text>
            <text x="68" y="127" font-size="12" font-weight="bold" fill="#1d4ed8">60°</text>
            <text x="193" y="128" font-size="12" font-weight="bold" fill="#1d4ed8">45°</text>
          </svg>`,
  SVG_14: `<svg viewBox="0 0 220 175" class="w-52 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
             <polygon points="40,25 40,145 185,145" fill="#f8fafc" stroke="#0f172a" stroke-width="2.4"/>
             <polyline points="40,130 55,130 55,145" fill="none" stroke="#0f172a" stroke-width="2"/>
             <text x="40" y="18" text-anchor="middle" font-size="14" font-weight="bold">C</text>
             <text x="28" y="152" text-anchor="middle" font-size="14" font-weight="bold">A</text>
             <text x="196" y="152" text-anchor="middle" font-size="14" font-weight="bold">B</text>
           </svg>`,
  SVG_18: `<svg viewBox="0 0 230 175" class="w-56 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
             <polygon points="45,25 45,140 175,140" fill="#f8fafc" stroke="#0f172a" stroke-width="2.4"/>
             <polyline points="45,126 59,126 59,140" fill="none" stroke="#0f172a" stroke-width="2"/>
             <path d="M 145,140 A 30,30 0 0,1 153,120" fill="none" stroke="#2563eb" stroke-width="1.8"/>
             <text x="45" y="18" text-anchor="middle" font-size="14" font-weight="bold">C</text>
             <text x="32" y="147" text-anchor="middle" font-size="14" font-weight="bold">A</text>
             <text x="187" y="147" text-anchor="middle" font-size="14" font-weight="bold">B</text>
             <text x="122" y="133" font-size="12" font-weight="bold" fill="#1d4ed8">45°</text>
             <text x="110" y="160" text-anchor="middle" font-size="13" font-weight="bold">12 cm</text>
           </svg>`,
  SVG_27: `<svg viewBox="0 0 340 175" class="w-80 mx-auto my-2 bg-white border border-slate-200 rounded-xl p-2">
             <line x1="15" y1="145" x2="325" y2="145" stroke="#0f172a" stroke-width="2.5"/>
             <rect x="275" y="42" width="24" height="103" fill="#e2e8f0" stroke="#334155" stroke-width="1.8"/>
             <rect x="279" y="26" width="16" height="16" fill="#94a3b8" stroke="#334155" stroke-width="1.8"/>
             <line x1="287" y1="18" x2="287" y2="145" stroke="#0f172a" stroke-width="2"/>
             <polyline points="275,133 287,133 287,145" fill="none" stroke="#0f172a" stroke-width="1.8"/>
             <line x1="55" y1="145" x2="287" y2="26" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="5,4"/>
             <line x1="185" y1="145" x2="287" y2="26" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="5,4"/>
             <circle cx="55" cy="145" r="3.5" fill="#0f172a"/>
             <circle cx="185" cy="145" r="3.5" fill="#0f172a"/>
             <text x="287" y="13" text-anchor="middle" font-size="11" font-weight="bold">Pengamat (D)</text>
             <text x="55" y="162" text-anchor="middle" font-size="13" font-weight="bold">A</text>
             <text x="185" y="162" text-anchor="middle" font-size="13" font-weight="bold">B</text>
             <text x="287" y="162" text-anchor="middle" font-size="13" font-weight="bold">C</text>
             <text x="145" y="82" font-size="12" font-weight="bold" fill="#1d4ed8">20 m</text>
             <text x="215" y="96" font-size="12" font-weight="bold" fill="#1d4ed8">13 m</text>
             <text x="255" y="102" font-size="12" font-weight="bold">12 m</text>
           </svg>`
};

// =========================================================================
// BANK SOAL BAWAAN (TANPA KUNCI JAWABAN DI FRONTEND)
// Dapat otomatis digantikan oleh sheet 'Bank Soal' di Google Sheets bila diisi guru.
// =========================================================================
let QUESTIONS_BANK = [
  {
    no: 1,
    type: "PG",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Bentuk sederhana dari $(-3) \\times (-3) \\times (-3) \\times (-3)$ adalah ….",
    options: [
      { key: "A", label: "$(-3)^4$" },
      { key: "B", label: "$(-4)^3$" },
      { key: "C", label: "$-3^4$" },
      { key: "D", label: "$-4^3$" }
    ]
  },
  {
    no: 2,
    type: "PG",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Diberikan sebuah bangun persegi panjang sebagai berikut!<br/>Diketahui luas persegi panjang $1\\text{ cm}^2$. Jika lebar persegi panjang tersebut $3^{-2}\\text{ cm}$ maka panjangnya adalah ….",
    svgCode: "SVG_2",
    options: [
      { key: "A", label: "$3\\text{ cm}$" },
      { key: "B", label: "$6\\text{ cm}$" },
      { key: "C", label: "$8\\text{ cm}$" },
      { key: "D", label: "$9\\text{ cm}$" }
    ]
  },
  {
    no: 3,
    type: "PG",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Hasil dari operasi hitung bentuk akar $7\\sqrt{12} + \\sqrt{48} - 5\\sqrt{27}$ adalah ….",
    options: [
      { key: "A", label: "$\\sqrt{3}$" },
      { key: "B", label: "$2\\sqrt{3}$" },
      { key: "C", label: "$3\\sqrt{3}$" },
      { key: "D", label: "$4\\sqrt{3}$" }
    ]
  },
  {
    no: 4,
    type: "PG",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Hasil dari $\\sqrt{5} \\times 3\\sqrt{2} + 2\\sqrt{10}$ adalah ….",
    options: [
      { key: "A", label: "$3\\sqrt{10}$" },
      { key: "B", label: "$5\\sqrt{10}$" },
      { key: "C", label: "$9\\sqrt{14}$" },
      { key: "D", label: "$13\\sqrt{14}$" }
    ]
  },
  {
    no: 5,
    type: "PG",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-3">
             <div class="font-bold text-slate-900 mb-1">Perkembangan Ameba</div>
             <p>Ameba merupakan makhluk hidup kecil yang hanya dapat dilihat melalui alat seperti mikroskop. Salah satu jenis ameba adalah <em>Entamoeba gingivalis</em> yang memiliki ukuran $0{,}000012\\text{ m}$. Ameba berkembang biak dengan cara membelah diri menjadi $2$ sehingga jumlahnya menjadi dua kali lipat dari sebelumnya.</p>
           </div>
           Berdasarkan teks tersebut, penulisan ukuran ameba <em>Entamoeba gingivalis</em> dalam notasi ilmiah yang tepat adalah ….`,
    options: [
      { key: "A", label: "$1{,}2 \\times 10^4$" },
      { key: "B", label: "$1{,}2 \\times 10^5$" },
      { key: "C", label: "$1{,}2 \\times 10^{-4}$" },
      { key: "D", label: "$1{,}2 \\times 10^{-5}$" }
    ]
  },
  {
    no: 6,
    type: "PG",
    topic: "Teorema Pythagoras",
    weight: 2,
    text: "Di antara bilangan berikut, yang merupakan pasangan bilangan tripel Pythagoras adalah ….",
    options: [
      { key: "A", label: "$17, 15 \\text{ dan } 8$" },
      { key: "B", label: "$14, 8 \\text{ dan } 5$" },
      { key: "C", label: "$10, 7 \\text{ dan } 6$" },
      { key: "D", label: "$5, 4 \\text{ dan } 8$" }
    ]
  },
  {
    no: 7,
    type: "PG",
    topic: "Teorema Pythagoras",
    weight: 2,
    text: "Sebuah segitiga siku-siku memiliki ukuran alas $9\\text{ cm}$ dan tinggi $40\\text{ cm}$. Panjang sisi miring segitiga tersebut adalah ….",
    options: [
      { key: "A", label: "$36\\text{ cm}$" },
      { key: "B", label: "$41\\text{ cm}$" },
      { key: "C", label: "$45\\text{ cm}$" },
      { key: "D", label: "$54\\text{ cm}$" }
    ]
  },
  {
    no: 8,
    type: "PG",
    topic: "Teorema Pythagoras",
    weight: 2,
    text: "Perhatikan gambar berikut!<br/>Jika panjang $BD = 4\\text{ cm}$, panjang $AC$ adalah ….",
    svgCode: "SVG_8",
    options: [
      { key: "A", label: "$2\\sqrt{2}$" },
      { key: "B", label: "$2\\sqrt{3}$" },
      { key: "C", label: "$4\\sqrt{6}$" },
      { key: "D", label: "$8\\sqrt{6}$" }
    ]
  },
  {
    no: 9,
    type: "PG",
    topic: "PLSV & PtLSV",
    weight: 2,
    text: "Diberikan pernyataan “$21$ lebihnya dari $5a$ adalah $36$”. Pernyataan tersebut dapat ditulis ….",
    options: [
      { key: "A", label: "$5a + 21 = 36$" },
      { key: "B", label: "$5a + 36 = 21$" },
      { key: "C", label: "$21 + 36 = 5a$" },
      { key: "D", label: "$5a - 21 = 36$" }
    ]
  },
  {
    no: 10,
    type: "PG",
    topic: "PLSV & PtLSV",
    weight: 2,
    text: "Irfan mempunyai kelereng sebanyak $x$ buah, sedangkan Andi mempunyai kelereng sebanyak $3$ kurangnya dari kelereng Irfan. Jika banyak kelereng Andi adalah $18$ buah, kalimat matematika yang sesuai adalah ….",
    options: [
      { key: "A", label: "$x + 3 = 18$" },
      { key: "B", label: "$x - 3 = 18$" },
      { key: "C", label: "$x + 18 = 3$" },
      { key: "D", label: "$x = 18 - 3$" }
    ]
  },
  {
    no: 11,
    type: "PGK",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Berikut pangkat dengan sifat perkalian dan pembagian bilangan berpangkat yang tepat adalah ….",
    options: [
      { key: "A", label: "$2^3 \\times 2^2 \\times 2^6 = 2^{3 \\times 2 \\times 6} = 2^{36}$" },
      { key: "B", label: "$2^3 \\times 2^2 \\times 2^6 = 2^{3 + 2 + 6} = 2^{11}$" },
      { key: "C", label: "$2^3 : 2^2 : 2^6 = 2^{3 - 2 - 6} = 2^{-5}$" },
      { key: "D", label: "$2^3 : 2^2 : 2^6 = 2^{3 - 2 - 6} = 2^1$" }
    ]
  },
  {
    no: 12,
    type: "PGK",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Perkalian berulang yang dapat diubah menjadi bilangan berpangkat $3$ adalah ….",
    options: [
      { key: "A", label: "$2 \\times 2 \\times 2$" },
      { key: "B", label: "$3 \\times 3 \\times 3 \\times 3$" },
      { key: "C", label: "$4 \\times 3$" },
      { key: "D", label: "$5 \\times 5 \\times 5$" }
    ]
  },
  {
    no: 13,
    type: "PGK",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 2,
    text: "Penulisan bilangan biasa menjadi bentuk baku yang tepat adalah ….",
    options: [
      { key: "A", label: "$3{,}238 \\times 10^{-4} = 0{,}00003238$" },
      { key: "B", label: "$3{,}015 \\times 10^{-5} = 0{,}00003015$" },
      { key: "C", label: "$2{,}866 \\times 10^4 = 286.600$" },
      { key: "D", label: "$2{,}409 \\times 10^5 = 240.900$" }
    ]
  },
  {
    no: 14,
    type: "PGK",
    topic: "Teorema Pythagoras",
    weight: 2,
    text: "Perhatikan gambar berikut!<br/>Berdasarkan teorema Pythagoras dan gambar tersebut, hubungan panjang sisi segitiga berikut yang tidak tepat adalah ….",
    svgCode: "SVG_14",
    options: [
      { key: "A", label: "$AB^2 = BC^2 + AC^2$" },
      { key: "B", label: "$AC^2 = BC^2 - AB^2$" },
      { key: "C", label: "$BC^2 = AC^2 + AB^2$" },
      { key: "D", label: "$BC^2 = AC^2 - AB^2$" }
    ]
  },
  {
    no: 15,
    type: "PGK",
    topic: "PLSV & PtLSV",
    weight: 2,
    text: "Berikut yang bukan termasuk kalimat terbuka adalah ….",
    options: [
      { key: "A", label: "$3p - 1 < 10$" },
      { key: "B", label: "Presiden pertama Republik Indonesia adalah Ir. Soekarno" },
      { key: "C", label: "$x$ adalah bilangan bulat yang kurang dari $0$" },
      { key: "D", label: "Semua bilangan prima adalah bilangan ganjil" }
    ]
  },
  {
    no: 16,
    type: "BS",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 3,
    text: "Diketahui suatu bilangan berpangkat $(2^3 \\times 3^2)^3$.<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    statement: "Hasil dari operasi bilangan berpangkat tersebut adalah $5.182$."
  },
  {
    no: 17,
    type: "BS",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 3,
    text: "Diketahui kecepatan cahaya adalah $3 \\times 10^8\\text{ m/detik}$. Panjang lintasan cahaya sama dengan kecepatan cahaya dikali waktu.<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    statement: "Panjang lintasan cahaya dalam waktu $12\\text{ jam}$ adalah $1{,}296 \\times 10^{10}\\text{ km}$."
  },
  {
    no: 18,
    type: "BS",
    topic: "Teorema Pythagoras",
    weight: 3,
    text: "Diketahui gambar segitiga sebagai berikut!<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    svgCode: "SVG_18",
    statement: "Panjang $BC$ sama dengan $12\\sqrt{2}\\text{ cm}$."
  },
  {
    no: 19,
    type: "BS",
    topic: "Teorema Pythagoras",
    weight: 3,
    text: "Kak Ando dan Diki ingin pergi ke toko buku yang berada di arah utara dengan jarak $12\\text{ m}$ dari tempat mereka berada sekarang. Namun, sebelumnya Kak Ando berjalan ke arah timur sejauh $5\\text{ m}$ untuk mengambil uang terlebih dahulu. Sedangkan Diki berjalan ke arah barat sejauh $9\\text{ m}$ untuk membeli minum.<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    statement: "Dari tempat terakhir, jika Kak Ando dan Diki mulai berjalan ke toko buku pada waktu dan dengan kecepatan yang sama, Kak Ando akan sampai lebih dulu daripada Diki."
  },
  {
    no: 20,
    type: "BS",
    topic: "PLSV & PtLSV",
    weight: 3,
    text: "Diketahui suatu persegi panjang mempunyai diagonal dengan panjang $(2x + 3)\\text{ cm}$ dan $(3x - 4)\\text{ cm}$.<br/>Berdasarkan informasi tersebut, tentukan <strong>Benar</strong> atau <strong>Salah</strong> dari pernyataan berikut:",
    statement: "Panjang diagonal persegi panjang tersebut adalah $24\\text{ cm}$."
  },
  {
    no: 21,
    type: "ISIAN",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 5,
    text: "Bentuk pangkat positif dari $2a^{-5}bc^7$ adalah ….",
    placeholder: "Contoh penulisan: 2bc^7 / a^5"
  },
  {
    no: 22,
    type: "ISIAN",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 5,
    text: "Bentuk sederhana dari bentuk akar $\\sqrt{252}$ adalah ….",
    placeholder: "Contoh penulisan: 6√7"
  },
  {
    no: 23,
    type: "ISIAN",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 5,
    text: "Bentuk baku dari bilangan $0{,}00002534$ adalah ….",
    placeholder: "Contoh penulisan: 2,534 × 10^-5"
  },
  {
    no: 24,
    type: "ISIAN",
    topic: "Teorema Pythagoras",
    weight: 5,
    text: "Sebuah segitiga siku-siku memiliki ukuran alas $9\\text{ cm}$ dan tinggi $40\\text{ cm}$. Panjang sisi miring segitiga tersebut adalah ….",
    placeholder: "Tuliskan angka hasil perhitungan (dalam cm)..."
  },
  {
    no: 25,
    type: "ISIAN",
    topic: "PLSV & PtLSV",
    weight: 5,
    text: "Suatu bilangan dikalikan $2$ kemudian dikurangi $8$ hasilnya $10$. Bilangan tersebut adalah ….",
    placeholder: "Tuliskan bilangan yang dimaksud..."
  },
  {
    no: 26,
    type: "URAIAN",
    topic: "Bilangan Berpangkat & Bentuk Akar",
    weight: 10,
    text: "Bagaimanakah bentuk sederhana dari bilangan berpangkat $\\left(\\dfrac{2^3}{2^5}\\right)^{-3}$ ? Tuliskan langkah penyelesaiannya!",
    placeholder: "Tuliskan langkah penyelesaian dan hasil akhirnya..."
  },
  {
    no: 27,
    type: "URAIAN",
    topic: "Teorema Pythagoras",
    weight: 10,
    text: "Perhatikan gambar berikut!<br/>Seorang pengamat berada di atas mercusuar yang tingginya $12\\text{ m}$. Dia melihat kapal $A$ dan kapal $B$ berturut-turut $20\\text{ m}$ dan $13\\text{ m}$. Posisi kapal $A$, kapal $B$, dan kaki mercusuar terletak segaris. Berapakah jarak kapal $A$ dan kapal $B$?",
    svgCode: "SVG_27",
    placeholder: "Tuliskan perhitungan jarak AC, jarak BC, dan jarak kapal A ke B..."
  },
  {
    no: 28,
    type: "URAIAN",
    topic: "PLSV & PtLSV",
    weight: 10,
    text: "Gandi menyisihkan uang jajannya hari Senin sampai Sabtu dengan jumlah yang sama setiap harinya. Pada hari Kamis, Gandi mengambil uang yang telah dia sisihkan sebesar $\\text{Rp}10.000{,}00$. Pada hari Minggu, dia menghitung uang yang telah terkumpul sejak hari Senin, ada sebesar $\\text{Rp}14.000{,}00$. Berapa besar uang yang disisihkan Gandi per hari?",
    placeholder: "Tuliskan model persamaan dan langkah penyelesaiannya..."
  }
];

// =========================================================================
// STATE APLIKASI & PENYIMPANAN LOKAL
// =========================================================================
const STORAGE_KEY_SESSION = "pra_asas_mtk8_session_v2";
const STORAGE_KEY_LOCAL_DB = "pra_asas_mtk8_local_submissions_v2";
const STORAGE_KEY_LOCAL_CFG = "pra_asas_mtk8_local_config_v2";

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
  badge.textContent = "Terhubung ke Google Sheets";
  badge.className = "hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200";
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=getBootstrap");
    const data = await res.json();
    if (data && data.ok) {
      if (data.config) {
        appConfig = { ...appConfig, ...data.config };
      }
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        QUESTIONS_BANK = data.questions;
      }
      applyConfigToUI();
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

  // Verifikasi token sesi bila diaktifkan
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

  // Cek sesi tersimpan di perangkat
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
// RENDER SOAL, BILAH SIMBOL MATEMATIKA & TANDA RAGU-RAGU
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

function createMathSymbolBar(qNo, fieldId) {
  const symbols = ["√", "^", "×", "÷", "/", "≤", "≥", "≠", "°", "±"];
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
    btn.className = "w-9 h-9 rounded-lg bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-300 text-slate-900 font-extrabold text-sm shadow-2xs";
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
  document.getElementById("q-badge-topic").textContent = q.topic || "Matematika VIII";

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
          ? "border-blue-600 bg-blue-50 text-blue-950 font-bold"
          : "border-slate-200 hover:border-blue-300 bg-white text-slate-800"
      }`;
      btn.innerHTML = `
        <span class="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
        }">${letters[idx]}</span>
        <span class="text-base">${optObj.label}</span>
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
    hint.className = "mb-3 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold";
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
          ? "border-blue-600 bg-blue-50 text-blue-950 font-bold"
          : "border-slate-200 hover:border-blue-300 bg-white text-slate-800"
      }`;
      btn.innerHTML = `
        <span class="w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-extrabold shrink-0 ${
          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400 bg-white text-transparent"
        }">✓</span>
        <span class="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
        }">${letters[idx]}</span>
        <span class="text-base">${optObj.label}</span>
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
    inp.className = "touch-btn w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 text-base font-semibold focus:outline-none focus:border-blue-600";
    inp.oninput = (e) => selectAnswer(q.no, e.target.value, false);
    optionsEl.appendChild(inp);
  } else if (q.type === "URAIAN") {
    const fieldId = "ans-textarea-" + q.no;
    optionsEl.appendChild(createMathSymbolBar(q.no, fieldId));
    const ta = document.createElement("textarea");
    ta.id = fieldId;
    ta.rows = 5;
    ta.value = savedAns;
    ta.placeholder = q.placeholder || "Tuliskan cara penyelesaian dan jawaban akhir Anda...";
    ta.className = "w-full p-4 rounded-xl border-2 border-slate-300 text-base focus:outline-none focus:border-blue-600";
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
      isCurrent ? "ring-2 ring-blue-600 ring-offset-1 " : ""
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

  // Mode Pratinjau Lokal
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

  let msg = "Terus berlatih! Pelajari kembali materi di bawah ini agar makin siap menghadapi ASAS.";
  if (result.totalScore >= 85) msg = "Luar biasa! Pemahamanmu sudah sangat mantap untuk menghadapi ASAS Matematika.";
  else if (result.totalScore >= 70) msg = "Bagus! Tingkatkan ketelitian pada topik yang masih di bawah 75% agar nilaimu semakin maksimal saat ASAS.";
  document.getElementById("res-encouragement").textContent = msg;

  // Render Penguasaan per Topik Materi
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

  // Pembahasan (Jika diaktifkan Admin)
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
      showToast("Gagal terhubung ke server Apps Script: " + err.message, "error");
    }
    return;
  }

  // Mode Pratinjau Lokal
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
  document.getElementById("cfg-sessionToken").value = appConfig.sessionToken || "";
  document.getElementById("cfg-pgkPartial").checked = appConfig.pgkPartialScore !== false;
  document.getElementById("cfg-showExplanation").checked = !!appConfig.showExplanation;
  document.getElementById("cfg-oneAttempt").checked = !!appConfig.oneAttempt;
  document.getElementById("cfg-shuffleQ").checked = !!appConfig.shuffleQuestions;
  document.getElementById("cfg-shuffleOpt").checked = !!appConfig.shuffleOptions;
}

async function saveAdminSettings() {
  const tokenClean = document.getElementById("cfg-sessionToken").value.trim().toUpperCase();
  const updated = {
    isOpen: document.getElementById("cfg-isOpen").checked,
    durationMinutes: Math.max(5, parseInt(document.getElementById("cfg-duration").value || "90", 10)),
    sessionToken: tokenClean,
    requireToken: tokenClean !== "",
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
      if (data.ok) {
        showToast("Pengaturan berhasil disimpan ke Google Sheets.", "success");
        return;
      }
    } catch (err) {
      showToast("Gagal menyimpan pengaturan ke server.", "error");
      return;
    }
  }
  showToast("Pengaturan disimpan.", "success");
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
// FITUR A: KOREKSI MANUAL & NILAI PARSIAL ISIAN / URAIAN
// =========================================================================
function openGradingModal(subIndex) {
  const sub = adminSubmissions[subIndex];
  if (!sub) return;
  activeGradingSubmission = { index: subIndex, data: sub };

  document.getElementById("grading-student-title").textContent = `Koreksi: ${sub.nama}`;
  document.getElementById("grading-student-meta").textContent = `Kelas ${sub.kelas} • No. Absen ${sub.absen} • Nilai Saat Ini: ${sub.totalScore}`;

  const manualQuestions = QUESTIONS_BANK.filter((q) => q.type === "ISIAN" || q.type === "URAIAN");
  const listEl = document.getElementById("grading-items-list");

  listEl.innerHTML = manualQuestions
    .map((q) => {
      const stuAns = (sub.answers && sub.answers[q.no]) || "";
      const curScore = Number((sub.itemScores && sub.itemScores[q.no]) || 0);
      const keyRef = adminKeysMap[q.no] || "-";
      return `
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-extrabold text-sm text-slate-900">No. ${q.no} (${q.type}) — Maks. ${q.weight} Poin</span>
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-700">Skor Diberikan:</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="${q.weight}"
              data-qno="${q.no}"
              value="${curScore}"
              class="manual-score-input w-20 px-2.5 py-1.5 rounded-lg border-2 border-blue-400 bg-white font-extrabold text-center text-sm"
            />
          </div>
        </div>
        <div class="text-xs text-slate-600">${q.text}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div class="p-2.5 rounded-lg bg-white border border-slate-200">
            <div class="font-bold text-slate-500">Jawaban Siswa:</div>
            <div class="font-semibold text-slate-900 mt-0.5 whitespace-pre-wrap">${escapeHtml(stuAns || "(Kosong)")}</div>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <div class="font-bold text-emerald-800">Kunci Acuan:</div>
            <div class="font-semibold text-emerald-950 mt-0.5">${escapeHtml(String(keyRef))}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const modal = document.getElementById("grading-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (typeof renderMathInElement === "function") {
    renderMathInElement(listEl, {
      delimiters: [{ left: "$", right: "$", display: false }],
      throwOnError: false
    });
  }
}

function closeGradingModal() {
  const modal = document.getElementById("grading-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  activeGradingSubmission = null;
}

async function saveManualGrading() {
  if (!activeGradingSubmission) return;
  const sub = activeGradingSubmission.data;
  const inputs = document.querySelectorAll(".manual-score-input");
  const updatedItemScores = { ...(sub.itemScores || {}) };

  inputs.forEach((inp) => {
    const qNo = Number(inp.getAttribute("data-qno"));
    const maxW = Number(inp.getAttribute("max"));
    let val = parseFloat(inp.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > maxW) val = maxW;
    updatedItemScores[qNo] = val;
  });

  let newTotal = 0;
  QUESTIONS_BANK.forEach((q) => {
    newTotal += Number(updatedItemScores[q.no] || 0);
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
          itemScores: updatedItemScores,
          totalScore: newTotal
        })
      });
      const data = await res.json();
      btn.disabled = false;
      btn.textContent = "Simpan Koreksi";
      if (!data.ok) {
        showToast(data.message || "Gagal menyimpan koreksi ke server.", "error");
        return;
      }
      sub.itemScores = updatedItemScores;
      sub.totalScore = newTotal;
      closeGradingModal();
      renderAdminTables();
      showToast("Koreksi skor berhasil disimpan ke Google Sheets.", "success");
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Simpan Koreksi";
      showToast("Kesalahan koneksi saat menyimpan koreksi: " + err.message, "error");
    }
    return;
  }

  // Mode Pratinjau Lokal
  sub.itemScores = updatedItemScores;
  sub.totalScore = newTotal;
  localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(adminSubmissions));
  closeGradingModal();
  renderAdminTables();
  showToast("Koreksi skor disimpan pada mode pratinjau.", "success");
}

// =========================================================================
// FITUR E: HAPUS / IZINKAN ULANG PESERTA DARI ADMIN
// =========================================================================
function askDeleteSubmission(subIndex) {
  const sub = adminSubmissions[subIndex];
  if (!sub) return;
  openConfirmDialog(
    "Hapus & Izinkan Mengulang?",
    `Data pengerjaan milik ${sub.nama} (Kelas ${sub.kelas}, Absen ${sub.absen}) akan dihapus sehingga siswa tersebut dapat mengerjakan ulang. Lanjutkan?`,
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
            showToast(data.message || "Gagal menghapus data siswa di server.", "error");
            return;
          }
          await loadAdminData();
          showToast(`Data ${sub.nama} berhasil dihapus. Siswa kini diizinkan mengulang.`, "success");
        } catch (err) {
          showToast("Kesalahan koneksi: " + err.message, "error");
        }
        return;
      }

      adminSubmissions.splice(subIndex, 1);
      localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(adminSubmissions));
      renderAdminTables();
      showToast(`Data ${sub.nama} dihapus pada mode pratinjau.`, "success");
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
    "Sistem akan membuat tab 'Bank Soal' di Google Sheets Anda dan mengisinya dengan 28 soal beserta kunci jawabannya agar mudah diedit langsung dari spreadsheet. Lanjutkan?",
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

  // Rekap per Topik Materi
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

  // Rekap per Kelas
  const classes = ["VIII A", "VIII B", "VIII C", "VIII D", "VIII E", "VIII F", "VIII G"];
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
          <td class="p-3.5 font-extrabold text-blue-700">${s.totalScore}</td>
          <td class="p-3.5 text-xs text-slate-500">${new Date(s.submittedAt).toLocaleString("id-ID")}</td>
          <td class="p-3.5 text-right whitespace-nowrap space-x-1.5">
            <button type="button" onclick="openGradingModal(${s._origIdx})" class="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200">
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
          <td class="p-3.5 font-extrabold text-blue-700">${tm.avgPct.toFixed(1)}%</td>
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
      <td class="p-3.5 font-bold text-blue-700">${c.count ? c.mean.toFixed(2) : "-"}</td>
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

  // Sheet 1: Hasil Siswa
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

  // Sheet 2: Analisis Butir (ala ANATES)
  const rows2 = [
    ["ANALISIS BUTIR SOAL (METODE ANATES) — PRA-ASAS MATEMATIKA KELAS VIII"],
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

  // Sheet 3: Penguasaan per Materi
  const rows3 = [["Topik Materi", "Nomor Butir", "Bobot Maksimal", "Rata-rata Penguasaan (%)"]];
  stats.topicRecap.forEach((tm) => {
    rows3.push([tm.topic, tm.qNos, tm.maxWeight, Number(tm.avgPct.toFixed(2))]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows3), "Rekap per Materi");

  // Sheet 4: Statistik Tes
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

  // Sheet 5: Rekap per Kelas
  const rows5 = [["Kelas", "Jumlah Peserta", "Rata-rata Nilai", "Nilai Tertinggi", "Nilai Terendah"]];
  stats.classRecap.forEach((c) => {
    rows5.push([c.kelas, c.count, Number(c.mean.toFixed(2)), c.max, c.min]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows5), "Rekap per Kelas");

  XLSX.writeFile(wb, "Hasil_dan_Analisis_ANATES_PraASAS_MTK8.xlsx");
  showToast("File Excel (.xlsx) 5 sheet berhasil diunduh.", "success");
}

// =========================================================================
// DATA UJI SIMULASI ADMIN
// =========================================================================
function loadTenSampleStudents() {
  const sampleNames = [
    ["Alya Putri Ramadhani", "1", "VIII A"],
    ["Bagas Pratama Wijaya", "4", "VIII A"],
    ["Citra Kirana Dewi", "7", "VIII B"],
    ["Dimas Aditya Nugroho", "12", "VIII B"],
    ["Eka Sari Wulandari", "15", "VIII C"],
    ["Fajar Ramadhan", "19", "VIII D"],
    ["Gita Permata Sari", "22", "VIII E"],
    ["Hendra Kusuma", "25", "VIII F"],
    ["Indah Lestari", "30", "VIII G"],
    ["Joko Susilo", "34", "VIII G"]
  ];
  const targetScores = [94, 88, 82, 74, 68, 62, 54, 46, 38, 24];
  const generated = sampleNames.map((info, idx) => {
    const answers = {};
    const itemScores = {};
    let acc = 0;
    const target = targetScores[idx];
    QUESTIONS_BANK.forEach((q) => {
      const isCorrect = q.no === 8 ? idx < 2 : acc + q.weight <= target;
      if (isCorrect) {
        answers[q.no] = q.type === "PG" ? "A" : q.type === "PGK" ? "B,C" : q.type === "BS" ? "Benar" : "Contoh Benar";
        itemScores[q.no] = q.weight;
        acc += q.weight;
      } else {
        answers[q.no] = q.type === "PG" || q.type === "PGK" ? (idx % 2 === 0 ? "B" : "D") : q.type === "BS" ? "Salah" : "-";
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
  showToast("10 data uji simulasi berhasil dimuat untuk pengujian analisis.", "success");
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
