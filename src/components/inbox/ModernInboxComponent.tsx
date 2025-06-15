
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare, Radio, User, Clock, CheckCircle2, Plus, ArrowLeft } from 'lucide-react';
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

interface Conversation {
  id: string;
  otherUserId: string | null;
  otherUserProfile: {
    full_name: string;
    avatar_url: string;
  } | null;
  lastMessage: InboxMessage;
  messages: InboxMessage[];
  unreadCount: number;
  messageType: string;
}

const ModernInboxComponent: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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

  useEffect(() => {
    if (messages.length > 0) {
      groupMessagesIntoConversations();
    }
  }, [messages]);

  const groupMessagesIntoConversations = () => {
    const conversationMap = new Map<string, Conversation>();
    
    messages.forEach(message => {
      let conversationKey: string;
      let otherUserId: string | null;
      let otherUserProfile: any;
      
      if (message.message_type === 'broadcast' || !message.sender_id) {
        // Broadcast messages get their own conversation
        conversationKey = `broadcast-${message.related_id || 'system'}`;
        otherUserId = null;
        otherUserProfile = null;
      } else {
        // Direct messages grouped by other user
        otherUserId = message.sender_id;
        conversationKey = `direct-${otherUserId}`;
        otherUserProfile = message.sender_profile;
      }
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          id: conversationKey,
          otherUserId,
          otherUserProfile,
          lastMessage: message,
          messages: [message],
          unreadCount: message.is_read ? 0 : 1,
          messageType: message.message_type
        });
      } else {
        const conversation = conversationMap.get(conversationKey)!;
        conversation.messages.push(message);
        
        // Update last message if this message is newer
        if (new Date(message.created_at) > new Date(conversation.lastMessage.created_at)) {
          conversation.lastMessage = message;
        }
        
        // Update unread count
        if (!message.is_read) {
          conversation.unreadCount++;
        }
      }
    });
    
    // Sort conversations by last message time and sort messages within each conversation
    const sortedConversations = Array.from(conversationMap.values())
      .map(conv => ({
        ...conv,
        messages: conv.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }))
      .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
    
    setConversations(sortedConversations);
  };

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
      // Get messages
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

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData
        .filter(msg => msg.sender_id)
        .map(msg => msg.sender_id)
      )];

      // Fetch sender profiles
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

      // Process messages with profiles
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

  const markConversationAsRead = async (conversation: Conversation) => {
    const unreadMessageIds = conversation.messages
      .filter(msg => !msg.is_read)
      .map(msg => msg.id);

    if (unreadMessageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          unreadMessageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowCompose(false);
    await markConversationAsRead(conversation);
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.messageType === 'broadcast' || !conversation.otherUserId) {
      return 'System Broadcast';
    }
    return conversation.otherUserProfile?.full_name || 'Unknown User';
  };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.messageType === 'broadcast' || !conversation.otherUserId) {
      return <Radio className="h-4 w-4 text-purple-500" />;
    }
    return <MessageSquare className="h-4 w-4 text-orange-500" />;
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

  const sendReply = async (replyContent: string) => {
    if (!user || !selectedConversation || !replyContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedConversation.messageType === 'broadcast') {
      toast.error('Cannot reply to broadcast messages');
      return;
    }

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation.otherUserId,
          subject: `Re: ${selectedConversation.lastMessage.subject}`,
          content: replyContent,
          message_type: 'direct'
        });

      if (error) throw error;

      toast.success('Reply sent successfully!');
      // Reload messages to show the new reply
      await loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

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
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <div className="flex items-center gap-2">
                  {totalUnreadCount > 0 && (
                    <Badge className="bg-white text-orange-600 hover:bg-gray-100">
                      {totalUnreadCount}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCompose(true);
                      setSelectedConversation(null);
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="overflow-y-auto h-[calc(600px-80px)]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start a conversation!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                      conversation.unreadCount > 0 ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                    } ${selectedConversation?.id === conversation.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {conversation.otherUserId ? (
                          <Avatar className="h-10 w-10 border-2 border-orange-200">
                            <AvatarImage src={conversation.otherUserProfile?.avatar_url} />
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
                          <span className="text-sm font-medium text-gray-900">
                            {getConversationTitle(conversation)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                          {conversation.lastMessage.subject}
                        </h4>
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {conversation.lastMessage.content}
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(conversation.lastMessage.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversation Content / Compose */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <ConversationView 
                conversation={selectedConversation}
                onSendReply={sendReply}
                onBack={() => setSelectedConversation(null)}
              />
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500 mb-4">Choose a conversation from the list to view messages</p>
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

// Separate component for conversation view
const ConversationView: React.FC<{
  conversation: Conversation;
  onSendReply: (content: string) => Promise<void>;
  onBack: () => void;
}> = ({ conversation, onSendReply, onBack }) => {
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    
    setSending(true);
    try {
      await onSendReply(replyContent);
      setReplyContent('');
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = () => {
    if (conversation.messageType === 'broadcast' || !conversation.otherUserId) {
      return 'System Broadcast';
    }
    return conversation.otherUserProfile?.full_name || 'Unknown User';
  };

  return (
    <>
      {/* Conversation Header */}
      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/20 p-1 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-shrink-0">
            {conversation.otherUserId ? (
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={conversation.otherUserProfile?.avatar_url} />
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
            <h3 className="font-semibold">{getConversationTitle()}</h3>
            <p className="text-sm text-orange-100">
              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {conversation.messages.map((message) => (
          <div key={message.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0">
                {message.sender_id ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <Radio className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.sender_profile?.full_name || 'System'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </span>
                  {message.is_read && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">{message.subject}</h4>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      {conversation.messageType !== 'broadcast' && (
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sending}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernInboxComponent;
