/**
 * AI Command Center - Universal Search Manager
 * Handles multi-engine web search queries, custom search engine management,
 * interactive dropdown selection, and instant local AI tool filtering.
 */
const SearchManager = {
  activeEngine: 'google',

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
    const engineSelector = document.getElementById('search-engine-selector');
    const engineWrapper = document.getElementById('search-engine-wrapper');

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

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (engineWrapper && !engineWrapper.contains(e.target)) {
        this.closeDropdown();
      }
    });

    if (searchInput) {
      // Live instant filtering of AI tool cards
      searchInput.addEventListener('input', (e) => {
        this.handleLiveFilter(e.target.value);
      });

      // Keyboard navigation inside search input
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.executeWebSearch(searchInput.value);
        } else if (e.key === 'Escape') {
          searchInput.value = '';
          this.handleLiveFilter('');
          this.closeDropdown();
          searchInput.blur();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput ? searchInput.value : '';
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
      if (typeof ToolsManager !== 'undefined') ToolsManager.renderTools();
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
