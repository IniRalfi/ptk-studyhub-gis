# AGENTS.md — Guardrails & Technical Rules (`ptk-studyhub-gis`)

Dokumen ini menjadi pedoman wajib bagi pengembang dan AI Agent saat menulis, mengubah, atau me-review kode pada repositori `ptk-studyhub-gis`.

## 1. Konteks Proyek & Batasan Lingkungan

- **Nama Proyek:** `ptk-studyhub-gis` (WebGIS Persebaran Tempat Belajar Kota Pontianak — Kelompok 3).
- **Lingkungan Pengujian:** Open Lab **TANPA KONEKSI INTERNET**.
- **Lingkungan Pengembangan Tim:** Cross-OS (Linux CachyOS + Node.js v26 untuk Backend SK-3, Windows untuk Frontend SK-4).
- **Aturan Aset Eksternal (STRICT):**
  - **DILARANG** menggunakan link CDN online (`https://...`) untuk CSS, JS, Font, maupun Icon (termasuk Tailwind CDN, Google Fonts, atau Leaflet CDN).
  - Seluruh library frontend (`leaflet`, `leaflet.markercluster`, `leaflet-draw`) wajib disimpan dan dimuat secara lokal dari `public/libs/`.
  - Gunakan Vanilla CSS murni (`public/style.css`) dan _system font stack_ (`system-ui, -apple-system, sans-serif`).
- **Kompatibilitas Cross-OS:**
  - Wajib menggunakan `path.join(__dirname, ...)` pada seluruh operasi file di Node.js (dilarang _hardcode_ path separator `/` atau `\`).

## 2. Struktur Direktori Wajib

```text
ptk-studyhub-gis/
├── AGENTS.md
├── README.md
├── package.json
├── server.js                  # [SK-3 - Rafli] Backend Express & REST API
├── data/                      # Dataset GeoJSON (EPSG:4326)
│   ├── tempat_belajar.geojson # Hasil konversi tempat_belajar.csv / SK_2.gpkg
│   ├── zona_belajar.geojson   # Dari folder SK2 (Polygon)
│   ├── batas_kelurahan.geojson# Hasil konversi batas_kelurahan.shp
│   ├── sekolah.geojson        # Dari folder SK1
│   └── kampus.geojson         # Hasil konversi kampus.gpkg
├── public/                    # [SK-4 - Jesika] Frontend Bento Floating UI
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── libs/
├── qgis/                      # Arsip file SK-1 & SK-2 (.qgz, .shp, .gpkg, .qmd)
└── docs/                      # Dokumentasi perencanaan & draf laporan SK-5
```

## 3. Aturan Wajib Kode Backend (server.js — SK-3)

Gunakan middleware express.static(path.join(\_\_dirname, 'public')) dan express.json().

Endpoint wajib tersedia:

GET /api/data/belajar (serta /api/data/:layer untuk zona, kelurahan, sekolah, kampus).

GET /api/stats/jenis (mengembalikan rekap jumlah per kategori jenis dan status gratis).

POST /api/feature/zona (menerima GeoJSON Feature baru dan menyimpannya ke data/zona_belajar.geojson menggunakan fs/promises).

## 4. Aturan Wajib Kode Frontend (public/app.js — SK-4)

Single Source of Truth: Setiap perubahan filter, cluster, label, atau pencarian wajib memperbarui objek state terlebih dahulu lalu memanggil renderBelajar(). Dilarang memanipulasi layer peta secara langsung di dalam event listener input.

Struktur state wajib:

JavaScript
const state = {
filters: { perpustakaan: true, baca: true, coworking: true },
cluster: false,
showGratis: false,
showLabels: true,
kecamatan: 'all',
searchQuery: ''
};
Kompatibilitas MarkerCluster:

Saat state.cluster === false, render titik menggunakan L.circleMarker.

Saat state.cluster === true, wajib menggunakan L.marker dengan custom L.divIcon di dalam L.markerClusterGroup().

Rule-Based Labeling: Tooltip permanen (bindTooltip) hanya ditampilkan ketika state.showLabels === true DAN Number(feature.properties.kapasitas) > 50.

Normalisasi Properti: Lakukan normalisasi string (toLowerCase().trim()) saat membaca nilai jenis dan tangani variasi nilai gratis (true, "Ya", "ya", "1").

---
