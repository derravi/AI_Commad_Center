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
        const tool = (typeof ToolsManager !== 'undefined' && ToolsManager.toolsList ? ToolsManager.toolsList.find(t => t.id === tId) : null) || { name: tId, iconBg: 'var(--accent-primary, #6366f1)', iconText: 'AI' };
        return `
          <div class="stack-tool-item">
            <div class="mini-tool-avatar" style="background: ${tool.iconBg || 'var(--accent-primary, #6366f1)'}; width: 24px; height: 24px; font-size: 10px;">
              ${tool.iconText || tool.name.slice(0, 2).toUpperCase()}
            </div>
            <span style="font-weight: 500;">${tool.name}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="stack-card" draggable="true" data-id="${stack.id}">
          <div class="stack-card-header">
            <div class="stack-title-box">
              <h3>${stack.name}</h3>
              <span class="badge badge-muted">${(stack.toolIds || []).length} Tools</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${stack.id.startsWith('custom-') ? `
                <button class="tool-action-btn" data-action="edit-stack" data-id="${stack.id}" title="Edit Stack">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="tool-action-btn" data-action="delete-stack" data-id="${stack.id}" title="Delete Stack">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
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
    container.querySelectorAll('[data-action="edit-stack"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.openEditModal(id);
      });
    });

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

    // Drag-to-Reorder mechanics
    this.initDragAndDrop(container);
  },

  /**
   * HTML5 Drag-and-Drop Reordering for Stacks
   */
  initDragAndDrop(container) {
    let draggedId = null;

    container.querySelectorAll('.stack-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.getAttribute('data-id');
        card.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
        container.querySelectorAll('.stack-card').forEach(c => c.classList.remove('drag-over-target'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over-target');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-target');
      });

      card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over-target');
        const targetId = card.getAttribute('data-id');

        if (!draggedId || draggedId === targetId) return;

        const fromIdx = this.stacksList.findIndex(s => s.id === draggedId);
        const toIdx = this.stacksList.findIndex(s => s.id === targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [movedStack] = this.stacksList.splice(fromIdx, 1);
          this.stacksList.splice(toIdx, 0, movedStack);

          await StorageManager.set({ stacks: this.stacksList });
          this.renderStacks();
        }
      });
    });
  },

  /**
   * Open Edit Modal for a Stack
   * @param {string} stackId
   */
  openEditModal(stackId) {
    const stack = this.stacksList.find(s => s.id === stackId);
    if (!stack) return;

    const modal = document.getElementById('modal-add-stack');
    const form = document.getElementById('form-add-stack');
    if (!modal || !form) return;

    const titleEl = modal.querySelector('.modal-header h3');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (titleEl) titleEl.textContent = 'Edit AI Stack';
    if (submitBtn) submitBtn.textContent = 'Update Stack';

    form.dataset.editId = stack.id;
    const nameInp = document.getElementById('input-stack-name');
    const descInp = document.getElementById('input-stack-description');

    if (nameInp) nameInp.value = stack.name || '';
    if (descInp) descInp.value = stack.description || '';

    // Re-populate and check tools
    const checkboxesContainer = document.getElementById('stack-tools-checkboxes');
    if (checkboxesContainer && typeof ToolsManager !== 'undefined') {
      checkboxesContainer.innerHTML = ToolsManager.toolsList.map(t => {
        const isChecked = (stack.toolIds || []).includes(t.id) ? 'checked' : '';
        return `
          <label class="ai-checkbox-label" style="font-size: 12px; padding: 4px 8px;">
            <input type="checkbox" value="${t.id}" ${isChecked}>
            <span>${t.name}</span>
          </label>
        `;
      }).join('');
    }

    UI.openModal('modal-add-stack');
  },

  /**
   * Update existing custom stack
   * @param {string} stackId
   * @param {object} stackData
   */
  async updateStack(stackId, stackData) {
    const index = this.stacksList.findIndex(s => s.id === stackId);
    if (index === -1) {
      UI.showToast('Stack not found', 'error');
      return false;
    }

    if (!stackData.name || !stackData.toolIds || stackData.toolIds.length === 0) {
      UI.showToast('Please specify a name and select at least one tool', 'error');
      return false;
    }

    this.stacksList[index] = {
      ...this.stacksList[index],
      name: stackData.name.trim().slice(0, 80),
      description: stackData.description ? stackData.description.trim().slice(0, 300) : 'Custom tool stack',
      toolIds: stackData.toolIds
    };

    await StorageManager.set({ stacks: this.stacksList });
    this.renderStacks();
    UI.showToast(`Updated stack "${this.stacksList[index].name}"!`, 'success');
    return true;
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
      const tool = typeof ToolsManager !== 'undefined' && ToolsManager.toolsList ? ToolsManager.toolsList.find(t => t.id === toolId) : null;
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
      name: stackData.name.trim().slice(0, 80),
      description: stackData.description ? stackData.description.trim().slice(0, 300) : 'Custom tool stack',
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
    const stack = this.stacksList.find(s => s.id === stackId);
    const stackName = stack ? stack.name : 'this AI Stack';

    const ok = await UI.confirm({
      title: 'Delete AI Stack',
      message: `Are you sure you want to delete stack "${stackName}"?`,
      confirmText: 'Delete Stack',
      danger: true
    });

    if (ok) {
      this.stacksList = this.stacksList.filter(s => s.id !== stackId);
      await StorageManager.set({ stacks: this.stacksList });
      this.renderStacks();
      UI.showToast('Stack removed', 'info');
    }
  }
};
