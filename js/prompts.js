/**
 * AI Command Center - AI Prompt Engineering Studio
 * Manages multi-lingual prompt transformation, real-time Gemini optimization,
 * prompt modes (Master Prompt, Polish, Translate, Shorten, Deep Reasoning, Image, Code),
 * live test run execution, and 1-click model launching.
 */
const PromptLibrary = {
  activeMode: 'enhance',
  activeStudioOutput: '',
  isTransforming: false,
  isTesting: false,

  // Human-readable titles & badges for transformation modes
  modeLabels: {
    enhance: { title: 'Master Template', badge: '🚀 Master Prompt' },
    polish: { title: 'Polished Prompt', badge: '✨ Polished' },
    translate: { title: 'Translated AI Prompt', badge: '🌐 Translated' },
    concise: { title: 'Concise Prompt', badge: '🎯 Ultra Concise' },
    cot: { title: 'Deep Reasoning (CoT)', badge: '🧠 Chain-of-Thought' },
    image: { title: 'Art & Image Prompt', badge: '🎨 Midjourney/DALL-E' },
    code: { title: 'Code Architecture Spec', badge: '💻 Architecture Spec' }
  },

  /**
   * Initialize Prompt Studio
   */
  async init() {
    // Ensure prompt storage is clean
    try {
      const data = await StorageManager.get('prompts');
      if (data.prompts && data.prompts.length > 0) {
        await StorageManager.set({ prompts: [] });
      }
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }

    this.initStudio();
    this.updateStudioEngineStatus();
  },

  /**
   * Update the Studio's Live Engine Status Indicator
   */
  updateStudioEngineStatus() {
    const statusPill = document.getElementById('prompt-studio-engine-pill');
    const statusDot = document.getElementById('prompt-studio-status-dot');
    const statusText = document.getElementById('prompt-studio-status-text');

    if (!statusPill || !statusDot || !statusText) return;

    const isConn = typeof GeminiClient !== 'undefined' && GeminiClient.isConnected();
    if (isConn) {
      statusDot.style.background = 'var(--status-success)';
      statusDot.style.boxShadow = '0 0 8px var(--status-success)';
      const modelName = GeminiClient.models[GeminiClient.model]?.name || 'Gemini 2.0 Flash';
      statusText.textContent = `${modelName} Ready ⚡`;
      statusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      statusPill.style.background = 'rgba(16, 185, 129, 0.12)';
    } else {
      statusDot.style.background = 'var(--text-dim)';
      statusDot.style.boxShadow = 'none';
      statusText.textContent = 'Offline (Connect API Key)';
      statusPill.style.borderColor = 'var(--border-subtle)';
      statusPill.style.background = 'rgba(148, 163, 184, 0.1)';
    }
  },

  /**
   * Initialize the AI Prompt Engineering Studio Playground
   */
  initStudio() {
    const inputArea = document.getElementById('prompt-studio-input');
    const charCounter = document.getElementById('prompt-studio-char-count');
    const clearBtn = document.getElementById('btn-prompt-studio-clear');
    const transformBtn = document.getElementById('btn-run-prompt-transform');
    const modeBtns = document.querySelectorAll('.prompt-mode-pill, .prompt-mode-btn');

    // Input character & word counter
    if (inputArea && charCounter) {
      const updateCounts = () => {
        const text = inputArea.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        charCounter.textContent = `${charCount} chars • ${wordCount} words`;
      };

      inputArea.addEventListener('input', updateCounts);
      updateCounts();

      // Ctrl + Enter shortcut to trigger transformation
      inputArea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.executeTransformation();
        }
      });
    }

    // Clear button
    if (clearBtn && inputArea) {
      clearBtn.addEventListener('click', () => {
        inputArea.value = '';
        inputArea.dispatchEvent(new Event('input'));
        inputArea.focus();
        this.hideStudioOutput();
      });
    }

    // Mode Selector Pills (7 Modes)
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode') || 'enhance';
        this.activeMode = mode;

        const transformBtnText = document.getElementById('btn-transform-text');
        if (transformBtnText) {
          const info = this.modeLabels[mode] || this.modeLabels.enhance;
          transformBtnText.textContent = `⚡ Enhance: ${info.title}`;
        }
      });
    });

    // Run Transformation Button
    if (transformBtn) {
      transformBtn.addEventListener('click', () => {
        this.executeTransformation();
      });
    }

    // Studio Output Actions
    this.initStudioOutputActions();
  },

  /**
   * Bind events for Studio Output actions (Copy, Test Run, Launch)
   */
  initStudioOutputActions() {
    const copyBtn = document.getElementById('btn-studio-copy');
    const testBtn = document.getElementById('btn-studio-test-run');
    const closeTestBtn = document.getElementById('btn-close-test-output');
    const launchChips = document.querySelectorAll('[data-studio-ai]');

    // Copy prompt
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!this.activeStudioOutput) return;
        await this.copyTextToClipboard(this.activeStudioOutput, 'Studio prompt');
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => { copyBtn.innerHTML = orig; }, 1800);
      });
    }

    // Test Run with Gemini in real time
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.executeStudioTestRun();
      });
    }

    // Close test preview
    if (closeTestBtn) {
      closeTestBtn.addEventListener('click', () => {
        const testContainer = document.getElementById('prompt-studio-test-container');
        if (testContainer) testContainer.style.display = 'none';
      });
    }

    // 1-Click Launch Chips
    launchChips.forEach(chip => {
      chip.addEventListener('click', async () => {
        if (!this.activeStudioOutput) {
          UI.showToast('Generate a prompt in the studio first!', 'warning');
          return;
        }
        const targetAi = chip.getAttribute('data-studio-ai');
        await this.copyTextToClipboard(this.activeStudioOutput, 'Studio prompt');
        if (typeof ToolsManager !== 'undefined' && typeof ToolsManager.launchTool === 'function') {
          ToolsManager.launchTool(targetAi);
        }
        UI.showToast(`Copied & opened ${targetAi.toUpperCase()}! Paste with Ctrl+V`, 'info');
      });
    });
  },

  /**
   * Execute Prompt Transformation using Gemini API
   */
  async executeTransformation() {
    const inputArea = document.getElementById('prompt-studio-input');
    const rawText = (inputArea?.value || '').trim();

    if (!rawText) {
      UI.showToast('Please type your prompt or task idea first!', 'warning');
      inputArea?.focus();
      return;
    }

    if (typeof GeminiClient === 'undefined' || !GeminiClient.isConnected()) {
      UI.showToast('Please connect your Google Gemini API key in the Gemini AI Engine tab to use AI Studio!', 'warning');
      UI.switchView('apihub');
      return;
    }

    if (this.isTransforming) return;
    this.isTransforming = true;

    const transformBtn = document.getElementById('btn-run-prompt-transform');
    const spinner = document.getElementById('btn-transform-spinner');
    const btnText = document.getElementById('btn-transform-text');
    const toneSelect = document.getElementById('prompt-studio-tone');
    const tone = toneSelect ? toneSelect.value : 'professional';
    const language = 'english';

    if (transformBtn) transformBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Synthesizing with Gemini ⚡...';

    UI.showToast(`Generating ${this.modeLabels[this.activeMode]?.title || 'Prompt'} with Gemini...`, 'info');

    try {
      const transformed = await GeminiClient.transformPrompt(rawText, this.activeMode, { tone, language });
      this.activeStudioOutput = transformed.trim();
      this.renderStudioOutput(this.activeStudioOutput, this.activeMode);
      UI.showToast('Prompt optimized successfully!', 'success');
    } catch (err) {
      console.error('Transformation error:', err);
      UI.showToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      this.isTransforming = false;
      if (transformBtn) transformBtn.disabled = false;
      if (spinner) spinner.style.display = 'none';
      if (btnText) {
        const info = this.modeLabels[this.activeMode] || this.modeLabels.enhance;
        btnText.textContent = `✨ Generate ${info.title}`;
      }
    }
  },

  /**
   * Render the Transformed Prompt in the Studio Output Box
   */
  renderStudioOutput(outputText, mode) {
    const outputContainer = document.getElementById('prompt-studio-output-container');
    const outputTextarea = document.getElementById('prompt-studio-output-text');
    const outputBadge = document.getElementById('prompt-output-badge');

    if (!outputContainer || !outputTextarea) return;

    const modeInfo = this.modeLabels[mode] || this.modeLabels.enhance;
    if (outputBadge) {
      outputBadge.textContent = modeInfo.badge;
    }

    outputTextarea.value = outputText;
    outputContainer.style.display = 'block';

    // Auto resize textarea height to content
    outputTextarea.style.height = 'auto';
    outputTextarea.style.height = Math.min(Math.max(outputTextarea.scrollHeight + 10, 140), 380) + 'px';

    // Smooth scroll to output
    outputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /**
   * Hide studio output panel
   */
  hideStudioOutput() {
    const outputContainer = document.getElementById('prompt-studio-output-container');
    const testContainer = document.getElementById('prompt-studio-test-container');
    if (outputContainer) outputContainer.style.display = 'none';
    if (testContainer) testContainer.style.display = 'none';
    this.activeStudioOutput = '';
  },

  /**
   * Run the transformed prompt directly against Gemini to test its output
   */
  async executeStudioTestRun() {
    if (!this.activeStudioOutput) return;

    if (typeof GeminiClient === 'undefined' || !GeminiClient.isConnected()) {
      UI.showToast('Connect your Gemini API Key in the Gemini AI Engine tab!', 'warning');
      return;
    }

    if (this.isTesting) return;
    this.isTesting = true;

    const testBtn = document.getElementById('btn-studio-test-run');
    const testContainer = document.getElementById('prompt-studio-test-container');
    const testContent = document.getElementById('prompt-studio-test-content');

    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = '⚡ Running Execution...';
    }

    if (testContainer && testContent) {
      testContainer.style.display = 'block';
      testContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; color: var(--text-muted); padding: 16px;">
          <span class="spinner" style="font-size: 16px;">⚡</span>
          <span>Gemini is executing your generated prompt in real time...</span>
        </div>
      `;
    }

    try {
      const response = await GeminiClient.testPromptExecution(this.activeStudioOutput);
      if (testContent) {
        const formattedHtml = typeof GeminiClient.formatMarkdown === 'function'
          ? GeminiClient.formatMarkdown(response)
          : this.escapeHtml(response);

        testContent.innerHTML = `
          <div class="prompt-test-response-text" style="font-size: 13.5px; line-height: 1.6; color: var(--text-main);">
            ${formattedHtml}
          </div>
        `;
      }
      UI.showToast('Prompt test execution finished!', 'success');
    } catch (err) {
      if (testContent) {
        testContent.innerHTML = `
          <div style="color: var(--status-danger); padding: 12px; font-size: 13px;">
            ⚠️ Test execution failed: ${this.escapeHtml(err.message)}
          </div>
        `;
      }
      UI.showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      this.isTesting = false;
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = '⚡ Test Run with Gemini';
      }
    }
  },

  /**
   * Helper to safely copy any text to clipboard
   */
  async copyTextToClipboard(text, label = 'Content') {
    try {
      await navigator.clipboard.writeText(text);
      UI.showToast(`${label} copied to clipboard!`, 'success');
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      UI.showToast(`${label} copied!`, 'success');
    }
  },

  /**
   * Compatibility stubs
   */
  renderPrompts() {},
  addPrompt() { return false; },
  updatePrompt() { return false; },
  deletePrompt() {},

  /**
   * Escape HTML entities for safe rendering
   */
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
