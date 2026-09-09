/**
 * AI Command Center - Localhost Quick Access Bar Controller
 * Displays clean 'local:PORT' tabs in the UI while resolving to full 'localhost:PORT' in the backend.
 */
const LocalhostManager = {
  tabs: [],
  isDragging: false,
  hasMoved: false,
  startX: 0,
  scrollStart: 0,

  /**
   * Default initial localhost ports:
   * Displays as local:8000, local:5000, local:3000, local:8080
   * Opens http://localhost:8000, http://localhost:5000, etc.
   */
  DEFAULT_TABS: [
    { id: 'lh-8000', url: 'localhost:8000', port: '8000', created: 1 },
    { id: 'lh-5000', url: 'localhost:5000', port: '5000', created: 2 },
    { id: 'lh-3000', url: 'localhost:3000', port: '3000', created: 3 },
    { id: 'lh-8080', url: 'localhost:8080', port: '8080', created: 4 }
  ],

  /**
   * Initialize Localhost Manager
   */
  async init() {
    const data = await StorageManager.get('localhostTabs');
    if (data.localhostTabs && Array.isArray(data.localhostTabs) && data.localhostTabs.length > 0) {
      // Sanitize stored entries to ensure clean backend localhost:PORT
      this.tabs = data.localhostTabs.map((tab, idx) => {
        const parsed = this.parseInput(tab.url || tab.port);
        return {
          id: tab.id || `lh-${parsed ? parsed.port : idx}`,
          url: parsed ? parsed.backendUrl : 'localhost:8000',
          port: parsed ? parsed.port : '8000',
          created: tab.created || idx
        };
      });
      await StorageManager.set({ localhostTabs: this.tabs });
    } else {
      this.tabs = [...this.DEFAULT_TABS];
      await StorageManager.set({ localhostTabs: this.tabs });
    }

    this.render();
    this.initScrollControls();
    this.initModalHandlers();
  },

  /**
   * Normalize input into:
   * - displayUrl: "local:8000" (for UI display)
   * - backendUrl: "localhost:8000" (for storage and identification)
   * - fullUrl: "http://localhost:8000" (for launching in browser)
   */
  parseInput(input) {
    if (!input) return null;
    let raw = String(input).trim();
    if (!raw) return null;

    // Handle inputs like "local:8000" or "local:800"
    raw = raw.replace(/^local:/i, 'localhost:');

    // Extract any host:port or pure digits from raw string
    const hostPortMatch = raw.match(/(?:https?:\/\/)?((?:[a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\]):\d+|\d{2,5}|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)/i);
    if (hostPortMatch) {
      raw = hostPortMatch[1];
    }

    // If only digits entered, e.g., '8000' -> display: 'local:8000', full: 'http://localhost:8000'
    if (/^\d{2,5}$/.test(raw)) {
      const port = raw;
      return {
        displayUrl: `local:${port}`,
        backendUrl: `localhost:${port}`,
        fullUrl: `http://localhost:${port}`,
        port: port,
        host: 'localhost'
      };
    }

    // Strip leading protocols for clean processing
    let cleanUrl = raw.replace(/^https?:\/\//i, '');
    let protocol = /^https:\/\//i.test(raw) ? 'https://' : 'http://';

    // Extract port if present
    const portMatch = cleanUrl.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : '';

    // Create displayUrl as "local:PORT"
    let display = cleanUrl;
    if (/^localhost:\d+/i.test(cleanUrl)) {
      display = cleanUrl.replace(/^localhost:/i, 'local:');
    } else if (port && (/^localhost$/i.test(cleanUrl) || /^127\.0\.0\.1:/i.test(cleanUrl))) {
      display = `local:${port}`;
    }

    return {
      displayUrl: display,
      backendUrl: cleanUrl,
      fullUrl: `${protocol}${cleanUrl}`,
      port: port,
      host: cleanUrl.split('/')[0].split(':')[0]
    };
  },

  /**
   * Render all localhost tabs in the horizontal track with 'local:PORT' labels
   */
  render() {
    const track = document.getElementById('localhost-tabs-track');
    if (!track) return;

    if (this.tabs.length === 0) {
      track.innerHTML = `
        <div class="localhost-empty-hint">
          <span>No saved localhosts. Click <strong>+ Add Local</strong> to add one.</span>
        </div>
      `;
      return;
    }

    track.innerHTML = this.tabs.map((tab) => {
      const parsed = this.parseInput(tab.url);
      const display = parsed ? parsed.displayUrl : `local:${tab.port || '8000'}`;
      const backend = parsed ? parsed.backendUrl : tab.url;

      return `
        <div class="localhost-tab-pill" data-id="${tab.id}" title="Click to open http://${backend} in new tab">
          <div class="lh-pill-left">
            <span class="lh-status-pulse"></span>
            <span class="lh-url-text">${this.escapeHtml(display)}</span>
          </div>
          <div class="lh-pill-actions">
            <button class="lh-action-btn lh-delete-btn" data-action="delete" title="Remove ${this.escapeHtml(display)}" aria-label="Delete">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach interaction handlers to pills
    track.querySelectorAll('.localhost-tab-pill').forEach(pill => {
      const id = pill.getAttribute('data-id');

      // Click to open URL in new tab (only if user didn't drag/pan)
      pill.addEventListener('click', (e) => {
        if (this.hasMoved) return; // Prevent launch on drag
        if (e.target.closest('[data-action="delete"]')) {
          this.deleteLocalhost(id, e);
          return;
        }
        this.launch(id);
      });
    });
  },

  /**
   * Launch the full localhost URL in a new tab without altering the current Command Center tab
   */
  launch(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab) return;

    const parsed = this.parseInput(tab.url);
    if (!parsed) return;

    // Visual ripple effect on the pill
    const pill = document.querySelector(`.localhost-tab-pill[data-id="${id}"]`);
    if (pill) {
      pill.classList.add('lh-pill-active-launch');
      setTimeout(() => pill.classList.remove('lh-pill-active-launch'), 400);
    }

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: parsed.fullUrl });
    } else {
      window.open(parsed.fullUrl, '_blank', 'noopener,noreferrer');
    }

    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Opening ${parsed.backendUrl}...`, 'info');
    }
  },

  /**
   * Add a new localhost tab entry with duplicate prevention
   */
  async addLocalhost(rawInput) {
    const parsed = this.parseInput(rawInput);
    if (!parsed) {
      if (typeof UI !== 'undefined') UI.showToast('Please enter a valid port or localhost URL', 'error');
      return false;
    }

    // Check for duplicate backend URL or port
    const existing = this.tabs.find(t => {
      const p = this.parseInput(t.url);
      return p && (p.backendUrl.toLowerCase() === parsed.backendUrl.toLowerCase() || p.port === parsed.port);
    });

    if (existing) {
      if (typeof UI !== 'undefined') {
        UI.showToast(`'${parsed.displayUrl}' is already in your Localhost Bar!`, 'error');
      }
      this.highlightTab(existing.id);
      return false;
    }

    const newTab = {
      id: `lh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: parsed.backendUrl,
      port: parsed.port,
      created: Date.now()
    };

    this.tabs.push(newTab);
    await StorageManager.set({ localhostTabs: this.tabs });
    this.render();

    // Scroll container to the newly added tab
    setTimeout(() => {
      this.scrollToTab(newTab.id);
      this.highlightTab(newTab.id);
    }, 50);

    if (typeof UI !== 'undefined') {
      UI.showToast(`Added ${parsed.displayUrl}`, 'success');
    }
    return true;
  },

  /**
   * Remove a saved localhost tab
   */
  async deleteLocalhost(id, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;

    const [deletedItem] = this.tabs.splice(index, 1);
    await StorageManager.set({ localhostTabs: this.tabs });
    this.render();

    const parsed = this.parseInput(deletedItem.url);
    if (typeof UI !== 'undefined') {
      UI.showToast(`Removed ${parsed ? parsed.displayUrl : deletedItem.url}`, 'info');
    }
  },

  /**
   * Highlight a tab visually (e.g., when added or found as duplicate)
   */
  highlightTab(id) {
    const el = document.querySelector(`.localhost-tab-pill[data-id="${id}"]`);
    if (el) {
      el.classList.add('lh-pill-highlight');
      setTimeout(() => el.classList.remove('lh-pill-highlight'), 1200);
    }
  },

  /**
   * Scroll smoothly to a specific tab
   */
  scrollToTab(id) {
    const el = document.querySelector(`.localhost-tab-pill[data-id="${id}"]`);
    const container = document.getElementById('localhost-tabs-container');
    if (el && container) {
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const contWidth = container.offsetWidth;
      container.scrollTo({
        left: elLeft - (contWidth / 2) + (elWidth / 2),
        behavior: 'smooth'
      });
    }
  },

  /**
   * Open the Add Modal
   */
  openAddModal(presetPort = '') {
    const inputUrl = document.getElementById('input-lh-url');
    if (inputUrl) inputUrl.value = presetPort || '';

    if (typeof UI !== 'undefined' && UI.openModal) {
      UI.openModal('modal-add-localhost');
    }
    setTimeout(() => { if (inputUrl) inputUrl.focus(); }, 100);
  },

  /**
   * Initialize modal form submission and preset chip listeners
   */
  initModalHandlers() {
    const form = document.getElementById('form-add-localhost');
    const openAddBtn = document.getElementById('btn-add-localhost');

    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.openAddModal();
      });
    }

    // Quick preset port chips in modal
    document.querySelectorAll('.lh-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const port = chip.getAttribute('data-port');
        const inputUrl = document.getElementById('input-lh-url');
        if (inputUrl) {
          inputUrl.value = port;
          inputUrl.focus();
        }
      });
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlVal = document.getElementById('input-lh-url').value;

        const success = await this.addLocalhost(urlVal);

        if (success) {
          form.reset();
          if (typeof UI !== 'undefined' && UI.closeAllModals) {
            UI.closeAllModals();
          }
        }
      });
    }
  },

  /**
   * Initialize Horizontal Scroll and Drag-to-Pan mechanics
   */
  initScrollControls() {
    const container = document.getElementById('localhost-tabs-container');
    if (!container) return;

    // 1. Mouse-Wheel horizontal scroll translation
    container.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 0.9;
      }
    }, { passive: false });

    // 2. Mouse Click-and-Drag horizontal panning
    container.addEventListener('mousedown', (e) => {
      // Ignore if clicking action buttons
      if (e.target.closest('.lh-action-btn')) return;

      this.isDragging = true;
      this.hasMoved = false;
      this.startX = e.pageX - container.offsetLeft;
      this.scrollStart = container.scrollLeft;
      container.classList.add('is-dragging');
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        container.classList.remove('is-dragging');
        setTimeout(() => { this.hasMoved = false; }, 30);
      }
    });

    container.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        container.classList.remove('is-dragging');
        setTimeout(() => { this.hasMoved = false; }, 30);
      }
    });

    container.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const currentX = e.pageX - container.offsetLeft;
      const walk = (currentX - this.startX) * 1.35;
      if (Math.abs(walk) > 4) {
        this.hasMoved = true;
      }
      container.scrollLeft = this.scrollStart - walk;
    });
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
