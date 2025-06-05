
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Search, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  User,
  Edit3,
  X,
  Reply,
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

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

interface ChatPreview {
  id: string;
  user: Profile;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline?: boolean;
}

const ModernInboxComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatPreviews, setChatPreviews] = useState<ChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('inbox_messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'inbox_messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch sender profiles
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

      setMessages(messagesWithProfiles);
      generateChatPreviews(messagesWithProfiles);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const generateChatPreviews = (allMessages: Message[]) => {
    const chatMap = new Map<string, ChatPreview>();
    
    allMessages.forEach(message => {
      const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
      if (!otherUserId) return;

      const existing = chatMap.get(otherUserId);
      if (!existing || new Date(message.created_at) > new Date(existing.timestamp)) {
        const profile = message.sender_id === user?.id 
          ? { id: message.recipient_id, username: 'Unknown', full_name: 'Unknown User' }
          : message.sender_profile || { id: otherUserId, username: 'Unknown', full_name: 'Unknown User' };

        chatMap.set(otherUserId, {
          id: otherUserId,
          user: profile as Profile,
          lastMessage: message.content,
          timestamp: message.created_at,
          unreadCount: allMessages.filter(m => 
            m.sender_id === otherUserId && 
            m.recipient_id === user?.id && 
            !m.is_read
          ).length,
          isOnline: Math.random() > 0.5 // Simulate online status
        });
      }
    });

    setChatPreviews(Array.from(chatMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const selectChat = async (chatId: string) => {
    setSelectedChat(chatId);
    const chatMessages = messages.filter(m => 
      (m.sender_id === chatId && m.recipient_id === user?.id) ||
      (m.sender_id === user?.id && m.recipient_id === chatId)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    setSelectedMessages(chatMessages);
    
    // Mark messages as read
    const unreadMessages = chatMessages.filter(m => m.sender_id === chatId && !m.is_read);
    for (const message of unreadMessages) {
      await markAsRead(message.id);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (!error) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedChat,
          subject: replyingTo ? `Re: ${replyingTo.subject}` : 'New Message',
          content: newMessage,
          message_type: 'direct',
          related_id: replyingTo?.id
        });

      if (error) {
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
      setReplyingTo(null);
      await fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendNewChatMessage = async () => {
    if (!user || !newChatUsername.trim() || !newChatMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newChatUsername.trim())
        .single();

      if (recipientError || !recipientData) {
        toast.error('User not found');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientData.id,
          subject: 'New Message',
          content: newChatMessage,
          message_type: 'direct'
        });

      if (error) {
        toast.error('Failed to send message');
        return;
      }

      toast.success('Message sent successfully');
      setNewChatUsername('');
      setNewChatMessage('');
      setShowNewChat(false);
      await fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chatPreviews.filter(chat =>
    chat.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    if (message.is_read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-gray-400" />;
  };

  if (!user) {
    return (
      <Card className="p-6">
        <CardContent>
          <p>Please sign in to view your messages.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-lg overflow-hidden flex">
      {/* Chat List Panel */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">SkillPulse Chat</h2>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Username"
                    value={newChatUsername}
                    onChange={(e) => setNewChatUsername(e.target.value)}
                  />
                  <Textarea
                    placeholder="Message"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={sendNewChatMessage} disabled={loading} className="w-full">
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No chats yet. Start a conversation!</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat === chat.id ? 'bg-gradient-to-r from-orange-50 to-purple-50 border-l-4 border-l-orange-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.user.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                        {chat.user.full_name?.[0] || chat.user.username?.[0] || <User className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {chat.user.full_name || chat.user.username}
                      </p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(chat.timestamp), 'MMM d')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chatPreviews.find(c => c.id === selectedChat)?.user.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                    {chatPreviews.find(c => c.id === selectedChat)?.user.full_name?.[0] || <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {chatPreviews.find(c => c.id === selectedChat)?.user.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {chatPreviews.find(c => c.id === selectedChat)?.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.sender_id === user?.id ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {getMessageStatus(message)}
                      </div>
                      
                      {/* Reply button for received messages */}
                      {message.sender_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(message)}
                          className="mt-2 h-6 px-2 text-xs hover:bg-gray-100"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mx-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Replying to:</p>
                    <p className="text-sm text-gray-800 truncate">{replyingTo.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-full w-10 h-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to SkillPulse Chat</h3>
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernInboxComponent;
