/* =============================================
   METEOSPHERE — COMPARE & CLIMATE MODULES
   ============================================= */

// ---- COMPARE MODULE ----
const Compare = {
  cities: [null, null, null],

  async addCity(slot) {
    const input = document.getElementById(`compareCity${slot}`);
    if (!input || !input.value.trim()) return;

    showToast(`Iščem ${input.value}...`, 'info');
    try {
      const results = await API.searchOpenMeteo(input.value.trim());
      if (!results.length) { showToast('Lokacija ni najdena.', 'error'); return; }
      const r = results[0];
      const data = await API.getForecast(r.lat, r.lon);
      this.cities[slot - 1] = { city: r.shortName, lat: r.lat, lon: r.lon, data };
      showToast(`${r.shortName} dodano!`, 'success');
      this.render();
    } catch(e) {
      showToast('Napaka pri iskanju.', 'error');
    }
  },

  render() {
    const container = document.getElementById('compareResults');
    const chartCard = document.getElementById('compareChartCard');
    if (!container) return;

    const active = this.cities.filter(Boolean);
    if (!active.length) {
      container.innerHTML = '<div class="empty-state"><span class="es-icon">🏙️</span><div class="es-title">Dodajte mesta za primerjavo</div><div class="es-desc">Vnesite do 3 mesta in kliknite Dodaj.</div></div>';
      if (chartCard) chartCard.style.display = 'none';
      return;
    }

    container.innerHTML = active.map(c => {
      const curr = c.data.current;
      const daily = c.data.daily;
      const temp = Convert.tempStr(curr.temperature_2m);
      const feels = Convert.tempStr(curr.apparent_temperature);
      const wind = Convert.windStr(curr.wind_speed_10m);
      const icon = WMO.icon(curr.weather_code);
      const cond = WMO.label(curr.weather_code);

      return `
        <div class="compare-city-card">
          <div class="ccc-name">${c.city}</div>
          <div style="font-size:48px;text-align:center;padding:8px 0;">${icon}</div>
          <div class="ccc-temp">${temp}</div>
          <div class="ccc-stat">🌡️ Občutek: ${feels}</div>
          <div class="ccc-stat">📝 ${cond}</div>
          <div class="ccc-stat">💧 Vlažnost: ${curr.relative_humidity_2m}%</div>
          <div class="ccc-stat">💨 Veter: ${wind}</div>
          <div class="ccc-stat">🔵 Tlak: ${Convert.pressureStr(curr.pressure_msl)}</div>
          <div class="ccc-stat">☀️ UV: ${fmtNum(curr.uv_index, 0)}</div>
          <div class="ccc-stat">↑ Max: ${Convert.tempStr(daily.temperature_2m_max[0])}</div>
          <div class="ccc-stat">↓ Min: ${Convert.tempStr(daily.temperature_2m_min[0])}</div>
        </div>
      `;
    }).join('');

    if (active.length > 1 && chartCard) {
      chartCard.style.display = 'block';
      Charts.renderCompare('compareChart', active);
    }
  }
};

// Global wrappers
function addCompareCity(slot) { Compare.addCity(slot); }
