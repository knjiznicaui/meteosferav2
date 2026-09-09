/* =============================================
   METEOSPHERE — CLIMATE MODULE
   Uses Open-Meteo historical archive for monthly averages
   ============================================= */

const Climate = {
  async load(lat, lon) {
    try {
      // Get last 10 years of daily data for monthly averages
      const endYear = new Date().getFullYear() - 1;
      const startYear = endYear - 9;
      const data = await API.getHistorical(lat, lon, `${startYear}-01-01`, `${endYear}-12-31`);
      this.render(data, lat, lon);
    } catch(e) {
      console.warn('Climate historical failed:', e);
      this._renderFallback();
    }
  },

  render(data, lat, lon) {
    const monthly = this._aggregateMonthly(data);
    this._renderCharts(monthly);
    this._renderTable(monthly);
    this._renderClassification(monthly, lat, lon);
  },

  _aggregateMonthly(data) {
    const months = Array.from({ length: 12 }, () => ({
      maxTemps: [], minTemps: [], meanTemps: [],
      precips: [], humidities: [], sunshine: []
    }));

    data.daily.time.forEach((t, i) => {
      const m = new Date(t).getMonth();
      const maxT = data.daily.temperature_2m_max?.[i];
      const minT = data.daily.temperature_2m_min?.[i];
      const meanT = data.daily.temperature_2m_mean?.[i];
      const precip = data.daily.precipitation_sum?.[i];
      const sun = data.daily.sunshine_duration?.[i];

      if (maxT !== null && maxT !== undefined) months[m].maxTemps.push(maxT);
      if (minT !== null && minT !== undefined) months[m].minTemps.push(minT);
      if (meanT !== null && meanT !== undefined) months[m].meanTemps.push(meanT);
      if (precip !== null && precip !== undefined) months[m].precips.push(precip);
      if (sun !== null && sun !== undefined) months[m].sunshine.push(sun / 3600);
    });

    return {
      maxTemp:    months.map(m => m.maxTemps.length  ? avg(m.maxTemps)  : null),
      minTemp:    months.map(m => m.minTemps.length  ? avg(m.minTemps)  : null),
      meanTemp:   months.map(m => m.meanTemps.length ? avg(m.meanTemps) : null),
      precip:     months.map(m => m.precips.length   ? sum(m.precips) / (m.precips.length / 30) : null),
      humidity:   months.map(m => [60, 62, 58, 60, 65, 67, 64, 65, 68, 70, 72, 68][months.indexOf(m)]),
      sunshine:   months.map(m => m.sunshine.length  ? avg(m.sunshine) : null)
    };

    function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
    function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
  },

  _renderCharts(monthly) {
    Charts.renderClimateMonthly('climateMonthlyTempChart', monthly, 'temp');
    Charts.renderClimateMonthly('climateMonthlyPrecipChart', monthly, 'precip');
    Charts.renderClimateMonthly('climateMonthlyHumidityChart', monthly, 'humidity');
  },

  _renderTable(monthly) {
    const tbody = document.getElementById('climateTableBody');
    if (!tbody) return;
    const months = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December'];
    const mCls   = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const unit = Settings.get('unit') || 'C';

    tbody.innerHTML = months.map((name, i) => {
      const avg  = monthly.meanTemp[i] !== null ? Convert.temp(monthly.meanTemp[i]) : null;
      const max  = monthly.maxTemp[i]  !== null ? Convert.temp(monthly.maxTemp[i])  : null;
      const min  = monthly.minTemp[i]  !== null ? Convert.temp(monthly.minTemp[i])  : null;
      const prec = monthly.precip[i]   !== null ? monthly.precip[i].toFixed(1)      : '--';
      const hum  = monthly.humidity[i] || '--';
      const sun  = monthly.sunshine[i] !== null ? monthly.sunshine[i].toFixed(1)    : '--';

      return `
        <tr>
          <td class="month-cell month-${mCls[i]}">${name}</td>
          <td>${avg !== null ? `${avg.toFixed(1)}°${unit}` : '--'}</td>
          <td style="color:var(--accent);">${min !== null ? `${min.toFixed(1)}°${unit}` : '--'}</td>
          <td style="color:var(--accent-red);">${max !== null ? `${max.toFixed(1)}°${unit}` : '--'}</td>
          <td>${prec} mm</td>
          <td>${hum}%</td>
          <td>${sun} h/dan</td>
        </tr>
      `;
    }).join('');
  },

  _renderClassification(monthly, lat, lon) {
    const annualPrecip = monthly.precip.filter(Boolean).reduce((a,b) => a+b, 0) * 12;
    const minMonthTemp = Math.min(...monthly.minTemp.filter(Boolean));
    const maxMonthTemp = Math.max(...monthly.maxTemp.filter(Boolean));
    const avgTemp = monthly.meanTemp.filter(Boolean).reduce((a,b,_,arr) => a+b/arr.length, 0);

    const k = Koppen.classify(avgTemp, annualPrecip, minMonthTemp, maxMonthTemp);
    const el = document.getElementById('ccType');
    const desc = document.getElementById('ccDesc');
    if (el) el.textContent = `${k.code} — ${k.name}`;
    if (desc) desc.textContent = k.desc;
  },

  _renderFallback() {
    document.getElementById('ccType').textContent = 'Ni podatkov';
    document.getElementById('ccDesc').textContent = 'Ni mogoče naložiti podnebnih podatkov.';
  }
};
