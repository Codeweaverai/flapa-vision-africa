
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Reply, Trash2, User, Search, Phone, Video, MoreVertical, ArrowLeft, Paperclip, Smile } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_creator?: boolean;
  role?: string;
}

interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
  updated_at: string;
  sender_profile?: Profile | null;
}

interface Conversation {
  user_id: string;
  user_profile?: Profile;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
}

const EnhancedInboxComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('inbox_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        fetchMessages();
        if (selectedConversation) {
          loadConversationMessages(selectedConversation);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages into conversations
      const conversationMap = new Map<string, Conversation>();
      
      for (const message of data || []) {
        if (!message.sender_id) continue;

        const senderId = message.sender_id;
        if (!conversationMap.has(senderId)) {
          conversationMap.set(senderId, {
            user_id: senderId,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0
          });
        }

        if (!message.is_read) {
          const conv = conversationMap.get(senderId)!;
          conv.unread_count += 1;
        }
      }

      const conversationList = Array.from(conversationMap.values());
      
      // Load user profiles
      const userIds = conversationList.map(c => c.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_creator, role')
          .in('id', userIds);

        conversationList.forEach(conv => {
          const profile = profiles?.find(p => p.id === conv.user_id);
          if (profile) {
            conv.user_profile = profile;
          }
        });
      }

      // Sort by last message time
      conversationList.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setConversations(conversationList);
      setMessages(data || []);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast.error('Failed to load messages');
    }
  };

  const loadConversationMessages = async (userId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching conversation messages:', error);
        return;
      }

      // Load sender profiles
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return { ...message, sender_profile: null };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_creator, role')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender_profile: profile
          };
        })
      );

      setConversationMessages(messagesWithProfiles);

      // Mark unread messages as read
      const unreadMessages = data?.filter(m => 
        !m.is_read && m.sender_id === userId && m.recipient_id === user.id
      );
      
      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('inbox_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));
        
        fetchMessages(); // Refresh conversations
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const sendReply = async () => {
    if (!user || !selectedConversation || !replyContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedConversation,
          subject: 'Message Reply',
          content: replyContent,
          message_type: 'direct'
        });

      if (error) {
        console.error('Error sending reply:', error);
        toast.error('Failed to send message');
        return;
      }

      setReplyContent('');
      loadConversationMessages(selectedConversation);
      fetchMessages();
    } catch (error) {
      console.error('Error in sendReply:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const getUserDisplayName = (profile?: Profile) => {
    return profile?.full_name || profile?.username || 'Unknown User';
  };

  const filteredConversations = conversations.filter(conv =>
    getUserDisplayName(conv.user_profile).toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Please sign in to view your messages.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className={`${
        isMobile ? (selectedConversation ? 'hidden' : 'w-full') : 'w-80'
      } border-r border-gray-200 flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user_id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
                  selectedConversation === conversation.user_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conversation.user_id);
                  loadConversationMessages(conversation.user_id);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.user_profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white">
                        {conversation.user_profile?.full_name?.[0] || 
                         conversation.user_profile?.username?.[0] || 
                         <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {getUserDisplayName(conversation.user_profile)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.last_message_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs ml-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    {conversation.user_profile?.is_creator && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Creator
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${
        isMobile ? (selectedConversation ? 'w-full' : 'hidden') : 'flex-1'
      } flex flex-col`}>
        
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-purple-600 text-white flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <Avatar className="w-10 h-10">
                <AvatarImage src={conversations.find(c => c.user_id === selectedConversation)?.user_profile?.avatar_url} />
                <AvatarFallback className="bg-white/20 text-white">
                  {conversations.find(c => c.user_id === selectedConversation)?.user_profile?.full_name?.[0] || 
                   conversations.find(c => c.user_id === selectedConversation)?.user_profile?.username?.[0] || 
                   <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium">
                  {getUserDisplayName(conversations.find(c => c.user_id === selectedConversation)?.user_profile)}
                </h3>
                <p className="text-sm text-white/80">Online</p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {conversationMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === user?.id ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type a message..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={1}
                    className="resize-none border-0 bg-gray-100 rounded-full px-4 py-2 focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                  />
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={loading || !replyContent.trim()}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 rounded-full w-10 h-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInboxComponent;
