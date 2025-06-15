
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, Radio, User, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InboxMessage {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  related_id: string | null;
  sender_profile?: {
    full_name: string;
    avatar_url: string;
  } | null;
}

const ModernInboxComponent: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({
    recipient_username: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    if (user) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('inbox-messages-realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'inbox_messages',
          filter: `recipient_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New inbox message received:', payload);
          const newMessage = payload.new as InboxMessage;
          
          // Add to messages list
          setMessages(prev => [newMessage, ...prev]);
          
          // Show notification for broadcast messages
          if (newMessage.message_type === 'broadcast') {
            toast.success('📢 New broadcast message received!', {
              description: newMessage.subject,
              duration: 5000,
            });
          } else {
            toast.success('💬 New message received!', {
              description: newMessage.subject,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First, get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs (excluding null for broadcast messages)
      const senderIds = [...new Set(messagesData
        .filter(msg => msg.sender_id)
        .map(msg => msg.sender_id)
      )];

      // Fetch sender profiles if there are any
      let profilesData = [];
      if (senderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        if (!profilesError && profiles) {
          profilesData = profiles;
        }
      }

      // Map messages with their sender profiles
      const processedMessages = messagesData.map(msg => ({
        ...msg,
        sender_profile: msg.sender_id 
          ? profilesData.find(profile => profile.id === msg.sender_id) || null
          : null
      }));
      
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = async (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await markAsRead(message.id);
    }
  };

  const getMessageIcon = (messageType: string, senderId: string | null) => {
    if (messageType === 'broadcast' || !senderId) {
      return <Radio className="h-4 w-4 text-purple-500" />;
    }
    return <MessageSquare className="h-4 w-4 text-blue-500" />;
  };

  const getMessageTypeLabel = (messageType: string, senderId: string | null) => {
    if (messageType === 'broadcast' || !senderId) {
      return 'System Broadcast';
    }
    return 'Direct Message';
  };

  const sendMessage = async () => {
    if (!user || !newMessage.recipient_username.trim() || !newMessage.subject.trim() || !newMessage.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Find recipient by username
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newMessage.recipient_username.trim())
        .single();

      if (recipientError || !recipientData) {
        toast.error('User not found with that username');
        return;
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientData.id,
          subject: newMessage.subject,
          content: newMessage.content,
          message_type: 'direct'
        });

      if (error) throw error;

      toast.success('Message sent successfully!');
      setNewMessage({ recipient_username: '', subject: '', content: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Messages List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} unread</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      !message.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${selectedMessage?.id === message.id ? 'bg-muted' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {message.sender_id ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender_profile?.avatar_url} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Radio className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getMessageIcon(message.message_type, message.sender_id)}
                          <span className="text-xs text-muted-foreground">
                            {getMessageTypeLabel(message.message_type, message.sender_id)}
                          </span>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{message.subject}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail / Compose */}
      <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMessageIcon(selectedMessage.message_type, selectedMessage.sender_id)}
                  <div>
                    <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getMessageTypeLabel(selectedMessage.message_type, selectedMessage.sender_id)}
                      {selectedMessage.sender_profile?.full_name && 
                        ` from ${selectedMessage.sender_profile.full_name}`
                      }
                    </p>
                  </div>
                </div>
                {selectedMessage.is_read && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Received: {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy - h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient Username</label>
                <Input
                  placeholder="username"
                  value={newMessage.recipient_username}
                  onChange={(e) => setNewMessage({ ...newMessage, recipient_username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={6}
                />
              </div>
              <Button onClick={sendMessage} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModernInboxComponent;
