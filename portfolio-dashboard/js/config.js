/**
 * config.js
 * -----------------------------------------------------------------------
 * Ponto único de configuração do projeto.
 *
 * Quando a API real estiver pronta:
 *   1. Troque MODE para 'api'.
 *   2. Preencha BASE_URL com a URL do backend (ex: BigQuery via Cloud Run,
 *      Cloud Function, ou qualquer serviço que exponha os endpoints abaixo).
 *   3. Nenhum outro arquivo precisa mudar — dataService.js já sabe alternar
 *      entre mock e API real com base neste arquivo.
 * -----------------------------------------------------------------------
 */
const APP_CONFIG = {
  // 'mock' | 'api'
  MODE: 'mock',

  BASE_URL: '', // ex: 'https://api.exemplo.com/v1'

  ENDPOINTS: {
    filterOptions: '/filters/options',        // GET  -> { workflows: [], organizations: [] }
    dashboard:     '/dashboard',               // POST -> body: { workflow, organization, startDate, endDate }
  },

  // Nomes usados para exibição — troque aqui caso o schema da API mude os labels.
  LABELS: {
    valorTotal:       'Valor Total Transacionado',
    valorFraude:      'Valor Bloqueado por Suspeita de Fraude',
    taxaFraudeValor:  'Taxa de Fraude Detectada',
    qtdTotal:       'Quantidade Total de Transações',
    qtdFraude:      'Transações Negadas por Suspeita de Fraude',
    taxaFraudeQtd:  'Taxa de Transações Suspeitas',
  },
};
