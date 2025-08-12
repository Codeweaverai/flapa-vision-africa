
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, Search, Mail, CheckCircle, Clock, User, Crown, UserCheck } from 'lucide-react';
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

const NewsletterRecipients: React.FC<NewsletterRecipientsProps> = ({ 
  onRecipientCountChange, 
  onSelectedRecipientsChange 
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecipients(recipients);
    } else {
      const filtered = recipients.filter(recipient =>
        recipient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecipients(filtered);
    }
  }, [searchTerm, recipients]);

  useEffect(() => {
    const selectedRecipients = recipients.filter(r => r.selected);
    onSelectedRecipientsChange(selectedRecipients);
  }, [recipients, onSelectedRecipientsChange]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      console.log('Fetching newsletter recipients from auth.users...');
      
      // Fetch users directly from auth.users table using admin access
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw authError;
      }

      console.log('Auth users fetched:', authUsers?.users?.length || 0);

      // Fetch profiles to get additional user info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, role');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of profiles for quick lookup
      const profilesMap = new Map();
      if (profiles) {
        profiles.forEach((profile: any) => {
          profilesMap.set(profile.id, profile);
        });
      }

      // Combine auth users with profile data
      const recipientsList = authUsers?.users?.map((user: any) => {
        const profile = profilesMap.get(user.id);
        
        // Get the best available name from various sources
        const fullName = profile?.full_name || 
                        profile?.username ||
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] ||
                        'User';

        return {
          id: user.id,
          email: user.email,
          full_name: fullName,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          role: profile?.role || 'user',
          selected: false
        };
      }) || [];

      console.log('Processed recipients:', recipientsList.length);

      setRecipients(recipientsList);
      setFilteredRecipients(recipientsList);
      onRecipientCountChange(recipientsList.length);
      toast.success(`Loaded ${recipientsList.length} recipients successfully`);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setRecipients(prev => prev.map(recipient => ({
      ...recipient,
      selected: checked
    })));
  };

  const handleSelectRecipient = (recipientId: string, checked: boolean) => {
    setRecipients(prev => prev.map(recipient => 
      recipient.id === recipientId 
        ? { ...recipient, selected: checked }
        : recipient
    ));
  };

  const getRoleIcon = (role?: string) => {
    if (role === 'creator' || role === 'admin') {
      return <Crown className="h-3 w-3 text-orange-500" />;
    }
    return <User className="h-3 w-3 text-gray-500" />;
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'admin') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">Admin</Badge>;
    }
    if (role === 'creator') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">Creator</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">User</Badge>;
  };

  const selectedCount = recipients.filter(r => r.selected).length;

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            <Users className="h-5 w-5" />
            Newsletter Recipients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          <Users className="h-5 w-5" />
          Newsletter Recipients ({recipients.length})
        </CardTitle>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All Recipients
              </label>
            </div>
            
            {selectedCount > 0 && (
              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                <UserCheck className="h-3 w-3 mr-1" />
                {selectedCount} selected
              </Badge>
            )}
          </div>
          
          {recipients.length > 0 && (
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Verified: {recipients.filter(r => r.email_confirmed_at).length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Unverified: {recipients.filter(r => !r.email_confirmed_at).length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-orange-500" />
                <span>Creators: {recipients.filter(r => r.role === 'creator').length}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredRecipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No recipients match your search' : 'No recipients found'}
            </div>
          ) : (
            filteredRecipients.map((recipient) => (
              <div 
                key={recipient.id} 
                className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50/50 to-purple-50/50 rounded-lg hover:from-orange-100/50 hover:to-purple-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={recipient.selected || false}
                    onCheckedChange={(checked) => handleSelectRecipient(recipient.id, checked as boolean)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(recipient.role)}
                      <span className="font-medium text-gray-900">
                        {recipient.full_name}
                      </span>
                      {recipient.email_confirmed_at ? (
                        <div title="Email verified">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <div title="Email not verified">
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      {recipient.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {getRoleBadge(recipient.role)}
                  <Badge 
                    variant="outline" 
                    className={recipient.email_confirmed_at ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                  >
                    {recipient.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
        
        {filteredRecipients.length > 0 && searchTerm && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredRecipients.length} of {recipients.length} recipients
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterRecipients;
