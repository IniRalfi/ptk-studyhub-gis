# Product Requirements Document (PRD)

**Nama Proyek:** `ptk-studyhub-gis` — WebGIS Persebaran Tempat Belajar Kota Pontianak  
**Kelompok:** Kelompok 3 (PjBL Sistem Informasi Geografis Dasar)

---

## 1. Tim & Pembagian Tugas

- **Timothy (SK-1):** Akuisisi & Validasi Data Spasial (`tempat_belajar.csv`, `batas_kelurahan.shp`, `sekolah.geojson`, `kampus.gpkg`).
- **Virsya (SK-2):** Manajemen Vektor, Simbologi, Labeling, & Digitasi Poligon (`zona_belajar.geojson`).
- **Rafli (SK-3):** Backend API (`Node.js` + `Express`) & Konversi Dataset ke GeoJSON (`EPSG:4326`).
- **Jesika (SK-4):** Frontend Interaktif (`Leaflet JS` + _Bento Floating UI_ + _State Management_).
- **Syafira (SK-5):** Integrasi Sistem, Analisis Perbandingan QGIS vs Leaflet, & Laporan Akhir PDF.

## 2. Tujuan & Ruang Lingkup Produk

Membangun aplikasi WebGIS lokal (_offline-ready_) yang memetakan fasilitas literasi dan tempat belajar di Kota Pontianak (Perpustakaan, Taman Baca, dan Co-working Space) dengan antarmuka modern bergaya _Bento Floating Cards_.

## 3. Spesifikasi Fitur Fungsional

### A. Tahap Persiapan Data (Konversi ke Web)

- Mengonversi `tempat_belajar.csv` (28 lokasi), `batas_kelurahan.shp`, dan `kampus.gpkg` ke format **GeoJSON (`EPSG:4326`)** di folder `data/`.
- Mengintegrasikan file `zona_belajar.geojson` dan `sekolah.geojson` yang sudah tersedia.

### B. Backend Service (`server.js` — SK-3)

1. **Static Web Server:** Menyajikan antarmuka frontend dari folder `public/`.
2. **Endpoint GeoJSON (`GET /api/data/:layer`):** Melayani data spasial untuk endpoint wajib `/api/data/belajar` serta layer pendukung (`zona`, `kelurahan`, `sekolah`, `kampus`).
3. **Endpoint Statistik (`GET /api/stats/jenis`):** Menghitung total keseluruhan lokasi, jumlah lokasi gratis, dan rincian jumlah per kategori `jenis` secara dinamis.
4. **Endpoint Digitasi Web (`POST /api/feature/zona`):** Memvalidasi struktur GeoJSON `Feature` poligon baru yang dikirim frontend dan menyimpannya secara persisten ke `data/zona_belajar.geojson`.

### C. Frontend WebGIS (`public/` — SK-4)

1. **Kanvas Peta & Fallback Offline:** Menampilkan peta Kota Pontianak dengan layer `batas_kelurahan.geojson` sebagai latar belakang wilayah saat tanpa internet, serta TileLayer OSM sebagai opsi saat terhubung jaringan.
2. **Visualisasi Simbologi:** Menampilkan titik tempat belajar dengan pembedaan warna berdasarkan kategori `jenis`.
3. **Panel Kontrol & State Terpusat (`renderBelajar()`):**
   - Filter multi-kategori (`Perpustakaan`, `Taman Baca`, `Co-working`).
   - Toggle `"Hanya yang Gratis"`.
   - Toggle `"MarkerCluster"` (peralihan dinamis antara `L.circleMarker` dan `L.marker` + `L.divIcon`).
   - Toggle `"Label Kapasitas > 50"`.
   - Filter cepat per kecamatan dan kolom pencarian nama tempat.
4. **Bento Dashboard & Daftar Lokasi Interaktif:**
   - Kartu statistik jumlah & persentase kategori dari `/api/stats/jenis`.
   - Daftar kartu lokasi yang sinkron dengan hasil filter; klik kartu akan menjalankan `map.flyTo()` dan membuka detail lokasi.
5. **Digitasi Poligon Interaktif:** Tombol `+ Tambah Zona` mengaktifkan mode gambar poligon (`Leaflet.draw`) dan membuka modal formulir atribut sebelum dikirim ke `POST /api/feature/zona`.

## 4. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Seluruh aplikasi berjalan offline di `http://localhost:3000` tanpa error request eksternal.
- [ ] Minimal 28 titik tempat belajar di minimal 3 kecamatan tervisualisasi akurat di Kota Pontianak.
- [ ] Kombinasi filter kategori, filter gratis, pencarian, dan cluster berjalan sinkron melalui fungsi `renderBelajar()`.
- [ ] Penambahan poligon zona belajar dari browser tersimpan permanen di `data/zona_belajar.geojson` setelah _reload_.
