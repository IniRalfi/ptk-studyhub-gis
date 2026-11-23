const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware wajib SK-3 (Cross-OS safe with path.join)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Mapping nama parameter endpoint ke nama file GeoJSON di folder data/
const FILE_MAP = {
  belajar: "tempat_belajar.geojson",
  zona: "zona_belajar.geojson",
  kelurahan: "batas_kelurahan.geojson",
  sekolah: "sekolah.geojson",
  kampus: "kampus.geojson",
};

// Helper: Membaca file GeoJSON dengan penanganan fallback
async function readGeoJson(fileName) {
  const filePath = path.join(__dirname, "data", fileName);
  try {
    const rawData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(rawData);
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

// 1. Endpoint GET data GeoJSON layer
app.get("/api/data/:layer", async (req, res) => {
  try {
    const fileName = FILE_MAP[req.params.layer];
    if (!fileName) {
      return res.status(404).json({ error: "Layer tidak ditemukan" });
    }

    const geojson = await readGeoJson(fileName);
    if (!geojson) {
      return res.status(404).json({ error: `File data untuk layer '${req.params.layer}' belum tersedia` });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(geojson);
  } catch (err) {
    res.status(500).json({ error: "Gagal membaca file GeoJSON", detail: err.message });
  }
});

// 2. Endpoint GET statistik agregat berdasarkan jenis tempat belajar
app.get("/api/stats/jenis", async (req, res) => {
  try {
    const geojson = await readGeoJson("tempat_belajar.geojson");
    if (!geojson || !Array.isArray(geojson.features)) {
      return res.json({
        total: 0,
        totalGratis: 0,
        persenGratis: 0,
        byJenis: { perpustakaan: 0, baca: 0, coworking: 0 },
      });
    }

    let totalGratis = 0;
    const byJenis = {
      perpustakaan: 0,
      baca: 0,
      coworking: 0,
    };

    geojson.features.forEach((feat) => {
      const p = feat.properties || {};
      const jenisStr = (p.jenis || "").toLowerCase().trim();

      if (jenisStr.includes("perpustakaan")) {
        byJenis.perpustakaan++;
      } else if (jenisStr.includes("baca")) {
        byJenis.baca++;
      } else if (jenisStr.includes("working") || jenisStr.includes("coworking")) {
        byJenis.coworking++;
      }

      const g = p.gratis;
      if (
        g === true ||
        g === "true" ||
        g === "Ya" ||
        g === "ya" ||
        g === "Gratis" ||
        g === "gratis" ||
        g === 1 ||
        g === "1"
      ) {
        totalGratis++;
      }
    });

    const total = geojson.features.length;
    const persenGratis = total > 0 ? Math.round((totalGratis / total) * 100) : 0;

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({
      total,
      totalGratis,
      persenGratis,
      byJenis,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghitung statistik", detail: err.message });
  }
});

// 3. Endpoint POST untuk menyimpan poligon zona belajar baru (Digitasi Web)
app.post("/api/feature/zona", async (req, res) => {
  try {
    const newFeature = req.body?.feature;

    // Validasi struktur Feature dan geometri Polygon sesuai kontrak API
    if (
      !newFeature ||
      newFeature.type !== "Feature" ||
      !newFeature.geometry ||
      newFeature.geometry.type !== "Polygon" ||
      !Array.isArray(newFeature.geometry.coordinates) ||
      newFeature.geometry.coordinates.length === 0
    ) {
      return res.status(400).json({
        error: "Format GeoJSON Feature tidak valid atau bukan Polygon",
      });
    }

    const filePath = path.join(__dirname, "data", "zona_belajar.geojson");
    let geojson;

    try {
      const rawData = await fs.readFile(filePath, "utf-8");
      geojson = JSON.parse(rawData);
      if (!geojson.features || !Array.isArray(geojson.features)) {
        geojson = { type: "FeatureCollection", features: [] };
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        geojson = { type: "FeatureCollection", features: [] };
      } else {
        throw err;
      }
    }

    // Pastikan properti fid ada
    if (!newFeature.properties) {
      newFeature.properties = {};
    }
    if (!newFeature.properties.fid) {
      newFeature.properties.fid = geojson.features.length + 1;
    }

    geojson.features.push(newFeature);
    await fs.writeFile(filePath, JSON.stringify(geojson, null, 2), "utf-8");

    res.status(201).json({
      message: "Zona belajar berhasil disimpan",
      feature: newFeature,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan fitur baru", detail: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server WebGIS Kelompok 3 berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
