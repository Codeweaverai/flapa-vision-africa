
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: {
    username?: string;
    avatar_url?: string;
  };
  receiver?: {
    username?: string;
    avatar_url?: string;
  };
}

interface DirectMessageProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

const DirectMessage: React.FC<DirectMessageProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on component mount
  useEffect(() => {
    if (!user || !recipientId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch messages from community_messages with channel = 'dm:userId:recipientId' or 'dm:recipientId:userId'
        const { data, error } = await supabase
          .from('community_messages')
          .select('*')
          .or(`and(channel.eq.dm:${user.id}:${recipientId},user_id.eq.${user.id}),and(channel.eq.dm:${user.id}:${recipientId},user_id.eq.${recipientId}),and(channel.eq.dm:${recipientId}:${user.id},user_id.eq.${user.id}),and(channel.eq.dm:${recipientId}:${user.id},user_id.eq.${recipientId})`)
          .order('created_at');

        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Failed to load messages');
        } else {
          // Map the database results to our Message interface
          const mappedMessages: Message[] = data?.map(msg => ({
            id: msg.id,
            sender_id: msg.user_id,
            receiver_id: msg.user_id === user.id ? recipientId : user.id,
            content: msg.content,
            created_at: msg.created_at
          })) || [];
          
          setMessages(mappedMessages);
        }
      } catch (err) {
        console.error('Error in message fetch:', err);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Set up realtime subscription for new messages
    const dmChannelId1 = `dm:${user.id}:${recipientId}`;
    const dmChannelId2 = `dm:${recipientId}:${user.id}`;
    
    const channel = supabase
      .channel('direct_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public',
          table: 'community_messages',
          filter: `channel=eq.${dmChannelId1}`
        }, 
        (payload) => {
          const newMsg = payload.new as any;
          const mappedMsg: Message = {
            id: newMsg.id,
            sender_id: newMsg.user_id,
            receiver_id: newMsg.user_id === user.id ? recipientId : user.id,
            content: newMsg.content,
            created_at: newMsg.created_at
          };
          setMessages(prev => [...prev, mappedMsg]);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public',
          table: 'community_messages',
          filter: `channel=eq.${dmChannelId2}`
        }, 
        (payload) => {
          const newMsg = payload.new as any;
          const mappedMsg: Message = {
            id: newMsg.id,
            sender_id: newMsg.user_id,
            receiver_id: newMsg.user_id === user.id ? recipientId : user.id,
            content: newMsg.content,
            created_at: newMsg.created_at
          };
          setMessages(prev => [...prev, mappedMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !recipientId) return;
    
    try {
      setSending(true);
      
      // Create a direct message channel id in format dm:senderId:recipientId
      const channelId = `dm:${user.id}:${recipientId}`;
      
      const { error } = await supabase
        .from('community_messages')
        .insert({
          user_id: user.id,
          content: newMessage.trim(),
          channel: channelId
        });
        
      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } else {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error in message send:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp to readable time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {recipientAvatar ? (
              <AvatarImage src={recipientAvatar} alt={recipientName} />
            ) : (
              <AvatarFallback>{recipientName[0]}</AvatarFallback>
            )}
          </Avatar>
          <span>{recipientName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMine = message.sender_id === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isMine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DirectMessage;
