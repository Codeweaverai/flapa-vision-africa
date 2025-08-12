import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Filter, CheckCircle, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Recipient {
  id: string;
  email: string;
  full_name: string;
  email_confirmed_at: string | null;
  created_at: string;
  role?: string;
  selected?: boolean;
}

interface NewsletterRecipientsProps {
  onRecipientCountChange: (count: number) => void;
  onSelectedRecipientsChange: (recipients: Recipient[]) => void;
}

const NewsletterRecipients = ({ onRecipientCountChange, onSelectedRecipientsChange }: NewsletterRecipientsProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadRecipients();
  }, []);

  useEffect(() => {
    filterRecipients();
  }, [recipients, searchQuery, selectedRole]);

  useEffect(() => {
    onRecipientCountChange(recipients.length);
  }, [recipients, onRecipientCountChange]);

  useEffect(() => {
    const selected = filteredRecipients.filter(r => r.selected);
    onSelectedRecipientsChange(selected);
  }, [filteredRecipients, onSelectedRecipientsChange]);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      
      // Get all profiles with user information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        toast.error('Failed to load recipients');
        return;
      }

      const recipientsList: Recipient[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || 'No email',
        full_name: profile.full_name || 'Unknown User',
        email_confirmed_at: null,
        created_at: profile.created_at || new Date().toISOString(),
        role: profile.role || 'user',
        selected: false
      }));

      setRecipients(recipientsList);
      console.log(`Loaded ${recipientsList.length} recipients`);
      
    } catch (error) {
      console.error('Error in loadRecipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const filterRecipients = () => {
    let filtered = recipients;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipient => 
        recipient.full_name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(recipient => recipient.role === selectedRole);
    }

    setFilteredRecipients(filtered);
  };

  const toggleRecipientSelection = (recipientId: string) => {
    setRecipients(prev => prev.map(recipient => 
      recipient.id === recipientId 
        ? { ...recipient, selected: !recipient.selected }
        : recipient
    ));
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      selected: newSelectAll
    })));
  };

  const selectByRole = (role: string) => {
    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      selected: recipient.role === role
    })));
  };

  const getSelectedCount = () => {
    return recipients.filter(r => r.selected).length;
  };

  const getRoleCount = (role: string) => {
    return recipients.filter(r => r.role === role).length;
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading Recipients...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recipients Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{recipients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-green-600">{getSelectedCount()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{getRoleCount('admin')}</p>
              </div>
              <Badge variant="outline" className="text-purple-600">Admin</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-orange-600">{getRoleCount('user')}</p>
              </div>
              <Badge variant="outline" className="text-orange-600">User</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Recipients ({filteredRecipients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center gap-2"
            >
              {selectAll ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {selectAll ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByRole('admin')}
              className="bg-purple-50 hover:bg-purple-100"
            >
              Select Admins ({getRoleCount('admin')})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectByRole('user')}
              className="bg-orange-50 hover:bg-orange-100"
            >
              Select Users ({getRoleCount('user')})
            </Button>
          </div>

          {/* Recipients List */}
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <div className="space-y-2 p-4">
              {filteredRecipients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recipients found matching your criteria</p>
                </div>
              ) : (
                filteredRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
                    <Checkbox
                      checked={recipient.selected}
                      onCheckedChange={() => toggleRecipientSelection(recipient.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {recipient.full_name}
                        </p>
                        <Badge 
                          variant={recipient.role === 'admin' ? 'default' : 'secondary'}
                          className={recipient.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {recipient.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{recipient.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {getSelectedCount() > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {getSelectedCount()} recipients selected for newsletter
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterRecipients;
