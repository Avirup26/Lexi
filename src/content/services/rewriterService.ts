// Rewriter Service - Wrapper for Chrome Rewriter API

/**
 * Rewrite text using Chrome's Rewriter API
 */
export async function rewriteText(text: string, style?: string): Promise<string> {
  try {
    // Check if Rewriter API is available
    if (!(self as any).ai || !(self as any).ai.rewriter) {
      throw new Error('Rewriter API not available');
    }

    // Check availability
    const availability = await (self as any).ai.rewriter.capabilities();
    if (availability.available !== 'readily' && availability.available !== 'available') {
      throw new Error(`Rewriter not ready. Status: ${availability.available}`);
    }

    // Create rewriter instance
    const options: any = {};
    if (style) {
      options.tone = style;
    }

    const rewriter = await (self as any).ai.rewriter.create(options);

    // Rewrite the text
    const result = await rewriter.rewrite(text);

    // Clean up
    rewriter.destroy?.();

    return result;
  } catch (error) {
    console.error('Rewrite error:', error);
    throw error;
  }
}

/**
 * Check if Rewriter API is available
 */
export async function isRewriterAvailable(): Promise<boolean> {
  try {
    if (!(self as any).ai || !(self as any).ai.rewriter) {
      return false;
    }

    const capabilities = await (self as any).ai.rewriter.capabilities();
    return capabilities.available === 'readily' || capabilities.available === 'available';
  } catch {
    return false;
  }
}

/**
 * Rewrite with specific tone
 */
export async function rewriteWithTone(
  text: string,
  tone: 'formal' | 'casual' | 'professional' | 'friendly'
): Promise<string> {
  return rewriteText(text, tone);
}

/**
 * Simplify text (make it easier to read)
 */
export async function simplifyText(text: string): Promise<string> {
  try {
    // Try to rewrite with simpler language
    const rewriter = await (self as any).ai.rewriter.create({
      tone: 'casual',
      complexity: 'simple',
    });

    const result = await rewriter.rewrite(text);
    rewriter.destroy?.();

    return result;
  } catch (error) {
    // Fallback to regular rewrite
    return rewriteText(text);
  }
}
