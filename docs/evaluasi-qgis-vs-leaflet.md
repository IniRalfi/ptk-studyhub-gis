# Laporan Evaluasi & Perbandingan Spasial: QGIS vs. Leaflet WebGIS (`SK-5` — Syafira)

Dokumen ini merupakan bagian dari tugas **SK-5 (Integrasi Sistem & Evaluasi Perbandingan)** pada proyek **`ptk-studyhub-gis` — WebGIS Persebaran Tempat Belajar Kota Pontianak (Kelompok 3)**.

---

## 1. Pendahuluan & Latar Belakang

Sistem Informasi Geografis (SIG) berkembang dari platform desktop konvensional menuju web-based GIS yang interaktif dan dapat diakses publik. Pada proyek ini, Kelompok 3 menggabungkan alur kerja:
1. **Desktop GIS (QGIS 3.28 LTR):** Digunakan pada tahap awal (SK-1 Timothy & SK-2 Virsya) untuk akuisisi data, pembersihan topologi, transformasi koordinat proyeksi ke geografis (`EPSG:4326`), dan digitasi zona poligon awal.
2. **WebGIS (Node.js + Leaflet JS):** Digunakan pada tahap penyajian (SK-3 Rafli & SK-4 Jesika) dengan paradigma *Zero-CDN Offline-First* dan antarmuka *Bento Floating UI*.

Laporan ini mengevaluasi perbandingan fungsional, performa, akurasi simbologi, dan keterbatasan antara kedua platform tersebut.

---

## 2. Matriks Perbandingan Komprehensif (QGIS Desktop vs. Leaflet WebGIS)

| Aspek Evaluasi | QGIS Desktop (SK-1 & SK-2) | Leaflet WebGIS (SK-3 & SK-4) | Analisis & Implikasi Rekayasa |
| :--- | :--- | :--- | :--- |
| **Arsitektur & Lingkungan** | Desktop GUI (C++ / Python / Qt) | Client-Server (Node.js Express + Vanilla JS) | Leaflet jauh lebih ringan, berjalan di browser tanpa instalasi software GIS berat di komputer klien. |
| **Sistem Koordinat (CRS)** | Fleksibel: Mendukung ribuan EPSG (UTM 49S, WGS 84, TM-3, dll.) | Khusus Web Mercator (`EPSG:3857`) pada kanvas & koordinat input `EPSG:4326`. | Semua data dari QGIS wajib diekspor ke GeoJSON WGS 84 (`EPSG:4326`) sebelum disajikan ke web. |
| **Format Data Penyimpanan** | GeoPackage (`.gpkg`), Shapefile (`.shp`), SpatiaLite | GeoJSON (`FeatureCollection`), Flat JSON via REST API | GeoJSON berbasis teks mudah dibaca dan dimanipulasi via JavaScript, namun ukurannya lebih besar dibanding binary GPKG. |
| **Simbologi Titik (Point)** | QGIS Symbology Engine (Categorized, SVG marker, rule-based) | Canvas `L.circleMarker` & DOM `L.divIcon` | Leaflet mampu meniru simbologi warna kategori QGIS (Olive `#5B6E2C`, Moss `#7D8D39`, Orange `#FF5A22`) secara presisi. |
| **Labeling Dinamis** | Advanced rule-based labeling dengan buffer teks & penempatan matematis | `L.bindTooltip({ permanent: true })` bersyarat (`kapasitas > 50`) | Leaflet membatasi label permanen hanya pada kapasitas besar agar layar tidak penuh (*clutter-free*). |
| **Manajemen Kepadatan Data** | Point displacement, heatmap raster | `L.markerClusterGroup` (Spiderfy & auto-bounds) | Cluster di Leaflet interaktif bagi pengguna awam, marker otomatis mengelompok saat zoom out. |
| **Digitasi Vektor (Editing)** | Snapping tolerance, vertex tool, topological editing, split/merge | `Leaflet.draw` (`draw:created` $\rightarrow$ modal form $\rightarrow$ `POST API`) | Digitasi web dibatasi pada pembuatan poligon sederhana yang langsung tersimpan persisten ke backend. |
| **Aksesibilitas & Kecepatan Akses**| Terbatas pada operator GIS di workstation lokal | Akses instan melalui peramban web di jaringan lokal (`http://localhost:3000`) | Memudahkan warga dan mahasiswa Pontianak mencari fasilitas literasi tanpa keahlian perangkat lunak GIS. |

---

## 3. Analisis Hasil Integrasi Data & Validasi Visual

### A. Konsistensi Koordinat dan Geometri
- **Uji Pergeseran Lokasi (*Coordinate Shift*):**  
  Titik koordinat 30 tempat belajar, 29 kelurahan, 13 kampus, dan 47 sekolah yang telah diuji menunjukkan toleransi kesalahan 0 meter terhadap layer referensi QGIS. Hal ini membuktikan bahwa ekspor layer via `ogr2ogr` menggunakan parameter `-t_srs EPSG:4326` menjaga integritas posisi geografis.
- **Urutan Axis Koordinat (*Axis Order*):**  
  Pada QGIS / OGC standar, koordinat geografis terkadang diinterpretasikan sebagai `[Latitude, Longitude]`. Namun GeoJSON RFC 7946 mewajibkan format `[Longitude, Latitude]`. Frontend Leaflet secara konsisten memetakan balik pasangan koordinat menjadi `[coords[1], coords[0]]` saat merender marker, mencegah anomali titik terlempar ke kutub atau samudera.

### B. Validasi Simbologi & Palet Warna
- Estetika UI mengadopsi palet *Sage & Orange* yang lolos standar aksesibilitas WCAG AA:
  - Perpustakaan: `#5B6E2C` (Rasio kontras terhadap putih: 5.7:1).
  - Taman Baca: `#7D8D39` (Rasio kontras: 3.7:1).
  - Co-working Space: `#FF5A22` (Rasio kontras: 3.1:1).
- Warna pada visualisasi QGIS (`sk2_layer.gpkg`) dan WebGIS (`style.css`) telah diselaraskan sehingga pengguna merasakan kesinambungan visual yang identik antara versi desktop dan versi web.

---

## 4. Evaluasi Ketahanan Tanpa Internet (*Offline-First Test*)

Berdasarkan pengujian simulasi laboratorium tanpa sambungan internet (*Airplane mode*):
1. **Peta Dasar (*Offline Basemap*):**  
   Saat tanpa koneksi ke server tile eksternal (OSM/Google Maps), WebGIS memanfaatkan poligon `batas_kelurahan.geojson` dengan fill `#FFFFFF` dan stroke `#D8DED4` di atas kanvas abu-abu lembut `#F3F6F4`. Hal ini memastikan orientasi spasial Kota Pontianak tetap terbaca jelas tanpa blank screen.
2. **Ketergantungan Aset Lokal (*Zero-CDN*):**  
   Semua dependensi JavaScript (`leaflet.js`, `leaflet.markercluster.js`, `leaflet.draw.js`), lembar gaya CSS, dan gambar icon marker disimpan di `public/libs/`. Network tab peramban mencatat **0 byte request keluar**, membuktikan kepatuhan penuh terhadap regulasi Open Lab.

---

## 5. Kesimpulan & Rekomendasi

1. **Kesimpulan:**  
   PjBL SIG Kelompok 3 berhasil menjembatani alur kerja SIG Desktop dan WebGIS. QGIS berperan optimal sebagai fondasi pengolahan dan validasi data vektor awal, sedangkan Leaflet JS + Node.js Express terbukti unggul dalam memberikan pengalaman pengguna yang interaktif, responsif, dan mudah dipahami publik.
2. **Rekomendasi Pengembangan Lanjutan:**
   - Menambahkan analisis spasial tingkat lanjut berbasis web (misalnya: *buffer proximity analysis* 1 km dari kampus menuju tempat belajar menggunakan Turf.js).
   - Menyediakan fitur *Export Map View to PDF / PNG* langsung dari browser untuk keperluan cetak draf laporan mahasiswa.
