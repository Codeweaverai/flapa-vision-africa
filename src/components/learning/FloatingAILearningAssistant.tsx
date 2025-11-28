import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  formattedContent?: {
    subject?: string;
    body: string;
    emoji?: string;
  };
}

interface FloatingAILearningAssistantProps {
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;
}

interface AIResponse {
  success: boolean;
  response: string;
  formatted?: {
    subject: string;
    body: string;
    emoji: string;
  };
}

const FloatingAILearningAssistant: React.FC<FloatingAILearningAssistantProps> = ({ 
  courseId, 
  lessonId,
  lessonTitle,
  lessonContent
}) => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's first name for personalization
  const userName = userProfile?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome-1',
        type: 'assistant' as const,
        content: `Hello ${userName}! 👋 I'm Lumo AI, your Learning Assistant. I'm here to help you understand this lesson and answer any questions you have. What would you like to know about "${lessonTitle}"?`,
        timestamp: new Date(),
        formattedContent: {
          emoji: '👋',
          subject: `WELCOME TO LUMO AI, ${userName.toUpperCase()}!`,
          body: `I'm Lumo AI, your dedicated Learning Assistant. I'm here to help you understand this lesson and answer any questions you have. What would you like to know about "${lessonTitle}"?`
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, lessonTitle, userName]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clean and format AI response
  const formatAIResponse = (content: string): { subject: string; body: string; emoji: string } => {
    // Remove markdown symbols and clean up text
    let cleanedContent = content
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Default values
    let subject = 'LUMO AI ASSISTANT';
    let body = cleanedContent;
    let emoji = '💡';

    // Try to parse JSON response first
    try {
      const parsed = JSON.parse(cleanedContent);
      if (parsed.subject && parsed.body) {
        subject = parsed.subject.toUpperCase();
        body = parsed.body;
        emoji = parsed.emoji || '💡';
        return { subject, body, emoji };
      }
    } catch {
      // If not JSON, try to extract subject from the content
      const lines = cleanedContent.split('\n');
      const firstLine = lines[0].trim();
      
      // Check if first line could be a subject (short, ends without period, etc.)
      if (firstLine.length <= 60 && !firstLine.endsWith('.') && !firstLine.endsWith(',')) {
        subject = firstLine.toUpperCase();
        body = lines.slice(1).join('\n').trim();
      }
    }

    // Add emoji based on content context
    if (body.toLowerCase().includes('welcome') || body.toLowerCase().includes('hello')) {
      emoji = '👋';
    } else if (body.toLowerCase().includes('congrat') || body.toLowerCase().includes('great job')) {
      emoji = '🎉';
    } else if (body.toLowerCase().includes('understand') || body.toLowerCase().includes('explain')) {
      emoji = '📚';
    } else if (body.toLowerCase().includes('example') || body.toLowerCase().includes('practice')) {
      emoji = '💪';
    } else if (body.toLowerCase().includes('remember') || body.toLowerCase().includes('important')) {
      emoji = '⭐';
    } else if (body.toLowerCase().includes('next') || body.toLowerCase().includes('continue')) {
      emoji = '🚀';
    } else if (body.toLowerCase().includes('help') || body.toLowerCase().includes('support')) {
      emoji = '🤝';
    } else if (body.toLowerCase().includes('lumo')) {
      emoji = '✨';
    }

    return { subject, body, emoji };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('learning-ai-assistant', {
        body: {
          message: inputMessage.trim(),
          lessonTitle,
          lessonContent,
          courseId,
          lessonId,
          userId: user.id,
          userName: userProfile?.full_name || 'Student',
          conversationHistory: messages
            .filter(msg => msg.type === 'user' || msg.type === 'assistant')
            .map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
        }
      });

      if (error) throw error;

      const aiData = data as AIResponse;
      const formattedContent = formatAIResponse(aiData.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiData.response,
        timestamp: new Date(),
        formattedContent
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save chat to history
      await supabase.from('ai_chat_history').insert([
        {
          user_id: user.id,
          message_type: 'user',
          content: userMessage.content,
          course_id: courseId,
          lesson_id: lessonId,
          context_data: { courseId, lessonId, lessonTitle, userName }
        },
        {
          user_id: user.id,
          message_type: 'assistant',
          content: aiData.response,
          formatted_content: formattedContent,
          course_id: courseId,
          lesson_id: lessonId,
          context_data: { courseId, lessonId, lessonTitle, userName }
        }
      ]);

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        formattedContent: {
          emoji: '😔',
          subject: 'LUMO AI - CONNECTION ISSUE',
          body: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'user') {
      return message.content;
    }

    if (message.formattedContent) {
      const { subject, body, emoji } = message.formattedContent;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-purple-700">
            <span>{emoji}</span>
            <span>{subject}</span>
          </div>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        </div>
      );
    }

    // Fallback for older messages without formatting
    return (
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {message.content.replace(/\*\*/g, '').replace(/\*/g, '')}
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
          size="lg"
        >
          <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Chat with Lumo AI</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[480px] h-[600px] z-50 animate-in slide-in-from-bottom-6 duration-300">
          <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">Lumo AI Assistant</CardTitle>
                    <p className="text-xs text-white/90 font-medium">
                      Hello, {userName}! {lessonTitle ? `• ${lessonTitle}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col h-[calc(100%-80px)] p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.type === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                          : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className={`flex-1 min-w-0 ${message.type === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[90%] p-4 rounded-2xl text-sm shadow-sm ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                            : 'bg-white border border-gray-100 text-gray-800'
                        }`}>
                          {renderMessageContent(message)}
                        </div>
                        <div className={`text-xs text-gray-500 mt-2 ${
                          message.type === 'user' ? 'text-right' : ''
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white border border-gray-100 p-4 rounded-2xl text-sm shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-gray-600 font-medium">Lumo AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Ask Lumo AI about ${lessonTitle ? 'this lesson' : 'your course'}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-gray-200 focus:border-purple-300 rounded-xl"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Lumo AI can help explain concepts, review materials, and answer questions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingAILearningAssistant;
