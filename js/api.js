/* =============================================
   METEOSPHERE — API LAYER
   Free APIs: Open-Meteo, Nominatim, RainViewer
   ============================================= */

const API = {
  // ---- OPEN-METEO (free, no key needed) ----
  OPEN_METEO: 'https://api.open-meteo.com/v1',
  AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1',
  GEOCODING:   'https://geocoding-api.open-meteo.com/v1',
  NOMINATIM:   'https://nominatim.openstreetmap.org',
  RAINVIEWER:  'https://api.rainviewer.com/public/weather-maps.json',
  OPEN_ELEVATION: 'https://api.open-elevation.com/api/v1',

  // ---- CURRENT STATE ----
  currentLat: 46.0569,   // Ljubljana default
  currentLon: 14.5058,
  currentCity: 'Ljubljana',
  currentCountry: 'SI',
  _cache: {},
  _cacheExpiry: 10 * 60 * 1000, // 10 min

  // ---- CACHE ----
  _cacheGet(key) {
    const item = this._cache[key];
    if (!item) return null;
    if (Date.now() - item.ts > this._cacheExpiry) { delete this._cache[key]; return null; }
    return item.data;
  },
  _cacheSet(key, data) { this._cache[key] = { data, ts: Date.now() }; },

  // ---- FETCH WITH RETRY ----
  async fetchJSON(url, retries = 2) {
    const cached = this._cacheGet(url);
    if (cached) return cached;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this._cacheSet(url, data);
        return data;
      } catch(e) {
        if (i === retries) throw e;
        await sleep(1000 * (i + 1));
      }
    }
  },

  // ---- GEOCODING: search ----
  async searchLocation(query) {
    const url = `${this.NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
    const data = await this.fetchJSON(url);
    return data.map(r => ({
      name: r.display_name,
      shortName: [r.address?.city || r.address?.town || r.address?.village || r.address?.municipality, r.address?.country].filter(Boolean).join(', '),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      country: r.address?.country_code?.toUpperCase() || ''
    }));
  },

  // ---- REVERSE GEOCODING ----
  async reverseGeocode(lat, lon) {
    const url = `${this.NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const data = await this.fetchJSON(url);
    const a = data.address || {};
    return {
      city: a.city || a.town || a.village || a.municipality || a.county || 'Neznano',
      country: a.country || '',
      countryCode: a.country_code?.toUpperCase() || '',
      state: a.state || '',
      full: data.display_name
    };
  },

  // ---- OPEN-METEO GEOCODING ----
  async searchOpenMeteo(query) {
    const url = `${this.GEOCODING}/search?name=${encodeURIComponent(query)}&count=6&language=sl&format=json`;
    const data = await this.fetchJSON(url);
    return (data.results || []).map(r => ({
      name: `${r.name}, ${r.country}`,
      shortName: `${r.name}, ${r.country}`,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country_code || ''
    }));
  },

  // ---- CURRENT + HOURLY + DAILY FORECAST ----
  async getForecast(lat, lon) {
    const url = `${this.OPEN_METEO}/forecast?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      current: [
        'temperature_2m','relative_humidity_2m','apparent_temperature',
        'is_day','precipitation','rain','showers','snowfall',
        'weather_code','cloud_cover','pressure_msl','surface_pressure',
        'wind_speed_10m','wind_direction_10m','wind_gusts_10m',
        'uv_index','uv_index_clear_sky',
        'sunshine_duration','direct_radiation','diffuse_radiation',
        'direct_normal_irradiance','terrestrial_radiation',
        'dew_point_2m','visibility','et0_fao_evapotranspiration',
        'cape','lightning_potential'
      ].join(','),
      hourly: [
        'temperature_2m','dew_point_2m','relative_humidity_2m',
        'apparent_temperature','precipitation_probability','precipitation',
        'rain','showers','snowfall','snow_depth','weather_code',
        'pressure_msl','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high',
        'visibility','wind_speed_10m','wind_direction_10m','wind_gusts_10m',
        'uv_index','direct_radiation','diffuse_radiation','sunshine_duration',
        'freezing_level_height','soil_temperature_0cm','soil_temperature_6cm',
        'soil_moisture_0_to_1cm','cape','lightning_potential','convective_inhibition'
      ].join(','),
      daily: [
        'weather_code','temperature_2m_max','temperature_2m_min',
        'apparent_temperature_max','apparent_temperature_min',
        'sunrise','sunset','daylight_duration','sunshine_duration',
        'uv_index_max','uv_index_clear_sky_max',
        'precipitation_sum','rain_sum','showers_sum','snowfall_sum',
        'precipitation_hours','precipitation_probability_max',
        'wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant',
        'shortwave_radiation_sum','et0_fao_evapotranspiration'
      ].join(','),
      forecast_days: 16,
      past_days: 2,
      timezone: 'auto',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timeformat: 'iso8601'
    });
    return await this.fetchJSON(url);
  },

  // ---- AIR QUALITY ----
  async getAirQuality(lat, lon) {
    const url = `${this.AIR_QUALITY}/air-quality?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      hourly: [
        'pm10','pm2_5','carbon_monoxide','nitrogen_dioxide',
        'sulphur_dioxide','ozone','aerosol_optical_depth',
        'dust','uv_index','uv_index_clear_sky','alder_pollen',
        'birch_pollen','grass_pollen','mugwort_pollen','olive_pollen',
        'ragweed_pollen','european_aqi','us_aqi'
      ].join(','),
      timezone: 'auto',
      forecast_days: 3
    });
    return await this.fetchJSON(url);
  },

  // ---- CLIMATE (historical) ----
  async getClimate(lat, lon) {
    const url = `${this.OPEN_METEO}/climate?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      start_date: '1991-01-01',
      end_date: '2020-12-31',
      models: 'EC_Earth3P_HR',
      daily: [
        'temperature_2m_max','temperature_2m_min','temperature_2m_mean',
        'precipitation_sum','rain_sum','snowfall_sum',
        'wind_speed_10m_mean','cloud_cover_mean','shortwave_radiation_sum'
      ].join(',')
    });
    // Note: climate API may be slow, use forecast for approximation
    try { return await this.fetchJSON(url); }
    catch(e) { return null; }
  },

  // ---- ELEVATION ----
  async getElevation(lat, lon) {
    const url = `${this.OPEN_ELEVATION}/lookup?locations=${lat},${lon}`;
    try {
      const data = await this.fetchJSON(url);
      return data.results?.[0]?.elevation ?? null;
    } catch(e) { return null; }
  },

  // ---- RAINVIEWER RADAR FRAMES ----
  async getRadarFrames() {
    return await this.fetchJSON(this.RAINVIEWER);
  },

  // ---- OPEN-METEO MARINE (for coastal areas) ----
  async getMarine(lat, lon) {
    const url = `${this.OPEN_METEO}/marine?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      hourly: [
        'wave_height','wave_direction','wave_period',
        'wind_wave_height','wind_wave_direction','wind_wave_period',
        'swell_wave_height','swell_wave_direction','swell_wave_period',
        'ocean_current_velocity','ocean_current_direction'
      ].join(','),
      daily: ['wave_height_max','wave_direction_dominant','wave_period_max'].join(','),
      timezone: 'auto',
      forecast_days: 7
    });
    try { return await this.fetchJSON(url); }
    catch(e) { return null; }
  },

  // ---- HISTORICAL DATA for climate charts ----
  async getHistorical(lat, lon, startDate, endDate) {
    const url = `${this.OPEN_METEO}/archive?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      start_date: startDate,
      end_date: endDate,
      daily: [
        'weather_code','temperature_2m_max','temperature_2m_min','temperature_2m_mean',
        'precipitation_sum','rain_sum','snowfall_sum','sunshine_duration',
        'wind_speed_10m_max','wind_direction_10m_dominant',
        'shortwave_radiation_sum','et0_fao_evapotranspiration'
      ].join(','),
      timezone: 'auto'
    });
    return await this.fetchJSON(url);
  },

  // ---- FLOOD FORECAST ----
  async getFlood(lat, lon) {
    const url = `https://flood-api.open-meteo.com/v1/flood?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      daily: ['river_discharge','river_discharge_mean','river_discharge_median','river_discharge_max','river_discharge_min','river_discharge_p25','river_discharge_p75'].join(','),
      forecast_days: 16,
      past_days: 7
    });
    try { return await this.fetchJSON(url); }
    catch(e) { return null; }
  },

  // ---- ENSEMBLE FORECAST ----
  async getEnsemble(lat, lon) {
    const url = `https://ensemble-api.open-meteo.com/v1/ensemble?` + new URLSearchParams({
      latitude: lat, longitude: lon,
      hourly: ['temperature_2m','precipitation','wind_speed_10m'].join(','),
      models: 'icon_seamless',
      forecast_days: 7,
      timezone: 'auto'
    });
    try { return await this.fetchJSON(url); }
    catch(e) { return null; }
  },

  // ---- SET LOCATION ----
  async setLocation(lat, lon, city, country) {
    this.currentLat = lat;
    this.currentLon = lon;
    this.currentCity = city;
    this.currentCountry = country;
    // Clear cache for this location
    Object.keys(this._cache).forEach(k => { if (k.includes(lat) || k.includes(lon)) delete this._cache[k]; });
    Store.set('lastLocation', { lat, lon, city, country });
    if (window.App) await App.refreshAll();
  },

  // ---- GET CURRENT LOCATION (GPS) ----
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolokacija ni podprta')); return; }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        e => reject(e),
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  }
};

// OWM tile key — free public demo key for tiles only
const OWM_TILE_KEY = ''; // can be set in settings
