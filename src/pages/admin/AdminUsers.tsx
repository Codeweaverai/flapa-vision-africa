import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  Upload,
  Loader2,
  Shield,
  ShieldOff,
  UserMinus,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  History,
  Users,
  BarChart3,
  FileUp,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Ban,
  Mail,
  Globe,
  Activity,
  TrendingUp,
  Hash
} from 'lucide-react';
import UsersTable from '@/components/admin/UsersTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserRole = 'user' | 'admin';
type UserStatus = 'active' | 'suspended' | 'inactive' | 'banned';

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
  suspension_reason: string | null;
  suspension_ends_at: string | null;
  suspension_started_at: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
}

interface AdminAuditLog {
  id: string;
  admin_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  admin_name?: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  banned: number;
  admins: number;
  today: number;
  week: number;
  month: number;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SUSPENSION_DURATIONS = [
  { label: '1 hour', value: 1, unit: 'hours', color: 'bg-blue-500' },
  { label: '1 day', value: 1, unit: 'days', color: 'bg-emerald-500' },
  { label: '3 days', value: 3, unit: 'days', color: 'bg-amber-500' },
  { label: '1 week', value: 7, unit: 'days', color: 'bg-orange-500' },
  { label: '2 weeks', value: 14, unit: 'days', color: 'bg-rose-500' },
  { label: '1 month', value: 30, unit: 'days', color: 'bg-red-500' },
  { label: 'Permanent', value: null, unit: 'permanent', color: 'bg-gray-900' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
    banned: 0,
    admins: 0,
    today: 0,
    week: 0,
    month: 0,
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date }>({});
  
  // Modal states
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState<string>('1');
  const [suspensionUnit, setSuspensionUnit] = useState<string>('days');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Bulk actions loading state
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Fetch users with pagination and filters
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
      
      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }
      
      // Apply date filter
      if (dateFilter.from) {
        query = query.gte('created_at', dateFilter.from.toISOString());
      }
      if (dateFilter.to) {
        query = query.lte('created_at', dateFilter.to.toISOString());
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

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const [
        { count: total },
        { count: active },
        { count: suspended },
        { count: inactive },
        { count: banned },
        { count: admins },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = subDays(new Date(), 7);
      const monthAgo = subDays(new Date(), 30);

      const [
        { count: todayCount },
        { count: weekCount },
        { count: monthCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      ]);

      setUserStats({
        total: total || 0,
        active: active || 0,
        suspended: suspended || 0,
        inactive: inactive || 0,
        banned: banned || 0,
        admins: admins || 0,
        today: todayCount || 0,
        week: weekCount || 0,
        month: monthCount || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch audit logs for a specific user
  const fetchAuditLogs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          *,
          admin:profiles!admin_audit_logs_admin_id_fkey(full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const logs = data?.map(log => ({
        ...log,
        admin_name: log.admin?.full_name || 'System'
      })) || [];
      
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Log admin action
  const logAdminAction = async (action: string, userId: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: user?.id,
          user_id: userId,
          action,
          details,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchUsers(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter, roleFilter, dateFilter]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const userRole = role as UserRole;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: userRole, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction('ROLE_UPDATE', userId, { role: userRole });
      
      toast.success('User role updated successfully');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleSuspendUser = async (userId: string, reason: string, duration?: { value: number; unit: string } | null) => {
    try {
      let suspensionEndsAt = null;
      
      if (duration) {
        const endDate = new Date();
        if (duration.unit === 'hours') {
          endDate.setHours(endDate.getHours() + duration.value);
        } else if (duration.unit === 'days') {
          endDate.setDate(endDate.getDate() + duration.value);
        } else if (duration.unit === 'permanent') {
          // Permanent suspension - set far future date
          endDate.setFullYear(endDate.getFullYear() + 100);
        }
        suspensionEndsAt = endDate.toISOString();
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'suspended',
          suspension_reason: reason,
          suspension_ends_at: suspensionEndsAt,
          suspension_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction('USER_SUSPENDED', userId, { 
        reason, 
        duration: duration ? `${duration.value} ${duration.unit}` : 'permanent',
        ends_at: suspensionEndsAt 
      });
      
      toast.success('User suspended successfully');
      setSuspensionModalOpen(false);
      setSuspensionReason('');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          suspension_reason: null,
          suspension_ends_at: null,
          suspension_started_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction('USER_ACTIVATED', userId, {});
      
      toast.success('User activated successfully');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDeactivateUser = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'inactive',
          deactivated_at: new Date().toISOString(),
          deactivation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction('USER_DEACTIVATED', userId, { reason });
      
      toast.success('User deactivated successfully');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'banned',
          suspension_reason: reason,
          suspension_ends_at: null, // Permanent
          suspension_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Log the action
      await logAdminAction('USER_BANNED', userId, { reason });
      
      toast.success('User banned successfully');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
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
      
      // Log bulk action
      for (const userId of selectedUsers) {
        await logAdminAction('BULK_ROLE_UPDATE', userId, { role });
      }
      
      toast.success(`Updated ${selectedUsers.length} users to ${role} role`);
      setSelectedUsers([]);
      fetchUsers();
      fetchUserStats();
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
      
      // Log bulk action
      for (const userId of selectedUsers) {
        await logAdminAction('BULK_STATUS_UPDATE', userId, { status });
      }
      
      toast.success(`Updated ${selectedUsers.length} users to ${status} status`);
      setSelectedUsers([]);
      fetchUsers();
      fetchUserStats();
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
      
      // First log the deletions
      for (const userId of selectedUsers) {
        await logAdminAction('USER_DELETED', userId, {});
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', selectedUsers);
      
      if (error) throw error;
      
      toast.success(`Deleted ${selectedUsers.length} user(s) successfully`);
      setSelectedUsers([]);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete users');
    } finally {
      setBulkLoading(false);
    }
  };

  // Import users from CSV
  const handleImportUsers = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setImporting(true);
      
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const usersToImport = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const user: any = {};
          headers.forEach((header, index) => {
            user[header] = values[index];
          });
          return user;
        });

      // Insert users
      const { error } = await supabase
        .from('profiles')
        .upsert(
          usersToImport.map(user => ({
            email: user.email,
            full_name: user.name || user.full_name,
            username: user.username,
            role: (user.role === 'admin' ? 'admin' : 'user') as UserRole,
            status: 'active'
          })),
          { onConflict: 'email' }
        );

      if (error) throw error;

      toast.success(`Imported ${usersToImport.length} users successfully`);
      setImportModalOpen(false);
      setImportFile(null);
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Failed to import users');
    } finally {
      setImporting(false);
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
    const headers = ['ID', 'Name', 'Email', 'Username', 'Role', 'Status', 'Suspension Reason', 'Suspension Ends', 'Created At', 'Last Login'];
    const data = users.map(user => [
      user.id,
      user.full_name || '',
      user.email || '',
      user.username || '',
      user.role || 'user',
      user.status || 'active',
      user.suspension_reason || '',
      user.suspension_ends_at ? format(new Date(user.suspension_ends_at), 'yyyy-MM-dd HH:mm') : '',
      user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : '',
      user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy-MM-dd HH:mm') : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Users exported to CSV');
  };

  // Check for expired suspensions
  const checkExpiredSuspensions = async () => {
    const now = new Date().toISOString();
    const expiredSuspensions = users.filter(user => 
      user.status === 'suspended' && 
      user.suspension_ends_at && 
      new Date(user.suspension_ends_at) < new Date()
    );

    if (expiredSuspensions.length > 0) {
      for (const user of expiredSuspensions) {
        await handleActivateUser(user.id);
      }
    }
  };

  useEffect(() => {
    checkExpiredSuspensions();
  }, [users]);

  // Pagination controls
  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setPage(pageNum);
    fetchUsers(pageNum);
  };

  // Open suspension modal
  const openSuspensionModal = (user: UserProfile) => {
    setSelectedUserForAction(user);
    setSuspensionModalOpen(true);
  };

  const handleSuspensionSubmit = () => {
    if (!selectedUserForAction || !suspensionReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }

    let duration = null;
    if (suspensionDuration && suspensionUnit !== 'permanent') {
      duration = {
        value: parseInt(suspensionDuration),
        unit: suspensionUnit
      };
    } else if (suspensionUnit === 'permanent') {
      duration = null; // Permanent suspension
    }

    handleSuspendUser(selectedUserForAction.id, suspensionReason, duration);
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('all');
    setRoleFilter('all');
    setDateFilter({});
    setSearchQuery('');
  };

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and account status</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setStatsModalOpen(true)}
              className="border-gray-300"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Stats
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportUsersToCSV}
              disabled={users.length === 0}
              className="border-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="border-gray-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchUsers()}
              className="border-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
          <Card className="col-span-2 md:col-span-1 lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.total}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+{userStats.week} this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.active}</p>
                </div>
                <div className="bg-emerald-500/20 p-3 rounded-lg">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <Progress 
                value={userStats.total > 0 ? (userStats.active / userStats.total) * 100 : 0} 
                className="h-1.5 mt-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.suspended}</p>
                </div>
                <div className="bg-amber-500/20 p-3 rounded-lg">
                  <UserMinus className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-amber-600">
                {userStats.suspended > 0 ? `${((userStats.suspended / userStats.total) * 100).toFixed(1)}% of total` : 'All clear'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.admins}</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-600">
                {userStats.admins > 0 ? `${((userStats.admins / userStats.total) * 100).toFixed(1)}% of total` : 'No admins'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.today}</p>
                </div>
                <div className="bg-gray-500/20 p-3 rounded-lg">
                  <Hash className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                New registrations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              Search & Filters
            </CardTitle>
            <CardDescription>
              Find and filter users by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                <Input
                  placeholder="Search by name, email, or username..."
                  className="pl-9 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.value)}
                />
              </div>

              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-gray-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="suspended">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        Suspended
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        Inactive
                      </div>
                    </SelectItem>
                    <SelectItem value="banned">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Banned
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[120px] border-gray-300">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>

                <DatePicker
                  date={dateFilter.from}
                  onSelect={(date) => setDateFilter({ ...dateFilter, from: date })}
                  placeholder="From date"
                  className="w-[140px]"
                />

                <DatePicker
                  date={dateFilter.to}
                  onSelect={(date) => setDateFilter({ ...dateFilter, to: date })}
                  placeholder="To date"
                  className="w-[140px]"
                />

                {(statusFilter !== 'all' || roleFilter !== 'all' || dateFilter.from || dateFilter.to || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(statusFilter !== 'all' || roleFilter !== 'all' || dateFilter.from || dateFilter.to || searchQuery) && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter !== 'all' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            Status: {statusFilter}
                          </Badge>
                        )}
                        {roleFilter !== 'all' && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                            Role: {roleFilter}
                          </Badge>
                        )}
                        {dateFilter.from && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                            From: {format(dateFilter.from, 'MMM d, yyyy')}
                          </Badge>
                        )}
                        {dateFilter.to && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                            To: {format(dateFilter.to, 'MMM d, yyyy')}
                          </Badge>
                        )}
                        {searchQuery && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                            Search: "{searchQuery}"
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {totalUsers} user(s) match
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-medium">
                  {selectedUsers.length}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUsers.length} user(s) selected</p>
                  <p className="text-sm text-gray-600">Choose an action below</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-blue-300">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Role
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkRoleUpdate('admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkRoleUpdate('user')}>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Make User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-amber-300">
                      <UserMinus className="h-4 w-4 mr-2" />
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('suspended')}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('inactive')}>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('banned')}>
                      <Ban className="h-4 w-4 mr-2" />
                      Ban
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete Selected
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  disabled={bulkLoading}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage individual user accounts and permissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <UsersTable 
              users={users}
              loading={loading}
              onUpdateRole={handleUpdateRole}
              onUpdateStatus={handleUpdateStatus}
              onSuspendUser={openSuspensionModal}
              onActivateUser={handleActivateUser}
              onDeactivateUser={handleDeactivateUser}
              onBanUser={handleBanUser}
              selectedUsers={selectedUsers}
              onSelectAll={handleSelectAll}
              onSelectUser={handleSelectUser}
              onViewAuditLogs={fetchAuditLogs}
            />
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * pageSize, totalUsers)}</span> of{' '}
                <span className="font-medium">{totalUsers}</span> users
              </div>
              
              <div>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(parseInt(value))}
                >
                  <SelectTrigger className="w-[140px] border-gray-300">
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
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(1)}
                disabled={page === 1}
                className="h-9 w-9 border-gray-300"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="h-9 w-9 border-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className={`h-9 w-9 ${page === pageNum ? 'bg-gray-900 hover:bg-gray-800' : 'border-gray-300'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="h-9 w-9 border-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(totalPages)}
                disabled={page === totalPages}
                className="h-9 w-9 border-gray-300"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 max-w-sm mx-auto mb-6">
                {searchQuery ? 'Try adjusting your search terms or filters' : 'Users will appear here once they register'}
              </p>
              {(searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || dateFilter.from || dateFilter.to) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Suspension Modal */}
        <Dialog open={suspensionModalOpen} onOpenChange={setSuspensionModalOpen}>
          <DialogContent className="sm:max-w-[500px] border-gray-300">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Suspend User</DialogTitle>
                  <DialogDescription>
                    Temporarily restrict access for {selectedUserForAction?.full_name || selectedUserForAction?.email}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5">
              <div>
                <Label htmlFor="suspension-reason" className="text-sm font-medium text-gray-700">
                  Reason for Suspension *
                </Label>
                <Textarea
                  id="suspension-reason"
                  placeholder="Please provide a reason for suspension..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-gray-400 focus:ring-gray-400 min-h-[100px]"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Suspension Duration</Label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {SUSPENSION_DURATIONS.map((duration) => (
                    <button
                      key={`${duration.value}-${duration.unit}`}
                      onClick={() => {
                        setSuspensionDuration(duration.value?.toString() || 'permanent');
                        setSuspensionUnit(duration.unit);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        suspensionDuration === (duration.value?.toString() || 'permanent') && suspensionUnit === duration.unit
                          ? `${duration.color} border-transparent text-white`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className="h-4 w-4 mb-1" />
                      <span className="text-xs font-medium">{duration.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Or select custom end date</Label>
                <DatePicker
                  date={customDate}
                  onSelect={setCustomDate}
                  placeholder="Select suspension end date"
                  className="w-full"
                />
              </div>
            </div>
            
            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSuspensionModalOpen(false);
                  setSuspensionReason('');
                  setCustomDate(undefined);
                }}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSuspensionSubmit}
                disabled={!suspensionReason.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Modal */}
        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
          <DialogContent className="sm:max-w-[500px] border-gray-300">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Import Users</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to import multiple users at once
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="mx-auto max-w-xs"
                />
                <p className="text-sm text-gray-600 mt-4">
                  CSV should include: email, name, username, role (optional)
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 5MB
                </p>
              </div>
              
              {importFile && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{importFile.name}</div>
                        <div className="text-sm text-gray-600">
                          {(importFile.size / 1024).toFixed(1)} KB • CSV File
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setImportFile(null)}
                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">CSV Format Example</p>
                    <pre className="text-xs text-blue-700 mt-2 bg-white/50 p-2 rounded">
                      email,name,username,role\n
                      john@example.com,John Doe,johndoe,user\n
                      admin@example.com,Admin User,adminuser,admin
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportFile(null);
                }}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportUsers}
                disabled={!importFile || importing}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Users
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistics Modal */}
        <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
          <DialogContent className="sm:max-w-[600px] border-gray-300">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>User Statistics</DialogTitle>
                  <DialogDescription>
                    Comprehensive overview of user metrics and trends
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Rate</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {userStats.total > 0 ? ((userStats.active / userStats.total) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <Activity className="h-5 w-5 text-emerald-500" />
                    </div>
                    <Progress 
                      value={userStats.total > 0 ? (userStats.active / userStats.total) * 100 : 0} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
                
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Admin Ratio</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {userStats.total > 0 ? ((userStats.admins / userStats.total) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <Shield className="h-5 w-5 text-purple-500" />
                    </div>
                    <Progress 
                      value={userStats.total > 0 ? (userStats.admins / userStats.total) * 100 : 0} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Growth Stats */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Growth Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-gray-600">Today</span>
                      </div>
                      <span className="font-medium text-gray-900">+{userStats.today}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-gray-600">This Week</span>
                      </div>
                      <span className="font-medium text-gray-900">+{userStats.week}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-sm text-gray-600">This Month</span>
                      </div>
                      <span className="font-medium text-gray-900">+{userStats.month}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Status Distribution */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Active', value: userStats.active, color: 'bg-emerald-500' },
                      { label: 'Suspended', value: userStats.suspended, color: 'bg-amber-500' },
                      { label: 'Inactive', value: userStats.inactive, color: 'bg-gray-500' },
                      { label: 'Banned', value: userStats.banned, color: 'bg-red-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${stat.color}`} />
                            <span className="text-gray-700">{stat.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{stat.value}</span>
                            <span className="text-gray-500 text-xs">
                              ({userStats.total > 0 ? ((stat.value / userStats.total) * 100).toFixed(1) : 0}%)
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={userStats.total > 0 ? (stat.value / userStats.total) * 100 : 0} 
                          className="h-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setStatsModalOpen(false)}
                className="border-gray-300"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  fetchUserStats();
                  toast.success('Statistics refreshed');
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
