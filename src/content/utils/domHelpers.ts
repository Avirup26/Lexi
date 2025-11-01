// DOM Helpers - Utility functions for DOM manipulation

/**
 * Create element with class and content
 */
export function createElement(
  tag: string,
  className?: string,
  innerHTML?: string
): HTMLElement {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (innerHTML) {
    element.innerHTML = innerHTML;
  }
  return element;
}

/**
 * Find all text nodes in element
 */
export function findTextNodes(element: Element): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip empty or whitespace-only nodes
        if (!node.textContent || !node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip nodes in script, style, or code elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'code', 'pre', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  return textNodes;
}

/**
 * Wrap word in text node with span
 */
export function wrapWord(
  textNode: Text,
  word: string,
  className: string
): void {
  const text = textNode.textContent || '';
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
  
  // Check if word exists in text
  if (!regex.test(text)) {
    return;
  }

  // Create document fragment with wrapped words
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  const matches = text.matchAll(regex);

  for (const match of matches) {
    const matchIndex = match.index!;
    
    // Add text before match
    if (matchIndex > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex, matchIndex))
      );
    }

    // Add wrapped word
    const span = document.createElement('span');
    span.className = className;
    span.textContent = match[0];
    span.dataset.word = word.toLowerCase();
    fragment.appendChild(span);

    lastIndex = matchIndex + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }

  // Replace text node with fragment
  textNode.parentNode?.replaceChild(fragment, textNode);
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove all highlights
 */
export function removeHighlights(className: string): void {
  const highlights = document.querySelectorAll(`.${className}`);
  highlights.forEach((highlight) => {
    const text = highlight.textContent || '';
    const textNode = document.createTextNode(text);
    highlight.parentNode?.replaceChild(textNode, highlight);
  });
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.bottom <= window.innerHeight
  );
}

/**
 * Get element position relative to viewport
 */
export function getElementPosition(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Append element with fade-in animation
 */
export function appendWithFadeIn(parent: Element, child: HTMLElement, duration: number = 300): void {
  child.style.opacity = '0';
  child.style.transition = `opacity ${duration}ms ease`;
  parent.appendChild(child);
  
  requestAnimationFrame(() => {
    child.style.opacity = '1';
  });
}

/**
 * Remove element with fade-out animation
 */
export function removeWithFadeOut(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.remove();
      resolve();
    }, duration);
  });
}
