
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Mail, CheckCircle, Clock, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Recipient {
  id: string;
  email: string;
  full_name: string;
  email_confirmed_at: string | null;
  created_at: string;
  role?: string;
}

interface NewsletterRecipientsProps {
  onRecipientCountChange: (count: number) => void;
}

const NewsletterRecipients: React.FC<NewsletterRecipientsProps> = ({ onRecipientCountChange }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      console.log('Fetching newsletter recipients...');
      
      const { data, error } = await supabase.functions.invoke('get-newsletter-recipients');

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Function response:', data);

      if (data && data.recipients) {
        const { recipients: fetchedRecipients, total_count } = data;
        setRecipients(fetchedRecipients);
        setFilteredRecipients(fetchedRecipients);
        onRecipientCountChange(total_count);
        toast.success(`Loaded ${total_count} recipients successfully`);
      } else {
        console.error('Invalid data structure:', data);
        toast.error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
