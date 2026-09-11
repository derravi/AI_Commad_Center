/**
 * AI Command Center - Verified Default AI Tools Catalog
 */
const DEFAULT_TOOLS = [
  // AI Chat & LLMs
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    category: 'chat',
    description: 'OpenAI conversational model for general reasoning, brainstorming, writing, and coding.',
    tags: ['openai', 'gpt-4o', 'reasoning', 'chat'],
    iconBg: '#10a37f',
    iconText: 'GPT',
    favorite: true,
    isDefault: true,
    useCases: ['General questions', 'Brainstorming', 'Writing', 'Code review']
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    category: 'chat',
    description: 'Anthropic AI assistant specialized in nuanced writing, deep research analysis, and large context windows.',
    tags: ['anthropic', 'sonnet', 'writing', 'analysis'],
    iconBg: '#d97706',
    iconText: 'CL',
    favorite: true,
    isDefault: true,
    useCases: ['Long-form writing', 'Document synthesis', 'Code architecture']
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    url: 'https://gemini.google.com/',
    category: 'chat',
    description: 'Google multimodal AI integrated with Google Workspace, YouTube, and real-time information.',
    tags: ['google', 'multimodal', 'workspace', 'gemini'],
    iconBg: '#2563eb',
    iconText: 'GEM',
    favorite: true,
    isDefault: true,
    useCases: ['Multimodal search', 'Google integration', 'Fact-checking']
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    category: 'chat',
    description: 'High-performance open-weights reasoning and coding model with deep math and logic capabilities.',
    tags: ['deepseek', 'reasoning', 'math', 'r1'],
    iconBg: '#0284c7',
    iconText: 'DS',
    favorite: false,
    isDefault: true,
    useCases: ['Complex math', 'Logic puzzles', 'Coding algorithms']
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://x.com/i/grok',
    category: 'chat',
    description: 'xAI conversational model with real-time X/Twitter data integration and uncensored perspectives.',
    tags: ['xai', 'realtime', 'twitter', 'grok'],
    iconBg: '#0f172a',
    iconText: 'X',
    favorite: false,
    isDefault: true,
    useCases: ['Real-time news', 'Trending topics', 'Casual banter']
  },

  // Coding & Dev
  {
    id: 'cursor',
    name: 'Cursor',
    url: 'https://cursor.com/',
    category: 'coding',
    description: 'AI-first code editor built on VS Code with multi-file code generation and repository indexing.',
    tags: ['ide', 'coding', 'editor', 'agent'],
    iconBg: '#4f46e5',
    iconText: 'CR',
    favorite: true,
    isDefault: true,
    useCases: ['Full-stack dev', 'Repo refactoring', 'Bug fixing']
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    url: 'https://github.com/features/copilot',
    category: 'coding',
    description: 'GitHub AI pair programmer suggesting code and whole functions in real time.',
    tags: ['github', 'code-completion', 'dev'],
    iconBg: '#181717',
    iconText: 'GH',
    favorite: false,
    isDefault: true,
    useCases: ['Code completion', 'Unit testing', 'Documentation']
  },
  {
    id: 'v0',
    name: 'v0 by Vercel',
    url: 'https://v0.dev/',
    category: 'coding',
    description: 'Generative UI system by Vercel that converts natural language into accessible React & Tailwind components.',
    tags: ['vercel', 'react', 'ui', 'frontend'],
    iconBg: '#000000',
    iconText: 'v0',
    favorite: true,
    isDefault: true,
    useCases: ['React UI design', 'Rapid prototyping', 'Tailwind styling']
  },
  {
    id: 'bolt-new',
    name: 'Bolt.new',
    url: 'https://bolt.new/',
    category: 'coding',
    description: 'In-browser full-stack AI development workspace for building, running, and deploying apps.',
    tags: ['fullstack', 'browser-ide', 'deployment'],
    iconBg: '#e11d48',
    iconText: '⚡',
    favorite: false,
    isDefault: true,
    useCases: ['Full-stack prototypes', 'Instant deployment', 'Sandbox testing']
  },
  {
    id: 'replit',
    name: 'Replit Agent',
    url: 'https://replit.com/',
    category: 'coding',
    description: 'Collaborative browser-based IDE with an autonomous AI agent capable of building entire software projects.',
    tags: ['replit', 'agent', 'ide', 'cloud'],
    iconBg: '#f97316',
    iconText: 'RP',
    favorite: false,
    isDefault: true,
    useCases: ['Rapid app building', 'Python/JS sandboxes', 'Backend deployment']
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    url: 'https://huggingface.co/',
    category: 'coding',
    description: 'The home of open-source machine learning models, datasets, spaces, and demos.',
    tags: ['open-source', 'models', 'datasets', 'ml'],
    iconBg: '#ffd21e',
    iconText: '🤗',
    favorite: false,
    isDefault: true,
    useCases: ['Model discovery', 'Dataset exploration', 'Gradio demos']
  },

  // Search & Research
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    url: 'https://www.perplexity.ai/',
    category: 'research',
    description: 'Conversational answer engine with real-time web citations, source verification, and deep research mode.',
    tags: ['search', 'citations', 'deep-research'],
    iconBg: '#0d9488',
    iconText: 'PP',
    favorite: true,
    isDefault: true,
    useCases: ['Literature review', 'Fact-checking', 'Deep technical research']
  },
  {
    id: 'consensus',
    name: 'Consensus',
    url: 'https://consensus.app/',
    category: 'research',
    description: 'AI academic search engine finding claims and evidence directly from peer-reviewed scientific papers.',
    tags: ['academic', 'papers', 'science'],
    iconBg: '#6366f1',
    iconText: 'CS',
    favorite: false,
    isDefault: true,
    useCases: ['Scientific claims', 'Academic citations', 'Meta-analysis']
  },
  {
    id: 'elicit',
    name: 'Elicit',
    url: 'https://elicit.com/',
    category: 'research',
    description: 'AI research assistant that automates research workflows like literature review and data extraction.',
    tags: ['research', 'literature', 'synthesis'],
    iconBg: '#7c3aed',
    iconText: 'EL',
    favorite: false,
    isDefault: true,
    useCases: ['Paper summarization', 'Evidence tables', 'Systematic reviews']
  },

  // Image & Art
  {
    id: 'midjourney',
    name: 'Midjourney',
    url: 'https://www.midjourney.com/',
    category: 'image',
    description: 'Industry-leading text-to-image AI producing hyper-realistic, photorealistic, and artistic visuals.',
    tags: ['image', 'art', 'photorealism'],
    iconBg: '#1e293b',
    iconText: 'MJ',
    favorite: true,
    isDefault: true,
    useCases: ['Concept art', 'Photorealism', 'Branding visuals']
  },
  {
    id: 'leonardo',
    name: 'Leonardo AI',
    url: 'https://leonardo.ai/',
    category: 'image',
    description: 'Creative suite for generating production-ready visual assets, game assets, and fine-tuned image styles.',
    tags: ['image', 'gaming', 'assets', 'finetune'],
    iconBg: '#9333ea',
    iconText: 'LE',
    favorite: false,
    isDefault: true,
    useCases: ['Game asset design', 'Character art', 'Texture generation']
  },
  {
    id: 'recraft',
    name: 'Recraft',
    url: 'https://www.recraft.ai/',
    category: 'image',
    description: 'AI vector art and 3D graphic generator built specifically for professional designers and brand assets.',
    tags: ['vector', 'svg', 'design', 'icons'],
    iconBg: '#dc2626',
    iconText: 'RC',
    favorite: false,
    isDefault: true,
    useCases: ['Vector graphics', 'Brand icons', '3D illustrations']
  },
  {
    id: 'canva-magic',
    name: 'Canva Magic Studio',
    url: 'https://www.canva.com/magic-studio/',
    category: 'image',
    description: 'All-in-one AI design tools for marketing graphics, social media posts, presentations, and mockups.',
    tags: ['design', 'social-media', 'templates'],
    iconBg: '#00c4cc',
    iconText: 'CV',
    favorite: false,
    isDefault: true,
    useCases: ['Social banners', 'Presentations', 'Marketing collaterals']
  },

  // Video & Animation
  {
    id: 'runway',
    name: 'Runway Gen-3',
    url: 'https://runwayml.com/',
    category: 'video',
    description: 'Next-generation AI video generation, video-to-video transformations, and creative video suite.',
    tags: ['video', 'gen-3', 'vfx', 'cinematic'],
    iconBg: '#059669',
    iconText: 'RW',
    favorite: true,
    isDefault: true,
    useCases: ['Cinematic B-roll', 'Visual effects', 'Storyboarding']
  },
  {
    id: 'luma-dream-machine',
    name: 'Luma Dream Machine',
    url: 'https://lumalabs.ai/dream-machine',
    category: 'video',
    description: 'High-fidelity video generation model creating realistic, physics-accurate camera motions and shots.',
    tags: ['video', '3d', 'motion'],
    iconBg: '#475569',
    iconText: 'LM',
    favorite: false,
    isDefault: true,
    useCases: ['Smooth camera shots', 'Hyperrealistic videos', 'Product showcases']
  },
  {
    id: 'kling-ai',
    name: 'Kling AI',
    url: 'https://klingai.com/',
    category: 'video',
    description: 'Ultra-realistic high-definition video generation with complex motion dynamics and physical simulation.',
    tags: ['video', 'motion', 'simulation'],
    iconBg: '#2563eb',
    iconText: 'KL',
    favorite: false,
    isDefault: true,
    useCases: ['Dynamic action scenes', 'Character movement', 'Long video clips']
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    url: 'https://www.heygen.com/',
    category: 'video',
    description: 'AI video generation platform creating hyper-realistic talking avatar videos and localized translations.',
    tags: ['avatar', 'talking-head', 'localization'],
    iconBg: '#8b5cf6',
    iconText: 'HG',
    favorite: false,
    isDefault: true,
    useCases: ['Explainer videos', 'Multilingual dubbing', 'Sales presentations']
  },

  // Voice & Audio
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io/',
    category: 'audio',
    description: 'Industry standard for AI voice generation, realistic text-to-speech, voice cloning, and sound effects.',
    tags: ['tts', 'voice-cloning', 'audio', 'sound-fx'],
    iconBg: '#000000',
    iconText: '11',
    favorite: true,
    isDefault: true,
    useCases: ['Podcast narration', 'Voiceovers', 'Sound design']
  },
  {
    id: 'suno',
    name: 'Suno AI',
    url: 'https://suno.com/',
    category: 'audio',
    description: 'Create full-length songs with vocals, instruments, lyrics, and production quality from simple text prompts.',
    tags: ['music', 'songs', 'vocals'],
    iconBg: '#f43f5e',
    iconText: 'SN',
    favorite: false,
    isDefault: true,
    useCases: ['Background music', 'Commercial jingles', 'Song composition']
  },
  {
    id: 'udio',
    name: 'Udio',
    url: 'https://www.udio.com/',
    category: 'audio',
    description: 'High-fidelity music generation platform allowing complex genre blending and studio-grade soundscapes.',
    tags: ['music', 'production', 'studio'],
    iconBg: '#64748b',
    iconText: 'UD',
    favorite: false,
    isDefault: true,
    useCases: ['High-fi music tracks', 'Soundtrack creation', 'Instrumental beats']
  },

  // Writing & Copy
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    url: 'https://www.copy.ai/',
    category: 'writing',
    description: 'AI marketing platform for generating high-converting sales copy, email sequences, and blog posts.',
    tags: ['copywriting', 'marketing', 'seo'],
    iconBg: '#10b981',
    iconText: 'CP',
    favorite: false,
    isDefault: true,
    useCases: ['Ad copy', 'Email campaigns', 'SEO blog posts']
  },
  {
    id: 'grammarly',
    name: 'Grammarly AI',
    url: 'https://www.grammarly.com/',
    category: 'writing',
    description: 'AI writing partner for tone calibration, grammar correction, style enhancement, and clarity editing.',
    tags: ['grammar', 'editing', 'tone'],
    iconBg: '#15803d',
    iconText: 'GR',
    favorite: false,
    isDefault: true,
    useCases: ['Proofreading', 'Tone polishing', 'Professional emails']
  },

  // Data & Analytics
  {
    id: 'kaggle',
    name: 'Kaggle',
    url: 'https://www.kaggle.com/',
    category: 'data',
    description: 'Data science community platform offering datasets, free GPU notebooks, and machine learning competitions.',
    tags: ['datasets', 'jupyter', 'machine-learning'],
    iconBg: '#20beff',
    iconText: 'KG',
    favorite: true,
    isDefault: true,
    useCases: ['EDA analysis', 'ML competition models', 'Public datasets']
  },
  {
    id: 'google-colab',
    name: 'Google Colab',
    url: 'https://colab.research.google.com/',
    category: 'data',
    description: 'Free cloud-hosted Jupyter notebook service with GPU/TPU acceleration for deep learning workflows.',
    tags: ['python', 'jupyter', 'gpu', 'deep-learning'],
    iconBg: '#ea580c',
    iconText: 'CO',
    favorite: true,
    isDefault: true,
    useCases: ['Model training', 'PyTorch / TensorFlow scripts', 'Python pipelines']
  },
  {
    id: 'julius-ai',
    name: 'Julius AI',
    url: 'https://julius.ai/',
    category: 'data',
    description: 'AI data analyst that analyzes Excel spreadsheets, CSVs, generates charts, and runs statistical models.',
    tags: ['data-analysis', 'excel', 'charts', 'python'],
    iconBg: '#6366f1',
    iconText: 'JL',
    favorite: false,
    isDefault: true,
    useCases: ['CSV data analysis', 'Automated charts', 'Statistical testing']
  },

  // Productivity
  {
    id: 'notion-ai',
    name: 'Notion AI',
    url: 'https://www.notion.so/',
    category: 'productivity',
    description: 'Integrated AI workspace for note-taking, project documentation, meeting summaries, and knowledge bases.',
    tags: ['notes', 'knowledge-base', 'collaboration'],
    iconBg: '#000000',
    iconText: 'N',
    favorite: false,
    isDefault: true,
    useCases: ['Project wikis', 'Meeting action items', 'Document summaries']
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_TOOLS };
}
