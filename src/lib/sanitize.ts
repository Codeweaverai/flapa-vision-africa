import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    // Allow common HTML tags for content rendering
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sup', 'sub', 'mark', 'small', 'del', 'ins', 'figure', 'figcaption'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'style', 'width', 'height', 'colspan', 'rowspan'
    ],
    // Force all links to open in new tab with noopener
    ADD_ATTR: ['target', 'rel'],
    // Additional security options
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

/**
 * Sanitize HTML content for rich text editors (more permissive)
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeRichText = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    // Allow more tags for rich content
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sup', 'sub', 'mark', 'small', 'del', 'ins', 'figure', 'figcaption',
      'video', 'audio', 'source', 'picture'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'style', 'width', 'height', 'colspan', 'rowspan', 'controls',
      'autoplay', 'loop', 'muted', 'poster', 'preload', 'type'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

export default sanitizeHtml;
