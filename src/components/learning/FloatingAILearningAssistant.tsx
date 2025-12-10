import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, Brain, Lightbulb, Target, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  saveChatMessage, 
  loadChatHistory, 
  clearChatHistory, 
  callLumoAI,
  parseMessageContent,
  type AIChatMessage,
  type LumoAIResponse
} from '@/services/aiChatService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  structuredResponse?: LumoAIResponse;
  timestamp: Date;
  isError?: boolean;
}

interface FloatingAILearningAssistantProps {
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonContent?: string;
}

const FloatingAILearningAssistant: React.FC<FloatingAILearningAssistantProps> = ({ 
  courseId, 
  lessonId,
  lessonTitle,
  lessonContent
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      loadExistingChatHistory();
    }
  }, [user, isOpen, lessonId, courseId]);

  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const loadExistingChatHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await loadChatHistory(lessonId, courseId, 50, true);
      
      if (history.length > 0) {
        const convertedMessages: Message[] = history.map(msg => {
          const parsedContent = parseMessageContent(msg);
          const isStructured = typeof parsedContent !== 'string';
          
          return {
            id: msg.id,
            type: msg.message_type,
            content: isStructured ? (parsedContent as LumoAIResponse).response : parsedContent as string,
            structuredResponse: isStructured ? (parsedContent as LumoAIResponse) : undefined,
            timestamp: new Date(msg.created_at),
            isError: msg.context_data?.isError || false
          };
        });
        setMessages(convertedMessages);
      } else {
        setInitialWelcomeMessage();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load conversation history');
      setInitialWelcomeMessage();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const setInitialWelcomeMessage = () => {
    const welcomeResponse: LumoAIResponse = {
      response: `Hello! I'm **LumoAI**, your intelligent learning companion. I'm here to help you master ${
        lessonTitle ? `"${lessonTitle}"` : 'your course material'
      }.`,
      explanation: "I can help explain concepts, answer questions, provide examples, and guide your learning journey.",
      key_points: [
        "Ask questions about the lesson content",
        "Request explanations of complex topics",
        "Get practical examples and applications",
        "Explore related concepts and connections"
      ],
      suggestions: [
        "Start with specific questions about the material",
        "Ask for clarification on confusing topics",
        "Request real-world applications",
        "Explore connections to previous lessons"
      ],
      next_steps: "Type your question below to get started!",
      confidence: 0.95
    };

    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      type: 'assistant',
      content: welcomeResponse.response,
      structuredResponse: welcomeResponse,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message || !user || isLoading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message
    await saveChatMessage(
      'user', 
      message, 
      lessonId, 
      courseId, 
      { 
        lessonTitle: lessonTitle || '',
        lessonContentPreview: lessonContent ? 
          lessonContent.substring(0, 200) + (lessonContent.length > 200 ? '...' : '') : '',
        timestamp: new Date().toISOString(),
        source: 'learning-assistant'
      }
    );

    try {
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

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        type: 'assistant',
        content: result.response!.response,
        structuredResponse: result.response!,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant response
      await saveChatMessage(
        'assistant', 
        result.response!, 
        lessonId, 
        courseId, 
        { 
          lessonTitle: lessonTitle || '',
          timestamp: new Date().toISOString(),
          model: 'gpt-4',
          source: 'learning-assistant',
          response_structure: 'json'
        }
      );

    } catch (error: any) {
      console.error('LumoAI error:', error);
      
      const errorResponse: LumoAIResponse = {
        response: "⚠️ I apologize, but I'm experiencing connection issues with LumoAI.",
        explanation: "This could be a temporary network issue or service interruption.",
        key_points: [
          "Try again in a few moments",
          "Check your internet connection",
          "Verify you're properly authenticated"
        ],
        suggestions: [
          "Re-phrase your question",
          "Try a simpler version of your query",
          "Contact support if issue persists"
        ],
        next_steps: "Wait a moment and try your question again",
        confidence: 0.3,
        error: true
      };

      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        type: 'assistant',
        content: errorResponse.response,
        structuredResponse: errorResponse,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      await saveChatMessage(
        'assistant', 
        errorResponse, 
        lessonId, 
        courseId, 
        { 
          lessonTitle: lessonTitle || '',
          timestamp: new Date().toISOString(),
          isError: true,
          errorMessage: error.message,
          source: 'learning-assistant'
        }
      );
      
      toast.error('Failed to connect to LumoAI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user || messages.length <= 1) return;
    
    try {
      const success = await clearChatHistory(lessonId, courseId);
      if (success) {
        setInitialWelcomeMessage();
        toast.success('Conversation history cleared');
      } else {
        toast.error('Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
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

  const renderStructuredResponse = (response: LumoAIResponse) => {
    return (
      <div className="space-y-4">
        {/* Main Response */}
        <div className="text-sm leading-relaxed">
          {response.response}
        </div>
        
        {/* Explanation */}
        {response.explanation && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
              <BookOpen className="h-3 w-3" />
              Detailed Explanation
            </div>
            <div className="text-sm text-gray-700 mt-1">
              {response.explanation}
            </div>
          </div>
        )}
        
        {/* Key Points */}
        {response.key_points && response.key_points.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 mb-2">
              <Target className="h-3 w-3" />
              Key Points
            </div>
            <ul className="space-y-2">
              {response.key_points.map((point, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs mt-0.5">
                    {index + 1}
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Suggestions */}
        {response.suggestions && response.suggestions.length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-2">
              <Lightbulb className="h-3 w-3" />
              Helpful Suggestions
            </div>
            <ul className="space-y-2">
              {response.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs mt-0.5">
                    ✓
                  </div>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Next Steps */}
        {response.next_steps && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-700 mb-1">
              <TrendingUp className="h-3 w-3" />
              Recommended Next Steps
            </div>
            <div className="text-sm text-gray-700 mt-1">
              {response.next_steps}
            </div>
          </div>
        )}
        
        {/* Confidence Indicator */}
        {response.confidence !== undefined && !response.error && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Confidence Level</span>
              <span className="font-medium text-gray-700">
                {(response.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  response.confidence > 0.8 ? 'bg-green-500' :
                  response.confidence > 0.6 ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${response.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 group animate-bounce-slow"
          size="lg"
        >
          <Brain className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white"></span>
        </Button>
      )}

      {/* LumoAI Learning Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-50 animate-in slide-in-from-bottom-6 duration-300">
          <Card className="h-full bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm border border-blue-100 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Brain className="h-6 w-6 text-white" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">LumoAI Learning Assistant</CardTitle>
                    <p className="text-xs text-blue-100 font-medium">Structured AI-powered learning</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                    title="Clear conversation history"
                    disabled={messages.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {lessonTitle && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-blue-100">
                    <span className="font-semibold">Active context:</span> {lessonTitle}
                  </p>
                </div>
              )}
              
              <div className="mt-1 text-xs text-blue-200">
                {messages.length} message{messages.length !== 1 ? 's' : ''} • {user.email?.split('@')[0]}
              </div>
            </CardHeader>
            
            <CardContent className="flex flex-col h-[calc(100%-88px)] p-0">
              {/* Messages Area */}
              <ScrollArea 
                ref={scrollAreaRef}
                className="flex-1 p-4 bg-gradient-to-b from-white to-blue-50/30"
              >
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm text-gray-600">Loading your learning conversation...</p>
                    <p className="text-xs text-gray-400 mt-1">Fetching structured responses from LumoAI</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`group flex items-start gap-3 ${
                          message.type === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ring-2 ring-blue-200' 
                            : message.isError
                              ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-600 ring-2 ring-red-100'
                              : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 ring-2 ring-blue-50'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : message.isError ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                              : message.isError
                                ? 'bg-gradient-to-r from-red-50/80 to-orange-50/80 border border-red-100 text-red-700'
                                : 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-100 text-gray-800'
                          }`}>
                            {message.type === 'assistant' && message.structuredResponse 
                              ? renderStructuredResponse(message.structuredResponse)
                              : message.content
                            }
                          </div>
                          <div className={`text-xs mt-2 px-1 flex items-center gap-1 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`${message.isError ? 'text-red-500' : 'text-gray-400'}`}>
                              {formatTime(message.timestamp)}
                            </span>
                            {message.type === 'assistant' && !message.isError && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                LumoAI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading Indicator */}
                    {isLoading && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 flex items-center justify-center shadow-md ring-2 ring-blue-50">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-100 p-4 rounded-2xl text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-600 font-medium">LumoAI is processing your question...</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-2">
                            Generating structured learning response
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-blue-100 p-4 bg-gradient-to-r from-blue-50/70 to-purple-50/70">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder={`Ask LumoAI about ${lessonTitle || 'your learning'}...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[64px] resize-none pr-12 border-blue-200 focus:border-blue-400 focus:ring-blue-300 bg-white/80 backdrop-blur-sm"
                      disabled={isLoading}
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                      {inputMessage.length}/500
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-5 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed self-end min-h-[64px]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-xs text-gray-400 mt-3 text-center flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    LumoAI Structured Responses
                  </span>
                  <span>•</span>
                  <span>Press Enter to send</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingAILearningAssistant;
