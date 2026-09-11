/**
 * AI Command Center - Assistant & Multi-AI Challenge Controller
 * Integrates Google Gemini API for real-time live conversational AI copilot directly in the chat drawer.
 */
const AssistantManager = {
  selectedAIs: ['chatgpt', 'claude', 'gemini'],
  chatHistory: [],

  /**
   * Initialize Assistant, Drawer Chat & Multi-AI Challenge
   */
  init() {
    this.initMultiAI();
    this.initDrawerChat();
    this.initDrawerConnect();
    this.initQuickPrompts();
    this.updateDrawerStatus();
    this.initInitialGreeting();
  },

  /**
   * Update Drawer Gemini Connection Badge and Connect Banner
   */
  updateDrawerStatus() {
    const isConn = typeof GeminiClient !== 'undefined' && GeminiClient.isConnected();
    const statusBadge = document.getElementById('drawer-gemini-status');
    const modelLabel = document.getElementById('drawer-gemini-model-label');
    const connectBanner = document.getElementById('drawer-connect-banner');

    if (statusBadge) {
      if (isConn) {
        statusBadge.textContent = 'ONLINE ⚡';
        statusBadge.className = 'drawer-status-badge online';
      } else {
        statusBadge.textContent = 'OFFLINE';
        statusBadge.className = 'drawer-status-badge offline';
      }
    }

    if (modelLabel) {
      if (isConn && typeof GeminiClient !== 'undefined') {
        const modelName = GeminiClient.models[GeminiClient.model]?.name || GeminiClient.model || 'Gemini 2.0 Flash';
        modelLabel.textContent = modelName.replace(' (Recommended)', '');
      } else {
        modelLabel.textContent = 'Connect Gemini API Key';
      }
    }

    if (connectBanner) {
      connectBanner.style.display = isConn ? 'none' : 'block';
    }
  },

  /**
   * Initialize Initial Assistant Greeting
   */
  initInitialGreeting() {
    const container = document.getElementById('assistant-messages-container');
    if (!container || container.children.length > 0) return;

    const isConn = typeof GeminiClient !== 'undefined' && GeminiClient.isConnected();
    let greetingText = '';

    if (isConn) {
      greetingText = `👋 <strong>Hello! I am your Gemini AI Copilot.</strong><br>I am connected live and ready to help you code, architect workflows, write prompts, analyze algorithms, or answer any technical questions. What are we building today?`;
    } else {
      greetingText = `👋 <strong>Hello! I am your AI Copilot.</strong><br>Connect your free Gemini API key below to start direct, live real-time conversations! You can also ask for AI tool recommendations and workflow blueprints.`;
    }

    this.appendMessage('assistant', greetingText);
  },

  /**
   * Inline Gemini API Key Connection in Chat Drawer
   */
  initDrawerConnect() {
    const keyInput = document.getElementById('input-drawer-gemini-key');
    const connectBtn = document.getElementById('btn-drawer-connect-gemini');

    if (connectBtn && keyInput) {
      const handleConnect = async () => {
        const key = keyInput.value.trim();
        if (!key) {
          if (typeof UI !== 'undefined') UI.showToast('Please paste your Gemini API Key', 'error');
          return;
        }

        connectBtn.disabled = true;
        connectBtn.textContent = 'Verifying...';

        try {
          const testResult = await GeminiClient.testConnection(key, 'gemini-2.0-flash');
          if (testResult.success) {
            await GeminiClient.saveConfig({
              apiKey: key,
              model: testResult.model || 'gemini-2.0-flash',
              persona: 'expert_architect'
            });

            this.updateDrawerStatus();
            keyInput.value = '';
            if (typeof UI !== 'undefined') {
              UI.showToast('✨ Gemini Connected Live! Ready to chat.', 'success');
            }

            this.appendMessage('assistant', `⚡ <strong>Google Gemini successfully connected!</strong> Live communication is active. Ask me anything.`);
          } else {
            if (typeof UI !== 'undefined') {
              UI.showToast(`Connection failed: ${testResult.error || 'Invalid API Key'}`, 'error');
            }
          }
        } catch (err) {
          if (typeof UI !== 'undefined') {
            UI.showToast(`Error connecting Gemini: ${err.message}`, 'error');
          }
        } finally {
          connectBtn.disabled = false;
          connectBtn.textContent = 'Connect ⚡';
        }
      };

      connectBtn.addEventListener('click', handleConnect);
      keyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConnect();
        }
      });
    }
  },

  /**
   * Suggested Quick Prompts Chips inside Drawer
   */
  initQuickPrompts() {
    document.querySelectorAll('.drawer-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        const input = document.getElementById('assistant-chat-input');
        if (input && prompt) {
          input.value = prompt;
          input.focus();
        }
      });
    });

    const clearBtn = document.getElementById('btn-drawer-clear-chat');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.chatHistory = [];
        const container = document.getElementById('assistant-messages-container');
        if (container) {
          container.innerHTML = '';
          this.initInitialGreeting();
        }
        if (typeof UI !== 'undefined') UI.showToast('Chat history cleared', 'info');
      });
    }
  },

  /**
   * Initialize Assistant Side Drawer Chat
   */
  initDrawerChat() {
    const input = document.getElementById('assistant-chat-input');
    const sendBtn = document.getElementById('assistant-chat-send');

    if (sendBtn && input) {
      const handleSend = async () => {
        const text = input.value.trim();
        if (!text) return;

        // Add User message bubble
        this.appendMessage('user', this.escapeHtml(text));
        this.chatHistory.push({ role: 'user', content: text });
        if (this.chatHistory.length > 50) {
          this.chatHistory = this.chatHistory.slice(-50);
        }
        input.value = '';

        // Generate response via Live Gemini or graceful fallback
        await this.handleAssistantResponse(text);
      };

      sendBtn.addEventListener('click', handleSend);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }
  },

  /**
   * Append message bubble to Assistant drawer
   * @param {string} sender ('user'|'assistant')
   * @param {string} htmlContent
   * @returns {HTMLElement}
   */
  appendMessage(sender, htmlContent) {
    const container = document.getElementById('assistant-messages-container');
    if (!container) return null;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = htmlContent;
    container.appendChild(bubble);
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
    return bubble;
  },

  /**
   * Handle assistant response generation (Direct Live Gemini or Fallback)
   * @param {string} userText
   */
  async handleAssistantResponse(userText) {
    // Check if Gemini API is connected
    if (typeof GeminiClient !== 'undefined' && GeminiClient.isConnected()) {
      // Append temporary "thinking" indicator
      const thinkingBubble = this.appendMessage('assistant', `
        <div class="thinking-bubble">
          <span>Gemini is thinking</span>
          <div class="thinking-dots">
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
          </div>
        </div>
      `);

      try {
        const aiResponse = await GeminiClient.generateChat(this.chatHistory);
        this.chatHistory.push({ role: 'model', content: aiResponse });
        if (this.chatHistory.length > 50) {
          this.chatHistory = this.chatHistory.slice(-50);
        }

        // Format Markdown with code blocks and replace thinking indicator
        if (thinkingBubble) {
          thinkingBubble.innerHTML = GeminiClient.formatMarkdown(aiResponse);
        }
      } catch (err) {
        console.error('Gemini Assistant Error:', err);
        if (thinkingBubble) {
          thinkingBubble.innerHTML = `⚠️ <strong>Gemini Error:</strong> ${err.message}<br><br><small>Please check your Gemini API key in the connection banner above.</small>`;
        }
      }
    } else {
      // Offline Rule-based fallback
      setTimeout(() => {
        this.generateOfflineReply(userText);
      }, 350);
    }
  },

  /**
   * Intelligent client-side assistant logic (Fallback when Gemini is not connected)
   * @param {string} userQuery
   */
  generateOfflineReply(userQuery) {
    const query = userQuery.toLowerCase();
    let reply = '';

    if (query.includes('ml') || query.includes('model') || query.includes('machine learning')) {
      reply = `<strong>🤖 ML Stack Recommendation:</strong><br>
      • <strong>Perplexity</strong> for paper research.<br>
      • <strong>Cursor</strong> for PyTorch coding.<br>
      • <strong>Google Colab / Kaggle</strong> for cloud GPU execution.<br>
      <br>Would you like to open the <em>Machine Learning & Data Stack</em>?`;
    } else if (query.includes('react') || query.includes('ui') || query.includes('frontend') || query.includes('website')) {
      reply = `<strong>⚡ Web Dev Stack:</strong><br>
      • <strong>v0 by Vercel</strong> to generate UI components.<br>
      • <strong>Cursor</strong> to assemble the repository.<br>
      • <strong>Bolt.new</strong> for instant deployment.`;
    } else if (query.includes('image') || query.includes('logo') || query.includes('art')) {
      reply = `<strong>🎨 Creative Stack:</strong><br>
      • <strong>Midjourney</strong> for photorealistic visuals.<br>
      • <strong>Recraft</strong> for SVGs & Vector brand art.<br>
      • <strong>Canva Magic Studio</strong> for layouts.`;
    } else if (query.includes('prompt') || query.includes('improve')) {
      reply = `<strong>💡 Prompt Engineering Tip:</strong><br>
      Give your model a strict persona, clear objective, format constraint, and step-by-step reasoning cue.<br>
      <em>Check out the Universal Prompt Library in the sidebar for master templates!</em>`;
    } else {
      reply = `I can help you architect workflows, find optimal AI tools, or craft prompts.
      <br>• <em>"Best tools to build an AI SaaS"</em>
      <br>• <em>"How to analyze a large CSV dataset"</em>
      <br>• <em>"Generate photorealistic prompt"</em>`;
    }

    reply += `<br><br><div style="font-size: 11px; padding: 8px 12px; background: rgba(99, 102, 241, 0.12); border-radius: 8px; border: 1px dashed rgba(99, 102, 241, 0.35);">
      ⚡ <em>Paste your free Gemini API key in the top banner to enable direct, live conversational AI chat!</em>
    </div>`;

    this.appendMessage('assistant', reply);
  },

  /**
   * Initialize Multi-AI Prompt Launcher Panel
   */
  initMultiAI() {
    const textarea = document.getElementById('multi-ai-prompt-input');
    const launchBtn = document.getElementById('multi-ai-launch-btn');
    const copyBtn = document.getElementById('multi-ai-copy-btn');
    const checkboxes = document.querySelectorAll('.multi-ai-checkbox');

    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const val = cb.value;
        if (cb.checked) {
          if (!this.selectedAIs.includes(val)) this.selectedAIs.push(val);
        } else {
          this.selectedAIs = this.selectedAIs.filter(x => x !== val);
        }
        
        const parentLabel = cb.closest('.ai-checkbox-label');
        if (parentLabel) {
          parentLabel.classList.toggle('selected', cb.checked);
        }
      });
    });

    if (launchBtn && textarea) {
      launchBtn.addEventListener('click', () => {
        const prompt = textarea.value.trim();
        if (!prompt) {
          if (typeof UI !== 'undefined') UI.showToast('Please type a prompt to broadcast across AI models', 'warning');
          return;
        }

        if (this.selectedAIs.length === 0) {
          if (typeof UI !== 'undefined') UI.showToast('Select at least one AI service', 'warning');
          return;
        }

        navigator.clipboard.writeText(prompt);

        this.selectedAIs.forEach(toolId => {
          ToolsManager.launchTool(toolId);
        });

        if (typeof UI !== 'undefined') UI.showToast(`Prompt copied to clipboard & launched ${this.selectedAIs.length} AI services in tabs!`, 'success');
      });
    }

    if (copyBtn && textarea) {
      copyBtn.addEventListener('click', () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        if (typeof UI !== 'undefined') UI.showToast('Prompt copied to clipboard!', 'success');
      });
    }
  },

  /**
   * Escape HTML utility
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
