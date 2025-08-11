
import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
}

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ 
  html, 
  className,
  allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  allowedAttributes = {
    '*': ['class'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height']
  }
}) => {
  const sanitizeConfig = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: Object.keys(allowedAttributes).reduce((acc, tag) => {
      if (tag === '*') {
        acc.push(...allowedAttributes[tag]);
      } else {
        acc.push(...allowedAttributes[tag]);
      }
      return acc;
    }, [] as string[]),
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  };

  const sanitizedHtml = DOMPurify.sanitize(html, sanitizeConfig);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtmlRenderer;
