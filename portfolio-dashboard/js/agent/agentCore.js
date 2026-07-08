// Histórico de mensagens no formato "contents" da Gemini
let messageHistory = [];

// Converte as ferramentas do formato OpenAI para "functionDeclarations" da Gemini
const GEMINI_TOOLS = [
  {
    functionDeclarations: AGENT_TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters
    }))
  }
];

async function runAgent(userMessage) {
  // Adiciona mensagem do usuário ao histórico
  messageHistory.push({ role: "user", parts: [{ text: userMessage }] });

  // Validação da chave de API
  if (!API_CONFIG.apiKey || API_CONFIG.apiKey === "COLOQUE_SUA_CHAVE_AQUI") {
    return "A API Key não está configurada. Edite API_CONFIG.apiKey em js/agent/agentConfig.js com sua chave do Gemini.";
  }

  const url = `${API_CONFIG.endpoint}?key=${API_CONFIG.apiKey}`;

  const buildBody = () => ({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: messageHistory,
    tools: GEMINI_TOOLS,
    toolConfig: { functionCallingConfig: { mode: "AUTO" } }
  });

  try {
    const data = await callGemini(url, buildBody());

    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content) {
      const err = data.error && data.error.message;
      throw new Error(err || "Resposta vazia da API");
    }

    const parts = candidate.content.parts || [];
    const fnCall = parts.find((p) => p.functionCall);

    // A IA quer usar uma ferramenta
    if (fnCall) {
      const { name, args } = fnCall.functionCall;
      let toolResult = "";
      if (name === "apply_dashboard_filters") {
        toolResult = applyDashboardFilters(args);
      } else if (name === "get_fraud_analytics") {
        toolResult = calculateLocalMetrics(args);
      }

      // Registra a chamada e o resultado no histórico
      messageHistory.push({ role: "model", parts: [{ functionCall: { name, args } }] });
      messageHistory.push({
        role: "user",
        parts: [{ functionResponse: { name, response: toolResult } }]
      });

      // 2ª chamada: envia os resultados das ferramentas de volta para gerar a resposta final
      const finalData = await callGemini(url, buildBody());
      const finalText = extractText(finalData);
      messageHistory.push({ role: "model", parts: [{ text: finalText }] });
      return finalText;
    }

    // Resposta direta (sem ferramentas)
    const text = extractText(data);
    messageHistory.push({ role: "model", parts: [{ text }] });
    return text;

  } catch (error) {
    console.error("Erro no Agent:", error);
    let motivo = error.message || "erro desconhecido";
    if (error instanceof TypeError) {
      motivo = "falha de rede/CORS ao chamar a API (verifique a origem ou use um proxy)";
    }
    return `Desculpe, tive um problema ao processar sua solicitação (${motivo}).`;
  }
}

// Faz a chamada POST para a Gemini e trata erros HTTP
async function callGemini(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = (data.error && data.error.message) || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

// Extrai o texto da resposta da Gemini
function extractText(data) {
  const candidate = data.candidates && data.candidates[0];
  if (!candidate || !candidate.content) return "";
  return (candidate.content.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
}

// Função para limpar o histórico (útil para o botão "Limpar conversa")
function clearAgentHistory() {
  messageHistory = [];
}
