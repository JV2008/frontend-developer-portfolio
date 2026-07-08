/**
 * tables.js
 * -----------------------------------------------------------------------
 * Renderiza as tabelas de ranking (MCC / Cartão / Merchant) com abas
 * e paginação client-side. Quando a API real existir, o ideal é que a
 * paginação passe a ser feita no backend (parâmetros page/pageSize no
 * endpoint /dashboard) — a estrutura aqui já isola isso em `renderPage`.
 * -----------------------------------------------------------------------
 */
const tablesModule = (function () {
  const PAGE_SIZE = 8;
  let currentRankings = null;

  function money(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function int(v) { return v.toLocaleString('pt-BR'); }

  function columnsFor(tab) {
    if (tab === 'mcc') return [
      { key: 'cod', label: 'Cód.' },
      { key: 'mcc', label: 'MCC' },
      { key: 'valor', label: 'Valor', num: true, fmt: money },
      { key: 'transacoes', label: 'Transações', num: true, fmt: int },
    ];
    if (tab === 'cartao') return [
      { key: 'cartao', label: 'Cartão' },
      { key: 'valor', label: 'Valor', num: true, fmt: money },
      { key: 'transacoes', label: 'Transações', num: true, fmt: int },
    ];
    return [
      { key: 'cod', label: 'Cód.' },
      { key: 'merchant', label: 'Merchant' },
      { key: 'cidade', label: 'Cidade' },
      { key: 'pais', label: 'País' },
      { key: 'valor', label: 'Valor', num: true, fmt: money },
      { key: 'transacoes', label: 'Transações', num: true, fmt: int },
    ];
  }

  function renderPage() {
    const state = appState.get();
    const tab = state.activeRankingTab;
    const rows = currentRankings ? currentRankings[tab] : [];
    const cols = columnsFor(tab);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const page = Math.min(state.rankingPage, totalPages - 1);
    const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const wrap = document.getElementById('rankingTableWrap');

    if (!pageRows.length) {
      wrap.innerHTML = `<div class="empty-state">Nenhum registro para os filtros selecionados.</div>`;
    } else {
      wrap.innerHTML = `
        <table class="ranking">
          <thead><tr>${cols.map((c) => `<th class="${c.num ? 'num' : ''}">${c.label}</th>`).join('')}</tr></thead>
          <tbody>
            ${pageRows.map((r) => `
              <tr>${cols.map((c) => `<td class="${c.num ? 'num' : ''}">${c.fmt ? c.fmt(r[c.key]) : r[c.key]}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>`;
    }

    const pagWrap = document.getElementById('rankingPagination');
    pagWrap.innerHTML = `
      <span>${rows.length ? page * PAGE_SIZE + 1 : 0}-${Math.min(rows.length, (page + 1) * PAGE_SIZE)} / ${rows.length}</span>
      <button id="pagPrev" ${page === 0 ? 'disabled' : ''}>&lsaquo;</button>
      <button id="pagNext" ${page >= totalPages - 1 ? 'disabled' : ''}>&rsaquo;</button>
    `;

    document.getElementById('pagPrev')?.addEventListener('click', () => {
      appState.set({ rankingPage: Math.max(0, page - 1) });
    });
    document.getElementById('pagNext')?.addEventListener('click', () => {
      appState.set({ rankingPage: Math.min(totalPages - 1, page + 1) });
    });
  }

  function render(rankings) {
    currentRankings = rankings;
    renderPage();
  }

  return { render, renderPage };
})();
