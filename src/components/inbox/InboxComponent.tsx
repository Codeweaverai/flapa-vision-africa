
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Inbox, Send, Search, Mail, MailOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id?: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  message_type: string;
  created_at: string;
  sender_profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

const InboxComponent = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`inbox_${user.id}`)
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
    const { data, error } = await supabase
      .from('inbox_messages')
      .select(`
        *,
        sender_profile:profiles!sender_id(full_name, avatar_url)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('inbox_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', user.id);

    if (!error) {
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.recipient || !newMessage.subject || !newMessage.content) {
      toast.error('Please fill in all fields');
      return;
    }

    // For simplicity, we'll assume recipient is an email and we need to find the user ID
    // In a real app, you'd have a user search/selection component
    const { data: recipientUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newMessage.recipient)
      .single();

    if (!recipientUser) {
      toast.error('Recipient not found');
      return;
    }

    const { error } = await supabase
      .from('inbox_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientUser.id,
        subject: newMessage.subject,
        content: newMessage.content,
        message_type: 'direct'
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      toast.success('Message sent successfully');
      setNewMessage({ recipient: '', subject: '', content: '' });
      setIsComposing(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
      {/* Message List */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setIsComposing(true)}>
                <Send className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </div>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredMessages.length > 0 ? (
                <div className="space-y-1">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b ${
                        selectedMessage?.id === message.id ? 'bg-muted' : ''
                      } ${!message.is_read ? 'bg-blue-50 font-medium' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender_profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {message.sender_profile?.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {message.sender_profile?.full_name || 'System'}
                            </span>
                            {!message.is_read ? (
                              <Mail className="h-3 w-3 text-blue-600" />
                            ) : (
                              <MailOpen className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{message.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No messages found</h3>
                  <p className="text-gray-600">No messages match your search criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail or Compose */}
      <div className="lg:col-span-2">
        {isComposing ? (
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Recipient username"
                value={newMessage.recipient}
                onChange={(e) => setNewMessage({...newMessage, recipient: e.target.value})}
              />
              <Input
                placeholder="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
              />
              <Textarea
                placeholder="Message content..."
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                rows={8}
              />
              <div className="flex gap-2">
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setIsComposing(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedMessage ? (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={selectedMessage.sender_profile?.avatar_url} />
                  <AvatarFallback>
                    {selectedMessage.sender_profile?.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{selectedMessage.subject}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedMessage.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {selectedMessage.sender_profile?.full_name || 'System'}
                  </p>
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
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">Select a message</h3>
                <p className="text-gray-600">Choose a message from the list to read it here.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InboxComponent;
