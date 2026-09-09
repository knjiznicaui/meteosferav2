/* =============================================
   METEOSPHERE — MAIN APP
   ============================================= */

const App = {
  _currentView: 'dashboard',
  _refreshTimer: null,
  _forecastData: null,
  _hourlyMetric: 'temperature',

  async init() {
    // Apply theme
    const theme = Settings.get('theme') || 'dark';
    if (theme === 'light') document.body.classList.add('light-theme');

    // Start clock
    startClock();

    // Setup navigation
    this._setupNav();

    // Setup search
    this._setupSearch();

    // Setup sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      const mc = document.getElementById('mainContent');
      sb.classList.toggle('collapsed');
      mc.classList.toggle('sidebar-collapsed');
    });

    // My location button
    document.getElementById('currentLocationBtn').addEventListener('click', async () => {
      try {
        showToast('Določam lokacijo...', 'info');
        const pos = await API.getCurrentPosition();
        const loc = await API.reverseGeocode(pos.lat, pos.lon);
        await API.setLocation(pos.lat, pos.lon, loc.city, loc.countryCode);
        showToast(`Lokacija: ${loc.city}`, 'success');
      } catch(e) {
        showToast('Lokacije ni mogoče določiti.', 'error');
      }
    });

    // Restore last location
    const last = Store.get('lastLocation');
    if (last) {
      API.currentLat = last.lat;
      API.currentLon = last.lon;
      API.currentCity = last.city;
      API.currentCountry = last.country;
    } else {
      // Try geolocation silently
      try {
        const pos = await API.getCurrentPosition();
        const loc = await API.reverseGeocode(pos.lat, pos.lon);
        API.currentLat = pos.lat;
        API.currentLon = pos.lon;
        API.currentCity = loc.city;
        API.currentCountry = loc.countryCode;
      } catch(e) {
        // Default: Ljubljana
      }
    }

    // Load saved locations in settings
    this._renderSavedLocations();

    // Load stations readings
    Stations.renderReadings();

    // Initial data load
    await this.refreshAll();

    // Auto-refresh
    this._setupAutoRefresh();

    // Hide loading screen
    setTimeout(() => {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    }, 500);

    // Init mini map after DOM is ready
    setTimeout(() => Maps.initMiniMap(API.currentLat, API.currentLon), 600);
  },

  // ---- NAVIGATION ----
  _setupNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        if (view) this.switchView(view);
      });
    });

    // Link buttons inside views
    document.querySelectorAll('.link-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchView(btn.dataset.view);
      });
    });
  },

  switchView(view) {
    this._currentView = view;

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${view}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Switch views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    // Lazy-init view-specific things
    this._onViewActivated(view);

    // Mobile: close sidebar
    const sb = document.getElementById('sidebar');
    if (window.innerWidth <= 720) sb.classList.remove('mobile-open');
  },

  _onViewActivated(view) {
    if (!this._forecastData) return;
    switch (view) {
      case 'forecast':
        this._renderForecastView();
        break;
      case 'hourly':
        this._renderHourlyView();
        break;
      case 'radar':
        Maps.initRadarMap(API.currentLat, API.currentLon);
        break;
      case 'map':
        Maps.initFullMap(API.currentLat, API.currentLon);
        break;
      case 'climate':
        Climate.load(API.currentLat, API.currentLon);
        break;
      case 'airquality':
        AirQuality.load(API.currentLat, API.currentLon);
        break;
      case 'astronomy':
        Astronomy.render(this._forecastData, API.currentLat, API.currentLon);
        break;
      case 'compare':
        Compare.render();
        break;
      case 'stations':
        Stations.renderReadings();
        break;
    }
  },

  // ---- MAIN REFRESH ----
  async refreshAll() {
    try {
      const data = await API.getForecast(API.currentLat, API.currentLon);
      this._forecastData = data;
      this._renderDashboard(data);
      Maps.updateLocation(API.currentLat, API.currentLon, API.currentCity, data);
      if (this._currentView !== 'dashboard') this._onViewActivated(this._currentView);
      this._checkAlerts(data);
    } catch(e) {
      console.error('Refresh failed:', e);
      showToast('Napaka pri nalaganju podatkov.', 'error');
    }
  },

  // ---- DASHBOARD RENDER ----
  _renderDashboard(data) {
    const c = data.current;
    const d = data.daily;
    const now = new Date();

    // Hero
    document.getElementById('heroLocation').textContent = `${API.currentCity}${API.currentCountry ? ', ' + API.currentCountry : ''}`;
    document.getElementById('heroDate').textContent = TimeUtil.formatDate(now.toISOString());
    document.getElementById('heroTemp').textContent = Convert.tempStr(c.temperature_2m);
    document.getElementById('heroFeels').textContent = Convert.tempStr(c.apparent_temperature);
    document.getElementById('heroCondition').textContent = WMO.label(c.weather_code);
    document.getElementById('heroIcon').textContent = WMO.icon(c.weather_code);
    document.getElementById('heroMax').textContent = Convert.tempStr(d.temperature_2m_max[0]);
    document.getElementById('heroMin').textContent = Convert.tempStr(d.temperature_2m_min[0]);
    document.getElementById('heroHumidity').textContent = `${c.relative_humidity_2m}%`;
    document.getElementById('heroWind').textContent = Convert.windStr(c.wind_speed_10m);
    document.getElementById('heroPressure').textContent = Convert.pressureStr(c.pressure_msl);
    document.getElementById('heroVisibility').textContent = `${fmtNum(c.visibility / 1000)} km`;
    document.getElementById('heroUV').textContent = fmtNum(c.uv_index, 0);
    document.getElementById('heroClouds').textContent = `${c.cloud_cover}%`;

    // Weather BG class
    const heroEl = document.getElementById('heroWeather');
    heroEl.className = 'hero-weather';
    const bg = WMO.get(c.weather_code).bg;
    if (bg === 'rain') heroEl.classList.add('weather-bg-rain');
    else if (bg === 'snow') heroEl.classList.add('weather-bg-snow');
    else if (bg === 'storm') heroEl.classList.add('weather-bg-thunder');

    // Metric cards
    document.getElementById('metricDewpoint').textContent = Convert.tempStr(c.dew_point_2m);
    document.getElementById('metricDewpointDesc').textContent = Dewpoint.comfort(c.dew_point_2m);

    document.getElementById('metricWind').textContent = Convert.windStr(c.wind_speed_10m);
    document.getElementById('metricGusts').textContent = Convert.windStr(c.wind_gusts_10m);
    document.getElementById('windDir').textContent = WindDir.fromDeg(c.wind_direction_10m);
    const needle = document.getElementById('compassNeedle');
    if (needle) needle.style.transform = `rotate(${c.wind_direction_10m}deg)`;

    // Precipitation
    const hourIdx = Math.max(0, data.hourly.time.findIndex(t => new Date(t) >= now));
    const precipProb = data.hourly.precipitation_probability[hourIdx] || 0;
    document.getElementById('metricPrecip').textContent = Convert.precipStr(c.precipitation);
    document.getElementById('metricPrecipProb').textContent = `${precipProb}%`;

    // Solar
    const solar = c.direct_radiation + c.diffuse_radiation;
    document.getElementById('metricSolar').textContent = `${Math.round(solar)} W/m²`;
    document.getElementById('metricSolarDesc').textContent = solar > 800 ? 'Intenzivno' : solar > 400 ? 'Zmerno' : solar > 100 ? 'Šibko' : 'Minimalno';

    // Wind chill
    const windChill = this._calcWindChill(c.temperature_2m, c.wind_speed_10m);
    document.getElementById('metricWindchill').textContent = windChill !== null ? Convert.tempStr(windChill) : '—';
    document.getElementById('metricWindchillDesc').textContent = windChill !== null ? (windChill < 0 ? 'Mrzlo' : 'Normalno') : 'N/A (temp > 10°C)';

    // Heat index
    const heatIndex = this._calcHeatIndex(c.temperature_2m, c.relative_humidity_2m);
    document.getElementById('metricHeatIndex').textContent = heatIndex !== null ? Convert.tempStr(heatIndex) : '—';
    document.getElementById('metricHeatIndexDesc').textContent = heatIndex !== null ? (heatIndex > 40 ? 'Nevarno' : heatIndex > 32 ? 'Neprijetno' : 'Normalno') : 'N/A (temp < 27°C)';

    // Charts
    Charts.renderHourly('hourlyChart', data, this._hourlyMetric);
    Charts.renderPressure('pressureChart', data);
    Charts.renderHumidityDew('humidityChart', data);

    // Forecast strip
    this._renderForecastStrip(data);
  },

  _renderForecastStrip(data) {
    const strip = document.getElementById('forecastStrip');
    if (!strip) return;
    const days = data.daily.time.slice(0, 7);
    strip.innerHTML = days.map((t, i) => {
      const dayName = i === 0 ? 'Danes' : i === 1 ? 'Jutri' : TimeUtil.formatDate(t, true);
      const icon = WMO.icon(data.daily.weather_code[i]);
      const max = Convert.tempStr(data.daily.temperature_2m_max[i]);
      const min = Convert.tempStr(data.daily.temperature_2m_min[i]);
      const precip = data.daily.precipitation_sum[i];
      return `
        <div class="forecast-day ${i === 0 ? 'active' : ''}">
          <div class="fd-day">${dayName}</div>
          <div class="fd-icon">${icon}</div>
          <div class="fd-max">${max}</div>
          <div class="fd-min">${min}</div>
          <div class="fd-precip">${precip > 0 ? '🌧️ ' + Convert.precipStr(precip) : '—'}</div>
        </div>
      `;
    }).join('');
  },

  _renderForecastView() {
    if (!this._forecastData) return;
    const data = this._forecastData;
    Charts.renderForecast14('forecast14Chart', data);

    const tbody = document.getElementById('forecastTableBody');
    if (!tbody) return;
    const days = data.daily.time.slice(0, 14);
    tbody.innerHTML = days.map((t, i) => {
      const isToday = i === 0;
      const dayStr = isToday ? 'Danes' : i === 1 ? 'Jutri' : TimeUtil.formatDate(t);
      const icon = WMO.icon(data.daily.weather_code[i]);
      const cond = WMO.label(data.daily.weather_code[i]);
      const max = Convert.tempStr(data.daily.temperature_2m_max[i]);
      const min = Convert.tempStr(data.daily.temperature_2m_min[i]);
      const precip = Convert.precipStr(data.daily.precipitation_sum[i]);
      const precipProb = data.daily.precipitation_probability_max[i];
      const wind = Convert.windStr(data.daily.wind_speed_10m_max[i]);
      const uv = fmtNum(data.daily.uv_index_max[i], 0);
      const sr = new Date(data.daily.sunrise[i]).toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
      const ss = new Date(data.daily.sunset[i]).toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });

      return `
        <tr${isToday ? ' style="background:rgba(79,195,247,0.04)"' : ''}>
          <td style="font-weight:600;color:var(--text-primary)">${dayStr}</td>
          <td style="font-size:20px">${icon}</td>
          <td>${cond}</td>
          <td class="temp-min">${min}</td>
          <td class="temp-max">${max}</td>
          <td>${precip}</td>
          <td>${precipProb !== undefined ? precipProb + '%' : '--'}</td>
          <td>${wind}</td>
          <td>${uv}</td>
          <td style="color:var(--accent-warm)">${sr}</td>
          <td style="color:var(--accent-red)">${ss}</td>
        </tr>
      `;
    }).join('');
  },

  _renderHourlyView() {
    if (!this._forecastData) return;
    const data = this._forecastData;
    Charts.renderHourly48Temp('hourly48TempChart', data);
    Charts.renderHourly48Precip('hourly48PrecipChart', data);
    Charts.renderHourly48Wind('hourly48WindChart', data);
    Charts.renderHourly48Humidity('hourly48HumidityChart', data);

    const tbody = document.getElementById('hourlyTableBody');
    if (!tbody) return;
    const now = new Date();
    const idx = Math.max(0, data.hourly.time.findIndex(t => new Date(t) >= now));
    const hours = data.hourly.time.slice(idx, idx + 48);

    tbody.innerHTML = hours.map((t, i) => {
      const ri = idx + i;
      const icon = WMO.icon(data.hourly.weather_code[ri]);
      const temp = Convert.tempStr(data.hourly.temperature_2m[ri]);
      const feels = Convert.tempStr(data.hourly.apparent_temperature[ri]);
      const precip = Convert.precipStr(data.hourly.precipitation[ri]);
      const wind = Convert.windStr(data.hourly.wind_speed_10m[ri]);
      const hum = data.hourly.relative_humidity_2m[ri];
      const pres = Convert.pressureStr(data.hourly.pressure_msl[ri]);
      const vis = fmtNum((data.hourly.visibility[ri] || 0) / 1000);
      const hour = TimeUtil.formatHour(t);
      const isNow = i === 0;

      return `
        <tr${isNow ? ' style="background:rgba(79,195,247,0.04)"' : ''}>
          <td style="font-weight:${isNow ? '700' : '400'};color:${isNow ? 'var(--accent)' : 'var(--text-secondary)'}">${hour}${isNow ? ' ← zdaj' : ''}</td>
          <td style="font-size:18px">${icon}</td>
          <td style="font-family:var(--font-data);font-weight:600;color:var(--text-primary)">${temp}</td>
          <td>${feels}</td>
          <td>${precip}</td>
          <td>${wind}</td>
          <td>${hum !== undefined ? hum + '%' : '--'}</td>
          <td>${pres}</td>
          <td>${vis} km</td>
        </tr>
      `;
    }).join('');
  },

  // ---- WEATHER CALCULATIONS ----
  _calcWindChill(tempC, windKmh) {
    if (tempC > 10 || windKmh < 4.8) return null;
    return 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windKmh, 0.16) + 0.3965 * tempC * Math.pow(windKmh, 0.16);
  },

  _calcHeatIndex(tempC, humidity) {
    if (tempC < 27) return null;
    const T = tempC * 9/5 + 32;
    const H = humidity;
    const HI = -42.379 + 2.04901523*T + 10.14333127*H - 0.22475541*T*H
               - 0.00683783*T*T - 0.05481717*H*H + 0.00122874*T*T*H
               + 0.00085282*T*H*H - 0.00000199*T*T*H*H;
    return (HI - 32) * 5/9;
  },

  // ---- ALERT CHECKING ----
  _checkAlerts(data) {
    const c = data.current;
    const thresholds = Settings.get('alertThresholds') || { minTemp: -5, maxTemp: 35, wind: 50, precip: 20 };
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    const alerts = [];
    if (c.temperature_2m < thresholds.minTemp)
      alerts.push({ type: 'extreme', title: `🥶 Nizka temperatura: ${Convert.tempStr(c.temperature_2m)}`, desc: `Temperatura je padla pod nastavljeno mejo ${thresholds.minTemp}°C.` });
    if (c.temperature_2m > thresholds.maxTemp)
      alerts.push({ type: 'extreme', title: `🔥 Visoka temperatura: ${Convert.tempStr(c.temperature_2m)}`, desc: `Temperatura je preseglA nastavljeno mejo ${thresholds.maxTemp}°C.` });
    if (c.wind_speed_10m > thresholds.wind)
      alerts.push({ type: 'warning', title: `💨 Silovit veter: ${Convert.windStr(c.wind_speed_10m)}`, desc: `Hitrost vetra je preseglA nastavljeno mejo ${thresholds.wind} km/h.` });
    if (c.precipitation > thresholds.precip)
      alerts.push({ type: 'warning', title: `🌧️ Močne padavine: ${Convert.precipStr(c.precipitation)}`, desc: `Padavine so presegle nastavljeno mejo ${thresholds.precip} mm.` });

    if (c.uv_index >= 8)
      alerts.push({ type: 'advisory', title: `☀️ Visok UV indeks: ${c.uv_index.toFixed(0)}`, desc: 'Zaščitite se pred soncem. Zaščitna krema SPF50+, sončna očala, klobuk.' });
    if (c.cape > 1000)
      alerts.push({ type: 'warning', title: `⛈️ Nevihtni potencial`, desc: `CAPE vrednost ${Math.round(c.cape)} J/kg kaže na možnost neviht.` });

    if (alerts.length === 0) {
      container.innerHTML = `<div class="no-alerts"><span>✅</span><p>Trenutno ni aktivnih opozoril za ${API.currentCity}.</p></div>`;
    } else {
      container.innerHTML = alerts.map(a => `
        <div class="alert-card ${a.type === 'warning' ? 'warning' : a.type === 'advisory' ? 'advisory' : ''}">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
        </div>
      `).join('');
    }
  },

  // ---- AUTO REFRESH ----
  _setupAutoRefresh() {
    const mins = parseInt(Settings.get('refreshInterval') || 15);
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (mins > 0) {
      this._refreshTimer = setInterval(() => this.refreshAll(), mins * 60 * 1000);
    }
  },

  // ---- SEARCH ----
  _setupSearch() {
    const input = document.getElementById('locationSearch');
    const suggestions = document.getElementById('searchSuggestions');
    if (!input || !suggestions) return;

    const doSearch = debounce(async (q) => {
      if (q.length < 2) { suggestions.classList.remove('open'); return; }
      try {
        const results = await API.searchOpenMeteo(q);
        if (!results.length) { suggestions.classList.remove('open'); return; }
        suggestions.innerHTML = results.slice(0, 6).map(r => `
          <div class="suggestion-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.shortName}">
            <span>📍</span>
            <span><strong>${r.shortName.split(',')[0]}</strong>${r.shortName.includes(',') ? ', ' + r.shortName.split(',').slice(1).join(',') : ''}</span>
          </div>
        `).join('');
        suggestions.classList.add('open');

        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', async () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.dataset.name;
            input.value = '';
            suggestions.classList.remove('open');
            const parts = name.split(',');
            await API.setLocation(lat, lon, parts[0].trim(), (parts[1] || '').trim());
            showToast(`Lokacija: ${name}`, 'success');
          });
        });
      } catch(e) {}
    }, 400);

    input.addEventListener('input', e => doSearch(e.target.value));
    document.addEventListener('click', e => {
      if (!e.target.closest('.location-search')) suggestions.classList.remove('open');
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') suggestions.classList.remove('open');
    });
  },

  // ---- SAVED LOCATIONS ----
  _renderSavedLocations() {
    const list = document.getElementById('savedLocationsList');
    if (!list) return;
    const locs = Settings.get('savedLocations') || [];
    if (!locs.length) { list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Ni shranjenih lokacij.</div>'; return; }
    list.innerHTML = locs.map((loc, i) => `
      <div class="saved-loc-item" onclick="App._loadSavedLocation(${i})">
        <span>📍 ${loc.name}</span>
        <span class="saved-loc-del" onclick="event.stopPropagation();App._deleteSavedLocation(${i})">✕</span>
      </div>
    `).join('');
  },

  async _loadSavedLocation(idx) {
    const locs = Settings.get('savedLocations') || [];
    const loc = locs[idx];
    if (!loc) return;
    await API.setLocation(loc.lat, loc.lon, loc.name, loc.country);
    showToast(`Lokacija: ${loc.name}`, 'success');
  },

  _deleteSavedLocation(idx) {
    const locs = Settings.get('savedLocations') || [];
    locs.splice(idx, 1);
    Settings.set('savedLocations', locs);
    this._renderSavedLocations();
  }
};

// ---- GLOBAL FUNCTIONS (called from HTML) ----

function setUnit(unit) {
  Settings.set('unit', unit);
  document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
  if (unit === 'C') document.getElementById('btnCelsius')?.classList.add('active');
  if (unit === 'F') document.getElementById('btnFahrenheit')?.classList.add('active');
  document.getElementById('settingTempUnit').value = unit;
  if (App._forecastData) App._renderDashboard(App._forecastData);
}

function setWindUnit(unit) {
  Settings.set('windUnit', unit);
  if (App._forecastData) App._renderDashboard(App._forecastData);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  document.body.classList.toggle('light-theme');
  Settings.set('theme', isLight ? 'dark' : 'light');
}

function setTheme(theme) {
  if (theme === 'light') document.body.classList.add('light-theme');
  else document.body.classList.remove('light-theme');
  Settings.set('theme', theme);
}

function setHourlyMetric(metric) {
  App._hourlyMetric = metric;
  document.querySelectorAll('.ct-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (App._forecastData) Charts.renderHourly('hourlyChart', App._forecastData, metric);
}

function setDefaultLocation() {
  const val = document.getElementById('settingDefaultLocation').value.trim();
  if (val) { Settings.set('defaultLocationName', val); showToast('Privzeta lokacija shranjena.', 'success'); }
}

function saveApiKey(provider) {
  const keys = { owm: 'settingOWMKey', tomorrow: 'settingTomorrowKey', airvisual: 'settingAirVisualKey' };
  const val = document.getElementById(keys[provider])?.value?.trim();
  if (val) {
    const apiKeys = Settings.get('apiKeys') || {};
    apiKeys[provider] = val;
    Settings.set('apiKeys', apiKeys);
    showToast('API ključ shranjen!', 'success');
  }
}

function saveAlertSettings() {
  Settings.set('alertThresholds', {
    minTemp:  parseFloat(document.getElementById('alertMinTemp').value)  || -5,
    maxTemp:  parseFloat(document.getElementById('alertMaxTemp').value)  || 35,
    wind:     parseFloat(document.getElementById('alertWind').value)     || 50,
    precip:   parseFloat(document.getElementById('alertPrecip').value)   || 20
  });
  showToast('Nastavitve opozoril shranjene.', 'success');
  if (App._forecastData) App._checkAlerts(App._forecastData);
}

function addSavedLocation() {
  const input = document.getElementById('newSavedLocation');
  const val = input?.value?.trim();
  if (!val) return;
  API.searchOpenMeteo(val).then(results => {
    if (!results.length) { showToast('Lokacija ni najdena.', 'error'); return; }
    const r = results[0];
    const locs = Settings.get('savedLocations') || [];
    locs.push({ name: r.shortName, lat: r.lat, lon: r.lon, country: r.country });
    Settings.set('savedLocations', locs);
    App._renderSavedLocations();
    input.value = '';
    showToast(`${r.shortName} shranjena!`, 'success');
  });
}

// ---- START ----
document.addEventListener('DOMContentLoaded', () => App.init());
