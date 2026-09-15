/**
 * AI Command Center - Application Bootstrap
 * Orchestrates extension startup, module initialization, and global keyboard shortcuts.
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize storage defaults
    await StorageManager.initDefaults();

    // 2. Initialize Gemini Intelligence Engine
    if (typeof GeminiClient !== 'undefined') {
      await GeminiClient.init();
    }

    // 3. Initialize UI & Core Components
    await UI.init();

    // 4. Initialize Localhost Quick Access Bar
    if (typeof LocalhostManager !== 'undefined') {
      await LocalhostManager.init();
    }

    // 5. Initialize Tools & Catalogs
    await ToolsManager.init();

    // 6. Initialize Universal Search
    await SearchManager.init();

    // 7. Initialize Smart AI Router
    SmartRouter.init();

    // 8. Initialize Stacks & Workflows
    await WorkflowManager.init();

    // 9. Initialize Prompt Library
    await PromptLibrary.init();

    // 10. Initialize Multi-AI & Assistant Drawer
    AssistantManager.init();

    // 12. Initialize Chrome Cache & Storage Manager
    if (typeof CacheManager !== 'undefined') {
      await CacheManager.init();
    }

    // 13. Bind Global Keyboard Shortcuts
    initKeyboardShortcuts();

    // 14. First-Time Onboarding Check
    await checkFirstRunOnboarding();

    console.log('🚀 AI Command Center successfully initialized.');
  } catch (error) {
    console.error('Error initializing AI Command Center:', error);
    showInitErrorBoundary(error);
  }
});

/**
 * Check and show first-run onboarding walkthrough if new user
 */
async function checkFirstRunOnboarding() {
  const data = await StorageManager.get(['settings']);
  const settings = data.settings || {};

  if (!settings.hasSeenOnboarding) {
    setTimeout(() => {
      UI.openModal('modal-onboarding');
    }, 350);

    const dismissBtn = document.getElementById('btn-onboarding-dismiss');
    const connectGeminiBtn = document.getElementById('btn-onboarding-connect-gemini');

    const markSeen = async () => {
      settings.hasSeenOnboarding = true;
      await StorageManager.set({ settings });
    };

    if (dismissBtn) {
      dismissBtn.addEventListener('click', async () => {
        await markSeen();
        UI.closeAllModals();
      });
    }

    if (connectGeminiBtn) {
      connectGeminiBtn.addEventListener('click', async () => {
        await markSeen();
        UI.closeAllModals();
        UI.switchView('apihub');
      });
    }

    const modalEl = document.getElementById('modal-onboarding');
    if (modalEl) {
      modalEl.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(b => {
        b.addEventListener('click', () => markSeen());
      });
    }
  }
}

/**
 * Global Error Boundary for Startup & Runtime Failures
 * Displays a recovery panel so the user is never stuck on a blank/broken new tab.
 * @param {Error|any} error
 */
function showInitErrorBoundary(error) {
  const existingBoundary = document.getElementById('aicc-error-boundary');
  if (existingBoundary) return;

  const errorMessage = error?.message || String(error) || 'An unexpected initialization error occurred.';
  const errorStack = error?.stack || '';

  const overlay = document.createElement('div');
  overlay.id = 'aicc-error-boundary';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(10, 15, 29, 0.94);
    backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f1f5f9;
  `;

  overlay.innerHTML = `
    <div style="
      background: #111827;
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 16px;
      max-width: 540px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15);
      text-align: center;
    ">
      <div style="
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      ">⚠️</div>

      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #ffffff;">
        Startup Issue Detected
      </h2>
      <p style="font-size: 13.5px; color: #94a3b8; margin: 0 0 18px; line-height: 1.5;">
        AI Command Center encountered an issue during startup. You can reload or perform a clean reset to restore the extension.
      </p>

      <div style="
        background: #0b0f19;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 24px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        color: #fca5a5;
        text-align: left;
        max-height: 120px;
        overflow-y: auto;
        word-break: break-word;
      ">
        ${errorMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>

      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button id="aicc-err-reload" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        ">
          🔄 Reload Extension
        </button>

        <button id="aicc-err-reset" style="
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.35);
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        ">
          🛠️ Reset to Defaults
        </button>

        <button id="aicc-err-copy" style="
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        ">
          📋 Copy Details
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('aicc-err-reload')?.addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('aicc-err-reset')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all data and restore default settings?')) {
      try {
        await StorageManager.resetToDefaults();
        window.location.reload();
      } catch (e) {
        alert('Failed to reset: ' + e.message);
      }
    }
  });

  document.getElementById('aicc-err-copy')?.addEventListener('click', () => {
    const details = `AI Command Center Error Report\nDate: ${new Date().toISOString()}\nMessage: ${errorMessage}\nStack: ${errorStack}`;
    navigator.clipboard.writeText(details);
    const copyBtn = document.getElementById('aicc-err-copy');
    if (copyBtn) copyBtn.textContent = '✓ Copied!';
  });
}

/**
 * Global Keyboard Shortcuts Handler
 * Alt + C -> ChatGPT
 * Alt + G -> Gemini
 * Alt + P -> Perplexity
 * Alt + A -> Toggle AI Assistant Drawer
 */
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field or editable element
    const isContentEditable = Boolean(document.activeElement && (document.activeElement.isContentEditable || document.activeElement.getAttribute('contenteditable') === 'true'));
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || isContentEditable) {
      return;
    }

    if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      ToolsManager.launchTool('chatgpt');
    } else if (e.altKey && (e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      ToolsManager.launchTool('gemini');
    } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      ToolsManager.launchTool('perplexity');
    } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      const drawer = document.getElementById('assistant-drawer');
      if (drawer) drawer.classList.toggle('open');
    }
  });

  // Listen to Chrome Extension command shortcuts if available
  if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'open_chatgpt') ToolsManager.launchTool('chatgpt');
      if (command === 'open_gemini') ToolsManager.launchTool('gemini');
      if (command === 'open_perplexity') ToolsManager.launchTool('perplexity');
    });
  }
}
