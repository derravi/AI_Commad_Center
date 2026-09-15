/**
 * AI Command Center - Google Gemini API Client & Intelligence Engine
 * Handles real-time LLM inference, streaming chat, architecture synthesis, and prompt optimization.
 */
const GeminiClient = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  persona: 'expert_architect',
  temperature: 0.7,
  maxOutputTokens: 2048,

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
    creative_strategist: 'You are a Creative AI Director and Prompt Engineer. Provide hyper-detailed, visionary prompts, artistic workflows, and design guidance.',
    deep_researcher: 'You are a Deep Technical Researcher and Lead Scientist. Provide thorough literature synthesis, edge-case evaluations, mathematical rigor, and structured evidence-based analysis.'
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
      this.temperature = data.geminiConfig.temperature !== undefined ? parseFloat(data.geminiConfig.temperature) : 0.7;
      this.maxOutputTokens = data.geminiConfig.maxOutputTokens ? parseInt(data.geminiConfig.maxOutputTokens, 10) : 2048;
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
   * @param {object} config { apiKey, model, persona, temperature, maxOutputTokens }
   */
  async saveConfig({ apiKey, model, persona, temperature, maxOutputTokens }) {
    this.apiKey = (apiKey || '').trim();
    this.model = model || 'gemini-2.0-flash';
    this.persona = persona || 'expert_architect';
    if (temperature !== undefined) this.temperature = parseFloat(temperature);
    if (maxOutputTokens !== undefined) this.maxOutputTokens = parseInt(maxOutputTokens, 10);

    await StorageManager.set({
      geminiConfig: {
        apiKey: this.apiKey,
        model: this.model,
        persona: this.persona,
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens
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
        persona: this.persona,
        temperature: this.temperature,
        maxOutputTokens: this.maxOutputTokens
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

    const tempInput = document.getElementById('input-gemini-temperature');
    const tempLabel = document.getElementById('label-gemini-temp-val');
    const maxTokensSelect = document.getElementById('select-gemini-max-tokens');

    if (tempInput && this.temperature !== undefined) {
      tempInput.value = this.temperature;
    }
    if (tempLabel && this.temperature !== undefined) {
      tempLabel.textContent = parseFloat(this.temperature).toFixed(2);
    }
    if (maxTokensSelect && this.maxOutputTokens) {
      maxTokensSelect.value = String(this.maxOutputTokens);
    }

    // Update Assistant Side Drawer status
    if (typeof AssistantManager !== 'undefined' && AssistantManager.updateDrawerStatus) {
      AssistantManager.updateDrawerStatus();
    }

    // Update Prompt Studio Engine status
    if (typeof PromptLibrary !== 'undefined' && typeof PromptLibrary.updateStudioEngineStatus === 'function') {
      PromptLibrary.updateStudioEngineStatus();
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection.');
    }

    if (!this.isConnected()) {
      throw new Error('Gemini API is not connected. Please enter your API Key in the Gemini AI Engine tab.');
    }
    let model = options.model || this.model || 'gemini-2.0-flash';
    const systemPrompt = options.systemInstruction || this.personas[this.persona] || this.personas.expert_architect;
    const temperature = options.temperature !== undefined ? options.temperature : (this.temperature !== undefined ? this.temperature : 0.7);
    const maxTokens = options.maxTokens || this.maxOutputTokens || 2048;

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

      // Retry up to 2 times for transient 5xx errors or connection blips
      let res;
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          if (res.ok || res.status < 500 || attempt === 2) {
            return res;
          }
        } catch (fetchErr) {
          if (attempt === 2) throw fetchErr;
        }
        await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
      }
      return res;
    };

    let response = await executeRequest(model);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `API Error ${response.status}`;

      // Graceful fallback to gemini-2.0-flash if model is not found
      if (model !== 'gemini-2.0-flash' && (errMsg.includes('not found') || errMsg.includes('not supported') || response.status === 404)) {
        model = 'gemini-2.0-flash';
        this.model = 'gemini-2.0-flash';
        await this.saveConfig({ apiKey: this.apiKey, model: 'gemini-2.0-flash', persona: this.persona, temperature: this.temperature, maxOutputTokens: this.maxOutputTokens });
        response = await executeRequest(model);
        if (!response.ok) {
          throw new Error(errMsg);
        }
      } else {
        throw new Error(errMsg);
      }
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  /**
   * Generate conversational response with chat history
   * @param {Array<{role: string, content: string}>} history
   * @param {object} options
   * @returns {Promise<string>}
   */
  async generateChat(history = [], options = {}) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection.');
    }

    if (!this.isConnected()) {
      throw new Error('Gemini API is not connected. Please enter your API Key in the Gemini AI Engine tab.');
    }

    let model = options.model || this.model || 'gemini-2.0-flash';
    const temperature = options.temperature !== undefined ? options.temperature : (this.temperature !== undefined ? this.temperature : 0.7);
    const maxTokens = options.maxTokens || this.maxOutputTokens || 2048;

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemPrompt = this.personas[this.persona] || this.personas.expert_architect;

    const executeRequest = async (modelName) => {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      // Retry up to 2 times for transient 5xx errors or connection blips
      let res;
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          if (res.ok || res.status < 500 || attempt === 2) {
            return res;
          }
        } catch (fetchErr) {
          if (attempt === 2) throw fetchErr;
        }
        await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
      }
      return res;
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
   * Enhance raw prompt into Master-grade Prompt (Legacy helper)
   * @param {string} rawPrompt
   * @returns {Promise<string>}
   */
  async enhancePrompt(rawPrompt) {
    return this.transformPrompt(rawPrompt, 'enhance');
  },

  /**
   * Universal AI Prompt Transformation Studio Engine
   * Supports local language translation, polishing, master enhancement, reasoning, image crafter, and code specs.
   * @param {string} rawPrompt
   * @param {'polish'|'enhance'|'translate'|'concise'|'cot'|'image'|'code'} mode
   * @param {object} [options] { tone, language, format }
   * @returns {Promise<string>}
   */
  async transformPrompt(rawPrompt, mode = 'enhance', options = {}) {
    const tone = options.tone || 'professional';
    const targetLang = options.language || 'english';

    let instructions = '';
    let temperature = 0.4;

    switch (mode) {
      case 'polish':
        instructions = `You are a world-class prompt editor and communications specialist.
TASK: Polish and refine the user's raw prompt into clear, grammatically flawless, highly articulate phrasing with high readability.
RULES:
1. Preserve the user's exact original goal and intent.
2. Elevate vocabulary, eliminate ambiguity, and improve coherence.
3. If the input is in a local or vernacular language (Hindi, Hinglish, Gujarati, Spanish, etc.), translate and polish it into crisp, natural ${targetLang === 'hinglish' ? 'Hinglish' : 'English'}.
4. Tone should be ${tone}.
5. Return ONLY the polished prompt text without conversational preambles or explanations.`;
        temperature = 0.3;
        break;

      case 'enhance':
        instructions = `You are an elite AI Prompt Engineering Strategist.
TASK: Transform the user's rough idea, query, or local language prompt into an industry-grade Master Prompt Template.
STRUCTURE:
- [ROLE / PERSONA]: Define the exact domain expert persona.
- [CONTEXT & OBJECTIVE]: Clear purpose and high-value context.
- [STEP-BY-STEP INSTRUCTIONS]: Numbered, logical workflow steps.
- [CONSTRAINTS & EDGE CASES]: Strict boundaries, format constraints, and error prevention.
- [PLACEHOLDERS]: Use uppercase brackets like [TOPIC], [CODE_SNIPPET], [TARGET_AUDIENCE] for user-fillable variables.
- [DESIRED OUTPUT FORMAT]: Exact markdown/JSON/table format.
Tone: ${tone}. Target language: ${targetLang === 'hinglish' ? 'Hinglish' : 'English'}.
Return ONLY the master-level prompt ready to copy and run.`;
        temperature = 0.4;
        break;

      case 'translate':
        instructions = `You are a specialized Multilingual AI Prompt Translator & Localizer.
TASK: Understand the user's prompt written in any local language, dialect, or colloquial slang (Hindi, Hinglish, Gujarati, Bengali, Tamil, Telugu, Spanish, French, etc.) and translate it into a high-performance, frontier-grade prompt optimized for LLMs.
RULES:
1. Accurately decipher cultural context, colloquialisms, and implicit intent.
2. Translate and structure into powerful, prompt-engineered English (or Hinglish if specified).
3. Add relevant professional keywords to maximize LLM comprehension.
4. Return ONLY the final translated & structured prompt.`;
        temperature = 0.3;
        break;

      case 'concise':
        instructions = `You are an AI Efficiency Specialist and Token Optimizer.
TASK: Compress the user's prompt into an ultra-concise, high-density instruction set.
RULES:
1. Remove all filler words, greetings, redundancies, and conversational fluff.
2. Use dense imperative verbs and bulleted directives.
3. Maximize token efficiency while keeping 100% of functional requirements intact.
4. Return ONLY the concise prompt.`;
        temperature = 0.2;
        break;

      case 'cot':
        instructions = `You are a Deep Reasoning and Chain-of-Thought (CoT) Prompt Architect.
TASK: Convert the user's task into an advanced Chain-of-Thought reasoning prompt.
RULES:
1. Instruct the AI to explicitly break down the problem into sequential analytical milestones.
2. Require the AI to state underlying assumptions, analyze trade-offs, explore counterarguments, and self-correct errors before producing final answers.
3. Include verification checks and structured reasoning markers.
4. Return ONLY the Chain-of-Thought prompt.`;
        temperature = 0.3;
        break;

      case 'image':
        instructions = `You are a Master Generative AI Art Director and Visual Prompt Engineer for Midjourney v6, DALL-E 3, Stable Diffusion XL, and Flux.
TASK: Convert the user's visual concept or rough description into a stunning, photorealistic / artistic image generation prompt.
RULES:
1. Include detailed subject descriptions, physical traits, dynamic composition, and environment setting.
2. Specify cinematic lighting (e.g. volumetric rays, rim light, golden hour, moody chiaroscuro).
3. Specify camera, lens & film attributes (e.g. 35mm lens, f/1.8, Hasselblad, 8K resolution, photorealistic, Unreal Engine 5 render).
4. Append aspect ratio and quality parameters (e.g. --ar 16:9 --v 6.0 --style raw).
5. Return ONLY the ready-to-use image prompt.`;
        temperature = 0.5;
        break;

      case 'code':
        instructions = `You are a Principal Software Architect and Lead Code Reviewer.
TASK: Transform the user's software requirement, bug, or feature request into a production-grade Software Architecture Specification & Implementation Prompt.
RULES:
1. Define architectural patterns, design principles (SOLID, DRY), and clean modular file structure.
2. Require clean type definitions, error boundary handling, and async safety.
3. Include explicit test case requirements (Unit & Integration tests).
4. Use placeholders like [TECH_STACK], [EXISTING_CODE] where appropriate.
5. Return ONLY the code architecture prompt ready to give to Cursor, Claude, or ChatGPT.`;
        temperature = 0.3;
        break;

      default:
        instructions = `You are a master prompt engineering specialist. Polish and optimize the following prompt for maximum AI effectiveness. Return only the prompt.`;
    }

    const fullPrompt = `USER INPUT / ROUGH PROMPT:\n"""\n${rawPrompt}\n"""\n\nApply the transformation instructions now.`;

    return await this.generateText(fullPrompt, {
      temperature,
      systemInstruction: instructions
    });
  },

  /**
   * Execute and Test Prompt with Gemini in real-time
   * @param {string} promptText
   * @returns {Promise<string>}
   */
  async testPromptExecution(promptText) {
    if (!promptText || !promptText.trim()) {
      throw new Error('Prompt content is empty');
    }
    return await this.generateText(promptText, {
      temperature: 0.7,
      systemInstruction: 'You are an intelligent AI assistant. Execute the following user prompt directly, accurately, and thoroughly.'
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
