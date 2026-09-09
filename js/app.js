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

    // 10. Initialize Workspaces
    await WorkspaceManager.init();

    // 11. Initialize Multi-AI & Assistant Drawer
    AssistantManager.init();

    // 12. Bind Global Keyboard Shortcuts
    initKeyboardShortcuts();

    console.log('🚀 AI Command Center successfully initialized.');
  } catch (error) {
    console.error('Error initializing AI Command Center:', error);
  }
});

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
