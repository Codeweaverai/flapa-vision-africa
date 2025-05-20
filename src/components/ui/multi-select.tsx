
import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function MultiSelect({
  options,
  value = [], // Default to empty array
  onChange,
  placeholder = 'Select items',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const handleSelect = (optionValue: string) => {
    const safeValue = Array.isArray(value) ? value : []; // Ensure value is an array
    
    if (safeValue.includes(optionValue)) {
      onChange(safeValue.filter((v) => v !== optionValue));
    } else {
      onChange([...safeValue, optionValue]);
    }
  };

  const handleRemoveValue = (optionValue: string) => {
    const safeValue = Array.isArray(value) ? value : []; // Ensure value is an array
    onChange(safeValue.filter((v) => v !== optionValue));
  };

  const selectedLabels = (Array.isArray(value) ? value : [])
    .map((v) => safeOptions.find((option) => option.value === v)?.label || '')
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <div className="flex flex-wrap gap-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label) => (
                <Badge key={label} variant="secondary" className="mr-1">
                  {label}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <span className="opacity-50">⌄</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {safeOptions.map((option) => {
              const isSelected = Array.isArray(value) && value.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className={cn('flex items-center gap-2', isSelected && 'bg-accent')}
                >
                  <div className="flex-1">{option.label}</div>
                  {isSelected && (
                    <X
                      className="h-4 w-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveValue(option.value);
                      }}
                    />
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
