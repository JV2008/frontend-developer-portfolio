/**
 * dataService.js
 * -----------------------------------------------------------------------
 * ÚNICO ponto de acesso a dados usado pelo resto do app (charts, tables,
 * kpis). Ninguém mais deve importar mockData.js ou fazer fetch direto.
 *
 * Contrato (o que a API real precisa devolver):
 *
 *   getFilterOptions() -> Promise<{ workflows: string[], organizations: string[] }>
 *
 *   getDashboardData({ workflow, organization, startDate, endDate })
 *     -> Promise<{
 *          kpis: {
 *            valorTotal, valorFraude, taxaFraudeValor,
 *            qtdTotal, qtdFraude, taxaFraudeQtd,
 *            deltaValorTotal, deltaTaxaFraude   // variação % vs período anterior equivalente
 *          },
 *          timeSeries: [{ date, qtdAprovadas, qtdFraude, taxaFraude, qtdTotal }],
 *          hourly: [{ hour: '00', qtdFraude }],
 *          weekday: [{ day: 'domingo', qtdFraude }],
 *          rankings: {
 *            mcc:      [{ cod, mcc, valor, transacoes }],
 *            cartao:   [{ cartao, valor, transacoes }],
 *            merchant: [{ cod, merchant, cidade, pais, valor, transacoes }],
 *          }
 *        }>
 *
 * -----------------------------------------------------------------------
 */
const dataService = (function () {

  // ---------------------------------------------------------------------
  // MODO API REAL — TODO quando o backend estiver disponível
  // ---------------------------------------------------------------------
  async function apiGetFilterOptions() {
    const res = await fetch(APP_CONFIG.BASE_URL + APP_CONFIG.ENDPOINTS.filterOptions);
    if (!res.ok) throw new Error('Falha ao buscar opções de filtro');
    return res.json();
  }

  async function apiGetDashboardData(filters) {
    const res = await fetch(APP_CONFIG.BASE_URL + APP_CONFIG.ENDPOINTS.dashboard, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });
    if (!res.ok) throw new Error('Falha ao buscar dados do dashboard');
    return res.json();
  }

  // ---------------------------------------------------------------------
  // MODO MOCK — usado enquanto a API não existe
  // ---------------------------------------------------------------------
  function mockGetFilterOptions() {
    return Promise.resolve({
      workflows: MOCK_DB.WORKFLOWS,
      organizations: MOCK_DB.ORGANIZATIONS,
    });
  }

  function filterDays({ workflow, organization, startDate, endDate }) {
    return MOCK_DB.days.filter((d) => {
      if (workflow && workflow !== 'Todos' && d.workflow !== workflow) return false;
      if (organization && organization !== 'Todas' && d.organization !== organization) return false;
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }

  function sum(arr, key) { return arr.reduce((a, d) => a + d[key], 0); }

  function buildRankings(days, rand) {
    const totalFraudeValor = sum(days, 'valorFraude');
    const totalFraudeQtd = sum(days, 'qtdFraude');

    const mcc = MOCK_DB.MCC_POOL.map((m, i) => {
      const share = (MOCK_DB.MCC_POOL.length - i) / 55;
      return {
        cod: m.cod, mcc: m.mcc,
        valor: Math.round(totalFraudeValor * share * (0.8 + rand() * 0.4)),
        transacoes: Math.round(totalFraudeQtd * share * (0.6 + rand() * 0.8)),
      };
    }).sort((a, b) => b.valor - a.valor);

    const cartao = Array.from({ length: 10 }).map((_, i) => {
      const bin = '2234' + (i % 2 === 0 ? '6062' : '6016');
      const share = (10 - i) / 70;
      return {
        cartao: `${bin}******${1000 + Math.floor(rand() * 8999)}`,
        valor: Math.round(totalFraudeValor * share * (0.5 + rand() * 0.6)),
        transacoes: Math.max(1, Math.round(totalFraudeQtd * share * 0.02)),
      };
    }).sort((a, b) => b.valor - a.valor);

    const merchant = MOCK_DB.MERCHANT_POOL.map((m, i) => {
      const share = (MOCK_DB.MERCHANT_POOL.length - i) / 36;
      return {
        cod: m.cod, merchant: m.nome, cidade: m.cidade, pais: m.pais,
        valor: Math.round(totalFraudeValor * share * (0.9 + rand() * 0.5)),
        transacoes: Math.round(totalFraudeQtd * share * (1.2 + rand() * 1.4)),
      };
    }).sort((a, b) => b.valor - a.valor);

    return { mcc, cartao, merchant };
  }

  function mockGetDashboardData(filters) {
    const days = filterDays(filters);

    const qtdTotal = sum(days, 'qtdTotal');
    const qtdFraude = sum(days, 'qtdFraude');
    const valorTotal = sum(days, 'valorTotal');
    const valorFraude = sum(days, 'valorFraude');

    const kpis = {
      valorTotal,
      valorFraude,
      taxaFraudeValor: valorTotal ? valorFraude / valorTotal : 0,
      qtdTotal,
      qtdFraude,
      taxaFraudeQtd: qtdTotal ? qtdFraude / qtdTotal : 0,
      deltaValorTotal: 0.031,     // mock estático — troque pela comparação real vs período anterior
      deltaTaxaFraude: -0.008,
    };

    const timeSeries = days.map((d) => ({
      date: d.date,
      qtdAprovadas: d.qtdAprovadas,
      qtdFraude: d.qtdFraude,
      qtdTotal: d.qtdTotal,
      taxaFraude: d.qtdTotal ? d.qtdFraude / d.qtdTotal : 0,
    }));

    const hourly = MOCK_DB.hourlyProfile.map((weight, h) => ({
      hour: h < 10 ? `0${h}` : `${h}`,
      qtdFraude: Math.round((qtdFraude / 24) * (weight / 3.5) || 0),
    }));

    const weekday = Object.entries(MOCK_DB.weekdayProfile).map(([day, weight]) => ({
      day,
      qtdFraude: Math.round((qtdFraude / 7) * (weight / 11.5) || 0),
    }));

    const rankings = buildRankings(days, MOCK_DB.rand);

    return Promise.resolve({ kpis, timeSeries, hourly, weekday, rankings });
  }

  // ---------------------------------------------------------------------
  // API pública do serviço — escolhe mock ou real conforme APP_CONFIG.MODE
  // ---------------------------------------------------------------------
  return {
    getFilterOptions() {
      return APP_CONFIG.MODE === 'api' ? apiGetFilterOptions() : mockGetFilterOptions();
    },
    getDashboardData(filters) {
      return APP_CONFIG.MODE === 'api' ? apiGetDashboardData(filters) : mockGetDashboardData(filters);
    },
  };
})();
