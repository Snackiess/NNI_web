// ===== NNI - New News Indonesia =====
const BASE_URL = "https://berita-indo-api-next.vercel.app/api/cnn-news"
const PER_HALAMAN = 8

const KATEGORI = [
    { id: "",              nama: "Terbaru" },
    { id: "nasional",      nama: "Nasional" },
    { id: "internasional", nama: "Internasional" },
    { id: "ekonomi",       nama: "Ekonomi" },
    { id: "olahraga",      nama: "Olahraga" },
    { id: "teknologi",     nama: "Teknologi" },
    { id: "hiburan",       nama: "Hiburan" },
    { id: "gaya-hidup",    nama: "Gaya Hidup" }
]

const el = {
    preloader: document.getElementById("preloader"),
    header: document.getElementById("header"),
    tanggal: document.getElementById("tanggal"),
    kategori: document.getElementById("kategori"),
    chips: document.getElementById("chips"),
    hero: document.getElementById("hero"),
    berita: document.getElementById("berita"),
    status: document.getElementById("status"),
    judul: document.getElementById("judulSeksi"),
    jumlah: document.getElementById("jumlah"),
    ticker: document.getElementById("ticker"),
    tickerTrack: document.getElementById("tickerTrack"),
    sorotan: document.getElementById("sorotan"),
    widgetSorotan: document.getElementById("widgetSorotan"),
    btnMore: document.getElementById("btnMore"),
    toTop: document.getElementById("toTop"),
    cari: document.getElementById("cari"),
    formCari: document.getElementById("formCari"),
    tema: document.getElementById("tema"),
    tahun: document.getElementById("tahun")
}

let kategoriAktif = KATEGORI[0]
let daftarBerita = []
let daftarList = []   // berita yang tampil di daftar utama
let tampil = 0        // jumlah item daftar yang sudah dirender
const cache = {}

// ---------- Helper ----------
function esc(teks = "") {
    return String(teks)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function waktuLalu(iso) {
    const t = new Date(iso)
    if (isNaN(t)) return ""
    const detik = Math.floor((Date.now() - t.getTime()) / 1000)
    if (detik < 60) return "Baru saja"
    const menit = Math.floor(detik / 60)
    if (menit < 60) return `${menit} menit lalu`
    const jam = Math.floor(menit / 60)
    if (jam < 24) return `${jam} jam lalu`
    const hari = Math.floor(jam / 24)
    if (hari < 7) return `${hari} hari lalu`
    return t.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function gambar(a, ukuran = "small") {
    const img = a.image && (a.image[ukuran] || a.image.large || a.image.small)
    return img ? `<img src="${esc(img)}" alt="${esc(a.title)}" loading="lazy">` : ""
}

function simpanTema(v) { try { localStorage.setItem("nni-tema", v) } catch (e) {} }
function ambilTema() { try { return localStorage.getItem("nni-tema") } catch (e) { return null } }

// ---------- Template ----------
function kartu(a, i) {
    return `
        <article class="card" style="animation-delay:${Math.min(i % PER_HALAMAN, 12) * 40}ms">
            <a href="${esc(a.link)}" target="_blank" rel="noopener" class="thumb ${a.image ? "" : "noimg"}" tabindex="-1" aria-hidden="true">
                ${gambar(a, "small")}
            </a>
            <div class="card-body">
                <span class="kicker">${esc(kategoriAktif.nama)}</span>
                <h3><a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.title)}</a></h3>
                <p>${esc(a.contentSnippet || "")}</p>
                <div class="card-foot">
                    <span class="meta">${waktuLalu(a.isoDate)} · CNN Indonesia</span>
                    <a class="baca" href="${esc(a.link)}" target="_blank" rel="noopener">Baca selengkapnya →</a>
                </div>
            </div>
        </article>`
}

function kartuHeroUtama(a) {
    return `
        <a class="hero-main ${a.image ? "" : "noimg"}" href="${esc(a.link)}" target="_blank" rel="noopener">
            ${gambar(a, "large")}
            <div class="hero-body">
                <span class="tag">${esc(kategoriAktif.nama)}</span>
                <h2>${esc(a.title)}</h2>
                <p>${esc(a.contentSnippet || "")}</p>
                <div class="meta">${waktuLalu(a.isoDate)} · CNN Indonesia</div>
            </div>
        </a>`
}

function heroSub(a) {
    return `
        <a class="hero-sub" href="${esc(a.link)}" target="_blank" rel="noopener">
            ${gambar(a, "small")}
            <h3>${esc(a.title)}</h3>
        </a>`
}

function itemSorotan(a) {
    return `
        <li>
            <a href="${esc(a.link)}" target="_blank" rel="noopener">
                <div>
                    <h4>${esc(a.title)}</h4>
                    <div class="meta">${waktuLalu(a.isoDate)}</div>
                </div>
            </a>
        </li>`
}

function skeleton(n = 4) {
    return Array.from({ length: n }, () => `
        <div class="card skeleton">
            <div class="thumb" style="min-height:170px"></div>
            <div class="card-body">
                <div class="line"></div><div class="line"></div><div class="line w60"></div>
            </div>
        </div>`).join("")
}

// ---------- Render ----------
function tampilkanStatus(judul, pesan, tombol) {
    el.status.hidden = false
    el.status.innerHTML = `
        <h3>${esc(judul)}</h3>
        <p>${esc(pesan)}</p>
        ${tombol ? `<button class="btn" id="btnUlang">${esc(tombol)}</button>` : ""}`
    const b = document.getElementById("btnUlang")
    if (b) b.addEventListener("click", () => muatBerita(kategoriAktif))
}

function sembunyikanStatus() {
    el.status.hidden = true
    el.status.innerHTML = ""
}

function pasangFallbackGambar() {
    document.querySelectorAll(".thumb img, .hero-main img, .hero-sub img").forEach(img => {
        if (img.dataset.fb) return
        img.dataset.fb = "1"
        img.addEventListener("error", () => {
            const wadah = img.closest(".thumb, .hero-main")
            if (wadah) wadah.classList.add("noimg")
            img.remove()
        }, { once: true })
    })
}

function renderTicker(data) {
    if (!data.length) { el.ticker.hidden = true; return }
    const item = data.slice(0, 8)
        .map(a => `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.title)}</a>`)
        .join("")
    // digandakan agar animasi berjalan mulus tanpa jeda
    el.tickerTrack.innerHTML = item + item
    el.ticker.hidden = false
}

function renderKategori() {
    el.kategori.innerHTML = KATEGORI.map(k =>
        `<li><button data-id="${esc(k.id)}" class="${k.id === kategoriAktif.id ? "aktif" : ""}">${esc(k.nama)}</button></li>`
    ).join("")
    el.chips.innerHTML = KATEGORI.map(k =>
        `<button class="chip ${k.id === kategoriAktif.id ? "aktif" : ""}" data-id="${esc(k.id)}">${esc(k.nama)}</button>`
    ).join("")
}

function renderSorotan(data) {
    if (!data.length) { el.widgetSorotan.hidden = true; return }
    el.sorotan.innerHTML = data.map(itemSorotan).join("")
    el.widgetSorotan.hidden = false
}

function renderDaftar(reset = true) {
    if (reset) { el.berita.innerHTML = ""; tampil = 0 }
    const potong = daftarList.slice(tampil, tampil + PER_HALAMAN)
    el.berita.insertAdjacentHTML("beforeend", potong.map((a, i) => kartu(a, i)).join(""))
    tampil += potong.length
    el.btnMore.hidden = tampil >= daftarList.length
    pasangFallbackGambar()
}

function render(data, mode = "normal") {
    if (!data.length) {
        el.hero.innerHTML = ""
        el.berita.innerHTML = ""
        el.jumlah.textContent = ""
        el.btnMore.hidden = true
        tampilkanStatus("Berita tidak ditemukan", "Coba kata kunci lain atau pilih kategori yang berbeda.")
        return
    }
    sembunyikanStatus()

    if (mode === "normal" && data.length >= 5) {
        el.hero.innerHTML = kartuHeroUtama(data[0]) +
            `<div class="hero-side">${data.slice(1, 4).map(heroSub).join("")}</div>`
        daftarList = data.slice(4)
        renderSorotan(data.slice(4, 9))
        el.judul.textContent = `Berita ${kategoriAktif.nama}`
    } else {
        el.hero.innerHTML = ""
        daftarList = data
        if (mode === "normal") renderSorotan(data.slice(0, 5))
        el.judul.textContent = mode === "cari" ? "Hasil Pencarian" : `Berita ${kategoriAktif.nama}`
    }
    el.jumlah.textContent = `${data.length} berita`
    renderDaftar(true)
}

// ---------- Ambil data ----------
async function muatBerita(kat) {
    kategoriAktif = kat
    renderKategori()
    el.cari.value = ""
    sembunyikanStatus()
    el.hero.innerHTML = ""
    el.btnMore.hidden = true
    el.widgetSorotan.hidden = true
    el.berita.innerHTML = skeleton()
    el.judul.textContent = `Berita ${kat.nama}`
    el.jumlah.textContent = ""

    try {
        if (!cache[kat.id]) {
            const url = kat.id ? `${BASE_URL}/${kat.id}` : BASE_URL
            const res = await fetch(url)
            if (!res.ok) throw new Error("HTTP " + res.status)
            const json = await res.json()
            cache[kat.id] = Array.isArray(json.data) ? json.data : []
        }
        daftarBerita = cache[kat.id]
        renderTicker(daftarBerita)
        render(daftarBerita)
    } catch (err) {
        console.error(err)
        el.berita.innerHTML = ""
        el.ticker.hidden = true
        tampilkanStatus("Gagal memuat berita", "Periksa koneksi internet kamu lalu coba lagi.", "Coba lagi")
    } finally {
        el.preloader.classList.add("hide")
    }
}

// ---------- Event ----------
function pilihKategori(e) {
    const btn = e.target.closest("button[data-id]")
    if (!btn) return
    const kat = KATEGORI.find(k => k.id === btn.dataset.id)
    if (kat) {
        muatBerita(kat)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }
}
el.kategori.addEventListener("click", pilihKategori)
el.chips.addEventListener("click", pilihKategori)

el.btnMore.addEventListener("click", () => renderDaftar(false))

function cariBerita() {
    const q = el.cari.value.trim().toLowerCase()
    if (!q) { render(daftarBerita); return }
    const hasil = daftarBerita.filter(a =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.contentSnippet || "").toLowerCase().includes(q)
    )
    render(hasil, "cari")
}
el.cari.addEventListener("input", cariBerita)
el.formCari.addEventListener("submit", e => { e.preventDefault(); cariBerita() })

el.tema.addEventListener("click", () => {
    const gelap = document.documentElement.dataset.theme === "dark"
    document.documentElement.dataset.theme = gelap ? "light" : "dark"
    simpanTema(gelap ? "light" : "dark")
})

window.addEventListener("scroll", () => {
    const y = window.scrollY
    el.header.classList.toggle("scrolled", y > 10)
    el.toTop.hidden = y < 600
}, { passive: true })
el.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }))

// ---------- Init ----------
document.documentElement.dataset.theme = ambilTema() || "light"
el.tanggal.textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
})
el.tahun.textContent = new Date().getFullYear()
muatBerita(kategoriAktif)