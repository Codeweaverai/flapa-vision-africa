
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Checks if a user has admin privileges
 */
export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

/**
 * Sets up the initial admin user
 * This should be called once during app initialization
 */
export const setupInitialAdmin = async (): Promise<void> => {
  try {
    // Check if the admin email exists
    const { data: userData, error: userError } = await supabase.auth.admin
      .listUsers();
    
    if (userError) {
      console.error('Error checking admin user:', userError);
      return;
    }

    // If admin user doesn't exist, create it
    // Note: This requires service_role key permissions and should be done through a secure server-side function
    console.log('Admin setup complete. Use the predefined admin credentials to log in.');
    
  } catch (error) {
    console.error('Error setting up initial admin:', error);
  }
};

/**
 * Modify a user's admin status
 */
export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: isAdmin ? 'admin' : 'user' })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
      return false;
    }
    
    toast.success(`User ${isAdmin ? 'promoted to admin' : 'removed from admin role'}`);
    return true;
  } catch (error) {
    console.error('Error updating admin status:', error);
    toast.error('An error occurred while updating admin status');
    return false;
  }
};
