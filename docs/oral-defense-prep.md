# Panduan Tanya Jawab & Persiapan Oral Defense UAS SIGD (Kelompok 3)

Dokumen ini disusun sebagai panduan belajar cepat (*cheatsheet*) bagi seluruh anggota tim **Kelompok 3** dalam menghadapi sesi tanya jawab teknis (*Oral Defense*) di depan Dosen Penguji dan Asisten Laboratorium.

---

## 👥 Ringkasan Pembagian Peran & Alur Kerja

| Anggota | Kode | Fokus Tanggung Jawab Utama | Kata Kunci Teknis |
| :--- | :--- | :--- | :--- |
| **Timothy** | **SK-1** | Akuisisi, validasi, dan konversi data tabular & vektor mentah | CSV, Shapefile, GPKG, Pembersihan data, EPSG:4326 |
| **Virsya** | **SK-2** | Manajemen vektor di QGIS, simbologi kategori, labeling, & digitasi awal | Simbologi categorized, Rule-based labeling, Digitasi poligon zona |
| **Rafli** | **SK-3** | Backend REST API (Express), konversi GeoJSON, & persistensi data | Node.js, Express, `path.join`, fs/promises, API Contract, CORS/Zero-CDN |
| **Jesika** | **SK-4** | Frontend WebGIS (Leaflet JS, Bento Floating UI, State Controller) | Single source of truth, `renderBelajar()`, MarkerCluster, `Leaflet.draw` |
| **Syafira** | **SK-5** | Integrasi sistem, uji ketahanan offline, & evaluasi QGIS vs Leaflet | Offline basemap fallback, perbandingan spasial, cross-browser audit |

---

## 🎯 Bank Pertanyaan & Jawaban per Anggota Tim

### 1. Pertanyaan untuk Timothy (SK-1 — Data Acquisition & Geo-processing)

**Q1: Dari mana sumber data tempat belajar dan batas wilayah ini diperoleh? Bagaimana cara memastikan akurasinya?**  
> **Jawaban:**  
> "Data tempat belajar diperoleh dari hasil survei lapangan, data keterbukaan instansi perpustakaan daerah, serta pemetaan fasilitas publik OpenStreetMap Kota Pontianak. Akurasinya divalidasi dengan memverifikasi koordinat lintang-bujur terhadap citra satelit tegak resolusi tinggi di QGIS, memastikan setiap titik berada di daratan dan sesuai dengan fisik bangunan."

**Q2: Mengapa seluruh data wajib berkoordinat EPSG:4326?**  
> **Jawaban:**  
> "EPSG:4326 adalah standar koordinat geografis WGS 84 (Lintang/Bujur dalam derajat desimal) yang merupakan standar baku format GeoJSON sesuai spesifikasi RFC 7946. Format ini memudahkan interoperabilitas data antara QGIS dan pustaka pemetaan web seperti Leaflet."

---

### 2. Pertanyaan untuk Virsya (SK-2 — QGIS Symbology & Digitization)

**Q1: Bagaimana penentuan klasifikasi kategori dan pemilihan warna simbologinya di QGIS?**  
> **Jawaban:**  
> "Fasilitas tempat belajar diklasifikasikan menjadi 3 kategori fungsional: *Perpustakaan* (formal/akademik), *Taman Baca* (ruang literasi publik terbuka), dan *Co-working Space* (fasilitas belajar mandiri berbayar/kafe). Warnanya dirancang menggunakan palet *Sage & Orange* yang memenuhi standar aksesibilitas WCAG AA kontras visual tinggi: Hijau Zaitun `#5B6E2C` untuk Perpustakaan, Moss `#7D8D39` untuk Taman Baca, dan Signal Orange `#FF5A22` untuk Co-working."

**Q2: Bagaimana proses pembuatan poligon zona belajar di QGIS?**  
> **Jawaban:**  
> "Zona belajar dibuat menggunakan teknik digitasi poligon (*Add Polygon Feature*) dengan mengelompokkan klaster tempat belajar yang berdekatan dengan institusi pendidikan tinggi (seperti kawasan UNTAN dan IAIN Pontianak). Poligon disimpan dalam layer vektor GeoPackage dan diekspor ke GeoJSON."

---

### 3. Pertanyaan untuk Rafli (SK-3 — Backend REST API & Architecture)

**Q1: Mengapa menggunakan Node.js dan Express, dan bagaimana cara menjamin aplikasi bisa berjalan lintas OS (Linux & Windows)?**  
> **Jawaban:**  
> "Node.js dan Express dipilih karena arsitektur non-blocking I/O yang sangat cepat untuk melayani file data GeoJSON berbasis teks secara lokal. Untuk menjamin kompatibilitas Cross-OS antara pengembang Linux (CachyOS) dan Windows, seluruh operasi path file wajib menggunakan fungsi native `path.join(__dirname, ...)` sehingga tidak terjadi error path separator (`/` vs `\`)."

**Q2: Bagaimana alur kerja endpoint `POST /api/feature/zona` dan cara menjaga integritas datanya?**  
> **Jawaban:**  
> "Endpoint `POST /api/feature/zona` menerima payload GeoJSON Feature dari frontend. Server memvalidasi bahwa objek memiliki `type === 'Feature'` dan `geometry.type === 'Polygon'`. Jika valid, server membaca file `data/zona_belajar.geojson`, menambahkan feature baru dengan `fid` auto-increment, lalu menulis ulang file secara persisten menggunakan `fs.writeFile()`. Jika payload tidak sesuai, server mengembalikan status HTTP `400 Bad Request`."

**Q3: Bagaimana kalkulasi pada endpoint `GET /api/stats/jenis` dilakukan?**  
> **Jawaban:**  
> "Server membaca `tempat_belajar.geojson` dan melakukan agregasi secara dinamis di memori: menghitung total titik, menormalisasi string jenis ke tiga kunci standar (`perpustakaan`, `baca`, `coworking`), serta memeriksa status gratis dari berbagai variasi nilai (seperti boolean `true`, string `'Ya'`, atau `'Gratis'`). Hasilnya dikembalikan dalam bentuk JSON ringkas yang langsung dikonsumsi kartu statistik frontend."

---

### 4. Pertanyaan untuk Jesika (SK-4 — Frontend & State Management)

**Q1: Apa yang dimaksud dengan konsep *Single Source of Truth* pada file `app.js` dan mengapa itu penting?**  
> **Jawaban:**  
> "Konsep *Single Source of Truth* berarti seluruh kondisi antarmuka (filter kategori, status toggle gratis, mode cluster, query pencarian) hanya disimpan di satu tempat, yaitu objek global `state`. Ketika pengguna berinteraksi (misalnya mengklik tombol filter atau mengetik di search bar), event listener hanya mengubah nilai di dalam `state` lalu memanggil satu fungsi render terpusat, yaitu `renderBelajar()`. Hal ini mencegah manipulasi DOM atau layer peta yang tidak sinkron dan membuat kode mudah di-debug."

**Q2: Bagaimana cara beralih dari marker biasa ke mode cluster?**  
> **Jawaban:**  
> "Ketika `state.cluster === false`, titik dirender menggunakan `L.circleMarker` dengan radius 8px dan stroke putih 2.5px. Namun ketika `state.cluster === true`, titik dirender menggunakan `L.marker` dengan custom HTML `L.divIcon` yang dimasukkan ke dalam instance `L.markerClusterGroup()`. Fungsi cluster mengelompokkan titik yang berdekatan saat peta di-zoom out dan memekarkannya (*spiderfy*) saat di-zoom in."

**Q3: Bagaimana cara kerja *Rule-Based Labeling* pada frontend?**  
> **Jawaban:**  
> "Label teks permanen (`layer.bindTooltip`) hanya dipasang jika memenuhi dua kondisi aturan: nilai `state.showLabels === true` **DAN** kapasitas tempat belajar lebih dari 50 kursi (`Number(kapasitas) > 50`). Aturan ini dirancang agar kanvas peta tidak dipenuhi teks (*visual clutter*) ketika melihat peta dalam skala luas."

---

### 5. Pertanyaan untuk Syafira (SK-5 — System Integration & Spatial Evaluation)

**Q1: Bagaimana WebGIS ini bisa tetap menampilkan peta jika diuji di laboratorium yang mati internet total (*Zero-CDN Offline*)?**  
> **Jawaban:**  
> "WebGIS ini tidak bergantung pada koneksi internet sama sekali. Pertama, seluruh library JavaScript dan CSS (`Leaflet`, `MarkerCluster`, `Leaflet.draw`) disimpan secara lokal di folder `public/libs/`. Kedua, ketika tidak ada koneksi internet untuk mengunduh tile satelit eksternal, sistem secara otomatis merender poligon `batas_kelurahan.geojson` dengan warna putih dan garis batas halus di atas kanvas abu-abu sage `#F3F6F4` sebagai *offline basemap fallback*. Pengguna tetap dapat melihat batas administrasi 29 kelurahan Kota Pontianak secara akurat."

**Q2: Apa kelebihan utama WebGIS ini dibandingkan membuka file peta di QGIS Desktop?**  
> **Jawaban:**  
> "Meskipun QGIS memiliki kemampuan analisis geospasial yang sangat kompleks, penggunaannya memerlukan instalasi perangkat lunak berukuran besar dan keahlian teknis khusus. WebGIS menghadirkan informasi spasial literasi Kota Pontianak langsung ke peramban warga dan mahasiswa dengan antarmuka *Bento Floating UI* yang intuitif, pencarian cepat, filter interaktif, serta kemampuan menambahkan zona belajar baru secara instan tanpa perlu keahlian GIS."

---

## 💡 Tips Praktis Saat Ujian Oral Defense:
1. **Buka Terminal:** Tunjukkan eksekusi pengujian otomatis `npm test` untuk membuktikan 15 pengujian endpoint lulus 100%.
2. **Buka Browser DevTools:** Buka tab *Network*, centang opsi **Offline**, lalu refresh browser `http://localhost:3000`. Tunjukkan kepada penguji bahwa aplikasi tetap berjalan sempurna tanpa error merah satupun.
3. **Demo Digitasi:** Klik tombol `+ Tambah Zona`, gambar poligon baru di peta, simpan formulir, lalu refresh halaman untuk membuktikan data tersimpan permanen di backend.
