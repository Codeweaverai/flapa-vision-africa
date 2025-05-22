
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import UserList from './UserList';

interface DirectMessageProps {
  className?: string;
}

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_profile?: Profile;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ className }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations when a user is selected
  useEffect(() => {
    if (!user || !selectedUser) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Get messages from both directions (sent and received)
        const { data: sentMessages, error: sentError } = await supabase
          .from('direct_messages')
          .select(`
            id, 
            content, 
            created_at, 
            sender_id, 
            receiver_id,
            sender:sender_id (id, username, avatar_url, full_name)
          `)
          .eq('sender_id', user.id)
          .eq('receiver_id', selectedUser.id)
          .order('created_at', { ascending: true });

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('direct_messages')
          .select(`
            id, 
            content, 
            created_at, 
            sender_id, 
            receiver_id,
            sender:sender_id (id, username, avatar_url, full_name)
          `)
          .eq('sender_id', selectedUser.id)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: true });

        if (sentError || receivedError) throw sentError || receivedError;

        // Combine and sort messages
        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])].sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        setMessages(allMessages as Message[]);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('direct-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.sender_id !== selectedUser.id) return;
          
          // Fetch sender profile
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, full_name')
            .eq('id', payload.new.sender_id)
            .single();
            
          const newMsg = {
            ...payload.new as Message,
            sender_profile: senderData || undefined
          };
          
          setMessages(current => [...current, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !selectedUser) return;
    
    setSending(true);
    try {
      const newMsg = {
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: selectedUser.id
      };
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert(newMsg)
        .select(`
          id, 
          content, 
          created_at, 
          sender_id, 
          receiver_id,
          sender:sender_id (id, username, avatar_url, full_name)
        `)
        .single();
        
      if (error) throw error;
      
      setMessages(current => [...current, data as Message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUserSelect = (profile: Profile) => {
    setSelectedUser(profile);
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please sign in to use direct messages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Direct Messages</span>
          {selectedUser && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
              Back to Users
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {!selectedUser ? (
          <UserList onUserSelect={handleUserSelect} currentUserId={user.id} />
        ) : (
          <>
            <div className="flex items-center gap-2 p-2 border-b mb-4">
              <Avatar className="h-8 w-8">
                {selectedUser.avatar_url ? (
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.username || 'User'} />
                ) : (
                  <AvatarFallback>
                    {(selectedUser.username || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.username || selectedUser.full_name || 'User'}</p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.sender_id === user.id ? 'justify-end' : ''}`}>
                      {message.sender_id !== user.id && (
                        <Avatar className="h-8 w-8">
                          {message.sender?.avatar_url ? (
                            <AvatarImage src={message.sender.avatar_url} alt={message.sender.username || 'User'} />
                          ) : (
                            <AvatarFallback>
                              {((message.sender?.username || message.sender?.full_name) ? 
                                (message.sender?.username || message.sender?.full_name)[0] : 
                                'U').toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${message.sender_id === user.id ? 'items-end' : ''}`}>
                        <div className={`px-3 py-2 rounded-lg ${
                          message.sender_id === user.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="break-words">{message.content}</p>
                        </div>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span>
                            {message.sender_id === user.id ? 'You' : (message.sender?.username || message.sender?.full_name || 'User')}
                          </span>
                          <span>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      
                      {message.sender_id === user.id && (
                        <Avatar className="h-8 w-8">
                          {user.user_metadata?.avatar_url ? (
                            <AvatarImage src={user.user_metadata.avatar_url} alt="You" />
                          ) : (
                            <AvatarFallback>
                              {(user.email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectMessage;
