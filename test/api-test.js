const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const app = require("../server");

const TEST_PORT = 3456;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function request(method, pathUrl, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {},
    };

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("🚀 Menjalankan Skrip Pengujian Backend (SK-3) ...\n");
  const server = app.listen(TEST_PORT);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = "") {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // Simpan backup zona_belajar.geojson sebelum test modifikasi
  const zonaPath = path.join(__dirname, "..", "data", "zona_belajar.geojson");
  let originalZonaContent = null;
  try {
    originalZonaContent = await fs.readFile(zonaPath, "utf-8");
  } catch (e) {}

  try {
    // Test 1: GET /api/data/belajar
    const resBelajar = await request("GET", "/api/data/belajar");
    assert(resBelajar.status === 200, "GET /api/data/belajar returns 200");
    assert(
      resBelajar.body && resBelajar.body.type === "FeatureCollection",
      "GET /api/data/belajar returns FeatureCollection"
    );
    assert(
      resBelajar.body && resBelajar.body.features && resBelajar.body.features.length >= 28,
      `GET /api/data/belajar features count >= 28 (Actual: ${resBelajar.body?.features?.length})`
    );

    // Test 2: GET layer pendukung (zona, kelurahan, sekolah, kampus)
    for (const layer of ["zona", "kelurahan", "sekolah", "kampus"]) {
      const resLayer = await request("GET", `/api/data/${layer}`);
      assert(
        resLayer.status === 200 && resLayer.body && resLayer.body.type === "FeatureCollection",
        `GET /api/data/${layer} returns 200 & valid FeatureCollection`
      );
    }

    // Test 3: GET layer yang tidak ada
    const resNotFound = await request("GET", "/api/data/layer_gaib");
    assert(resNotFound.status === 404, "GET /api/data/layer_gaib returns 404");
    assert(
      resNotFound.body && resNotFound.body.error === "Layer tidak ditemukan",
      "GET /api/data/layer_gaib returns expected error message"
    );

    // Test 4: GET /api/stats/jenis
    const resStats = await request("GET", "/api/stats/jenis");
    assert(resStats.status === 200, "GET /api/stats/jenis returns 200");
    assert(
      resStats.body &&
        typeof resStats.body.total === "number" &&
        typeof resStats.body.totalGratis === "number" &&
        typeof resStats.body.persenGratis === "number" &&
        resStats.body.byJenis &&
        typeof resStats.body.byJenis.perpustakaan === "number" &&
        typeof resStats.body.byJenis.baca === "number" &&
        typeof resStats.body.byJenis.coworking === "number",
      `GET /api/stats/jenis returns valid schema (Total: ${resStats.body?.total}, Gratis: ${resStats.body?.totalGratis}, %: ${resStats.body?.persenGratis}%)`
    );

    // Test 5: POST /api/feature/zona - Invalid Payload
    const resInvalidPost = await request("POST", "/api/feature/zona", {
      feature: { type: "Feature", geometry: { type: "Point", coordinates: [109.34, -0.05] } },
    });
    assert(
      resInvalidPost.status === 400,
      "POST /api/feature/zona with non-Polygon returns 400"
    );

    // Test 6: POST /api/feature/zona - Valid Polygon
    const validPolygonFeature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [109.34, -0.05],
            [109.35, -0.05],
            [109.35, -0.06],
            [109.34, -0.05],
          ],
        ],
      },
      properties: {
        nama_zona: "Zona Literasi UNTAN Test",
        keterangan: "Kawasan belajar terpadu uji coba otomatis",
      },
    };

    const resValidPost = await request("POST", "/api/feature/zona", {
      feature: validPolygonFeature,
    });
    assert(resValidPost.status === 201, "POST /api/feature/zona with valid Polygon returns 201");
    assert(
      resValidPost.body && resValidPost.body.message === "Zona belajar berhasil disimpan",
      "POST /api/feature/zona returns success message"
    );

    // Test 7: Verifikasi data zona tersimpan permanen
    const resVerifyZona = await request("GET", "/api/data/zona");
    const found = resVerifyZona.body.features.find(
      (f) => f.properties?.nama_zona === "Zona Literasi UNTAN Test"
    );
    assert(Boolean(found), "POST /api/feature/zona persists feature in zona_belajar.geojson");

  } finally {
    // Restore file zona_belajar.geojson ke kondisi semula
    if (originalZonaContent) {
      await fs.writeFile(zonaPath, originalZonaContent, "utf-8");
    }
    server.close();
  }

  console.log(`\n📊 Ringkasan Pengujian: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 Semua pengujian Backend SK-3 berhasil 100%!");
  }
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
