# API Contract & GeoJSON Schema (`ptk-studyhub-gis`)

Dokumen ini merupakan kontrak teknis antara Backend (`server.js` — Rafli) dan Frontend (`public/app.js` — Jesika).

## 1. Base URL & Konfigurasi

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json; charset=utf-8`
- **CRS Wajib Seluruh Data Spasial:** `EPSG:4326` (WGS 84 — `[longitude, latitude]`).

---

## 2. Daftar Endpoint REST API

### A. Mengambil Data Spasial Layer

- **Method & URL:** `GET /api/data/:layer`
- **Parameter Path (`:layer`):**
  - `belajar` $\rightarrow$ membaca `data/tempat_belajar.geojson` _(Endpoint Wajib SK-3)_
  - `zona` $\rightarrow$ membaca `data/zona_belajar.geojson`
  - `kelurahan` $\rightarrow$ membaca `data/batas_kelurahan.geojson`
  - `sekolah` $\rightarrow$ membaca `data/sekolah.geojson`
  - `kampus` $\rightarrow$ membaca `data/kampus.geojson`
- **Response Sukses (`200 OK`):**
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [109.3425, -0.0563]
        },
        "properties": {
          "nama": "Perpustakaan Daerah Kalbar",
          "jenis": "Perpustakaan",
          "kapasitas": 120,
          "jam_operasional": "08:00 - 16:00",
          "gratis": "Ya"
        }
      }
    ]
  }
  Response Error (404 Not Found):JSON{ "error": "Layer tidak ditemukan" }
  ```

B. Mengambil Statistik Agregat Tempat BelajarMethod & URL: GET /api/stats/jenis (Endpoint Wajib SK-3)Deskripsi: Menghitung total seluruh lokasi, jumlah per kategori jenis, dan jumlah lokasi berstatus gratis secara langsung dari tempat_belajar.geojson.Response Sukses (200 OK)

```
 :JSON{
 "total": 28,
 "totalGratis": 18,
 "persenGratis": 64,
 "byJenis": {
   "perpustakaan": 10,
   "baca": 11,
   "coworking": 7
 }
 }
 (Catatan: Backend menormalisasi key byJenis menjadi lowercase standar perpustakaan, baca, coworking agar langsung cocok dengan state frontend).C. Menyimpan Poligon Zona Belajar Baru (Digitasi Web)Method & URL: POST /api/feature/zona (Endpoint Wajib SK-3)Request Body:JSON{
 "feature": {
   "type": "Feature",
   "geometry": {
     "type": "Polygon",
     "coordinates": [[[109.34, -0.05], [109.35, -0.05], [109.35, -0.06], [109.34, -0.05]]]
   },
   "properties": {
     "nama_zona": "Zona Literasi UNTAN",
     "keterangan": "Kawasan belajar terpadu sekitar kampus"
   }
 }
 }
 Response Sukses (201 Created):JSON{
 "message": "Zona belajar berhasil disimpan",
 "feature": { ... }
 }
 Response Error (400 Bad Request):JSON{ "error": "Format GeoJSON Feature tidak valid atau bukan Polygon" }
```

3. Standar Normalisasi Properti GeoJSON (tempat_belajar.geojson)Untuk menghindari ketidaksinkronan data dari CSV/QGIS, Backend dan Frontend sepakat menangani properti berikut:jenis: Dipetakan ke 3 kunci standar di frontend:Mengandung kata "perpustakaan" $\rightarrow$ key perpustakaanMengandung kata "baca" $\rightarrow$ key bacaMengandung kata "co-working" atau "coworking" $\rightarrow$ key coworkinggratis: Dianggap bernilai true jika nilai properti adalah true, "Ya", "ya", "Gratis", atau 1.kapasitas: Dikonversi dengan Number(kapasitas) || 0 untuk perbandingan rule-based labeling (kapasitas > 50).

---
