# Design System & UI Blueprint (`ptk-studyhub-gis`)

Dokumen panduan antarmuka pengguna (_Bento Floating UI_) dengan estetika **Clean, Minimalist & Soft Aesthetic** untuk `public/index.html` dan `public/style.css`.

## 1. Filosofi Visual

- **Full-Bleed Map Canvas:** Peta interaktif memenuhi `100vw x 100vh` sebagai fokus utama.
- **Bento Floating Cards:** Komponen kontrol dan statistik disajikan dalam kartu-kartu putih bersih yang melayang di atas peta dengan sudut membulat (`border-radius: 16px`), border halus, dan bayangan lembut (_soft elevation_).
- **Zero-CDN Offline Styling:** Menggunakan Vanilla CSS murni dan _system font stack_ agar tampilan tetap konsisten 100% saat diuji tanpa internet di laboratorium.

---

## 2. Palet Warna (Soft & Clean Palette)

### A. Permukaan & Teks (Surfaces & Typography)

- **Kanvas Latar Peta (Offline Fallback):** `#F3F5F8` (Cool Soft Gray)
- **Poligon Batas Kelurahan (Offline Basemap):** Fill `#FFFFFF`, Stroke `#CBD5E1` (1px)
- **Permukaan Kartu Bento:** `rgba(255, 255, 255, 0.94)` dengan border `1px solid #E2E8F0`
- **Teks Utama (Heading / Angka):** `#1E293B` (Slate 800 — lembut namun tegas)
- **Teks Sekunder (Label / Subtitle):** `#64748B` (Slate 500)
- **Tombol Utama (Primary Action):** Background `#1E293B`, Teks `#FFFFFF`
- **Tombol Sekunder (Light Action):** Background `#F8FAFC`, Teks `#334155`, Border `#E2E8F0`

### B. Warna Kategori Spasial (Soft Muted Accents — Marker, Bar & Badge)

Warna dirancang lembut namun cukup kontras untuk dibedakan di atas peta dan digunakan konsisten di marker, _progress bar_, dan _badge_:

- **Perpustakaan:**
  - Warna Utama (Marker / Bar): `#4F86F7` (_Soft Royal Blue_)
  - Latar Badge Lembut: `#EFF6FF` | Teks Badge: `#2563EB`
- **Taman Baca:**
  - Warna Utama (Marker / Bar): `#34B38A` (_Soft Sage Emerald_)
  - Latar Badge Lembut: `#ECFDF5` | Teks Badge: `#059669`
- **Co-working Space:**
  - Warna Utama (Marker / Bar): `#F29F4B` (_Soft Warm Amber_)
  - Latar Badge Lembut: `#FFFBEB` | Teks Badge: `#D97706`
- **Poligon Zona Belajar:**
  - Fill: `rgba(79, 134, 247, 0.14)` | Stroke: `#4F86F7` (2px, dashed)

---

## 3. Tata Letak & Hierarki Z-Index

Agar elemen UI melayang rapi di atas peta tanpa saling menutupi atau memblokir interaksi peta:

1. **`#map` (`z-index: 1`):** Kanvas peta penuh `100vw x 100vh`. Kontrol zoom bawaan Leaflet dipindahkan ke pojok kiri bawah (`bottomleft`) agar tidak bertabrakan dengan kartu kanan atas.
2. **`.bento-left` (`z-index: 1000`, posisi `top: 20px; left: 20px`, lebar `300px`):**
   - **Header Card:** Badge kelompok, judul _"Pontianak Kota Literasi"_, dan subjudul singkat.
   - **Stat Card:** Angka besar total lokasi, _pill badge_ persentase gratis, _stacked progress bar_ 3 warna kategori, dan daftar rincian jumlah per kategori.
3. **`.bento-right` (`z-index: 1000`, posisi `top: 20px; right: 20px`, lebar `340px`, tinggi maksimal `calc(100vh - 40px)`):**
   - **Top Actions Bar:** Tombol `Reset Peta` dan tombol `+ Tambah Zona` (memicu mode digitasi poligon).
   - **Control & List Card:** Kolom pencarian cepat, filter _chip_ kategori (`Perpustakaan`, `Taman Baca`, `Co-working`), baris _toggle switch_ (`Hanya yang Gratis`, `MarkerCluster`, `Label Kapasitas > 50`), serta daftar lokasi yang dapat di-scroll (`overflow-y: auto`).
4. **`.bento-bottom-bar` (`z-index: 1000`, posisi `bottom: 24px; left: 50%; transform: translateX(-50%)`):**
   - Kapsul melayang berisi _layer switcher_ cepat (`Zona Belajar`, `Batas Kelurahan`, `Sekolah & Kampus`).
5. **`.modal-overlay` (`z-index: 2000`):**
   - Lapisan modal teratas di tengah layar dengan _backdrop_ lembut (`rgba(15, 23, 42, 0.35)`) untuk mengisi atribut poligon `zona_belajar` setelah selesai menggambar di peta.

---

## 4. Desain Komponen Peta (Leaflet Custom Styling)

- **Normal Marker (`L.circleMarker`):** Radius `8px`, fill sesuai warna kategori, stroke putih `#FFFFFF` ketebalan `2.5px`, `fillOpacity: 0.92`.
- **Cluster Marker (`L.divIcon`):** Lingkaran bersih dengan _soft ring_ luar transparan dan angka tebal di tengah agar tetap selaras dengan estetika UI.
- **Custom Popup Card:** Sudut membulat `12px`, tanpa margin berlebih, menampilkan _badge_ kategori berwarna lembut di bagian atas, nama tempat belajar (`15px`, _semibold_), status **Gratis / Berbayar**, kapasitas kursi, dan jam operasional.
- **Rule-Based Label (`bindTooltip`):** Kapsul putih bersih (`font-size: 11px`, `border-radius: 6px`, bayangan halus) yang hanya muncul pada fitur dengan `kapasitas > 50` saat _toggle_ label aktif.
