// Position Helpers - Calculate optimal positions for UI elements

/**
 * Get optimal tooltip position near target element
 */
export function getOptimalTooltipPosition(
  targetRect: DOMRect,
  tooltipWidth: number = 250,
  tooltipHeight: number = 100
): { x: number; y: number; placement: 'top' | 'bottom' | 'left' | 'right' } {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Try above first
  if (targetRect.top - tooltipHeight - padding > 0) {
    const x = Math.max(padding, Math.min(
      targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      viewportWidth - tooltipWidth - padding
    ));
    const y = targetRect.top - tooltipHeight - padding;
    return { x, y, placement: 'top' };
  }

  // Try below
  if (targetRect.bottom + tooltipHeight + padding < viewportHeight) {
    const x = Math.max(padding, Math.min(
      targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      viewportWidth - tooltipWidth - padding
    ));
    const y = targetRect.bottom + padding;
    return { x, y, placement: 'bottom' };
  }

  // Try right
  if (targetRect.right + tooltipWidth + padding < viewportWidth) {
    const x = targetRect.right + padding;
    const y = Math.max(padding, Math.min(
      targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
      viewportHeight - tooltipHeight - padding
    ));
    return { x, y, placement: 'right' };
  }

  // Fallback to left
  const x = Math.max(padding, targetRect.left - tooltipWidth - padding);
  const y = Math.max(padding, Math.min(
    targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
    viewportHeight - tooltipHeight - padding
  ));
  return { x, y, placement: 'left' };
}

/**
 * Get optimal modal position (centered with scroll offset)
 */
export function getOptimalModalPosition(
  modalWidth: number = 600,
  modalHeight: number = 400
): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  const x = (viewportWidth - modalWidth) / 2;
  const y = scrollY + (viewportHeight - modalHeight) / 3; // Offset from top for better UX

  return { x: Math.max(0, x), y: Math.max(scrollY, y) };
}

/**
 * Avoid screen edges
 */
export function avoidScreenEdges(
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number = 16
): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Clamp X
  const clampedX = Math.max(
    padding,
    Math.min(x, viewportWidth - width - padding)
  );

  // Clamp Y
  const clampedY = Math.max(
    padding,
    Math.min(y, viewportHeight - height - padding)
  );

  return { x: clampedX, y: clampedY };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(rect: DOMRect): boolean {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Get scroll offset
 */
export function getScrollOffset(): { x: number; y: number } {
  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  };
}

/**
 * Calculate arrow position for tooltip
 */
export function calculateArrowPosition(
  placement: 'top' | 'bottom' | 'left' | 'right',
  tooltipRect: DOMRect,
  targetRect: DOMRect
): string {
  const arrowSize = 8;

  if (placement === 'top' || placement === 'bottom') {
    const targetCenter = targetRect.left + targetRect.width / 2;
    const tooltipLeft = tooltipRect.left;
    const arrowLeft = targetCenter - tooltipLeft - arrowSize;
    return `left: ${arrowLeft}px;`;
  } else {
    const targetCenter = targetRect.top + targetRect.height / 2;
    const tooltipTop = tooltipRect.top;
    const arrowTop = targetCenter - tooltipTop - arrowSize;
    return `top: ${arrowTop}px;`;
  }
}
