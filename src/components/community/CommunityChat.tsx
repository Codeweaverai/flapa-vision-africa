
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  channel: string;
  user?: {
    username?: string;
    avatar_url?: string;
    full_name?: string;
  };
}

interface ChatProps {
  channel?: string;
}

const CommunityChat: React.FC<ChatProps> = ({ channel = 'general' }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('community_messages')
          .select(`
            *,
            user:user_id (username, avatar_url, full_name)
          `)
          .eq('channel', channel)
          .order('created_at', { ascending: true })
          .limit(100);

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
          table: 'community_messages',
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          // Fetch user data for the new message
          const { data: userData } = await supabase
            .from('profiles')
            .select('username, avatar_url, full_name')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((current) => [...current, {
            ...payload.new as Message,
            user: userData || undefined
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content: newMessage.trim(),
          user_id: user.id,
          channel
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

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Community Chat - #{channel}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.user_id === user?.id ? 'justify-end' : ''}`}>
                  {message.user_id !== user?.id && (
                    <Avatar className="h-8 w-8">
                      {message.user?.avatar_url ? (
                        <AvatarImage src={message.user.avatar_url} alt={message.user.username || 'User'} />
                      ) : (
                        <AvatarFallback>
                          {(message.user?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${message.user_id === user?.id ? 'items-end' : ''}`}>
                    <div className={`px-3 py-2 rounded-lg ${
                      message.user_id === user?.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="break-words">{message.content}</p>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        {message.user?.username || message.user?.full_name || 'Anonymous'}
                      </span>
                      <span>
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  
                  {message.user_id === user?.id && (
                    <Avatar className="h-8 w-8">
                      {message.user?.avatar_url ? (
                        <AvatarImage src={message.user.avatar_url} alt={message.user.username || 'User'} />
                      ) : (
                        <AvatarFallback>
                          {(message.user?.username || 'U')[0].toUpperCase()}
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
      </CardContent>
    </Card>
  );
};

export default CommunityChat;
