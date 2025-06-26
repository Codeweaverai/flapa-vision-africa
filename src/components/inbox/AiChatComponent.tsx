
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionIds?: {
    courseId?: string;
    eventId?: string;
    bundleId?: string;
  };
}

const AiChatComponent = () => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI Smart Advisor for SkillPulse. I can help you discover personalized courses, events, and learning paths. I have access to your learning history and can provide tailored recommendations. What would you like to learn about today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-advisor', {
        body: {
          message: inputMessage,
          userId: user?.id || null,
          context: 'inbox_chat'
        }
      });

      if (error) throw error;

      const assistantMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionIds: data.actionIds
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (actionType: string, id: string) => {
    if (actionType === 'course') {
      window.location.href = `/courses/${id}`;
    } else if (actionType === 'event') {
      window.location.href = `/events/${id}`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Smart Advisor</CardTitle>
            <p className="text-sm opacity-90">Ask me anything about courses and events</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-[500px]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={`${message.role === 'user' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    
                    {/* Action Buttons */}
                    {message.role === 'assistant' && message.actionIds && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actionIds.courseId && (
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-orange-100 text-xs"
                            onClick={() => handleActionClick('course', message.actionIds!.courseId!)}
                          >
                            View Course
                          </Badge>
                        )}
                        {message.actionIds.eventId && (
                          <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-purple-100 text-xs"
                            onClick={() => handleActionClick('event', message.actionIds!.eventId!)}
                          >
                            View Event
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4 bg-gray-50/50">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about courses, events, or get learning advice..."
              className="flex-1 border-orange-200 focus:border-orange-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {user ? 'Getting personalized recommendations based on your profile' : 'Sign in for personalized recommendations'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiChatComponent;
