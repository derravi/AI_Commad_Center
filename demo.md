# 🚀 AI Command Center — Complete Feature & Demo Guide (demo.md)

Yeh document aapko **AI Command Center Chrome Extension** ke har ek feature aur uske kaam karne ke tarike (How it works) ko step-by-step detail me explain karta hai.

---

## 📑 Table of Contents

1. [Ctrl + T — New Tab Dashboard & AI Launcher](#1-ctrl--t--new-tab-dashboard--ai-launcher)
2. [Favorites & Recently Used (Quick Access Bar)](#2-favorites--recently-used-quick-access-bar)
3. [Universal Multi-Engine Search & Live Filtering](#3-universal-multi-engine-search--live-filtering)
4. [Smart AI Router & Task Recommender](#4-smart-ai-router--task-recommender)
5. [Google Gemini AI Engine & API Hub (Real AI Mode)](#5-google-gemini-ai-engine--api-hub-real-ai-mode)
6. [One-Click AI Stacks (Batch Tab Launcher)](#6-one-click-ai-stacks-batch-tab-launcher)
7. [Universal Prompt Library (1-Click Copy & Launch)](#7-universal-prompt-library-1-click-copy--launch)
8. [Project Workspaces (Tools + Notes + Goals)](#8-project-workspaces-tools--notes--goals)
9. [Multi-AI Challenge & Answer Judge](#9-multi-ai-challenge--answer-judge)
10. [Custom Tool Management (Add / Delete Your Own Tools)](#10-custom-tool-management-add--delete-your-own-tools)
11. [AI Assistant Copilot Side Drawer (Gemini Powered)](#11-ai-assistant-copilot-side-drawer-gemini-powered)
12. [Themes, Accent Colors & Backup System](#12-themes-accent-colors--backup-system)
13. [Keyboard Shortcuts Cheat Sheet](#13-keyboard-shortcuts-cheat-sheet)

---

## 1. Ctrl + T — New Tab Dashboard & AI Launcher

### 🎯 Yeh Kya Hai?
Jab bhi aap Chrome me naya tab kholte hain (`Ctrl + T`), default blank page ki jagah aapko ek high-tech, Cyber-Glassmorphism **AI Command Center** milta hai.

### ⚙️ Yeh Kaam Kaise Karta Hai?
- Dashboard me **30+ verified default AI tools** pre-loaded hain:
  - **Chat & LLMs**: ChatGPT, Claude, Google Gemini, DeepSeek, Grok.
  - **Coding & Dev**: Cursor, GitHub Copilot, v0 by Vercel, Bolt.new, Replit, Hugging Face.
  - **Research & Search**: Perplexity AI, Consensus, Elicit.
  - **Image & Art**: Midjourney, Leonardo AI, Recraft, Canva Magic Studio.
  - **Video & Animation**: Runway Gen-3, Luma Dream Machine, Kling AI, HeyGen.
  - **Voice & Audio**: ElevenLabs, Suno, Udio.
  - **Writing & Copy**: Copy.ai, Grammarly.
  - **Data & Analytics**: Kaggle, Google Colab, Julius AI.
  - **Productivity**: Notion AI.
- **Card Click Action**: Kisi bhi tool card par click karne par wo seedha **naye Chrome tab** me open ho jata hai (`window.open` / `chrome.tabs.create`).
- Background me automatic usage count update hota hai.

---

## 2. Favorites & Recently Used (Quick Access Bar)

### 🎯 Yeh Kya Hai?
Aapke sabse jyada use hone wale AI tools ko screen ke top par hamesha ready rakhna taaki 1 second me access ho sake.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. **Favorites (⭐ Pinning)**:
   - Kisi bhi card ke top-right corner me bane **Star (⭐) icon** par click karein.
   - Wo tool turant top ke **"Favorites"** row me pin ho jayega.
   - Dobara click karne par unpin ho jayega.
2. **Recently Used Tracker**:
   - Jaise hi aap kisi bhi tool ko launch karte hain, wo automatically **"Recently Used"** horizontal bar me first position par add ho jata hai (Last 15 tools track hote hain).
   - Data `chrome.storage.local` me persist rehta hai, browser band hone ke baad bhi delete nahi hota.

---

## 3. Universal Multi-Engine Search & Live Filtering

### 🎯 Yeh Kya Hai?
Aapko alag se search engines kholne ki jarurat nahi hai. Ek hi search box se aap:
1. Local AI Tools ko real-time filter kar sakte hain.
2. Direct Web search (Google, Perplexity, Brave, DuckDuckGo, Bing) kar sakte hain.

### ⚙️ Yeh Kaam Kaise Karta Hai?
- **Instant Tool Filter**: Search box me bas type karein (e.g. `python`, `image`, `code`). Bina page reload huye cards live filter ho jate hain.
- **Search Engine Selector & Dropdown**: Search bar ke left side me engine button ke sath ek **Arrow (Chevron ⌄)** hai. Click karte hi ek sleek Cyber-Glassmorphic dropdown khulta hai jisme saare available search engines dikhte hain:
  - **Google (🔍)**, **Perplexity (🧠)**, **Brave (🦁)**, **DuckDuckGo (🦆)**, **Bing (🟦)**
  - Click karke direct koi bhi engine select karein.
- **"+ Add Custom Search Engine"**: Dropdown me **"+ Add New"** button par click karke aap internet ka koi bhi custom search engine (jaise *Kagi, GitHub, YouTube, Phind, Ecosia*) add kar sakte hain:
  - Name, Icon/Emoji, aur Search URL Template (`https://kagi.com/search?q=%s`).
  - Custom engines par delete (🗑️) button bhi hota hai.
- **Keyboard Shortcut**: Keyboard par `/` press karte hi focus turant search bar par chala jata hai.
- **Enter Press**: Query type karke `Enter` dabane par selected engine me naye tab me search open hota hai.

---

## 4. Smart AI Router & Task Recommender

### 🎯 Yeh Kya Hai?
Agar aapko nahi pata ki aapke specific task ke liye konsa AI tool best hai, toh Smart Router aapke goal ko analyze karke best multi-tool stack recommend karta hai with clear reasons.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Dashboard ke top banner me bane input box me apna task likhein (ya quick pill select karein, e.g. *"Build an ML model"* ya *"Design React UI website"*).
2. **"Recommend AI Tools"** button par click karein.
3. System rule-based NLP intent classification chalata hai aur ek detailed modal popup kholta hai:
   - **Domain**: Machine Learning Engineering
   - **Step 1 — Research**: Perplexity AI *(Find state-of-the-art papers with citations)*
   - **Step 2 — Algorithm**: ChatGPT *(Debug math logic)*
   - **Step 3 — Coding**: Cursor *(Write PyTorch code)*
   - **Step 4 — Training**: Google Colab *(Free cloud GPU)*
4. Modal me **"Open All in Tabs"** button par click karke aap sabhi recommended tools ko 1 click me tabs me khol sakte hain.

---

## 5. Google Gemini AI Engine & API Hub (Real AI Mode)

### 🎯 Yeh Kya Hai?
Aapke pooray AI Command Center ko **Real Artificial Intelligence Engine** se empower karna. Sirf static cards ya rules ke bajaye, aapka dashboard live **Google Gemini 2.0 Flash** LLM se connect hokar real-time reasoning, dynamic workflow synthesis aur chat provide karta hai.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar me **"Gemini AI Engine"** par click karein.
2. **Configuration Box**:
    - **Google Gemini API Key**: [Google AI Studio (Free)](https://aistudio.google.com/app/apikey) se free key lekar paste karein.
    - **Model Selector & 🔄 Auto-Detect**: `Gemini 2.0 Flash` (Recommended - Ultra Fast), `Gemini 2.0 Flash Lite`, `Gemini 1.5 Flash`, `Gemini 1.5 Pro Latest`. Sath hi **"Auto-Detect"** button se aapke API key ke saare supported models instant list ho jate hain.
    - **System Persona**: *Principal Software Architect*, *Fast & Concise Copilot*, ya *Creative AI Strategist*.
3. **"Test & Save Key"** par click karein:
    - System Google API ko real live ping bhejta hai aur latency (ms) verify karke key securely `chrome.storage.local` me save karta hai. Automatic fallback handling ensure karta hai ki koi bhi model mismatch hone par working model assign ho jaye.
4. **Interactive Gemini Playground**:
    - Isi tab ke bottom me bane interactive test box me koi bhi coding ya prompt question type karein aur **"Run with Gemini ⚡"** dabayein — Live streaming response formatted markdown aur copy-code buttons ke sath milta hai.

---

## 6. One-Click AI Stacks (Batch Tab Launcher)

### 🎯 Yeh Kya Hai?
Jab aap kisi specific field par kaam karte hain (jaise Web Dev ya ML), aapko ek sath 4-5 websites kholni padti hain. AI Stacks unhe 1 click me ek saath open karta hai.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar se **"One-Click Stacks"** tab par click karein.
2. Built-in Stacks:
   - **ML & Data Stack**: ChatGPT + Claude + Cursor + Kaggle + Google Colab + Perplexity.
   - **Full-Stack Web Dev**: Cursor + v0 + Bolt.new + ChatGPT + Perplexity.
   - **Content & Media Creator**: Midjourney + Runway + ElevenLabs + Claude + Canva.
   - **Deep Research Stack**: Perplexity + Consensus + Elicit + Claude.
3. **"Open Full Stack in Tabs"** button dabate hi saare 5-6 tools individual tabs me khul jate hain.
4. **Custom Stack**: **"+ Create Stack"** par click karke aap apne manpasand tools ka naya stack bana sakte hain.

---

## 7. Universal Prompt Library (1-Click Copy & Launch)

### 🎯 Yeh Kya Hai?
Prompt engineering ke reusable, high-performance templates ka central hub with **✨ 1-Click Gemini Prompt Enhancement**.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar se **"Prompt Library"** tab par click karein.
2. Yahan curated prompts listed hain (e.g. *Senior Architect Code Review*, *Deep Research Synthesis*, *EDA Blueprint*, *Midjourney Photorealistic Master*).
3. **Actions**:
   - **"Copy Prompt"**: 1-click me prompt clipboard me copy ho jata hai.
   - **"✨" Button**: Gemini API ke through simple prompt ko automatically **Master Level Structured Prompt** me upgrade karta hai.
   - **"GPT" / "Claude" / "Gemini" Chips**: Chip par click karte hi prompt clipboard me copy hota hai aur selected AI model naye tab me khul jata hai.
4. **"+ Add Prompt"**: Modal me aap apna prompt likhte waqt **"✨ Enhance with Gemini"** button par click karke use auto-improve kar sakte hain.

---

## 8. Project Workspaces (Tools + Notes + Goals)

### 🎯 Yeh Kya Hai?
Ek specific project ke liye sabhi relevant tools, quick notes/TODOs, aur prompts ko ek organized container me rakhna.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar se **"Workspaces"** par jayein.
2. Default workspace: **"AI Engineering & Research"**
   - Linked Tools: Cursor, ChatGPT, Claude, Perplexity, Hugging Face.
   - Notes Box: Current focus, research targets, and notes.
3. **"Launch Workspace"** par click karte hi project se jude saare tools khul jate hain.
4. **"+ Create Workspace"**: Apna naya workspace banayein (e.g. *"College Thesis"*, *"SaaS MVP"*, *"YouTube Channel"*).

---

## 9. Multi-AI Challenge & Answer Judge

### 🎯 Yeh Kya Hai?
Ek hi sawal/prompt ko multiple frontier AI models (ChatGPT, Claude, Gemini, DeepSeek, Perplexity) ko ek sath bhejna aur unke answers ko compare karna.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar se **"Multi-AI Challenge"** par jayein.
2. Prompt box me apna sawal likhein (e.g. *"Explain Transformer Self-Attention mathematically"*).
3. Niche diye gaye checkboxes me se target AI models select karein (ChatGPT, Claude, Gemini, Perplexity, DeepSeek).
4. **"Broadcast & Open All Tabs"** par click karein:
   - Prompt automatically clipboard me copy ho jata hai.
   - Sabhi selected AI tools ke tabs open ho jate hain.
5. **Answer Judge Matrix**:
   - **Accuracy**: Fact-checking & citations verification.
   - **Completeness**: Nuances aur edge-cases coverage.
   - **Clarity**: Formatting, structure aur explanation quality.
   - **Reasoning**: Step-by-step logic aur proofs.

---

## 10. Custom Tool Management (Add / Delete Your Own Tools)

### 🎯 Yeh Kya Hai?
Aap default tools ke alawa internet ke kisi bhi AI tool ya custom website ko apne dashboard me add kar sakte hain.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Top-right me **"+ Add Tool"** button par click karein.
2. Form fields bharein:
   - **Tool Name**: (e.g. `Phind AI`)
   - **Category**: (Coding, Chat, Research, etc.)
   - **Website URL**: (`https://www.phind.com`)
   - **Description**: (Brief summary)
   - **Badge Text & Color**: (e.g. `PH` with `#6366f1` color)
   - **Tags**: (`coding, search, dev`)
   - **Add to Favorites**: (Checkbox)
3. **"Save Tool"** dabate hi card dashboard me live add ho jata hai aur local storage me save ho jata hai.
4. Custom tools par ek **"CUSTOM"** badge aur **Delete (Trash 🗑️)** button hota hai jisse aap use kabhi bhi delete kar sakte hain.

---

## 11. AI Assistant Copilot Side Drawer (Gemini Powered)

### 🎯 Yeh Kya Hai?
Ek slide-out interactive AI chatbot drawer jo dashboard ke andar hi real-time conversational assistance provide karta hai.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Top header ke chat bubble icon par click karein ya keyboard par **`Alt + A`** dabayein.
2. Right side se glassmorphic assistant drawer slide hota hai.
3. **Real AI Mode (When Gemini is Connected)**:
   - Full conversational multi-turn AI context.
   - Real code generation with syntax highlighting and **"Copy Code"** buttons.
   - Deep reasoning, technical debugging, and custom AI architecture planning.
4. **Offline Mode (Without API Key)**:
   - Local rule-based recommendations fallback.

---

## 11. Themes, Accent Colors & Backup System

### 🎯 Yeh Kya Hai?
Personalization aur complete data safety.

### ⚙️ Yeh Kaam Kaise Karta Hai?
1. Left sidebar se **"Settings & Themes"** par jayein.
2. **Themes**:
   - 🌌 **Cyber Onyx** (Deep dark blue/grey aesthetic)
   - 🖤 **OLED Pitch Black** (True #000000 black for OLED screens)
   - ⚡ **Cyberpunk Neon** (Cyan & magenta glowing neon highlights)
   - ☀️ **Clean Minimal Light** (High-contrast light mode)
3. **Accent Colors**:
   - Indigo Purple (`#6366f1`), Electric Blue (`#0284c7`), Emerald Green (`#10b981`), Rose Pink (`#f43f5e`), Amber Orange (`#f59e0b`).
4. **Data Backup & Restore**:
   - **"Export JSON Backup"**: 1 click me aapke saare custom tools, workspaces, stacks aur prompts ka `.json` file download ho jata hai.
   - **"Restore Backup"**: Purana backup file upload karke data instantly restore karein.

---

## 12. Keyboard Shortcuts Cheat Sheet

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Ctrl + T`** | Open Command Center | Naya tab kholne par AI Command Center load hota hai |
| **`/`** | Focus Search | Cursor seedha universal search input me chala jata hai |
| **`Alt + C`** | Launch ChatGPT | ChatGPT ko instant new tab me launch karta hai |
| **`Alt + G`** | Launch Google Gemini | Gemini ko instant new tab me launch karta hai |
| **`Alt + P`** | Launch Perplexity AI | Perplexity ko instant new tab me launch karta hai |
| **`Alt + A`** | Toggle AI Assistant | AI Copilot side drawer ko open / close karta hai |
| **`Escape`** | Close Modals / Drawer | Kisi bhi open modal ya drawer ko dismiss karta hai |

---

## 💡 Quick Start Verification (Aap Kaise Test Karein?)

1. **Chrome** kholein aur `chrome://extensions` par jayein.
2. **"Developer mode"** ON karein aur **"Load unpacked"** par click karke folder select karein:
   `d:\E drive\Github Projects\AI Command Center`
3. **`Ctrl + T`** dabayein aur har feature ko test karein!
