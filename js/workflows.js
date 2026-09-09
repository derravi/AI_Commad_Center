/**
 * AI Command Center - Workflows & Stacks Manager
 * Handles One-Click AI Stacks and Step-by-Step AI Workflows.
 */
const WorkflowManager = {
  stacksList: [],

  /**
   * Initialize Stacks
   */
  async init() {
    const data = await StorageManager.get('stacks');
    this.stacksList = data.stacks || [];
    this.renderStacks();
  },

  /**
   * Render AI Stacks Grid
   */
  renderStacks() {
    const container = document.getElementById('stacks-grid-container');
    if (!container) return;

    if (this.stacksList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-dim);">
          <p>No AI Stacks configured yet. Click "Create Stack" to assemble your first multi-tool stack.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.stacksList.map(stack => {
      const toolItemsHtml = (stack.toolIds || []).map(tId => {
        const tool = ToolsManager.toolsList.find(t => t.id === tId) || { name: tId, iconBg: '#6366f1', iconText: 'AI' };
        return `
          <div class="stack-tool-item">
            <div class="mini-tool-avatar" style="background: ${tool.iconBg || '#6366f1'}; width: 24px; height: 24px; font-size: 10px;">
              ${tool.iconText || tool.name.slice(0, 2).toUpperCase()}
            </div>
            <span style="font-weight: 500;">${tool.name}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="stack-card" data-id="${stack.id}">
          <div class="stack-card-header">
            <div class="stack-title-box">
              <h3>${stack.name}</h3>
              <span class="badge badge-muted">${(stack.toolIds || []).length} Tools</span>
            </div>
            ${stack.id.startsWith('custom-') ? `
              <button class="tool-action-btn" data-action="delete-stack" data-id="${stack.id}" title="Delete Stack">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
          <p class="stack-desc">${stack.description || 'Quickly open this stack of tools in individual Chrome tabs.'}</p>
          <div class="stack-tools-list">
            ${toolItemsHtml}
          </div>
          <button class="stack-launch-all-btn" data-action="launch-stack" data-id="${stack.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Open Full Stack in Tabs
          </button>
        </div>
      `;
    }).join('');

    // Attach event listeners to prevent CSP inline event handler violations
    container.querySelectorAll('[data-action="delete-stack"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.deleteStack(id);
      });
    });

    container.querySelectorAll('[data-action="launch-stack"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.launchStack(id);
      });
    });
  },

  /**
   * Launch all tools in a stack simultaneously
   * @param {string} stackId
   */
  launchStack(stackId) {
    const stack = this.stacksList.find(s => s.id === stackId);
    if (!stack || !stack.toolIds) return;

    let launchedCount = 0;
    const missingTools = [];

    stack.toolIds.forEach(toolId => {
      const tool = ToolsManager.toolsList.find(t => t.id === toolId);
      if (tool) {
        ToolsManager.launchTool(toolId);
        launchedCount++;
      } else {
        missingTools.push(toolId);
      }
    });

    if (missingTools.length > 0) {
      UI.showToast(`Launched ${launchedCount} tools. (${missingTools.length} tool(s) in stack not found)`, 'warning');
    } else if (launchedCount > 0) {
      UI.showToast(`Launched ${stack.name} (${launchedCount} tabs)!`, 'success');
    }
  },

  /**
   * Create and save a new custom stack
   * @param {object} stackData
   */
  async createStack(stackData) {
    if (!stackData.name || !stackData.toolIds || stackData.toolIds.length === 0) {
      UI.showToast('Please specify a name and select at least one tool', 'error');
      return false;
    }

    const newStack = {
      id: 'custom-stack-' + Date.now(),
      name: stackData.name.trim(),
      description: stackData.description ? stackData.description.trim() : 'Custom tool stack',
      toolIds: stackData.toolIds
    };

    this.stacksList.push(newStack);
    await StorageManager.set({ stacks: this.stacksList });
    this.renderStacks();
    UI.showToast(`Stack "${newStack.name}" created!`, 'success');
    return true;
  },

  /**
   * Delete a custom stack
   * @param {string} stackId
   */
  async deleteStack(stackId) {
    if (confirm('Delete this AI Stack?')) {
      this.stacksList = this.stacksList.filter(s => s.id !== stackId);
      await StorageManager.set({ stacks: this.stacksList });
      this.renderStacks();
      UI.showToast('Stack deleted', 'info');
    }
  }
};
