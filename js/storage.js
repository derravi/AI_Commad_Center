/**
 * AI Command Center - Unified Storage Adapter
 * Wraps chrome.storage.local with automatic localStorage fallback for seamless development & runtime.
 */
const StorageManager = {
  isExtension: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local,

  /**
   * Get items by key from storage
   * @param {string|string[]} keys
   * @returns {Promise<any>}
   */
  async get(keys) {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(result || {});
        });
      });
    } else {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => {
        const item = localStorage.getItem(`aicc_${k}`);
        if (item) {
          try {
            result[k] = JSON.parse(item);
          } catch (e) {
            result[k] = item;
          }
        }
      });
      return result;
    }
  },

  /**
   * Save items to storage
   * @param {object} items
   * @returns {Promise<void>}
   */
  async set(items) {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else {
      Object.keys(items).forEach((k) => {
        localStorage.setItem(`aicc_${k}`, JSON.stringify(items[k]));
      });
    }
  },

  /**
   * Remove item from storage
   * @param {string|string[]} keys
   * @returns {Promise<void>}
   */
  async remove(keys) {
    if (this.isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach((k) => localStorage.removeItem(`aicc_${k}`));
    }
  },

  /**
   * Initialize initial state if empty
   */
  async initDefaults() {
    const data = await this.get(['tools', 'stacks', 'prompts', 'workspaces', 'settings', 'recentTools', 'localhostTabs']);
    
    // Seed default tools if none exist
    if (!data.tools || !Array.isArray(data.tools) || data.tools.length === 0) {
      await this.set({ tools: DEFAULT_TOOLS });
    }

    // Seed default stacks if none exist
    if (!data.stacks || !Array.isArray(data.stacks) || data.stacks.length === 0) {
      const defaultStacks = [
        {
          id: 'ml-stack',
          name: 'Machine Learning & Data Stack',
          description: 'Comprehensive workflow for training models, data analysis, and literature review.',
          toolIds: ['chatgpt', 'claude', 'cursor', 'kaggle', 'google-colab', 'perplexity']
        },
        {
          id: 'webdev-stack',
          name: 'Modern Full-Stack Dev',
          description: 'Rapid UI prototyping, coding agent, component generator, and debugging.',
          toolIds: ['cursor', 'v0', 'bolt-new', 'chatgpt', 'perplexity']
        },
        {
          id: 'content-creator-stack',
          name: 'Content & Media Creator',
          description: 'Generative art, scriptwriting, voiceover synthesis, and video creation.',
          toolIds: ['midjourney', 'runway', 'elevenlabs', 'claude', 'canva-magic']
        },
        {
          id: 'research-stack',
          name: 'Deep Research & Literature Stack',
          description: 'Peer-reviewed evidence search, literature synthesis, and paper writing.',
          toolIds: ['perplexity', 'consensus', 'elicit', 'claude']
        }
      ];
      await this.set({ stacks: defaultStacks });
    }

    // Seed default prompt templates if none exist
    if (!data.prompts || !Array.isArray(data.prompts) || data.prompts.length === 0) {
      const defaultPrompts = [
        {
          id: 'p1',
          title: 'Senior Architect Code Review',
          category: 'coding',
          content: 'You are a Principal Software Architect. Review this code for performance bottlenecks, edge-case vulnerability, modularity, and clean-code principles:\n\n[PASTE CODE HERE]',
          tags: ['architecture', 'code-review', 'clean-code']
        },
        {
          id: 'p2',
          title: 'Deep Research Synthesis & Counterarguments',
          category: 'research',
          content: 'Conduct an exhaustive deep dive on the following topic. Provide historical background, current state of the art, empirical consensus, top 3 counterarguments, and unanswered questions:\n\nTopic: [INSERT TOPIC]',
          tags: ['research', 'literature', 'analysis']
        },
        {
          id: 'p3',
          title: 'Exploratory Data Analysis (EDA) Blueprint',
          category: 'data',
          content: 'Write a clean Python script using Pandas, Seaborn, and Scikit-Learn to perform automated Exploratory Data Analysis on a dataset with columns: [LIST COLUMNS]. Include missing value imputation, correlation heatmaps, and outlier detection.',
          tags: ['eda', 'python', 'pandas']
        },
        {
          id: 'p4',
          title: 'Midjourney Photorealistic Prompt Master',
          category: 'image',
          content: 'Cinematic wide-angle shot of [SUBJECT], dramatic volumetric lighting, shot on 35mm lens f/1.8, Kodak Portra 400, hyper-detailed texture, 8k resolution, photorealistic, Unreal Engine 5 render style --ar 16:9 --v 6.0',
          tags: ['midjourney', 'photorealism', 'prompt-craft']
        },
        {
          id: 'p5',
          title: 'Executive Summary & Action Items',
          category: 'writing',
          content: 'Synthesize the following meeting notes or transcript into: 1. Executive Summary (3 sentences), 2. Key Decisions Made, 3. Action Items with Owner and Deadlines:\n\n[PASTE NOTES]',
          tags: ['productivity', 'executive', 'meeting']
        }
      ];
      await this.set({ prompts: defaultPrompts });
    }

    // Seed default workspace if none exist
    if (!data.workspaces || !Array.isArray(data.workspaces) || data.workspaces.length === 0) {
      const defaultWorkspaces = [
        {
          id: 'ws-main',
          name: 'AI Engineering & Research',
          description: 'Daily workspace for AI development, coding models, and reading papers.',
          toolIds: ['cursor', 'chatgpt', 'claude', 'perplexity', 'huggingface'],
          notes: '📌 Current focus: Fine-tuning local models & building AI Command Center features.',
          promptIds: ['p1', 'p2'],
          isDefault: true
        }
      ];
      await this.set({ workspaces: defaultWorkspaces });
    }

    // Seed default settings if none exist
    if (!data.settings) {
      const defaultSettings = {
        theme: 'dark',
        accentColor: '#6366f1',
        searchEngine: 'google',
        openInNewTab: true,
        showFavorites: true,
        showRecents: true,
        showRouterHero: true
      };
      await this.set({ settings: defaultSettings });
    }

    if (!data.recentTools) {
      await this.set({ recentTools: [] });
    }

    // Seed default localhost quick access tabs if none exist
    if (!data.localhostTabs || !Array.isArray(data.localhostTabs) || data.localhostTabs.length === 0) {
      const defaultLocalhosts = [
        { id: 'lh-8000', url: 'localhost:8000', port: '8000', created: 1 },
        { id: 'lh-5000', url: 'localhost:5000', port: '5000', created: 2 },
        { id: 'lh-3000', url: 'localhost:3000', port: '3000', created: 3 },
        { id: 'lh-8080', url: 'localhost:8080', port: '8080', created: 4 }
      ];
      await this.set({ localhostTabs: defaultLocalhosts });
    }
  },

  /**
   * Export all data to JSON file
   */
  async exportBackup() {
    const allData = await this.get(['tools', 'stacks', 'prompts', 'workspaces', 'settings', 'recentTools', 'customSearchEngines', 'localhostTabs']);
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-command-center-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import data from JSON string with schema validation
   * @param {string} jsonString
   * @returns {Promise<boolean>}
   */
  async importBackup(jsonString) {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        throw new Error('Backup data must be a non-empty string');
      }

      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Backup root must be an object');
      }

      const allowedArrayKeys = ['tools', 'stacks', 'prompts', 'workspaces', 'recentTools', 'customSearchEngines', 'localhostTabs'];
      const allowedObjectKeys = ['settings', 'geminiConfig'];
      const allowedPrimitiveKeys = ['activeSearchEngine'];
      const allowedKeys = [...allowedArrayKeys, ...allowedObjectKeys, ...allowedPrimitiveKeys];

      const validatedData = {};
      let validKeyCount = 0;

      for (const [key, value] of Object.entries(parsed)) {
        if (!allowedKeys.includes(key)) {
          // Skip unrecognized keys to prevent storage pollution
          continue;
        }

        if (allowedArrayKeys.includes(key)) {
          if (!Array.isArray(value)) {
            throw new Error(`Field "${key}" must be an array`);
          }
          // Validate array items structure
          if (key === 'tools') {
            for (const item of value) {
              if (!item || typeof item !== 'object' || !item.id || !item.name || !item.url) {
                throw new Error('Tools array contains invalid items (missing id, name, or url)');
              }
            }
          } else if (key === 'stacks') {
            for (const item of value) {
              if (!item || typeof item !== 'object' || !item.id || !item.name || !Array.isArray(item.toolIds)) {
                throw new Error('Stacks array contains invalid items (missing id, name, or toolIds)');
              }
            }
          } else if (key === 'prompts') {
            for (const item of value) {
              if (!item || typeof item !== 'object' || !item.id || !item.title) {
                throw new Error('Prompts array contains invalid items (missing id or title)');
              }
            }
          } else if (key === 'workspaces') {
            for (const item of value) {
              if (!item || typeof item !== 'object' || !item.id || !item.name) {
                throw new Error('Workspaces array contains invalid items (missing id or name)');
              }
            }
          }
          validatedData[key] = value;
          validKeyCount++;
        } else if (allowedObjectKeys.includes(key)) {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`Field "${key}" must be a valid object`);
          }
          validatedData[key] = value;
          validKeyCount++;
        } else if (allowedPrimitiveKeys.includes(key)) {
          if (typeof value !== 'string') {
            throw new Error(`Field "${key}" must be a string`);
          }
          validatedData[key] = value;
          validKeyCount++;
        }
      }

      if (validKeyCount === 0) {
        throw new Error('No valid AI Command Center data found in backup file');
      }

      await this.set(validatedData);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`Import failed: ${e.message}`, 'error');
      }
      return false;
    }
  }
};
