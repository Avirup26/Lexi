// Content script for Lexi - runs on every webpage
console.log('Lexi content script loaded');

let currentOverlay: HTMLElement | null = null;

// Listen for text selection
document.addEventListener('mouseup', (event: MouseEvent) => {
  const selectedText = window.getSelection()?.toString().trim();
  
  if (selectedText && selectedText.length > 0) {
    // Remove any existing overlay
    removeOverlay();
    
    // Show Lexi test overlay near the selection
    showLexiOverlay(selectedText, event.clientX, event.clientY);
    
    // Send selected text to background script
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: selectedText,
    });
  } else {
    // If no text selected, remove overlay
    removeOverlay();
  }
});

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRANSLATE_TEXT') {
    // Handle translation request
    console.log('Translation requested:', message.text);
    sendResponse({ success: true });
  }
  
  if (message.type === 'SHOW_TRANSLATION') {
    // Show translation widget
    createTranslationWidget(message.original, message.translation);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Show Lexi overlay near text selection
function showLexiOverlay(selectedText: string, mouseX: number, mouseY: number) {
  const overlay = document.createElement('div');
  overlay.id = 'lexi-selection-overlay';
  overlay.className = 'lexi-overlay';
  
  // Calculate position (offset from mouse to avoid covering selection)
  const offsetX = 10;
  const offsetY = 10;
  let left = mouseX + offsetX;
  let top = mouseY + offsetY;
  
  // Ensure overlay stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const overlayWidth = 280;
  const overlayHeight = 120;
  
  if (left + overlayWidth > viewportWidth) {
    left = mouseX - overlayWidth - offsetX;
  }
  if (top + overlayHeight > viewportHeight) {
    top = mouseY - overlayHeight - offsetY;
  }
  
  overlay.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
    border: 2px solid #0ea5e9;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1);
    z-index: 2147483647;
    max-width: 280px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: lexiFadeIn 0.2s ease-out;
  `;
  
  overlay.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">📚</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: #0ea5e9; font-size: 16px;">Lexi</div>
        <div style="font-size: 11px; color: #64748b;">AI Language Assistant</div>
      </div>
      <button id="lexi-overlay-close" style="
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        color: #94a3b8;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      " onmouseover="this.style.background='#f1f5f9'; this.style.color='#475569';" onmouseout="this.style.background='none'; this.style.color='#94a3b8';">×</button>
    </div>
    <div style="
      background: white;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #e0f2fe;
    ">
      <div style="font-size: 13px; color: #0ea5e9; font-weight: 600; margin-bottom: 6px;">
        🤖 Lexi UI Test Popup
      </div>
      <div style="font-size: 12px; color: #475569; line-height: 1.5;">
        Selected: <span style="font-weight: 600; color: #1e293b;">"${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"</span>
      </div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 8px; font-style: italic;">
        ✓ Overlay injection confirmed
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  
  // Close button handler
  const closeBtn = document.getElementById('lexi-overlay-close');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    removeOverlay();
  });
  
  // Setup event listeners for closing
  setupOverlayCloseListeners();
}

// Remove current overlay
function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    removeOverlayCloseListeners();
  }
}

// Event handler references (need to be stored to remove later)
let escapeKeyHandler: ((event: KeyboardEvent) => void) | null = null;
let clickOutsideHandler: ((event: MouseEvent) => void) | null = null;

// Setup listeners to close overlay
function setupOverlayCloseListeners() {
  // Create and store escape key handler
  escapeKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      event.stopPropagation();
      removeOverlay();
    }
  };
  
  // Create and store click outside handler
  clickOutsideHandler = (event: MouseEvent) => {
    if (currentOverlay && !currentOverlay.contains(event.target as Node)) {
      removeOverlay();
    }
  };
  
  // Add listeners immediately
  document.addEventListener('keydown', escapeKeyHandler, true); // Use capture phase
  
  // Delay click listener to prevent immediate close
  setTimeout(() => {
    if (clickOutsideHandler) {
      document.addEventListener('click', clickOutsideHandler, true);
    }
  }, 100);
}

// Remove overlay close listeners
function removeOverlayCloseListeners() {
  if (escapeKeyHandler) {
    document.removeEventListener('keydown', escapeKeyHandler, true);
    escapeKeyHandler = null;
  }
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler, true);
    clickOutsideHandler = null;
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes lexiFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .lexi-overlay {
    transition: opacity 0.2s ease-out;
  }
`;
document.head.appendChild(style);

// Create floating translation widget (for future use)
function createTranslationWidget(text: string, translation: string) {
  const widget = document.createElement('div');
  widget.id = 'lexi-translation-widget';
  widget.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #0ea5e9;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    max-width: 300px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  widget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #0ea5e9;">📚 Lexi</strong>
      <button id="lexi-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
    </div>
    <div style="margin-bottom: 8px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Original:</div>
      <div style="font-size: 14px;">${text}</div>
    </div>
    <div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Translation:</div>
      <div style="font-size: 14px; font-weight: 500;">${translation}</div>
    </div>
  `;
  
  document.body.appendChild(widget);
  
  // Close button handler
  document.getElementById('lexi-close')?.addEventListener('click', () => {
    widget.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    widget.remove();
  }, 10000);
}

export {};
