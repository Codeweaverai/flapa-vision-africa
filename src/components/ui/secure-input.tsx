
import React, { forwardRef, useState } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecureInputProps extends Omit<InputProps, 'type'> {
  type: 'email' | 'password' | 'text' | 'tel' | 'url';
  error?: string;
  showPasswordToggle?: boolean;
  preventPaste?: boolean;
}

const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, type, error, showPasswordToggle = false, preventPaste = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputType, setInputType] = useState(type);

    React.useEffect(() => {
      if (type === 'password' && showPasswordToggle) {
        setInputType(showPassword ? 'text' : 'password');
      } else {
        setInputType(type);
      }
    }, [type, showPassword, showPasswordToggle]);

    const handlePaste = (e: React.ClipboardEvent) => {
      if (preventPaste) {
        e.preventDefault();
        return;
      }
      
      // Sanitize pasted content
      const pastedText = e.clipboardData.getData('text');
      const sanitized = pastedText
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '');
      
      if (sanitized !== pastedText) {
        e.preventDefault();
        // Set the sanitized value
        const target = e.target as HTMLInputElement;
        target.value = sanitized;
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Prevent common XSS key combinations
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V') && preventPaste) {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        <Input
          type={inputType}
          className={cn(
            className,
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          ref={ref}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          autoComplete={type === 'password' ? 'current-password' : 'on'}
          {...props}
        />
        
        {type === 'password' && showPasswordToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
        
        {error && (
          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

export { SecureInput };
