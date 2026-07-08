/**
 * filters.js
 * -----------------------------------------------------------------------
 * Liga os controles visuais de filtro (selects, datas, chips de período)
 * ao appState. Nenhum componente aqui sabe de onde vêm os dados —
 * isso é responsabilidade exclusiva do dataService.
 * -----------------------------------------------------------------------
 */
const filtersModule = (function () {
  function isoDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  async function populateSelects() {
    const { workflows, organizations } = await dataService.getFilterOptions();
    const wfSel = document.getElementById('filterWorkflow');
    const orgSel = document.getElementById('filterOrg');
    wfSel.innerHTML = workflows.map((w) => `<option value="${w}">${w}</option>`).join('');
    orgSel.innerHTML = organizations.map((o) => `<option value="${o}">${o}</option>`).join('');
  }

  function applyQuickRange(days) {
    document.querySelectorAll('#quickRangeChips button').forEach((b) => b.classList.remove('is-active'));
    const btn = document.querySelector(`#quickRangeChips button[data-range="${days}"]`);
    if (btn) btn.classList.add('is-active');

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = days === 'all' ? '2025-03-10' : isoDaysAgo(Number(days));

    document.getElementById('filterStart').value = startDate;
    document.getElementById('filterEnd').value = endDate;
    appState.set({ startDate, endDate });
  }

  function bindEvents() {
    document.getElementById('filterWorkflow').addEventListener('change', (e) => {
      appState.set({ workflow: e.target.value });
    });
    document.getElementById('filterOrg').addEventListener('change', (e) => {
      appState.set({ organization: e.target.value });
    });
    document.getElementById('filterStart').addEventListener('change', (e) => {
      document.querySelectorAll('#quickRangeChips button').forEach((b) => b.classList.remove('is-active'));
      appState.set({ startDate: e.target.value });
    });
    document.getElementById('filterEnd').addEventListener('change', (e) => {
      document.querySelectorAll('#quickRangeChips button').forEach((b) => b.classList.remove('is-active'));
      appState.set({ endDate: e.target.value });
    });

    document.querySelectorAll('#quickRangeChips button').forEach((btn) => {
      btn.addEventListener('click', () => applyQuickRange(btn.dataset.range));
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      document.getElementById('filterWorkflow').value = 'Todos';
      document.getElementById('filterOrg').value = 'Todas';
      appState.set({ workflow: 'Todos', organization: 'Todas', rankingPage: 0 });
      applyQuickRange(30);
    });

    document.getElementById('rankingTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      document.querySelectorAll('#rankingTabs button').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      appState.set({ activeRankingTab: btn.dataset.tab, rankingPage: 0 });
    });
  }

  async function init() {
    await populateSelects();
    bindEvents();
    applyQuickRange(30); // período padrão ao carregar
  }

  return { init };
})();
