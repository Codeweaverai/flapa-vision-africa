
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Reply, Trash2, Verified, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_creator?: boolean;
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

const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const composeUsername = searchParams.get('compose');

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [recipientUsername, setRecipientUsername] = useState(composeUsername || '');
  const [showCompose, setShowCompose] = useState(!!composeUsername);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel(`inbox_realtime_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        console.log('Real-time update:', payload);
        fetchMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inbox_messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        console.log('Real-time update (sent):', payload);
        fetchMessages();
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

      if (error) throw error;

      // Fetch sender profiles for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return { ...message, sender_profile: null };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_creator')
            .eq('id', message.sender_id)
            .single();

          return { ...message, sender_profile: profile };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

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

  const sendReply = async () => {
    if (!user || !selectedMessage || !replyContent.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    if (!selectedMessage.sender_id) {
      toast.error('Cannot reply to system messages');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedMessage.sender_id,
          subject: `Re: ${selectedMessage.subject}`,
          content: replyContent,
          message_type: 'direct',
          related_id: selectedMessage.id
        });

      if (error) throw error;

      toast.success('Reply sent successfully');
      setReplyContent('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const sendNewMessage = async () => {
    if (!user || !recipientUsername.trim() || !newMessageSubject.trim() || !newMessageContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', recipientUsername.trim())
        .single();

      if (recipientError || !recipientData) {
        toast.error('Recipient not found');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientData.id,
          subject: newMessageSubject,
          content: newMessageContent,
          message_type: 'direct'
        });

      if (error) throw error;

      toast.success('Message sent successfully');
      setNewMessageSubject('');
      setNewMessageContent('');
      setRecipientUsername('');
      setShowCompose(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .delete()
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;

      toast.success('Message deleted');
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleProfileClick = (senderId: string) => {
    navigate(`/creator/${senderId}`);
  };

  const getSenderName = (message: Message): string => {
    if (!message.sender_profile) {
      return 'System';
    }
    return message.sender_profile.full_name || message.sender_profile.username || 'Unknown User';
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <p>Please sign in to view your messages.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Messages List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inbox</CardTitle>
              <Button onClick={() => setShowCompose(!showCompose)} size="sm">
                Compose
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {messages.length === 0 ? (
                  <p className="p-4 text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                        selectedMessage?.id === message.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.is_read) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar 
                          className="w-10 h-10 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (message.sender_id) {
                              handleProfileClick(message.sender_id);
                            }
                          }}
                        >
                          <AvatarImage src={message.sender_profile?.avatar_url} />
                          <AvatarFallback>
                            {message.sender_profile?.full_name?.[0] || 
                             message.sender_profile?.username?.[0] || 'S'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {getSenderName(message)}
                              </span>
                              {message.sender_profile?.is_creator && (
                                <Verified className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                            {!message.is_read && (
                              <Badge variant="secondary" className="ml-2">
                                New
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium truncate text-sm">{message.subject}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Content & Reply */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              {showCompose ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Compose New Message</h3>
                  <Input
                    placeholder="Recipient username"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                  />
                  <Input
                    placeholder="Subject"
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                  />
                  <Textarea
                    placeholder="Message content"
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button onClick={sendNewMessage} disabled={loading}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={() => setShowCompose(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="w-12 h-12 cursor-pointer"
                        onClick={() => selectedMessage.sender_id && handleProfileClick(selectedMessage.sender_id)}
                      >
                        <AvatarImage src={selectedMessage.sender_profile?.avatar_url} />
                        <AvatarFallback>
                          {selectedMessage.sender_profile?.full_name?.[0] || 
                           selectedMessage.sender_profile?.username?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                          {selectedMessage.sender_profile?.is_creator && (
                            <Badge className="bg-blue-500">
                              <Verified className="w-3 h-3 mr-1" />
                              Creator
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From: {getSenderName(selectedMessage)} • {' '}
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>

                  {selectedMessage.sender_id && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center">
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </h4>
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={4}
                        />
                        <Button onClick={sendReply} disabled={loading}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a message to view its content
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default InboxPage;
