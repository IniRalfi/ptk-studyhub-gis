# Development Roadmap — SK-3 & SK-4 (`ptk-studyhub-gis`)

Rencana kerja berurutan dari persiapan data, pengembangan paralel Backend & Frontend, integrasi, hingga pengujian offline dan _oral defense_.

## Alur Branching Git

- `main` — Kode stabil yang sudah terintegrasi dan teruji.
- `backend` — Branch kerja **Rafli (SK-3)**: konversi GeoJSON, `server.js`, dan REST API.
- `frontend` — Branch kerja **Jesika (SK-4)**: _Bento Floating UI_, Leaflet JS, _state management_, dan _Leaflet.draw_.

---

## Fase 1: Fondasi Repo & Konversi Data Spasial (Prasyarat SK-3)

_Target: Seluruh dataset siap dikonsumsi sebagai GeoJSON `EPSG:4326` di folder `data/`._

- [ ] Inisialisasi struktur folder (`data/`, `public/libs/`, `docs/`, `qgis/`) dan file perencanaan (`.md`) di branch `main`.
- [ ] Konversi `tempat_belajar.csv` (28 titik) ke `data/tempat_belajar.geojson` (`EPSG:4326`) + cek konsistensi kolom `nama`, `jenis`, `kapasitas`, `jam_operasional`, `gratis`.
- [ ] Konversi `batas_kelurahan.shp` ke `data/batas_kelurahan.geojson` (`EPSG:4326`) sebagai _fallback basemap_ offline.
- [ ] Konversi `kampus.gpkg` ke `data/kampus.geojson` (`EPSG:4326`).
- [ ] Salin `zona_belajar.geojson` dan `sekolah.geojson` ke folder `data/` serta validasi seluruh struktur JSON-nya.

## Fase 2: Pengembangan Paralel (`backend` & `frontend`)

### Jalur A — Branch `backend` (Rafli — SK-3)

- [ ] Setup `package.json` (`express`) dan middleware `express.static('public')` + `express.json()`.
- [ ] Implementasi `GET /api/data/:layer` (mendukung `belajar`, `zona`, `kelurahan`, `sekolah`, `kampus`) menggunakan `path.join(__dirname, ...)`.
- [ ] Implementasi `GET /api/stats/jenis` untuk menghitung total lokasi, total gratis, persentase gratis, dan jumlah per kategori (`perpustakaan`, `baca`, `coworking`).
- [ ] Implementasi `POST /api/feature/zona` untuk memvalidasi poligon baru dan menyimpannya ke `data/zona_belajar.geojson` via `fs.writeFile`.
- [ ] Uji seluruh endpoint dengan `curl` / browser untuk memastikan tidak ada error path di Linux maupun Windows.

### Jalur B — Branch `frontend` (Jesika — SK-4)

- [ ] Unduh dan simpan aset lokal `leaflet`, `leaflet.markercluster`, dan `leaflet-draw` ke `public/libs/` (tanpa link CDN).
- [ ] Bangun tata letak _Bento Floating UI_ (`public/index.html` & `public/style.css`) dengan palet _soft aesthetic_.
- [ ] Implementasi loading data paralel menggunakan `Promise.all()` untuk `/api/data/belajar`, `/api/data/zona`, `/api/data/kelurahan`, dan `/api/stats/jenis`.
- [ ] Implementasi objek `state` terpusat dan fungsi `renderBelajar()`:
  - Filter multi-kategori (`perpustakaan`, `baca`, `coworking`).
  - Filter `showGratis` dan pencarian teks (`searchQuery`).
  - Toggle `cluster` (beralih antara `L.circleMarker` dan `L.marker` + `L.divIcon` di `L.markerClusterGroup()`).
  - Rule-based labeling (`bindTooltip` permanen hanya untuk `kapasitas > 50`).
- [ ] Sinkronisasi daftar kartu lokasi di sidebar kanan dengan peta (`map.flyTo()` + buka _custom popup_ saat diklik).
- [ ] Implementasi digitasi poligon `Leaflet.draw` (`L.Draw.Event.CREATED`) + modal form atribut yang mengirim `POST` ke `/api/feature/zona`.

## Fase 3: Integrasi & Merge ke `main`

- [ ] Merge branch `backend` dan `frontend` ke `main`.
- [ ] Uji alur _end-to-end_: gambar poligon zona belajar baru di browser $\rightarrow$ simpan $\rightarrow$ _reload_ halaman $\rightarrow$ pastikan poligon baru tetap muncul.
- [ ] Pastikan kartu statistik di Bento Kiri menampilkan angka yang cocok dengan jumlah titik di peta.

## Fase 4: Simulasi Open Lab (Offline Test) & Persiapan Oral Defense

- [ ] **Uji Mati Internet (Airplane Mode):** Jalankan `npm start`, buka `http://localhost:3000`, pastikan peta dasar kelurahan, seluruh marker, cluster, dan digitasi berjalan tanpa error di DevTools Console.
- [ ] Latihan menjelaskan alur kode inti (`server.js`, `state`, `renderBelajar()`, `L.divIcon` pada MarkerCluster, dan `POST /api/feature/zona`) untuk kesiapan _oral defense_.
