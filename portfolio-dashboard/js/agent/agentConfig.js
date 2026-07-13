/**
 * agentConfig.js
 * Configurações e definição das ferramentas do Agent
 */

// Definição das Tools (Ferramentas) que o Agente pode chamar
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_fraud_analytics",
      description: "Calcula métricas de fraude, TPV, rankings de merchants ou MCCs com base nos filtros atuais ou solicitados.",
      parameters: {
        type: "object",
        properties: {
          workflow: { type: "string", description: "Workflow (ex: 'Checkout', 'Todos')" },
          organization: { type: "string", description: "Organização (ex: 'RecargaPay BR', 'RecargaPay MX')" },
          days: { type: "integer", description: "Número de dias para filtrar (ex: 7, 30)" },
          metric_type: { 
            type: "string", 
            enum: ["general", "merchants", "mcc", "hourly", "daily"], 
            description: "Tipo de métrica solicitada" 
          }
        },
        required: ["metric_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "apply_dashboard_filters",
      description: "Altera os filtros visuais do dashboard na tela do usuário.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "Filtrar por últimos X dias" },
          workflow: { type: "string", description: "Filtrar por workflow" },
          organization: { type: "string", description: "Filtrar por organização" }
        }
      }
    }
  }
];

// Configuração do System Prompt
const SYSTEM_PROMPT = `Você é o Assistente Antifraude do RecargaPay. 
Seja conciso, profissional e use emojis com moderação (máximo 1 por mensagem).
Use as ferramentas fornecidas para buscar dados ou alterar a tela antes de responder.
Sempre que o usuário pedir para "filtrar", "mudar" ou "ver" algo específico, use a ferramenta apply_dashboard_filters primeiro.
Para perguntas sobre métricas, valores, rankings ou estatísticas, use get_fraud_analytics.`;

// Configuração da API
// ⚠️ COLE SUA CHAVE DO GEMINI AQUI (substitua o texto abaixo).
// Para o Gemini, o modelo já vai na própria URL do endpoint.
const API_CONFIG = {
  endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  model: "gemini-2.5-flash",
  apiKey: "********" // ex: "AIza..."
};
