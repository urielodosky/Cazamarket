import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an input string to prevent XSS.
 * Removes any script tags, inline handlers, or malicious HTML,
 * while allowing basic text and formatting if needed.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}
