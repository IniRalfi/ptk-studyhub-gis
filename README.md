# `ptk-studyhub-gis` — Pontianak Kota Literasi

Aplikasi WebGIS interaktif untuk pemetaan persebaran tempat belajar (**Perpustakaan, Taman Baca, dan Co-working Space**) se-Kota Pontianak. Dikembangkan sebagai proyek **PjBL Ujian Akhir Semester — Sistem Informasi Geografis Dasar (Kelompok 3)** menggunakan pendekatan **Zero-CDN Offline-First**.

## Pembagian Peran Tim

- **Timothy (SK-1):** Akuisisi & Validasi Data Spasial (`CSV`, `SHP`, `GeoJSON`, `GPKG`)
- **Virsya (SK-2):** Manajemen Vektor, Simbologi, Labeling, & Digitasi Poligon di QGIS
- **Rafli (SK-3):** Backend REST API (`Node.js` + `Express`) & Konversi Dataset GeoJSON
- **Jesika (SK-4):** Frontend WebGIS Interaktif (`Leaflet JS` + _Bento Floating UI_)
- **Syafira (SK-5):** Integrasi Sistem & Laporan Evaluasi Perbandingan QGIS vs Leaflet

## Tech Stack

- **Backend:** Node.js, Express.js (`fs/promises`, `path`)
- **Frontend:** HTML5, Vanilla CSS3 (_Bento Floating Layout_), Vanilla JavaScript (ES6+)
- **Web Mapping (Offline Assets):** Leaflet JS, Leaflet.markercluster, Leaflet.draw
- **Data Format:** GeoJSON (`EPSG:4326`)

## Struktur Direktori

```text
ptk-studyhub-gis/
├── AGENTS.md                  # Pedoman teknis & guardrails pengembangan
├── README.md                  # Dokumentasi utama proyek
├── package.json               # Konfigurasi & dependensi Node.js
├── server.js                  # Server Express & REST API (SK-3)
├── data/                      # Dataset GeoJSON hasil ekspor QGIS (EPSG:4326)
│   ├── tempat_belajar.geojson
│   ├── zona_belajar.geojson
│   ├── batas_kelurahan.geojson
│   ├── sekolah.geojson
│   └── kampus.geojson
├── public/                    # Aplikasi Frontend Leaflet (SK-4)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── libs/                  # Library Leaflet lokal (offline-ready)
├── qgis/                      # File proyek QGIS (.qgz) & data mentah SK-1/SK-2
└── docs/                      # PRD, API Contract, Design System, & Roadmap
```
