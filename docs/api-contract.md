# API Contract & GeoJSON Schema (`ptk-studyhub-gis`)

Dokumen ini merupakan kontrak teknis resmi antara **Backend (`server.js` — Rafli)** dan **Frontend (`public/app.js` — Jesika)**.

---

## 1. Base URL & Konfigurasi

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json; charset=utf-8`
- **CRS Wajib Seluruh Data Spasial:** `EPSG:4326` (WGS 84 — `[longitude, latitude]`).
- **Prinsip Lingkungan:** Zero-CDN Offline First (berjalan di Open Lab tanpa sambungan internet).

---

## 2. Daftar Endpoint REST API

### A. Mengambil Data Spasial Layer

Mengambil data spasial berformat GeoJSON `FeatureCollection` untuk layer yang diminta.

- **Method & URL:** `GET /api/data/:layer`
- **Parameter Path (`:layer`):**
  - `belajar` $\rightarrow$ membaca `data/tempat_belajar.geojson` *(Endpoint Wajib SK-3)*
  - `zona` $\rightarrow$ membaca `data/zona_belajar.geojson`
  - `kelurahan` $\rightarrow$ membaca `data/batas_kelurahan.geojson` *(Offline Basemap)*
  - `sekolah` $\rightarrow$ membaca `data/sekolah.geojson`
  - `kampus` $\rightarrow$ membaca `data/kampus.geojson`

- **Response Sukses (`200 OK`):**
  ```json
  {
    "type": "FeatureCollection",
    "name": "tempat_belajar",
    "crs": {
      "type": "name",
      "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
    },
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [109.314822, -0.032514]
        },
        "properties": {
          "nama": "Perpustakaan Umum Daerah Kota Pontianak",
          "jenis": "Perpustakaan",
          "latitude": -0.032514,
          "longitude": 109.314822,
          "kapasitas": 120,
          "jam_operasional": "07:30-16:00",
          "gratis": "Ya",
          "kode_jenis": "PER"
        }
      }
    ]
  }
  ```

- **Response Error (`404 Not Found`):**
  ```json
  {
    "error": "Layer tidak ditemukan"
  }
  ```

---

### B. Mengambil Statistik Agregat Tempat Belajar

Menghitung total seluruh lokasi, jumlah per kategori jenis, dan jumlah lokasi berstatus gratis secara langsung dari `data/tempat_belajar.geojson`.

- **Method & URL:** `GET /api/stats/jenis` *(Endpoint Wajib SK-3)*
- **Response Sukses (`200 OK`):**
  ```json
  {
    "total": 30,
    "totalGratis": 15,
    "persenGratis": 50,
    "byJenis": {
      "perpustakaan": 10,
      "baca": 5,
      "coworking": 15
    }
  }
  ```
  *(Catatan: Backend secara otomatis menormalisasi key `byJenis` menjadi huruf kecil standar `perpustakaan`, `baca`, `coworking` agar langsung cocok dengan objek `state.filters` frontend).*

---

### C. Menyimpan Poligon Zona Belajar Baru (Digitasi Web)

Menerima fitur poligon hasil digitasi interaktif dari frontend (`Leaflet.draw`), memvalidasi geometri, dan menyimpannya secara persisten ke `data/zona_belajar.geojson`.

- **Method & URL:** `POST /api/feature/zona` *(Endpoint Wajib SK-3)*
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "feature": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [109.34, -0.05],
            [109.35, -0.05],
            [109.35, -0.06],
            [109.34, -0.05]
          ]
        ]
      },
      "properties": {
        "nama_zona": "Zona Literasi UNTAN",
        "keterangan": "Kawasan belajar terpadu sekitar kampus"
      }
    }
  }
  ```

- **Response Sukses (`201 Created`):**
  ```json
  {
    "message": "Zona belajar berhasil disimpan",
    "feature": {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [109.34, -0.05],
            [109.35, -0.05],
            [109.35, -0.06],
            [109.34, -0.05]
          ]
        ]
      },
      "properties": {
        "nama_zona": "Zona Literasi UNTAN",
        "keterangan": "Kawasan belajar terpadu sekitar kampus",
        "fid": 3
      }
    }
  }
  ```

- **Response Error (`400 Bad Request`):**
  ```json
  {
    "error": "Format GeoJSON Feature tidak valid atau bukan Polygon"
  }
  ```

---

## 3. Standar Normalisasi Properti GeoJSON (`tempat_belajar.geojson`)

Untuk menghindari ketidaksinkronan data antara CSV, QGIS, dan Leaflet, Backend dan Frontend sepakat menangani properti berikut:

1. **`jenis`**:
   Dipetakan ke 3 kunci filter standar di frontend:
   - Mengandung kata `"perpustakaan"` $\rightarrow$ key `perpustakaan`
   - Mengandung kata `"baca"` $\rightarrow$ key `baca`
   - Mengandung kata `"working"` atau `"coworking"` $\rightarrow$ key `coworking`

2. **`gratis`**:
   Dianggap bernilai gratis (`true`) jika nilai properti adalah salah satu dari: `true`, `"true"`, `"Ya"`, `"ya"`, `"Gratis"`, `"gratis"`, `1`, atau `"1"`.

3. **`kapasitas`**:
   Dikonversi dengan `Number(feature.properties.kapasitas) || 0` untuk perbandingan *rule-based labeling* (`kapasitas > 50`).

4. **`koordinat`**:
   Standar GeoJSON urutan koordinat adalah `[longitude, latitude]`. Saat render ke Leaflet `L.latLng(lat, lng)`, pastikan membalik koordinat (`[coord[1], coord[0]]`).
