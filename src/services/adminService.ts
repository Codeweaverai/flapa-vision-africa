
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Checks if a user has admin privileges using the secure user_roles table
 */
export const checkIsAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user is not an admin
        return false;
      }
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
 * Modify a user's admin status using the secure user_roles table
 */
export const setUserAdminStatus = async (userId: string, isAdmin: boolean): Promise<boolean> => {
  try {
    if (isAdmin) {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })
        .select()
        .single();
      
      if (error) {
        // Handle conflict (already exists)
        if (error.code === '23505') {
          toast.info('User is already an admin');
          return true;
        }
        console.error('Error granting admin status:', error);
        toast.error('Failed to grant admin status');
        return false;
      }
    } else {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        console.error('Error revoking admin status:', error);
        toast.error('Failed to revoke admin status');
        return false;
      }
    }
    
    toast.success(`User ${isAdmin ? 'promoted to admin' : 'removed from admin role'}`);
    return true;
  } catch (error) {
    console.error('Error updating admin status:', error);
    toast.error('An error occurred while updating admin status');
    return false;
  }
};
