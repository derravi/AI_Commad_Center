/**
 * AI Command Center - Smart AI Router & Task Recommender
 * Integrates Google Gemini API for real-time dynamic multi-agent architecture synthesis
 * with seamless offline rule-based intent classification.
 */
const SmartRouter = {
  // Built-in Task Knowledge Base & AI Tool Mappings (Offline Fallback)
  intentRules: [
    {
      keywords: ['machine learning', 'ml', 'train model', 'deep learning', 'pytorch', 'tensorflow', 'neural network'],
      domain: 'Machine Learning Engineering',
      recommendations: [
        { toolId: 'perplexity', role: 'Research & Literature', reason: 'Find state-of-the-art papers and proven model architectures with direct citations.' },
        { toolId: 'chatgpt', role: 'Algorithm Design & Math', reason: 'Formulate mathematical objective functions and debugging training logic.' },
        { toolId: 'cursor', role: 'Model Implementation', reason: 'Write modular PyTorch/TensorFlow pipelines directly with repository context.' },
        { toolId: 'google-colab', role: 'GPU Training & Execution', reason: 'Execute notebook experiments with free cloud GPU acceleration.' }
      ]
    },
    {
      keywords: ['data analysis', 'csv', 'excel', 'dataset', 'pandas', 'statistics', 'charts', 'visualization'],
      domain: 'Data Science & Analysis',
      recommendations: [
        { toolId: 'julius-ai', role: 'Automated Data Exploration', reason: 'Upload CSV/Excel for instant chart generation, regression models, and insights.' },
        { toolId: 'claude', role: 'Data Interpretation', reason: 'Synthesize statistical tables and write executive-ready analytical summaries.' },
        { toolId: 'kaggle', role: 'Benchmark Datasets', reason: 'Explore community notebooks, baseline models, and high-quality open datasets.' }
      ]
    },
    {
      keywords: ['react', 'web dev', 'frontend', 'ui', 'website', 'landing page', 'tailwind', 'fullstack', 'css'],
      domain: 'Full-Stack Web Development',
      recommendations: [
        { toolId: 'v0', role: 'Generative UI Design', reason: 'Prompt accessible React components styled with Tailwind CSS.' },
        { toolId: 'cursor', role: 'Full-Stack Implementation', reason: 'AI code editor with whole-repo indexing and intelligent multi-file refactoring.' },
        { toolId: 'bolt-new', role: 'Instant Cloud Sandbox', reason: 'Run full-stack web apps in-browser with live dev server and instant deployment.' }
      ]
    },
    {
      keywords: ['research', 'paper', 'literature review', 'academic', 'citations', 'study', 'thesis'],
      domain: 'Academic & Literature Research',
      recommendations: [
        { toolId: 'perplexity', role: 'Real-time Web & Deep Research', reason: 'Perform exhaustive search across live sources with verified citations.' },
        { toolId: 'consensus', role: 'Peer-Reviewed Evidence', reason: 'Extract scientific claims and consensus meters from 200M+ research papers.' },
        { toolId: 'claude', role: 'Long-Form Synthesis', reason: 'Analyze 100k+ token documents to produce structured literature syntheses.' }
      ]
    },
    {
      keywords: ['image', 'logo', 'photorealism', 'art', 'banner', 'illustration', 'graphic'],
      domain: 'Generative Art & Graphic Design',
      recommendations: [
        { toolId: 'midjourney', role: 'Photorealistic Imagery', reason: 'Generate hyper-detailed artistic concepts, realistic lighting, and 8k visuals.' },
        { toolId: 'recraft', role: 'Vector Art & SVG Icons', reason: 'Generate brand-consistent vector graphics and clean 3D graphic elements.' },
        { toolId: 'canva-magic', role: 'Layout & Publishing', reason: 'Assemble visual assets into social banners, pitch decks, and mockups.' }
      ]
    },
    {
      keywords: ['video', 'animation', 'b-roll', 'avatar', 'cinematic', 'reels', 'youtube'],
      domain: 'AI Video Production',
      recommendations: [
        { toolId: 'runway', role: 'Cinematic Gen-3 Video', reason: 'Produce realistic camera motion, text-to-video scenes, and cinematic shots.' },
        { toolId: 'elevenlabs', role: 'Voiceover & Sound FX', reason: 'Synthesize natural, human-grade voiceovers and realistic sound effects.' },
        { toolId: 'heygen', role: 'AI Talking Avatar', reason: 'Generate presenter-style explainer videos with synchronized lip-sync.' }
      ]
    },
    {
      keywords: ['copywriting', 'blog', 'seo', 'marketing', 'article', 'newsletter', 'content'],
      domain: 'Content Marketing & Copywriting',
      recommendations: [
        { toolId: 'claude', role: 'Long-Form Storytelling', reason: 'Write deeply engaging, nuanced articles without generic AI tone.' },
        { toolId: 'copy-ai', role: 'Conversion Copywriting', reason: 'Draft high-converting ad copy, landing page headlines, and email flows.' },
        { toolId: 'grammarly', role: 'Tone & Proofreading', reason: 'Refine clarity, eliminate grammatical friction, and polish tone.' }
      ]
    }
  ],

  /**
   * Initialize Smart Router
   */
  init() {
    const routerInput = document.getElementById('smart-router-input');
    const routerBtn = document.getElementById('smart-router-btn');
    const quickTags = document.querySelectorAll('.quick-prompt-tag');

    if (routerBtn && routerInput) {
      routerBtn.addEventListener('click', () => {
        this.routeTask(routerInput.value);
      });

      routerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.routeTask(routerInput.value);
        }
      });
    }

    quickTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.getAttribute('data-query') || tag.textContent;
        if (routerInput) routerInput.value = query;
        this.routeTask(query);
      });
    });
  },

  /**
   * Route user task query (Real AI with Gemini or Offline Rules)
   * @param {string} taskDescription
   */
  async routeTask(taskDescription) {
    const query = (taskDescription || '').trim();
    if (!query) {
      UI.showToast('Please type a task or goal to get AI recommendations', 'warning');
      return;
    }

    // If Gemini is connected, use real-time dynamic AI synthesis
    if (typeof GeminiClient !== 'undefined' && GeminiClient.isConnected()) {
      UI.showToast('Synthesizing custom AI stack with Gemini...', 'info');
      this.showLoadingModal(query);

      try {
        const architecture = await GeminiClient.generateArchitecture(query);
        this.renderGeminiArchitectureModal(query, architecture);
      } catch (err) {
        console.warn('Gemini architecture failed, falling back to rule matching:', err);
        this.routeOfflineTask(query);
      }
    } else {
      // Offline rule matching fallback
      this.routeOfflineTask(query);
    }
  },

  /**
   * Show temporary loading indicator in router modal
   * @param {string} query
   */
  showLoadingModal(query) {
    const domainEl = document.getElementById('router-result-domain');
    const listEl = document.getElementById('router-recommendations-list');
    const launchAllBtn = document.getElementById('router-launch-all-btn');

    if (domainEl) {
      domainEl.textContent = 'Gemini AI Synthesizing...';
      domainEl.className = 'badge badge-accent';
    }

    if (listEl) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <div class="thinking-bubble" style="font-size: 15px; margin-bottom: 12px;">
            <span>Gemini 2.0 is designing your optimal workflow</span>
            <div class="thinking-dots">
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
              <span class="thinking-dot"></span>
            </div>
          </div>
          <p style="font-size: 13px; color: var(--text-dim);">Analyzing requirements: "${query}"</p>
        </div>
      `;
    }

    if (launchAllBtn) launchAllBtn.style.display = 'none';
    UI.openModal('router-result-modal');
  },

  /**
   * Helper to safely get current tools list
   */
  getTools() {
    if (typeof ToolsManager !== 'undefined' && Array.isArray(ToolsManager.toolsList)) {
      return ToolsManager.toolsList;
    }
    if (typeof DEFAULT_TOOLS !== 'undefined' && Array.isArray(DEFAULT_TOOLS)) {
      return DEFAULT_TOOLS;
    }
    return [];
  },

  /**
   * Helper to safely launch a tool by ID
   */
  launchTool(toolId, fallbackUrl) {
    if (typeof ToolsManager !== 'undefined' && typeof ToolsManager.launchTool === 'function') {
      ToolsManager.launchTool(toolId);
    } else if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Render dynamic Gemini Architecture in modal
   * @param {string} userGoal
   * @param {object} arch
   */
  renderGeminiArchitectureModal(userGoal, arch) {
    const domainEl = document.getElementById('router-result-domain');
    const listEl = document.getElementById('router-recommendations-list');
    const launchAllBtn = document.getElementById('router-launch-all-btn');
    const availableTools = this.getTools();

    if (domainEl) {
      domainEl.innerHTML = `✨ ${arch.domain || 'Dynamic AI Architecture'} <span style="font-size: 10px; opacity: 0.8;">(Gemini Real-Time)</span>`;
      domainEl.className = 'badge badge-accent';
    }

    if (listEl) {
      const steps = arch.steps || [];
      listEl.innerHTML = `
        ${arch.summary ? `<div style="padding: 10px 14px; background: var(--accent-glow, rgba(99, 102, 241, 0.1)); border: 1px solid var(--border-glow); border-radius: var(--radius-md); font-size: 13px; color: var(--text-main); margin-bottom: 10px;">💡 <strong>Strategy:</strong> ${arch.summary}</div>` : ''}
        ${steps.map((s, idx) => {
          // Attempt to match tool to known tool card
          const matchedTool = availableTools.find(t => 
            t.name.toLowerCase().includes((s.toolName || '').toLowerCase()) ||
            (s.toolName || '').toLowerCase().includes(t.name.toLowerCase())
          );

          const toolId = matchedTool ? matchedTool.id : 'perplexity';
          const toolName = s.toolName || (matchedTool ? matchedTool.name : 'AI Tool');
          const iconText = matchedTool ? (matchedTool.iconText || matchedTool.name.slice(0, 2).toUpperCase()) : `0${idx + 1}`;
          const iconBg = matchedTool ? matchedTool.iconBg : 'var(--accent-primary, #6366f1)';
          const targetUrl = matchedTool ? matchedTool.url : (s.url || 'https://www.google.com/search?q=' + encodeURIComponent(toolName));

          return `
            <div style="display: flex; gap: 14px; padding: 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); align-items: center;">
              <div class="mini-tool-avatar" style="background: ${iconBg}; width: 38px; height: 38px; font-size: 13px; flex-shrink: 0;">
                ${iconText}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <strong style="font-size: 14.5px; color: var(--text-main);">${toolName}</strong>
                  <span class="badge badge-accent" style="font-size: 10.5px;">${s.step || s.role || 'Phase ' + (idx + 1)}</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 3px; line-height: 1.4;">${s.reason || s.role || ''}</p>
              </div>
              <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;" data-action="open-url" data-url="${targetUrl}">
                Open
              </button>
            </div>
          `;
        }).join('')}
      `;

      listEl.querySelectorAll('[data-action="open-url"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.getAttribute('data-url');
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
      });
    }

    if (launchAllBtn) {
      launchAllBtn.style.display = 'inline-flex';
      launchAllBtn.onclick = () => {
        (arch.steps || []).forEach(s => {
          const matchedTool = availableTools.find(t => 
            t.name.toLowerCase().includes((s.toolName || '').toLowerCase()) ||
            (s.toolName || '').toLowerCase().includes(t.name.toLowerCase())
          );
          if (matchedTool) {
            this.launchTool(matchedTool.id);
          } else if (s.url) {
            window.open(s.url, '_blank', 'noopener,noreferrer');
          }
        });
        UI.closeAllModals();
        UI.showToast(`Launched AI architecture pipeline in tabs!`, 'success');
      };
    }
  },

  /**
   * Offline Intent Matching Fallback
   * @param {string} taskDescription
   */
  routeOfflineTask(taskDescription) {
    const query = taskDescription.toLowerCase();

    // Match intent
    let matchedRule = this.intentRules.find(rule => 
      rule.keywords.some(kw => query.includes(kw))
    );

    if (!matchedRule) {
      matchedRule = {
        domain: 'General Problem Solving & Workflow',
        recommendations: [
          { toolId: 'chatgpt', role: 'Strategic Planning & Breakdown', reason: 'Deconstruct complex goals into actionable step-by-step milestones.' },
          { toolId: 'claude', role: 'In-Depth Analysis & Writing', reason: 'Provide structured thinking, nuance, and clean documentation.' },
          { toolId: 'perplexity', role: 'Fact Discovery & Live Verification', reason: 'Gather up-to-date information and source-backed answers.' }
        ]
      };
    }

    this.showOfflineRecommendationModal(taskDescription, matchedRule);
  },

  /**
   * Show recommendation dialog for offline matched rule
   * @param {string} userTask
   * @param {object} rule
   */
  showOfflineRecommendationModal(userTask, rule) {
    const modal = document.getElementById('router-result-modal');
    if (!modal) return;

    const domainEl = document.getElementById('router-result-domain');
    const listEl = document.getElementById('router-recommendations-list');
    const launchAllBtn = document.getElementById('router-launch-all-btn');
    const availableTools = this.getTools();

    if (domainEl) {
      domainEl.textContent = `${rule.domain} (Rule Mode)`;
      domainEl.className = 'badge badge-accent';
    }

    if (listEl) {
      listEl.innerHTML = rule.recommendations.map(rec => {
        const tool = availableTools.find(t => t.id === rec.toolId) || { name: rec.toolId, iconBg: 'var(--accent-primary, #6366f1)', iconText: 'AI', id: rec.toolId };
        return `
          <div style="display: flex; gap: 14px; padding: 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); align-items: center;">
            <div class="mini-tool-avatar" style="background: ${tool.iconBg || 'var(--accent-primary, #6366f1)'}; width: 38px; height: 38px; font-size: 13px;">
              ${tool.iconText || tool.name.slice(0, 2).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="font-size: 15px; color: var(--text-main);">${tool.name}</strong>
                <span class="badge badge-accent" style="font-size: 10px;">${rec.role}</span>
              </div>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 3px;">${rec.reason}</p>
            </div>
            <button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" data-action="launch-tool" data-tool-id="${tool.id}">
              Open
            </button>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('[data-action="launch-tool"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const toolId = btn.getAttribute('data-tool-id');
          if (toolId) {
            this.launchTool(toolId);
          }
        });
      });
    }

    if (launchAllBtn) {
      launchAllBtn.style.display = 'inline-flex';
      launchAllBtn.onclick = () => {
        rule.recommendations.forEach(r => this.launchTool(r.toolId));
        UI.closeAllModals();
        UI.showToast(`Launched ${rule.recommendations.length} recommended AI tools!`, 'success');
      };
    }

    UI.openModal('router-result-modal');
  }
};
