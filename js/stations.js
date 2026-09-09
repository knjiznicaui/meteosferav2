/* =============================================
   METEOSPHERE — STATIONS & MANUAL INPUT
   ============================================= */

const Stations = {
  STORAGE_KEY: 'meteosphere_manual_readings',

  saveManualReading() {
    const reading = {
      ts: Date.now(),
      temp:       parseFloat(document.getElementById('inpTemp').value)       || null,
      humidity:   parseFloat(document.getElementById('inpHumidity').value)   || null,
      pressure:   parseFloat(document.getElementById('inpPressure').value)   || null,
      wind:       parseFloat(document.getElementById('inpWind').value)       || null,
      windDir:    parseFloat(document.getElementById('inpWindDir').value)     || null,
      precip:     parseFloat(document.getElementById('inpPrecip').value)     || null,
      dewpoint:   parseFloat(document.getElementById('inpDewpoint').value)   || null,
      visibility: parseFloat(document.getElementById('inpVisibility').value) || null,
      uv:         parseFloat(document.getElementById('inpUV').value)         || null,
      solar:      parseFloat(document.getElementById('inpSolar').value)      || null,
      notes:      document.getElementById('inpNotes').value                  || ''
    };

    if (!reading.temp && !reading.humidity && !reading.pressure) {
      showToast('Vnesite vsaj temperaturo, vlažnost ali tlak.', 'warning');
      return;
    }

    Store.push(this.STORAGE_KEY, reading);
    showToast('Meritev shranjena!', 'success');
    this.renderReadings();
    this._clearForm();
  },

  _clearForm() {
    ['inpTemp','inpHumidity','inpPressure','inpWind','inpWindDir',
     'inpPrecip','inpDewpoint','inpVisibility','inpUV','inpSolar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const notes = document.getElementById('inpNotes');
    if (notes) notes.value = '';
  },

  renderReadings() {
    const readings = Store.get(this.STORAGE_KEY, []);
    const card = document.getElementById('manualReadingsCard');
    const list = document.getElementById('manualReadingsList');
    if (!card || !list) return;

    if (readings.length === 0) { card.style.display = 'none'; return; }
    card.style.display = 'block';

    list.innerHTML = readings.slice(-20).reverse().map((r, i) => {
      const d = new Date(r.ts);
      const time = d.toLocaleString('sl', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const parts = [
        r.temp !== null ? `🌡️ ${r.temp}°C` : null,
        r.humidity !== null ? `💧 ${r.humidity}%` : null,
        r.pressure !== null ? `🔵 ${r.pressure} hPa` : null,
        r.wind !== null ? `💨 ${r.wind} km/h` : null,
        r.precip !== null ? `🌧️ ${r.precip} mm` : null
      ].filter(Boolean).join('  ');

      return `
        <div class="reading-item">
          <div>
            <strong>${time}</strong>
            <span style="margin-left:12px;font-size:12px;">${parts}</span>
            ${r.notes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${r.notes}</div>` : ''}
          </div>
          <button class="secondary-btn" style="padding:4px 10px;font-size:11px;" onclick="Stations.deleteReading(${readings.length - 1 - i})">✕</button>
        </div>
      `;
    }).join('');

    // Chart
    const chartData = readings.filter(r => r.temp !== null).slice(-30);
    if (chartData.length > 1) Charts.renderManualReadings('manualTempChart', chartData);
  },

  deleteReading(idx) {
    const readings = Store.get(this.STORAGE_KEY, []);
    readings.splice(idx, 1);
    Store.set(this.STORAGE_KEY, readings);
    this.renderReadings();
    showToast('Meritev izbrisana.', 'info');
  },

  exportReadings() {
    const readings = Store.get(this.STORAGE_KEY, []);
    if (!readings.length) { showToast('Ni shranjenih meritev.', 'warning'); return; }
    const headers = ['timestamp','temp','humidity','pressure','wind','windDir','precip','dewpoint','visibility','uv','solar','notes'];
    const rows = [headers.join(',')];
    readings.forEach(r => {
      rows.push([
        new Date(r.ts).toISOString(),
        r.temp ?? '', r.humidity ?? '', r.pressure ?? '', r.wind ?? '',
        r.windDir ?? '', r.precip ?? '', r.dewpoint ?? '', r.visibility ?? '',
        r.uv ?? '', r.solar ?? '', `"${(r.notes || '').replace(/"/g, "'")}"` 
      ].join(','));
    });
    downloadCSV(rows.join('\n'), `meteosphere_meritve_${new Date().toISOString().slice(0,10)}.csv`);
    showToast('CSV izvožen!', 'success');
  },

  clearReadings() {
    if (!confirm('Res izbrisati vse shranjene meritve?')) return;
    Store.set(this.STORAGE_KEY, []);
    this.renderReadings();
    showToast('Vse meritve izbrisane.', 'info');
  }
};

// Global wrappers
function saveManualReading() { Stations.saveManualReading(); }
function exportReadings() { Stations.exportReadings(); }
function clearReadings() { Stations.clearReadings(); }
