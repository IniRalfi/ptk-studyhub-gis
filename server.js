const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware wajib SK-3
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Mapping nama endpoint ke file GeoJSON di folder data/
const FILE_MAP = {
  belajar: "tempat_belajar.geojson",
  zona: "zona_belajar.geojson",
  kelurahan: "batas_kelurahan.geojson",
  sekolah: "sekolah.geojson",
  kampus: "kampus.geojson",
};

// 1. Endpoint GET data GeoJSON
app.get("/api/data/:layer", async (req, res) => {
  try {
    const fileName = FILE_MAP[req.params.layer];
    if (!fileName) {
      return res.status(404).json({ error: "Layer tidak ditemukan" });
    }
    const filePath = path.join(__dirname, "data", fileName);
    const rawData = await fs.readFile(filePath, "utf-8");
    res.json(JSON.parse(rawData));
  } catch (err) {
    res.status(500).json({ error: "Gagal membaca file GeoJSON", detail: err.message });
  }
});

// 2. Endpoint GET statistik berdasarkan jenis tempat belajar
app.get("/api/stats/jenis", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "tempat_belajar.geojson");
    const rawData = await fs.readFile(filePath, "utf-8");
    const geojson = JSON.parse(rawData);

    const stats = { total: geojson.features.length, byJenis: {} };
    geojson.features.forEach((feat) => {
      const jenis = feat.properties?.jenis || "Lainnya";
      stats.byJenis[jenis] = (stats.byJenis[jenis] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Gagal menghitung statistik", detail: err.message });
  }
});

// 3. Endpoint POST untuk menyimpan poligon zona belajar baru
app.post("/api/feature/zona", async (req, res) => {
  try {
    const newFeature = req.body.feature;
    if (!newFeature || newFeature.type !== "Feature") {
      return res.status(400).json({ error: "Format GeoJSON Feature tidak valid" });
    }

    const filePath = path.join(__dirname, "data", "zona_belajar.geojson");
    const rawData = await fs.readFile(filePath, "utf-8");
    const geojson = JSON.parse(rawData);

    geojson.features.push(newFeature);
    await fs.writeFile(filePath, JSON.stringify(geojson, null, 2), "utf-8");

    res.status(201).json({ message: "Zona belajar berhasil disimpan", feature: newFeature });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan fitur baru", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server WebGIS Kelompok 3 berjalan di http://localhost:${PORT}`);
});
