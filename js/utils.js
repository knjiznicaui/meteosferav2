/* =============================================
   METEOSPHERE — UTILITIES
   ============================================= */

// ---- SETTINGS STORE ----
const Settings = {
  defaults: {
    unit: 'C',
    windUnit: 'kmh',
    pressUnit: 'hpa',
    precipUnit: 'mm',
    timeFormat: '24h',
    theme: 'dark',
    lang: 'sl',
    refreshInterval: 15,
    defaultLocation: null,
    savedLocations: [],
    apiKeys: {},
    alertThresholds: { minTemp: -5, maxTemp: 35, wind: 50, precip: 20 }
  },
  get(key) {
    const stored = localStorage.getItem('meteosphere_' + key);
    if (stored !== null) try { return JSON.parse(stored); } catch(e) { return stored; }
    return this.defaults[key] ?? null;
  },
  set(key, val) { localStorage.setItem('meteosphere_' + key, JSON.stringify(val)); },
  getAll() {
    const all = {};
    Object.keys(this.defaults).forEach(k => { all[k] = this.get(k); });
    return all;
  }
};

// ---- UNIT CONVERSIONS ----
const Convert = {
  temp(val, from = 'C', to) {
    to = to || Settings.get('unit') || 'C';
    if (from === to) return val;
    let c = from === 'F' ? (val - 32) * 5/9 : from === 'K' ? val - 273.15 : val;
    if (to === 'F') return c * 9/5 + 32;
    if (to === 'K') return c + 273.15;
    return c;
  },
  tempStr(val, from = 'C') {
    const unit = Settings.get('unit') || 'C';
    const converted = this.temp(val, from, unit);
    return `${Math.round(converted * 10) / 10}°${unit}`;
  },
  wind(val, from = 'kmh') {
    const to = Settings.get('windUnit') || 'kmh';
    if (from === to) return val;
    // Convert to m/s first
    let ms = from === 'kmh' ? val / 3.6 : from === 'mph' ? val * 0.44704 : from === 'knots' ? val * 0.51444 : val;
    if (to === 'kmh') return ms * 3.6;
    if (to === 'mph') return ms / 0.44704;
    if (to === 'knots') return ms / 0.51444;
    if (to === 'ms') return ms;
    if (to === 'bf') {
      if (ms < 0.3) return 0; if (ms < 1.5) return 1; if (ms < 3.3) return 2;
      if (ms < 5.5) return 3; if (ms < 7.9) return 4; if (ms < 10.7) return 5;
      if (ms < 13.8) return 6; if (ms < 17.1) return 7; if (ms < 20.7) return 8;
      if (ms < 24.4) return 9; if (ms < 28.4) return 10; if (ms < 32.6) return 11;
      return 12;
    }
    return ms;
  },
  windStr(val, from = 'kmh') {
    const unit = Settings.get('windUnit') || 'kmh';
    const converted = this.wind(val, from);
    const units = { kmh: 'km/h', ms: 'm/s', mph: 'mph', knots: 'kt', bf: 'Bft' };
    return `${Math.round(converted * 10) / 10} ${units[unit] || unit}`;
  },
  pressure(val, from = 'hpa') {
    const to = Settings.get('pressUnit') || 'hpa';
    if (from === to) return val;
    let hpa = val;
    if (to === 'inhg') return hpa * 0.02953;
    if (to === 'mmhg') return hpa * 0.75006;
    if (to === 'atm') return hpa / 1013.25;
    return hpa;
  },
  pressureStr(val, from = 'hpa') {
    const unit = Settings.get('pressUnit') || 'hpa';
    const converted = this.pressure(val, from);
    const units = { hpa: 'hPa', inhg: 'inHg', mmhg: 'mmHg', atm: 'atm' };
    return `${Math.round(converted * 100) / 100} ${units[unit] || unit}`;
  },
  precip(val, from = 'mm') {
    const to = Settings.get('precipUnit') || 'mm';
    if (from === to) return val;
    return from === 'mm' ? val / 25.4 : val * 25.4;
  },
  precipStr(val, from = 'mm') {
    const unit = Settings.get('precipUnit') || 'mm';
    const converted = this.precip(val, from);
    return `${Math.round(converted * 10) / 10} ${unit}`;
  }
};

// ---- TIME UTILITIES ----
const TimeUtil = {
  format(isoStr, opts = {}) {
    const d = new Date(isoStr);
    const fmt = Settings.get('timeFormat') || '24h';
    if (opts.timeOnly) {
      if (fmt === '12h') return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });
      return d.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d;
  },
  formatHour(isoStr) {
    const d = new Date(isoStr);
    const fmt = Settings.get('timeFormat') || '24h';
    if (fmt === '12h') return d.toLocaleTimeString('en', { hour: 'numeric', hour12: true });
    return `${String(d.getHours()).padStart(2,'0')}:00`;
  },
  formatDate(isoStr, short = false) {
    const d = new Date(isoStr);
    const days = ['Ned','Pon','Tor','Sre','Čet','Pet','Sob'];
    const daysFull = ['Nedelja','Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota'];
    const months = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec'];
    if (short) return days[d.getDay()];
    return `${daysFull[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
  },
  isToday(isoStr) {
    const d = new Date(isoStr);
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  },
  minutesAgo(isoStr) {
    return Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
  }
};

// ---- WEATHER CODE INTERPRETER ----
const WMO = {
  codes: {
    0:  { label: 'Jasno',               icon: '☀️',  bg: 'sunny' },
    1:  { label: 'Pretežno jasno',      icon: '🌤️', bg: 'sunny' },
    2:  { label: 'Delno oblačno',       icon: '⛅',  bg: 'cloudy' },
    3:  { label: 'Oblačno',             icon: '☁️',  bg: 'cloudy' },
    45: { label: 'Megla',               icon: '🌫️', bg: 'fog' },
    48: { label: 'Ledena megla',        icon: '🌫️', bg: 'fog' },
    51: { label: 'Rahla rosica',        icon: '🌦️', bg: 'drizzle' },
    53: { label: 'Rosica',              icon: '🌦️', bg: 'drizzle' },
    55: { label: 'Močna rosica',        icon: '🌦️', bg: 'drizzle' },
    56: { label: 'Ledena rosica',       icon: '🌨️', bg: 'snow' },
    57: { label: 'Močna ledena rosica', icon: '🌨️', bg: 'snow' },
    61: { label: 'Rahel dež',           icon: '🌧️', bg: 'rain' },
    63: { label: 'Dež',                 icon: '🌧️', bg: 'rain' },
    65: { label: 'Močan dež',           icon: '🌧️', bg: 'rain' },
    66: { label: 'Ledeni dež',          icon: '🌨️', bg: 'sleet' },
    67: { label: 'Močan ledeni dež',    icon: '🌨️', bg: 'sleet' },
    71: { label: 'Rahel sneg',          icon: '🌨️', bg: 'snow' },
    73: { label: 'Sneg',                icon: '❄️',  bg: 'snow' },
    75: { label: 'Močan sneg',          icon: '❄️',  bg: 'snow' },
    77: { label: 'Snežne kroglice',     icon: '🌨️', bg: 'snow' },
    80: { label: 'Rahle plohe',         icon: '🌦️', bg: 'rain' },
    81: { label: 'Plohe',               icon: '🌦️', bg: 'rain' },
    82: { label: 'Močne plohe',         icon: '⛈️', bg: 'storm' },
    85: { label: 'Snežne plohe',        icon: '🌨️', bg: 'snow' },
    86: { label: 'Močne snežne plohe',  icon: '❄️',  bg: 'snow' },
    95: { label: 'Nevihta',             icon: '⛈️', bg: 'storm' },
    96: { label: 'Nevihta s točo',      icon: '⛈️', bg: 'storm' },
    99: { label: 'Nevihta z močno točo',icon: '⛈️', bg: 'storm' }
  },
  get(code) { return this.codes[code] || { label: 'Neznano', icon: '❓', bg: '' }; },
  icon(code) { return this.get(code).icon; },
  label(code) { return this.get(code).label; }
};

// ---- WIND DIRECTION ----
const WindDir = {
  dirs: ['S','SSV','SV','VSV','V','VJV','JV','JJV','J','JJZ','JZ','ZJZ','Z','ZSZ','SZ','SSZ'],
  fromDeg(deg) {
    const idx = Math.round(((deg % 360) / 360) * 16) % 16;
    return this.dirs[idx];
  },
  arrow(deg) {
    const arrows = ['↑','↗','→','↘','↓','↙','←','↖'];
    const idx = Math.round(((deg % 360) / 360) * 8) % 8;
    return arrows[idx];
  }
};

// ---- UV INDEX ----
const UVIndex = {
  label(uv) {
    if (uv < 3)  return { text: 'Nizek', cls: 'uv-0' };
    if (uv < 6)  return { text: 'Zmeren', cls: 'uv-3' };
    if (uv < 8)  return { text: 'Visok', cls: 'uv-6' };
    if (uv < 11) return { text: 'Zelo visok', cls: 'uv-8' };
    return { text: 'Ekstremen', cls: 'uv-11' };
  }
};

// ---- AQI ----
const AQI = {
  label(aqi) {
    if (aqi <= 50)  return { text: 'Dobra', cls: 'aqi-good', color: '#69F0AE', rec: '🌿 Kakovost zraka je odlična. Idealno za vse aktivnosti na prostem.' };
    if (aqi <= 100) return { text: 'Zmerna', cls: 'aqi-moderate', color: '#FFF176', rec: '😷 Kakovost zraka je sprejemljiva. Posebej občutljivi posamezniki naj zmanjšajo naporno aktivnost na prostem.' };
    if (aqi <= 150) return { text: 'Nezdrava za občutljive', cls: 'aqi-sensitive', color: '#FFB74D', rec: '⚠️ Člani občutljivih skupin naj zmanjšajo aktivnosti na prostem.' };
    if (aqi <= 200) return { text: 'Nezdrava', cls: 'aqi-unhealthy', color: '#FF5252', rec: '🚫 Vsi naj zmanjšajo naporne aktivnosti na prostem.' };
    if (aqi <= 300) return { text: 'Zelo nezdrava', cls: 'aqi-very-unhealthy', color: '#CE93D8', rec: '🚨 Zdravstvena opozorila. Izogibajte se aktivnostim na prostem.' };
    return { text: 'Nevarna', cls: 'aqi-hazardous', color: '#FF1744', rec: '☠️ Nujno zdravstveno opozorilo! Ostanite v zaprtih prostorih.' };
  }
};

// ---- DEWPOINT COMFORT ----
const Dewpoint = {
  comfort(dp) {
    if (dp < 10) return 'Suho';
    if (dp < 15) return 'Udobno';
    if (dp < 20) return 'Vlažno';
    if (dp < 24) return 'Neprijetno';
    if (dp < 27) return 'Žlahto';
    return 'Izjemno vlažno';
  }
};

// ---- MOON PHASE ----
const Moon = {
  phases: ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'],
  phaseNames: ['Nova luna','Mlada luna','Polmesec (naraščajoč)','Polna luna pred polno','Polna luna','Polna luna po polni','Polmesec (pojemajoč)','Stara luna'],
  calculate(date) {
    const d = new Date(date);
    const ref = new Date(2000, 0, 6, 18, 14); // known new moon
    const diff = (d - ref) / (1000 * 60 * 60 * 24);
    const cycle = 29.53058867;
    const phase = ((diff % cycle) + cycle) % cycle;
    const idx = Math.floor(phase / cycle * 8) % 8;
    const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * phase / cycle)));
    return { idx, phase, illumination, icon: this.phases[idx], name: this.phaseNames[idx] };
  }
};

// ---- KOPPEN CLASSIFICATION ----
const Koppen = {
  classify(avgTemp, annualPrecip, minMonthTemp, maxMonthTemp) {
    if (annualPrecip < 200) return { code: 'BWh', name: 'Vroča puščava', desc: 'Suho podnebje z minimalno padavinami (<200mm/leto) in visokimi temperaturami.' };
    if (minMonthTemp < -3 && maxMonthTemp > 10) return { code: 'Dfb', name: 'Celinsko vlažno podnebje', desc: 'Zmerno celinsko podnebje brez suhega letnega časa, z milimi poletji.' };
    if (minMonthTemp >= -3 && minMonthTemp < 0) return { code: 'Cfb', name: 'Oceanski/Zmerno toplo podnebje', desc: 'Zmerno podnebje, ki ga odlikuje enakomerna porazdelitev padavin med letom in mile temperature.' };
    if (minMonthTemp >= 0 && maxMonthTemp < 22) return { code: 'Csb', name: 'Mediteransko podnebje', desc: 'Suha poletja in vlažne mile zime. Značilno za primorske regije.' };
    return { code: 'Cfa', name: 'Subtropično vlažno podnebje', desc: 'Vroča vlažna poletja in mrzle zime z enakomerno porazdeljenimi padavinami.' };
  }
};

// ---- TOAST NOTIFICATION ----
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(24px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- DEBOUNCE ----
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ---- FORMAT NUMBER ----
function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '--';
  return Number(n).toFixed(decimals);
}

// ---- CLAMP ----
function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

// ---- SLEEP ----
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- LOCAL STORAGE HELPERS ----
const Store = {
  get(key, def = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch(e) { return def; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} },
  push(key, item, maxLen = 1000) {
    const arr = this.get(key, []);
    arr.push(item);
    if (arr.length > maxLen) arr.shift();
    this.set(key, arr);
  }
};

// ---- CLOCK ----
function startClock() {
  const el = document.getElementById('timeDisplay');
  function update() {
    const d = new Date();
    const fmt = Settings.get('timeFormat') || '24h';
    let time;
    if (fmt === '12h') {
      time = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } else {
      time = d.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    const days = ['Ned','Pon','Tor','Sre','Čet','Pet','Sob'];
    const months = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec'];
    el.textContent = `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}  ${time}`;
  }
  update();
  setInterval(update, 1000);
}

// ---- EXPORT CSV ----
function arrayToCSV(data, headers) {
  const rows = [headers.join(',')];
  data.forEach(row => rows.push(headers.map(h => `"${row[h] ?? ''}"`).join(',')));
  return rows.join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ---- BEAUFORT SCALE ----
function beaufortDescription(bf) {
  const desc = ['Zatišje','Slab vetrič','Lahek vetrič','Blag veter','Zmeren veter','Svež veter','Zmerno silovit','Silovit veter','Viharni veter','Hud vihar','Orkan (šibek)','Orkan','Orkan (silovit)'];
  return desc[clamp(bf, 0, 12)];
}
