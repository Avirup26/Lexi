// Immersive Toggle - Floating toggle button for immersive reading mode

import { loadData, saveData } from '../storage/storageManager';
import { Z_INDEX, CLASS_NAMES } from '../utils/constants';
import type { UserSettings } from '../types';

let toggleElement: HTMLElement | null = null;
let isExpanded = true;
let currentLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
let isImmersiveMode = false;

/**
 * Initialize immersive mode toggle
 */
export function initializeImmersiveMode(): void {
  // Load settings
  loadSettings().then(() => {
    createToggle();
    attachEventListeners();
  });
}

/**
 * Load user settings
 */
async function loadSettings(): Promise<void> {
  const settings = await loadData<UserSettings>('settings');
  if (settings) {
    currentLevel = settings.readingLevel || 'beginner';
  }
}

/**
 * Create toggle UI
 */
function createToggle(): void {
  toggleElement = document.createElement('div');
  toggleElement.id = 'lexi-immersive-toggle';
  toggleElement.className = CLASS_NAMES.TOGGLE;
  
  toggleElement.innerHTML = `
    <div class="lexi-toggle-header">
      <div class="lexi-toggle-icon">📚</div>
      <div class="lexi-toggle-title">Lexi Reading Mode</div>
      <button class="lexi-toggle-minimize" id="lexi-toggle-minimize">−</button>
    </div>
    
    <div class="lexi-toggle-content" id="lexi-toggle-content">
      <div class="lexi-toggle-switch-container">
        <label class="lexi-toggle-label">Immersive Mode</label>
        <label class="lexi-switch">
          <input type="checkbox" id="lexi-immersive-switch">
          <span class="lexi-slider"></span>
        </label>
      </div>
      
      <div class="lexi-toggle-level" id="lexi-toggle-level">
        <label class="lexi-toggle-label">Reading Level</label>
        <select id="lexi-level-select" class="lexi-select">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      
      <button class="lexi-summary-btn" id="lexi-summary-btn">
        📝 Quick Summary
      </button>
    </div>
  `;

  applyStyles();
  document.body.appendChild(toggleElement);
  
  // Set initial level
  const levelSelect = document.getElementById('lexi-level-select') as HTMLSelectElement;
  if (levelSelect) {
    levelSelect.value = currentLevel;
  }
  
  // Make draggable
  makeDraggable();
}

/**
 * Apply CSS styles
 */
function applyStyles(): void {
  if (!toggleElement) return;

  const styles = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 280px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: ${Z_INDEX.TOGGLE};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.3s ease;
  `;
  
  toggleElement.style.cssText = styles;
}

/**
 * Attach event listeners
 */
function attachEventListeners(): void {
  if (!toggleElement) return;

  // Toggle switch
  const switchEl = document.getElementById('lexi-immersive-switch') as HTMLInputElement;
  switchEl?.addEventListener('change', handleToggleSwitch);

  // Level select
  const levelSelect = document.getElementById('lexi-level-select') as HTMLSelectElement;
  levelSelect?.addEventListener('change', handleLevelChange);

  // Minimize button
  const minimizeBtn = document.getElementById('lexi-toggle-minimize');
  minimizeBtn?.addEventListener('click', handleMinimize);

  // Summary button
  const summaryBtn = document.getElementById('lexi-summary-btn');
  summaryBtn?.addEventListener('click', handleSummaryClick);
}

/**
 * Handle toggle switch change
 */
function handleToggleSwitch(event: Event): void {
  const target = event.target as HTMLInputElement;
  isImmersiveMode = target.checked;
  
  // Emit event
  document.dispatchEvent(new CustomEvent('immersive-mode-changed', {
    detail: { enabled: isImmersiveMode, level: currentLevel }
  }));
  
  // Update UI
  if (toggleElement) {
    toggleElement.classList.toggle('lexi-toggle-active', isImmersiveMode);
  }
}

/**
 * Handle level change
 */
function handleLevelChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  currentLevel = target.value as 'beginner' | 'intermediate' | 'advanced';
  
  // Save to storage
  saveData('settings', { readingLevel: currentLevel });
  
  // Emit event
  document.dispatchEvent(new CustomEvent('reading-level-changed', {
    detail: { level: currentLevel }
  }));
}

/**
 * Handle minimize button
 */
function handleMinimize(): void {
  isExpanded = !isExpanded;
  const content = document.getElementById('lexi-toggle-content');
  const minimizeBtn = document.getElementById('lexi-toggle-minimize');
  
  if (content && minimizeBtn) {
    if (isExpanded) {
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      if (toggleElement) toggleElement.style.width = '280px';
    } else {
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      if (toggleElement) toggleElement.style.width = '200px';
    }
  }
}

/**
 * Handle summary button click
 */
function handleSummaryClick(): void {
  document.dispatchEvent(new CustomEvent('open-summary-modal'));
}

/**
 * Make toggle draggable
 */
function makeDraggable(): void {
  if (!toggleElement) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  const header = toggleElement.querySelector('.lexi-toggle-header') as HTMLElement;
  if (!header) return;

  header.style.cursor = 'move';

  header.addEventListener('mousedown', (e: MouseEvent) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = toggleElement!.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging || !toggleElement) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    toggleElement.style.left = `${initialX + dx}px`;
    toggleElement.style.top = `${initialY + dy}px`;
    toggleElement.style.right = 'auto';
    toggleElement.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

/**
 * Show toggle
 */
export function showToggle(): void {
  if (toggleElement) {
    toggleElement.style.display = 'block';
  }
}

/**
 * Hide toggle
 */
export function hideToggle(): void {
  if (toggleElement) {
    toggleElement.style.display = 'none';
  }
}

/**
 * Get immersive mode state
 */
export function getImmersiveState(): boolean {
  return isImmersiveMode;
}

/**
 * Get reading level
 */
export function getReadingLevel(): 'beginner' | 'intermediate' | 'advanced' {
  return currentLevel;
}
