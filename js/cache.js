/**
 * AI Command Center - Chrome Cache & Browsing Data Manager
 * Direct access to Chrome BrowsingData API and local storage management from Settings.
 */
const CacheManager = {
  isExtension: typeof chrome !== 'undefined' && chrome.browsingData && typeof chrome.browsingData.remove === 'function',
  lastClearedKey: 'aicc_last_cache_cleared',

  /**
   * Initialize Cache Manager and UI events
   */
  async init() {
    this.initSettingsTabs();
    this.initEventListeners();
    await this.updateStorageStats();
    await this.updateLastClearedUI();
  },

  /**
   * Handle Settings sub-tabs navigation
   */
  initSettingsTabs() {
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-settings-tab');
        if (targetTab) {
          this.switchSettingsTab(targetTab);
        }
      });
    });
  },

  /**
   * Switch active sub-tab inside Settings view
   * @param {string} tabName
   */
  switchSettingsTab(tabName) {
    // Update tab button active states
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-settings-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab pane visibility
    document.querySelectorAll('.settings-tab-pane').forEach(pane => {
      if (pane.id === `settings-pane-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Refresh metrics if switching to cache tab
    if (tabName === 'cache') {
      this.updateStorageStats();
      this.updateLastClearedUI();
    }
  },

  /**
   * Bind all button clicks and interactions in Cache tab
   */
  initEventListeners() {
    // 1. Quick 1-Click Clear Cache Button
    const quickClearBtn = document.getElementById('btn-quick-clear-cache');
    if (quickClearBtn) {
      quickClearBtn.addEventListener('click', async () => {
        await this.handleQuickClear(quickClearBtn);
      });
    }

    // 2. Custom Clear Data Button
    const customClearBtn = document.getElementById('btn-custom-clear-cache');
    if (customClearBtn) {
      customClearBtn.addEventListener('click', async () => {
        await this.handleCustomClear(customClearBtn);
      });
    }

    // 3. Reset Command Center App Cache Button
    const appCacheBtn = document.getElementById('btn-clear-app-cache');
    if (appCacheBtn) {
      appCacheBtn.addEventListener('click', async () => {
        await this.clearAppCache(appCacheBtn);
      });
    }

    // 4. Select All / Deselect All helper
    const selectAllBtn = document.getElementById('btn-cache-select-all');
    const deselectAllBtn = document.getElementById('btn-cache-deselect-all');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.cache-option-checkbox').forEach(cb => {
          cb.checked = true;
          cb.closest('.cache-option-item')?.classList.add('selected');
        });
      });
    }
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.cache-option-checkbox').forEach(cb => {
          cb.checked = false;
          cb.closest('.cache-option-item')?.classList.remove('selected');
        });
      });
    }

    // Checkbox styling toggle on change
    document.querySelectorAll('.cache-option-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const parent = cb.closest('.cache-option-item');
        if (parent) {
          if (cb.checked) {
            parent.classList.add('selected');
          } else {
            parent.classList.remove('selected');
          }
        }
      });
    });
  },

  /**
   * Convert time range dropdown value to timestamp in ms
   * @param {string} range
   * @returns {number}
   */
  getSinceTimestamp(range) {
    const now = Date.now();
    switch (range) {
      case 'hour':
        return now - 1000 * 60 * 60;
      case 'day':
        return now - 1000 * 60 * 60 * 24;
      case 'week':
        return now - 1000 * 60 * 60 * 24 * 7;
      case 'month':
        return now - 1000 * 60 * 60 * 24 * 30;
      case 'all':
      default:
        return 0;
    }
  },

  /**
   * 1-Click Quick Clear Chrome HTTP Cache
   * @param {HTMLElement} btn
   */
  async handleQuickClear(btn) {
    const originalText = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Clearing Chrome Cache...
      `;

      await this.executeClearBrowsingData({
        since: 0, // all time
        dataToRemove: {
          cache: true,
          cacheStorage: true,
          serviceWorkers: true
        }
      });

      // Clear web cache storage if available
      if (window.caches) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('CacheStorage purge notice:', e);
        }
      }

      await this.recordLastCleared('Chrome HTTP Cache (All Time)');
      await this.updateStorageStats();
      await this.updateLastClearedUI();

      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('⚡ Chrome Cache successfully purged! All web assets refreshed.', 'success');
      }

      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Cache Cleared!
      `;

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`⚠️ Could not clear cache: ${err.message || err}`, 'error');
      }
    }
  },

  /**
   * Custom Clear with selected checkboxes and time range
   * @param {HTMLElement} btn
   */
  async handleCustomClear(btn) {
    const timeRangeSelect = document.getElementById('cache-time-range');
    const timeRange = timeRangeSelect ? timeRangeSelect.value : 'all';
    const since = this.getSinceTimestamp(timeRange);

    const getChecked = (id) => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

    const clearCache = getChecked('cb-cache-http');
    const clearCacheStorage = getChecked('cb-cache-storage');
    const clearCookies = getChecked('cb-cache-cookies');
    const clearLocalStorage = getChecked('cb-cache-localstorage');
    const clearIndexedDB = getChecked('cb-cache-indexeddb');
    const clearServiceWorkers = getChecked('cb-cache-serviceworkers');
    const clearDownloads = getChecked('cb-cache-downloads');
    const clearFormData = getChecked('cb-cache-formdata');
    const clearAppCache = getChecked('cb-cache-app');

    const totalSelected = [
      clearCache, clearCacheStorage, clearCookies, clearLocalStorage,
      clearIndexedDB, clearServiceWorkers, clearDownloads, clearFormData, clearAppCache
    ].filter(Boolean).length;

    if (totalSelected === 0) {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Please select at least one data category to clear.', 'warning');
      }
      return;
    }

    const originalText = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        Clearing Selected Data...
      `;

      const dataToRemove = {};
      if (clearCache) dataToRemove.cache = true;
      if (clearCacheStorage) dataToRemove.cacheStorage = true;
      if (clearCookies) dataToRemove.cookies = true;
      if (clearLocalStorage) dataToRemove.localStorage = true;
      if (clearIndexedDB) dataToRemove.indexedDB = true;
      if (clearServiceWorkers) dataToRemove.serviceWorkers = true;
      if (clearDownloads) dataToRemove.downloads = true;
      if (clearFormData) dataToRemove.formData = true;

      // Execute Chrome browsing data removal
      if (Object.keys(dataToRemove).length > 0) {
        await this.executeClearBrowsingData({ since, dataToRemove });
      }

      // If CacheStorage API selected
      if (clearCacheStorage && window.caches) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('CacheStorage purge notice:', e);
        }
      }

      // If Command Center app cache is selected
      if (clearAppCache) {
        this.purgeAppInternalCache();
      }

      const rangeLabel = timeRangeSelect ? timeRangeSelect.options[timeRangeSelect.selectedIndex].text : timeRange;
      await this.recordLastCleared(`Selected items (${rangeLabel})`);
      await this.updateStorageStats();
      await this.updateLastClearedUI();

      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`✨ Selected browsing data & cache successfully cleared!`, 'success');
      }

      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Cleared Successfully!
      `;

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to clear browsing data:', err);
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`⚠️ Error clearing data: ${err.message || err}`, 'error');
      }
    }
  },

  /**
   * Execute Chrome API browsingData.remove
   * @param {object} param0
   * @returns {Promise<void>}
   */
  async executeClearBrowsingData({ since = 0, dataToRemove }) {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.browsingData.remove({ since }, dataToRemove, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else {
      // Fallback in web dev mode
      console.log('Web Dev Mode: Simulating Chrome browsingData clearance with', dataToRemove);
      await new Promise(r => setTimeout(r, 600));
      return Promise.resolve();
    }
  },

  /**
   * Purge AI Command Center internal volatile cache
   */
  purgeAppInternalCache() {
    try {
      // Clear session storage
      sessionStorage.clear();

      // Clear any temporary router cache in memory or storage
      if (typeof SmartRouter !== 'undefined' && SmartRouter.lastQuery) {
        SmartRouter.lastQuery = '';
      }

      // Reset recent tools timestamp tracking if needed
      console.log('🧹 AI Command Center app internal cache purged.');
    } catch (e) {
      console.warn('App internal cache error:', e);
    }
  },

  /**
   * Clear Command Center memory / app cache button
   * @param {HTMLElement} btn
   */
  async clearAppCache(btn) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Purging App Cache...';

    this.purgeAppInternalCache();
    await new Promise(r => setTimeout(r, 300));

    btn.disabled = false;
    btn.innerHTML = '✓ App Memory Refreshed';
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast('AI Command Center temporary memory and caches cleared.', 'info');
    }

    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  },

  /**
   * Save last cleared record
   * @param {string} label
   */
  async recordLastCleared(label) {
    const record = {
      timestamp: new Date().toISOString(),
      label
    };
    try {
      localStorage.setItem(this.lastClearedKey, JSON.stringify(record));
    } catch (e) {
      // ignore
    }
  },

  /**
   * Update the UI indicating when cache was last cleared
   */
  async updateLastClearedUI() {
    const labelEl = document.getElementById('cache-last-cleared-text');
    if (!labelEl) return;

    try {
      const item = localStorage.getItem(this.lastClearedKey);
      if (item) {
        const record = JSON.parse(item);
        const date = new Date(record.timestamp);
        labelEl.textContent = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${record.label})`;
        return;
      }
    } catch (e) {
      // ignore
    }
    labelEl.textContent = 'No record yet';
  },

  /**
   * Calculate storage quota and usage
   */
  async updateStorageStats() {
    const usageEl = document.getElementById('cache-storage-usage');
    const apiBadgeEl = document.getElementById('cache-api-badge');

    if (apiBadgeEl) {
      if (this.isExtension) {
        apiBadgeEl.textContent = '● Chrome BrowsingData API Connected';
        apiBadgeEl.className = 'badge badge-success';
        apiBadgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
        apiBadgeEl.style.color = '#10b981';
        apiBadgeEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      } else {
        apiBadgeEl.textContent = '● Browser Storage Mode';
        apiBadgeEl.className = 'badge badge-accent';
      }
    }

    if (usageEl && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(1);
        const quotaGB = (estimate.quota / (1024 * 1024 * 1024)).toFixed(1);
        usageEl.textContent = `${usageMB} MB used (of ${quotaGB} GB quota)`;
      } catch (e) {
        usageEl.textContent = 'Active & Ready';
      }
    } else if (usageEl) {
      usageEl.textContent = 'Ready';
    }
  }
};
