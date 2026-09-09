/**
 * AI Command Center - Google Gemini API Client & Intelligence Engine
 * Handles real-time LLM inference, streaming chat, architecture synthesis, and prompt optimization.
 */
const GeminiClient = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  persona: 'expert_architect',

  // Available Gemini Models
  models: {
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash (Recommended)',
      tag: 'Ultra Fast & Intelligent',
      desc: 'Next-gen multimodal model with sub-second latency and exceptional coding/reasoning capabilities.'
    },
    'gemini-2.0-flash-lite': {
      name: 'Gemini 2.0 Flash Lite',
      tag: 'Ultra Low Latency',
      desc: 'Super-fast lightweight model optimized for high-throughput and quick responses.'
    },
    'gemini-1.5-flash': {
      name: 'Gemini 1.5 Flash',
      tag: 'Fast & Efficient',
      desc: 'High-speed model optimized for real-time copilot interactions and quick summaries.'
    },
    'gemini-1.5-pro-latest': {
      name: 'Gemini 1.5 Pro Latest',
      tag: 'Deep Reasoning',
      desc: 'Advanced reasoning model with 2M token context window for complex software architectures.'
    }
  },

  // System Personas for tailored responses
  personas: {
    expert_architect: 'You are the AI Command Center Core Intelligence. You are an elite Principal Software Architect, Full-Stack Engineer, and AI Tooling Strategist. Provide crisp, ultra-precise, actionable recommendations with clean code examples, step-by-step blueprints, and verified tool stacks. Use clean markdown formatting.',
    concise_copilot: 'You are a fast, concise AI Copilot. Give direct, bullet-pointed answers without unnecessary conversational fluff. Focus on immediate solutions and exact commands.',
    creative_strategist: 'You are a Creative AI Director and Prompt Engineer. Provide hyper-detailed, visionary prompts, artistic workflows, and design guidance.'
  },

  /**
   * Fetch available models directly from Google Gemini API
   * @param {string} [key]
   * @returns {Promise<Array<{id: string, name: string, desc: string}>>}
   */
  async fetchAvailableModels(key) {
    const apiKey = (key || this.apiKey || '').trim();
    if (!apiKey) return [];

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) return [];

      return data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => {
          const id = m.name.replace(/^models\//, '');
          return {
            id,
            name: m.displayName || id,
            desc: m.description || ''
          };
        });
    } catch (e) {
      console.warn('Failed to fetch available Gemini models:', e);
      return [];
    }
  },

  /**
   * Initialize Gemini Client from Storage
   */
  async init() {
    const data = await StorageManager.get(['geminiConfig']);
    if (data.geminiConfig) {
      this.apiKey = data.geminiConfig.apiKey || '';
      this.model = data.geminiConfig.model || 'gemini-2.0-flash';
      this.persona = data.geminiConfig.persona || 'expert_architect';
    }

    this.updateUIStatus();
  },

  /**
   * Check if Gemini API is connected
   * @returns {boolean}
   */
  isConnected() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 15);
  },

  /**
   * Save Gemini Configuration
   * @param {object} config { apiKey, model, persona }
   */
  async saveConfig({ apiKey, model, persona }) {
    this.apiKey = (apiKey || '').trim();
    this.model = model || 'gemini-2.0-flash';
    this.persona = persona || 'expert_architect';

    await StorageManager.set({
      geminiConfig: {
        apiKey: this.apiKey,
        model: this.model,
        persona: this.persona
      }
    });

    this.updateUIStatus();
  },

  /**
   * Disconnect and clear API key
   */
  async clearConfig() {
    this.apiKey = '';
    await StorageManager.set({
      geminiConfig: {
        apiKey: '',
        model: this.model,
        persona: this.persona
      }
    });
    this.updateUIStatus();
  },

  /**
   * Update all UI elements showing Gemini status
   */
  updateUIStatus() {
    const isConn = this.isConnected();

    // Header & Sidebar Badges
    const navBadge = document.getElementById('gemini-status-nav-badge');
    if (navBadge) {
      if (isConn) {
        navBadge.textContent = 'ONLINE ⚡';
        navBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        navBadge.style.color = '#10b981';
      } else {
        navBadge.textContent = 'STATIC';
        navBadge.style.background = 'rgba(148, 163, 184, 0.15)';
        navBadge.style.color = 'var(--text-muted)';
      }
    }

    // System Status Pill in Sidebar Footer
    const footerStatus = document.querySelector('.system-status-pill');
    if (footerStatus) {
      if (isConn) {
        footerStatus.innerHTML = `
          <div>
            <span class="status-indicator" style="background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            <span>Gemini 2.0 Live</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 10px; color: #10b981;">AI ACTIVE</span>
        `;
      } else {
        footerStatus.innerHTML = `
          <div>
            <span class="status-indicator"></span>
            <span>All AI Systems Online</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 10px;">MV3</span>
        `;
      }
    }

    // API Hub View Elements
    const hubStatusIndicator = document.getElementById('hub-connection-indicator');
    const hubStatusText = document.getElementById('hub-connection-status-text');
    const hubModelDisplay = document.getElementById('hub-connected-model');
    const apiKeyInput = document.getElementById('input-gemini-key');
    const modelSelect = document.getElementById('select-gemini-model');
    const personaSelect = document.getElementById('select-gemini-persona');

    if (hubStatusIndicator && hubStatusText) {
      if (isConn) {
        hubStatusIndicator.style.background = '#10b981';
        hubStatusIndicator.style.boxShadow = '0 0 12px #10b981';
        hubStatusText.textContent = 'Connected & Active (Real AI Powered)';
        hubStatusText.style.color = '#10b981';
      } else {
        hubStatusIndicator.style.background = '#94a3b8';
        hubStatusIndicator.style.boxShadow = 'none';
        hubStatusText.textContent = 'Offline (Static Rules Mode)';
        hubStatusText.style.color = 'var(--text-muted)';
      }
    }

    if (hubModelDisplay) {
      hubModelDisplay.textContent = this.models[this.model]?.name || this.model;
    }

    if (apiKeyInput && !apiKeyInput.value && this.apiKey) {
      apiKeyInput.value = this.apiKey;
    }

    if (modelSelect && this.model) {
      modelSelect.value = this.model;
    }

    if (personaSelect && this.persona) {
      personaSelect.value = this.persona;
    }

    // Update Assistant Side Drawer status
    if (typeof AssistantManager !== 'undefined' && AssistantManager.updateDrawerStatus) {
      AssistantManager.updateDrawerStatus();
    }
  },

  /**
   * Test connection to Gemini API
   * @param {string} testKey
   * @param {string} testModel
   * @returns {Promise<{success: boolean, latency?: number, message?: string, model?: string, fallbackNotice?: string, error?: string}>}
   */
  async testConnection(testKey, testModel) {
    const key = (testKey || this.apiKey || '').trim();
    let model = testModel || this.model || 'gemini-2.0-flash';

    if (!key) {
      return { success: false, error: 'API Key is empty. Please provide a valid Gemini API key from Google AI Studio.' };
    }

    const testSingleModel = async (modelToTest) => {
      const startTime = Date.now();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${key}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Respond with exactly the word: ACTIVE' }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      });

      const latency = Date.now() - startTime;
      return { response, latency };
    };

    try {
      let { response, latency } = await testSingleModel(model);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        let errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

        // If the selected model is not found or unsupported (e.g. gemini-1.5-pro name mismatch),
        // attempt an automatic fallback test with gemini-2.0-flash
        if (model !== 'gemini-2.0-flash' && (errMsg.includes('not found') || errMsg.includes('not supported') || response.status === 404)) {
          const fallbackModel = 'gemini-2.0-flash';
          try {
            const fallbackResult = await testSingleModel(fallbackModel);
            if (fallbackResult.response.ok) {
              const fallbackData = await fallbackResult.response.json();
              const text = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || 'ACTIVE';
              return {
                success: true,
                latency: fallbackResult.latency,
                message: text.trim(),
                model: fallbackModel,
                fallbackNotice: `Notice: "${model}" is not available for generateContent on your API key. Switched to "${fallbackModel}".`
              };
            }
          } catch (_) { }
        }

        return { success: false, error: errMsg };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        success: true,
        latency,
        message: text.trim(),
        model
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network request failed. Please check internet connection.'
      };
    }
  },

  /**
   * Generate raw text response using Gemini
   * @param {string} prompt
   * @param {object} options
   * @returns {Promise<string>}
   */
  async generateText(prompt, options = {}) {
    if (!this.isConnected()) {
      throw new Error('Gemini API is not connected. Please enter your API Key in the Gemini AI Engine tab.');
    }

    let model = options.model || this.model || 'gemini-2.0-flash';
    const systemPrompt = options.systemInstruction || this.personas[this.persona] || this.personas.expert_architect;
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 2048;

    const executeRequest = async (modelName) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      if (systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      return await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    };

    let response = await executeRequest(model);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `API Error ${response.status}`;

      // Graceful fallback to gemini-2.0-flash if model is not found
      if (model !== 'gemini-2.0-flash' && (errMsg.includes('not found') || errMsg.includes('not supported') || response.status === 404)) {
        model = 'gemini-2.0-flash';
        this.model = 'gemini-2.0-flash';
        await this.saveConfig({ apiKey: this.apiKey, model: this.model, persona: this.persona });
        response = await executeRequest(model);
      }

      if (!response.ok) {
        throw new Error(errMsg);
      }
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];

    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Gemini returned an empty response. Please try again.');
    }

    return candidate.content.parts[0].text;
  },

  /**
   * Multi-turn chat generation for Assistant Side Drawer
   * @param {Array<{role: string, content: string}>} history
   * @returns {Promise<string>}
   */
  async generateChat(history) {
    if (!this.isConnected()) {
      throw new Error('API Key missing');
    }

    let model = this.model || 'gemini-2.0-flash';
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemPrompt = this.personas[this.persona] || this.personas.expert_architect;

    const executeRequest = async (modelName) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
      return await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });
    };

    let response = await executeRequest(model);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err?.error?.message || `Error ${response.status}`;

      // Graceful fallback to gemini-2.0-flash if model is not found
      if (model !== 'gemini-2.0-flash' && (errMsg.includes('not found') || errMsg.includes('not supported') || response.status === 404)) {
        model = 'gemini-2.0-flash';
        this.model = 'gemini-2.0-flash';
        await this.saveConfig({ apiKey: this.apiKey, model: this.model, persona: this.persona });
        response = await executeRequest(model);
      }

      if (!response.ok) {
        throw new Error(errMsg);
      }
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
  },

  /**
   * Real AI Architecture Synthesis for Smart Router
   * @param {string} userGoal
   * @returns {Promise<{domain: string, summary: string, steps: Array<{step: string, toolName: string, role: string, reason: string, searchUrl: string}>}>}
   */
  async generateArchitecture(userGoal) {
    const prompt = `Analyze this user goal and design an optimal 4-step AI tool workflow stack:
Goal: "${userGoal}"

Output strictly valid JSON with this exact schema:
{
  "domain": "Domain Name (e.g., Full-Stack Web Development, Machine Learning, Video Production)",
  "summary": "1 sentence strategic summary of the architecture",
  "steps": [
    {
      "step": "Step 1: Phase Name",
      "toolName": "Exact Tool Name (e.g. Cursor, Perplexity, Claude, Midjourney, v0, Runway)",
      "role": "Specific role of this tool in the pipeline",
      "reason": "Clear explanation of why this tool is optimal",
      "url": "https://official-tool-url"
    }
  ]
}
Return only pure JSON without markdown backticks.`;

    const rawJson = await this.generateText(prompt, {
      temperature: 0.2,
      systemInstruction: 'You are an elite AI Systems Architect. Output strictly raw JSON.'
    });

    try {
      // Clean possible markdown code fences
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse JSON architecture, falling back to structured representation', e);
      return {
        domain: 'AI Workflow Synthesis',
        summary: 'Dynamically generated AI architecture for your goal.',
        steps: [
          {
            step: 'Step 1: Intelligent Research',
            toolName: 'Perplexity AI',
            role: 'State-of-the-art information synthesis',
            reason: 'Find authoritative citations and modern patterns.',
            url: 'https://www.perplexity.ai'
          },
          {
            step: 'Step 2: Core Engineering',
            toolName: 'Cursor / ChatGPT',
            role: 'Code & pipeline implementation',
            reason: 'Execute the project logic with full context.',
            url: 'https://www.cursor.com'
          }
        ]
      };
    }
  },

  /**
   * Enhance raw prompt into Master-grade Prompt
   * @param {string} rawPrompt
   * @returns {Promise<string>}
   */
  async enhancePrompt(rawPrompt) {
    const prompt = `You are a world-class AI Prompt Engineer. Transform the following raw prompt into a high-performance, master-level structured prompt:

RAW PROMPT:
"${rawPrompt}"

REQUIREMENTS FOR ENHANCED PROMPT:
1. Clear Role / Persona Definition
2. Specific Context & Objectives
3. Structured Step-by-Step Instructions
4. Strict Constraints & Edge-Cases
5. Placeholders in [UPPERCASE_BRACKETS] for customizable fields
6. Expected Output Format

Return ONLY the enhanced prompt content ready to copy-paste.`;

    return await this.generateText(prompt, {
      temperature: 0.4,
      systemInstruction: 'You are a master prompt engineering specialist. Output clean, ready-to-use prompt text.'
    });
  },

  /**
   * Lightweight safe Markdown to HTML converter for chat and assistant
   * @param {string} text
   * @returns {string}
   */
  formatMarkdown(text) {
    if (!text) return '';
    let html = text;

    // Escape HTML entities to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced Code blocks
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'code';
      return `<div class="chat-code-block">
        <div class="chat-code-header">
          <span>${language}</span>
          <button class="chat-copy-code-btn" data-action="copy-code">Copy</button>
        </div>
        <pre><code class="language-${language}">${code.trim()}</code></pre>
      </div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Bullet points
    html = html.replace(/^\s*[-•*]\s+(.*)$/gm, '<li class="chat-list-item">$1</li>');
    html = html.replace(/(<li class="chat-list-item">.*<\/li>(\n|$))+/g, '<ul class="chat-list">$&</ul>');

    // Line breaks (preserving paragraphs)
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }
};
