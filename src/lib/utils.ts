
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  } catch (error) {
    return dateString;
  }
};

// Helper function to create count functions for Supabase if they don't exist
export const ensureCountFunctions = async (supabase: any) => {
  // Check if count_registrations_by_event function exists
  const { data: regFuncExists } = await supabase
    .rpc('function_exists', { function_name: 'count_registrations_by_event' });
    
  if (!regFuncExists || !regFuncExists[0]?.exists) {
    // Create the function
    await supabase.rpc('create_count_registrations_function');
  }
  
  // Check if count_bookings_by_event function exists
  const { data: bookingFuncExists } = await supabase
    .rpc('function_exists', { function_name: 'count_bookings_by_event' });
    
  if (!bookingFuncExists || !bookingFuncExists[0]?.exists) {
    // Create the function
    await supabase.rpc('create_count_bookings_function');
  }
};
