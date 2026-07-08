/**
 * toolExecutors.js
 * As "mãos" do Agent - executa as ferramentas
 */

// Funções auxiliares de formatação
const moneyFmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const intFmt = (v) => v.toLocaleString('pt-BR');
const pctFmt = (v) => (v * 100).toFixed(2) + '%';

/**
 * Tool: apply_dashboard_filters
 */
function applyDashboardFilters(args) {
  const updates = {};
  
  if (args.days && typeof window.setPeriodInDays === 'function') {
    window.setPeriodInDays(args.days);
  }
  
  if (args.workflow) {
    updates.workflow = args.workflow;
    const wfSelect = document.getElementById('filterWorkflow');
    if (wfSelect) wfSelect.value = args.workflow;
  }
  
  if (args.organization) {
    updates.organization = args.organization;
    const orgSelect = document.getElementById('filterOrg');
    if (orgSelect) orgSelect.value = args.organization;
  }
  
  if (Object.keys(updates).length > 0 && window.appState) {
    window.appState.set(updates);
  }
  
  return { 
    success: true, 
    message: "Filtros aplicados com sucesso",
    applied: updates 
  };
}

/**
 * Tool: get_fraud_analytics
 */
function calculateLocalMetrics(args) {
  if (!window.MOCK_DB || !window.appState) {
    return { error: "Dados não disponíveis" };
  }

  const state = window.appState.get();
  const workflowFilter = args.workflow || state.workflow;
  const orgFilter = args.organization || state.organization;
  
  const filteredDays = window.MOCK_DB.days.filter((d) => {
    if (workflowFilter && workflowFilter !== 'Todos' && d.workflow !== workflowFilter) return false;
    if (orgFilter && orgFilter !== 'Todas' && d.organization !== orgFilter) return false;
    return true;
  });
  
  const sum = (arr, key) => arr.reduce((a, d) => a + (d[key] || 0), 0);
  const qtdTotal = sum(filteredDays, 'qtdTotal');
  const qtdFraude = sum(filteredDays, 'qtdFraude');
  const tpvTotal = sum(filteredDays, 'tpvTotal');
  const tpvFraude = sum(filteredDays, 'tpvFraude');
  
  const taxaFraudeTpv = tpvTotal ? tpvFraude / tpvTotal : 0;
  const taxaFraudeQtd = qtdTotal ? qtdFraude / qtdTotal : 0;
  
  switch(args.metric_type) {
    case 'merchants':
      return {
        top_merchants: window.MOCK_DB.MERCHANT_POOL.map((m, i) => ({
          nome: m.nome,
          tpv: Math.round(tpvFraude * ((window.MOCK_DB.MERCHANT_POOL.length - i) / 36) * 0.95),
          transacoes: Math.round(qtdFraude * ((window.MOCK_DB.MERCHANT_POOL.length - i) / 36) * 1.1)
        })).sort((a, b) => b.tpv - a.tpv).slice(0, 3),
        tpv_fraude_total: tpvFraude
      };
      
    case 'mcc':
      return {
        top_mccs: window.MOCK_DB.MCC_POOL.map((m, i) => ({
          cod: m.cod,
          mcc: m.mcc.split('(')[0].trim(),
          tpv: Math.round(tpvFraude * ((window.MOCK_DB.MCC_POOL.length - i) / 55) * 0.9)
        })).sort((a, b) => b.tpv - a.tpv).slice(0, 3)
      };
      
    case 'hourly':
      return {
        peak_hours: "18:00 - 21:00",
        peak_percentage: "14.5%",
        low_hours: "02:00 - 05:00"
      };
      
    case 'daily':
      return {
        peak_day: "Sexta-feira",
        peak_day_percentage: "13.2%",
        low_day: "Domingo",
        low_day_percentage: "9.2%"
      };
      
    default:
      return {
        tpv_total: tpvTotal,
        tpv_fraude: tpvFraude,
        qtd_total: qtdTotal,
        qtd_fraude: qtdFraude,
        taxa_fraude_tpv: taxaFraudeTpv,
        taxa_fraude_qtd: taxaFraudeQtd,
        formatted: {
          tpv_total_fmt: moneyFmt(tpvTotal),
          qtd_total_fmt: intFmt(qtdTotal),
          qtd_fraude_fmt: intFmt(qtdFraude),
          tpv_fraude_fmt: moneyFmt(tpvFraude),
          qtd_fraude_pct: pctFmt(taxaFraudeQtd),
          taxa_fraude_pct: pctFmt(taxaFraudeTpv)
        }
      };
  }
}