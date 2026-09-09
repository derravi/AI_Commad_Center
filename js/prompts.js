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
      const safeTitle = this.escapeHtml(prompt.title);
      const safeCategory = this.escapeHtml(prompt.category || 'general');
      const safeId = this.escapeHtml(prompt.id);
      const tagsHtml = (prompt.tags || []).map(t => `<span class="tool-tag">${this.escapeHtml(t.replace(/^#/, ''))}</span>`).join('');
      return `
        <div class="prompt-card" draggable="true" data-id="${safeId}">
          <div class="prompt-card-header">
            <span class="prompt-title">${safeTitle}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span class="badge badge-accent">${safeCategory}</span>
              <button class="tool-action-btn" data-action="enhance-prompt" data-id="${safeId}" title="Enhance prompt with Gemini AI">
                ✨
              </button>
              <button class="tool-action-btn" data-action="edit-prompt" data-id="${safeId}" title="Edit Prompt">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="tool-action-btn" data-action="delete-prompt" data-id="${safeId}" title="Delete Prompt">
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
            <button class="btn-primary" style="padding: 6px 14px; font-size: 12px;" data-action="copy-prompt" data-id="${safeId}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Prompt
            </button>
            
            <div class="prompt-launch-dropdown">
              <span class="prompt-ai-chip" data-action="launch-ai" data-id="${safeId}" data-ai="chatgpt" title="Open ChatGPT">GPT</span>
              <span class="prompt-ai-chip" data-action="launch-ai" data-id="${safeId}" data-ai="claude" title="Open Claude">Claude</span>
              <span class="prompt-ai-chip" data-action="launch-ai" data-id="${safeId}" data-ai="gemini" title="Open Gemini">Gemini</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to prevent CSP inline event handler violations
    container.querySelectorAll('[data-action="enhance-prompt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.enhancePromptWithAI(id);
      });
    });

    container.querySelectorAll('[data-action="edit-prompt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.openEditModal(id);
      });
    });

    container.querySelectorAll('[data-action="delete-prompt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.deletePrompt(id);
      });
    });

    container.querySelectorAll('[data-action="copy-prompt"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) this.copyPrompt(id);
      });
    });

    container.querySelectorAll('[data-action="launch-ai"]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = chip.getAttribute('data-id');
        const ai = chip.getAttribute('data-ai');
        if (id && ai) this.launchWithAI(id, ai);
      });
    });

    // Drag-to-Reorder mechanics
    this.initDragAndDrop(container);
  },

  /**
   * HTML5 Drag-and-Drop Reordering for Prompts
   */
  initDragAndDrop(container) {
    let draggedId = null;

    container.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.getAttribute('data-id');
        card.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        container.querySelectorAll('.prompt-card').forEach(c => c.classList.remove('drag-over-target'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over-target');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-target');
      });

      card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over-target');
        const targetId = card.getAttribute('data-id');

        if (!draggedId || draggedId === targetId) return;

        const fromIdx = this.promptsList.findIndex(p => p.id === draggedId);
        const toIdx = this.promptsList.findIndex(p => p.id === targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [movedPrompt] = this.promptsList.splice(fromIdx, 1);
          this.promptsList.splice(toIdx, 0, movedPrompt);

          await StorageManager.set({ prompts: this.promptsList });
          this.renderPrompts();
        }
      });
    });
  },

  /**
   * Open Edit Modal for a Prompt
   * @param {string} promptId
   */
  openEditModal(promptId) {
    const prompt = this.promptsList.find(p => p.id === promptId);
    if (!prompt) return;

    const modal = document.getElementById('modal-add-prompt');
    const form = document.getElementById('form-add-prompt');
    if (!modal || !form) return;

    const titleEl = modal.querySelector('.modal-header h3');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (titleEl) titleEl.textContent = 'Edit Prompt Template';
    if (submitBtn) submitBtn.textContent = 'Update Prompt';

    form.dataset.editId = prompt.id;
    const titleInp = document.getElementById('input-prompt-title');
    const catInp = document.getElementById('select-prompt-category');
    const contentInp = document.getElementById('input-prompt-content');
    const tagsInp = document.getElementById('input-prompt-tags');

    if (titleInp) titleInp.value = prompt.title || '';
    if (catInp) catInp.value = prompt.category || 'general';
    if (contentInp) contentInp.value = prompt.content || '';
    if (tagsInp) tagsInp.value = (prompt.tags || []).join(', ');

    UI.openModal('modal-add-prompt');
  },

  /**
   * Update existing prompt
   * @param {string} promptId
   * @param {object} promptData
   */
  async updatePrompt(promptId, promptData) {
    const index = this.promptsList.findIndex(p => p.id === promptId);
    if (index === -1) {
      UI.showToast('Prompt not found', 'error');
      return false;
    }

    if (!promptData.title || !promptData.content) {
      UI.showToast('Please provide both Title and Prompt Content', 'error');
      return false;
    }

    this.promptsList[index] = {
      ...this.promptsList[index],
      title: promptData.title.trim().slice(0, 100),
      category: promptData.category || 'general',
      content: promptData.content.trim().slice(0, 10000),
      tags: promptData.tags ? promptData.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase().slice(0, 30)).filter(Boolean).slice(0, 10) : []
    };

    await StorageManager.set({ prompts: this.promptsList });
    this.renderPrompts();
    UI.showToast(`Updated prompt "${this.promptsList[index].title}"!`, 'success');
    return true;
  },
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.copyPrompt(id);
      });
    });

    container.querySelectorAll('[data-action="launch-ai"]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = chip.getAttribute('data-id');
        const ai = chip.getAttribute('data-ai');
        if (id && ai) this.launchWithAI(id, ai);
      });
    });
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
      title: promptData.title.trim().slice(0, 100),
      category: promptData.category || 'general',
      content: promptData.content.trim().slice(0, 10000),
      tags: promptData.tags ? promptData.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase().slice(0, 30)).filter(Boolean).slice(0, 10) : []
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
    const prompt = this.promptsList.find(p => p.id === promptId);
    const promptTitle = prompt ? prompt.title : 'this prompt template';

    const ok = await UI.confirm({
      title: 'Delete Prompt',
      message: `Are you sure you want to delete "${promptTitle}"?`,
      confirmText: 'Delete Prompt',
      danger: true
    });

    if (ok) {
      this.promptsList = this.promptsList.filter(p => p.id !== promptId);
      await StorageManager.set({ prompts: this.promptsList });
      this.renderPrompts();
      UI.showToast('Prompt removed', 'info');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
