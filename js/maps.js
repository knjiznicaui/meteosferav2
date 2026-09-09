/* =============================================
   METEOSPHERE — MAPS (Leaflet)
   Free tile layers: OSM, OpenWeatherMap, RainViewer
   ============================================= */

const Maps = {
  miniMap: null,
  fullMap: null,
  radarMap: null,
  currentLayer: 'temp',
  weatherLayers: {},
  radarLayer: null,
  radarFrames: [],
  radarIndex: 0,
  radarPlaying: false,
  radarTimer: null,
  layerOpacity: 0.7,

  // Free OpenWeatherMap tile layers (no key needed for some)
  OWM_TILES: {
    temp:    'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
    precip:  'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
    wind:    'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
    clouds:  'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png',
    pressure:'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png',
    snow:    'https://tile.openweathermap.org/map/snow/{z}/{x}/{y}.png'
  },

  // Dark OSM tiles
  DARK_TILES: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  LIGHT_TILES: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  OSM_TILES:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  getTileLayer() {
    const theme = Settings.get('theme') || 'dark';
    return theme === 'light' ? this.LIGHT_TILES : this.DARK_TILES;
  },

  // ---- INIT MINI MAP ----
  initMiniMap(lat, lon) {
    if (this.miniMap) { this.miniMap.setView([lat, lon], 8); return; }
    const el = document.getElementById('miniMap');
    if (!el) return;

    this.miniMap = L.map('miniMap', {
      center: [lat, lon], zoom: 8,
      zoomControl: true, attributionControl: true
    });

    L.tileLayer(this.getTileLayer(), {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19
    }).addTo(this.miniMap);

    // Weather layer (clouds free)
    L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02`, {
      opacity: 0.5, maxZoom: 19
    }).addTo(this.miniMap);

    // Location marker
    this._miniMarker = L.circleMarker([lat, lon], {
      radius: 8, fillColor: '#4FC3F7', color: '#00E5FF', weight: 2, fillOpacity: 0.9
    }).addTo(this.miniMap);

    // Click handler
    this.miniMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      API.reverseGeocode(lat, lng).then(loc => {
        API.setLocation(lat, lng, loc.city, loc.countryCode);
        showToast(`Lokacija nastavljena: ${loc.city}`, 'success');
      });
    });
  },

  updateMiniMapMarker(lat, lon, city, weatherData) {
    if (!this.miniMap) return;
    this.miniMap.setView([lat, lon], 8);
    if (this._miniMarker) this._miniMarker.setLatLng([lat, lon]);

    // Popup
    const temp = weatherData?.current?.temperature_2m;
    const code = weatherData?.current?.weather_code;
    const icon = code !== undefined ? WMO.icon(code) : '—';
    const tempStr = temp !== undefined ? Convert.tempStr(temp) : '—';

    if (this._miniMarker) {
      this._miniMarker.bindPopup(`
        <div class="map-popup">
          <div class="mp-title">${city}</div>
          <div class="mp-temp">${icon} ${tempStr}</div>
          ${weatherData ? `<div class="mp-row"><span>Veter</span><span>${Convert.windStr(weatherData.current.wind_speed_10m)}</span></div>` : ''}
        </div>
      `);
    }
  },

  // ---- INIT FULL MAP ----
  initFullMap(lat, lon) {
    if (this.fullMap) { this.fullMap.setView([lat, lon], 6); return; }
    const el = document.getElementById('fullMap');
    if (!el) return;

    this.fullMap = L.map('fullMap', {
      center: [lat, lon], zoom: 6
    });

    this._fullBaseLayer = L.tileLayer(this.getTileLayer(), {
      attribution: '© OSM © CARTO', subdomains: 'abcd', maxZoom: 19
    }).addTo(this.fullMap);

    // Add weather layer
    this._addWeatherLayer('temp');

    // Marker
    this._fullMarker = L.circleMarker([lat, lon], {
      radius: 8, fillColor: '#4FC3F7', color: '#00E5FF', weight: 2, fillOpacity: 0.9
    }).addTo(this.fullMap);

    // Click handler
    this.fullMap.on('click', async (e) => {
      const { lat: clat, lng: clon } = e.latlng;
      try {
        const loc = await API.reverseGeocode(clat, clon);
        const data = await API.getForecast(clat, clon);
        const temp = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        L.popup()
          .setLatLng([clat, clon])
          .setContent(`
            <div class="map-popup">
              <div class="mp-title">${loc.city}, ${loc.country}</div>
              <div class="mp-temp">${WMO.icon(code)} ${Convert.tempStr(temp)}</div>
              <div class="mp-row"><span>Vlažnost</span><span>${data.current.relative_humidity_2m}%</span></div>
              <div class="mp-row"><span>Veter</span><span>${Convert.windStr(data.current.wind_speed_10m)}</span></div>
            </div>
          `).openOn(this.fullMap);
      } catch(e) {}
    });

    // Layer control
    this._addMapCityMarkers();
  },

  _addWeatherLayer(type) {
    if (this._currentWeatherLayer) {
      this.fullMap.removeLayer(this._currentWeatherLayer);
    }
    const url = this.OWM_TILES[type];
    if (!url) return;
    // Use public demo key (low rate limit but sufficient for personal use)
    const keyedUrl = url + '?appid=439d4b804bc8187953eb36d2a8c26a02';
    this._currentWeatherLayer = L.tileLayer(keyedUrl, {
      opacity: this.layerOpacity, maxZoom: 19
    }).addTo(this.fullMap);
    this.currentLayer = type;
  },

  setMapLayer(type) {
    document.querySelectorAll('.map-layer-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[onclick="setMapLayer('${type}')"]`);
    if (btn) btn.classList.add('active');
    if (this.fullMap) this._addWeatherLayer(type);
    this._updateMapLegend(type);
  },

  updateLayerOpacity(val) {
    this.layerOpacity = val / 100;
    document.getElementById('opacityVal').textContent = `${val}%`;
    if (this._currentWeatherLayer) this._currentWeatherLayer.setOpacity(this.layerOpacity);
  },

  _updateMapLegend(type) {
    const el = document.getElementById('mapLegend');
    if (!el) return;
    const legends = {
      temp: ['< -20°C ❄️', '-10°C', '0°C', '+10°C', '+20°C 🌡️', '> +30°C 🔥'],
      precip: ['0 mm', '1 mm', '5 mm', '10 mm', '50 mm', '> 100 mm'],
      wind: ['0 km/h', '20 km/h', '50 km/h', '80 km/h', '> 100 km/h'],
      clouds: ['0%', '25%', '50%', '75%', '100% ☁️'],
      pressure: ['< 960 hPa', '980', '1000', '1013', '1030', '> 1050 hPa'],
      snow: ['0 mm', '1 cm', '5 cm', '10 cm', '> 20 cm ❄️']
    };
    el.innerHTML = (legends[type] || []).map(l => `<span class="badge badge-blue">${l}</span>`).join('');
  },

  _addMapCityMarkers() {
    const cities = [
      { name: 'Ljubljana', lat: 46.0569, lon: 14.5058 },
      { name: 'Maribor', lat: 46.5547, lon: 15.6467 },
      { name: 'Koper', lat: 45.5488, lon: 13.7301 },
      { name: 'Celje', lat: 46.2307, lon: 15.2677 },
      { name: 'Kranj', lat: 46.2390, lon: 14.3557 },
      { name: 'Ptuj', lat: 46.4199, lon: 15.8700 },
      { name: 'Zagreb', lat: 45.8150, lon: 15.9819 },
      { name: 'Wien', lat: 48.2082, lon: 16.3738 },
      { name: 'Graz', lat: 47.0707, lon: 15.4395 },
      { name: 'Trieste', lat: 45.6495, lon: 13.7768 }
    ];

    cities.forEach(c => {
      L.circleMarker([c.lat, c.lon], {
        radius: 5, fillColor: '#69F0AE', color: '#00E5FF', weight: 1.5, fillOpacity: 0.7
      }).addTo(this.fullMap)
        .bindTooltip(c.name, { permanent: false, direction: 'top', className: 'leaflet-tooltip' });
    });
  },

  // ---- INIT RADAR MAP ----
  async initRadarMap(lat, lon) {
    if (this.radarMap) { this.radarMap.setView([lat, lon], 6); this._reloadRadarFrames(); return; }
    const el = document.getElementById('radarMap');
    if (!el) return;

    this.radarMap = L.map('radarMap', { center: [lat, lon], zoom: 6 });
    L.tileLayer(this.getTileLayer(), { attribution: '© OSM © CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(this.radarMap);
    L.circleMarker([lat, lon], { radius: 7, fillColor: '#4FC3F7', color: '#00E5FF', weight: 2, fillOpacity: 0.9 }).addTo(this.radarMap);

    await this._reloadRadarFrames();
  },

  async _reloadRadarFrames() {
    try {
      const data = await API.getRadarFrames();
      this.radarFrames = data.radar?.past || [];
      if (data.radar?.nowcast) this.radarFrames = this.radarFrames.concat(data.radar.nowcast);
      this.radarIndex = this.radarFrames.length - 1;
      this._showRadarFrame(this.radarIndex);
    } catch(e) { console.warn('Radar frames failed:', e); }
  },

  _showRadarFrame(idx) {
    if (!this.radarMap || !this.radarFrames.length) return;
    const frame = this.radarFrames[idx];
    if (!frame) return;

    if (this._radarTileLayer) this.radarMap.removeLayer(this._radarTileLayer);
    this._radarTileLayer = L.tileLayer(
      `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      { opacity: 0.75, maxZoom: 19 }
    ).addTo(this.radarMap);

    const d = new Date(frame.time * 1000);
    const el = document.getElementById('radarTime');
    if (el) el.textContent = d.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  },

  setRadarFrame(val) {
    this.radarIndex = parseInt(val);
    this._showRadarFrame(this.radarIndex);
    const slider = document.getElementById('radarSlider');
    if (slider) slider.value = val;
  },

  toggleRadarPlay() {
    const btn = document.getElementById('radarPlayBtn');
    if (this.radarPlaying) {
      clearInterval(this.radarTimer);
      this.radarPlaying = false;
      if (btn) btn.textContent = '▶ Predvajaj';
    } else {
      this.radarPlaying = true;
      if (btn) btn.textContent = '⏸ Zaustavi';
      this.radarTimer = setInterval(() => {
        this.radarIndex = (this.radarIndex + 1) % this.radarFrames.length;
        this._showRadarFrame(this.radarIndex);
        const slider = document.getElementById('radarSlider');
        if (slider) { slider.max = this.radarFrames.length - 1; slider.value = this.radarIndex; }
      }, 800);
    }
  },

  updateLocation(lat, lon, city, weatherData) {
    this.initMiniMap(lat, lon);
    this.updateMiniMapMarker(lat, lon, city, weatherData);
    if (this.fullMap) {
      this.fullMap.setView([lat, lon], 6);
      if (this._fullMarker) this._fullMarker.setLatLng([lat, lon]);
    }
    if (this.radarMap) this.radarMap.setView([lat, lon], 6);
  }
};

// Global functions called from HTML
function setMapLayer(type) { Maps.setMapLayer(type); }
function updateLayerOpacity(val) { Maps.updateLayerOpacity(val); }
function toggleRadarPlay() { Maps.toggleRadarPlay(); }
function setRadarFrame(val) { Maps.setRadarFrame(val); }
function setSatLayer(type) {
  document.querySelectorAll('.sat-tab').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const iframe = document.getElementById('satelliteFrame');
  if (!iframe) return;
  const layers = {
    infrared: 'satellite',
    visible: 'satellite',
    wv: 'satellite'
  };
  const base = `https://embed.windy.com/embed2.html?lat=${API.currentLat}&lon=${API.currentLon}&width=100%&height=400&zoom=5&level=surface&overlay=satellite&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C`;
  iframe.src = base;
}
