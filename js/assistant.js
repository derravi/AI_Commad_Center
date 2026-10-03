/**
 * AI Command Center - Assistant & Multi-AI Challenge Controller
 * Integrates Google Gemini API for real-time live conversational AI copilot directly in the chat drawer.
 */
const AssistantManager = {
  selectedAIs: ['chatgpt', 'claude', 'gemini'],
  chatHistory: [],

  /**
   * Initialize Multi-AI Launcher
   */
  init() {
    this.initMultiAI();
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
