
import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { isRateLimited, sanitizeText } from '@/utils/validation';

interface UseSecureFormOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  rateLimitKey?: string;
  rateLimitCount?: number;
  rateLimitWindow?: number;
}

export function useSecureForm<T>({
  schema,
  onSubmit,
  rateLimitKey,
  rateLimitCount = 5,
  rateLimitWindow = 60000 // 1 minute
}: UseSecureFormOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setErrors({});

      // Check rate limiting if configured
      if (rateLimitKey && isRateLimited(rateLimitKey, rateLimitCount, rateLimitWindow)) {
        toast.error('Too many requests. Please try again later.');
        return;
      }

      // Sanitize text fields
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key];
        if (typeof value === 'string') {
          acc[key] = sanitizeText(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Validate with schema
      const validatedData = schema.parse(sanitizedData);
      
      // Submit the form
      await onSubmit(validatedData);
      
      toast.success('Form submitted successfully!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const formErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            formErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formErrors);
        toast.error('Please fix the form errors and try again.');
      } else {
        console.error('Form submission error:', error);
        toast.error('An error occurred while submitting the form.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    errors,
    setErrors
  };
}
