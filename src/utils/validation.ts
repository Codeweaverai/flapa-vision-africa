
import { z } from 'zod';

// Email validation with enhanced security
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .refine((email) => {
    // Additional validation for email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }, 'Invalid email format')
  .refine((email) => {
    // Prevent common injection patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }, 'Invalid email format');

// Phone number validation
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((phone) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }, 'Invalid phone number format')
  .refine((phone) => {
    // Basic international format validation
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }, 'Invalid phone number format');

// Password validation with security requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((password) => {
    // At least one lowercase letter
    return /[a-z]/.test(password);
  }, 'Password must contain at least one lowercase letter')
  .refine((password) => {
    // At least one uppercase letter
    return /[A-Z]/.test(password);
  }, 'Password must contain at least one uppercase letter')
  .refine((password) => {
    // At least one number
    return /\d/.test(password);
  }, 'Password must contain at least one number')
  .refine((password) => {
    // At least one special character
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }, 'Password must contain at least one special character');

// Text content validation to prevent XSS
export const textContentSchema = z
  .string()
  .max(5000, 'Content is too long')
  .refine((content) => {
    // Prevent script injection
    const scriptPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi
    ];
    return !scriptPatterns.some(pattern => pattern.test(content));
  }, 'Content contains potentially unsafe elements');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are allowed')
  .refine((url) => {
    // Prevent common XSS patterns in URLs
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  }, 'Invalid URL format');

// Sanitize text input
export const sanitizeText = (text: string): string => {
  return text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Rate limiting helper
export const isRateLimited = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing timestamps from localStorage
  const storageKey = `rate_limit_${key}`;
  const existing = localStorage.getItem(storageKey);
  let timestamps: number[] = [];
  
  if (existing) {
    try {
      timestamps = JSON.parse(existing).filter((timestamp: number) => timestamp > windowStart);
    } catch {
      timestamps = [];
    }
  }
  
  // Check if limit exceeded
  if (timestamps.length >= limit) {
    return true;
  }
  
  // Add current timestamp
  timestamps.push(now);
  localStorage.setItem(storageKey, JSON.stringify(timestamps));
  
  return false;
};

// Input validation schemas for forms
export const contactFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: textContentSchema
});

export const courseReviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  review_text: textContentSchema.optional()
});

export const eventRegistrationSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  ticket_quantity: z.number().min(1, 'At least 1 ticket required').max(10, 'Maximum 10 tickets allowed'),
  phone_number: phoneSchema.optional(),
  mobile_operator: z.string().optional()
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CourseReviewData = z.infer<typeof courseReviewSchema>;
export type EventRegistrationData = z.infer<typeof eventRegistrationSchema>;
