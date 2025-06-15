
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BroadcastMessage {
  id: string;
  subject: string;
  content: string;
  message_type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  total_recipients: number;
  created_at: string;
  sent_at: string;
}

const AdminSupportInbox: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastMessage[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    message_type: 'broadcast'
  });

  useEffect(() => {
    loadBroadcastHistory();
  }, []);

  const loadBroadcastHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Cast the data to fix the priority type issue
      const typedData = data?.map(item => ({
        ...item,
        priority: item.priority as 'low' | 'normal' | 'high' | 'urgent'
      })) || [];
      
      setBroadcastHistory(typedData);
    } catch (error) {
      console.error('Error loading broadcast history:', error);
      toast.error('Failed to load broadcast history');
    }
  };

  const handleBroadcast = async () => {
    if (!user || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('broadcast_message_to_all_users', {
        p_admin_id: user.id,
        p_subject: formData.subject,
        p_content: formData.content,
        p_message_type: formData.message_type,
        p_priority: formData.priority
      });

      if (error) throw error;

      toast.success('Broadcast message sent successfully to all users!');
      
      // Reset form
      setFormData({
        subject: '',
        content: '',
        priority: 'normal',
        message_type: 'broadcast'
      });

      // Reload history
      await loadBroadcastHistory();

    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <AdminLayout title="Support Inbox">
      <div className="space-y-6">
        {/* Broadcast Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Broadcast Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter message subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your broadcast message here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleBroadcast} 
              disabled={loading || !formData.subject.trim() || !formData.content.trim()}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to All Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Broadcast History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No broadcast messages sent yet
              </div>
            ) : (
              <div className="space-y-4">
                {broadcastHistory.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{message.subject}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </Badge>
                        {getStatusIcon(message.status)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Recipients: {message.total_recipients} users</span>
                      <span>Sent: {format(new Date(message.sent_at), 'MMM d, yyyy - h:mm a')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSupportInbox;
