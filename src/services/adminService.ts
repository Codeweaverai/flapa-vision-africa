
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

// Note: Initial admin setup should be done via Edge Functions or direct database access
// with service_role key. Client-side code cannot access admin APIs.

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
