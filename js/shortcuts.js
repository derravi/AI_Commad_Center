/**
 * AI Command Center - Dynamic Keyboard Shortcuts Manager
 * Handles shortcut registration, key recording, dynamic dispatching, and settings management.
 */

const DEFAULT_SHORTCUTS = [
  { id: 'sc-chatgpt', name: 'Launch ChatGPT', type: 'tool', target: 'chatgpt', keyCombo: 'Alt+C', enabled: true },
  { id: 'sc-claude', name: 'Launch Claude', type: 'tool', target: 'claude', keyCombo: 'Ctrl+C+D', enabled: true },
  { id: 'sc-gemini', name: 'Launch Google Gemini', type: 'tool', target: 'gemini', keyCombo: 'Alt+G', enabled: true },
  { id: 'sc-perplexity', name: 'Launch Perplexity AI', type: 'tool', target: 'perplexity', keyCombo: 'Alt+P', enabled: true },
  { id: 'sc-assistant', name: 'Toggle AI Assistant Drawer', type: 'action', target: 'toggle_assistant', keyCombo: 'Alt+A', enabled: true },
  { id: 'sc-search', name: 'Focus Universal Search', type: 'action', target: 'focus_search', keyCombo: '/', enabled: true }
];

const SYSTEM_ACTIONS = [
  { id: 'toggle_assistant', name: 'Toggle AI Assistant Drawer', icon: '💬', desc: 'Opens or closes the AI Copilot side drawer' },
  { id: 'focus_search', name: 'Focus Universal Search', icon: '🔍', desc: 'Jumps cursor directly into the search bar' },
  { id: 'open_prompts', name: 'Open Prompt Studio', icon: '✨', desc: 'Switches view to the Prompt Studio' },
  { id: 'open_workflows', name: 'Open Workflow Canvas', icon: '⚡', desc: 'Switches view to Workflow Pipelines' },
  { id: 'open_settings', name: 'Open Settings', icon: '⚙️', desc: 'Switches view to Settings & Preferences' },
  { id: 'open_add_tool', name: 'Add New Custom Tool', icon: '➕', desc: 'Opens the modal to add a new custom AI tool' },
  { id: 'open_add_stack', name: 'Create New AI Stack', icon: '📦', desc: 'Opens the modal to create a workflow stack' }
];

const ShortcutsManager = {
  shortcuts: [],
  isRecording: false,
  recordedKeys: new Set(),
  recordedCombo: '',
  editingShortcutId: null,
  activeKeys: new Set(),
  chordHistory: [],
  chordTimeout: null,

  /**
   * Initialize shortcuts from storage and setup event listeners
   */
  async init() {
    const data = await StorageManager.get(['shortcuts']);
    if (data.shortcuts && Array.isArray(data.shortcuts) && data.shortcuts.length > 0) {
      this.shortcuts = data.shortcuts;
    } else {
      this.shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
      await StorageManager.set({ shortcuts: this.shortcuts });
    }

    this.bindGlobalEvents();
    this.renderSettingsUI();
    this.initModalEvents();
  },

  /**
   * Attach global keydown and keyup listeners for shortcut execution
   */
  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleGlobalKeyUp(e));

    // Also support Chrome commands API if available
    if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.onCommand) {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'open_chatgpt') this.executeAction({ type: 'tool', target: 'chatgpt' });
        if (command === 'open_claude') this.executeAction({ type: 'tool', target: 'claude' });
        if (command === 'open_gemini') this.executeAction({ type: 'tool', target: 'gemini' });
        if (command === 'open_perplexity') this.executeAction({ type: 'tool', target: 'perplexity' });
      });
    }
  },

  /**
   * Handle global keydown event
   */
  handleGlobalKeyDown(e) {
    // If currently recording in modal, delegate to recorder
    if (this.isRecording) {
      this.handleRecordKeyDown(e);
      return;
    }

    // Guard: Do not trigger when user is typing inside an editable field or input
    const isContentEditable = Boolean(document.activeElement && (document.activeElement.isContentEditable || document.activeElement.getAttribute('contenteditable') === 'true'));
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || isContentEditable) {
      return;
    }

    // Normalize pressed key
    const key = e.key;
    
    // Add to active keys
    this.activeKeys.add(key.toLowerCase());

    // Build current combination string from event
    const currentCombo = this.getComboStringFromEvent(e);

    // Update chord history (sequence of keys within 900ms)
    this.updateChordHistory(e, currentCombo);

    // Check if current event matches any active shortcut
    const matched = this.findMatchingShortcut(currentCombo);
    if (matched) {
      e.preventDefault();
      e.stopPropagation();
      this.executeAction(matched);
      this.clearChordHistory();
      return;
    }
  },

  /**
   * Handle global keyup event
   */
  handleGlobalKeyUp(e) {
    if (this.isRecording) {
      this.handleRecordKeyUp(e);
      return;
    }
    this.activeKeys.delete(e.key.toLowerCase());
  },

  /**
   * Track chord sequence history for multi-key shortcuts (e.g. Ctrl+C+D)
   */
  updateChordHistory(e, currentCombo) {
    clearTimeout(this.chordTimeout);
    
    // Extract key token
    const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
    if (!isModifier) {
      this.chordHistory.push(e.key.toUpperCase());
    }

    // Check if chord history + modifiers matches a multi-key combo (e.g., Ctrl + C + D)
    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    if (modifiers.length > 0 && this.chordHistory.length >= 2) {
      const chordCombo = [...modifiers, ...this.chordHistory].join('+');
      const matchedChord = this.findMatchingShortcut(chordCombo);
      if (matchedChord) {
        e.preventDefault();
        e.stopPropagation();
        this.executeAction(matchedChord);
        this.clearChordHistory();
        return;
      }
    }

    // Set timeout to clear chord buffer after 900ms of inactivity
    this.chordTimeout = setTimeout(() => {
      this.clearChordHistory();
    }, 900);
  },

  clearChordHistory() {
    this.chordHistory = [];
    clearTimeout(this.chordTimeout);
  },

  /**
   * Convert a KeyboardEvent to a normalized string combo like 'Ctrl+Shift+D' or 'Alt+C' or '/'
   */
  getComboStringFromEvent(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey && parts.length > 0) parts.push('Shift');

    let mainKey = e.key;
    if (mainKey === ' ') mainKey = 'Space';
    else if (mainKey && mainKey.length === 1) mainKey = mainKey.toUpperCase();

    // If mainKey is just a modifier name, return modifiers only
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return parts.join('+');
    }

    if (!parts.includes(mainKey)) {
      parts.push(mainKey);
    }

    return parts.join('+');
  },

  /**
   * Find an enabled shortcut matching a combination string
   */
  findMatchingShortcut(comboString) {
    if (!comboString) return null;
    const normalizedQuery = this.normalizeComboString(comboString);
    return this.shortcuts.find(s => s.enabled && this.normalizeComboString(s.keyCombo) === normalizedQuery);
  },

  /**
   * Standardize combo strings for robust comparison
   */
  normalizeComboString(str) {
    if (!str) return '';
    return str
      .split('+')
      .map(k => k.trim().toUpperCase())
      .map(k => (k === 'CONTROL' || k === 'CMD' || k === 'COMMAND') ? 'CTRL' : k)
      .sort((a, b) => {
        const order = { 'CTRL': 1, 'ALT': 2, 'SHIFT': 3, 'META': 4 };
        const oA = order[a] || 10;
        const oB = order[b] || 10;
        return oA - oB;
      })
      .join('+');
  },

  /**
   * Execute a shortcut action
   */
  async executeAction(shortcut) {
    if (!shortcut) return;

    if (shortcut.type === 'tool') {
      if (typeof ToolsManager !== 'undefined') {
        ToolsManager.launchTool(shortcut.target);
        if (typeof UI !== 'undefined' && UI.showToast) {
          const tool = (ToolsManager.toolsList || []).find(t => t.id === shortcut.target);
          const name = tool ? tool.name : shortcut.target;
          UI.showToast(`🚀 Launched ${name} (${shortcut.keyCombo || ''})`, 'success');
        }
      }
    } else if (shortcut.type === 'action') {
      switch (shortcut.target) {
        case 'toggle_assistant': {
          const drawer = document.getElementById('assistant-drawer');
          if (drawer) {
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
              const input = document.getElementById('assistant-input');
              if (input) setTimeout(() => input.focus(), 150);
            }
          }
          break;
        }
        case 'focus_search': {
          const searchInput = document.getElementById('global-search-input') || document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;
        }
        case 'open_prompts': {
          if (typeof UI !== 'undefined') UI.switchView('prompts');
          break;
        }
        case 'open_workflows': {
          if (typeof UI !== 'undefined') UI.switchView('workflows');
          break;
        }
        case 'open_settings': {
          if (typeof UI !== 'undefined') UI.switchView('settings');
          break;
        }
        case 'open_add_tool': {
          const btn = document.getElementById('btn-add-tool');
          if (btn) btn.click();
          break;
        }
        case 'open_add_stack': {
          const btn = document.getElementById('btn-create-stack');
          if (btn) btn.click();
          break;
        }
        default:
          console.warn('Unknown shortcut action target:', shortcut.target);
      }
    }
  },

  /**
   * Render dynamic shortcuts list in Settings tab
   */
  renderSettingsUI() {
    const container = document.getElementById('shortcuts-list-container');
    if (!container) return;

    if (this.shortcuts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">⌨️</div>
          <p style="font-size: 14px; font-weight: 500;">No shortcuts configured yet.</p>
          <p style="font-size: 12px; margin-top: 4px;">Click "+ Add Shortcut" to create a custom hotkey.</p>
        </div>
      `;
      return;
    }

    const html = this.shortcuts.map(sc => {
      const isTool = sc.type === 'tool';
      let icon = isTool ? '🚀' : '⚡';
      let desc = '';

      if (isTool && typeof ToolsManager !== 'undefined' && ToolsManager.toolsList) {
        const tool = ToolsManager.toolsList.find(t => t.id === sc.target);
        if (tool) {
          icon = tool.iconText || 'AI';
          desc = tool.name || sc.name;
        }
      } else {
        const act = SYSTEM_ACTIONS.find(a => a.id === sc.target);
        if (act) {
          icon = act.icon;
          desc = act.name;
        }
      }

      const keysArray = sc.keyCombo.split('+');
      const badgeHtml = keysArray.map(k => `<kbd class="search-shortcut-badge" style="font-weight: 600; font-size: 11px; padding: 3px 8px;">${this.escapeHtml(k.trim())}</kbd>`).join(' <span style="color: var(--text-muted); font-size: 11px;">+</span> ');

      return `
        <div class="shortcut-item-row" data-shortcut-id="${sc.id}">
          <div class="shortcut-item-info">
            <div class="shortcut-item-icon">${icon}</div>
            <div class="shortcut-item-text">
              <span class="shortcut-item-name">${this.escapeHtml(sc.name)}</span>
              <span class="shortcut-item-desc">${this.escapeHtml(desc || sc.type)} • <span class="badge ${isTool ? 'badge-primary' : 'badge-secondary'}" style="font-size: 10px; padding: 2px 6px;">${isTool ? 'AI Tool' : 'System'}</span></span>
            </div>
          </div>
          
          <div class="shortcut-item-keys">
            ${badgeHtml}
          </div>

          <div class="shortcut-item-actions">
            <label class="switch" title="${sc.enabled ? 'Enabled' : 'Disabled'}">
              <input type="checkbox" class="shortcut-toggle-enable" data-id="${sc.id}" ${sc.enabled ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>

            <button type="button" class="btn-icon btn-edit-shortcut" data-id="${sc.id}" title="Edit Shortcut">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            <button type="button" class="btn-icon btn-delete-shortcut" data-id="${sc.id}" title="Delete Shortcut" style="color: var(--color-danger, #ef4444);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Attach row events
    container.querySelectorAll('.shortcut-toggle-enable').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        this.toggleShortcut(id, e.target.checked);
      });
    });

    container.querySelectorAll('.btn-edit-shortcut').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openEditModal(id);
      });
    });

    container.querySelectorAll('.btn-delete-shortcut').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.deleteShortcut(id);
      });
    });
  },

  /**
   * Open the Add Shortcut modal
   */
  openAddModal() {
    this.editingShortcutId = null;
    const title = document.getElementById('shortcut-modal-title');
    const form = document.getElementById('form-shortcut');
    const typeSelect = document.getElementById('shortcut-type-select');
    const nameInput = document.getElementById('shortcut-name-input');
    const conflictBox = document.getElementById('shortcut-conflict-warning');

    if (title) title.textContent = 'Add New Shortcut';
    if (form) form.reset();
    if (conflictBox) conflictBox.style.display = 'none';
    if (typeSelect) typeSelect.value = 'tool';
    if (nameInput) nameInput.value = '';

    this.recordedCombo = '';
    this.renderRecorderDisplay('Click here and press key combination (e.g. Ctrl + C + D or Alt + L)');

    this.populateTargetDropdown('tool');

    if (typeof UI !== 'undefined' && UI.openModal) {
      UI.openModal('modal-shortcut');
    } else {
      const modal = document.getElementById('modal-shortcut');
      if (modal) modal.classList.add('open');
    }
  },

  /**
   * Open the Edit Shortcut modal
   */
  openEditModal(shortcutId) {
    const sc = this.shortcuts.find(s => s.id === shortcutId);
    if (!sc) return;

    this.editingShortcutId = shortcutId;
    const title = document.getElementById('shortcut-modal-title');
    const typeSelect = document.getElementById('shortcut-type-select');
    const nameInput = document.getElementById('shortcut-name-input');
    const conflictBox = document.getElementById('shortcut-conflict-warning');

    if (title) title.textContent = 'Edit Keyboard Shortcut';
    if (conflictBox) conflictBox.style.display = 'none';

    if (typeSelect) typeSelect.value = sc.type;
    this.populateTargetDropdown(sc.type, sc.target);

    if (nameInput) nameInput.value = sc.name;

    this.recordedCombo = sc.keyCombo;
    this.renderRecorderDisplay();

    if (typeof UI !== 'undefined' && UI.openModal) {
      UI.openModal('modal-shortcut');
    } else {
      const modal = document.getElementById('modal-shortcut');
      if (modal) modal.classList.add('open');
    }
  },

  /**
   * Populate target select dropdown dynamically based on action type
   */
  populateTargetDropdown(type, selectedTarget = '') {
    const select = document.getElementById('shortcut-target-select');
    if (!select) return;

    select.innerHTML = '';

    if (type === 'tool') {
      const tools = (typeof ToolsManager !== 'undefined' && ToolsManager.toolsList) ? ToolsManager.toolsList : [];
      tools.forEach(tool => {
        const opt = document.createElement('option');
        opt.value = tool.id;
        opt.textContent = `${tool.name} (${tool.category || 'AI'})`;
        if (tool.id === selectedTarget) opt.selected = true;
        select.appendChild(opt);
      });
    } else {
      SYSTEM_ACTIONS.forEach(act => {
        const opt = document.createElement('option');
        opt.value = act.id;
        opt.textContent = `${act.icon} ${act.name}`;
        if (act.id === selectedTarget) opt.selected = true;
        select.appendChild(opt);
      });
    }

    // Auto-update name input if empty
    select.onchange = () => {
      const nameInput = document.getElementById('shortcut-name-input');
      if (nameInput && (!nameInput.value || this.editingShortcutId === null)) {
        if (type === 'tool') {
          const selectedTool = ((typeof ToolsManager !== 'undefined' && ToolsManager.toolsList) || []).find(t => t.id === select.value);
          if (selectedTool) nameInput.value = `Launch ${selectedTool.name}`;
        } else {
          const selectedAct = SYSTEM_ACTIONS.find(a => a.id === select.value);
          if (selectedAct) nameInput.value = selectedAct.name;
        }
      }
    };
  },

  /**
   * Setup modal event handlers and key recorder
   */
  initModalEvents() {
    const modal = document.getElementById('modal-shortcut');
    const closeBtn = document.getElementById('btn-close-shortcut-modal');
    const cancelBtn = document.getElementById('btn-cancel-shortcut-modal');
    const form = document.getElementById('form-shortcut');
    const typeSelect = document.getElementById('shortcut-type-select');
    const btnAddShortcut = document.getElementById('btn-add-shortcut');
    const btnResetShortcuts = document.getElementById('btn-reset-shortcuts');
    const recorderBox = document.getElementById('shortcut-key-recorder');
    const btnClearRecorder = document.getElementById('btn-clear-recorded-key');

    if (btnAddShortcut) {
      btnAddShortcut.addEventListener('click', () => this.openAddModal());
    }

    if (btnResetShortcuts) {
      btnResetShortcuts.addEventListener('click', () => this.resetDefaults());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.stopRecording();
        if (typeof UI !== 'undefined' && UI.closeAllModals) {
          UI.closeAllModals();
        } else if (modal) {
          modal.classList.remove('open', 'active');
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.stopRecording();
        if (typeof UI !== 'undefined' && UI.closeAllModals) {
          UI.closeAllModals();
        } else if (modal) {
          modal.classList.remove('open', 'active');
        }
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.populateTargetDropdown(e.target.value);
      });
    }

    if (recorderBox) {
      recorderBox.addEventListener('click', () => this.startRecording());
      recorderBox.addEventListener('focus', () => this.startRecording());
    }

    if (btnClearRecorder) {
      btnClearRecorder.addEventListener('click', (e) => {
        e.stopPropagation();
        this.recordedCombo = '';
        this.recordedKeys.clear();
        this.renderRecorderDisplay('Click here and press keys...');
        this.checkConflict();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveModalShortcut();
      });
    }
  },

  /**
   * Start interactive key combination recorder
   */
  startRecording() {
    this.isRecording = true;
    this.recordedKeys = new Set();
    const recorderBox = document.getElementById('shortcut-key-recorder');
    if (recorderBox) {
      recorderBox.classList.add('recording');
      recorderBox.focus();
    }
    const display = document.getElementById('shortcut-recorder-display');
    if (display) {
      display.innerHTML = `<span class="recording-pulse-text">🔴 Listening... Press desired keys (e.g. Ctrl + C + D)</span>`;
    }
  },

  /**
   * Stop key combination recorder
   */
  stopRecording() {
    this.isRecording = false;
    clearTimeout(this._recordStopTimeout);
    const recorderBox = document.getElementById('shortcut-key-recorder');
    if (recorderBox) {
      recorderBox.classList.remove('recording');
    }
    this.renderRecorderDisplay();
  },

  /**
   * Handle keydown during recording
   */
  handleRecordKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();

    // Escape exits recording without changing
    if (e.key === 'Escape') {
      this.stopRecording();
      return;
    }

    const key = e.key;
    const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(key);

    // Track active keys pressed
    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    if (!isModifier) {
      let mainKey = key;
      if (mainKey === ' ') mainKey = 'Space';
      else if (mainKey && mainKey.length === 1) mainKey = mainKey.toUpperCase();

      this.recordedKeys.add(mainKey);
    }

    // Build combination string
    let combo = '';
    if (modifiers.length > 0) {
      const nonModKeys = Array.from(this.recordedKeys).filter(k => !['CTRL', 'ALT', 'SHIFT', 'META'].includes(k.toUpperCase()));
      if (nonModKeys.length > 0) {
        combo = [...modifiers, ...nonModKeys].join('+');
      } else {
        combo = modifiers.join('+');
      }
    } else if (this.recordedKeys.size > 0) {
      combo = Array.from(this.recordedKeys).join('+');
    }

    this.recordedCombo = combo;
    this.renderRecorderDisplay();
    this.checkConflict();

    // Auto-stop recording after non-modifier key pressed
    if (!isModifier) {
      clearTimeout(this._recordStopTimeout);
      this._recordStopTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, 450);
    }
  },

  handleRecordKeyUp(e) {
    // Keep modifier states cleanly
  },

  /**
   * Render recorded key display inside the recorder container
   */
  renderRecorderDisplay(placeholder = '') {
    const display = document.getElementById('shortcut-recorder-display');
    if (!display) return;

    if (!this.recordedCombo) {
      display.innerHTML = `<span style="color: var(--text-muted); font-size: 13px;">${placeholder || 'Click here and press key combination...'}</span>`;
      return;
    }

    const parts = this.recordedCombo.split('+');
    const badgesHtml = parts.map(p => `<kbd class="search-shortcut-badge" style="font-size: 12px; font-weight: 700; padding: 4px 10px;">${this.escapeHtml(p.trim())}</kbd>`).join(' <span style="color: var(--text-muted); font-weight: bold;">+</span> ');
    display.innerHTML = badgesHtml;
  },

  /**
   * Check if recorded combo conflicts with another existing shortcut
   */
  checkConflict() {
    const conflictBox = document.getElementById('shortcut-conflict-warning');
    if (!conflictBox) return;

    if (!this.recordedCombo) {
      conflictBox.style.display = 'none';
      return;
    }

    const normalized = this.normalizeComboString(this.recordedCombo);
    const existing = this.shortcuts.find(s => s.id !== this.editingShortcutId && this.normalizeComboString(s.keyCombo) === normalized);

    if (existing) {
      conflictBox.style.display = 'flex';
      conflictBox.innerHTML = `⚠️ <strong>Conflict Warning:</strong> Key combo <code>${this.escapeHtml(this.recordedCombo)}</code> is already used for "<strong>${this.escapeHtml(existing.name)}</strong>". Saving will overwrite the conflict.`;
    } else {
      conflictBox.style.display = 'none';
    }
  },

  /**
   * Save shortcut from modal form
   */
  async saveModalShortcut() {
    const typeSelect = document.getElementById('shortcut-type-select');
    const targetSelect = document.getElementById('shortcut-target-select');
    const nameInput = document.getElementById('shortcut-name-input');
    const modal = document.getElementById('modal-shortcut');

    if (!this.recordedCombo) {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Please record a key combination for the shortcut.', 'warning');
      }
      this.startRecording();
      return;
    }

    const type = typeSelect ? typeSelect.value : 'tool';
    const target = targetSelect ? targetSelect.value : '';
    let name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      name = type === 'tool' ? `Launch ${target}` : target;
    }

    const normalizedCombo = this.normalizeComboString(this.recordedCombo);

    // Remove any conflicting shortcut with the same key combination
    this.shortcuts = this.shortcuts.filter(s => {
      if (s.id === this.editingShortcutId) return true;
      return this.normalizeComboString(s.keyCombo) !== normalizedCombo;
    });

    if (this.editingShortcutId) {
      // Update existing
      const idx = this.shortcuts.findIndex(s => s.id === this.editingShortcutId);
      if (idx !== -1) {
        this.shortcuts[idx] = {
          ...this.shortcuts[idx],
          name,
          type,
          target,
          keyCombo: this.recordedCombo,
          enabled: true
        };
      }
    } else {
      // Add new
      const newShortcut = {
        id: `sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        type,
        target,
        keyCombo: this.recordedCombo,
        enabled: true
      };
      this.shortcuts.push(newShortcut);
    }

    await this.persist();
    this.renderSettingsUI();

    if (typeof UI !== 'undefined' && UI.closeAllModals) {
      UI.closeAllModals();
    } else if (modal) {
      modal.classList.remove('open', 'active');
    }

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`✅ Shortcut "${name}" saved (${this.recordedCombo})`, 'success');
    }
  },

  /**
   * Toggle enabled state of a shortcut
   */
  async toggleShortcut(id, enabled) {
    const sc = this.shortcuts.find(s => s.id === id);
    if (!sc) return;
    sc.enabled = enabled;
    await this.persist();
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Shortcut "${sc.name}" ${enabled ? 'enabled' : 'disabled'}.`, 'info');
    }
  },

  /**
   * Delete a shortcut
   */
  async deleteShortcut(id) {
    const sc = this.shortcuts.find(s => s.id === id);
    if (!sc) return;

    let confirmed = false;
    if (typeof UI !== 'undefined' && UI.confirm) {
      confirmed = await UI.confirm({
        title: 'Delete Shortcut',
        message: `Are you sure you want to delete shortcut "${sc.name}" (${sc.keyCombo})?`,
        confirmText: 'Delete',
        danger: true
      });
    } else {
      confirmed = confirm(`Are you sure you want to delete shortcut "${sc.name}" (${sc.keyCombo})?`);
    }

    if (!confirmed) return;

    this.shortcuts = this.shortcuts.filter(s => s.id !== id);
    await this.persist();
    this.renderSettingsUI();
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Deleted shortcut "${sc.name}".`, 'info');
    }
  },

  /**
   * Reset all shortcuts to default configuration
   */
  async resetDefaults() {
    let confirmed = false;
    if (typeof UI !== 'undefined' && UI.confirm) {
      confirmed = await UI.confirm({
        title: 'Reset Shortcuts',
        message: 'Reset all keyboard shortcuts back to default presets?',
        confirmText: 'Reset Defaults',
        danger: true
      });
    } else {
      confirmed = confirm('Reset all keyboard shortcuts back to default presets?');
    }

    if (!confirmed) return;

    this.shortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    await this.persist();
    this.renderSettingsUI();
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast('✅ Restored default keyboard shortcuts.', 'success');
    }
  },

  /**
   * Persist shortcuts state to storage
   */
  async persist() {
    await StorageManager.set({ shortcuts: this.shortcuts });
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

// Export to window
window.ShortcutsManager = ShortcutsManager;
