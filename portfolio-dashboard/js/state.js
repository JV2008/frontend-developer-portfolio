/**
 * state.js
 * -----------------------------------------------------------------------
 * Estado global de filtros + padrão pub/sub simples.
 * Qualquer componente pode fazer appState.subscribe(fn) para reagir
 * a mudanças de filtro (workflow, organização, período, brush do timeline).
 * -----------------------------------------------------------------------
 */
const appState = (function () {
  const listeners = [];

  const state = {
    workflow: 'Todos',
    organization: 'Todas',
    startDate: null,
    endDate: null,
    activeRankingTab: 'mcc',
    rankingPage: 0,
  };

  function set(partial) {
    Object.assign(state, partial);
    listeners.forEach((fn) => fn(state));
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  return { get: () => ({ ...state }), set, subscribe };
})();
