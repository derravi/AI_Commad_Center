/**
 * AI Command Center - Tools Controller
 * Handles tool card rendering, filtering, launching, and CRUD operations.
 */
const ToolsManager = {
  currentCategory: 'all',
  toolsList: [],
  recentTools: [],

  /**
   * Initialize tools data and render
   */
  async init() {
    const data = await StorageManager.get(['tools', 'recentTools']);
    this.toolsList = data.tools || DEFAULT_TOOLS;
    this.recentTools = data.recentTools || [];
    this.renderCategoryPills();
    this.renderTools();
    this.renderQuickAccess();
    this.renderRecentTools();
    this.setupHorizontalScroll();
  },

  /**
   * Launch a tool in a new tab and update recent tracking
   * @param {string} toolId
   */
  async launchTool(toolId) {
    const tool = this.toolsList.find(t => t.id === toolId);
    if (!tool) return;

    // Validate URL protocol before launching to block javascript: or unsafe URLs
    if (!this.isValidUrl(tool.url)) {
      UI.showToast(`Cannot launch "${tool.name}": Unsafe or invalid URL protocol.`, 'error');
      return;
    }

    // Track recently used
    const now = Date.now();
    this.recentTools = this.recentTools.filter(item => item.id !== toolId);
    this.recentTools.unshift({ id: tool.id, name: tool.name, url: tool.url, iconBg: tool.iconBg, iconText: tool.iconText, timestamp: now });
    
    // Keep max 15 recent tools
    if (this.recentTools.length > 15) {
      this.recentTools = this.recentTools.slice(0, 15);
    }

    await StorageManager.set({ recentTools: this.recentTools });
    this.renderQuickAccess();
    this.renderRecentTools();

    // Open URL in new tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: tool.url });
    } else {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Format relative timestamp for recently used tools
   */
  formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(timestamp).toLocaleDateString();
  },

  /**
   * Render Recent Tools Bar with timestamps
   */
  renderRecentTools() {
    const recentsContainer = document.getElementById('recent-tools-scroll-bar');
    const recentsSection = document.getElementById('recent-tools-section');
    if (!recentsContainer) return;

    if (!this.recentTools || this.recentTools.length === 0) {
      if (recentsSection) recentsSection.style.display = 'none';
      recentsContainer.style.display = 'none';
      return;
    }

    if (recentsSection) recentsSection.style.display = 'flex';
    recentsContainer.style.display = 'flex';

    recentsContainer.innerHTML = this.recentTools.map(t => {
      const timeStr = this.formatRelativeTime(t.timestamp);
      return `
        <div class="mini-tool-card" data-id="${this.escapeHtml(t.id)}" title="Last used ${timeStr}">
          <div class="mini-tool-avatar" style="background: ${t.iconBg || 'var(--accent-primary, #6366f1)'};">
            ${this.escapeHtml(t.iconText || t.name.slice(0, 2).toUpperCase())}
          </div>
          <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
            <span class="mini-tool-name">${this.escapeHtml(t.name)}</span>
            <span style="font-size: 10px; color: var(--text-dim); line-height: 1.1;">${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');

    recentsContainer.querySelectorAll('.mini-tool-card').forEach(card => {
      card.addEventListener('click', () => this.launchTool(card.getAttribute('data-id')));
    });
  },

  /**
   * Toggle favorite status of a tool
   * @param {string} toolId
   * @param {Event} e
   */
  async toggleFavorite(toolId, e) {
    if (e) e.stopPropagation();
    const tool = this.toolsList.find(t => t.id === toolId);
    if (!tool) return;

    tool.favorite = !tool.favorite;
    await StorageManager.set({ tools: this.toolsList });
    this.renderTools();
    this.renderQuickAccess();
    
    UI.showToast(tool.favorite ? `Added ${tool.name} to Favorites` : `Removed ${tool.name} from Favorites`, 'info');
  },

  /**
   * Render category filter pills with accurate dynamic counts
   * @param {Array} [activeFilteredList]
   */
  renderCategoryPills(activeFilteredList = null) {
    const container = document.getElementById('category-filter-bar');
    if (!container) return;

    const sourceList = Array.isArray(activeFilteredList) ? activeFilteredList : this.toolsList;

    container.innerHTML = DEFAULT_CATEGORIES.map(cat => {
      const isActive = this.currentCategory === cat.id;
      const count = cat.id === 'all' 
        ? sourceList.length 
        : sourceList.filter(t => t.category === cat.id).length;

      return `
        <button class="category-pill ${isActive ? 'active' : ''}" data-category="${cat.id}">
          <span>${cat.name}</span>
          <span class="section-counter" style="font-size: 10px;">${count}</span>
        </button>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCategory = btn.getAttribute('data-category');
        this.renderCategoryPills(activeFilteredList);
        this.renderTools();
      });
    });
  },

  /**
   * Render the main AI Tools Grid
   * @param {Array} [customFilteredTools]
   */
  renderTools(customFilteredTools = null) {
    const container = document.getElementById('tools-grid');
    if (!container) return;

    let displayTools = customFilteredTools;
    if (!displayTools) {
      displayTools = this.currentCategory === 'all'
        ? this.toolsList
        : this.toolsList.filter(t => t.category === this.currentCategory);
    }

    const countEl = document.getElementById('tools-count-badge');
    if (countEl) countEl.textContent = `${displayTools.length} tools`;

    if (displayTools.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--text-dim);">
          <svg style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p style="font-size: 16px; font-weight: 600; color: var(--text-muted);">No AI tools found</p>
          <p style="font-size: 13px; margin-top: 4px;">Try searching for a different term or category</p>
        </div>
      `;
      return;
    }

    container.innerHTML = displayTools.map(tool => {
      const categoryObj = DEFAULT_CATEGORIES.find(c => c.id === tool.category) || { name: 'General', color: 'var(--accent-primary, #6366f1)' };
      const safeName = this.escapeHtml(tool.name);
      const safeDesc = this.escapeHtml(tool.description || ('Quickly launch ' + tool.name + ' in a new tab.'));
      const safeIconText = this.escapeHtml(tool.iconText || tool.name.slice(0, 2).toUpperCase());
      const tagsHtml = (tool.tags || []).slice(0, 3).map(tag => `<span class="tool-tag">${this.escapeHtml(tag.replace(/^#/, ''))}</span>`).join('');
      const starFilled = tool.favorite ? 'currentColor' : 'none';

      return `
        <div class="tool-card" draggable="true" data-id="${this.escapeHtml(tool.id)}">
          <div class="tool-card-header">
            <div class="tool-icon-avatar" style="background: ${tool.iconBg || 'var(--accent-primary, #6366f1)'};">
              ${safeIconText}
            </div>
            <div class="tool-meta">
              <div class="tool-name-row">
                <span class="tool-name">${safeName}</span>
                ${tool.isDefault ? '' : '<span class="badge badge-accent" style="font-size: 9px;">CUSTOM</span>'}
              </div>
              <span class="tool-category-badge" style="color: ${categoryObj.color};">${this.escapeHtml(categoryObj.name)}</span>
            </div>
            <div class="tool-card-actions">
              <button class="tool-action-btn ${tool.favorite ? 'is-favorite' : ''}" title="Toggle Favorite" data-action="favorite" data-id="${this.escapeHtml(tool.id)}">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="${starFilled}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              ${!tool.isDefault ? `
                <button class="tool-action-btn" title="Edit Tool" data-action="edit" data-id="${this.escapeHtml(tool.id)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="tool-action-btn" title="Delete Tool" data-action="delete" data-id="${this.escapeHtml(tool.id)}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
          
          <p class="tool-description">${safeDesc}</p>
          
          <div class="tool-card-footer">
            <div class="tool-tags-row">
              ${tagsHtml}
            </div>
            <span class="tool-launch-btn">
              Launch
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    container.querySelectorAll('.tool-card').forEach(card => {
      const toolId = card.getAttribute('data-id');
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        this.launchTool(toolId);
      });
    });

    container.querySelectorAll('[data-action="favorite"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.toggleFavorite(btn.getAttribute('data-id'), e);
      });
    });

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditModal(btn.getAttribute('data-id'));
      });
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCustomTool(btn.getAttribute('data-id'));
      });
    });

    // Drag-to-Reorder mechanics
    this.initDragAndDrop(container);
  },

  /**
   * HTML5 Drag-and-Drop Reordering for Tools
   */
  initDragAndDrop(container) {
    let draggedId = null;

    container.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.getAttribute('data-id');
        card.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        container.querySelectorAll('.tool-card').forEach(c => c.classList.remove('drag-over-target'));
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

        const fromIdx = this.toolsList.findIndex(t => t.id === draggedId);
        const toIdx = this.toolsList.findIndex(t => t.id === targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [movedTool] = this.toolsList.splice(fromIdx, 1);
          this.toolsList.splice(toIdx, 0, movedTool);

          await StorageManager.set({ tools: this.toolsList });
          this.renderTools();
          this.renderCategoryPills();
        }
      });
    });
  },

  /**
   * Open Edit Modal for a Tool
   */
  openEditModal(toolId) {
    const tool = this.toolsList.find(t => t.id === toolId);
    if (!tool) return;

    const modal = document.getElementById('modal-add-tool');
    const form = document.getElementById('form-add-tool');
    if (!modal || !form) return;

    const headerTitle = modal.querySelector('.modal-header h3');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (headerTitle) headerTitle.textContent = 'Edit Custom AI Tool';
    if (submitBtn) submitBtn.textContent = 'Update Tool';

    form.dataset.editId = tool.id;
    const nameInp = document.getElementById('input-tool-name');
    const urlInp = document.getElementById('input-tool-url');
    const catInp = document.getElementById('select-tool-category');
    const descInp = document.getElementById('input-tool-description');
    const tagsInp = document.getElementById('input-tool-tags');
    const iconTextInp = document.getElementById('input-tool-icon-text');
    const iconBgInp = document.getElementById('input-tool-icon-bg');
    const favInp = document.getElementById('checkbox-tool-favorite');

    if (nameInp) nameInp.value = tool.name || '';
    if (urlInp) urlInp.value = tool.url || '';
    if (catInp) catInp.value = tool.category || 'chat';
    if (descInp) descInp.value = tool.description || '';
    if (tagsInp) tagsInp.value = (tool.tags || []).join(', ');
    if (iconTextInp) iconTextInp.value = tool.iconText || '';
    if (iconBgInp) iconBgInp.value = tool.iconBg || '#6366f1';
    if (favInp) favInp.checked = Boolean(tool.favorite);

    UI.openModal('modal-add-tool');
  },

  /**
   * Update existing custom AI Tool
   */
  async updateCustomTool(toolId, toolData) {
    const index = this.toolsList.findIndex(t => t.id === toolId);
    if (index === -1) {
      UI.showToast('Tool not found', 'error');
      return false;
    }

    if (!toolData.name || !toolData.url) {
      UI.showToast('Please provide both Tool Name and valid URL', 'error');
      return false;
    }

    let url = toolData.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (!this.isValidUrl(url)) {
      UI.showToast('Invalid URL format. Only http:// and https:// URLs are allowed.', 'error');
      return false;
    }

    this.toolsList[index] = {
      ...this.toolsList[index],
      name: toolData.name.trim().slice(0, 80),
      url: url.slice(0, 500),
      category: toolData.category || 'productivity',
      description: toolData.description ? toolData.description.trim().slice(0, 500) : 'Custom AI tool',
      tags: toolData.tags ? toolData.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase().slice(0, 30)).filter(Boolean).slice(0, 10) : ['custom'],
      iconBg: toolData.iconBg || 'var(--accent-primary, #8b5cf6)',
      iconText: toolData.iconText ? toolData.iconText.trim().slice(0, 3).toUpperCase() : toolData.name.trim().slice(0, 2).toUpperCase(),
      favorite: Boolean(toolData.favorite)
    };

    await StorageManager.set({ tools: this.toolsList });
    this.renderCategoryPills();
    this.renderTools();
    this.renderQuickAccess();
    this.renderRecentTools();
    UI.showToast(`Updated "${this.toolsList[index].name}" successfully!`, 'success');
    return true;
  },

  /**
   * Render Quick Access Bar (Favorites)
   */
  renderQuickAccess() {
    const favoritesContainer = document.getElementById('favorites-scroll-bar');
    
    // Render Favorites
    if (favoritesContainer) {
      const favoriteTools = this.toolsList.filter(t => t.favorite);
      if (favoriteTools.length === 0) {
        favoritesContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-dim); padding: 6px 12px;">Click the star icon on any tool card to add to Favorites</span>';
      } else {
        favoritesContainer.innerHTML = favoriteTools.map(t => `
          <div class="mini-tool-card" data-id="${this.escapeHtml(t.id)}">
            <div class="mini-tool-avatar" style="background: ${t.iconBg || 'var(--accent-primary, #6366f1)'};">
              ${this.escapeHtml(t.iconText || t.name.slice(0, 2).toUpperCase())}
            </div>
            <span class="mini-tool-name">${this.escapeHtml(t.name)}</span>
          </div>
        `).join('');

        favoritesContainer.querySelectorAll('.mini-tool-card').forEach(card => {
          card.addEventListener('click', () => this.launchTool(card.getAttribute('data-id')));
        });
      }
    }
  },

  /**
   * Add a new custom AI Tool
   * @param {object} toolData
   */
  async addCustomTool(toolData) {
    if (!toolData.name || !toolData.url) {
      UI.showToast('Please provide both Tool Name and valid URL', 'error');
      return false;
    }

    let url = toolData.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (!this.isValidUrl(url)) {
      UI.showToast('Invalid URL format. Only http:// and https:// URLs are allowed.', 'error');
      return false;
    }

    const newTool = {
      id: 'custom-' + Date.now(),
      name: toolData.name.trim().slice(0, 80),
      url: url.slice(0, 500),
      category: toolData.category || 'productivity',
      description: toolData.description ? toolData.description.trim().slice(0, 500) : 'Custom AI tool',
      tags: toolData.tags ? toolData.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase().slice(0, 30)).filter(Boolean).slice(0, 10) : ['custom'],
      iconBg: toolData.iconBg || 'var(--accent-primary, #8b5cf6)',
      iconText: toolData.iconText ? toolData.iconText.trim().slice(0, 3).toUpperCase() : toolData.name.trim().slice(0, 2).toUpperCase(),
      favorite: Boolean(toolData.favorite),
      isDefault: false,
      useCases: ['Custom productivity']
    };

    this.toolsList.push(newTool);
    await StorageManager.set({ tools: this.toolsList });
    this.renderCategoryPills();
    this.renderTools();
    this.renderQuickAccess();
    this.renderRecentTools();
    UI.showToast(`"${newTool.name}" added to AI Command Center!`, 'success');
    return true;
  },

  /**
   * Delete a custom tool
   * @param {string} toolId
   */
  async deleteCustomTool(toolId) {
    const tool = this.toolsList.find(t => t.id === toolId);
    if (!tool) return;

    const ok = await UI.confirm({
      title: 'Delete Tool',
      message: `Are you sure you want to delete "${tool.name}" from your AI tools?`,
      confirmText: 'Delete Tool',
      danger: true
    });

    if (ok) {
      this.toolsList = this.toolsList.filter(t => t.id !== toolId);
      this.recentTools = this.recentTools.filter(t => t.id !== toolId);
      await StorageManager.set({ tools: this.toolsList, recentTools: this.recentTools });
      this.renderCategoryPills();
      this.renderTools();
      this.renderQuickAccess();
      this.renderRecentTools();
      UI.showToast(`Deleted "${tool.name}"`, 'info');
    }
  },

  /**
   * Enable horizontal scrolling via mouse wheel and touchpad
   */
  setupHorizontalScroll() {
    const containerIds = ['favorites-scroll-bar', 'recent-tools-scroll-bar', 'category-filter-bar'];

    containerIds.forEach(id => {
      const container = document.getElementById(id);
      if (!container || container.dataset.hscrollAttached) return;
      container.dataset.hscrollAttached = 'true';

      container.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0 && container.scrollWidth > container.clientWidth) {
          if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
            const canScrollLeft = container.scrollLeft > 0 && e.deltaY < 0;
            const canScrollRight = (container.scrollLeft + container.clientWidth < container.scrollWidth - 1) && e.deltaY > 0;
            
            if (canScrollLeft || canScrollRight) {
              e.preventDefault();
              container.scrollLeft += e.deltaY;
            }
          }
        }
      }, { passive: false });
    });
  },

  /**
   * Escape HTML special characters to prevent XSS injection
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Validate that URL strictly uses http: or https: protocols
   * @param {string} url
   * @returns {boolean}
   */
  isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }
};
