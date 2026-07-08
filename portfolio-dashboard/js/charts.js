/**
 * charts.js
 * -----------------------------------------------------------------------
 * Renderização dos gráficos com Chart.js.
 * O gráfico de timeline suporta "brush" (arrastar o mouse) para selecionar
 * um intervalo de datas, que alimenta appState.set({ startDate, endDate })
 * e propaga para todos os outros componentes (cards, tabelas, gráficos).
 * -----------------------------------------------------------------------
 */
const chartsModule = (function () {
  let timelineChart, hourlyChart, weekdayChart;
  let brushStartPx = null;

  const PRIMARY = '#0F9E8A';
  const DANGER = '#E24560';
  const MUTED = '#9AA3B5';

  function fmtDatePt(iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  function renderTimeline(timeSeries) {
    const ctx = document.getElementById('chartTimeline').getContext('2d');
    const labels = timeSeries.map((d) => d.date);

    const data = {
      labels,
      datasets: [
        {
          label: 'Transações aprovadas',
          data: timeSeries.map((d) => d.qtdAprovadas),
          borderColor: PRIMARY, backgroundColor: 'transparent',
          borderWidth: 1.6, pointRadius: 0, tension: 0.25, yAxisID: 'y',
        },
        {
          label: 'Transações negadas (qtd)',
          data: timeSeries.map((d) => d.qtdFraude),
          borderColor: DANGER, backgroundColor: 'transparent',
          borderWidth: 1.4, pointRadius: 0, tension: 0.25, yAxisID: 'y',
        },
        {
          label: 'Taxa de fraude (%)',
          data: timeSeries.map((d) => +(d.taxaFraude * 100).toFixed(2)),
          borderColor: '#F5A524', backgroundColor: 'transparent',
          borderWidth: 1.2, pointRadius: 0, tension: 0.25, yAxisID: 'y1', borderDash: [3, 3],
        },
      ],
    };

    if (timelineChart) { timelineChart.data = data; timelineChart.update(); return; }

    timelineChart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'start', labels: { boxWidth: 10, font: { family: 'IBM Plex Sans', size: 11.5 } } },
          tooltip: {
            callbacks: {
              title: (items) => fmtDatePt(items[0].label),
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 12, font: { family: 'IBM Plex Sans', size: 10.5 }, color: MUTED }, grid: { display: false } },
          y: { position: 'left', ticks: { font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: '#EEF0F6' } },
          y1: { position: 'right', ticks: { callback: (v) => v + '%', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { display: false } },
        },
      },
    });

    attachBrush(timelineChart, labels);
  }

  // ------------------- Brush (seleção de intervalo arrastando o mouse) -------------------
  function attachBrush(chart, labels) {
    const canvas = chart.canvas;
    const layer = document.getElementById('brushLayer');
    let dragging = false;
    let startIdx = null;

    function pxToIndex(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const scale = chart.scales.x;
      const val = scale.getValueForPixel(x);
      return Math.max(0, Math.min(labels.length - 1, Math.round(val)));
    }

    function drawRect(x1, x2) {
      const rect = canvas.getBoundingClientRect();
      const left = Math.min(x1, x2);
      const width = Math.abs(x2 - x1);
      layer.style.pointerEvents = 'none';
      layer.innerHTML = `<div style="position:absolute;top:0;left:${left}px;width:${width}px;height:100%;
        background:rgba(15,158,138,0.10);border-left:1px solid #0F9E8A;border-right:1px solid #0F9E8A;"></div>`;
    }

    canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      startIdx = pxToIndex(e.clientX);
      const rect = canvas.getBoundingClientRect();
      brushStartPx = e.clientX - rect.left;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const curPx = e.clientX - rect.left;
      drawRect(brushStartPx, curPx);
    });

    window.addEventListener('mouseup', (e) => {
      if (!dragging) return;
      dragging = false;
      const endIdx = pxToIndex(e.clientX);
      const from = Math.min(startIdx, endIdx);
      const to = Math.max(startIdx, endIdx);
      layer.innerHTML = '';

      if (to - from >= 1) {
        appState.set({ startDate: labels[from], endDate: labels[to] });
        // reflete no input de datas também
        document.getElementById('filterStart').value = labels[from];
        document.getElementById('filterEnd').value = labels[to];
        document.querySelectorAll('#quickRangeChips button').forEach((b) => b.classList.remove('is-active'));
      }
    });
  }

  function renderHourly(hourly) {
    const ctx = document.getElementById('chartHourly').getContext('2d');
    const data = {
      labels: hourly.map((h) => h.hour),
      datasets: [{
        label: 'Negada', data: hourly.map((h) => h.qtdFraude),
        borderColor: PRIMARY, backgroundColor: 'rgba(15,158,138,0.10)', fill: true, tension: 0.35, pointRadius: 0,
      }],
    };
    if (hourlyChart) { hourlyChart.data = data; hourlyChart.update(); return; }
    hourlyChart = new Chart(ctx, {
      type: 'line', data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Mono', size: 10 } } },
          y: { grid: { color: '#EEF0F6' }, ticks: { font: { family: 'IBM Plex Mono', size: 10 } } },
        },
      },
    });
  }

  function renderWeekday(weekday) {
    const ctx = document.getElementById('chartWeekday').getContext('2d');
    const data = {
      labels: weekday.map((w) => w.day),
      datasets: [{
        label: 'Transações negadas', data: weekday.map((w) => w.qtdFraude),
        borderColor: DANGER, backgroundColor: 'rgba(226,69,96,0.08)', fill: true, tension: 0.3, pointRadius: 2,
      }],
    };
    if (weekdayChart) { weekdayChart.data = data; weekdayChart.update(); return; }
    weekdayChart = new Chart(ctx, {
      type: 'line', data,
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'IBM Plex Sans', size: 10 } } },
          y: { grid: { color: '#EEF0F6' }, ticks: { font: { family: 'IBM Plex Mono', size: 10 } } },
        },
      },
    });
  }

  function renderAll({ timeSeries, hourly, weekday }) {
    renderTimeline(timeSeries);
    renderHourly(hourly);
    renderWeekday(weekday);
  }

  return { renderAll };
})();
