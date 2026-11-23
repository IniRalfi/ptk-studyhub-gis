# Design System & UI Blueprint (`ptk-studyhub-gis`)

Dokumen panduan antarmuka pengguna (_Bento Floating UI_) dengan estetika **Clean, Minimalist & Soft Aesthetic** untuk `public/index.html` dan `public/style.css`.

## 0. Arah Desain (Design Read)

> Dashboard WebGIS untuk warga dan mahasiswa Kota Pontianak, bahasa visual _calm civic data_.
> Dial: **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- **Focal point per layar:** kartu statistik (kiri atas). Semua elemen lain meredup terhadapnya.
- **Motif identitas:** legenda tiga titik warna kategori yang berulang di _stacked bar_, marker peta, _chip_ filter, dan baris daftar lokasi. Satu-satunya penggunaan warna hue di UI.
- **Aksen tunggal:** zaitun `#5B6E2C` untuk aksi dan state aktif. Moss `#7D8D39` dan oranye `#FF5A22` dipakai hanya sebagai _encoding_ kategori, bukan dekorasi.
- **Alasan keputusan** dicatat di Figma frame `Catatan desain` (section `WebGIS UI`).

Rujukan visual: file Figma `0k5P4h8J46vbsf77QANP8U`, section `WebGIS UI`, berisi frame `Desktop 1440 default`, `Mobile 390 default`, `Modal tambah zona`, dan `State loading & error`.

## 1. Filosofi Visual

- **Full-Bleed Map Canvas:** Peta interaktif memenuhi `100vw x 100vh` sebagai fokus utama.
- **Bento Floating Cards:** Komponen kontrol dan statistik disajikan dalam kartu-kartu putih bersih yang melayang di atas peta dengan sudut membulat (`border-radius: 16px`), border halus, dan bayangan lembut (_soft elevation_).
- **Satu permukaan per panel (revisi):** Kiri dan kanan masing-masing **satu panel**; bagian dalamnya dipisah _hairline_ `1px solid #E5E9F0`, bukan kartu-kartu kecil bertumpuk. Bayangan hanya milik elemen yang benar-benar mengambang di atas peta (dua panel, kapsul layer switcher, sheet mobile, FAB, popup, modal). Kartu di dalam panel tidak punya bayangan.
- **Zero-CDN Offline Styling:** Menggunakan Vanilla CSS murni dan _system font stack_ agar tampilan tetap konsisten 100% saat diuji tanpa internet di laboratorium.

---

## 2. Palet Warna (Sage dan Orange Palette)

### A. Permukaan & Teks (Surfaces & Typography)

- **Kanvas Latar Peta (Offline Fallback):** `#F3F6F4` (Sage Tint)
- **Poligon Batas Kelurahan (Offline Basemap):** Fill `#FFFFFF`, Stroke `#D8DED4` (1px)
- **Permukaan Panel Bento:** `#FFFFFF` dengan border `1px solid #E3E8DE`
- **Teks Utama (Heading / Angka):** `#20261C` (Deep Olive Ink, kontras 14.2:1 di atas kanvas)
- **Teks Sekunder (Label / Subtitle):** `#5C6752` (Sage Gray, 5.9:1 di atas putih)
- **Teks Caption/Faint:** `#8A9382`, hanya untuk keterangan 10px dan 11px
- **Tombol Utama (Primary Action):** Background `#20261C`, Teks `#FFFFFF`
- **Tombol Sekunder (Light Action):** Background `#EDF1E2`, Teks `#2F3A20`, Border `#D8DED4`

### B. Warna Kategori Spasial (Marker, Bar dan Badge)

Tiga hue kategori: hijau zaitun untuk taman baca, oranye untuk co-working, dan zaitun tua sebagai warna aksi/neutral utama.

- **Perpustakaan (kategori utama, warna aksi):**
  - Warna Utama (Marker / Bar): `#5B6E2C` (Olive)
  - Latar Badge: `#EDF1E2` | Teks Badge: `#5B6E2C` (4.9:1, lolos AA)
- **Taman Baca:**
  - Warna Utama (Marker / Bar): `#7D8D39` (Moss)
  - Latar Badge: `#F4F6E8` | Teks Badge: `#2F3A20` (12:1, lolos AA)
- **Co-working Space:**
  - Warna Utama (Marker / Bar): `#FF5A22` (Signal Orange)
  - Latar Badge: `#FFF1EB` | Teks Badge: `#B83C0C` (5.2:1, lolos AA)
- **Poligon Zona Belajar:**
  - Fill: `rgba(91, 110, 44, 0.14)` | Stroke: `#5B6E2C` (2px, dashed)

Semua teks badge kini memenuhi WCAG AA. Kontras marker terhadap putih: Olive 5.7:1, Moss 3.7:1, Orange 3.1:1; ketiganya cukup untuk elemen grafis (ambang 3:1 untuk non-teks, kecuali Moss dan Orange pada permukaan sangat terang tetap dibedakan lewat stroke putih 2.5px dan ukuran).

### C. Riwayat Kontras (Keputusan Owner)

Palet lama (biru `#4F86F7`, emerald `#34B38A`, amber `#F29F4B`) memiliki teks badge di bawah AA (3.58:1, 3.07:1) dan marker emerald/amber di bawah 3:1. Owner memilih mempertahankannya demi estetika soft. Pada revisi 22 November 2026, owner mengganti seluruh sistem warna ke palet sage dan orange di atas, sehingga catatan override kontras lama **tidak berlaku lagi**: semua teks badge kini lolos AA tanpa pengecualian.

### D. Radius (Hierarki, bukan seragam)

- Panel/kartu bento: `16px`. Baris daftar: tanpa kotak, hanya garis pemisah. Input & tombol: `10px`. Modal popup: `12px`.
- Pill (radius penuh) **hanya** untuk dua hal: _chip_ filter kategori dan kapsul _layer switcher_. Pill menandai elemen yang bisa dipilih, bukan gaya default. FAB mobile bulat penuh karena bentuk FAB memang bulat.

### E. Hierarki Tipografi (Skala Nyata)

Ukuran harus benar-benar berbeda antar tingkat, bukan bertengger di 11 sampai 13px:

- Angka statistik utama: `54px` Bold (focal point panel kiri).
- Judul panel/layar: `19px` Bold.
- Judul baris daftar: `13px` Semi Bold.
- Meta/sekunder: `11px` Regular.
- Keterangan sumber/caption: `10px` Regular warna `#8792A3`.
- Judul popup: `15px` Semi Bold.

---

## 3. Tata Letak & Hierarki Z-Index

Agar elemen UI melayang rapi di atas peta tanpa saling menutupi atau memblokir interaksi peta:

1. **`#map` (`z-index: 1`):** Kanvas peta penuh `100vw x 100vh`. Kontrol zoom bawaan Leaflet dipindahkan ke pojok kiri bawah (`bottomleft`) agar tidak bertabrakan dengan kartu kanan atas.
2. **`.bento-left` (`z-index: 1000`, posisi `top: 24px; left: 24px`, lebar `304px`):** **satu panel** berisi, dari atas ke bawah:
   - Baris konteks kecil (`PjBL SIG Dasar, Kelompok 3`, 10px faint, tanpa _eyebrow badge_).
   - Judul _"Pontianak Kota Literasi"_ (19px Bold) dan subjudul singkat.
   - _Hairline_ pemisah, lalu angka total `54px` Bold, status "18 gratis" + titik emerald, dan bar segmen 3 warna telanjang `6px` (tanpa track abu).
   - _Hairline_ pemisah, lalu tiga baris rincian kategori: titik warna, nama, jumlah rata kanan.
   - Caption sumber 10px: "Angka dari GET /api/stats/jenis".
3. **`.bento-right` (`z-index: 1000`, posisi `top: 24px; right: 24px`, lebar `344px`, tinggi maksimal `calc(100vh - 48px)`):** **satu panel** berisi kolom pencarian, _chip_ kategori, tiga _toggle switch_, _hairline_, judul "Lokasi terdekat" + counter "3 dari 28", daftar lokasi _hairline-separated_ (`overflow-y: auto`), dan baris _empty state_ di ujung daftar. Tombol `Tambah zona` (utama) dan `Reset peta` (sekunder) berada **di luar panel**, sejajar di bawahnya.
4. **`.bento-bottom-bar` (`z-index: 1000`, posisi `bottom: 24px; left: 50%; transform: translateX(-50%)`):**
   - Kapsul gelap `#20261C` berisi _layer switcher_ cepat (`Zona belajar`, `Batas kelurahan`, `Sekolah & kampus`); item aktif berupa kapsul putih di dalam kapsul gelap.
5. **`.modal-overlay` (`z-index: 2000`):**
   - Lapisan modal teratas di tengah layar dengan _backdrop_ lembut (`rgba(15, 23, 42, 0.35)`) untuk mengisi atribut poligon `zona_belajar` setelah selesai menggambar di peta. Field: nama zona, keterangan, ringkasan poligon, tombol `Simpan zona` dan `Batal`. Modal dapat ditutup dengan `Escape`.

6. **Mobile (`max-width: 640px`):** kartu kiri menjadi header ringkas + strip statistik horizontal di atas, panel kanan menjadi _sheet_ bawah yang menempati 45% tinggi layar, dan tombol `Tambah zona` menjadi FAB bulat `56px` (memenuhi tap target minimum 44px) di kanan bawah di atas sheet.

### State Wajib (R-27)

Setiap tampilan data wajib punya tiga state yang terlihat:

- **Loading:** teks "Memuat data peta" plus indikator putar, ditampilkan selama `Promise.all()` berjalan.
- **Error:** kotak merah lembut "Gagal memuat. Coba muat ulang" dengan tombol coba lagi.
- **Empty:** di daftar lokasi, "Tidak ada lokasi yang cocok" plus saran melonggarkan filter.

---

## 3b. Aturan Copy (Anti-Slop)

- Dilarang memakai em dash (`—`). Gunakan koma, titik, titik dua, atau tanda kurung.
- Label memakai _sentence case_ (`Total lokasi`, bukan `TOTAL LOKASI`), tanpa _letter-spacing_ lebar.
- Dilarang CTA generik (Get Started, Learn More, Explore). Tombol menyebut aksi sebenarnya: `Reset peta`, `Tambah zona`, `Simpan zona`.
- Dilarang angka karangan. Angka statistik diambil dari `GET /api/stats/jenis`; selama dataset `data/tempat_belajar.geojson` belum terisi, tampilkan state kosong, bukan angka contoh.

---

## 4. Desain Komponen Peta (Leaflet Custom Styling)

- **Normal Marker (`L.circleMarker`):** Radius `8px`, fill sesuai warna kategori, stroke putih `#FFFFFF` ketebalan `2.5px`, `fillOpacity: 0.92`.
- **Cluster Marker (`L.divIcon`):** Lingkaran bersih dengan _soft ring_ luar transparan dan angka tebal di tengah agar tetap selaras dengan estetika UI.
- **Custom Popup Card:** Sudut membulat `12px`, tanpa margin berlebih, menampilkan _badge_ kategori berwarna lembut di bagian atas, nama tempat belajar (`15px`, _semibold_), status **Gratis / Berbayar**, kapasitas kursi, dan jam operasional.
- **Rule-Based Label (`bindTooltip`):** Kapsul putih bersih (`font-size: 11px`, `border-radius: 6px`, bayangan halus) yang hanya muncul pada fitur dengan `kapasitas > 50` saat _toggle_ label aktif.

---

## 5. Aksesibilitas (Wajib Implementasi)

- Semua kontrol adalah elemen native (`button`, `input`, `label`) dengan `cursor: pointer`; dilarang `div` yang bisa diklik tanpa peran.
- Setiap kontrol punya nama yang bisa dibaca screen reader; tombol ikon (FAB `+`) wajib `aria-label="Tambah zona belajar"`.
- Navigasi keyboard: semua kontrol terjangkau `Tab`, tombol aktif dengan `Enter`/`Space`, modal tertutup dengan `Escape`, dan setiap elemen fokus menampilkan _focus ring_ yang jelas (dilarang `outline: none` tanpa pengganti).
- Toggle switch memakai `input type="checkbox"` asli yang di-_style_, bukan div animasi.
