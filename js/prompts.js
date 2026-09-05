/**
 * AI Command Center - Universal Prompt Library
 * Manage reusable prompt engineering templates with 1-click copy, direct dispatch to LLMs,
 * and real-time Gemini Master Prompt Enhancement.
 */
const PromptLibrary = {
  promptsList: [],
  selectedCategory: 'all',

  /**
   * Initialize Prompt Library
   */
  async init() {
    const data = await StorageManager.get('prompts');
    this.promptsList = data.prompts || [];
    this.renderPrompts();
    this.initCategoryFilters();
    this.initEnhanceModalButton();
  },

  /**
   * Initialize Category Filter Tabs
   */
  initCategoryFilters() {
    const filterBtns = document.querySelectorAll('#prompts-category-filters button');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCategory = btn.getAttribute('data-cat') || 'all';
        this.renderPrompts();
      });
    });
  },

  /**
   * Initialize Enhance with Gemini Button inside Add Prompt modal
   */
  initEnhanceModalButton() {
    const enhanceBtn = document.getElementById('btn-enhance-prompt-gemini');
    const contentTextarea = document.getElementById('input-prompt-content');

    if (enhanceBtn && contentTextarea) {
      enhanceBtn.addEventListener('click', async () => {
        const raw = contentTextarea.value.trim();
        if (!raw) {
          UI.showToast('Please type a rough prompt first to enhance it', 'warning');
          return;
        }

        if (typeof GeminiClient === 'undefined' || !GeminiClient.isConnected()) {
          UI.showToast('Connect your Gemini API Key in the Gemini AI Engine tab to use this feature!', 'warning');
          return;
        }

        const prevText = enhanceBtn.innerHTML;
        enhanceBtn.innerHTML = '✨ Enhancing...';
        enhanceBtn.disabled = true;

        try {
          const enhanced = await GeminiClient.enhancePrompt(raw);
          contentTextarea.value = enhanced;
          UI.showToast('Prompt upgraded to Master Template with Gemini!', 'success');
        } catch (err) {
          UI.showToast(`Enhancement failed: ${err.message}`, 'error');
        } finally {
          enhanceBtn.innerHTML = prevText;
          enhanceBtn.disabled = false;
        }
      });
    }
  },

  /**
   * Render Prompt Cards
   */
  renderPrompts() {
    const container = document.getElementById('prompts-grid-container');
    if (!container) return;

    const filtered = this.selectedCategory === 'all'
      ? this.promptsList
      : this.promptsList.filter(p => p.category === this.selectedCategory);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-dim);">
          <p>No prompts found. Click "Add Prompt" to save your favorite AI prompt template.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(prompt => {
      const tagsHtml = (prompt.tags || []).map(t => `<span class="tool-tag">${t.replace(/^#/, '')}</span>`).join('');
      return `
        <div class="prompt-card" data-id="${prompt.id}">
          <div class="prompt-card-header">
            <span class="prompt-title">${prompt.title}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="badge badge-accent">${prompt.category || 'general'}</span>
              <button class="tool-action-btn" onclick="PromptLibrary.enhancePromptWithAI('${prompt.id}')" title="Enhance prompt with Gemini AI">
                ✨
              </button>
              <button class="tool-action-btn" onclick="PromptLibrary.deletePrompt('${prompt.id}')" title="Delete Prompt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="prompt-text-box">${this.escapeHtml(prompt.content)}</div>
          
          <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
            ${tagsHtml}
          </div>

          <div class="prompt-actions-bar">
            <button class="btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="PromptLibrary.copyPrompt('${prompt.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Prompt
            </button>
            
            <div class="prompt-launch-dropdown">
              <span class="prompt-ai-chip" onclick="PromptLibrary.launchWithAI('${prompt.id}', 'chatgpt')" title="Open ChatGPT">GPT</span>
              <span class="prompt-ai-chip" onclick="PromptLibrary.launchWithAI('${prompt.id}', 'claude')" title="Open Claude">Claude</span>
              <span class="prompt-ai-chip" onclick="PromptLibrary.launchWithAI('${prompt.id}', 'gemini')" title="Open Gemini">Gemini</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Enhance an existing prompt card using Gemini
   * @param {string} promptId
   */
  async enhancePromptWithAI(promptId) {
    const prompt = this.promptsList.find(p => p.id === promptId);
    if (!prompt) return;

    if (typeof GeminiClient === 'undefined' || !GeminiClient.isConnected()) {
      UI.showToast('Connect your Gemini API Key in the Gemini AI Engine tab to enhance prompts!', 'warning');
      return;
    }

    UI.showToast(`Enhancing "${prompt.title}" with Gemini...`, 'info');

    try {
      const enhanced = await GeminiClient.enhancePrompt(prompt.content);
      prompt.content = enhanced;
      await StorageManager.set({ prompts: this.promptsList });
      this.renderPrompts();
      await navigator.clipboard.writeText(enhanced);
      UI.showToast(`Prompt enhanced & copied to clipboard!`, 'success');
    } catch (err) {
      UI.showToast(`Enhancement failed: ${err.message}`, 'error');
    }
  },

  /**
   * Copy prompt content to clipboard
   * @param {string} promptId
   */
  async copyPrompt(promptId) {
    const prompt = this.promptsList.find(p => p.id === promptId);
    if (!prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.content);
      UI.showToast(`Prompt "${prompt.title}" copied to clipboard!`, 'success');
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = prompt.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      UI.showToast(`Prompt "${prompt.title}" copied!`, 'success');
    }
  },

  /**
   * Launch prompt with selected AI service
   * Copies prompt to clipboard then opens the AI tool
   * @param {string} promptId
   * @param {string} aiTarget ('chatgpt'|'claude'|'gemini')
   */
  async launchWithAI(promptId, aiTarget) {
    const prompt = this.promptsList.find(p => p.id === promptId);
    if (!prompt) return;

    await this.copyPrompt(promptId);
    ToolsManager.launchTool(aiTarget);
    UI.showToast(`Copied & opened ${aiTarget.toUpperCase()}! Paste prompt with Ctrl+V`, 'info');
  },

  /**
   * Add a new prompt template
   * @param {object} promptData
   */
  async addPrompt(promptData) {
    if (!promptData.title || !promptData.content) {
      UI.showToast('Please provide both Title and Prompt Content', 'error');
      return false;
    }

    const newPrompt = {
      id: 'custom-p-' + Date.now(),
      title: promptData.title.trim(),
      category: promptData.category || 'general',
      content: promptData.content.trim(),
      tags: promptData.tags ? promptData.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean) : []
    };

    this.promptsList.push(newPrompt);
    await StorageManager.set({ prompts: this.promptsList });
    this.renderPrompts();
    UI.showToast(`Prompt "${newPrompt.title}" saved!`, 'success');
    return true;
  },

  /**
   * Delete prompt
   * @param {string} promptId
   */
  async deletePrompt(promptId) {
    if (confirm('Delete this prompt template?')) {
      this.promptsList = this.promptsList.filter(p => p.id !== promptId);
      await StorageManager.set({ prompts: this.promptsList });
      this.renderPrompts();
      UI.showToast('Prompt removed', 'info');
    }
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
