/**
 * AI Command Center - UI & State Controller
 * Manages view routing, themes, live clock, modals, and toast notifications.
 */
const UI = {
  currentView: 'dashboard',

  /**
   * Initialize UI components
   */
  async init() {
    this.initClock();
    this.initNavigation();
    this.initThemeAndSettings();
    this.initModals();
    this.initAssistantDrawer();
    this.initApiHub();
    this.initGlobalDelegation();
  },

  /**
   * Initialize Global Event Delegation (e.g. Markdown copy buttons)
   */
  initGlobalDelegation() {
    document.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.chat-copy-code-btn, [data-action="copy-code"]');
      if (copyBtn) {
        const codeBlock = copyBtn.closest('.chat-code-block');
        const codeEl = codeBlock ? codeBlock.querySelector('code') : null;
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent);
          this.showToast('Code copied to clipboard!', 'success');
        }
      }
    });
  },

  /**
   * Start live ticking clock
   */
  initClock() {
    const timeEl = document.getElementById('header-clock-time');
    const dateEl = document.getElementById('header-clock-date');

    const updateTime = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  /**
   * Initialize sidebar navigation & view switching
   */
  initNavigation() {
    const navItems = document.querySelectorAll('.nav-item button');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewTarget = btn.getAttribute('data-view');
        if (viewTarget) {
          this.switchView(viewTarget);
        }
      });
    });
  },

  /**
   * Switch active content view
   * @param {string} viewName
   */
  switchView(viewName) {
    this.currentView = viewName;

    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(item => {
      const btn = item.querySelector('button');
      if (btn && btn.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update view containers
    document.querySelectorAll('.view-content').forEach(view => {
      if (view.id === `view-${viewName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Trigger sub-module updates if needed
    if (viewName === 'stacks') WorkflowManager.renderStacks();
    if (viewName === 'workspaces') WorkspaceManager.renderWorkspaces();
    if (viewName === 'prompts') PromptLibrary.renderPrompts();
    if (viewName === 'apihub' && typeof GeminiClient !== 'undefined') GeminiClient.updateUIStatus();
  },

  /**
   * Initialize Theme, Accent colors, and Settings
   */
  async initThemeAndSettings() {
    const data = await StorageManager.get('settings');
    const settings = data.settings || {};

    // Apply Theme
    const currentTheme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Apply Accent color
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-primary', settings.accentColor);
    }

    // Bind Theme select in settings
    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) {
      themeSelect.value = currentTheme;
      themeSelect.addEventListener('change', async (e) => {
        const newTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', newTheme);
        settings.theme = newTheme;
        await StorageManager.set({ settings });
        this.showToast(`Theme updated to ${newTheme.toUpperCase()}`, 'info');
      });
    }

    // Theme palette swatches
    document.querySelectorAll('.theme-swatch').forEach(swatch => {
      swatch.addEventListener('click', async () => {
        const color = swatch.getAttribute('data-color');
        document.documentElement.style.setProperty('--accent-primary', color);
        settings.accentColor = color;
        await StorageManager.set({ settings });
        
        document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.showToast('Accent color updated', 'info');
      });
    });

    // Backup Export & Import buttons
    const exportBtn = document.getElementById('btn-export-backup');
    const importFile = document.getElementById('input-import-backup');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => StorageManager.exportBackup());
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const success = await StorageManager.importBackup(evt.target.result);
          if (success) {
            this.showToast('Backup restored successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 800);
          } else {
            this.showToast('Invalid backup file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  },

  /**
   * Initialize modal triggers and close buttons
   */
  initModals() {
    // Open Modal buttons
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-open-modal');
        this.openModal(targetId);
      });
    });

    // Close Modal buttons
    document.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAllModals();
        }
      });
    });

    // Escape key closes modals and drawers
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeAssistantDrawer();
      }
    });

    // Form handlers
    this.initFormHandlers();
  },

  /**
   * Bind modal forms
   */
  initFormHandlers() {
    // Add Tool Form
    const addToolForm = document.getElementById('form-add-tool');
    if (addToolForm) {
      addToolForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await ToolsManager.addCustomTool({
          name: document.getElementById('input-tool-name').value,
          url: document.getElementById('input-tool-url').value,
          category: document.getElementById('select-tool-category').value,
          description: document.getElementById('input-tool-description').value,
          tags: document.getElementById('input-tool-tags').value,
          iconBg: document.getElementById('input-tool-icon-bg').value,
          iconText: document.getElementById('input-tool-icon-text').value,
          favorite: document.getElementById('checkbox-tool-favorite').checked
        });
        if (success) {
          addToolForm.reset();
          this.closeAllModals();
        }
      });
    }

    // Add Stack Form
    const addStackForm = document.getElementById('form-add-stack');
    if (addStackForm) {
      addStackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedToolCheckboxes = document.querySelectorAll('#stack-tools-checkboxes input:checked');
        const toolIds = Array.from(selectedToolCheckboxes).map(cb => cb.value);

        const success = await WorkflowManager.createStack({
          name: document.getElementById('input-stack-name').value,
          description: document.getElementById('input-stack-description').value,
          toolIds: toolIds
        });

        if (success) {
          addStackForm.reset();
          this.closeAllModals();
        }
      });
    }

    // Add Prompt Form
    const addPromptForm = document.getElementById('form-add-prompt');
    if (addPromptForm) {
      addPromptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await PromptLibrary.addPrompt({
          title: document.getElementById('input-prompt-title').value,
          category: document.getElementById('select-prompt-category').value,
          content: document.getElementById('input-prompt-content').value,
          tags: document.getElementById('input-prompt-tags').value
        });
        if (success) {
          addPromptForm.reset();
          this.closeAllModals();
        }
      });
    }

    // Add Workspace Form
    const addWorkspaceForm = document.getElementById('form-add-workspace');
    if (addWorkspaceForm) {
      addWorkspaceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedToolCheckboxes = document.querySelectorAll('#ws-tools-checkboxes input:checked');
        const toolIds = Array.from(selectedToolCheckboxes).map(cb => cb.value);

        const success = await WorkspaceManager.createWorkspace({
          name: document.getElementById('input-ws-name').value,
          description: document.getElementById('input-ws-description').value,
          notes: document.getElementById('input-ws-notes').value,
          toolIds: toolIds
        });

        if (success) {
          addWorkspaceForm.reset();
          this.closeAllModals();
        }
      });
    }

    // Add Custom Search Engine Form
    const addEngineForm = document.getElementById('form-add-engine');
    if (addEngineForm) {
      addEngineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await SearchManager.addCustomEngine({
          name: document.getElementById('input-engine-name').value,
          url: document.getElementById('input-engine-url').value,
          icon: document.getElementById('input-engine-icon').value
        });

        if (success) {
          addEngineForm.reset();
          this.closeAllModals();
        }
      });
    }
  },

  /**
   * Open modal by ID
   * @param {string} modalId
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (typeof SearchManager !== 'undefined' && SearchManager.closeDropdown) {
      SearchManager.closeDropdown();
    }

    // Populate dynamic tool selection lists for Stack & Workspace modals
    if (modalId === 'modal-add-stack') {
      const container = document.getElementById('stack-tools-checkboxes');
      if (container) {
        container.innerHTML = ToolsManager.toolsList.map(t => `
          <label class="ai-checkbox-label" style="font-size: 12px; padding: 4px 8px;">
            <input type="checkbox" value="${t.id}">
            <span>${t.name}</span>
          </label>
        `).join('');
      }
    } else if (modalId === 'modal-add-workspace') {
      const container = document.getElementById('ws-tools-checkboxes');
      if (container) {
        container.innerHTML = ToolsManager.toolsList.map(t => `
          <label class="ai-checkbox-label" style="font-size: 12px; padding: 4px 8px;">
            <input type="checkbox" value="${t.id}">
            <span>${t.name}</span>
          </label>
        `).join('');
      }
    }

    modal.classList.add('open');
  },

  /**
   * Close all modals
   */
  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  },

  /**
   * Assistant Side Drawer Toggle
   */
  initAssistantDrawer() {
    const toggleBtn = document.getElementById('btn-toggle-assistant');
    const closeBtn = document.getElementById('btn-close-assistant');
    const drawer = document.getElementById('assistant-drawer');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.toggle('open');
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => {
        this.closeAssistantDrawer();
      });
    }
  },

  closeAssistantDrawer() {
    const drawer = document.getElementById('assistant-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  /**
   * Show Toast Notification
   * @param {string} message
   * @param {string} type ('success'|'info'|'warning'|'error')
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="toast-icon success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="toast-icon error" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="toast-icon warning" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg class="toast-icon info" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  },

  /**
   * Initialize Gemini API Hub View Event Listeners
   */
  initApiHub() {
    const configForm = document.getElementById('form-gemini-config');
    const keyInput = document.getElementById('input-gemini-key');
    const modelSelect = document.getElementById('select-gemini-model');
    const personaSelect = document.getElementById('select-gemini-persona');
    const toggleKeyBtn = document.getElementById('btn-toggle-key-visibility');
    const clearBtn = document.getElementById('btn-clear-gemini');
    const testResultAlert = document.getElementById('hub-test-result-alert');

    // Playground elements
    const playgroundInput = document.getElementById('input-playground-query');
    const playgroundBtn = document.getElementById('btn-run-playground');
    const playgroundOutput = document.getElementById('playground-output-container');
    const samplePills = document.querySelectorAll('[data-playground-prompt]');

    // Toggle API Key visibility
    if (toggleKeyBtn && keyInput) {
      toggleKeyBtn.addEventListener('click', () => {
        const isPass = keyInput.type === 'password';
        keyInput.type = isPass ? 'text' : 'password';
        toggleKeyBtn.textContent = isPass ? '🙈' : '👁️';
      });
    }

    // Auto-detect models supported by API Key
    const fetchModelsBtn = document.getElementById('btn-fetch-models');
    if (fetchModelsBtn && keyInput && modelSelect) {
      fetchModelsBtn.addEventListener('click', async () => {
        const apiKey = (keyInput.value || GeminiClient.apiKey || '').trim();
        if (!apiKey) {
          this.showToast('Please paste your Gemini API Key first to detect models', 'warning');
          return;
        }

        fetchModelsBtn.disabled = true;
        fetchModelsBtn.innerHTML = '🔄 Detecting...';

        try {
          const models = await GeminiClient.fetchAvailableModels(apiKey);
          if (models && models.length > 0) {
            const currentVal = modelSelect.value;
            modelSelect.innerHTML = '';
            models.forEach(m => {
              const opt = document.createElement('option');
              opt.value = m.id;
              const isRecommended = m.id === 'gemini-2.0-flash';
              opt.textContent = `${m.name}${isRecommended ? ' (Recommended)' : ''}`;
              modelSelect.appendChild(opt);
            });

            if (models.some(m => m.id === currentVal)) {
              modelSelect.value = currentVal;
            } else if (models.some(m => m.id === 'gemini-2.0-flash')) {
              modelSelect.value = 'gemini-2.0-flash';
            }

            this.showToast(`Found ${models.length} supported Gemini models for your API key!`, 'success');
          } else {
            this.showToast('Could not retrieve model list. Please check your API key.', 'warning');
          }
        } catch (e) {
          this.showToast('Failed to auto-detect models.', 'error');
        } finally {
          fetchModelsBtn.disabled = false;
          fetchModelsBtn.innerHTML = '🔄 Auto-Detect';
        }
      });
    }

    // Save & Test Gemini Configuration Form
    if (configForm) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = (keyInput ? keyInput.value : '').trim();
        const model = modelSelect ? modelSelect.value : 'gemini-2.0-flash';
        const persona = personaSelect ? personaSelect.value : 'expert_architect';

        if (!apiKey) {
          this.showToast('Please paste your Google Gemini API Key', 'warning');
          return;
        }

        const submitBtn = document.getElementById('btn-test-save-gemini');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Test & Save';
        if (submitBtn) {
          submitBtn.innerHTML = '⚡ Testing Connection...';
          submitBtn.disabled = true;
        }

        if (testResultAlert) {
          testResultAlert.style.display = 'block';
          testResultAlert.style.background = 'rgba(99, 102, 241, 0.15)';
          testResultAlert.style.border = '1px solid var(--border-glow)';
          testResultAlert.style.color = 'var(--text-main)';
          testResultAlert.innerHTML = `Testing connection to <strong>${model}</strong>...`;
        }

        const result = await GeminiClient.testConnection(apiKey, model);

        if (result.success) {
          const effectiveModel = result.model || model;
          if (modelSelect && modelSelect.value !== effectiveModel) {
            modelSelect.value = effectiveModel;
          }

          await GeminiClient.saveConfig({ apiKey, model: effectiveModel, persona });
          if (testResultAlert) {
            testResultAlert.style.background = 'rgba(16, 185, 129, 0.15)';
            testResultAlert.style.border = '1px solid rgba(16, 185, 129, 0.35)';
            testResultAlert.style.color = '#10b981';

            let noticeHtml = '';
            if (result.fallbackNotice) {
              noticeHtml = `<div style="margin-top: 6px; font-size: 11.5px; color: #fbbf24;">⚠️ ${result.fallbackNotice}</div>`;
            }

            testResultAlert.innerHTML = `
              ✅ <strong>Connection Verified!</strong> Latency: <strong>${result.latency}ms</strong>. Model: <strong>${effectiveModel}</strong>. Real AI features are now active across your dashboard!
              ${noticeHtml}
            `;
          }
          this.showToast(`Gemini connected successfully! (Latency: ${result.latency}ms)`, 'success');
        } else {
          if (testResultAlert) {
            testResultAlert.style.background = 'rgba(244, 63, 94, 0.15)';
            testResultAlert.style.border = '1px solid rgba(244, 63, 94, 0.35)';
            testResultAlert.style.color = '#f43f5e';
            testResultAlert.innerHTML = `
              ❌ <strong>Connection Failed:</strong> ${result.error}
              <div style="margin-top: 6px; font-size: 11.5px; color: var(--text-dim);">
                💡 Tip: Try selecting <strong>Gemini 2.0 Flash</strong> or click <strong>Auto-Detect</strong> above to discover valid models for your key.
              </div>
            `;
          }
          this.showToast('Failed to connect. Check API key and model selection.', 'error');
        }

        if (submitBtn) {
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.disabled = false;
        }
      });
    }

    // Disconnect Button
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        await GeminiClient.clearConfig();
        if (keyInput) keyInput.value = '';
        if (testResultAlert) {
          testResultAlert.style.display = 'block';
          testResultAlert.style.background = 'rgba(148, 163, 184, 0.1)';
          testResultAlert.style.border = '1px solid var(--border-subtle)';
          testResultAlert.style.color = 'var(--text-muted)';
          testResultAlert.textContent = 'API Key cleared. Reverted to offline rule-based mode.';
        }
        this.showToast('Gemini API Key removed', 'info');
      });
    }

    // Playground quick sample tags
    samplePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const sampleQuery = pill.getAttribute('data-playground-prompt');
        if (playgroundInput && sampleQuery) {
          playgroundInput.value = sampleQuery;
        }
      });
    });

    // Run Playground Test Query
    if (playgroundBtn && playgroundInput && playgroundOutput) {
      playgroundBtn.addEventListener('click', async () => {
        const query = playgroundInput.value.trim();
        if (!query) {
          this.showToast('Please type a test prompt', 'warning');
          return;
        }

        if (!GeminiClient.isConnected()) {
          this.showToast('Please connect your Gemini API Key first above', 'warning');
          return;
        }

        playgroundOutput.classList.add('visible');
        playgroundOutput.innerHTML = `
          <div class="thinking-bubble">
            <span>Gemini is generating response</span>
            <div class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </div>
          </div>
        `;

        const prevBtnHtml = playgroundBtn.innerHTML;
        playgroundBtn.innerHTML = 'Running...';
        playgroundBtn.disabled = true;

        try {
          const reply = await GeminiClient.generateText(query);
          playgroundOutput.innerHTML = GeminiClient.formatMarkdown(reply);
          this.showToast('Gemini response generated!', 'success');
        } catch (err) {
          playgroundOutput.innerHTML = `<span style="color: #f43f5e;">⚠️ Error: ${err.message}</span>`;
          this.showToast(`Generation failed: ${err.message}`, 'error');
        } finally {
          playgroundBtn.innerHTML = prevBtnHtml;
          playgroundBtn.disabled = false;
        }
      });
    }
  }
};
