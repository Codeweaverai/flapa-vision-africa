import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { SupabaseClient } from '@supabase/supabase-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date): string => {
  try {
    // Attempt to parse the date string
    const parsedDate = new Date(date);

    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date:', date);
      return 'Invalid Date';
    }

    // Format the date
    return format(parsedDate, 'MMM dd, yyyy hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Function to ensure the count functions exist in Supabase
export async function ensureCountFunctions(supabase: SupabaseClient) {
  try {
    // Test if the count_registrations_by_event function exists
    const { data: testReg, error: testRegError } = await supabase
      .rpc('count_registrations_by_event') as { data: any, error: any };
    
    // Test if the count_bookings_by_event function exists
    const { data: testBooking, error: testBookingError } = await supabase
      .rpc('count_bookings_by_event') as { data: any, error: any };
    
    // If either function doesn't exist or returned an error, we return false
    // This will trigger the fallback code in AdminRegistrations.tsx
    return !testRegError && !testBookingError;
  } catch (error) {
    console.error('Error testing count functions:', error);
    return false;
  }
}
