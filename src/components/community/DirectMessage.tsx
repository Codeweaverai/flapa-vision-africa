
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
}

interface DirectMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender?: Profile;
  receiver?: Profile;
}

const DirectMessages: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available users
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .neq('id', user.id)
          .order('username');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user]);

  // Load messages when selected user changes
  useEffect(() => {
    if (!user || !selectedUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Get messages where current user is sender OR receiver, and selected user is the opposite
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            *,
            sender:sender_id (id, username, avatar_url, full_name),
            receiver:receiver_id (id, username, avatar_url, full_name)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id}))`,
        },
        async (payload) => {
          // Fetch full message data with sender and receiver
          const { data } = await supabase
            .from('direct_messages')
            .select(`
              *,
              sender:sender_id (id, username, avatar_url, full_name),
              receiver:receiver_id (id, username, avatar_url, full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((current) => [...current, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUserId, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !selectedUserId) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          receiver_id: selectedUserId,
        });
        
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Direct Messages</span>
          {selectedUser && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {selectedUser.avatar_url ? (
                  <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.username || 'User'} />
                ) : (
                  <AvatarFallback>
                    {(selectedUser.username || selectedUser.full_name || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm">
                {selectedUser.username || selectedUser.full_name || 'User'}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <Select onValueChange={(value) => setSelectedUserId(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a user to message" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.username || 'User'} />
                    ) : (
                      <AvatarFallback>
                        {(user.username || user.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>{user.username || user.full_name || 'User'}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedUserId ? (
          <>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.sender_id === user?.id ? 'justify-end' : ''}`}>
                      {message.sender_id !== user?.id && (
                        <Avatar className="h-8 w-8">
                          {message.sender?.avatar_url ? (
                            <AvatarImage src={message.sender.avatar_url} alt={message.sender.username || 'User'} />
                          ) : (
                            <AvatarFallback>
                              {(message.sender?.username || message.sender?.full_name || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${message.sender_id === user?.id ? 'items-end' : ''}`}>
                        <div className={`px-3 py-2 rounded-lg ${
                          message.sender_id === user?.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="break-words">{message.content}</p>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </div>
                      </div>
                      
                      {message.sender_id === user?.id && (
                        <Avatar className="h-8 w-8">
                          {message.sender?.avatar_url ? (
                            <AvatarImage src={message.sender.avatar_url} alt={message.sender.username || 'User'} />
                          ) : (
                            <AvatarFallback>
                              {(message.sender?.username || message.sender?.full_name || 'U')[0].toUpperCase()}
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
                disabled={!user || sending}
              />
              <Button type="submit" size="icon" disabled={!user || !newMessage.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a user to start messaging</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectMessages;
