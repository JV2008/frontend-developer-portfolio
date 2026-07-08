/**
 * chatbot.js
 * -----------------------------------------------------------------------
 * Interface do Chatbot integrado com AI Agent.
 * Responsável apenas pela UI e comunicação com o Agent.
 * -----------------------------------------------------------------------
  */



const chatbotAgent = (function () {
  // Estado local do chat
  let isOpen = false;
  let messages = [];
  let isTyping = false;

  // Seletores DOM
  let triggerBtn, sidebar, messagesContainer, chatForm, chatInput, clearBtn, closeBtn;

  // Sugestões padrão
  const SUGGESTIONS = [
    { label: "Qual a Taxa de Fraude Geral?", text: "Qual a taxa de fraude geral?" },
    { label: "Top Merchants de Fraude", text: "Quais são os maiores merchants de fraude?" },
    { label: "Pico de Fraude por Horário", text: "Qual o horário com mais fraudes?" },
    { label: "Filtrar por Checkout", text: "Filtrar dashboard para Checkout" },
    { label: "Resumo da Org México", text: "Me dê um resumo da organização México" }
  ];


// ========================================
  // CSS DO CHATBOT (injetado dinamicamente)
  // ========================================
  const CHATBOT_CSS = `
    :root {
      --color-bg: #F5F6FA;
      --color-ink: #0B1220;
      --color-ink-soft: #101B2E;
      --color-primary: #0F9E8A;
      --color-primary-soft: #E3FBF6;
      --color-primary-dark: #0B7A6B;
      --color-signal: #22D3B8;
      --color-success: #16A34A;
      --color-success-soft: #E8F8EE;
      --color-danger: #E24560;
      --color-danger-soft: #FDECEF;
      --color-amber: #F5A524;
      --color-text: #101522;
      --color-text-muted: #5B6478;
      --color-border: #E3E6EF;
      --card-radius: 14px;
      --font-display: 'Space Grotesk', sans-serif;
      --font-body: 'IBM Plex Sans', sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
      --shadow-card: 0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -12px rgba(11,18,32,0.10);
    }

    /* Botão Trigger Flutuante */
    .chat-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 158, 138, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 9999;
    }

    .chat-trigger:hover {
      background: var(--color-primary-dark);
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(15, 158, 138, 0.5);
    }

    .chat-trigger.is-active {
      background: var(--color-danger);
      transform: rotate(90deg);
    }

    .chat-trigger svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
    }

    /* Sidebar do Chat */
    .chat-sidebar {
      position: fixed;
      top: 0;
      right: -420px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      transition: right 0.3s ease;
      z-index: 10000;
    }

    .chat-sidebar.is-open {
      right: 0;
    }

    /* Header */
    .chat-header {
      background: var(--color-primary);
      color: white;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .chat-header__info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-header__avatar {
      width: 42px;
      height: 42px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-header__titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chat-header__title {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 1rem;
    }

    .chat-header__status {
      font-size: 0.8rem;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .chat-header__status::before {
      content: '';
      width: 8px;
      height: 8px;
      background: var(--color-signal);
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(34, 211, 184, 0.3);
    }

    .chat-header__actions {
      display: flex;
      gap: 8px;
    }

    .chat-header__btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .chat-header__btn:hover {
      background: rgba(255,255,255,0.25);
    }

    /* Área de Mensagens */
    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: var(--color-bg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chat-messages::-webkit-scrollbar { width: 6px; }
    .chat-messages::-webkit-scrollbar-track { background: transparent; }
    .chat-messages::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }

    /* Mensagens */
    .chat-msg {
      max-width: 85%;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chat-msg--bot { align-self: flex-start; }
    .chat-msg--user { align-self: flex-end; }

    .chat-msg p {
      margin: 0;
      padding: 12px 16px;
      font-size: 0.92rem;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .chat-msg--bot p {
      background: white;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 16px 16px 16px 4px;
    }

    .chat-msg--user p {
      background: var(--color-primary);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    /* Indicador de Digitação */
    .chat-typing {
      display: flex;
      gap: 5px;
      padding: 14px 18px;
      background: white;
      border-radius: 16px 16px 16px 4px;
      border: 1px solid var(--color-border);
      width: fit-content;
      align-self: flex-start;
    }

    .chat-typing span {
      width: 7px;
      height: 7px;
      background: var(--color-primary);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .chat-typing span:nth-child(1) { animation-delay: -0.32s; }
    .chat-typing span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Sugestões/Chips */
    .chat-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .chat-chip {
      padding: 8px 14px;
      background: var(--color-primary-soft);
      color: var(--color-primary-dark);
      border: 1px solid var(--color-primary);
      border-radius: 20px;
      font-size: 0.85rem;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all 0.2s;
    }

    .chat-chip:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-2px);
    }

    /* Footer/Input */
    .chat-footer {
      padding: 16px;
      background: white;
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .chat-input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .chat-input {
      flex: 1;
      padding: 12px 18px;
      border: 1px solid var(--color-border);
      border-radius: 24px;
      font-family: var(--font-body);
      font-size: 0.92rem;
      color: var(--color-text);
      background: var(--color-bg);
      outline: none;
      transition: all 0.2s ease;
    }

    .chat-input:focus {
      border-color: var(--color-primary);
      background: white;
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .chat-input::placeholder {
      color: var(--color-text-muted);
    }

    .chat-send-btn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.1s;
      flex-shrink: 0;
    }

    .chat-send-btn:hover {
      background: var(--color-primary-dark);
    }

    .chat-send-btn:active {
      transform: scale(0.92);
    }

    .chat-send-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
      transform: translateX(1px);
    }

    .chat-footer-hint {
      display: block;
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Responsivo */
    @media (max-width: 480px) {
      .chat-sidebar {
        width: 100%;
        right: -100%;
      }
    }
  `;

  // Injeta o CSS no <head>
  function injectStyles() {
    if (document.getElementById('chatbot-styles')) return; // Evita duplicação

    const style = document.createElement('style');
    style.id = 'chatbot-styles';
    style.textContent = CHATBOT_CSS;
    document.head.appendChild(style);
  }

  // Iniciar componente
  function init() {
    injectStyles();
    createElements();
    bindEvents();
    renderWelcome();
  }

  // Cria o HTML do chatbot e insere no body
  function createElements() {
    // Botão flutuante
    triggerBtn = document.createElement('button');
    triggerBtn.className = 'chat-trigger';
    triggerBtn.id = 'chatTriggerBtn';
    triggerBtn.setAttribute('aria-label', 'Abrir chat com assistente');
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.13 2 11.23c0 2.87 1.42 5.42 3.65 7.07-.12.57-.46 2.06-1.15 2.92-.08.1-.09.24-.02.35.07.1.18.17.3.17 1.5 0 3.2-.5 4.34-1.25.6.17 1.23.27 1.88.27 5.523 0 10-4.13 10-9.23S17.523 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
      </svg>
    `;

    // Painel lateral
    sidebar = document.createElement('div');
    sidebar.className = 'chat-sidebar';
    sidebar.id = 'chatSidebar';
    sidebar.innerHTML = `
      <div class="chat-header">
        <div class="chat-header__info">
          <div class="chat-header__avatar">
            <svg width="20" height="20" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="15" r="15" fill="#F17322"/>
              <path d="M9 20L14 9L16 15.5L21 9" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="chat-header__titles">
            <span class="chat-header__title">Assistente Sentinela Analytics</span>
            <span class="chat-header__status">Online · Agente de IA</span>
          </div>
        </div>
        <div class="chat-header__actions">
          <button class="chat-header__btn" id="chatClearBtn" title="Limpar conversa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="chat-header__btn" id="chatCloseBtn" title="Fechar chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
       <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-footer">
        <form id="chatForm" class="chat-input-wrapper">
          <input type="text" class="chat-input" id="chatInput" placeholder="Pergunte sobre os dados de fraude..." autocomplete="off">
          <button type="submit" class="chat-send-btn" aria-label="Enviar mensagem">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        <span class="chat-footer-hint">Powered by AI Agent · Dados de Sandbox</span>
      </div>
    `;

    document.body.appendChild(triggerBtn);
    document.body.appendChild(sidebar);

    // Mapear elementos do DOM
    messagesContainer = document.getElementById('chatMessages');
    chatForm = document.getElementById('chatForm');
    chatInput = document.getElementById('chatInput');
    clearBtn = document.getElementById('chatClearBtn');
    closeBtn = document.getElementById('chatCloseBtn');
  }

  // Registra eventos de clique/envio
  function bindEvents() {
    triggerBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', () => toggleChat(false));
    clearBtn.addEventListener('click', clearChat);

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      handleUserMessage(text);
      chatInput.value = '';
    });
  }

  function toggleChat(forceState) {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    sidebar.classList.toggle('is-open', isOpen);
    triggerBtn.classList.toggle('is-active', isOpen);
    if (isOpen) {
      chatInput.focus();
      scrollToBottom();
    }
  }

  function clearChat() {
    messages = [];
    messagesContainer.innerHTML = '';
    clearAgentHistory(); // Limpa também o histório do Agent
    renderWelcome();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTyping(show) {
    isTyping = show;
    const existing = document.getElementById('chatTypingIndicator');
    if (show && !existing) {
      const indicator = document.createElement('div');
      indicator.className = 'chat-typing';
      indicator.id = 'chatTypingIndicator';
      indicator.innerHTML = '<span></span><span></span><span></span>';
      messagesContainer.appendChild(indicator);
      scrollToBottom();
    } else if (!show && existing) {
      existing.remove();
    }
  }

  // Renderiza a mensagem inicial do Agente
  function renderWelcome() {
    const text = `<p>Olá! Sou o <strong>Assistente Antifraude da Sentinela Analytics</strong>. 🚀</p>
      <p>Posso te dar análises em tempo real dos nossos dados simulados de fraude, TPV, picos horários e rankings. Também posso atualizar os filtros da página para você!</p>
      <p>O que você gostaria de analisar hoje?</p>`;
    appendMessage(text, 'bot', SUGGESTIONS);
  }

  // Adiciona balão de mensagem ao chat
  function appendMessage(text, sender, suggestions = null) {
    showTyping(false);

    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg--${sender}`;
    msg.innerHTML = text;

    if (suggestions && suggestions.length > 0) {
      const sugWrap = document.createElement('div');
      sugWrap.className = 'chat-suggestions';
      suggestions.forEach((sug) => {
        const chip = document.createElement('button');
        chip.className = 'chat-chip';
        chip.textContent = sug.label;
        chip.addEventListener('click', () => {
          handleUserMessage(sug.text);
        });
        sugWrap.appendChild(chip);
      });
      msg.appendChild(sugWrap);
    }

    messagesContainer.appendChild(msg);
    messages.push({ text, sender });
    scrollToBottom();
  }

  // Processa a entrada do usuário (AGORA ASSÍNCRONA)
  async function handleUserMessage(text) {
    appendMessage(text, 'user');
    showTyping(true);

    try {
      // Chama o Agent para processar a mensagem
      const reply = await runAgent(text);
      
      // Exibe a resposta do Agent (sem sugestões fixas, pois a IA pode gerar as próprias)
      appendMessage(reply, 'bot', SUGGESTIONS);
    } catch (error) {
      console.error("Erro no chatbot:", error);
      appendMessage(
        "Desculpe, tive um problema ao processar sua solicitação. Tente novamente em instantes.",
        'bot',
        SUGGESTIONS
      );
    }
  }

  return { init };
})();

// Inicializa quando o documento carregar
document.addEventListener('DOMContentLoaded', () => {
  chatbotAgent.init();
});