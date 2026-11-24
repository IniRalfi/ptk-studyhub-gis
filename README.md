# `ptk-studyhub-gis` — Pontianak Kota Literasi

> **Aplikasi WebGIS Interaktif Persebaran Tempat Belajar (Perpustakaan, Taman Baca, dan Co-working Space) se-Kota Pontianak**  
> Proyek PjBL Ujian Akhir Semester — Sistem Informasi Geografis Dasar (**Kelompok 3**)  
> Dibangun dengan arsitektur **Zero-CDN Offline-First** dan estetika **Bento Floating UI**.

---

## 👥 Pembagian Peran Tim (Kelompok 3)

| Nama Anggota | Kode Peran | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Timothy** | **SK-1** | Akuisisi, pembersihan, dan validasi data spasial (`tempat_belajar.csv`, `batas_kelurahan.shp`, `kampus.gpkg`, `sekolah.geojson`). |
| **Virsya** | **SK-2** | Manajemen vektor di QGIS, perancangan simbologi kategori, *rule-based labeling*, dan digitasi awal poligon zona belajar. |
| **Rafli** | **SK-3** | Pengembangan Backend REST API (`Node.js` + `Express`), konversi dataset spasial ke `GeoJSON EPSG:4326`, dan persistensi file lokal. |
| **Jesika** | **SK-4** | Pembangunan Frontend WebGIS (`Leaflet JS` + *Bento Floating UI* + *Single Source of Truth State* + digitasi `Leaflet.draw`). |
| **Syafira** | **SK-5** | Integrasi sistem, uji ketahanan lingkungan offline, evaluasi perbandingan QGIS vs Leaflet, dan draf laporan akhir. |

---

## 🛠️ Tech Stack & Arsitektur

- **Backend:** Node.js (v18+), Express.js (`fs/promises`, `path` dengan perlindungan *Cross-OS*).
- **Frontend:** HTML5 Semantik, Vanilla CSS3 (*Custom Properties*, *Soft Sage & Orange Palette*), Vanilla JavaScript ES6+.
- **Pemetaan Web (Aset Lokal / Zero-CDN):**
  - `Leaflet JS` (v1.9.4)
  - `Leaflet.markercluster`
  - `Leaflet.draw`
- **Format Data Spasial:** GeoJSON (`EPSG:4326` WGS 84).
- **Offline Fallback Basemap:** Poligon administrasi 29 kelurahan Kota Pontianak dirender otomatis tanpa perlu sambungan internet.

---

## 📁 Struktur Direktori

```text
ptk-studyhub-gis/
├── AGENTS.md                  # Pedoman teknis & guardrails tim
├── README.md                  # Dokumentasi utama proyek
├── package.json               # Konfigurasi dependensi & npm scripts
├── server.js                  # Server Express & REST API (SK-3 Rafli)
├── todo.md                    # Tracker status pengerjaan proyek
├── data/                      # Dataset GeoJSON (EPSG:4326)
│   ├── tempat_belajar.geojson # 30 lokasi fasilitas literasi
│   ├── zona_belajar.geojson   # Poligon zona literasi (mendukung web digitization)
│   ├── batas_kelurahan.geojson# 29 kelurahan (offline basemap)
│   ├── sekolah.geojson        # 47 fasilitas sekolah
│   └── kampus.geojson         # 13 perguruan tinggi
├── public/                    # Aplikasi Frontend Bento UI (SK-4 Jesika)
│   ├── index.html             # Layout Bento Floating UI
│   ├── style.css              # Vanilla CSS (Sage & Orange design system)
│   ├── app.js                 # Controller Leaflet & state manager
│   └── libs/                  # Library Leaflet lokal (Zero-CDN)
│       ├── leaflet/
│       ├── leaflet.markercluster/
│       └── leaflet-draw/
├── test/
│   └── api-test.js            # Skrip pengujian otomatis REST API (15 test cases)
├── qgis/                      # Arsip data mentah & proyek QGIS (.qgz, .shp, .gpkg)
└── docs/                      # Dokumentasi teknis & laporan
    ├── api-contract.md        # Spesifikasi kontrak REST API backend-frontend
    ├── design.md              # Design system & panduan UI Bento
    ├── evaluasi-qgis-vs-leaflet.md # Laporan evaluasi komparatif (SK-5)
    ├── oral-defense-prep.md   # Cheatsheet tanya-jawab ujian oral defense
    ├── frontend-brief.md      # Brief panduan kerja frontend
    ├── prd.md                 # Product Requirements Document
    └── roadmap.md             # Jadwal pengembangan
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- Node.js (versi 18.x ke atas)
- Peramban web modern (Google Chrome, Mozilla Firefox, atau Microsoft Edge)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Pengujian Otomatis (15 Test Cases)
Untuk memverifikasi integritas endpoint REST API dan data spasial:
```bash
npm test
```
*Output: 15 Passed, 0 Failed (100% lulus).*

### 4. Menjalankan Server Lokal
```bash
npm start
```
Buka browser dan akses antarmuka di:
```text
http://localhost:3000
```

---

## 📡 Dokumentasi REST API

| Method | Endpoint | Deskripsi | Status Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/data/:layer` | Mengambil data spasial GeoJSON (`belajar`, `zona`, `kelurahan`, `sekolah`, `kampus`). | `200 OK` / `404 Not Found` |
| `GET` | `/api/stats/jenis` | Mengembalikan ringkasan total lokasi, jumlah gratis, persentase, dan per-kategori. | `200 OK` |
| `POST`| `/api/feature/zona`| Menerima poligon baru dari digitasi web dan menyimpannya permanen ke disk. | `201 Created` / `400 Bad Request` |

---

## 🧪 Uji Ketahanan Offline (Open Lab Simulation)

Aplikasi dirancang untuk lulus evaluasi laboratorium **tanpa sambungan internet**:
1. Jalankan `npm start`.
2. Buka `http://localhost:3000` di Google Chrome.
3. Buka **Developer Tools** (`F12`), masuk ke tab **Network**, dan centang opsi **Offline** (atau aktifkan *Airplane Mode* pada laptop).
4. Refresh halaman (`Ctrl + F5`):
   - Seluruh peta kelurahan, marker titik belajar, klaster, dan statistik tetap tampil sempurna.
   - Tidak ada error merah koneksi CDN pada tab *Console*.

---

## 📄 Dokumen Pendukung

- [docs/api-contract.md](file:///home/rafli/Programming/projects/ptk-studyhub-gis/docs/api-contract.md) — Kontrak teknis REST API.
- [docs/evaluasi-qgis-vs-leaflet.md](file:///home/rafli/Programming/projects/ptk-studyhub-gis/docs/evaluasi-qgis-vs-leaflet.md) — Laporan komparasi QGIS Desktop vs. WebGIS Leaflet (SK-5).
- [docs/oral-defense-prep.md](file:///home/rafli/Programming/projects/ptk-studyhub-gis/docs/oral-defense-prep.md) — Panduan tanya-jawab dan *oral defense* ujian akhir.
- [docs/frontend-brief.md](file:///home/rafli/Programming/projects/ptk-studyhub-gis/docs/frontend-brief.md) — Panduan desain dan arsitektur UI.
