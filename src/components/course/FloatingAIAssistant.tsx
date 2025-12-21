import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, X, MessageCircle, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveChatMessage, 
  loadChatHistory, 
  clearChatHistory, 
  callLumoAI,
  type AIChatMessage 
} from '@/services/aiChatService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface FloatingAIAssistantProps {
  lessonTitle?: string;
  lessonContent?: string;
  courseId?: string;
  lessonId?: string;
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ 
  lessonTitle, 
  lessonContent, 
  courseId,
  lessonId
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load chat history when component mounts or context changes
  useEffect(() => {
    if (user && isOpen) {
      loadExistingChatHistory();
    }
  }, [user, isOpen, lessonId, courseId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const loadExistingChatHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      // Load messages in chronological order (oldest first)
      const history = await loadChatHistory(lessonId, courseId, 50, true);
      
      if (history.length > 0) {
        // Convert database messages to component format
        const convertedMessages: Message[] = history.map(msg => ({
          id: msg.id,
          type: msg.message_type,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isError: msg.context_data?.isError || false
        }));
        setMessages(convertedMessages);
      } else {
        // Set initial welcome message if no history exists
        setInitialWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
      setInitialWelcomeMessage();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const setInitialWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      type: 'assistant',
      content: `Hello! I'm **LumoAI**, your intelligent learning companion. ${
        lessonTitle 
          ? `I'm here to help you with "${lessonTitle}". `
          : 'I\'m here to help you with your learning journey. '
      }Ask me anything about the content, concepts, or how to apply what you're learning!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || !user || isLoading) return;

    // Create user message object
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message to database
    const savedUserMessage = await saveChatMessage(
      'user', 
      message, 
      lessonId, 
      courseId, 
      { 
        lessonTitle: lessonTitle || '',
        lessonContentPreview: lessonContent ? 
          lessonContent.substring(0, 150) + (lessonContent.length > 150 ? '...' : '') : '',
        timestamp: new Date().toISOString(),
        source: 'floating-assistant'
      }
    );

    if (!savedUserMessage) {
      console.warn('Failed to save user message to database, continuing with LumoAI call...');
    }

    try {
      console.log('Calling LumoAI with:', {
        message,
        lessonTitle,
        hasLessonContent: !!lessonContent,
        courseId,
        lessonId,
        userId: user.id
      });

      // Call LumoAI Edge Function
      const result = await callLumoAI(
        message,
        lessonTitle,
        lessonContent,
        courseId,
        lessonId
      );

      if (!result.success) {
        throw new Error(result.error || 'LumoAI request failed');
      }

      // Create assistant message
      const responseText = typeof result.response === 'string' ? result.response : String(result.response || '');
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant response to database
      await saveChatMessage(
        'assistant', 
        responseText, 
        lessonId, 
        courseId, 
        { 
          lessonTitle: lessonTitle || '',
          timestamp: new Date().toISOString(),
          model: 'gpt-4.1-2025-04-14',
          source: 'floating-assistant',
          messageLength: responseText.length
        }
      );

    } catch (error: any) {
      console.error('Error with LumoAI:', error);
      
      // Create error message
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble connecting to LumoAI right now. This might be a temporary issue. Please try again in a moment, or try rephrasing your question.",
        timestamp: new Date(),
        isError: true
      };
      
      // Add error message to UI
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database
      await saveChatMessage(
        'assistant', 
        errorMessage.content, 
        lessonId, 
        courseId, 
        { 
          lessonTitle: lessonTitle || '',
          timestamp: new Date().toISOString(),
          isError: true,
          errorDetails: error.message,
          source: 'floating-assistant'
        }
      );
      
      toast.error('Failed to get response from LumoAI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user || messages.length === 0) return;
    
    try {
      const success = await clearChatHistory(lessonId, courseId);
      if (success) {
        setInitialWelcomeMessage();
        toast.success('Chat history cleared successfully');
      } else {
        toast.error('Failed to clear chat history');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear chat history');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
          size="lg"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-2 -right-2">
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
          </span>
        </Button>
      )}

      {/* LumoAI Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="h-full bg-white/95 backdrop-blur-sm border border-purple-100 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-orange-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-purple-800">
                  <div className="relative">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  LumoAI Assistant
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Clear chat history"
                    disabled={messages.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lessonTitle && (
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  <span className="text-gray-500">Helping with:</span> {lessonTitle}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col h-[calc(100%-80px)] p-0">
              <ScrollArea 
                ref={scrollAreaRef}
                className="flex-1 p-4"
              >
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Loading conversation history...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.type === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[85%] p-3 rounded-2xl text-sm ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-sm'
                              : message.isError
                                ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 text-red-700'
                                : 'bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 text-gray-800'
                          }`}>
                            {message.content}
                          </div>
                          <div className={`text-xs mt-1 px-1 ${
                            message.type === 'user' ? 'text-gray-500' : 
                            message.isError ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center shadow-md">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 p-3 rounded-2xl text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-xs text-gray-500 ml-2">LumoAI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-purple-50/50 to-orange-50/50">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Ask LumoAI about ${lessonTitle ? `"${lessonTitle}"` : 'this lesson'}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[60px] resize-none border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    disabled={isLoading}
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 px-4 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
