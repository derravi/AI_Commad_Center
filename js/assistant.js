/**
 * AI Command Center - Assistant & Multi-AI Challenge Controller
 * Integrates Google Gemini API for real-time conversational assistance with graceful local fallback.
 */
const AssistantManager = {
  selectedAIs: ['chatgpt', 'claude', 'gemini'],
  chatHistory: [],

  /**
   * Initialize Assistant & Multi-AI Challenge
   */
  init() {
    this.initMultiAI();
    this.initDrawerChat();
  },

  /**
   * Initialize Multi-AI Challenge Panel
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
        
        // Update parent label styling
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
          UI.showToast('Please type a prompt to broadcast across AI models', 'warning');
          return;
        }

        if (this.selectedAIs.length === 0) {
          UI.showToast('Select at least one AI service', 'warning');
          return;
        }

        // Copy to clipboard for easy pasting into opened tabs
        navigator.clipboard.writeText(prompt);

        // Open selected AIs
        this.selectedAIs.forEach(toolId => {
          ToolsManager.launchTool(toolId);
        });

        UI.showToast(`Prompt copied & launched ${this.selectedAIs.length} AI services in tabs!`, 'success');
      });
    }

    if (copyBtn && textarea) {
      copyBtn.addEventListener('click', () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;
        navigator.clipboard.writeText(prompt);
        UI.showToast('Prompt copied to clipboard!', 'success');
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
        
        // Add User message
        this.appendMessage('user', text);
        this.chatHistory.push({ role: 'user', content: text });
        input.value = '';

        // Generate response (Real Gemini if connected, else rule-based fallback)
        await this.handleAssistantResponse(text);
      };

      sendBtn.addEventListener('click', handleSend);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
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
    container.scrollTop = container.scrollHeight;
    return bubble;
  },

  /**
   * Handle assistant response generation (Gemini or Fallback)
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

        // Replace thinking indicator with formatted Markdown HTML
        if (thinkingBubble) {
          thinkingBubble.innerHTML = GeminiClient.formatMarkdown(aiResponse);
        }
      } catch (err) {
        console.error('Gemini Assistant Error:', err);
        if (thinkingBubble) {
          thinkingBubble.innerHTML = `⚠️ <strong>Gemini Error:</strong> ${err.message}<br><br><small>Falling back to offline mode. Please check your API key in the Gemini AI Engine tab.</small>`;
        }
      }
    } else {
      // Offline Rule-based fallback
      setTimeout(() => {
        this.generateOfflineReply(userText);
      }, 400);
    }
  },

  /**
   * Intelligent client-side assistant logic (Fallback when offline)
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
      reply = `I can help you architect workflows, find optimal AI tools, or craft prompts. Try asking:
      <br>• <em>"Best tools to build an AI SaaS"</em>
      <br>• <em>"How to analyze a large CSV dataset"</em>
      <br>• <em>"Generate photorealistic prompt"</em>`;
    }

    reply += `<br><br><div style="font-size: 11px; padding: 6px 10px; background: rgba(99, 102, 241, 0.1); border-radius: 6px; border: 1px dashed rgba(99, 102, 241, 0.3);">
      ⚡ <em>Tip: Connect your free Gemini API Key in the <strong>Gemini AI Engine</strong> tab for real, conversational AI chat!</em>
    </div>`;

    this.appendMessage('assistant', reply);
  }
};
