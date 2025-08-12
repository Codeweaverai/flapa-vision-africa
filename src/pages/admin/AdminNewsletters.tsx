import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Mail, Plus, Edit, Trash2, Send, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

interface Newsletter {
  id: string;
  subject: string;
  body_html: string;
  status: string;
  created_at: string;
  sent_at?: string;
  total_recipients?: number;
}

const AdminNewsletters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'sent'>('create');
  const [users, setUsers] = useState<User[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadUsers();
    loadNewsletters();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all user profiles with emails
      const { data, error } = await supabase.rpc('get_user_emails', {
        user_ids: []
      });

      if (error) {
        // Fallback to direct profiles table query if RPC fails
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at');

        if (profilesData) {
          setUsers(profilesData.map(p => ({
            id: p.id,
            email: p.email || `user-${p.id.slice(0, 8)}@example.com`,
            full_name: p.full_name,
            created_at: p.created_at
          })));
        }
        return;
      }

      if (data) {
        setUsers(data.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name || `User ${u.email.split('@')[0]}`,
          created_at: u.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error loading newsletters:', error);
      toast.error('Failed to load newsletters');
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const handleDeleteNewsletter = async (newsletterId: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    
    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId);

      if (error) throw error;
      
      toast.success('Newsletter deleted successfully');
      loadNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    }
  };

  const NewsletterCard = ({ newsletter }: { newsletter: Newsletter }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{newsletter.subject}</CardTitle>
            <div className="text-sm text-gray-600 line-clamp-2 mt-2" 
                 dangerouslySetInnerHTML={{ __html: newsletter.body_html.substring(0, 100) + '...' }} />
          </div>
          <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
            {newsletter.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span>{new Date(newsletter.created_at).toLocaleDateString()}</span>
          </div>
          {newsletter.sent_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Sent:</span>
              <span>{new Date(newsletter.sent_at).toLocaleDateString()}</span>
            </div>
          )}
          {newsletter.total_recipients && (
            <div className="flex justify-between">
              <span className="text-gray-600">Recipients:</span>
              <span>{newsletter.total_recipients}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDeleteNewsletter(newsletter.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              Email Management
            </h1>
            <p className="text-gray-600 mt-2">
              Send emails to selected users
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gradient-to-r from-orange-100 to-purple-100 rounded-lg p-1 shadow-md">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className={activeTab === 'create' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : ''}
            >
              Create Email
            </Button>
            <Button
              variant={activeTab === 'sent' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('sent')}
              className={activeTab === 'sent' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Sent ({newsletters.filter(n => n.status === 'sent').length})
            </Button>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-8">
              {/* User Selection */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Mail className="h-5 w-5" />
                    Select Recipients ({users.length} users available)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button onClick={selectAllUsers} variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
                      Select All ({users.length})
                    </Button>
                    <Button onClick={clearSelection} variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                      Clear Selection
                    </Button>
                    <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700">
                      {selectedUsers.length} selected
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 transition-colors shadow-sm">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No users found. Users will appear here once they register.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <EnhancedNewsletterForm selectedUsers={selectedUsers} />
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Sent Emails</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsletters
                  .filter(n => n.status === 'sent')
                  .map((newsletter) => (
                    <NewsletterCard key={newsletter.id} newsletter={newsletter} />
                  ))}
              </div>
              {newsletters.filter(n => n.status === 'sent').length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No sent emails found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Newsletter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email</DialogTitle>
          </DialogHeader>
          {editingNewsletter && (
            <EnhancedNewsletterForm 
              initialData={editingNewsletter} 
              selectedUsers={selectedUsers}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNewsletters;
