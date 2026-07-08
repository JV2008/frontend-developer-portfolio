/**
 * app.js
 * -----------------------------------------------------------------------
 * Orquestra a aplicação: busca dados via dataService conforme o estado
 * atual de filtros e distribui para KPIs, gráficos e tabelas.
 * -----------------------------------------------------------------------
 */
(function () {
  const money = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const int = (v) => v.toLocaleString('pt-BR');
  const pct = (v) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';

  // metric -> 'higherIsBad' controla a cor do indicador de variação (delta)
  const KPI_DEFS = [
    { key: 'valorTotal', label: APP_CONFIG.LABELS.valorTotal, fmt: money, delta: 'deltaValorTotal', higherIsBad: false, tone: '' },
    { key: 'valorFraude', label: APP_CONFIG.LABELS.valorFraude, fmt: money, delta: null, higherIsBad: true, tone: 'is-danger' },
    { key: 'taxaFraudeValor', label: APP_CONFIG.LABELS.taxaFraudeValor, fmt: pct, delta: 'deltaTaxaFraude', higherIsBad: true, tone: '' },
    { key: 'qtdTotal', label: APP_CONFIG.LABELS.qtdTotal, fmt: int, delta: null, higherIsBad: false, tone: '' },
    { key: 'qtdFraude', label: APP_CONFIG.LABELS.qtdFraude, fmt: int, delta: null, higherIsBad: true, tone: 'is-danger' },
    { key: 'taxaFraudeQtd', label: APP_CONFIG.LABELS.taxaFraudeQtd, fmt: pct, delta: null, higherIsBad: true, tone: '' },
  ];

  function renderKpis(kpis) {
    const grid = document.getElementById('kpiGrid');
    grid.innerHTML = KPI_DEFS.map((def) => {
      const value = kpis[def.key] ?? 0;
      let deltaHtml = '';
      if (def.delta && kpis[def.delta] != null) {
        const d = kpis[def.delta];
        const isUp = d >= 0;
        const bad = def.higherIsBad ? isUp : !isUp;
        deltaHtml = `<span class="kpi-card__delta ${bad ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(d * 100).toFixed(1)}% vs período anterior</span>`;
      }
      return `
        <div class="kpi-card ${def.tone}">
          <span class="kpi-card__label">${def.label}</span>
          <span class="kpi-card__value">${def.fmt(value)}</span>
          ${deltaHtml}
        </div>`;
    }).join('');
  }

  async function refresh() {
    const state = appState.get();
    document.getElementById('syncLabel').textContent =
      APP_CONFIG.MODE === 'api' ? 'Conectado à API' : 'Dados mock · atualizado agora';
    document.getElementById('modeBadge').textContent = APP_CONFIG.MODE === 'api' ? 'API' : 'MOCK';
    document.getElementById('modeBadge').classList.toggle('is-live', APP_CONFIG.MODE === 'api');

    const data = await dataService.getDashboardData({
      workflow: state.workflow,
      organization: state.organization,
      startDate: state.startDate,
      endDate: state.endDate,
    });

    renderKpis(data.kpis);
    chartsModule.renderAll(data);
    tablesModule.render(data.rankings);
  }

  // Re-renderiza tabela isoladamente quando só a aba/página muda (evita refetch completo)
  let lastTab = null, lastPage = null;
  appState.subscribe((state) => {
    if (state.activeRankingTab === lastTab && state.rankingPage === lastPage) {
      refresh();
    } else {
      tablesModule.renderPage();
    }
    lastTab = state.activeRankingTab;
    lastPage = state.rankingPage;
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await filtersModule.init();
  });
})();

//  ═══════════════════════════════════════════════════════════════
  // 🤖 INTEGRAÇÃO COM CHATBOT - Expõe funções necessárias globalmente
  // ═══════════════════════════════════════════════════════════════
  
  // Expõe setPeriodInDays para o chatbot poder alterar filtros
  window.setPeriodInDays = function(n) {
    const endDate = new Date().toISOString().slice(0, 10);
    const d = new Date();
    d.setDate(d.getDate() - n);
    const startDate = d.toISOString().slice(0, 10);

    const startInput = document.getElementById('filterStart');
    const endInput = document.getElementById('filterEnd');
    if (startInput) startInput.value = startDate;
    if (endInput) endInput.value = endDate;

    document.querySelectorAll('#quickRangeChips button').forEach((b) => b.classList.remove('is-active'));
    const btn = document.querySelector(`#quickRangeChips button[data-range="${n}"]`);
    if (btn) btn.classList.add('is-active');

    appState.set({ startDate, endDate });
    return { startDate, endDate };
  };

  // Expõe appState para o chatbot acessar o estado atual
  window.appState = appState;

  // Expõe MOCK_DB se existir (para o agent calcular métricas)
  if (typeof MOCK_DB !== 'undefined') {
    window.MOCK_DB = MOCK_DB;
  }

