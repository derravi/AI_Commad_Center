/**
 * AI Command Center - Category Definitions
 */
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Tools', icon: 'grid', color: '#6366f1' },
  { id: 'chat', name: 'AI Chat & LLMs', icon: 'message-square', color: '#8b5cf6' },
  { id: 'coding', name: 'Coding & Dev', icon: 'code', color: '#3b82f6' },
  { id: 'research', name: 'Search & Research', icon: 'compass', color: '#06b6d4' },
  { id: 'image', name: 'Image & Art', icon: 'image', color: '#ec4899' },
  { id: 'video', name: 'Video & Animation', icon: 'video', color: '#f43f5e' },
  { id: 'audio', name: 'Voice & Audio', icon: 'volume-2', color: '#f59e0b' },
  { id: 'writing', name: 'Writing & Copy', icon: 'feather', color: '#10b981' },
  { id: 'data', name: 'Data & Analytics', icon: 'bar-chart-2', color: '#14b8a6' },
  { id: 'productivity', name: 'Productivity', icon: 'zap', color: '#eab308' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_CATEGORIES };
}
