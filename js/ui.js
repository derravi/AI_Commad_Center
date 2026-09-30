/**
 * AI Command Center - UI & State Controller
 * Manages view routing, themes, live clock, modals, spotlight tracking, command palette, and notifications.
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
    this.initWallpaper();
    this.initSpotlightTracking();
    this.initModals();
    this.initAssistantDrawer();
    this.initApiHub();
    this.initGlobalDelegation();
  },

  /**
   * Initialize Global Event Delegation (e.g. Markdown copy buttons and tactile feedback)
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
   * Start live ticking clock and personalized greeting
   */
  initClock() {
    const timeEl = document.getElementById('header-clock-time');
    const dateEl = document.getElementById('header-clock-date');
    const greetingEl = document.getElementById('header-clock-greeting');

    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (greetingEl) {
        let greeting = '⚡ Architect';
        if (hours >= 5 && hours < 12) {
          greeting = '☀️ Morning, Explorer';
        } else if (hours >= 12 && hours < 17) {
          greeting = '⚡ Afternoon, Builder';
        } else if (hours >= 17 && hours < 21) {
          greeting = '🌆 Evening, Architect';
        } else {
          greeting = '🌙 Night, Hacker';
        }
        greetingEl.textContent = greeting;
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
   * Switch active content view with smooth animation
   * @param {string} viewName
   */
  switchView(viewName) {
    if (this.currentView === viewName) return;
    this.currentView = viewName;

    // Smoothly scroll main wrapper to top on view switch
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      mainWrapper.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update nav active states
    document.querySelectorAll('.nav-item').forEach(item => {
      const btn = item.querySelector('button');
      if (btn && btn.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update view containers with smooth entrance animation re-trigger
    document.querySelectorAll('.view-content').forEach(view => {
      if (view.id === `view-${viewName}`) {
        view.classList.remove('active');
        // Trigger DOM reflow to restart css animation cleanly
        void view.offsetWidth;
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Trigger sub-module updates if needed
    if (viewName === 'stacks' && typeof WorkflowManager !== 'undefined') WorkflowManager.renderStacks();
    if (viewName === 'prompts' && typeof PromptLibrary !== 'undefined') {
      PromptLibrary.updateStudioEngineStatus();
      PromptLibrary.renderPrompts();
    }
    if (viewName === 'apihub' && typeof GeminiClient !== 'undefined') GeminiClient.updateUIStatus();
    if (viewName === 'settings') {
      if (typeof CacheManager !== 'undefined') {
        CacheManager.updateStorageStats();
        CacheManager.updateLastClearedUI();
      }
      if (typeof ShortcutsManager !== 'undefined') {
        ShortcutsManager.renderSettingsUI();
      }
    }
  },

  /**
   * Initialize Theme, Accent colors, and Settings
   */
  async initThemeAndSettings() {
    const data = await StorageManager.get('settings');
    const settings = data.settings || {};
    const validThemes = ['dark', 'midnight', 'aurora', 'light'];
    const currentTheme = validThemes.includes(settings.theme) ? settings.theme : 'dark';

    // Apply Theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(currentTheme);
    this.updateThemeModeActiveCards(currentTheme);

    // Apply Accent color
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent-primary', settings.accentColor);
      document.querySelectorAll('.theme-swatch').forEach(s => {
        if (s.getAttribute('data-color') === settings.accentColor) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    }

    // Theme Mode Cards click handler
    document.querySelectorAll('.theme-mode-card').forEach(card => {
      card.addEventListener('click', async () => {
        const selectedTheme = card.getAttribute('data-theme-mode');
        if (!selectedTheme) return;

        document.documentElement.setAttribute('data-theme', selectedTheme);
        settings.theme = selectedTheme;
        if (!settings.accentColor) {
          document.documentElement.style.removeProperty('--accent-primary');
        }
        await StorageManager.set({ settings });

        this.updateThemeIcon(selectedTheme);
        this.updateThemeModeActiveCards(selectedTheme);
        this.showToast(`Theme switched to ${card.querySelector('strong')?.textContent || selectedTheme}`, 'info');
      });
    });

    // Fast Theme Switcher button in top header
    const headerThemeBtn = document.getElementById('btn-header-theme-toggle');
    if (headerThemeBtn) {
      headerThemeBtn.addEventListener('click', async () => {
        const themeOrder = ['dark', 'midnight', 'aurora', 'light'];
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const currentIndex = themeOrder.indexOf(activeTheme);
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

        document.documentElement.setAttribute('data-theme', nextTheme);
        settings.theme = nextTheme;
        if (!settings.accentColor) {
          document.documentElement.style.removeProperty('--accent-primary');
        }
        await StorageManager.set({ settings });

        this.updateThemeIcon(nextTheme);
        this.updateThemeModeActiveCards(nextTheme);
        this.showToast(`Switched theme to ${nextTheme.toUpperCase()}`, 'info');
      });
    }

    // Theme palette swatches
    document.querySelectorAll('.theme-swatch').forEach(swatch => {
      swatch.addEventListener('click', async () => {
        const color = swatch.getAttribute('data-color');
        if (!color) return;

        if (swatch.classList.contains('active') && settings.accentColor) {
          delete settings.accentColor;
          document.documentElement.style.removeProperty('--accent-primary');
          swatch.classList.remove('active');
          await StorageManager.set({ settings });
          this.showToast('Accent color reset to theme default', 'info');
          return;
        }

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

  updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    if (!iconEl) return;
    const icons = {
      dark: '🌙',
      midnight: '🌌',
      aurora: '🔮',
      light: '☀️'
    };
    iconEl.textContent = icons[theme] || '🌙';
  },

  updateThemeModeActiveCards(theme) {
    document.querySelectorAll('.theme-mode-card').forEach(card => {
      if (card.getAttribute('data-theme-mode') === theme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  },

  /**
   * Curated & Dynamic Ultra-HD Natural Wallpapers
   */
  naturalWallpapers: [
    {
      id: 'dynamic-nature',
      name: '🌐 Live Internet Nature',
      desc: 'Auto-refreshes dynamic scenic photography from web',
      icon: '🌐',
      isLive: true,
      url: '',
      thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'misty-pines',
      name: '🌲 Misty Pines',
      desc: 'Emerald forest fog & alpine valley',
      icon: '🌲',
      url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'alpine-sunset',
      name: '🏔️ Alpine Sunset',
      desc: 'Glow over dramatic mountain summits',
      icon: '🏔️',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'aurora-lake',
      name: '🌌 Aurora Lake',
      desc: 'Vibrant celestial green aurora reflections',
      icon: '🌌',
      url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'tropical-rainforest',
      name: '🌿 Lush Rainforest',
      desc: 'Deep canopy sunbeams & dewy foliage',
      icon: '🌿',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'moraine-lake',
      name: '⛰️ Glacial Lake',
      desc: 'Turquoise alpine waters & rugged peaks',
      icon: '⛰️',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'pacific-coast',
      name: '🌊 Pacific Sunset',
      desc: 'Golden ocean horizon & gentle waves',
      icon: '🌊',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'mossy-waterfall',
      name: '💧 Jungle Waterfall',
      desc: 'Ethereal mist cascade & emerald moss',
      icon: '💧',
      url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'autumn-woods',
      name: '🍁 Golden Autumn',
      desc: 'Warm sunbeams piercing amber canopy',
      icon: '🍁',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'cherry-blossom',
      name: '🌸 Sakura Sunrise',
      desc: 'Morning dawn through blooming cherry trees',
      icon: '🌸',
      url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'iceland-canyon',
      name: '🌋 Icelandic Canyon',
      desc: 'Emerald cliffs and winding glacial river',
      icon: '🌋',
      url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'starry-galaxy',
      name: '✨ Cosmic Horizon',
      desc: 'Deep starry night sky and Milky Way galaxy',
      icon: '✨',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=85',
      thumb: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=75'
    },
    {
      id: 'none',
      name: '🔮 Cyber Mesh',
      desc: 'Original animated glowing mesh gradient',
      icon: '🔮',
      url: '',
      thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=75'
    }
  ],

  /**
   * Dynamic Live Scenic Nature Photos Pool for internet rotation
   */
  dynamicNaturePool: [
    { name: '🌲 Misty Pine Valley', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2560&q=85', icon: '🌲' },
    { name: '🏔️ Alpine Alps Sunset', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85', icon: '🏔️' },
    { name: '🌌 Aurora Night Lake', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2560&q=85', icon: '🌌' },
    { name: '🌿 Emerald Rainforest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=85', icon: '🌿' },
    { name: '⛰️ Banff Moraine Waters', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85', icon: '⛰️' },
    { name: '🌊 Pacific Golden Shore', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=85', icon: '🌊' },
    { name: '💧 Cascading Waterfall', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=2560&q=85', icon: '💧' },
    { name: '🍁 Sunlit Autumn Canopy', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2560&q=85', icon: '🍁' },
    { name: '🌸 Sakura Morning Grove', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2560&q=85', icon: '🌸' },
    { name: '🌋 Icelandic Green Fjord', url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=2560&q=85', icon: '🌋' },
    { name: '🏜️ Golden Sahara Dunes', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2560&q=85', icon: '🏜️' },
    { name: '❄️ Snowy Mountain Peak', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=2560&q=85', icon: '❄️' },
    { name: '🌅 Serene Mountain Dusk', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2560&q=85', icon: '🌅' },
    { name: '🏞️ Lush Emerald Valley', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2560&q=85', icon: '🏞️' },
    { name: '✨ Starry Cosmic Galaxy', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=85', icon: '✨' },
    { name: '🍃 Bamboo Forest Path', url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=2560&q=85', icon: '🍃' },
    { name: '🌲 Misty Redwood National Park', url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=2560&q=85', icon: '🌲' },
    { name: '🏔️ Lake Tahoe Horizon', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2560&q=85', icon: '🏔️' }
  ],

  /**
   * Initialize Natural Wallpaper & Frosted Blur Studio
   */
  async initWallpaper() {
    const data = await StorageManager.get('settings');
    const settings = data.settings || {};
    const autoChange = settings.wallpaperAutoChange !== false;
    const wallpaperId = settings.wallpaper !== undefined ? settings.wallpaper : 'dynamic-nature';
    const blur = settings.wallpaperBlur !== undefined ? Number(settings.wallpaperBlur) : 14;
    const overlay = settings.wallpaperOverlay !== undefined ? Number(settings.wallpaperOverlay) : 40;

    // Render gallery thumbnails
    this.renderWallpaperGallery(wallpaperId);

    // If autoChange is enabled or dynamic-nature is active, fetch a fresh wallpaper from internet
    if (autoChange || wallpaperId === 'dynamic-nature') {
      await this.fetchRandomInternetWallpaper(false, blur, overlay);
    } else {
      this.applyWallpaper(wallpaperId, blur, overlay, false);
    }

    // Auto-change checkbox handler
    const autoCheckbox = document.getElementById('checkbox-auto-wallpaper');
    if (autoCheckbox) {
      autoCheckbox.checked = autoChange;
      autoCheckbox.addEventListener('change', async (e) => {
        const curData = await StorageManager.get('settings');
        const curSettings = curData.settings || {};
        curSettings.wallpaperAutoChange = e.target.checked;
        await StorageManager.set({ settings: curSettings });
        this.showToast(e.target.checked ? '🌐 Auto-refresh wallpaper from internet enabled' : 'Auto-refresh wallpaper disabled', 'info');
      });
    }

    // Fetch Live Internet Wallpaper button
    const fetchLiveBtn = document.getElementById('btn-fetch-live-wallpaper');
    if (fetchLiveBtn) {
      fetchLiveBtn.addEventListener('click', () => {
        this.fetchRandomInternetWallpaper(true);
      });
    }

    // Blur slider handler
    const blurInput = document.getElementById('input-wallpaper-blur');
    if (blurInput) {
      blurInput.value = blur;
      this.updateBlurBadge(blur);

      blurInput.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.setWallpaperBlur(val);
      });

      blurInput.addEventListener('change', async (e) => {
        const val = Number(e.target.value);
        const curData = await StorageManager.get('settings');
        const curSettings = curData.settings || {};
        curSettings.wallpaperBlur = val;
        await StorageManager.set({ settings: curSettings });
      });
    }

    // Blur preset pills
    document.querySelectorAll('.wallpaper-preset-pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = Number(btn.getAttribute('data-blur'));
        if (blurInput) blurInput.value = val;
        this.setWallpaperBlur(val);
        const curData = await StorageManager.get('settings');
        const curSettings = curData.settings || {};
        curSettings.wallpaperBlur = val;
        await StorageManager.set({ settings: curSettings });
      });
    });

    // Dimming / Overlay slider handler
    const overlayInput = document.getElementById('input-wallpaper-overlay');
    if (overlayInput) {
      overlayInput.value = overlay;
      this.updateOverlayBadge(overlay);

      overlayInput.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.setWallpaperOverlay(val);
      });

      overlayInput.addEventListener('change', async (e) => {
        const val = Number(e.target.value);
        const curData = await StorageManager.get('settings');
        const curSettings = curData.settings || {};
        curSettings.wallpaperOverlay = val;
        await StorageManager.set({ settings: curSettings });
      });
    }

    // Random Curated Wallpaper button
    const randomBtn = document.getElementById('btn-random-wallpaper');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        this.fetchRandomInternetWallpaper(true);
      });
    }

    // Remove Wallpaper / Cyber Mesh button
    const removeBtn = document.getElementById('btn-remove-wallpaper');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.applyWallpaper('none', undefined, undefined, true);
      });
    }

    // Custom Wallpaper URL button
    const applyCustomBtn = document.getElementById('btn-apply-custom-wallpaper');
    const customUrlInput = document.getElementById('input-custom-wallpaper-url');
    if (applyCustomBtn && customUrlInput) {
      applyCustomBtn.addEventListener('click', () => {
        const url = customUrlInput.value.trim();
        if (url) {
          this.applyWallpaper(url, undefined, undefined, true);
          customUrlInput.value = '';
        } else {
          this.showToast('Please enter a valid image URL', 'error');
        }
      });
    }

    // Upload Local Photo handler
    const uploadInput = document.getElementById('input-upload-wallpaper');
    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          this.showToast('Please select a valid image file', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;
          this.applyWallpaper(dataUrl, undefined, undefined, true);
          this.showToast('Custom photo wallpaper applied!', 'success');
        };
        reader.readAsDataURL(file);
      });
    }

    // Fast Wallpaper Switcher button in Top Header
    const headerWallpaperBtn = document.getElementById('btn-header-wallpaper-toggle');
    if (headerWallpaperBtn) {
      headerWallpaperBtn.addEventListener('click', () => {
        this.fetchRandomInternetWallpaper(true);
      });
    }

    // Keyboard shortcut Alt+W to cycle/fetch new live natural wallpaper
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W') && !e.ctrlKey && !e.metaKey) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        e.preventDefault();
        this.fetchRandomInternetWallpaper(true);
      }
    });
  },

  /**
   * Fetch and smoothly preload a fresh live nature wallpaper from internet
   * @param {boolean} [showToastMsg=false]
   * @param {number} [blurVal]
   * @param {number} [overlayVal]
   */
  async fetchRandomInternetWallpaper(showToastMsg = false, blurVal, overlayVal) {
    const pool = this.dynamicNaturePool;
    const item = pool[Math.floor(Math.random() * pool.length)];
    if (!item) return;

    // Cache-busting timestamp to guarantee fresh network fetch
    const freshUrl = `${item.url}&sig=${Date.now()}`;

    // Preload image smoothly in the background
    const img = new Image();
    img.onload = () => {
      this.applyWallpaperDirect(freshUrl, item.name, item.icon, blurVal, overlayVal);
      if (showToastMsg) {
        this.showToast(`🌐 Live Wallpaper updated: ${item.name}`, 'success');
      }
    };
    img.onerror = () => {
      // Fallback to static direct URL
      this.applyWallpaperDirect(item.url, item.name, item.icon, blurVal, overlayVal);
      if (showToastMsg) {
        this.showToast(`Wallpaper updated: ${item.name}`, 'success');
      }
    };
    img.src = freshUrl;
  },

  /**
   * Render thumbnail cards in Wallpaper Gallery
   * @param {string} activeId
   */
  renderWallpaperGallery(activeId) {
    const grid = document.getElementById('wallpaper-gallery-grid');
    if (!grid) return;

    grid.innerHTML = this.naturalWallpapers.map(wp => {
      const isActive = wp.id === activeId || (wp.url && activeId === wp.url);
      const isLive = wp.isLive ? 'live-nature-card' : '';
      return `
        <div class="wallpaper-thumb-card ${isLive} ${isActive ? 'active' : ''}" data-wallpaper-id="${wp.id}" title="${wp.name} — ${wp.desc}">
          ${wp.isLive ? '<span class="wallpaper-live-tag">LIVE ROTATING</span>' : ''}
          <img class="wallpaper-thumb-img" src="${wp.thumb}" alt="${wp.name}" loading="lazy" />
          <div class="wallpaper-thumb-overlay"></div>
          <div class="wallpaper-active-badge">✓</div>
          <div class="wallpaper-thumb-info">
            <span class="wallpaper-thumb-name">${wp.name}</span>
            <span class="wallpaper-thumb-desc">${wp.desc}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    grid.querySelectorAll('.wallpaper-thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const wpId = card.getAttribute('data-wallpaper-id');
        if (wpId === 'dynamic-nature') {
          this.fetchRandomInternetWallpaper(true);
        } else if (wpId) {
          this.applyWallpaper(wpId, undefined, undefined, true);
        }
      });
    });
  },

  /**
   * Apply natural wallpaper, blur, and opacity
   * @param {string} idOrUrl
   * @param {number} [blurVal]
   * @param {number} [overlayVal]
   * @param {boolean} [showToastMsg=false]
   */
  async applyWallpaper(idOrUrl, blurVal, overlayVal, showToastMsg = false) {
    const item = this.naturalWallpapers.find(w => w.id === idOrUrl || (w.url && w.url === idOrUrl));
    if (idOrUrl === 'dynamic-nature') {
      return this.fetchRandomInternetWallpaper(showToastMsg, blurVal, overlayVal);
    }
    const isNone = idOrUrl === 'none' || (!item && !idOrUrl);
    const wallpaperUrl = item ? item.url : idOrUrl;
    const wallpaperName = item ? item.name : 'Custom Wallpaper';
    const icon = item ? item.icon : '🖼️';

    await this.applyWallpaperDirect(wallpaperUrl, wallpaperName, icon, blurVal, overlayVal, isNone);
    if (showToastMsg) {
      if (isNone) this.showToast('Background set to Dynamic Cyber Mesh', 'info');
      else this.showToast(`Wallpaper applied: ${wallpaperName}`, 'success');
    }
  },

  /**
   * Directly apply wallpaper background, filters, and state
   */
  async applyWallpaperDirect(wallpaperUrl, wallpaperName, icon = '🌲', blurVal, overlayVal, isNone = false) {
    const wallpaperEl = document.getElementById('ambient-wallpaper');
    const overlayEl = document.getElementById('ambient-wallpaper-overlay');
    const toggleIcon = document.getElementById('wallpaper-toggle-icon');

    const data = await StorageManager.get('settings');
    const settings = data.settings || {};

    const blur = blurVal !== undefined ? blurVal : (settings.wallpaperBlur !== undefined ? Number(settings.wallpaperBlur) : 14);
    const overlay = overlayVal !== undefined ? overlayVal : (settings.wallpaperOverlay !== undefined ? Number(settings.wallpaperOverlay) : 40);

    // Set CSS properties
    this.setWallpaperBlur(blur);
    this.setWallpaperOverlay(overlay);

    if (isNone || !wallpaperUrl) {
      if (wallpaperEl) {
        wallpaperEl.style.backgroundImage = 'none';
        wallpaperEl.classList.remove('active');
      }
      if (overlayEl) overlayEl.classList.remove('active');
      document.body.classList.remove('has-wallpaper');
      if (toggleIcon) toggleIcon.textContent = '🔮';
      settings.wallpaper = 'none';
    } else {
      if (wallpaperEl) {
        wallpaperEl.style.backgroundImage = `url('${wallpaperUrl}')`;
        wallpaperEl.classList.add('active');
      }
      if (overlayEl) overlayEl.classList.add('active');
      document.body.classList.add('has-wallpaper');
      if (toggleIcon) toggleIcon.textContent = icon || '🌲';
      settings.wallpaper = wallpaperUrl;
    }

    settings.wallpaperBlur = blur;
    settings.wallpaperOverlay = overlay;
    await StorageManager.set({ settings });

    // Update active highlight in gallery cards
    document.querySelectorAll('.wallpaper-thumb-card').forEach(card => {
      const cId = card.getAttribute('data-wallpaper-id');
      if (isNone && cId === 'none') {
        card.classList.add('active');
      } else if (!isNone && (card.getAttribute('data-wallpaper-id') === 'dynamic-nature' || card.getAttribute('data-wallpaper-id') === settings.wallpaper)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  },

  /**
   * Set wallpaper frosted blur filter
   * @param {number} px
   */
  setWallpaperBlur(px) {
    document.documentElement.style.setProperty('--wallpaper-blur', `${px}px`);
    this.updateBlurBadge(px);

    // Update active preset button
    document.querySelectorAll('.wallpaper-preset-pill').forEach(btn => {
      const btnBlur = Number(btn.getAttribute('data-blur'));
      if (btnBlur === px) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  /**
   * Set wallpaper overlay opacity (contrast dimming)
   * @param {number} percentage 0 - 100
   */
  setWallpaperOverlay(percentage) {
    const decimal = Math.max(0.1, Math.min(0.9, percentage / 100));
    document.documentElement.style.setProperty('--wallpaper-overlay-opacity', `${decimal}`);
    this.updateOverlayBadge(percentage);
  },

  /**
   * Update blur value badge
   * @param {number} px
   */
  updateBlurBadge(px) {
    const badge = document.getElementById('wallpaper-blur-val-badge');
    if (!badge) return;
    let label = 'Frosted Glass';
    if (px === 0) label = 'Crisp HD';
    else if (px <= 6) label = 'Soft Focus';
    else if (px <= 16) label = 'Frosted Glass';
    else label = 'Deep Dream';
    badge.textContent = `${px}px • ${label}`;
  },

  /**
   * Update overlay value badge
   * @param {number} pct
   */
  updateOverlayBadge(pct) {
    const badge = document.getElementById('wallpaper-overlay-val-badge');
    if (badge) badge.textContent = `${pct}%`;
  },

  /**
   * Fast cycle to next natural wallpaper
   */
  async cycleWallpaper() {
    this.fetchRandomInternetWallpaper(true);
  },

  /**
   * Interactive Spotlight & 3D Tilt Sheen Cursor Tracking
   * Tracks cursor position on interactive cards and passes --mouse-x / --mouse-y coordinates
   */
  initSpotlightTracking() {
    const selector = '.tool-card, .mini-tool-card, .stack-card, .router-hero, .api-config-card, .settings-card, .theme-mode-card, .cache-hero-card';

    document.addEventListener('mousemove', (e) => {
      const targetCard = e.target.closest(selector);
      if (!targetCard) return;

      const rect = targetCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      targetCard.style.setProperty('--mouse-x', `${x}px`);
      targetCard.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  },

  /**
   * Initialize modal triggers and close buttons
   */
  initModals() {
    // Open Modal buttons
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-open-modal');
        const modal = document.getElementById(targetId);
        const form = modal ? modal.querySelector('form') : null;
        if (form) {
          form.reset();
          delete form.dataset.editId;

          // Reset headers and submit buttons to default Add mode
          const titleEl = modal.querySelector('.modal-header h3');
          const submitBtn = form.querySelector('button[type="submit"]');

          if (targetId === 'modal-add-tool') {
            if (titleEl) titleEl.textContent = 'Add Custom AI Tool';
            if (submitBtn) submitBtn.textContent = 'Save Tool';
          } else if (targetId === 'modal-add-stack') {
            if (titleEl) titleEl.textContent = 'Create One-Click AI Stack';
            if (submitBtn) submitBtn.textContent = 'Create Stack';
            // Re-render tool checkboxes
            const cbContainer = document.getElementById('stack-tools-checkboxes');
            if (cbContainer && typeof ToolsManager !== 'undefined') {
              cbContainer.innerHTML = ToolsManager.toolsList.map(t => `
                <label class="ai-checkbox-label" style="font-size: 12px; padding: 4px 8px;">
                  <input type="checkbox" value="${t.id}">
                  <span>${t.name}</span>
                </label>
              `).join('');
            }
          } else if (targetId === 'modal-add-workspace') {
            if (titleEl) titleEl.textContent = 'Create Project Workspace';
            if (submitBtn) submitBtn.textContent = 'Create Workspace';
            // Re-render tool checkboxes
            const cbContainer = document.getElementById('ws-tools-checkboxes');
            if (cbContainer && typeof ToolsManager !== 'undefined') {
              cbContainer.innerHTML = ToolsManager.toolsList.map(t => `
                <label class="ai-checkbox-label" style="font-size: 12px; padding: 4px 8px;">
                  <input type="checkbox" value="${t.id}">
                  <span>${t.name}</span>
                </label>
              `).join('');
            }
          } else if (targetId === 'modal-add-prompt') {
            if (titleEl) titleEl.textContent = 'Save Prompt Template';
            if (submitBtn) submitBtn.textContent = 'Save Prompt';
          }
        }
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
    // Test URL button in Add/Edit Tool modal
    const testToolUrlBtn = document.getElementById('btn-test-tool-url');
    if (testToolUrlBtn) {
      testToolUrlBtn.addEventListener('click', () => {
        let url = (document.getElementById('input-tool-url')?.value || '').trim();
        if (!url) {
          this.showToast('Please enter a URL first to test', 'warning');
          return;
        }
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
          const urlInput = document.getElementById('input-tool-url');
          if (urlInput) urlInput.value = url;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    }

    // Add / Edit Tool Form
    const addToolForm = document.getElementById('form-add-tool');
    if (addToolForm) {
      addToolForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const toolData = {
          name: document.getElementById('input-tool-name').value,
          url: document.getElementById('input-tool-url').value,
          category: document.getElementById('select-tool-category').value,
          description: document.getElementById('input-tool-description').value,
          tags: document.getElementById('input-tool-tags').value,
          iconBg: document.getElementById('input-tool-icon-bg').value,
          iconText: document.getElementById('input-tool-icon-text').value,
          favorite: document.getElementById('checkbox-tool-favorite').checked
        };

        const editId = addToolForm.dataset.editId;
        const success = editId
          ? await ToolsManager.updateCustomTool(editId, toolData)
          : await ToolsManager.addCustomTool(toolData);

        if (success) {
          addToolForm.reset();
          delete addToolForm.dataset.editId;
          this.closeAllModals();
        }
      });
    }

    // Add / Edit Stack Form
    const addStackForm = document.getElementById('form-add-stack');
    if (addStackForm) {
      addStackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedToolCheckboxes = document.querySelectorAll('#stack-tools-checkboxes input:checked');
        const toolIds = Array.from(selectedToolCheckboxes).map(cb => cb.value);

        const stackData = {
          name: document.getElementById('input-stack-name').value,
          description: document.getElementById('input-stack-description').value,
          toolIds: toolIds
        };

        const editId = addStackForm.dataset.editId;
        const success = editId
          ? await WorkflowManager.updateStack(editId, stackData)
          : await WorkflowManager.createStack(stackData);

        if (success) {
          addStackForm.reset();
          delete addStackForm.dataset.editId;
          this.closeAllModals();
        }
      });
    }

    // Add / Edit Prompt Form
    const addPromptForm = document.getElementById('form-add-prompt');
    if (addPromptForm) {
      addPromptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const promptData = {
          title: document.getElementById('input-prompt-title').value,
          category: document.getElementById('select-prompt-category').value,
          content: document.getElementById('input-prompt-content').value,
          tags: document.getElementById('input-prompt-tags').value
        };

        const editId = addPromptForm.dataset.editId;
        const success = editId
          ? await PromptLibrary.updatePrompt(editId, promptData)
          : await PromptLibrary.addPrompt(promptData);

        if (success) {
          addPromptForm.reset();
          delete addPromptForm.dataset.editId;
          this.closeAllModals();
        }
      });
    }

    // Add / Edit Workspace Form
    const addWorkspaceForm = document.getElementById('form-add-workspace');
    if (addWorkspaceForm) {
      addWorkspaceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedToolCheckboxes = document.querySelectorAll('#ws-tools-checkboxes input:checked');
        const toolIds = Array.from(selectedToolCheckboxes).map(cb => cb.value);

        const wsData = {
          name: document.getElementById('input-ws-name').value,
          description: document.getElementById('input-ws-description').value,
          notes: document.getElementById('input-ws-notes').value,
          toolIds: toolIds
        };

        const editId = addWorkspaceForm.dataset.editId;
        const success = editId
          ? await WorkspaceManager.updateWorkspace(editId, wsData)
          : await WorkspaceManager.createWorkspace(wsData);

        if (success) {
          addWorkspaceForm.reset();
          delete addWorkspaceForm.dataset.editId;
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

    // Temperature slider live text display
    const tempInput = document.getElementById('input-gemini-temperature');
    const tempLabel = document.getElementById('label-gemini-temp-val');
    if (tempInput && tempLabel) {
      tempInput.addEventListener('input', () => {
        tempLabel.textContent = parseFloat(tempInput.value).toFixed(2);
      });
    }

    // Save & Test Gemini Configuration Form
    if (configForm) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = (keyInput ? keyInput.value : '').trim();
        const model = modelSelect ? modelSelect.value : 'gemini-2.0-flash';
        const persona = personaSelect ? personaSelect.value : 'expert_architect';
        const temperature = parseFloat(document.getElementById('input-gemini-temperature')?.value || '0.7');
        const maxOutputTokens = parseInt(document.getElementById('select-gemini-max-tokens')?.value || '2048', 10);

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

          await GeminiClient.saveConfig({ apiKey, model: effectiveModel, persona, temperature, maxOutputTokens });
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
  },

  /**
   * Universal HTML Escape Sanitizer
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
   * Glassmorphic Custom Confirmation Modal (Promise-based)
   * Replaces native window.confirm() with non-blocking UI
   * @param {object} options { title, message, confirmText, danger }
   * @returns {Promise<boolean>}
   */
  confirm(options = {}) {
    return new Promise((resolve) => {
      const title = options.title || 'Confirm Action';
      const message = options.message || 'Are you sure you want to proceed?';
      const confirmText = options.confirmText || 'Confirm';
      const isDanger = options.danger !== false;

      const modalEl = document.createElement('div');
      modalEl.className = 'modal-backdrop open active';
      modalEl.style.zIndex = '100000';
      modalEl.innerHTML = `
        <div class="modal-dialog" style="max-width: 420px; text-align: center; padding: 28px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: ${isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)'}; border: 1px solid ${isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 22px;">
            ${isDanger ? '🗑️' : '❓'}
          </div>
          <h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-main);">${this.escapeHtml(title)}</h3>
          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5;">${this.escapeHtml(message)}</p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="ui-confirm-cancel-btn" class="btn-secondary" style="flex: 1; justify-content: center;">Cancel</button>
            <button id="ui-confirm-ok-btn" class="btn-primary" style="flex: 1; justify-content: center; ${isDanger ? 'background: #ef4444; border-color: transparent; color: #fff;' : ''}">${this.escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);

      const cleanup = (result) => {
        modalEl.classList.remove('open', 'active');
        setTimeout(() => modalEl.remove(), 150);
        resolve(result);
      };

      modalEl.querySelector('#ui-confirm-cancel-btn')?.addEventListener('click', () => cleanup(false));
      modalEl.querySelector('#ui-confirm-ok-btn')?.addEventListener('click', () => cleanup(true));
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) cleanup(false);
      });
    });
  }
};
