/**
 * AI Command Center - Universal Search Manager
 * Handles multi-engine web search queries, custom search engine management,
 * interactive search suggestions dropdown, keyboard navigation, and instant local AI tool filtering.
 */
const SearchManager = {
  activeEngine: 'google',
  selectedSuggestionIdx: -1,
  currentSuggestions: [],

  // Built-in Default Search Engines
  defaultEngines: {
    google: {
      id: 'google',
      name: 'Google',
      url: 'https://www.google.com/search?q=%s',
      icon: '🔍',
      isDefault: true
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://www.perplexity.ai/search?q=%s',
      icon: '🧠',
      isDefault: true
    },
    brave: {
      id: 'brave',
      name: 'Brave',
      url: 'https://search.brave.com/search?q=%s',
      icon: '🦁',
      isDefault: true
    },
    duckduckgo: {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=%s',
      icon: '🦆',
      isDefault: true
    },
    bing: {
      id: 'bing',
      name: 'Bing',
      url: 'https://www.bing.com/search?q=%s',
      icon: '🟦',
      isDefault: true
    }
  },

  // User-defined custom search engines
  customEngines: [],

  /**
   * Initialize Search listeners and engine state
   */
  async init() {
    const searchInput = document.getElementById('main-search-input');
    const searchBtn = document.getElementById('search-action-btn');
    const clearBtn = document.getElementById('search-clear-btn');
    const engineSelector = document.getElementById('search-engine-selector');
    const engineWrapper = document.getElementById('search-engine-wrapper');
    const suggestionsDropdown = document.getElementById('search-suggestions-dropdown');

    // Load custom engines & saved active engine from storage
    const data = await StorageManager.get(['settings', 'customSearchEngines']);
    if (data.customSearchEngines && Array.isArray(data.customSearchEngines)) {
      this.customEngines = data.customSearchEngines;
    }

    if (data.settings && data.settings.searchEngine) {
      const savedEngine = this.getEngineById(data.settings.searchEngine);
      if (savedEngine) {
        this.activeEngine = savedEngine.id;
      }
    }

    this.updateEngineUI();
    this.renderEngineDropdown();

    // Toggle dropdown on search engine button click
    if (engineSelector && engineWrapper) {
      engineSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (engineWrapper && !engineWrapper.contains(e.target)) {
        this.closeDropdown();
      }
      if (suggestionsDropdown && !e.target.closest('.search-container')) {
        this.closeSuggestions();
      }
    });

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        this.handleLiveFilter('');
        this.closeSuggestions();
        searchInput.focus();
      });
    }

    if (searchInput) {
      let filterDebounceTimer = null;

      // Live instant filtering and suggestions rendering
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) {
          clearBtn.classList.toggle('visible', val.length > 0);
        }

        clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
          this.handleLiveFilter(val);
          this.renderSuggestions(val);
        }, 100);
      });

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
          this.renderSuggestions(searchInput.value);
        }
      });

      // Keyboard navigation inside search input
      searchInput.addEventListener('keydown', (e) => {
        const hasSuggestions = this.currentSuggestions.length > 0 && suggestionsDropdown && suggestionsDropdown.classList.contains('visible');

        if (e.key === 'ArrowDown') {
          if (hasSuggestions) {
            e.preventDefault();
            this.selectedSuggestionIdx = (this.selectedSuggestionIdx + 1) % this.currentSuggestions.length;
            this.updateSuggestionHighlight();
          }
        } else if (e.key === 'ArrowUp') {
          if (hasSuggestions) {
            e.preventDefault();
            this.selectedSuggestionIdx = (this.selectedSuggestionIdx - 1 + this.currentSuggestions.length) % this.currentSuggestions.length;
            this.updateSuggestionHighlight();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (hasSuggestions && this.selectedSuggestionIdx >= 0 && this.currentSuggestions[this.selectedSuggestionIdx]) {
            const item = this.currentSuggestions[this.selectedSuggestionIdx];
            this.closeSuggestions();
            item.action();
          } else {
            this.closeSuggestions();
            this.executeWebSearch(searchInput.value);
          }
        } else if (e.key === 'Escape') {
          searchInput.value = '';
          if (clearBtn) clearBtn.classList.remove('visible');
          this.handleLiveFilter('');
          this.closeDropdown();
          this.closeSuggestions();
          searchInput.blur();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput ? searchInput.value : '';
        this.closeSuggestions();
        this.executeWebSearch(query);
      });
    }

    // Global keyboard shortcut '/' to jump to search bar
    window.addEventListener('keydown', (e) => {
      const isEditable = document.activeElement && (document.activeElement.matches('input, textarea, select') || document.activeElement.isContentEditable || document.activeElement.getAttribute('contenteditable') === 'true');
      if (e.key === '/' && document.activeElement !== searchInput && !isEditable) {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  },

  /**
   * Render Search Suggestions dropdown with rich categorized results
   * @param {string} query
   */
  renderSuggestions(query) {
    const container = document.getElementById('search-suggestions-dropdown');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.closeSuggestions();
      return;
    }

    const items = [];
    const engineObj = this.getEngineById(this.activeEngine) || this.defaultEngines.google;

    // Helper for highlight
    const highlightMatch = (text, needle) => {
      if (!text || !needle) return text || '';
      const safeText = UI.escapeHtml(text);
      const safeNeedle = UI.escapeHtml(needle);
      const regex = new RegExp(`(${safeNeedle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return safeText.replace(regex, '<mark>$1</mark>');
    };

    // 1. Matched AI Tools (Ranked with fuzzy relevance)
    if (typeof ToolsManager !== 'undefined' && Array.isArray(ToolsManager.toolsList)) {
      const scoredTools = ToolsManager.toolsList
        .map(t => {
          let score = 0;
          const name = t.name.toLowerCase();
          const desc = (t.description || '').toLowerCase();
          const cat = (t.category || '').toLowerCase();
          const tags = (t.tags || []).map(tag => tag.toLowerCase());

          if (name === q) score += 100;
          else if (name.startsWith(q)) score += 60;
          else if (name.includes(q)) score += 40;

          if (tags.some(tag => tag === q)) score += 30;
          else if (tags.some(tag => tag.includes(q))) score += 20;

          if (cat.includes(q)) score += 15;
          if (desc.includes(q)) score += 10;

          return { tool: t, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.tool);

      scoredTools.forEach(tool => {
        items.push({
          type: 'tool',
          group: 'AI Tools',
          iconHtml: `<div class="suggestion-icon-badge" style="background: ${tool.iconBg || 'var(--accent-primary, #6366f1)'};">${tool.iconText || tool.name.slice(0, 2).toUpperCase()}</div>`,
          titleHtml: highlightMatch(tool.name, query.trim()),
          descHtml: highlightMatch(tool.description || ('Launch ' + tool.name), query.trim()),
          category: tool.category ? tool.category.toUpperCase() : 'AI TOOL',
          action: () => ToolsManager.launchTool(tool.id)
        });
      });
    }

    // 2. Matched AI Stacks & Workflows
    if (typeof WorkflowManager !== 'undefined' && Array.isArray(WorkflowManager.stacksList)) {
      const matchedStacks = WorkflowManager.stacksList.filter(s =>
        s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
      ).slice(0, 2);

      matchedStacks.forEach(stack => {
        items.push({
          type: 'stack',
          group: 'One-Click Stacks',
          iconHtml: `<div class="suggestion-icon-badge" style="background: var(--accent-gradient);">📦</div>`,
          titleHtml: highlightMatch(stack.name, query.trim()),
          descHtml: highlightMatch(stack.description || 'Open full stack', query.trim()),
          category: 'STACK',
          action: () => {
            if (typeof UI !== 'undefined') UI.switchView('stacks');
          }
        });
      });
    }

    // 3. Smart AI Router Workflow Synthesis
    items.push({
      type: 'router',
      group: 'Smart Intelligence',
      iconHtml: `<div class="suggestion-icon-badge" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">🎯</div>`,
      titleHtml: `Synthesize AI Architecture for: <strong>"${UI.escapeHtml(query.trim())}"</strong>`,
      descHtml: 'Generate custom 4-step tool pipeline with Smart Router',
      category: 'ROUTER',
      action: () => {
        if (typeof UI !== 'undefined') {
          UI.switchView('dashboard');
          const routerInput = document.getElementById('router-task-input');
          const routerBtn = document.getElementById('btn-route-task');
          if (routerInput) routerInput.value = query.trim();
          if (routerBtn) routerBtn.click();
          const routerHero = document.querySelector('.router-hero');
          if (routerHero) routerHero.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    // 4. Web Search Action
    items.push({
      type: 'web',
      group: 'Web Search',
      iconHtml: `<div class="suggestion-icon-badge" style="background: var(--bg-surface-soft); color: var(--text-main); font-size: 14px;">${engineObj.icon || '🔍'}</div>`,
      titleHtml: `Search ${engineObj.name} for <strong>"${UI.escapeHtml(query.trim())}"</strong>`,
      descHtml: `Opens ${engineObj.name} search results in new tab`,
      category: engineObj.name.toUpperCase(),
      action: () => this.executeWebSearch(query)
    });

    this.currentSuggestions = items;
    this.selectedSuggestionIdx = 0;

    // Group items by category for clean visual hierarchy
    let html = '';
    let currentGroup = '';

    items.forEach((item, idx) => {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        html += `<div class="suggestion-section-title">${currentGroup}</div>`;
      }

      html += `
        <div class="search-suggestion-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
          <div class="suggestion-item-main">
            ${item.iconHtml}
            <div class="suggestion-text-col">
              <span class="suggestion-primary-title">${item.titleHtml}</span>
              <span class="suggestion-sub-desc">${item.descHtml}</span>
            </div>
          </div>
          <span class="suggestion-tag-badge">${item.category}</span>
        </div>
      `;
    });

    container.innerHTML = html;
    container.classList.add('visible', 'open');

    // Click & Hover handlers
    container.querySelectorAll('.search-suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        if (!isNaN(idx) && this.currentSuggestions[idx]) {
          this.closeSuggestions();
          this.currentSuggestions[idx].action();
        }
      });
      el.addEventListener('mousemove', () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        if (!isNaN(idx) && idx !== this.selectedSuggestionIdx) {
          this.selectedSuggestionIdx = idx;
          this.updateSuggestionHighlight();
        }
      });
    });
  },

  updateSuggestionHighlight() {
    const container = document.getElementById('search-suggestions-dropdown');
    if (!container) return;
    const items = container.querySelectorAll('.search-suggestion-item');
    items.forEach((el, idx) => {
      const isSelected = idx === this.selectedSuggestionIdx;
      el.classList.toggle('selected', isSelected);
      if (isSelected) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  },

  closeSuggestions() {
    const container = document.getElementById('search-suggestions-dropdown');
    if (container) {
      container.classList.remove('visible', 'open');
    }
    this.selectedSuggestionIdx = -1;
    this.currentSuggestions = [];
  },

  /**
   * Toggle Search Engine Dropdown
   */
  toggleDropdown() {
    const wrapper = document.getElementById('search-engine-wrapper');
    const selector = document.getElementById('search-engine-selector');
    if (!wrapper) return;

    const isOpen = wrapper.classList.contains('open');
    if (isOpen) {
      this.closeDropdown();
    } else {
      wrapper.classList.add('open');
      if (selector) selector.setAttribute('aria-expanded', 'true');
    }
  },

  /**
   * Close Search Engine Dropdown
   */
  closeDropdown() {
    const wrapper = document.getElementById('search-engine-wrapper');
    const selector = document.getElementById('search-engine-selector');
    if (wrapper) wrapper.classList.remove('open');
    if (selector) selector.setAttribute('aria-expanded', 'false');
  },

  /**
   * Get all available engines (default + custom)
   * @returns {Array<object>}
   */
  getAllEngines() {
    const defaultList = Object.values(this.defaultEngines);
    return [...defaultList, ...this.customEngines];
  },

  /**
   * Find engine by ID
   * @param {string} id
   * @returns {object|null}
   */
  getEngineById(id) {
    if (this.defaultEngines[id]) {
      return this.defaultEngines[id];
    }
    return this.customEngines.find(e => e.id === id) || null;
  },

  /**
   * Render the list of search engines inside the dropdown
   */
  renderEngineDropdown() {
    const container = document.getElementById('search-engine-list');
    if (!container) return;

    const allEngines = this.getAllEngines();
    container.innerHTML = '';

    allEngines.forEach(engine => {
      const item = document.createElement('div');
      item.className = `engine-item ${engine.id === this.activeEngine ? 'active' : ''}`;
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');

      const isCustom = !engine.isDefault;

      item.innerHTML = `
        <div class="engine-item-info">
          <span class="engine-item-icon">${engine.icon || '🔍'}</span>
          <span class="engine-item-name">${engine.name}</span>
          ${isCustom ? '<span class="badge-custom-tag">CUSTOM</span>' : ''}
        </div>
        <div class="engine-item-actions">
          ${engine.id === this.activeEngine ? '<span class="engine-check-icon">✓</span>' : ''}
          ${isCustom ? `
            <button class="engine-delete-btn" title="Delete custom engine" data-engine-id="${engine.id}">
              🗑️
            </button>
          ` : ''}
        </div>
      `;

      // Select engine on row click
      item.addEventListener('click', (e) => {
        if (e.target.closest('.engine-delete-btn')) return;
        this.selectEngine(engine.id);
      });

      // Handle custom engine deletion
      if (isCustom) {
        const deleteBtn = item.querySelector('.engine-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCustomEngine(engine.id);
          });
        }
      }

      container.appendChild(item);
    });
  },

  /**
   * Select an engine by ID
   * @param {string} engineId
   */
  async selectEngine(engineId) {
    const engine = this.getEngineById(engineId);
    if (!engine) return;

    this.activeEngine = engineId;

    // Save to settings
    const settingsData = await StorageManager.get('settings');
    const settings = settingsData.settings || {};
    settings.searchEngine = engineId;
    await StorageManager.set({ settings });

    this.updateEngineUI();
    this.renderEngineDropdown();
    this.closeDropdown();

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Search engine set to ${engine.name}`, 'info');
    }
  },

  /**
   * Update Engine Selector button label
   */
  updateEngineUI() {
    const label = document.getElementById('search-engine-label');
    const engine = this.getEngineById(this.activeEngine) || this.defaultEngines.google;
    if (label && engine) {
      label.textContent = `${engine.icon || '🔍'} ${engine.name}`;
    }
  },

  /**
   * Add a new custom search engine
   * @param {object} engineData { name, url, icon }
   */
  async addCustomEngine({ name, url, icon }) {
    if (!name || !url) {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Please enter both name and search URL', 'warning');
      }
      return false;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Standardize query replacement placeholder
    if (!cleanUrl.includes('%s') && !cleanUrl.includes('{query}')) {
      if (!cleanUrl.endsWith('=') && !cleanUrl.endsWith('/') && !cleanUrl.endsWith('?')) {
        cleanUrl += cleanUrl.includes('?') ? '&q=%s' : '?q=%s';
      } else {
        cleanUrl += '%s';
      }
    }

    const newEngine = {
      id: `custom_engine_${Date.now()}`,
      name: name.trim(),
      url: cleanUrl,
      icon: (icon || '🔎').trim(),
      isDefault: false,
      createdAt: Date.now()
    };

    this.customEngines.push(newEngine);
    await StorageManager.set({ customSearchEngines: this.customEngines });

    // Set new engine as active
    await this.selectEngine(newEngine.id);

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Added custom search engine: ${newEngine.name}`, 'success');
    }

    return true;
  },

  /**
   * Delete custom search engine
   * @param {string} engineId
   */
  async deleteCustomEngine(engineId) {
    const engine = this.getEngineById(engineId);
    const engineName = engine ? engine.name : 'Engine';

    this.customEngines = this.customEngines.filter(e => e.id !== engineId);
    await StorageManager.set({ customSearchEngines: this.customEngines });

    // If deleted engine was currently selected, fallback to Google
    if (this.activeEngine === engineId) {
      this.activeEngine = 'google';
      const settingsData = await StorageManager.get('settings');
      const settings = settingsData.settings || {};
      settings.searchEngine = 'google';
      await StorageManager.set({ settings });
    }

    this.updateEngineUI();
    this.renderEngineDropdown();

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Removed search engine "${engineName}"`, 'info');
    }
  },

  /**
   * Filter tools in real-time as user types
   * @param {string} query
   */
  handleLiveFilter(query) {
    const q = (query || '').trim().toLowerCase();

    // Switch to dashboard view if user is in another view and typing
    if (q.length > 0 && typeof UI !== 'undefined' && UI.currentView !== 'dashboard') {
      UI.switchView('dashboard');
    }

    if (!q) {
      if (typeof ToolsManager !== 'undefined') {
        ToolsManager.renderCategoryPills();
        ToolsManager.renderTools();
      }
      return;
    }

    if (typeof ToolsManager !== 'undefined' && ToolsManager.toolsList) {
      const filtered = ToolsManager.toolsList.filter(tool => {
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = (tool.description || '').toLowerCase().includes(q);
        const matchCat = (tool.category || '').toLowerCase().includes(q);
        const matchTags = (tool.tags || []).some(tag => tag.toLowerCase().includes(q));
        return matchName || matchDesc || matchCat || matchTags;
      });

      ToolsManager.renderCategoryPills(filtered);
      ToolsManager.renderTools(filtered);
    }
  },

  /**
   * Execute Web Search in a new tab
   * @param {string} query
   */
  executeWebSearch(query) {
    const q = (query || '').trim();
    if (!q) return;

    const engineObj = this.getEngineById(this.activeEngine) || this.defaultEngines.google;
    let targetUrl = engineObj.url;

    if (targetUrl.includes('%s')) {
      targetUrl = targetUrl.replace('%s', encodeURIComponent(q));
    } else if (targetUrl.includes('{query}')) {
      targetUrl = targetUrl.replace('{query}', encodeURIComponent(q));
    } else {
      targetUrl = `${targetUrl}${encodeURIComponent(q)}`;
    }

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  }
};

