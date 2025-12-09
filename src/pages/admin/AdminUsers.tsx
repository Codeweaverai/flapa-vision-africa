
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Search, User } from 'lucide-react';
import UsersTable from '@/components/admin/UsersTable';

type UserRole = 'user' | 'admin';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  created_at: string | null;
  updated_at: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      // Cast the role to UserRole type to ensure it's either 'user' or 'admin'
      const userRole = role as UserRole;
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: userRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const filterUsers = () => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const fullName = user.full_name?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      
      return fullName.includes(query) || username.includes(query);
    });
  };
  
  const filteredUsers = filterUsers();

  return (
    <AdminLayout title="User Management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-muted-foreground">Manage users and roles.</p>
        </div>
      </div>
      
      <div className="w-full max-w-md mb-6">
        <Label htmlFor="search">Search Users</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name or username..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <UsersTable 
        users={filteredUsers}
        loading={loading}
        onUpdateRole={handleUpdateRole}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
