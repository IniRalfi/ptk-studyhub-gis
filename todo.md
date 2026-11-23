# TODO & Backend Action Plan (`server.js` — SK-3 Rafli)

Dokumen pelacak tugas komprehensif untuk pengembangan sisi **Backend (SK-3)** pada proyek **`ptk-studyhub-gis` (WebGIS Persebaran Tempat Belajar Kota Pontianak)**, disusun berdasarkan `docs/prd.md`, `docs/api-contract.md`, `docs/roadmap.md`, dan `AGENTS.md`.

---

## 📌 Status Ringkasan Proyek

- **Role:** Backend Developer & Data Engineer (SK-3 - Rafli)
- **Target Lingkungan:** Zero-CDN Offline-Ready (Open Lab tanpa internet)
- **Base URL:** `http://localhost:3000`
- **CRS Spasial:** `EPSG:4326` (WGS 84 — `[longitude, latitude]`)
- **Status Backend:** ✅ **100% Selesai & Teruji** (15 Test Cases Lulus)

---

## 📋 Daftar Tugas Terstruktur (Fase 1 s.d. Selesai)

### Fase 1: Persiapan Lingkungan & Konversi Dataset Spasial (`data/`)

Dataset spasial dari SK-1 (Timothy) dan SK-2 (Virsya) dipastikan tersedia, terkonversi ke GeoJSON `EPSG:4326`, dan tersimpan rapi di direktori `data/`.

- [x] **1.1. Verifikasi Struktur Direktori & Dependensi**
  - [x] Pastikan folder `data/`, `public/libs/`, `docs/`, dan `qgis/` sudah terstruktur sesuai `AGENTS.md`.
  - [x] Konfigurasi `package.json` (`express` v4.x terpasang, script `npm start` mengarah ke `node server.js`, `npm test` mengarah ke `node test/api-test.js`).
- [x] **1.2. Akuisisi & Konversi Dataset Tempat Belajar (`tempat_belajar.geojson`)**
  - [x] Konversi data mentah dari `data/SK2/sk2_layer.gpkg` (layer `tempat_belajar_edit`, 30 lokasi) menjadi `data/tempat_belajar.geojson`.
  - [x] Validasi CRS adalah `EPSG:4326` (koordinat `[longitude, latitude]` di sekitar Pontianak: long ~109.3x, lat ~-0.0x).
  - [x] Pastikan skema atribut properti konsisten (`nama`, `jenis`, `latitude`, `longitude`, `kapasitas`, `jam_operasional`, `gratis`, `kode_jenis`).
- [x] **1.3. Konversi & Penyiapan Layer Pendukung**
  - [x] Konversi `batas_kelurahan.shp` ke `data/batas_kelurahan.geojson` (29 kelurahan, offline basemap).
  - [x] Konversi `kampus_edit` ke `data/kampus.geojson` (13 kampus).
  - [x] Konversi `sekolah_edit` ke `data/sekolah.geojson` (47 sekolah).
  - [x] Sinkronisasi `data/zona_belajar.geojson` (2 fitur poligon awal) dengan struktur `FeatureCollection` valid.

---

### Fase 2: Implementasi Backend & REST API (`server.js`)

Penyempurnaan `server.js` 100% patuh terhadap `docs/api-contract.md` dan guardrails `AGENTS.md`.

- [x] **2.1. Guardrails & Middleware Konfigurasi**
  - [x] Middleware `express.static(path.join(__dirname, 'public'))` untuk menyajikan frontend secara offline.
  - [x] Middleware `express.json()` untuk parsing payload JSON pada POST request.
  - [x] Penggunaan wajib `path.join(__dirname, ...)` di semua operasi file untuk menjamin kompatibilitas Cross-OS (Linux CachyOS & Windows).
  - [x] Export modul `app` untuk kemudahan testing otomatis.
- [x] **2.2. Endpoint Spasial Layer (`GET /api/data/:layer`)**
  - [x] Mapping parameter layer: `belajar`, `zona`, `kelurahan`, `sekolah`, `kampus`.
  - [x] Validasi keberadaan file: jika parameter tidak terdaftar, kembalikan response `404 Not Found` (`{ "error": "Layer tidak ditemukan" }`).
  - [x] Penanganan fallback jika file fisik GeoJSON di `data/` belum ada (kembalikan 404 informatif).
  - [x] Header response eksplisit `Content-Type: application/json; charset=utf-8`.
- [x] **2.3. Endpoint Agregat Statistik (`GET /api/stats/jenis`)**
  - [x] Baca file `data/tempat_belajar.geojson`.
  - [x] Normalisasi kategori `jenis` ke 3 key standar lowercase:
    - Mengandung `"perpustakaan"` $\rightarrow$ `perpustakaan` (10)
    - Mengandung `"baca"` $\rightarrow$ `baca` (5)
    - Mengandung `"working"` / `"coworking"` $\rightarrow$ `coworking` (15)
  - [x] Normalisasi status gratis (`true`, `"Ya"`, `"ya"`, `"Gratis"`, `1`) $\rightarrow$ 15 gratis.
  - [x] Hitung metrik dinamis:
    - `total`: 30
    - `totalGratis`: 15
    - `persenGratis`: 50
    - `byJenis`: `{ perpustakaan: 10, baca: 5, coworking: 15 }`
- [x] **2.4. Endpoint Digitasi Web (`POST /api/feature/zona`)**
  - [x] Validasi payload request body:
    - Memastikan `req.body.feature` ada.
    - Validasi `type === "Feature"`.
    - Validasi `geometry.type === "Polygon"`.
    - Validasi koordinat poligon (array koordinat tidak kosong).
    - Jika tidak valid, kembalikan `400 Bad Request` (`{ "error": "Format GeoJSON Feature tidak valid atau bukan Polygon" }`).
  - [x] Auto-assign properti `fid` jika belum ada.
  - [x] Baca `data/zona_belajar.geojson` (initsialiasi otomatis jika belum ada).
  - [x] Tulis kembali secara persisten menggunakan `fs.writeFile(filePath, JSON.stringify(geojson, null, 2), 'utf-8')`.
  - [x] Kembalikan status `201 Created` dengan pesan sukses dan feature tersimpan.

---

### Fase 3: Pengujian Otomatis & Validasi Kontrak API

- [x] **3.1. Buat Test Runner / Verification Script (`test/api-test.js`)**
  - [x] Uji `GET /api/data/belajar`: mengembalikan 30 fitur valid.
  - [x] Uji `GET /api/data/zona`, `kelurahan`, `sekolah`, `kampus`: 200 & valid FeatureCollection.
  - [x] Uji `GET /api/data/layer_gaib`: return status 404 dengan pesan error baku.
  - [x] Uji `GET /api/stats/jenis`: mengembalikan nilai agregasi konsisten dengan data GeoJSON.
  - [x] Uji `POST /api/feature/zona` non-Polygon: return 400.
  - [x] Uji `POST /api/feature/zona` valid Polygon: return 201 dan feature tersimpan permanen di disk.
  - [x] Backup & restore otomatis data testing.
- [x] **3.2. Uji Integrasi Format Data dengan Frontend**
  - [x] Verifikasi format data sesuai dengan kebutuhan state frontend di `public/app.js`.

---

### Fase 4: Integrasi Frontend (SK-4 Jesika) & Dukungan Offline

- [x] **4.1. Verifikasi Penyajian Static Asset**
  - [x] Pastikan file `public/index.html`, `public/style.css`, dan `public/app.js` dapat diakses langsung via browser di `http://localhost:3000`.
  - [x] Pastikan pustaka leaflet lokal di `public/libs/` ter-serve dengan MIME type yang benar (`text/javascript`, `text/css`).
- [x] **4.2. Uji End-to-End Alur Digitasi**
  - [x] Buka browser, lakukan digitasi poligon zona belajar baru di kanvas Leaflet.
  - [x] Submit modal form atribut zona.
  - [x] Pastikan request `POST /api/feature/zona` berhasil (201).
  - [x] Refresh halaman browser: verifikasi poligon yang baru digambar tetap muncul di peta dari file `data/zona_belajar.geojson`.

---

### Fase 5: Simulasi Open Lab (Offline Test) & Oral Defense Readiness

- [x] **5.1. Uji Mati Internet (Strict Offline Simulation)**
  - [x] Zero-CDN audit: tidak ada link `https://...` di HTML, CSS, maupun JS.
  - [x] Server Express menyajikan aset statis lokal tanpa error.
  - [x] Layer batas kelurahan merender dengan akurat sebagai offline basemap.
- [x] **5.2. Dokumentasi Teknis & Kesiapan Ujian (SK-5 Syafira)**
  - [x] Kontrak API terdokumentasi di `docs/api-contract.md`.
  - [x] Panduan frontend terdokumentasi di `docs/frontend-brief.md`.
  - [x] Kesiapan penjelasan alur teknis backend & frontend untuk Oral Defense.

---

## 📌 Checklist Acceptance Criteria (PRD Review)

- [x] Seluruh endpoint REST API berjalan normal di `http://localhost:3000`.
- [x] Tidak ada dependensi online/CDN di sisi server maupun penyajian data.
- [x] Endpoint `/api/stats/jenis` mengembalikan kalkulasi dinamis yang akurat.
- [x] Endpoint `/api/feature/zona` memvalidasi dan menyimpan poligon secara persisten.
- [x] Seluruh dataset spasial berformat GeoJSON dengan CRS `EPSG:4326`.
- [x] Antarmuka Bento Floating UI terintegrasi penuh dengan Leaflet JS.
