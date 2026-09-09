/**
 * AI Command Center - Project Workspaces Manager
 * Unifies project tools, markdown notes, prompts, and sessions in single cohesive dashboards.
 */
const WorkspaceManager = {
  workspacesList: [],

  /**
   * Initialize Workspaces
   */
  async init() {
    const data = await StorageManager.get('workspaces');
    this.workspacesList = data.workspaces || [];
    this.renderWorkspaces();
  },

  /**
   * Render Workspaces Grid
   */
  renderWorkspaces() {
    const container = document.getElementById('workspaces-grid-container');
    if (!container) return;

    if (this.workspacesList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-dim);">
          <p>No Project Workspaces created yet. Click "Create Workspace" to group tools and notes for a specific project.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.workspacesList.map(ws => {
      const safeWsName = this.escapeHtml(ws.name);
      const safeWsDesc = this.escapeHtml(ws.description || 'Active project workspace');
      const safeWsId = this.escapeHtml(ws.id);

      const toolIconsHtml = (ws.toolIds || []).map(tId => {
        const tool = ToolsManager.toolsList.find(t => t.id === tId) || { name: tId, iconBg: '#6366f1', iconText: 'AI' };
        const safeToolName = this.escapeHtml(tool.name);
        const safeToolIcon = this.escapeHtml(tool.iconText || tool.name.slice(0, 2).toUpperCase());
        return `
          <div class="mini-tool-avatar" style="background: ${tool.iconBg || '#6366f1'}; width: 28px; height: 28px; font-size: 11px;" title="${safeToolName}">
            ${safeToolIcon}
          </div>
        `;
      }).join('');

      return `
        <div class="workspace-card" data-id="${safeWsId}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <h3 style="font-size: 18px; margin-bottom: 4px;">${safeWsName}</h3>
              <p style="font-size: 13px; color: var(--text-muted);">${safeWsDesc}</p>
            </div>
            ${ws.id !== 'ws-main' ? `
              <button class="tool-action-btn" data-action="delete-workspace" data-id="${safeWsId}" title="Delete Workspace">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>

          <div class="workspace-notes-box">
            <strong style="color: var(--text-highlight); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Project Notes & Goals:</strong>
            ${ws.notes ? this.escapeHtml(ws.notes) : 'No notes added yet.'}
          </div>

          <div style="margin-bottom: 18px;">
            <span style="font-size: 12px; font-weight: 600; color: var(--text-dim); display: block; margin-bottom: 8px;">Workspace Tools:</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${toolIconsHtml || '<span style="font-size: 12px; color: var(--text-dim);">No tools linked</span>'}
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: auto;">
            <button class="btn-primary" style="flex: 1; justify-content: center;" data-action="launch-workspace" data-id="${safeWsId}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Launch Workspace
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to prevent CSP inline event handler violations
    container.querySelectorAll('[data-action="delete-workspace"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.deleteWorkspace(id);
      });
    });

    container.querySelectorAll('[data-action="launch-workspace"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.launchWorkspaceTools(id);
      });
    });
  },

  /**
   * Launch all tools of a workspace
   * @param {string} workspaceId
   */
  launchWorkspaceTools(workspaceId) {
    const ws = this.workspacesList.find(w => w.id === workspaceId);
    if (!ws || !ws.toolIds) return;

    ws.toolIds.forEach(toolId => {
      ToolsManager.launchTool(toolId);
    });

    UI.showToast(`Launched Workspace "${ws.name}" (${ws.toolIds.length} tools)!`, 'success');
  },

  /**
   * Create new workspace
   * @param {object} wsData
   */
  async createWorkspace(wsData) {
    if (!wsData.name) {
      UI.showToast('Please provide a Workspace Name', 'error');
      return false;
    }

    const newWs = {
      id: 'custom-ws-' + Date.now(),
      name: wsData.name.trim(),
      description: wsData.description ? wsData.description.trim() : '',
      notes: wsData.notes ? wsData.notes.trim() : '',
      toolIds: wsData.toolIds || ['chatgpt', 'cursor', 'perplexity']
    };

    this.workspacesList.push(newWs);
    await StorageManager.set({ workspaces: this.workspacesList });
    this.renderWorkspaces();
    UI.showToast(`Workspace "${newWs.name}" created!`, 'success');
    return true;
  },

  /**
   * Delete workspace
   * @param {string} wsId
   */
  async deleteWorkspace(wsId) {
    if (confirm('Delete this workspace?')) {
      this.workspacesList = this.workspacesList.filter(w => w.id !== wsId);
      await StorageManager.set({ workspaces: this.workspacesList });
      this.renderWorkspaces();
      UI.showToast('Workspace removed', 'info');
    }
  },

  /**
   * Escape HTML special characters to prevent XSS injection
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
