
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPP');
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'PPp');
  } catch (error) {
    console.error('Error formatting date time:', error);
    return String(date);
  }
}
