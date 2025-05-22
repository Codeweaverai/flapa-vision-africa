
import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CommunityLayout from '@/components/community/CommunityLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { 
  CommunityMessage, 
  fetchChatMessages, 
  sendChatMessage 
} from '@/services/communityService';
import { supabase } from '@/lib/supabaseClient';

const CommunityChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  useEffect(() => {
    loadMessages();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('public:community_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages',
          filter: `channel=eq.general` 
        }, 
        (payload) => {
          console.log('New message received!', payload);
          if (payload.new) {
            fetchUserData(payload.new as CommunityMessage);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserData = async (message: CommunityMessage) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, full_name')
        .eq('id', message.user_id)
        .single();
        
      if (!error && data) {
        const enrichedMessage = {
          ...message,
          profiles: data
        };
        
        // Add to messages in correct order (newest at bottom)
        setMessages(prev => [...prev, enrichedMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const loadMessages = async () => {
    const data = await fetchChatMessages();
    // Show messages with oldest first
    setMessages(data.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    const message = await sendChatMessage(user.id, newMessage);
    if (message) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch (value) {
      case 'feed':
        navigate('/community');
        break;
      case 'chat':
        navigate('/community/chat');
        break;
      case 'courses':
        navigate('/community/courses');
        break;
      case 'notifications':
        navigate('/community/notifications');
        break;
    }
  };

  return (
    <CommunityLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="flex flex-col h-[calc(100vh-300px)]">
        <h2 className="text-2xl font-bold mb-4">Community Chat</h2>
        
        <Card className="flex-1 overflow-hidden mb-4 p-4">
          <div className="h-full overflow-y-auto p-2 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`flex gap-2 max-w-[80%] ${
                      message.user_id === user.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {message.profiles?.avatar_url ? (
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.username || 'User'} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div 
                        className={`px-4 py-2 rounded-lg ${
                          message.user_id === user.id 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-muted rounded-tl-none'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                      <div 
                        className={`text-xs text-muted-foreground mt-1 ${
                          message.user_id === user.id ? 'text-right' : ''
                        }`}
                      >
                        {message.profiles?.username || 'Unknown'} • {format(new Date(message.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </div>
    </CommunityLayout>
  );
};

export default CommunityChatPage;
