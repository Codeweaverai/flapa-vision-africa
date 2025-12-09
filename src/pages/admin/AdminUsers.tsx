import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { 
  Search, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  Loader2,
  Shield,
  ShieldOff,
  UserMinus,
  UserCheck
} from 'lucide-react';
import UsersTable from '@/components/admin/UsersTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type UserRole = 'user' | 'admin';
type UserStatus = 'active' | 'suspended' | 'inactive';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  status: UserStatus | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_sign_in_at: string | null;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Bulk actions loading state
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Fetch users with pagination
  const fetchUsers = async (pageNum = page) => {
    try {
      setLoading(true);
      
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Build query
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply search filter if exists
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      // Add pagination
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
      setTotalUsers(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      
      // Reset selection if users changed
      if (pageNum !== page) {
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchUsers(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Page size effect
  useEffect(() => {
    setPage(1); // Reset to first page when page size changes
    fetchUsers(1);
  }, [pageSize]);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const userRole = role as UserRole;
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: userRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`User status updated to ${status}`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Bulk Actions
  const handleBulkRoleUpdate = async (role: UserRole) => {
    if (selectedUsers.length === 0) {
      toast.warning('No users selected');
      return;
    }
    
    try {
      setBulkLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedUsers);
      
      if (error) throw error;
      
      toast.success(`Updated ${selectedUsers.length} users to ${role} role`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk role update:', error);
      toast.error('Failed to update user roles');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: UserStatus) => {
    if (selectedUsers.length === 0) {
      toast.warning('No users selected');
      return;
    }
    
    try {
      setBulkLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedUsers);
      
      if (error) throw error;
      
      toast.success(`Updated ${selectedUsers.length} users to ${status} status`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast.error('Failed to update user statuses');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('No users selected');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setBulkLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', selectedUsers);
      
      if (error) throw error;
      
      toast.success(`Deleted ${selectedUsers.length} user(s) successfully`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete users');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Export users to CSV
  const exportUsersToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Username', 'Role', 'Status', 'Created At'];
    const data = users.map(user => [
      user.id,
      user.full_name || '',
      user.email || '',
      user.username || '',
      user.role || 'user',
      user.status || 'active',
      user.created_at || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Users exported to CSV');
  };

  const filterUsers = () => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const fullName = user.full_name?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      
      return fullName.includes(query) || username.includes(query) || email.includes(query);
    });
  };
  
  const filteredUsers = filterUsers();

  // Pagination controls
  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setPage(pageNum);
    fetchUsers(pageNum);
  };

  return (
    <AdminLayout title="User Management">
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and account status</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportUsersToCSV}
              disabled={users.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="sr-only">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, username, or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="page-size" className="sr-only">Items per page</Label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger id="page-size">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  {selectedUsers.length}
                </div>
                <span className="font-medium">{selectedUsers.length} user(s) selected</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkRoleUpdate('admin')}
                  disabled={bulkLoading}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Make Admin
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkRoleUpdate('user')}
                  disabled={bulkLoading}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Make User
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={bulkLoading}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('suspended')}
                  disabled={bulkLoading}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                >
                  Delete Selected
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  disabled={bulkLoading}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <UsersTable 
          users={filteredUsers}
          loading={loading}
          onUpdateRole={handleUpdateRole}
          onUpdateStatus={handleUpdateStatus}
          selectedUsers={selectedUsers}
          onSelectAll={handleSelectAll}
          onSelectUser={handleSelectUser}
        />

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> of{' '}
              <span className="font-medium">{totalUsers}</span> users
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 text-sm font-medium">Page {page} of {totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'Users will appear here once they register'}
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
