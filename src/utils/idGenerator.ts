// Simple UUID v4 generator for unique IDs
// Based on RFC4122 compliant UUID v4 generation

/**
 * Generates a RFC4122 compliant UUID v4.
 * Uses crypto.randomUUID() if available, otherwise falls back to a polyfill.
 * 
 * @returns A unique UUID string in the format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback polyfill for environments without crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a short unique ID (for backward compatibility with existing IDs).
 * Format: "prefix-timestamp-random"
 * 
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateShortId(prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 11);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}
