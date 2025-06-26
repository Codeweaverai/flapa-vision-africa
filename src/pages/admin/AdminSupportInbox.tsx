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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Users, AlertCircle, CheckCircle, User, Reply } from 'lucide-react';
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

interface InboxMessage {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
}

interface Conversation {
  id: string;
  user_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  user_profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const AdminSupportInbox: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<InboxMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'conversations' | 'direct' | 'broadcast'>('conversations');
  const [directMessageForm, setDirectMessageForm] = useState({
    recipient_username: '',
    subject: '',
    content: ''
  });
  const [broadcastForm, setBroadcastForm] = useState({
    subject: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    message_type: 'broadcast'
  });

  useEffect(() => {
    loadBroadcastHistory();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadConversationMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          subject,
          content,
          created_at,
          is_read
        `)
        .not('sender_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by sender to create conversations
      const conversationMap = new Map<string, Conversation>();
      
      for (const message of data || []) {
        const userId = message.sender_id;
        if (!userId) continue;

        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            id: userId,
            user_id: userId,
            last_message: message.content,
            last_message_at: message.created_at,
            unread_count: 0
          });
        }

        if (!message.is_read) {
          const conv = conversationMap.get(userId)!;
          conv.unread_count += 1;
        }
      }

      const conversationList = Array.from(conversationMap.values());
      
      // Load user profiles for conversations
      const userIds = conversationList.map(c => c.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds);

        conversationList.forEach(conv => {
          const profile = profiles?.find(p => p.id === conv.user_id);
          if (profile) {
            conv.user_profile = profile;
          }
        });
      }

      setConversations(conversationList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadConversationMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Load sender profiles
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return { ...message, sender_profile: null };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender_profile: profile
          };
        })
      );

      setConversationMessages(messagesWithProfiles);

      // Mark messages as read
      const unreadMessages = data?.filter(m => !m.is_read && m.sender_id === userId);
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('inbox_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
        
        loadConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast.error('Failed to load conversation messages');
    }
  };

  const sendReply = async () => {
    if (!user || !selectedConversation || !replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          subject: 'Support Reply',
          content: replyMessage,
          message_type: 'direct'
        });

      if (error) throw error;

      toast.success('Reply sent successfully!');
      setReplyMessage('');
      loadConversationMessages(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const loadBroadcastHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
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
    if (!user || !broadcastForm.subject.trim() || !broadcastForm.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('broadcast_message_to_all_users', {
        p_admin_id: user.id,
        p_subject: broadcastForm.subject,
        p_content: broadcastForm.content,
        p_message_type: broadcastForm.message_type,
        p_priority: broadcastForm.priority
      });

      if (error) throw error;

      toast.success('Broadcast message sent successfully to all users!');
      
      setBroadcastForm({
        subject: '',
        content: '',
        priority: 'normal',
        message_type: 'broadcast'
      });

      await loadBroadcastHistory();

    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!user || !directMessageForm.recipient_username.trim() || !directMessageForm.subject.trim() || !directMessageForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Find recipient by username
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', directMessageForm.recipient_username.trim())
        .single();

      if (recipientError || !recipientData) {
        toast.error('User not found with that username');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientData.id,
          subject: directMessageForm.subject,
          content: directMessageForm.content,
          message_type: 'direct'
        });

      if (error) throw error;

      toast.success('Direct message sent successfully!');
      
      // Reset form
      setDirectMessageForm({
        recipient_username: '',
        subject: '',
        content: ''
      });

    } catch (error) {
      console.error('Error sending direct message:', error);
      toast.error('Failed to send direct message');
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

  const getUserDisplayName = (profile: any) => {
    return profile?.full_name || profile?.username || 'Unknown User';
  };

  return (
    <AdminLayout title="Support Inbox">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gradient-to-r from-orange-100 to-purple-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'conversations'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-2 inline" />
            Conversations
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'direct'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="h-4 w-4 mr-2 inline" />
            Direct Message
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4 mr-2 inline" />
            Broadcast
          </button>
        </div>

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Support Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {conversations.length === 0 ? (
                    <p className="p-4 text-muted-foreground">No conversations yet.</p>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all ${
                          selectedConversation === conversation.id ? 'bg-gradient-to-r from-orange-100 to-purple-100' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={conversation.user_profile?.avatar_url} />
                            <AvatarFallback>
                              {conversation.user_profile?.full_name?.[0] || 
                               conversation.user_profile?.username?.[0] || 
                               <User className="w-5 h-5" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {getUserDisplayName(conversation.user_profile)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.last_message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Conversation Messages */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                {selectedConversation ? (
                  <div className="flex flex-col h-[500px]">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {conversationMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {format(new Date(message.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={3}
                          className="flex-1"
                        />
                        <Button
                          onClick={sendReply}
                          disabled={loading || !replyMessage.trim()}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    Select a conversation to view messages
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Direct Message Tab */}
        {activeTab === 'direct' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Direct Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_username">Recipient Username</Label>
                  <Input
                    id="recipient_username"
                    placeholder="Enter username"
                    value={directMessageForm.recipient_username}
                    onChange={(e) => setDirectMessageForm({ ...directMessageForm, recipient_username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direct_subject">Subject</Label>
                  <Input
                    id="direct_subject"
                    placeholder="Enter message subject"
                    value={directMessageForm.subject}
                    onChange={(e) => setDirectMessageForm({ ...directMessageForm, subject: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="direct_content">Message Content</Label>
                <Textarea
                  id="direct_content"
                  placeholder="Enter your message here..."
                  value={directMessageForm.content}
                  onChange={(e) => setDirectMessageForm({ ...directMessageForm, content: e.target.value })}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleDirectMessage} 
                disabled={loading || !directMessageForm.recipient_username.trim() || !directMessageForm.subject.trim() || !directMessageForm.content.trim()}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Direct Message
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Broadcast Tab */}
        {activeTab === 'broadcast' && (
          <>
            {/* Broadcast Message Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Send Broadcast Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast_subject">Subject</Label>
                    <Input
                      id="broadcast_subject"
                      placeholder="Enter message subject"
                      value={broadcastForm.subject}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={broadcastForm.priority} onValueChange={(value: any) => setBroadcastForm({ ...broadcastForm, priority: value })}>
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
                  <Label htmlFor="broadcast_content">Message Content</Label>
                  <Textarea
                    id="broadcast_content"
                    placeholder="Enter your broadcast message here..."
                    value={broadcastForm.content}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleBroadcast} 
                  disabled={loading || !broadcastForm.subject.trim() || !broadcastForm.content.trim()}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 w-full md:w-auto"
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
                  Message History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {broadcastHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages sent yet
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
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupportInbox;
