/**
 * ptk-studyhub-gis — WebGIS Persebaran Tempat Belajar Kota Pontianak
 * Frontend Controller (SK-4 Jesika)
 * Zero-CDN Offline-First Architecture & Single Source of Truth State
 */

// ==========================================================================
// 1. Single Source of Truth State (Wajib sesuai AGENTS.md)
// ==========================================================================
const state = {
  filters: {
    perpustakaan: true,
    baca: true,
    coworking: true,
  },
  cluster: false,
  showGratis: false,
  showLabels: true,
  kecamatan: 'all',
  searchQuery: '',
};

// ==========================================================================
// 2. Variabel Modul & GeoJSON Data
// ==========================================================================
let dataBelajar = null;
let dataZona = null;
let dataKelurahan = null;
let dataSekolah = null;
let dataKampus = null;

// Leaflet Map & Layer Groups
let map = null;
let kelurahanLayerGroup = null;
let zonaLayerGroup = null;
let belajarLayerGroup = null;
let clusterGroup = null;
let sekolahKampusLayerGroup = null;
let drawPolygonHandler = null;
let currentDrawnLayer = null;

// Map markers index for synchronized click interactions
let markersMap = new Map();

// Koordinat Pusat Kota Pontianak
const PONTIANAK_CENTER = [-0.032, 109.338];
const PONTIANAK_DEFAULT_ZOOM = 13;

// ==========================================================================
// 3. Helper Normalisasi Data Spasial
// ==========================================================================

/**
 * Normalisasi string jenis tempat belajar ke 3 kategori baku
 */
function getNormalizedJenis(jenisStr) {
  const s = (jenisStr || '').toLowerCase().trim();
  if (s.includes('perpustakaan')) return 'perpustakaan';
  if (s.includes('baca')) return 'baca';
  if (s.includes('working') || s.includes('coworking')) return 'coworking';
  return 'perpustakaan';
}

/**
 * Normalisasi nilai gratis dari berbagai format (true, "Ya", 1, dll.)
 */
function isGratis(g) {
  return (
    g === true ||
    g === 'true' ||
    g === 'Ya' ||
    g === 'ya' ||
    g === 'Gratis' ||
    g === 'gratis' ||
    g === 1 ||
    g === '1'
  );
}

/**
 * Mengambil kode warna utama per kategori (Sage & Orange Palette)
 */
function getCategoryColor(cat) {
  switch (cat) {
    case 'perpustakaan':
      return '#5B6E2C'; // Olive
    case 'baca':
      return '#7D8D39'; // Moss
    case 'coworking':
      return '#FF5A22'; // Signal Orange
    default:
      return '#5B6E2C';
  }
}

/**
 * Mengambil label human-readable per kategori
 */
function getCategoryLabel(cat) {
  switch (cat) {
    case 'perpustakaan':
      return 'Perpustakaan';
    case 'baca':
      return 'Taman Baca';
    case 'coworking':
      return 'Co-working';
    default:
      return 'Tempat Belajar';
  }
}

// ==========================================================================
// 4. Inisialisasi Peta Leaflet
// ==========================================================================
function initMap() {
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  }).setView(PONTIANAK_CENTER, PONTIANAK_DEFAULT_ZOOM);

  // Pindahkan kontrol zoom bawaan Leaflet ke bottomleft agar tidak menabrak Bento kanan
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  // Inisialisasi Layer Groups
  kelurahanLayerGroup = L.geoJSON(null, {
    style: {
      fillColor: '#FFFFFF',
      weight: 1,
      opacity: 1,
      color: '#D8DED4',
      fillOpacity: 0.85,
    },
    onEachFeature: function (feature, layer) {
      const p = feature.properties || {};
      const kel = p.KELURAHAN || p.WADMKD || p.NAMOBJ || 'Kelurahan';
      const kec = p.KECAMATAN || p.WADMKC || '';
      layer.bindTooltip(`<strong>${kel}</strong>${kec ? '<br><span style="font-size:10px;color:#5C6752;">Kec. ' + kec + '</span>' : ''}`, {
        sticky: true,
        direction: 'top',
        className: 'custom-tooltip',
      });
    },
  }).addTo(map);

  zonaLayerGroup = L.geoJSON(null, {
    style: {
      fillColor: 'rgba(91, 110, 44, 0.14)',
      weight: 2,
      dashArray: '5, 5',
      color: '#5B6E2C',
      fillOpacity: 0.14,
    },
    onEachFeature: function (feature, layer) {
      const p = feature.properties || {};
      const nama = p.nama_zona || 'Zona Belajar';
      const ket = p.keterangan || '-';
      layer.bindPopup(`
        <div class="popup-container">
          <div class="popup-header">
            <span class="popup-badge perpustakaan">Zona Belajar</span>
          </div>
          <h3 class="popup-name">${nama}</h3>
          <div class="popup-details">
            <div class="popup-detail-row"><span>Keterangan:</span> <span>${ket}</span></div>
          </div>
        </div>
      `);
    },
  }).addTo(map);

  belajarLayerGroup = L.layerGroup().addTo(map);

  // Inisialisasi MarkerClusterGroup dengan custom divIcon
  clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 45,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="marker-cluster-custom"><div>${count}</div></div>`,
        className: 'custom-cluster-wrapper',
        iconSize: L.point(40, 40),
      });
    },
  });

  sekolahKampusLayerGroup = L.layerGroup();

  // Inisialisasi Leaflet Draw Handler untuk menggambar poligon zona
  drawPolygonHandler = new L.Draw.Polygon(map, {
    shapeOptions: {
      color: '#5B6E2C',
      weight: 2,
      dashArray: '5, 5',
      fillColor: 'rgba(91, 110, 44, 0.2)',
      fillOpacity: 0.2,
    },
  });

  map.on(L.Draw.Event.CREATED, function (e) {
    currentDrawnLayer = e.layer;
    const geojson = e.layer.toGeoJSON();
    openModalTambahZona(geojson);
  });
}

// ==========================================================================
// 5. Inisialisasi Aplikasi & Loading Data Paralel (Promise.all)
// ==========================================================================
async function initApp() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorOverlay = document.getElementById('error-overlay');
  const errorMsg = document.getElementById('error-message');

  try {
    loadingOverlay.style.display = 'flex';
    errorOverlay.style.display = 'none';

    // Inisialisasi peta Leaflet
    if (!map) {
      initMap();
    }

    // Panggil seluruh data backend secara paralel
    const [resBelajar, resZona, resKelurahan, resStats] = await Promise.all([
      fetch('/api/data/belajar').then((r) => {
        if (!r.ok) throw new Error('Gagal mengambil data tempat belajar');
        return r.json();
      }),
      fetch('/api/data/zona').then((r) => {
        if (!r.ok) throw new Error('Gagal mengambil data zona');
        return r.json();
      }),
      fetch('/api/data/kelurahan').then((r) => {
        if (!r.ok) throw new Error('Gagal mengambil data kelurahan');
        return r.json();
      }),
      fetch('/api/stats/jenis').then((r) => {
        if (!r.ok) throw new Error('Gagal mengambil statistik');
        return r.json();
      }),
    ]);

    dataBelajar = resBelajar;
    dataZona = resZona;
    dataKelurahan = resKelurahan;

    // Render statistik di Bento Kiri
    renderStats(resStats);

    // Render basemap kelurahan & zona belajar
    if (dataKelurahan) kelurahanLayerGroup.addData(dataKelurahan);
    if (dataZona) zonaLayerGroup.addData(dataZona);

    // Render titik tempat belajar berdasarkan default state
    renderBelajar();

    // Sembunyikan loading
    loadingOverlay.style.display = 'none';
  } catch (err) {
    console.error('Error saat inisialisasi WebGIS:', err);
    loadingOverlay.style.display = 'none';
    errorMsg.textContent = 'Gagal memuat data WebGIS: ' + (err.message || 'Koneksi terputus');
    errorOverlay.style.display = 'flex';
  }
}

// ==========================================================================
// 6. Render Statistik di Bento Kiri (GET /api/stats/jenis)
// ==========================================================================
function renderStats(stats) {
  if (!stats) return;

  const total = stats.total || 0;
  const gratis = stats.totalGratis || 0;
  const persenGratis = stats.persenGratis || (total > 0 ? Math.round((gratis / total) * 100) : 0);
  const byJenis = stats.byJenis || { perpustakaan: 0, baca: 0, coworking: 0 };

  // Elemen DOM
  const elTotal = document.getElementById('stat-total');
  const elGratisText = document.getElementById('stat-gratis-text');
  const elCountPerpustakaan = document.getElementById('stat-count-perpustakaan');
  const elCountBaca = document.getElementById('stat-count-baca');
  const elCountCoworking = document.getElementById('stat-count-coworking');

  if (elTotal) elTotal.textContent = total;
  if (elGratisText) elGratisText.textContent = `${gratis} gratis (${persenGratis}%)`;
  if (elCountPerpustakaan) elCountPerpustakaan.textContent = byJenis.perpustakaan || 0;
  if (elCountBaca) elCountBaca.textContent = byJenis.baca || 0;
  if (elCountCoworking) elCountCoworking.textContent = byJenis.coworking || 0;

  // Rasio 3 warna telanjang (stat-bar)
  const barSegPerpustakaan = document.querySelector('.seg-perpustakaan');
  const barSegBaca = document.querySelector('.seg-baca');
  const barSegCoworking = document.querySelector('.seg-coworking');

  if (total > 0) {
    const pPerpus = ((byJenis.perpustakaan || 0) / total) * 100;
    const pBaca = ((byJenis.baca || 0) / total) * 100;
    const pCoworking = ((byJenis.coworking || 0) / total) * 100;

    if (barSegPerpustakaan) barSegPerpustakaan.style.width = `${pPerpus}%`;
    if (barSegBaca) barSegBaca.style.width = `${pBaca}%`;
    if (barSegCoworking) barSegCoworking.style.width = `${pCoworking}%`;
  }
}

// ==========================================================================
// 7. Logika Utama: renderBelajar() (Single Source of Truth)
// ==========================================================================
function renderBelajar() {
  if (!dataBelajar || !Array.isArray(dataBelajar.features)) return;

  // Bersihkan layer sebelumnya
  belajarLayerGroup.clearLayers();
  clusterGroup.clearLayers();
  map.removeLayer(clusterGroup);
  map.removeLayer(belajarLayerGroup);
  markersMap.clear();

  const query = (state.searchQuery || '').toLowerCase().trim();

  // Saring fitur berdasarkan state
  const filteredFeatures = dataBelajar.features.filter((feat) => {
    const p = feat.properties || {};
    const cat = getNormalizedJenis(p.jenis);

    // 1. Saring Kategori
    if (!state.filters[cat]) return false;

    // 2. Saring Status Gratis
    if (state.showGratis && !isGratis(p.gratis)) return false;

    // 3. Saring Query Pencarian Nama Tempat
    if (query) {
      const nama = (p.nama || '').toLowerCase();
      if (!nama.includes(query)) return false;
    }

    return true;
  });

  // Render Daftar Lokasi di Bento Kanan
  renderLocationList(filteredFeatures);

  // Render Titik di Peta Leaflet
  filteredFeatures.forEach((feat, index) => {
    const coords = feat.geometry && feat.geometry.coordinates;
    if (!coords || coords.length < 2) return;

    // Koordinat GeoJSON: [lng, lat] -> Leaflet: [lat, lng]
    const lng = coords[0];
    const lat = coords[1];
    const p = feat.properties || {};
    const cat = getNormalizedJenis(p.jenis);
    const catColor = getCategoryColor(cat);
    const catLabel = getCategoryLabel(cat);
    const gratisBool = isGratis(p.gratis);
    const kapasitasNum = Number(p.kapasitas) || 0;
    const jamBuka = p.jam_operasional || '08:00 - 17:00';

    // Konten Popup Standar
    const popupHtml = `
      <div class="popup-container">
        <div class="popup-header">
          <span class="popup-badge ${cat}">${catLabel}</span>
          ${gratisBool ? '<span class="loc-gratis-tag">Gratis</span>' : '<span style="font-size:11px;color:#8A9382;">Berbayar</span>'}
        </div>
        <h3 class="popup-name">${p.nama || 'Tempat Belajar'}</h3>
        <div class="popup-details">
          <div class="popup-detail-row"><span>Kapasitas:</span> <strong>${kapasitasNum} kursi</strong></div>
          <div class="popup-detail-row"><span>Jam Buka:</span> <span>${jamBuka}</span></div>
          <div class="popup-detail-row"><span>Status:</span> <span class="${gratisBool ? 'val-gratis' : ''}">${gratisBool ? 'Gratis' : 'Berbayar'}</span></div>
        </div>
      </div>
    `;

    let marker;

    if (state.cluster) {
      // Saat cluster aktif: gunakan L.marker dengan L.divIcon
      const customIcon = L.divIcon({
        className: 'custom-single-marker',
        html: `<div style="background-color:${catColor};width:16px;height:16px;border-radius:50%;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(popupHtml);

      // Rule-Based Labeling: kapasitas > 50 & state.showLabels === true
      if (state.showLabels && kapasitasNum > 50) {
        marker.bindTooltip(p.nama || '', {
          permanent: true,
          direction: 'top',
          className: 'custom-tooltip',
          offset: [0, -10],
        });
      }

      clusterGroup.addLayer(marker);
    } else {
      // Saat cluster tidak aktif: gunakan L.circleMarker
      marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: catColor,
        color: '#FFFFFF',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.92,
      });
      marker.bindPopup(popupHtml);

      // Rule-Based Labeling: kapasitas > 50 & state.showLabels === true
      if (state.showLabels && kapasitasNum > 50) {
        marker.bindTooltip(p.nama || '', {
          permanent: true,
          direction: 'top',
          className: 'custom-tooltip',
          offset: [0, -10],
        });
      }

      belajarLayerGroup.addLayer(marker);
    }

    // Simpan referensi marker untuk trigger flyTo dari daftar lokasi
    markersMap.set(index, { marker, lat, lng });
  });

  // Tambahkan layer aktif ke peta
  if (state.cluster) {
    map.addLayer(clusterGroup);
  } else {
    map.addLayer(belajarLayerGroup);
  }
}

// ==========================================================================
// 8. Render Daftar Lokasi di Bento Kanan
// ==========================================================================
function renderLocationList(features) {
  const container = document.getElementById('location-list');
  const counterEl = document.getElementById('location-counter');
  const emptyEl = document.getElementById('location-empty');

  const totalFeatures = (dataBelajar && dataBelajar.features) ? dataBelajar.features.length : 0;
  if (counterEl) {
    counterEl.textContent = `${features.length} dari ${totalFeatures}`;
  }

  if (!container) return;
  container.innerHTML = '';

  if (features.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  features.forEach((feat, index) => {
    const p = feat.properties || {};
    const cat = getNormalizedJenis(p.jenis);
    const catLabel = getCategoryLabel(cat);
    const gratisBool = isGratis(p.gratis);
    const kapasitasNum = Number(p.kapasitas) || 0;
    const jamBuka = p.jam_operasional || '08:00 - 17:00';

    const item = document.createElement('div');
    item.className = 'location-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `${p.nama || 'Tempat belajar'}, kategori ${catLabel}`);

    item.innerHTML = `
      <div class="loc-top">
        <span class="loc-title">${p.nama || 'Tempat Belajar'}</span>
        <span class="loc-badge ${cat}">${catLabel}</span>
      </div>
      <div class="loc-meta">
        <span class="loc-meta-item">🪑 ${kapasitasNum} kursi</span>
        <span class="loc-meta-item">⏰ ${jamBuka}</span>
        ${gratisBool ? '<span class="loc-meta-item loc-gratis-tag">✓ Gratis</span>' : ''}
      </div>
    `;

    // Interaksi klik: Sorot & FlyTo lokasi di peta
    const handleSelectLocation = () => {
      document.querySelectorAll('.location-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');

      const markerData = markersMap.get(index);
      if (markerData && map) {
        map.flyTo([markerData.lat, markerData.lng], 16, { duration: 1.2 });
        setTimeout(() => {
          markerData.marker.openPopup();
        }, 1250);
      }
    };

    item.addEventListener('click', handleSelectLocation);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelectLocation();
      }
    });

    container.appendChild(item);
  });
}

// ==========================================================================
// 9. Modal Tambah Zona & POST API (/api/feature/zona)
// ==========================================================================
function openModalTambahZona(geojsonFeature) {
  const modal = document.getElementById('modal-zona');
  const summaryEl = document.getElementById('summary-coord-text');
  const inputNama = document.getElementById('input-nama-zona');
  const inputKet = document.getElementById('input-keterangan');

  if (summaryEl && geojsonFeature.geometry && geojsonFeature.geometry.coordinates) {
    const ring = geojsonFeature.geometry.coordinates[0] || [];
    summaryEl.textContent = `Poligon dengan ${ring.length} titik koordinat`;
  }

  if (inputNama) inputNama.value = '';
  if (inputKet) inputKet.value = '';

  modal.style.display = 'flex';
  if (inputNama) inputNama.focus();
}

function closeModalTambahZona() {
  const modal = document.getElementById('modal-zona');
  if (modal) modal.style.display = 'none';

  if (currentDrawnLayer && map) {
    map.removeLayer(currentDrawnLayer);
    currentDrawnLayer = null;
  }
}

async function submitZonaBaru(featureWithProps) {
  try {
    const response = await fetch('/api/feature/zona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: featureWithProps }),
    });

    if (response.ok) {
      const result = await response.json();
      const savedFeature = result.feature || featureWithProps;

      // Tambahkan ke layer group zona di peta
      zonaLayerGroup.addData(savedFeature);

      // Sinkronkan ke data lokal dataZona
      if (dataZona && Array.isArray(dataZona.features)) {
        dataZona.features.push(savedFeature);
      }

      closeModalTambahZona();
      alert('Zona belajar baru berhasil disimpan ke basis data spasial!');
    } else {
      const errRes = await response.json();
      alert('Gagal menyimpan zona: ' + (errRes.error || response.statusText));
    }
  } catch (err) {
    console.error('Error menyimpan zona baru:', err);
    alert('Terjadi kesalahan jaringan saat menyimpan zona baru.');
  }
}

// ==========================================================================
// 10. Pengalih Layer Sekolah & Kampus (Lazy Loading)
// ==========================================================================
async function loadSekolahKampusLayers() {
  if (dataSekolah && dataKampus) return;

  try {
    const [resSekolah, resKampus] = await Promise.all([
      fetch('/api/data/sekolah').then((r) => r.json()),
      fetch('/api/data/kampus').then((r) => r.json()),
    ]);

    dataSekolah = resSekolah;
    dataKampus = resKampus;

    // Render Kampus (warna ungu lembut)
    if (dataKampus && dataKampus.features) {
      dataKampus.features.forEach((feat) => {
        const coords = feat.geometry && feat.geometry.coordinates;
        if (!coords) return;
        const p = feat.properties || {};
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: 6,
          fillColor: '#673AB7',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 0.85,
        }).bindPopup(`
          <div class="popup-container">
            <div class="popup-header">
              <span class="popup-badge kampus">Kampus / PT</span>
            </div>
            <h3 class="popup-name">${p.nama || p.NAMOBJ || 'Perguruan Tinggi'}</h3>
          </div>
        `);
        sekolahKampusLayerGroup.addLayer(marker);
      });
    }

    // Render Sekolah (warna indigo)
    if (dataSekolah && dataSekolah.features) {
      dataSekolah.features.forEach((feat) => {
        const coords = feat.geometry && feat.geometry.coordinates;
        if (!coords) return;
        const p = feat.properties || {};
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: 5,
          fillColor: '#3F51B5',
          color: '#FFFFFF',
          weight: 1.5,
          fillOpacity: 0.8,
        }).bindPopup(`
          <div class="popup-container">
            <div class="popup-header">
              <span class="popup-badge sekolah">Sekolah</span>
            </div>
            <h3 class="popup-name">${p.nama || p.NAMOBJ || 'Sekolah'}</h3>
          </div>
        `);
        sekolahKampusLayerGroup.addLayer(marker);
      });
    }
  } catch (err) {
    console.warn('Gagal memuat layer sekolah & kampus:', err);
  }
}

// ==========================================================================
// 11. Event Listeners & Binding Interaksi UI
// ==========================================================
function setupEventListeners() {
  // --- A. Chips Filter Kategori ---
  const chips = document.querySelectorAll('.chip-pill');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-kategori');
      if (!cat) return;

      // Perbarui objek state (Single Source of Truth)
      state.filters[cat] = !state.filters[cat];

      // Perbarui kelas visual tombol chip
      if (state.filters[cat]) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }

      // Re-render peta dan daftar
      renderBelajar();
    });
  });

  // --- B. Search Input (Debounced) ---
  const searchInput = document.getElementById('search-input');
  let searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderBelajar();
      }, 250);
    });
  }

  // --- C. Toggle Switches ---
  const toggleGratis = document.getElementById('toggle-gratis');
  if (toggleGratis) {
    toggleGratis.addEventListener('change', (e) => {
      state.showGratis = e.target.checked;
      renderBelajar();
    });
  }

  const toggleCluster = document.getElementById('toggle-cluster');
  if (toggleCluster) {
    toggleCluster.addEventListener('change', (e) => {
      state.cluster = e.target.checked;
      renderBelajar();
    });
  }

  const toggleLabels = document.getElementById('toggle-labels');
  if (toggleLabels) {
    toggleLabels.addEventListener('change', (e) => {
      state.showLabels = e.target.checked;
      renderBelajar();
    });
  }

  // --- D. Tombol Aksi Tambah Zona (Desktop & Mobile FAB) ---
  const btnTambahZona = document.getElementById('btn-tambah-zona');
  const btnFabZona = document.getElementById('btn-fab-zona');

  const startDrawZona = () => {
    if (drawPolygonHandler) {
      drawPolygonHandler.enable();
      alert('Klik titik-titik di atas peta untuk menggambar poligon zona belajar. Klik dua kali pada titik terakhir untuk menyelesaikan.');
    }
  };

  if (btnTambahZona) btnTambahZona.addEventListener('click', startDrawZona);
  if (btnFabZona) btnFabZona.addEventListener('click', startDrawZona);

  // --- E. Tombol Reset Peta ---
  const btnResetPeta = document.getElementById('btn-reset-peta');
  if (btnResetPeta) {
    btnResetPeta.addEventListener('click', () => {
      // Reset state
      state.filters = { perpustakaan: true, baca: true, coworking: true };
      state.cluster = false;
      state.showGratis = false;
      state.showLabels = true;
      state.searchQuery = '';

      // Reset elemen UI form
      if (searchInput) searchInput.value = '';
      if (toggleGratis) toggleGratis.checked = false;
      if (toggleCluster) toggleCluster.checked = false;
      if (toggleLabels) toggleLabels.checked = true;

      chips.forEach((c) => c.classList.add('active'));

      // Kembalikan view peta ke default Pontianak
      if (map) {
        map.setView(PONTIANAK_CENTER, PONTIANAK_DEFAULT_ZOOM);
      }

      renderBelajar();
    });
  }

  // --- F. Modal Tambah Zona Actions ---
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnBatalZona = document.getElementById('btn-batal-zona');
  const formZona = document.getElementById('form-zona');

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModalTambahZona);
  if (btnBatalZona) btnBatalZona.addEventListener('click', closeModalTambahZona);

  if (formZona) {
    formZona.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentDrawnLayer) return;

      const rawGeoJSON = currentDrawnLayer.toGeoJSON();
      const nama = document.getElementById('input-nama-zona').value.trim();
      const keterangan = document.getElementById('input-keterangan').value.trim();

      const featurePayload = {
        type: 'Feature',
        geometry: rawGeoJSON.geometry,
        properties: {
          nama_zona: nama,
          keterangan: keterangan,
        },
      };

      submitZonaBaru(featurePayload);
    });
  }

  // Escape key untuk menutup modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModalTambahZona();
    }
  });

  // --- G. Bento Bottom Bar: Layer Switcher ---
  const layerBtnZona = document.getElementById('layer-btn-zona');
  const layerBtnKelurahan = document.getElementById('layer-btn-kelurahan');
  const layerBtnSekolahKampus = document.getElementById('layer-btn-sekolah-kampus');

  if (layerBtnZona) {
    layerBtnZona.addEventListener('click', () => {
      if (map.hasLayer(zonaLayerGroup)) {
        map.removeLayer(zonaLayerGroup);
        layerBtnZona.classList.remove('active');
      } else {
        map.addLayer(zonaLayerGroup);
        layerBtnZona.classList.add('active');
      }
    });
  }

  if (layerBtnKelurahan) {
    layerBtnKelurahan.addEventListener('click', () => {
      if (map.hasLayer(kelurahanLayerGroup)) {
        map.removeLayer(kelurahanLayerGroup);
        layerBtnKelurahan.classList.remove('active');
      } else {
        map.addLayer(kelurahanLayerGroup);
        layerBtnKelurahan.classList.add('active');
      }
    });
  }

  if (layerBtnSekolahKampus) {
    layerBtnSekolahKampus.addEventListener('click', async () => {
      if (map.hasLayer(sekolahKampusLayerGroup)) {
        map.removeLayer(sekolahKampusLayerGroup);
        layerBtnSekolahKampus.classList.remove('active');
      } else {
        await loadSekolahKampusLayers();
        map.addLayer(sekolahKampusLayerGroup);
        layerBtnSekolahKampus.classList.add('active');
      }
    });
  }

  // --- H. Tombol Retry saat Error ---
  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      initApp();
    });
  }
}

// ==========================================================================
// 12. Bootstrap saat DOM Ready
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initApp();
});
