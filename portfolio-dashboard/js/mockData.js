/**
 * mockData.js
 * -----------------------------------------------------------------------
 * Gera um dataset sintético que imita o comportamento visto no Looker
 * Studio (crescimento gradual de volume, picos de fraude em certos
 * períodos, sazonalidade por hora e por dia da semana).
 *
 * Isso simula o que hoje viria de views agregadas de um data warehouse
 * (ex: valor total transacionado por dia, valor bloqueado por suspeita de fraude).
 *
 * Quando a API estiver pronta, este arquivo deixa de ser importado
 * pelo dataService (ver dataService.js) — nenhuma outra parte do
 * projeto depende diretamente dele.
 * -----------------------------------------------------------------------
 */
const MOCK_DB = (function build() {
  const WORKFLOWS = ['Todos', 'Checkout', 'Recarga', 'Assinatura', 'Transferência'];
  const ORGANIZATIONS = ['Todas', 'Região Sul', 'Região Sudeste', 'Região Nordeste'];

  const MCC_POOL = [
    { cod: '7512', mcc: 'ALUGUEL DE AUTOMÓVEIS (AUTOMOBILE RENTAL AGENCY)' },
    { cod: '5734', mcc: 'LOJA DE SOFTWARE' },
    { cod: '6300', mcc: 'VENDA DE SEGUROS (INSURANCE SALES/UNDERWRITER)' },
    { cod: '5912', mcc: 'FARMÁCIAS (DRUGSTORES AND PHARMACIES)' },
    { cod: '7372', mcc: 'SERV DE PROGRAMAÇÃO DE COMP E PROCESSO DE DADOS' },
    { cod: '5968', mcc: 'ASSINATURA COMERCIAL (CONTINUITY/SUBS.MERCHANT)' },
    { cod: '7011', mcc: 'HOTÉIS (HOTELS/MOTELS/RESORTS)' },
    { cod: '8299', mcc: 'COLÉGIOS (SCHOOLS)' },
    { cod: '4816', mcc: 'REDES DE COMPUTADORES / SERVIÇOS DE INFORMAÇÃO' },
    { cod: '7999', mcc: 'SERVIÇOS DE RECREAÇÃO E FESTAS' },
  ];

  const MERCHANT_POOL = [
    { cod: '010987995400001', nome: 'NIMBUS.COM/BILL', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '270695000210809', nome: 'GoRide GORIDE * PENDING', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '92268293', nome: 'DL *OrbitaMusic Ad', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '74311468', nome: 'DL *CLOUDSYNC CloudSync One', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '270695000000499', nome: 'CINESTREAM.COM', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '00004292226', nome: 'PAYWAVE *BILHUNICO', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '270695000208415', nome: 'SKYLINK INTERNET', cidade: 'SAO PAULO', pais: 'BRA' },
    { cod: '85989673', nome: 'QUICKRIDE *QuickRide', cidade: 'SAO PAULO', pais: 'BRA' },
  ];

  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  const rand = seededRandom(20260706);

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

  // Gera série diária de 10-mar-2025 até hoje
  const start = new Date('2025-03-10T00:00:00');
  const end = new Date();
  const days = [];
  let cursor = new Date(start);
  let dayIndex = 0;

  while (cursor <= end) {
    const growth = 1 + dayIndex * 0.004;                 // crescimento gradual de volume
    const spikeWindow = (dayIndex > 300 && dayIndex < 340) || (dayIndex > 400 && dayIndex < 430);
    const fraudSpike = spikeWindow ? 3.2 + rand() * 1.5 : 1;

    const baseQtd = 55000 + growth * 8000 + rand() * 6000;
    const qtdTotal = Math.round(baseQtd);
    const taxaFraudeBase = 0.015 + rand() * 0.01;
    const taxaFraude = Math.min(0.32, taxaFraudeBase * fraudSpike);

    const qtdFraude = Math.round(qtdTotal * taxaFraude);
    const ticketMedio = 70 + rand() * 12;
    const valorTotal = qtdTotal * ticketMedio;
    const valorFraude = qtdFraude * ticketMedio * (0.85 + rand() * 0.3);

    days.push({
      date: toISODate(cursor),
      workflow: WORKFLOWS[1 + (dayIndex % (WORKFLOWS.length - 1))],
      organization: ORGANIZATIONS[1 + (dayIndex % (ORGANIZATIONS.length - 1))],
      qtdTotal,
      qtdFraude,
      qtdAprovadas: qtdTotal - qtdFraude,
      valorTotal,
      valorFraude,
    });

    cursor.setDate(cursor.getDate() + 1);
    dayIndex++;
  }

  // Distribuição por hora (0-23) — perfil observado: baixo de madrugada, pico à noite
  const hourlyProfile = [2.6,2.0,1.0,0.9,1.1,1.4,2.2,3.4,4.3,4.6,4.7,4.8,4.6,4.5,4.6,4.4,4.3,4.6,5.1,4.7,4.2,4.2,3.6,2.9];

  // Distribuição por dia da semana — perfil observado: cresce até sexta, cai no sábado
  const weekdayProfile = {
    domingo: 9.2, 'segunda-feira': 11.9, 'terça-feira': 11.9, 'quarta-feira': 11.5,
    'quinta-feira': 11.9, 'sexta-feira': 13.2, sábado: 11.6,
  };

  return { WORKFLOWS, ORGANIZATIONS, MCC_POOL, MERCHANT_POOL, days, hourlyProfile, weekdayProfile, rand };
})();
