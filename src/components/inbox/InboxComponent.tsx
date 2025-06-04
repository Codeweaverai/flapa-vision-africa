
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  MailOpen, 
  Send, 
  Trash2, 
  Search,
  Plus,
  Reply,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  message_type: string;
  related_id?: string;
  created_at: string;
  sender_profile?: Profile;
}

const InboxComponent = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Compose form state
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('inbox_messages')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'inbox_messages',
            filter: `recipient_id=eq.${user.id}` 
          }, 
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError || !messagesData) {
        console.error('Error loading messages:', messagesError);
        setLoading(false);
        return;
      }

      // Then get sender profiles
      const senderIds = messagesData.map(m => m.sender_id);
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', senderIds);

        // Combine messages with profiles
        const messagesWithProfiles = messagesData.map(message => ({
          ...message,
          sender_profile: profiles?.find(p => p.id === message.sender_id)
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('inbox_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('inbox_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted');
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    }
  };

  const sendMessage = async () => {
    if (!user || !composeRecipient || !composeSubject || !composeContent) {
      toast.error('Please fill in all fields');
      return;
    }

    setComposing(true);
    
    try {
      // Get recipient ID by email
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', composeRecipient)
        .single();

      if (!recipient) {
        toast.error('Recipient not found');
        setComposing(false);
        return;
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipient.id,
          subject: composeSubject,
          content: composeContent,
          message_type: 'user_message',
          is_read: false
        });

      if (error) {
        toast.error('Failed to send message');
      } else {
        toast.success('Message sent successfully');
        setShowCompose(false);
        setComposeRecipient('');
        setComposeSubject('');
        setComposeContent('');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setComposing(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Messages List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h2>
          <Button
            size="sm"
            onClick={() => setShowCompose(true)}
            className="bg-gradient-to-r from-orange-500 to-purple-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Compose
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMessage?.id === message.id ? 'ring-2 ring-orange-500' : ''
              } ${!message.is_read ? 'bg-orange-50 border-orange-200' : ''}`}
              onClick={() => {
                setSelectedMessage(message);
                if (!message.is_read) {
                  markAsRead(message.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender_profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.sender_profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {message.sender_profile?.full_name || 'Unknown'}
                      </span>
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate mb-1">
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No messages found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Your inbox is empty'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail / Compose */}
      <div className="lg:col-span-2">
        {showCompose ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">To (Email)</label>
                <Input
                  placeholder="recipient@example.com"
                  value={composeRecipient}
                  onChange={(e) => setComposeRecipient(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Write your message here..."
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={sendMessage}
                  disabled={composing}
                  className="bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {composing ? 'Sending...' : 'Send Message'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCompose(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedMessage ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedMessage.sender_profile?.avatar_url} />
                    <AvatarFallback>
                      {selectedMessage.sender_profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedMessage.subject}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      From: {selectedMessage.sender_profile?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(selectedMessage.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteMessage(selectedMessage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No message selected</h3>
                <p className="text-gray-600">Select a message to read it</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InboxComponent;
