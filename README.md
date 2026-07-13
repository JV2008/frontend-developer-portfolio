# Sentinela Analytics · Dashboard Antifraude (protótipo)

Protótipo web funcional (HTML + CSS + JS puro, sem build step) de um
dashboard de antifraude transacional, com **filtros dinâmicos,
interatividade completa e dados mock** — pronto para trocar por uma API real
sem reescrever a interface.

> Projeto pessoal de portfólio. Todos os dados exibidos são sintéticos,
> gerados por um algoritmo determinístico (`mockData.js`) — nenhum dado real
> de transações, clientes ou empresas é utilizado.

## Como abrir

Não precisa de servidor nem instalação. Basta abrir `index.html` no navegador,
ou servir a pasta com qualquer servidor estático:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Estrutura

```
sentinela-dashboard/
├── index.html          # marcação + wiring dos <script>
├── css/styles.css       # design system (cores, tipografia, componentes)
└── js/
    ├── config.js         # MODE ('mock' | 'api'), BASE_URL, endpoints, labels
    ├── mockData.js        # gerador determinístico de dados sintéticos
    ├── dataService.js     # ⭐ única porta de entrada de dados do app
    ├── state.js           # estado global de filtros (pub/sub)
    ├── charts.js           # Chart.js + brush (seleção de período arrastando o mouse)
    ├── tables.js            # rankings (MCC / Cartão / Merchant) com abas e paginação
    ├── filters.js            # liga selects/datas/chips ao appState
    └── app.js                  # orquestra: busca dados -> distribui pros componentes
```

## Como funciona a interatividade

- Trocar **Workflow**, **Organização** ou o **período** (inputs de data ou
  chips 7d/30d/90d/Tudo) dispara `appState.set(...)`, que notifica todos os
  componentes inscritos (`app.js`) para buscar dados filtrados e re-renderizar
  KPIs, gráficos e tabelas juntos.
- No gráfico principal (linha do tempo), **arraste o mouse** sobre a área do
  gráfico para selecionar visualmente um intervalo — isso atualiza os inputs
  de data e refaz o filtro em cascata, permitindo comparar diferenças de dados
  ao longo do tempo sem digitar datas.
- As tabelas de ranking têm abas (MCC / Cartão / Merchant) e paginação; trocar
  de aba não refaz a busca completa de dados, só re-renderiza a tabela local
  (ver lógica em `app.js`).

## Como plugar uma API real depois

Todo o app conversa com dados **exclusivamente** através de `dataService.js`.
Para conectar uma API de verdade:

1. Abra `js/config.js` e troque:
   ```js
   MODE: 'api',
   BASE_URL: 'https://sua-api.exemplo.com/v1',
   ```
2. Implemente no backend os dois endpoints já esperados pelo `dataService.js`:
   - `GET  {BASE_URL}/filters/options` → `{ workflows: string[], organizations: string[] }`
   - `POST {BASE_URL}/dashboard` com body `{ workflow, organization, startDate, endDate }`
     → objeto no formato descrito no cabeçalho de `dataService.js`
     (`kpis`, `timeSeries`, `hourly`, `weekday`, `rankings`).
3. Nenhum outro arquivo (`charts.js`, `tables.js`, `app.js`...) precisa mudar —
   eles só conhecem o formato de retorno, não a origem dos dados.

Esse contrato foi desenhado para mapear naturalmente para um data warehouse
analítico (ex: BigQuery, Redshift, Snowflake): o endpoint `/dashboard` é o
lugar natural para centralizar as queries agregadas de valor transacionado, volume de
transações e taxas de fraude por período (por exemplo, via Cloud Run ou
Cloud Function que executa o SQL e devolve o JSON já no formato esperado).

## Próximos passos sugeridos

- Adicionar cache leve (ex: `sessionStorage`) para evitar refetch ao trocar
  só a aba de ranking.
- Adicionar loading skeletons durante o `await dataService.getDashboardData`.
- Se o volume de linhas de ranking for muito grande, mover paginação e
  ordenação para o backend (o `dataService` já foi desenhado pensando nisso).
- Autenticação/organização multi-tenant: o filtro de "Organização" já existe
  na interface e no contrato de dados — é só a API real respeitar esse
  parâmetro nas queries.
