# ⚡ AI Command Center — Next-Gen Chrome Extension

> **Transform your Chrome New Tab into an ultra-fast AI command center, smart workflow orchestrator, and multi-model productivity launcher.**

-> New Version 0.2

---

## 📑 Table of Contents

- [🌟 Project Overview](#-project-overview)
- [✨ Key Highlights](#-key-highlights)
- [🚀 Comprehensive Feature Breakdown](#-comprehensive-feature-breakdown)
  - [1. 🎯 1-Click AI Directory & Quick Launcher](#1--1-click-ai-directory--quick-launcher)
  - [2. ⭐ Pinned Favorites & Recently Used Tracker](#2--pinned-favorites--recently-used-tracker)
  - [3. 🔍 Universal Multi-Engine Search + Custom Search Engines](#3--universal-multi-engine-search--custom-search-engines)
  - [4. 🧠 Smart AI Router & Task Recommender](#4--smart-ai-router--task-recommender)
  - [5. ⚡ Google Gemini 2.0 AI Engine & Live Playground](#5--google-gemini-20-ai-engine--live-playground)
  - [6. 📦 One-Click AI Stacks (Batch Launcher)](#6--one-click-ai-stacks-batch-launcher)
  - [7. 📚 Universal Prompt Library & AI Enhancer](#7--universal-prompt-library--ai-enhancer)
  - [8. 📁 Project Workspaces & Markdown Notes](#8--project-workspaces--markdown-notes)
  - [9. ⚔️ Multi-AI Challenge & Output Judge](#9-️-multi-ai-challenge--output-judge)
  - [10. 🛠️ Custom Tool Creator & Category Filter](#10-️-custom-tool-creator--category-filter)
  - [11. 💬 AI Assistant Copilot Side Drawer (`Alt + A`)](#11--ai-assistant-copilot-side-drawer-alt--a)
  - [12. 🎨 Cyber Glassmorphic Theme Engine](#12--cyber-glassmorphic-theme-engine)
  - [13. 🔒 100% Local-First Privacy & Backup/Restore](#13--100-local-first-privacy--backuprestore)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [💻 Installation Guide (Chrome Developer Mode)](#-installation-guide-chrome-developer-mode)
- [🔑 Google Gemini API Setup (Optional / Free)](#-google-gemini-api-setup-optional--free)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [🗂️ Project Directory Structure](#️-project-directory-structure)
- [🤝 Contributing & Customization](#-contributing--customization)
- [📄 License](#-license)

---

## 🌟 Project Overview

**AI Command Center** is a lightweight, privacy-focused Chrome Extension (Manifest V3) designed to replace the standard, boring blank New Tab page with a high-tech **cyber-glassmorphic workspace**. 

Instead of juggling 20+ bookmarks or searching across different tabs, **AI Command Center** puts every frontier AI model, coding assistant, creative engine, research tool, and reusable prompt at your fingertips with sub-second launch times.

Whether you are a **Software Engineer**, **ML Researcher**, **Content Creator**, or **Data Scientist**, this extension optimizes your daily workflow from prompt to deployment.

---

## ✨ Key Highlights

- ⚡ **Zero-Lag Native Performance**: Pure Vanilla JavaScript and CSS — no bulky frameworks, instant load times.
- 🤖 **Google Gemini 2.0 Integration**: Connect your free Google AI Studio key for live AI reasoning, prompt enhancement, and assistant chat.
- 🛡️ **Privacy-First (No Telemetry)**: All custom tools, workspaces, prompts, and API keys are securely stored locally inside `chrome.storage.local`.
- 🌐 **Universal Search Hub**: Switch dynamically between Google, Perplexity, Brave, DuckDuckGo, Bing, or add custom search engines like Kagi or GitHub.
- 🎨 **Sleek Cyber Glassmorphism**: Tailored dark modes (Cyber Onyx, OLED Pitch Black, Cyberpunk Neon) and clean minimal light themes with reactive ambient glow effects.

---

## 🚀 Comprehensive Feature Breakdown

### 1. 🎯 1-Click AI Directory & Quick Launcher
- **30+ Curated Default Tools** spanning 9 core categories:
  - 💬 **Chat & LLMs**: ChatGPT, Claude, Google Gemini, DeepSeek, Grok, Microsoft Copilot.
  - 💻 **Coding & Dev**: Cursor AI, GitHub Copilot, v0 by Vercel, Bolt.new, Replit Agent, Hugging Face.
  - 🔍 **Research & Search**: Perplexity AI, Consensus, Elicit, SciSpace.
  - 🎨 **Image & Design**: Midjourney, Leonardo AI, Recraft, Canva Magic Studio.
  - 🎬 **Video & Animation**: Runway Gen-3, Luma Dream Machine, Kling AI, HeyGen.
  - 🎙️ **Voice & Audio**: ElevenLabs, Suno, Udio.
  - ✍️ **Writing & Copy**: Copy.ai, Grammarly, QuillBot.
  - 📊 **Data & Science**: Kaggle, Google Colab, Julius AI.
  - ⚡ **Productivity**: Notion AI, Otter.ai.
- Single-click opens any tool directly in a fresh tab (`chrome.tabs.create` / `window.open`).

---

### 2. ⭐ Pinned Favorites & Recently Used Tracker
- ⭐ **Pin Favorites**: Click the star icon on any tool card to pin it into the prominent top quick-access row.
- 🕒 **Automatic Recents Tracker**: Automatically records your last 15 used AI tools and updates usage counters in real-time.

---

### 3. 🔍 Universal Multi-Engine Search + Custom Search Engines
- ⚡ **Real-Time Tool Filter**: Type any keyword (e.g. `python`, `video`, `code`) to filter local tool cards with zero page reloads.
- 🌐 **Multi-Engine Dropdown**: Seamlessly switch active search engines:
  - 🔍 **Google**
  - 🧠 **Perplexity AI** (Direct AI answers)
  - 🦁 **Brave Search**
  - 🦆 **DuckDuckGo**
  - 🟦 **Microsoft Bing**
- ➕ **Add Custom Search Engines**: Add your own favorite search engine (e.g. *Kagi, Phind, GitHub Code Search, YouTube*) using dynamic query templates (`https://github.com/search?q=%s`).
- ⌨️ Press `/` from anywhere on the page to instantly focus the search bar.

---

### 4. 🧠 Smart AI Router & Task Recommender
- Describe any objective in plain English (e.g. *"Build an automated trading bot"* or *"Generate UI mockup for mobile app"*).
- The router analyzes intent and provides an optimal **multi-step toolchain blueprint** with rationale for every phase (Research ➔ Architecture ➔ Coding ➔ Deployment).
- **Batch Launch**: Click **"Open All in Tabs"** to launch the complete recommended stack in one click.

---

### 5. ⚡ Google Gemini 2.0 AI Engine & Live Playground
- Powered by official Google Generative AI endpoints.
- 🔄 **Auto-Detect Models**: Automatically checks your API key against Google's API to fetch all available models (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro-latest`, etc.).
- ⏱️ **Real-Time Latency Ping**: Tests response latency in milliseconds to verify API key health and network speed.
- 🎭 **Custom System Personas**:
  - *Principal Software Architect* (Deep technical blueprints and code)
  - *Fast & Concise Copilot* (Direct, bulleted commands)
  - *Creative AI Strategist* (Artistic direction & detailed prompt engineering)
- 🧪 **Interactive Playground**: Send test queries directly from the settings page with formatted markdown output and 1-click code copying.

---

### 6. 📦 One-Click AI Stacks (Batch Launcher)
- Group complementary tools into unified workflows that open simultaneously in separate tabs:
  - 🤖 **Machine Learning Stack**: ChatGPT + Claude + Cursor + Kaggle + Colab + Perplexity
  - 🌐 **Full-Stack Web Dev**: Cursor + v0 + Bolt.new + ChatGPT + Perplexity
  - 🎨 **Content & Media Studio**: Midjourney + Runway + ElevenLabs + Claude + Canva
  - 🔬 **Deep Research Stack**: Perplexity + Consensus + Elicit + Claude
- ➕ **Custom Stacks**: Create your own named stacks with custom tool selections.

---

### 7. 📚 Universal Prompt Library & AI Enhancer
- Curated master prompts for coding reviews, system architecture, exploratory data analysis, and photorealistic generative art.
- 📋 **1-Click Copy**: Copy any prompt directly to your clipboard.
- 🚀 **1-Click Dispatch**: Copy prompt and immediately open your target AI model (**ChatGPT**, **Claude**, or **Gemini**).
- ✨ **Gemini AI Prompt Enhancer**: Click the sparkle button to automatically transform raw, basic prompts into production-grade structured prompts.

---

### 8. 📁 Project Workspaces & Markdown Notes
- Dedicated project hubs combining linked tools, project goals, and markdown scratchpads.
- Write TODO lists, sprint notes, or system requirements that persist safely across browser restarts.
- Click **"Launch Workspace"** to open all linked tools at once.

---

### 9. ⚔️ Multi-AI Challenge & Output Judge
- **Broadcast a single prompt** across multiple leading AI models simultaneously (ChatGPT, Claude, Gemini, Perplexity, DeepSeek).
- Compare responses using the built-in **4-Pillar Evaluation Matrix**:
  - 🎯 **Accuracy**: Verification against ground truth and source citations.
  - 🔍 **Depth**: Nuance coverage, edge cases, and comprehensive context.
  - 💡 **Clarity**: Formatting, tone, code syntax readability, and structure.
  - 🧠 **Reasoning**: Step-by-step logic, mathematical rigor, and architectural rationale.

---

### 10. 🛠️ Custom Tool Creator & Category Filter
- Add any website, local server (e.g. `localhost:3000`), or newly discovered AI tool.
- Specify custom titles, URLs, descriptions, badge tags, and accent colors.
- Custom tools include a **`CUSTOM`** badge and a 1-click **Delete (🗑️)** option.

---

### 11. 💬 AI Assistant Copilot Side Drawer (`Alt + A`)
- Slide-out glassmorphic AI drawer accessible from anywhere via the **`Alt + A`** shortcut or header icon.
- **Dual Mode Support**:
  - ⚡ **Connected Mode (Gemini)**: Full multi-turn conversational AI, code generation with copy buttons, and architecture advice.
  - 📴 **Offline Fallback**: Rule-based smart task guidance if no API key is configured.

---

### 12. 🎨 Cyber Glassmorphic Theme Engine
- Select from 4 curated dark & light themes:
  - 🌌 **Cyber Onyx**: Deep midnight dark slate.
  - 🖤 **OLED Pitch Black**: Pure `#000000` black for OLED efficiency and maximum contrast.
  - ⚡ **Cyberpunk Neon**: Vibrant cyan and neon magenta glowing accents.
  - ☀️ **Clean Minimal Light**: Crisp, high-contrast light theme.
- 🎨 **5 Customizable Accent Colors**: Indigo Purple (`#6366f1`), Electric Blue (`#0284c7`), Emerald Green (`#10b981`), Rose Pink (`#f43f5e`), Amber Orange (`#f59e0b`).

---

### 13. 🔒 100% Local-First Privacy & Backup/Restore
- **Zero Third-Party Telemetry**: Your browsing data, custom tools, and notes never touch external analytics servers.
- 📥 **JSON Export & Restore**: Download a single `.json` backup file of your entire configuration (custom tools, stacks, workspaces, prompts) and restore it on any machine in seconds.

---

## ⌨️ Dynamic Keyboard Shortcuts & Hotkeys Manager

All shortcuts in AI Command Center are **100% dynamically customizable** in **Settings > Shortcuts**:

| Default Shortcut | Action | Target / Action | Description |
| :--- | :--- | :--- | :--- |
| **`Ctrl + T`** | Open New Tab | Dashboard | Launches the AI Command Center dashboard |
| **`/`** | Focus Search | Universal Search | Instantly jumps cursor to the search bar |
| **`Alt + C`** | Launch ChatGPT | AI Tool | Opens ChatGPT in a new tab |
| **`Ctrl + C + D` / `Alt + L`** | Launch Claude | AI Tool | Opens Anthropic Claude in a new tab |
| **`Alt + G`** | Launch Google Gemini | AI Tool | Opens Google Gemini in a new tab |
| **`Alt + P`** | Launch Perplexity | AI Tool | Opens Perplexity AI in a new tab |
| **`Alt + A`** | Toggle AI Assistant | AI Drawer | Opens / closes the slide-out AI Copilot Drawer |
| **`Escape`** | Close Modals & Drawers | UI | Dismisses any active modal, popup, or side panel |

> 💡 **Custom Hotkeys:** Go to **Settings > Shortcuts** to record your own custom key combinations (e.g. `Ctrl + C + D`, `Ctrl + Shift + D`, `Alt + K`), create hotkeys for any custom AI tools, or toggle individual shortcuts.

---

## 💻 Installation Guide (Chrome Developer Mode)

Follow these simple steps to install the extension in your browser:

1. **Open Google Chrome** (or any Chromium browser like Brave, Edge, or Arc).
2. In the URL address bar, enter:
   ```text
   chrome://extensions
   ```
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click the **Load unpacked** button in the top-left corner.
5. Select this project root folder:
   ```text
   d:\E drive\Github Projects\AI Command Center
   ```
6. Press **`Ctrl + T`** to open a new tab and enjoy your new **AI Command Center**! 🎉

---

## 🔑 Google Gemini API Setup (Optional / Free)

To enable live AI features (Real AI Chat, Prompt Enhancer, and Live Playground):

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to generate a **free** Gemini API key.
2. Open **AI Command Center** (`Ctrl + T`).
3. In the left navigation sidebar, click **"Gemini AI Engine"**.
4. Paste your API key into the input field.
5. Click **"Test & Save Key"** ➔ The extension verifies the key with a live ping and connects instantly.

---

## 🛠️ Tech Stack & Architecture

- **Platform**: Chrome Extensions Manifest V3
- **Core Logic**: Modern Vanilla JavaScript (ES6+ Modules & Async/Await)
- **Styling**: CSS3 Custom Properties, Glassmorphism backdrop-filters, CSS Grid & Flexbox
- **Storage Layer**: `chrome.storage.local` with fallback to `window.localStorage`
- **AI Integration**: Google Generative Language REST API (`v1beta/models`)
- **Icons**: Clean SVG vector glyphs and multi-resolution PNG icons

---

## 🗂️ Project Directory Structure

```text
AI Command Center/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── newtab.html                # Main New Tab Dashboard entry point
├── README.md                  # Complete Project Documentation & Overview
├── demo.md                    # Detailed Feature & Workflow Walkthrough (Hinglish)
├── css/
│   ├── style.css              # Design tokens, themes, reset, animations & glow effects
│   ├── dashboard.css          # Layout grids, header, search bar, filter bar
│   ├── components.css         # Tool cards, stacks, prompt library, workspaces
│   └── modal.css              # Glassmorphic modals, forms, toggle switches, toasts
├── js/
│   ├── app.js                 # App coordinator, event registry & shortcut router
│   ├── storage.js             # chrome.storage.local & JSON export/import adapter
│   ├── ui.js                  # View switching, theme manager, live clock, notifications
│   ├── tools.js               # Tool card rendering, launch handling, favorites & CRUD
│   ├── search.js              # Universal multi-engine search & real-time filter
│   ├── router.js              # NLP task intent classifier & workflow builder
│   ├── workflows.js           # One-Click Stacks manager & batch tab launcher
│   ├── prompts.js             # Universal prompt templates & Gemini prompt enhancer
│   ├── workspaces.js          # Project workspaces & persistent markdown notes
│   ├── assistant.js           # Multi-AI challenge & interactive side drawer
│   └── gemini.js              # Gemini API client, model auto-detect & streaming chat
├── data/
│   ├── categories.js          # Category taxonomy & color badge definitions
│   └── default-tools.js       # Curated database of 30+ default AI tools
└── assets/
    └── icons/                 # Extension icons (icon16.png, icon48.png, icon128.png, icon.svg)
```

---

## 🤝 Contributing & Customization

Feel free to fork this project and customize it for your personal workflow:
1. Fork or clone the repository.
2. Modify `data/default-tools.js` to add your team's internal tools or private web apps.
3. Tweak color palettes in `css/style.css` to match your personal brand.
4. Submit pull requests or report issues to help improve the project!

---

## 📄 License

This is the New project architecture.

# File Tree: AI Command Center

**Generated:** 9/19/2026, 8:31:25 PM
**Root Path:** `d:\E drive\Github Projects\AI Command Center\AI Command Center`

```
├── 📁 assets
│   └── 📁 icons
│       ├── 🖼️ icon.svg
│       ├── 🖼️ icon128.png
│       ├── 🖼️ icon16.png
│       └── 🖼️ icon48.png
├── 📁 css
│   ├── 🎨 components.css
│   ├── 🎨 dashboard.css
│   ├── 🎨 modal.css
│   ├── 🎨 prompt-studio.css
│   └── 🎨 style.css
├── 📁 data
│   ├── 📄 categories.js
│   └── 📄 default-tools.js
├── 📁 js
│   ├── 📄 app.js
│   ├── 📄 assistant.js
│   ├── 📄 cache.js
│   ├── 📄 gemini.js
│   ├── 📄 localhost.js
│   ├── 📄 prompts.js
│   ├── 📄 router.js
│   ├── 📄 search.js
│   ├── 📄 shortcuts.js
│   ├── 📄 storage.js
│   ├── 📄 tools.js
│   ├── 📄 ui.js
│   ├── 📄 workflows.js
│   └── 📄 workspaces.js
├── 📄 Bugs_and_new_fetures.txt
├── 📝 README.md
├── 📝 demo.md
├── ⚙️ manifest.json
└── 🌐 newtab.html
```

---
*Generated by FileTree Pro Extension*