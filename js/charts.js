/* =============================================
   METEOSPHERE — CHARTS
   Chart.js 4.x configurations
   ============================================= */


/* ==================================================
   CHART DEFAULTS
   ================================================== */

Chart.defaults.color = '#8BAABF';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;

Chart.defaults.plugins.legend.display = false;

Chart.defaults.plugins.tooltip.backgroundColor = '#131929';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(79,195,247,0.25)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#E8F4FD';
Chart.defaults.plugins.tooltip.bodyColor = '#8BAABF';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 10;
Chart.defaults.plugins.tooltip.displayColors = true;

Chart.defaults.scale.grid.color = 'rgba(79,195,247,0.06)';
Chart.defaults.scale.ticks.color = '#4A6170';


/* ==================================================
   CHART HEIGHT
   ================================================== */

const CHART_HEIGHT = '280px';


/* ==================================================
   CHARTS
   ================================================== */

const Charts = {

  _instances: {},


  /* ==================================================
     APPLY FIXED CHART SIZE
     ================================================== */

  _setCanvasSize(canvas) {

    if (!canvas) return;

    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = CHART_HEIGHT;
    canvas.style.maxHeight = CHART_HEIGHT;
    canvas.style.minHeight = CHART_HEIGHT;

  },


  /* ==================================================
     DESTROY
     ================================================== */

  destroy(id) {

    if (this._instances[id]) {

      this._instances[id].destroy();

      delete this._instances[id];

    }

  },


  destroyAll() {

    Object.keys(this._instances)
      .forEach(id => this.destroy(id));

  },


  /* ==================================================
     HOURLY TEMP / PRECIP / WIND / HUMIDITY
     ================================================== */

  renderHourly(
    canvasId,
    data,
    metric = 'temperature'
  ) {

    this.destroy(canvasId);

    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    /* FIX — prepreči neskončno višino */

    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const start =
      idx;


    const hours =
      data.hourly.time.slice(
        start,
        start + 24
      );


    const labels =
      hours.map(
        t => TimeUtil.formatHour(t)
      );


    let datasets = [];

    let yLabel = '';


    /* ==================================================
       TEMPERATURE
       ================================================== */

    if (metric === 'temperature') {

      const temps =
        data.hourly.temperature_2m
          .slice(start, start + 24);


      const feelsLike =
        data.hourly.apparent_temperature
          .slice(start, start + 24);


      const grad =
        ctx.createLinearGradient(
          0,
          0,
          0,
          200
        );


      grad.addColorStop(
        0,
        'rgba(79,195,247,0.3)'
      );


      grad.addColorStop(
        1,
        'rgba(79,195,247,0)'
      );


      datasets = [

        {
          label: 'Temperatura',

          data:
            temps.map(
              v => Convert.temp(v)
            ),

          borderColor: '#4FC3F7',

          borderWidth: 2.5,

          backgroundColor: grad,

          fill: true,

          tension: 0.4,

          pointRadius: 3,

          pointHoverRadius: 6,

          pointBackgroundColor:
            '#4FC3F7'
        },


        {
          label: 'Občutek',

          data:
            feelsLike.map(
              v => Convert.temp(v)
            ),

          borderColor: '#CE93D8',

          borderWidth: 1.5,

          backgroundColor: 'transparent',

          fill: false,

          tension: 0.4,

          pointRadius: 0,

          borderDash: [5, 3]
        }

      ];


      yLabel =
        `°${Settings.get('unit') || 'C'}`;

    }


    /* ==================================================
       PRECIPITATION
       ================================================== */

    else if (metric === 'precipitation') {

      const precip =
        data.hourly.precipitation
          .slice(start, start + 24);


      const prob =
        data.hourly.precipitation_probability
          .slice(start, start + 24);


      datasets = [

        {
          label: 'Padavine (mm)',

          data:
            precip.map(
              v => Convert.precip(v)
            ),

          backgroundColor:
            'rgba(79,195,247,0.6)',

          borderColor: '#4FC3F7',

          borderWidth: 1,

          type: 'bar'
        },


        {
          label: 'Verjetnost (%)',

          data: prob,

          borderColor: '#FFB74D',

          borderWidth: 2,

          backgroundColor:
            'transparent',

          fill: false,

          tension: 0.4,

          yAxisID: 'y2',

          type: 'line',

          pointRadius: 2
        }

      ];

    }


    /* ==================================================
       WIND
       ================================================== */

    else if (metric === 'wind') {

      const wind =
        data.hourly.wind_speed_10m
          .slice(start, start + 24);


      const gusts =
        data.hourly.wind_gusts_10m
          .slice(start, start + 24);


      datasets = [

        {
          label: 'Veter',

          data:
            wind.map(
              v => Convert.wind(v)
            ),

          borderColor: '#69F0AE',

          borderWidth: 2,

          backgroundColor:
            'rgba(105,240,174,0.15)',

          fill: true,

          tension: 0.4,

          pointRadius: 2
        },


        {
          label: 'Sunki',

          data:
            gusts.map(
              v => Convert.wind(v)
            ),

          borderColor: '#FF5252',

          borderWidth: 1.5,

          backgroundColor:
            'transparent',

          fill: false,

          tension: 0.4,

          pointRadius: 0,

          borderDash: [4, 3]
        }

      ];

    }


    /* ==================================================
       HUMIDITY
       ================================================== */

    else if (metric === 'humidity') {

      const hum =
        data.hourly.relative_humidity_2m
          .slice(start, start + 24);


      const dew =
        data.hourly.dew_point_2m
          .slice(start, start + 24);


      const grad2 =
        ctx.createLinearGradient(
          0,
          0,
          0,
          200
        );


      grad2.addColorStop(
        0,
        'rgba(206,147,216,0.3)'
      );


      grad2.addColorStop(
        1,
        'rgba(206,147,216,0)'
      );


      datasets = [

        {
          label: 'Vlažnost (%)',

          data: hum,

          borderColor: '#CE93D8',

          borderWidth: 2,

          backgroundColor: grad2,

          fill: true,

          tension: 0.4,

          pointRadius: 2,

          yAxisID: 'y'
        },


        {
          label: 'Rosišče',

          data:
            dew.map(
              v => Convert.temp(v)
            ),

          borderColor: '#4FC3F7',

          borderWidth: 1.5,

          backgroundColor:
            'transparent',

          fill: false,

          tension: 0.4,

          pointRadius: 0,

          yAxisID: 'y2'
        }

      ];

    }


    /* ==================================================
       SCALES
       ================================================== */

    const scales = {

      x: {

        grid: {
          display: false
        },

        ticks: {

          maxTicksLimit: 8,

          maxRotation: 0,

          autoSkip: true
        }

      },


      y: {

        position: 'left',

        ticks: {

          maxTicksLimit: 5
        },

        title: {

          display: !!yLabel,

          text: yLabel,

          color: '#4A6170',

          font: {
            size: 11
          }

        }

      }

    };


    if (
      metric === 'precipitation' ||
      metric === 'humidity'
    ) {

      scales.y2 = {

        position: 'right',

        grid: {

          display: false
        },

        ticks: {

          maxTicksLimit: 5
        }

      };

    }


    /* ==================================================
       CHART
       ================================================== */

    this._instances[canvasId] =
      new Chart(ctx, {

        type:
          metric === 'precipitation'
            ? 'bar'
            : 'line',

        data: {

          labels,

          datasets

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales,


          plugins: {

            legend: {

              display:
                datasets.length > 1,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12,

                padding: 12
              }

            }

          }

        }

      });

  },


  /* ==================================================
     PRESSURE — 7 DAYS
     ================================================== */

  renderPressure(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const start =
      Math.max(0, idx - 12);


    const hours =
      data.hourly.time.slice(
        start,
        start + 168
      );


    const pressure =
      data.hourly.pressure_msl.slice(
        start,
        start + 168
      );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        260
      );


    grad.addColorStop(
      0,
      'rgba(255,183,77,0.25)'
    );


    grad.addColorStop(
      1,
      'rgba(255,183,77,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Tlak (hPa)',

              data: pressure,

              borderColor: '#FFB74D',

              borderWidth: 2,

              backgroundColor: grad,

              fill: true,

              tension: 0.3,

              pointRadius: 0,

              pointHoverRadius: 5
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 7,

                maxRotation: 0,

                autoSkip: true
              }

            },


            y: {

              position: 'left',

              ticks: {

                maxTicksLimit: 5,

                callback:
                  value =>
                    `${Math.round(value)} hPa`
              }

            }

          },


          plugins: {

            legend: {
              display: false
            },


            tooltip: {

              callbacks: {

                label:
                  context =>
                    ` Tlak: ${context.parsed.y.toFixed(1)} hPa`

              }

            }

          }

        }

      });

  },


  /* ==================================================
     HUMIDITY & DEWPOINT — 24 HOURS
     ================================================== */

  renderHumidityDew(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      data.hourly.time.slice(
        idx,
        idx + 24
      );


    const humidity =
      data.hourly.relative_humidity_2m.slice(
        idx,
        idx + 24
      );


    const dew =
      data.hourly.dew_point_2m.slice(
        idx,
        idx + 24
      );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Vlažnost (%)',

              data: humidity,

              borderColor: '#CE93D8',

              borderWidth: 2,

              backgroundColor:
                'rgba(206,147,216,0.15)',

              fill: true,

              tension: 0.4,

              pointRadius: 0,

              pointHoverRadius: 5,

              yAxisID: 'y'
            },


            {
              label: 'Rosišče',

              data:
                dew.map(
                  v => Convert.temp(v)
                ),

              borderColor: '#4FC3F7',

              borderWidth: 1.5,

              backgroundColor:
                'transparent',

              fill: false,

              tension: 0.4,

              pointRadius: 0,

              pointHoverRadius: 5,

              borderDash: [5, 3],

              yAxisID: 'y2'
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 8,

                maxRotation: 0,

                autoSkip: true
              }

            },


            y: {

              position: 'left',

              min: 0,

              max: 100,

              ticks: {

                maxTicksLimit: 5,

                callback:
                  value =>
                    `${value}%`
              },

              title: {

                display: true,

                text: 'Vlažnost',

                color: '#8BAABF',

                font: {
                  size: 11
                }

              }

            },


            y2: {

              position: 'right',

              grid: {

                display: false
              },

              ticks: {

                maxTicksLimit: 5,

                callback:
                  value =>
                    `${Number(value).toFixed(0)}°`
              },

              title: {

                display: true,

                text: 'Rosišče',

                color: '#8BAABF',

                font: {
                  size: 11
                }

              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12,

                padding: 12
              }

            },


            tooltip: {

              callbacks: {

                label: context => {

                  const value =
                    context.parsed.y;


                  if (
                    context.dataset.label ===
                    'Vlažnost (%)'
                  ) {

                    return ` Vlažnost: ${value.toFixed(0)}%`;

                  }


                  return ` Rosišče: ${value.toFixed(1)}°`;

                }

              }

            }

          }

        }

      });

  },


  /* ==================================================
     14-DAY FORECAST
     ================================================== */

  renderForecast14(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const labels =
      data.daily.time
        .slice(0, 14)
        .map(
          t => TimeUtil.formatDate(t, true)
        );


    const maxT =
      data.daily.temperature_2m_max
        .slice(0, 14)
        .map(
          v => Convert.temp(v)
        );


    const minT =
      data.daily.temperature_2m_min
        .slice(0, 14)
        .map(
          v => Convert.temp(v)
        );


    const precip =
      data.daily.precipitation_sum
        .slice(0, 14);


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'bar',

        data: {

          labels,

          datasets: [

            {
              label: 'Max temp',

              data: maxT,

              backgroundColor:
                'rgba(255,82,82,0.7)',

              borderColor: '#FF5252',

              borderWidth: 1,

              borderRadius: 4,

              yAxisID: 'y'
            },


            {
              label: 'Min temp',

              data: minT,

              backgroundColor:
                'rgba(79,195,247,0.6)',

              borderColor: '#4FC3F7',

              borderWidth: 1,

              borderRadius: 4,

              yAxisID: 'y'
            },


            {
              label: 'Padavine (mm)',

              data: precip,

              backgroundColor:
                'rgba(105,240,174,0.5)',

              borderColor: '#69F0AE',

              borderWidth: 1,

              borderRadius: 4,

              type: 'line',

              yAxisID: 'y2',

              pointRadius: 4,

              tension: 0.3
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              }

            },


            y: {

              position: 'left',

              ticks: {
                maxTicksLimit: 6
              }

            },


            y2: {

              position: 'right',

              grid: {
                display: false
              },

              min: 0,

              ticks: {
                maxTicksLimit: 5
              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     48H TEMPERATURE
     ================================================== */

  renderHourly48Temp(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      data.hourly.time.slice(
        idx,
        idx + 48
      );


    const temps =
      data.hourly.temperature_2m.slice(
        idx,
        idx + 48
      );


    const feelsLike =
      data.hourly.apparent_temperature.slice(
        idx,
        idx + 48
      );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        200
      );


    grad.addColorStop(
      0,
      'rgba(79,195,247,0.35)'
    );


    grad.addColorStop(
      1,
      'rgba(79,195,247,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Temperatura',

              data:
                temps.map(
                  v => Convert.temp(v)
                ),

              borderColor: '#4FC3F7',

              borderWidth: 2.5,

              backgroundColor: grad,

              fill: true,

              tension: 0.4,

              pointRadius: 2
            },


            {
              label: 'Občutek',

              data:
                feelsLike.map(
                  v => Convert.temp(v)
                ),

              borderColor: '#CE93D8',

              borderWidth: 1.5,

              backgroundColor:
                'transparent',

              fill: false,

              tension: 0.4,

              pointRadius: 0,

              borderDash: [5, 3]
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 12,

                maxRotation: 45,

                autoSkip: true
              }

            },


            y: {

              ticks: {
                maxTicksLimit: 6
              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     48H PRECIPITATION
     ================================================== */

  renderHourly48Precip(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      data.hourly.time.slice(
        idx,
        idx + 48
      );


    const precip =
      data.hourly.precipitation.slice(
        idx,
        idx + 48
      );


    const prob =
      data.hourly.precipitation_probability.slice(
        idx,
        idx + 48
      );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'bar',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Padavine (mm)',

              data: precip,

              backgroundColor:
                'rgba(79,195,247,0.6)',

              borderColor: '#4FC3F7',

              borderWidth: 1,

              yAxisID: 'y'
            },


            {
              label: 'Verjetnost (%)',

              data: prob,

              borderColor: '#FFB74D',

              borderWidth: 2,

              backgroundColor:
                'transparent',

              type: 'line',

              tension: 0.4,

              pointRadius: 2,

              yAxisID: 'y2'
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 12,

                maxRotation: 45,

                autoSkip: true
              }

            },


            y: {

              position: 'left',

              min: 0,

              ticks: {
                maxTicksLimit: 5
              }

            },


            y2: {

              position: 'right',

              min: 0,

              max: 100,

              grid: {

                display: false
              },

              ticks: {
                maxTicksLimit: 5
              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     48H WIND
     ================================================== */

  renderHourly48Wind(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      data.hourly.time.slice(
        idx,
        idx + 48
      );


    const wind =
      data.hourly.wind_speed_10m.slice(
        idx,
        idx + 48
      );


    const gusts =
      data.hourly.wind_gusts_10m.slice(
        idx,
        idx + 48
      );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        160
      );


    grad.addColorStop(
      0,
      'rgba(105,240,174,0.3)'
    );


    grad.addColorStop(
      1,
      'rgba(105,240,174,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Veter',

              data:
                wind.map(
                  v => Convert.wind(v)
                ),

              borderColor: '#69F0AE',

              borderWidth: 2,

              backgroundColor: grad,

              fill: true,

              tension: 0.4,

              pointRadius: 0
            },


            {
              label: 'Sunki',

              data:
                gusts.map(
                  v => Convert.wind(v)
                ),

              borderColor: '#FF5252',

              borderWidth: 1.5,

              backgroundColor:
                'transparent',

              fill: false,

              tension: 0.4,

              pointRadius: 0,

              borderDash: [4, 3]
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 12,

                maxRotation: 45,

                autoSkip: true
              }

            },


            y: {

              min: 0,

              ticks: {
                maxTicksLimit: 6
              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     48H HUMIDITY
     ================================================== */

  renderHourly48Humidity(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      data.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      data.hourly.time.slice(
        idx,
        idx + 48
      );


    const hum =
      data.hourly.relative_humidity_2m.slice(
        idx,
        idx + 48
      );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        160
      );


    grad.addColorStop(
      0,
      'rgba(206,147,216,0.35)'
    );


    grad.addColorStop(
      1,
      'rgba(206,147,216,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',

        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),

          datasets: [

            {
              label: 'Vlažnost (%)',

              data: hum,

              borderColor: '#CE93D8',

              borderWidth: 2,

              backgroundColor: grad,

              fill: true,

              tension: 0.4,

              pointRadius: 0
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 12,

                maxRotation: 45,

                autoSkip: true
              }

            },


            y: {

              min: 0,

              max: 100,

              ticks: {
                maxTicksLimit: 5
              }

            }

          }

        }

      });

  },


  /* ==================================================
     CLIMATE MONTHLY
     ================================================== */

  renderClimateMonthly(
    canvasId,
    monthlyData,
    metric = 'temp'
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const months = [

      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Maj',
      'Jun',
      'Jul',
      'Avg',
      'Sep',
      'Okt',
      'Nov',
      'Dec'

    ];


    let datasets = [];


    /* ==================================================
       TEMPERATURE
       ================================================== */

    if (metric === 'temp') {

      datasets = [

        {
          label: 'Avg Max',

          data: monthlyData.maxTemp,

          borderColor: '#FF5252',

          backgroundColor:
            'rgba(255,82,82,0.1)',

          fill: true,

          tension: 0.4
        },


        {
          label: 'Avg Min',

          data: monthlyData.minTemp,

          borderColor: '#4FC3F7',

          backgroundColor:
            'rgba(79,195,247,0.1)',

          fill: true,

          tension: 0.4
        },


        {
          label: 'Avg Mean',

          data: monthlyData.meanTemp,

          borderColor: '#FFB74D',

          backgroundColor:
            'transparent',

          tension: 0.4,

          borderDash: [5, 3]
        }

      ];

    }


    /* ==================================================
       PRECIPITATION
       ================================================== */

    else if (metric === 'precip') {

      datasets = [

        {
          label: 'Padavine (mm)',

          data: monthlyData.precip,

          backgroundColor:
            'rgba(79,195,247,0.6)',

          borderColor: '#4FC3F7',

          borderWidth: 1,

          borderRadius: 6
        }

      ];

    }


    /* ==================================================
       HUMIDITY
       ================================================== */

    else if (metric === 'humidity') {

      datasets = [

        {
          label: 'Vlažnost (%)',

          data: monthlyData.humidity,

          borderColor: '#CE93D8',

          backgroundColor:
            'rgba(206,147,216,0.2)',

          fill: true,

          tension: 0.4
        }

      ];

    }


    this._instances[canvasId] =
      new Chart(ctx, {

        type:
          metric === 'precip'
            ? 'bar'
            : 'line',


        data: {

          labels: months,

          datasets

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,

          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              }

            },


            y: {

              ticks: {
                maxTicksLimit: 6
              }

            }

          },


          plugins: {

            legend: {

              display:
                datasets.length > 1,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     AQI — KAKOVOST ZRAKA
     ================================================== */

  renderAQI(
    canvasId,
    aqiData
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    /* ==================================================
       FIX — NORMALNA VIŠINA
       ================================================== */

    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const now =
      new Date();


    const foundIdx =
      aqiData.hourly.time.findIndex(
        t => new Date(t) >= now
      );


    const idx =
      Math.max(0, foundIdx);


    const hours =
      aqiData.hourly.time.slice(
        idx,
        idx + 24
      );


    const aqi =
      aqiData.hourly.european_aqi.slice(
        idx,
        idx + 24
      );


    const colors =
      aqi.map(v => {

        if (v <= 20)
          return 'rgba(105,240,174,0.8)';

        if (v <= 40)
          return 'rgba(255,241,118,0.8)';

        if (v <= 60)
          return 'rgba(255,183,77,0.8)';

        if (v <= 80)
          return 'rgba(255,82,82,0.8)';

        if (v <= 100)
          return 'rgba(206,147,216,0.8)';

        return 'rgba(255,23,68,0.8)';

      });


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'bar',


        data: {

          labels:
            hours.map(
              t => TimeUtil.formatHour(t)
            ),


          datasets: [

            {
              label: 'European AQI',

              data: aqi,

              backgroundColor: colors,

              borderRadius: 4,

              borderSkipped: false
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,


          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {

                maxTicksLimit: 8,

                maxRotation: 0,

                autoSkip: true
              }

            },


            y: {

              position: 'left',

              min: 0,

              suggestedMax: 100,

              ticks: {

                maxTicksLimit: 5
              }

            }

          },


          plugins: {

            legend: {

              display: false
            }

          }

        }

      });

  },


  /* ==================================================
     DAYLIGHT
     ================================================== */

  renderDaylight(
    canvasId,
    data
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const daylight =
      data.daily.daylight_duration
        .slice(0, 14)
        .map(
          v => v / 3600
        );


    const labels =
      data.daily.time
        .slice(0, 14)
        .map(
          t =>
            TimeUtil.formatDate(t, true)
        );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        200
      );


    grad.addColorStop(
      0,
      'rgba(255,241,118,0.4)'
    );


    grad.addColorStop(
      1,
      'rgba(255,241,118,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',


        data: {

          labels,

          datasets: [

            {
              label: 'Dolžina dneva (h)',

              data: daylight,

              borderColor: '#FFF176',

              borderWidth: 2.5,

              backgroundColor: grad,

              fill: true,

              tension: 0.4,

              pointRadius: 3
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,


          scales: {

            x: {

              grid: {
                display: false
              }

            },


            y: {

              ticks: {

                maxTicksLimit: 6,

                callback:
                  v =>
                    `${v.toFixed(1)}h`
              }

            }

          }

        }

      });

  },


  /* ==================================================
     COMPARE
     ================================================== */

  renderCompare(
    canvasId,
    citiesData
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const colors = [

      '#4FC3F7',
      '#69F0AE',
      '#FFB74D'

    ];


    const datasets =
      citiesData.map(
        (c, i) => ({

          label: c.city,

          data:
            c.data.daily.temperature_2m_max
              .slice(0, 7)
              .map(
                v => Convert.temp(v)
              ),

          borderColor: colors[i],

          borderWidth: 2,

          backgroundColor:
            colors[i]
              .replace(')', ',0.1)')
              .replace('rgb', 'rgba'),

          fill: false,

          tension: 0.4,

          pointRadius: 4

        })
      );


    const labels =
      citiesData[0]
        .data.daily.time
        .slice(0, 7)
        .map(
          t =>
            TimeUtil.formatDate(t, true)
        );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',


        data: {

          labels,

          datasets

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,


          interaction: {

            mode: 'index',

            intersect: false
          },


          scales: {

            x: {

              grid: {
                display: false
              }

            },


            y: {

              ticks: {
                maxTicksLimit: 6
              }

            }

          },


          plugins: {

            legend: {

              display: true,

              position: 'top',

              labels: {

                color: '#8BAABF',

                font: {
                  size: 11
                },

                boxWidth: 12

              }

            }

          }

        }

      });

  },


  /* ==================================================
     MANUAL READINGS
     ================================================== */

  renderManualReadings(
    canvasId,
    readings
  ) {

    this.destroy(canvasId);


    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    this._setCanvasSize(canvas);


    const ctx =
      canvas.getContext('2d');


    const temps =
      readings
        .map(
          r => r.temp
        )
        .filter(
          v =>
            v !== '' &&
            v !== null
        );


    const labels =
      readings.map(
        r =>
          new Date(r.ts)
            .toLocaleTimeString(
              'sl',
              {
                hour: '2-digit',
                minute: '2-digit'
              }
            )
      );


    const grad =
      ctx.createLinearGradient(
        0,
        0,
        0,
        160
      );


    grad.addColorStop(
      0,
      'rgba(79,195,247,0.3)'
    );


    grad.addColorStop(
      1,
      'rgba(79,195,247,0)'
    );


    this._instances[canvasId] =
      new Chart(ctx, {

        type: 'line',


        data: {

          labels,

          datasets: [

            {
              label: 'Moja temp (°C)',

              data: temps,

              borderColor: '#4FC3F7',

              borderWidth: 2.5,

              backgroundColor: grad,

              fill: true,

              tension: 0.4,

              pointRadius: 4,

              pointHoverRadius: 7
            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,

          resizeDelay: 50,


          scales: {

            x: {

              grid: {
                display: false
              },

              ticks: {
                maxTicksLimit: 8
              }

            },


            y: {

              ticks: {
                maxTicksLimit: 5
              }

            }

          }

        }

      });

  },


  /* ==================================================
     SUN ARC CANVAS
     ================================================== */

  drawSunArc(
    canvasId,
    sunriseTime,
    sunsetTime,
    noonTime
  ) {

    const canvas =
      document.getElementById(canvasId);

    if (!canvas) return;


    const ctx =
      canvas.getContext('2d');


    const W =
      canvas.width;


    const H =
      canvas.height;


    ctx.clearRect(
      0,
      0,
      W,
      H
    );


    const now =
      new Date();


    const sunrise =
      new Date(
        sunriseTime
      );


    const sunset =
      new Date(
        sunsetTime
      );


    /* ==================================================
       ARC
       ================================================== */

    const sx = 20;

    const ex =
      W - 20;

    const cy =
      H - 20;


    const rx =
      (ex - sx) / 2;


    const ry =
      H - 50;


    /* ==================================================
       HORIZON
       ================================================== */

    ctx.beginPath();


    ctx.moveTo(
      sx,
      cy
    );


    ctx.lineTo(
      ex,
      cy
    );


    ctx.strokeStyle =
      'rgba(79,195,247,0.2)';


    ctx.lineWidth = 1;


    ctx.stroke();


    /* ==================================================
       ARC
       ================================================== */

    ctx.beginPath();


    ctx.ellipse(
      sx + rx,
      cy,
      rx,
      ry,
      0,
      Math.PI,
      0,
      false
    );


    ctx.strokeStyle =
      'rgba(79,195,247,0.15)';


    ctx.lineWidth = 2;


    ctx.setLineDash([
      4,
      6
    ]);


    ctx.stroke();


    ctx.setLineDash([]);


    /* ==================================================
       CURRENT SUN POSITION
       ================================================== */

    const totalDayMs =
      sunset - sunrise;


    const elapsedMs =
      now - sunrise;


    const progress =
      Math.max(
        0,
        Math.min(
          1,
          elapsedMs / totalDayMs
        )
      );


    const angle =
      Math.PI -
      progress * Math.PI;


    const sunX =
      sx +
      rx +
      rx * Math.cos(angle);


    const sunY =
      cy -
      ry * Math.sin(angle);


    /* ==================================================
       PROGRESS ARC
       ================================================== */

    if (progress > 0) {

      ctx.beginPath();


      ctx.ellipse(
        sx + rx,
        cy,
        rx,
        ry,
        0,
        Math.PI,
        Math.PI - progress * Math.PI,
        false
      );


      ctx.strokeStyle =
        '#FFB74D';


      ctx.lineWidth = 2.5;


      ctx.stroke();

    }


    /* ==================================================
       SUN GLOW
       ================================================== */

    const grd =
      ctx.createRadialGradient(
        sunX,
        sunY,
        2,
        sunX,
        sunY,
        18
      );


    grd.addColorStop(
      0,
      'rgba(255,241,118,0.9)'
    );


    grd.addColorStop(
      1,
      'rgba(255,183,77,0)'
    );


    ctx.beginPath();


    ctx.arc(
      sunX,
      sunY,
      18,
      0,
      2 * Math.PI
    );


    ctx.fillStyle =
      grd;


    ctx.fill();


    /* ==================================================
       SUN DOT
       ================================================== */

    ctx.beginPath();


    ctx.arc(
      sunX,
      sunY,
      7,
      0,
      2 * Math.PI
    );


    ctx.fillStyle =
      '#FFF176';


    ctx.fill();


    /* ==================================================
       SUNRISE / SUNSET LABELS
       ================================================== */

    ctx.fillStyle =
      '#8BAABF';


    ctx.font =
      '10px Inter';


    ctx.textAlign =
      'center';


    ctx.fillText(

      new Date(
        sunriseTime
      ).toLocaleTimeString(
        'sl',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      ),

      sx + 10,

      cy + 14

    );


    ctx.fillText(

      new Date(
        sunsetTime
      ).toLocaleTimeString(
        'sl',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      ),

      ex - 10,

      cy + 14

    );

  }

};
