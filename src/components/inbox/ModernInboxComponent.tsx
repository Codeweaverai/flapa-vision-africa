import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, Radio, User, Clock, CheckCircle2, Plus } from 'lucide-react';
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
  const [showCompose, setShowCompose] = useState(false);
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
    setShowCompose(false);
    if (!message.is_read) {
      await markAsRead(message.id);
    }
  };

  const getMessageIcon = (messageType: string, senderId: string | null) => {
    if (messageType === 'broadcast' || !senderId) {
      return <Radio className="h-4 w-4 text-purple-500" />;
    }
    return <MessageSquare className="h-4 w-4 text-orange-500" />;
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
      setShowCompose(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="flex h-[600px]">
          {/* Messages Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Messages</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Badge className="bg-white text-orange-600 hover:bg-gray-100">
                      {unreadCount}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCompose(true);
                      setSelectedMessage(null);
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="overflow-y-auto h-[calc(600px-80px)]">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                      !message.is_read ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                    } ${selectedMessage?.id === message.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {message.sender_id ? (
                          <Avatar className="h-10 w-10 border-2 border-orange-200">
                            <AvatarImage src={message.sender_profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                            <Radio className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {message.sender_profile?.full_name || getMessageTypeLabel(message.message_type, message.sender_id)}
                          </span>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">{message.subject}</h4>
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Content / Compose */}
          <div className="flex-1 flex flex-col">
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {selectedMessage.sender_id ? (
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={selectedMessage.sender_profile?.avatar_url} />
                          <AvatarFallback className="bg-white text-orange-600">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                          <Radio className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {selectedMessage.sender_profile?.full_name || getMessageTypeLabel(selectedMessage.message_type, selectedMessage.sender_id)}
                      </h3>
                      <p className="text-sm text-orange-100">{selectedMessage.subject}</p>
                    </div>
                    {selectedMessage.is_read && (
                      <CheckCircle2 className="h-5 w-5 text-green-300" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-gray-800">{selectedMessage.content}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy - h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : showCompose ? (
              <>
                {/* Compose Header */}
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white">
                  <h3 className="font-semibold">New Message</h3>
                </div>

                {/* Compose Form */}
                <div className="flex-1 p-6 bg-gray-50">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Recipient Username</label>
                        <Input
                          placeholder="username"
                          value={newMessage.recipient_username}
                          onChange={(e) => setNewMessage({ ...newMessage, recipient_username: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject</label>
                        <Input
                          placeholder="Message subject"
                          value={newMessage.subject}
                          onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Message</label>
                        <Textarea
                          placeholder="Type your message here..."
                          value={newMessage.content}
                          onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                          rows={8}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={sendMessage} 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCompose(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
                  <p className="text-gray-500 mb-4">Choose a message from the list to view it here</p>
                  <Button
                    onClick={() => setShowCompose(true)}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernInboxComponent;
