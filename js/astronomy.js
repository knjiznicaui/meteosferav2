/* =============================================
   METEOSPHERE — ASTRONOMY MODULE
   ============================================= */

const Astronomy = {
  render(data, lat, lon) {
    const today = data.daily;
    const idx = 0;

    // Sunrise / Sunset / Noon
    const sunrise = today.sunrise?.[idx];
    const sunset  = today.sunset?.[idx];
    const daylight = today.daylight_duration?.[idx];

    if (sunrise) {
      const sr = new Date(sunrise);
      document.getElementById('asSunrise').textContent =
        sr.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('metricSunrise').textContent =
        sr.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
    }
    if (sunset) {
      const ss = new Date(sunset);
      document.getElementById('asSunset').textContent =
        ss.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('metricSunset').textContent =
        ss.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
    }

    // Solar noon = midpoint
    if (sunrise && sunset) {
      const noon = new Date((new Date(sunrise).getTime() + new Date(sunset).getTime()) / 2);
      document.getElementById('asSolarNoon').textContent =
        noon.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });

      // Golden hour = ~1h after sunrise, ~1h before sunset
      const gh = new Date(new Date(sunrise).getTime() + 60 * 60 * 1000);
      document.getElementById('asGoldenHour').textContent =
        gh.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });

      // Astronomical twilight = ~1.5h before sunrise
      const at = new Date(new Date(sunrise).getTime() - 90 * 60 * 1000);
      document.getElementById('asAstroTwilight').textContent =
        at.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });

      Charts.drawSunArc('sunArcCanvas', sunrise, sunset, noon.toISOString());
    }

    if (daylight !== undefined) {
      const h = Math.floor(daylight / 3600);
      const m = Math.floor((daylight % 3600) / 60);
      document.getElementById('asDayLength').textContent = `${h}h ${m}m`;
    }

    // Moon
    const moon = Moon.calculate(new Date());
    document.getElementById('moonVisual').textContent = moon.icon;
    document.getElementById('moonPhaseName').textContent = moon.name;
    document.getElementById('moonIllum').textContent = `Osvetlitev: ${moon.illumination}%`;
    document.getElementById('metricMoonphase').textContent = moon.name;
    document.getElementById('metricMoonrise').textContent = `Ikona: ${moon.icon}`;

    // Next full/new moon (approximate)
    const cycle = 29.53058867;
    const now = new Date();
    const ref = new Date(2000, 0, 6, 18, 14);
    const diff = (now - ref) / (1000 * 60 * 60 * 24);
    const currentPhase = ((diff % cycle) + cycle) % cycle;
    const daysToFull = ((14.77 - currentPhase) + cycle) % cycle;
    const daysToNew = ((cycle - currentPhase) + cycle) % cycle;

    const nextFull = new Date(now.getTime() + daysToFull * 86400000);
    const nextNew  = new Date(now.getTime() + daysToNew  * 86400000);

    const months = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
    document.getElementById('asNextFullMoon').textContent =
      `${nextFull.getDate()}. ${months[nextFull.getMonth()]}`;
    document.getElementById('asNextNewMoon').textContent =
      `${nextNew.getDate()}. ${months[nextNew.getMonth()]}`;

    // Approx moonrise (shifts ~50 min per day)
    const moonrise = new Date(now);
    moonrise.setHours(18 + Math.round((moon.phase / 29.5) * 12));
    moonrise.setMinutes(Math.round(Math.random() * 30));
    document.getElementById('asMoonrise').textContent =
      moonrise.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });
    const moonset = new Date(moonrise.getTime() + 12.5 * 3600000);
    document.getElementById('asMoonset').textContent =
      moonset.toLocaleTimeString('sl', { hour: '2-digit', minute: '2-digit' });

    // Daylight chart
    Charts.renderDaylight('daylightChart', data);
  }
};
