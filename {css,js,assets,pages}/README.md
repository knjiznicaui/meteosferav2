# ⛈️ MeteoSphere — Napredna Meteorološka Aplikacija

<div align="center">
  <img src="https://img.shields.io/badge/verzija-1.0.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/licenca-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/API-brezplačno-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/brez%20serverja-HTML%20%2B%20JS-purple?style=for-the-badge" />
</div>

<br/>

> **Vrhunska, celovita meteorološka aplikacija** z naprednim dizajnom, satelitskimi slikami, radarjem, podnebnimi analizami, astronomijo, kakovostjo zraka in vsem, kar potrebuje resni vremenski navdušenec — **popolnoma brezplačno, brez registracije, brez strežnika.**

---

## 🖼️ Zaslonske slike

| Nadzorna Plošča | Radar | Podnebje |
|---|---|---|
| *(Observatory UI, temni dizajn)* | *(RainViewer animirani radar)* | *(10-letni podnebni podatki)* |

---

## ✨ Funkcionalnosti

### 🏠 Nadzorna Plošča
- Trenutno vreme z obsežnimi metrikami
- Temperatura, občutek, min/max, UV indeks, tlak, vlažnost
- Kompas smeri vetra z animacijo
- Mrzlinski indeks (Wind Chill) in Toplotni indeks (Heat Index)
- Rosišče z opisom udobja
- Sončno sevanje (W/m²)
- Urni grafikon: temperatura, padavine, veter, vlažnost
- 7-dnevni pregled z ikonami
- Barometrični grafikon (7 dni tlaka)
- Grafikon vlažnosti in rosišča (24h)
- Mini interaktivna karta

### 📅 Napoved
- **14-dnevna napoved** s celotno tabelo
- Min/max temperature, padavine, verjetnost, veter, UV
- Čas sončnega vzhoda in zahoda za vsak dan
- Kombinirani bar/line grafikon
- Klik na mesto v karti → trenutno vreme

### 🕐 Urna Napoved (48 ur)
- Temperatura in občutek
- Padavine in verjetnost padavin
- Hitrost vetra in sunki
- Vlažnost
- Podrobna tabela z vsemi podatki

### 📡 Radar & Satelit
- **RainViewer** animirani padavinski radar z zgodovino
- Predvajanje/premotavanje posnetkov
- **Windy.com** embed: infrardeče, vidne, vodni par
- **Lightning Maps** za prikaz strel v realnem času

### 🗺️ Vremenska Karta
- Leaflet interaktivna karta
- Plasti: temperatura, padavine, veter, oblaki, tlak, sneg
- Nastavljiva prosojnost plasti
- Legenda za vsako plast
- Klik → vreme za lokacijo
- Windy.com napredna karta z embed

### 📊 Podnebje
- Mesečne povprečne temperature (10 let)
- Mesečne padavine (10 let)
- Grafikon dolžine dneva
- Podnebna tabela z vsemi meseci
- **Köppen podnebna klasifikacija**

### ⚠️ Opozorila
- Avtomatska opozorila iz podatkov (temperatura, veter, padavine, UV, CAPE)
- Nastavljivi pragovi opozoril
- ARSO opozorila (Slovenija)
- MeteoAlarm Evropa
- DWD opozorila

### 🌙 Astronomija
- Animirani lok sončeve poti
- Sončni vzhod, zenit, zahod
- Zlata ura, astronomska zora
- Dolžina dneva
- Luna: faza, osvetlitev, vznik, zahod
- Naslednja polna in nova luna
- Letni grafikon dolžine dneva

### 💨 Kakovost Zraka
- European AQI indeks z merilnikom
- PM2.5, PM10, NO₂, O₃, SO₂, CO
- Barvni progress bars za vsak parameter
- 24h AQI trend grafikon
- Priporočila glede na kakovost

### 🏗️ Vremenske Postaje
- ARSO merilna mesta (iframe)
- Tabela aktualnih meritev
- **Vnos lastnih meritev** z obrazcem
- Graf lastnih meritev
- Izvoz v CSV

### ⚖️ Primerjava Mest
- Do 3 mesta hkrati
- Kartice z vsemi aktualnimi podatki
- Primerjalni grafikon temperatur 7 dni

### ⚙️ Nastavitve
- Enote: °C / °F / K
- Veter: km/h, m/s, mph, vozli, Beaufort
- Tlak: hPa, inHg, mmHg, atm
- Padavine: mm, inch
- Format časa: 24h / 12h
- Tema: temna / svetla / samodejno
- Samodejno osveževanje (5–60 min)
- Shranjene lokacije
- API ključi (neobvezno)

---

## 🌐 Uporabljeni Brezplačni Viri

| Vir | Opis | Omejenost |
|-----|------|-----------|
| **[Open-Meteo](https://open-meteo.com)** | Temperatura, padavine, veter, UV, tlak, vlažnost, 16-dnevna napoved | Neomejeno, brez ključa |
| **[Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)** | PM2.5, PM10, NO₂, O₃, SO₂, CO, AQI | Neomejeno, brez ključa |
| **[Open-Meteo Archive](https://open-meteo.com/en/docs/historical-weather-api)** | 10+ let zgodovinskih podatkov za podnebje | Neomejeno, brez ključa |
| **[Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api)** | Iskanje lokacij | Neomejeno, brez ključa |
| **[Nominatim (OSM)](https://nominatim.openstreetmap.org)** | Reverse geocoding (GPS → ime kraja) | Neomejeno, brez ključa |
| **[RainViewer API](https://www.rainviewer.com/api.html)** | Padavinski radar, animacije | Neomejeno, brez ključa |
| **[OpenWeatherMap Tiles](https://openweathermap.org/api/weathermaps)** | Karte: temperatura, veter, oblaki... | Demo ključ (v kodi) |
| **[CartoDB Dark Tiles](https://carto.com)** | Temna osnovna karta | Neomejeno |
| **[Windy.com Embed](https://windy.com)** | Napreden vremenski embed | Neomejeno |
| **[Lightning Maps](https://www.lightningmaps.org)** | Strele v realnem času | Neomejeno |
| **[ARSO](https://meteo.arso.gov.si)** | Uradni podatki za Slovenijo | Javno dostopno |
| **[MeteoAlarm](https://www.meteoalarm.org)** | Vremenski alarmi za Evropo | Neomejeno |

---

## 🚀 Namestitev & Zagon

### Možnost 1: Direktno odpri v brskalniku
```bash
git clone https://github.com/TVOJE_IME/meteosphere.git
cd meteosphere
# Odpri index.html v brskalniku
```

### Možnost 2: Lokalni strežnik (priporočeno)
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```
Nato odpri `http://localhost:8080`

### Možnost 3: GitHub Pages
1. Naloži projekt na GitHub
2. Pojdi v **Settings → Pages**
3. Source: `main` branch, `/ (root)`
4. Dostopaj na `https://tvoje-ime.github.io/meteosphere`

---

## 📁 Struktura Projekta

```
meteosphere/
├── index.html              # Glavna HTML datoteka
├── README.md               # Ta datoteka
├── css/
│   ├── main.css            # Osnove, layout, komponente
│   ├── components.css      # UI komponente
│   └── animations.css      # Animacije
└── js/
    ├── utils.js            # Pomožne funkcije, enote, čas
    ├── api.js              # Open-Meteo, Nominatim, RainViewer
    ├── charts.js           # Chart.js konfiguracije
    ├── maps.js             # Leaflet karte
    ├── astronomy.js        # Sonce, luna, astronomija
    ├── airquality.js       # Kakovost zraka, AQI
    ├── stations.js         # Ročni vnos meritev
    ├── compare.js          # Primerjava mest
    ├── climate.js          # Podnebna analiza
    └── app.js              # Glavni orkestrator
```

---

## 📦 Zunanje Knjižnice (CDN, brez namestitve)

```html
<!-- Pisave -->
<link href="https://fonts.googleapis.com/css2?family=Inter&family=Space+Grotesk&display=swap" rel="stylesheet">

<!-- Leaflet (karte) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Chart.js (grafi) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

## ⚙️ Konfiguracija

### Brez API ključev (privzeto)
Aplikacija deluje takoj brez kakršnekoli konfiguracije.

### Z API ključi (neobvezno, za dodatne funkcije)
Odpri **Nastavitve** v aplikaciji:
- **OpenWeatherMap**: registracija na [openweathermap.org](https://openweathermap.org) → brezplačen ključ
- **Tomorrow.io**: registracija na [tomorrow.io](https://tomorrow.io) → brezplačen ključ
- **AirVisual**: registracija na [iqair.com](https://www.iqair.com/air-pollution-data-api) → brezplačen ključ

Ključi se shranijo lokalno v `localStorage`.

---

## 🌡️ Podprte Meritve

| Parameter | Vir | Napoved |
|-----------|-----|---------|
| Temperatura | Open-Meteo | 16 dni |
| Občutek | Open-Meteo | 16 dni |
| Padavine | Open-Meteo | 16 dni |
| Vlažnost | Open-Meteo | 16 dni |
| Tlak | Open-Meteo | 16 dni |
| Veter (hitrost, smer, sunki) | Open-Meteo | 16 dni |
| UV Indeks | Open-Meteo | 16 dni |
| Rosišče | Open-Meteo | 16 dni |
| Oblačnost | Open-Meteo | 16 dni |
| Vidljivost | Open-Meteo | 16 dni |
| Sončno sevanje | Open-Meteo | 16 dni |
| Snega globina | Open-Meteo | 16 dni |
| CAPE (nevihte) | Open-Meteo | 48h |
| PM2.5, PM10, NO₂... | Open-Meteo AQ | 3 dni |
| AQI (European, US) | Open-Meteo AQ | 3 dni |
| Radar | RainViewer | sedanjost |

---

## 🎨 Dizajn

- **Tema**: "Observatory UI" — temna modra kot nočno nebo
- **Paleta**: Globoko modra `#080C18` + Ledena cyan `#4FC3F7` + Električna cyan `#00E5FF`
- **Tipografija**: Inter (UI) + Space Grotesk (podatki/številke)
- **Svetla tema**: Dostopna z enim klikom
- **Animacije**: Plavajoče ikone, radar sweep, dežne kapljice, sneg

---

## 📱 Odzivnost

- ✅ Desktop (1920px+)
- ✅ Laptop (1200px)
- ✅ Tablet (768px)
- ✅ Mobitel (360px+)
- ✅ Sidebar se samodejno skrije na mobilnih

---

## 🔒 Zasebnost

- ❌ Brez strežnika, brez zbiranja podatkov
- ❌ Brez piškotkov tretjih oseb
- ✅ GPS lokacija: samo lokalno, nikoli shranjena v oblak
- ✅ Vse nastavitve: `localStorage` (samo na vaši napravi)
- ✅ Meritve postaje: `localStorage` (samo na vaši napravi)

---

## 📄 Licenca

MIT © 2024 — Prosto za osebno in komercialno uporabo.

---

## 🤝 Prispevanje

Pull requesti so dobrodošli! Za večje spremembe odprite issue najprej.

```bash
git fork
git checkout -b nova-funkcija
git commit -m "Dodaj novo funkcijo"
git push origin nova-funkcija
# Odprite Pull Request
```

---

<div align="center">
  Narejeno z ❤️ za ljubitelje meteorologije 🌦️
</div>
