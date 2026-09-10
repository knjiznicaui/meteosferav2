/* =============================================
   METEOSPHERE — MAPS (Leaflet)
   Free tile layers: OSM, OpenWeatherMap, RainViewer
   ============================================= */

const Maps = {
  miniMap: null,
  fullMap: null,
  radarMap: null,
  sloveniaWeatherMap: null,
  lightningFrame: null,
  currentLayer: 'temp',
  weatherLayers: {},
  radarLayer: null,
  radarFrames: [],
  radarIndex: 0,
  radarPlaying: false,
  radarTimer: null,
  sloveniaWeatherTimer: null,
  sloveniaWeatherMarkers: [],
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

  // OpenStreetMap tiles
  OSM_TILES: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  getTileLayer() {
    return this.OSM_TILES;
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
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc', maxZoom: 19
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
      attribution: '© OpenStreetMap contributors', subdomains: 'abc', maxZoom: 19
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

  // ---- SLOVENIA WEATHER OVERVIEW MAP ----
  initSloveniaWeatherMap() {
    if (this.sloveniaWeatherMap) {
      setTimeout(() => this.sloveniaWeatherMap.invalidateSize(), 100);
      return;
    }

    const el = document.getElementById('sloveniaWeatherMap');
    if (!el) return;

    this._addSloveniaWeatherStyles();

    this.sloveniaWeatherMap = L.map('sloveniaWeatherMap', {
      center: [46.12, 14.82],
      zoom: 8,
      minZoom: 7,
      maxZoom: 11,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer(this.getTileLayer(), {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(this.sloveniaWeatherMap);

    this._sloveniaCities = [
      { name: 'Ljubljana', lat: 46.0569, lon: 14.5058 },
      { name: 'Maribor', lat: 46.5547, lon: 15.6467 },
      { name: 'Celje', lat: 46.2397, lon: 15.2677 },
      { name: 'Kranj', lat: 46.2389, lon: 14.3556 },
      { name: 'Koper', lat: 45.5481, lon: 13.7302 },
      { name: 'Novo mesto', lat: 45.8011, lon: 15.1710 },
      { name: 'Ptuj', lat: 46.4200, lon: 15.8700 },
      { name: 'Velenje', lat: 46.3592, lon: 15.1103 },
      { name: 'Murska Sobota', lat: 46.6625, lon: 16.1664 },
      { name: 'Nova Gorica', lat: 45.9560, lon: 13.6487 },
      { name: 'Slovenj Gradec', lat: 46.5103, lon: 15.0806 },
      { name: 'Krško', lat: 45.9592, lon: 15.4917 },
      { name: 'Brežice', lat: 45.9033, lon: 15.5911 },
      { name: 'Domžale', lat: 46.1377, lon: 14.5937 },
      { name: 'Kamnik', lat: 46.2259, lon: 14.6121 },
      { name: 'Trbovlje', lat: 46.1547, lon: 15.0533 },
      { name: 'Ajdovščina', lat: 45.8860, lon: 13.9095 },
      { name: 'Postojna', lat: 45.7744, lon: 14.2130 },
      { name: 'Izola', lat: 45.5394, lon: 13.6600 },
      { name: 'Sežana', lat: 45.7092, lon: 13.8733 },
      { name: 'Jesenice', lat: 46.4367, lon: 14.0528 },
      { name: 'Bled', lat: 46.3683, lon: 14.1146 },
      { name: 'Kočevje', lat: 45.6433, lon: 14.8633 },
      { name: 'Črnomelj', lat: 45.5711, lon: 15.1890 },
      { name: 'Slovenska Bistrica', lat: 46.3928, lon: 15.5744 },
      { name: 'Ormož', lat: 46.4114, lon: 16.1547 },
      { name: 'Ravne na Koroškem', lat: 46.5432, lon: 14.9692 },
      { name: 'Škofja Loka', lat: 46.1667, lon: 14.3069 }
    ];

    this._loadSloveniaWeather();

    // Refresh every 15 minutes
    clearInterval(this.sloveniaWeatherTimer);
    this.sloveniaWeatherTimer = setInterval(() => {
      this._loadSloveniaWeather();
    }, 15 * 60 * 1000);

    setTimeout(() => this.sloveniaWeatherMap.invalidateSize(), 150);
  },

  async _loadSloveniaWeather() {
    if (!this.sloveniaWeatherMap || !this._sloveniaCities?.length) return;

    const latitudes = this._sloveniaCities.map(c => c.lat).join(',');
    const longitudes = this._sloveniaCities.map(c => c.lon).join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitudes}` +
      `&longitude=${longitudes}` +
      `&current=temperature_2m,weather_code,relative_humidity_2m,precipitation,wind_speed_10m` +
      `&timezone=Europe%2FLjubljana`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const data = await response.json();

      const locations = Array.isArray(data) ? data : [data];

      this._renderSloveniaWeather(locations);
    } catch (error) {
      console.warn('Slovenia weather map failed:', error);
    }
  },

  _renderSloveniaWeather(locations) {
    if (!this.sloveniaWeatherMap) return;

    this.sloveniaWeatherMarkers.forEach(marker => {
      this.sloveniaWeatherMap.removeLayer(marker);
    });

    this.sloveniaWeatherMarkers = [];

    this._sloveniaCities.forEach((city, index) => {
      const weather = locations[index]?.current;

      if (!weather) return;

      const temp = Number(weather.temperature_2m);
      const code = Number(weather.weather_code);

      const weatherInfo = this._getSloveniaWeatherInfo(code);

      const tempText = Number.isFinite(temp)
        ? `${Math.round(temp)}°`
        : '—';

      const markerHtml = `
        <div class="slovenia-weather-marker">
          <div class="slovenia-weather-icon">${weatherInfo.icon}</div>
          <div class="slovenia-weather-city">${city.name}</div>
          <div class="slovenia-weather-temp">${tempText}</div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'slovenia-weather-div-icon',
        html: markerHtml,
        iconSize: [96, 72],
        iconAnchor: [48, 36],
        popupAnchor: [0, -34]
      });

      const marker = L.marker([city.lat, city.lon], {
        icon: icon,
        keyboard: true,
        title: `${city.name}: ${tempText}`
      }).addTo(this.sloveniaWeatherMap);

      const humidity = weather.relative_humidity_2m;
      const precipitation = weather.precipitation;
      const wind = weather.wind_speed_10m;

      marker.bindPopup(`
        <div class="map-popup slovenia-weather-popup">
          <div class="mp-title">${weatherInfo.icon} ${city.name}</div>
          <div class="mp-temp">${tempText} — ${weatherInfo.label}</div>
          <div class="mp-row">
            <span>Vlažnost</span>
            <span>${humidity ?? '—'}%</span>
          </div>
          <div class="mp-row">
            <span>Padavine</span>
            <span>${precipitation ?? 0} mm</span>
          </div>
          <div class="mp-row">
            <span>Veter</span>
            <span>${wind ?? '—'} km/h</span>
          </div>
        </div>
      `);

      this.sloveniaWeatherMarkers.push(marker);
    });
  },

  _getSloveniaWeatherInfo(code) {
    if (code === 0) {
      return { icon: '☀️', label: 'Jasno' };
    }

    if (code === 1) {
      return { icon: '🌤️', label: 'Pretežno jasno' };
    }

    if (code === 2) {
      return { icon: '⛅', label: 'Delno oblačno' };
    }

    if (code === 3) {
      return { icon: '☁️', label: 'Oblačno' };
    }

    if (code === 45 || code === 48) {
      return { icon: '🌫️', label: 'Megla' };
    }

    if (code >= 51 && code <= 57) {
      return { icon: '🌦️', label: 'Pršenje' };
    }

    if (code >= 61 && code <= 67) {
      return { icon: '🌧️', label: 'Dež' };
    }

    if (code >= 71 && code <= 77) {
      return { icon: '❄️', label: 'Sneg' };
    }

    if (code >= 80 && code <= 82) {
      return { icon: '🌦️', label: 'Plohe' };
    }

    if (code === 85 || code === 86) {
      return { icon: '🌨️', label: 'Snežne plohe' };
    }

    if (code === 95) {
      return { icon: '⛈️', label: 'Nevihta' };
    }

    if (code === 96 || code === 99) {
      return { icon: '⛈️', label: 'Nevihta s točo' };
    }

    return { icon: '🌡️', label: 'Vreme' };
  },

  _addSloveniaWeatherStyles() {
    if (document.getElementById('sloveniaWeatherMapStyles')) return;

    const style = document.createElement('style');
    style.id = 'sloveniaWeatherMapStyles';

    style.textContent = `
      #sloveniaWeatherMap {
        background: #dfe9f2;
      }

      .slovenia-weather-div-icon {
        background: transparent !important;
        border: 0 !important;
      }

      .slovenia-weather-marker {
        width: 96px;
        min-height: 68px;
        padding: 6px 8px;
        box-sizing: border-box;
        text-align: center;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.90);
        border: 1px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
        color: #fff;
        backdrop-filter: blur(5px);
        transform: translateY(-2px);
      }

      .slovenia-weather-icon {
        font-size: 24px;
        line-height: 24px;
      }

      .slovenia-weather-city {
        margin-top: 2px;
        font-size: 11px;
        line-height: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .slovenia-weather-temp {
        margin-top: 1px;
        font-size: 17px;
        line-height: 18px;
        font-weight: 800;
      }

      .slovenia-weather-popup {
        min-width: 180px;
      }

      .slovenia-weather-popup .mp-temp {
        margin-bottom: 8px;
      }

      .slovenia-weather-marker:hover {
        transform: translateY(-4px) scale(1.04);
      }
    `;

    document.head.appendChild(style);
  },

  // ---- INIT RADAR MAP ----
  async initRadarMap(lat, lon) {
    if (this.radarMap) {
      this.radarMap.setView([lat, lon], 6);
      this._reloadRadarFrames();
      return;
    }

    const el = document.getElementById('radarMap');
    if (!el) return;

    this.radarMap = L.map('radarMap', { center: [lat, lon], zoom: 6 });

    L.tileLayer(this.getTileLayer(), {
      attribution: '© OpenStreetMap contributors',
      subdomains: 'abc',
      maxZoom: 19
    }).addTo(this.radarMap);

    L.circleMarker([lat, lon], {
      radius: 7,
      fillColor: '#4FC3F7',
      color: '#00E5FF',
      weight: 2,
      fillOpacity: 0.9
    }).addTo(this.radarMap);

    await this._reloadRadarFrames();
  },

  async _reloadRadarFrames() {
    try {
      const data = await API.getRadarFrames();

      this.radarFrames = data.radar?.past || [];

      if (data.radar?.nowcast) {
        this.radarFrames = this.radarFrames.concat(data.radar.nowcast);
      }

      this.radarIndex = this.radarFrames.length - 1;
      this._showRadarFrame(this.radarIndex);
    } catch(e) {
      console.warn('Radar frames failed:', e);
    }
  },

  _showRadarFrame(idx) {
    if (!this.radarMap || !this.radarFrames.length) return;

    const frame = this.radarFrames[idx];
    if (!frame) return;

    if (this._radarTileLayer) {
      this.radarMap.removeLayer(this._radarTileLayer);
    }

    this._radarTileLayer = L.tileLayer(
      `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      {
        opacity: 0.75,
        maxZoom: 19
      }
    ).addTo(this.radarMap);

    const d = new Date(frame.time * 1000);
    const el = document.getElementById('radarTime');

    if (el) {
      el.textContent = d.toLocaleTimeString('sl', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    }
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
        if (!this.radarFrames.length) return;

        this.radarIndex = (this.radarIndex + 1) % this.radarFrames.length;
        this._showRadarFrame(this.radarIndex);

        const slider = document.getElementById('radarSlider');

        if (slider) {
          slider.max = this.radarFrames.length - 1;
          slider.value = this.radarIndex;
        }
      }, 800);
    }
  },

  // ---- LIGHTNING MAP ----
  initLightningMap() {
    const frame = document.getElementById('lightningFrame');
    if (!frame) return;

    if (!frame.src || frame.src === 'about:blank') {
      frame.src = 'https://www.lightningmaps.org/?lang=sl';
    }

    this.lightningFrame = frame;
  },

  updateLocation(lat, lon, city, weatherData) {
    this.initMiniMap(lat, lon);
    this.updateMiniMapMarker(lat, lon, city, weatherData);

    if (this.fullMap) {
      this.fullMap.setView([lat, lon], 6);

      if (this._fullMarker) {
        this._fullMarker.setLatLng([lat, lon]);
      }
    }

    if (this.radarMap) {
      this.radarMap.setView([lat, lon], 6);
    }
  }
};

// Global functions called from HTML
function setMapLayer(type) {
  Maps.setMapLayer(type);
}

function updateLayerOpacity(val) {
  Maps.updateLayerOpacity(val);
}

function toggleRadarPlay() {
  Maps.toggleRadarPlay();
}

function setRadarFrame(val) {
  Maps.setRadarFrame(val);
}

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

  const base =
    `https://embed.windy.com/embed2.html?lat=${API.currentLat}` +
    `&lon=${API.currentLon}` +
    `&width=100%&height=400&zoom=5&level=surface` +
    `&overlay=satellite&product=ecmwf&menu=&message=true&marker=` +
    `&calendar=now&pressure=&type=map&location=coordinates` +
    `&metricWind=km%2Fh&metricTemp=%C2%B0C`;

  iframe.src = base;
}
