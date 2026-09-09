/* =============================================
   METEOSPHERE — AIR QUALITY MODULE
   ============================================= */

const AirQuality = {
  async load(lat, lon) {
    try {
      const data = await API.getAirQuality(lat, lon);
      this.render(data);
    } catch(e) {
      console.warn('Air quality data unavailable:', e);
      document.getElementById('aqiNumber').textContent = 'N/A';
      document.getElementById('aqiLabel').textContent = 'Ni podatkov';
    }
  },

  render(data) {
    const h = data.hourly;
    const now = new Date();
    const idx = Math.max(0, h.time.findIndex(t => new Date(t) >= now));

    const euAqi = h.european_aqi?.[idx];
    const pm25  = h.pm2_5?.[idx];
    const pm10  = h.pm10?.[idx];
    const no2   = h.nitrogen_dioxide?.[idx];
    const o3    = h.ozone?.[idx];
    const so2   = h.sulphur_dioxide?.[idx];
    const co    = h.carbon_monoxide?.[idx];

    if (euAqi !== undefined && euAqi !== null) {
      const aqiInfo = AQI.label(euAqi);
      document.getElementById('aqiNumber').textContent = Math.round(euAqi);
      document.getElementById('aqiLabel').textContent = aqiInfo.text;
      document.getElementById('aqiLabel').className = `aqi-label-text ${aqiInfo.cls}`;

      // Draw gauge
      this._drawGauge('aqiGauge', euAqi, aqiInfo.color);

      // Recommendations
      const recEl = document.getElementById('aqiRecommendations');
      if (recEl) {
        recEl.innerHTML = `
          <div class="aqi-rec-item">💡 ${aqiInfo.rec}</div>
          ${euAqi <= 50 ? '<div class="aqi-rec-item">🏃 Primerno za tek in kolesarjenje.</div>' : ''}
          ${euAqi > 50 && euAqi <= 100 ? '<div class="aqi-rec-item">🚶 Priporoča se zmanjšanje fizične aktivnosti na prostem.</div>' : ''}
          ${euAqi > 100 ? '<div class="aqi-rec-item">😷 Priporoča se nošenje zaščitne maske na prostem.</div>' : ''}
          ${euAqi > 150 ? '<div class="aqi-rec-item">🏠 Ostanite v zaprtih prostorih, zaprite okna.</div>' : ''}
        `;
      }
    }

    // Component bars
    this._setBar('barPM25', 'valPM25', pm25, 75, 'µg/m³');
    this._setBar('barPM10', 'valPM10', pm10, 150, 'µg/m³');
    this._setBar('barNO2', 'valNO2', no2, 200, 'µg/m³');
    this._setBar('barO3', 'valO3', o3, 240, 'µg/m³');
    this._setBar('barSO2', 'valSO2', so2, 350, 'µg/m³');
    this._setBar('barCO', 'valCO', co, 30000, 'µg/m³');

    // AQI chart
    Charts.renderAQI('aqiChart', data);
  },

  _setBar(barId, valId, value, max, unit) {
    const barEl = document.getElementById(barId);
    const valEl = document.getElementById(valId);
    if (!barEl || !valEl || value === null || value === undefined) return;
    const pct = Math.min(100, (value / max) * 100);
    barEl.style.width = `${pct}%`;
    const color = pct < 40 ? '#69F0AE' : pct < 70 ? '#FFF176' : pct < 90 ? '#FFB74D' : '#FF5252';
    barEl.style.background = color;
    valEl.textContent = `${Math.round(value * 10) / 10} ${unit}`;
  },

  _drawGauge(canvasId, value, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H - 10;
    const r = Math.min(W, H * 1.8) / 2 - 10;
    const startAngle = Math.PI;
    const endAngle = 0;
    const progress = Math.min(1, value / 500);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle, false);
    ctx.strokeStyle = 'rgba(79,195,247,0.1)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Color gradient segments
    const segments = [
      { end: 0.1, color: '#69F0AE' }, { end: 0.2, color: '#FFF176' },
      { end: 0.3, color: '#FFB74D' }, { end: 0.4, color: '#FF5252' },
      { end: 0.6, color: '#CE93D8' }, { end: 1.0, color: '#FF1744' }
    ];
    let prevEnd = 0;
    segments.forEach(seg => {
      const sa = Math.PI + prevEnd * Math.PI;
      const ea = Math.PI + Math.min(seg.end, progress) * Math.PI;
      if (ea > sa) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, sa, ea, false);
        ctx.strokeStyle = progress >= seg.end ? seg.color : (progress > prevEnd ? seg.color : 'transparent');
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      prevEnd = seg.end;
    });

    // Needle
    const needleAngle = Math.PI + progress * Math.PI;
    const nx = cx + (r - 24) * Math.cos(needleAngle);
    const ny = cy + (r - 24) * Math.sin(needleAngle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#E8F4FD';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#E8F4FD';
    ctx.fill();
  }
};
