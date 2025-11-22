import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, Bot, User, BookOpen, Calendar, Clock, Users, Star, MapPin, Play, ArrowRight, Zap, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: {
    courses: Array<{
      id: string;
      title: string;
      category: string;
      difficulty_level: string;
      price: number;
      duration_minutes: number;
      thumbnail_url?: string;
      average_rating: number;
      total_students: number;
      creator_name: string;
      creator_avatar?: string;
      reason: string;
      _ui?: {
        cardType: string;
        badge: string;
        difficultyBadge: string;
        duration: string;
        rating: string;
        students: number;
      };
    }>;
    events: Array<{
      id: string;
      title: string;
      event_type: string;
      start_time: string;
      location: string;
      image_url?: string;
      minPrice: number;
      is_free: boolean;
      creator_name: string;
      creator_avatar?: string;
      reason: string;
      _ui?: {
        cardType: string;
        badge: string;
        status: string;
        date: string;
        time: string;
        registered: string;
        rating: string;
      };
    }>;
  };
  uiComponents?: {
    showCourseGrid: boolean;
    showEventGrid: boolean;
    highlightCategory: string;
  };
  type?: string;
  nextSteps?: string[];
  followUpQuestions?: string[];
}

interface ConversationThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Updated Course Card Component - Removed "by Instructor"
const CourseRecommendationCard = ({ course, onCourseClick }: { course: any; onCourseClick: (id: string) => void }) => {
  return (
    <Card 
      className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-orange-200/50 hover:border-orange-300 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
      onClick={() => onCourseClick(course.id)}
    >
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-200 via-purple-200 to-pink-300 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white opacity-80" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Badge className="bg-white/90 text-gray-700 backdrop-blur-sm font-medium text-xs">
            {course.category}
          </Badge>
          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-medium text-xs">
            {course.difficulty_level}
          </Badge>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-3 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h4 className="font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-orange-600 transition-colors">
          {course.title}
        </h4>

        {/* Course Stats - Removed creator section */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-500" />
            <span>{course._ui?.duration || `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}m`}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-purple-500" />
            <span>{course.total_students} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span>{course.average_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn(
              "font-bold text-lg",
              course.is_free ? "bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent" : "text-gray-900"
            )}>
              {course.is_free ? 'Free' : `$${course.price}`}
            </span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-xs">
            Enroll Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Event Card Component (unchanged)
const EventRecommendationCard = ({ event, onEventClick }: { event: any; onEventClick: (id: string) => void }) => {
  const eventDate = new Date(event.start_time);
  const isUpcoming = eventDate > new Date();

  return (
    <Card 
      className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-purple-200/50 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
      onClick={() => onEventClick(event.id)}
    >
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-200 via-orange-200 to-pink-300 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-white opacity-80" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Badge className={cn(
            "text-white border-0 font-medium text-xs",
            isUpcoming 
              ? "bg-gradient-to-r from-green-500 to-emerald-600" 
              : "bg-gradient-to-r from-red-500 to-pink-600 animate-pulse"
          )}>
            {isUpcoming ? 'Upcoming' : 'Live Now'}
          </Badge>
          <Badge className="bg-white/90 text-gray-700 backdrop-blur-sm font-medium text-xs">
            {event.event_type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h4 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
          {event.title}
        </h4>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="h-3 w-3 text-purple-500" />
            <span>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-3 w-3 text-orange-500" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="h-3 w-3 text-purple-500" />
            <span>{event._ui?.registered || `${event.sold_tickets || 0}/${event.total_capacity || 0}`} registered</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn(
              "font-bold text-lg",
              event.is_free ? "bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent" : "text-gray-900"
            )}>
              {event.is_free ? 'Free' : `From $${event.minPrice}`}
            </span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white text-xs">
            {isUpcoming ? 'Register' : 'Join Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AiChatComponent = () => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationThreads, setConversationThreads] = useState<ConversationThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const shouldScrollToBottom = useRef(true);

  // Load conversation threads and history
  useEffect(() => {
    if (user) {
      loadConversationThreads();
    } else {
      // For anonymous users, show welcome message
      setMessages([getWelcomeMessage()]);
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Load conversation threads for the user
  const loadConversationThreads = async () => {
    if (!user) return;

    try {
      const { data: threads, error } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversationThreads(threads || []);

      // Load the most recent thread or create a new one
      if (threads && threads.length > 0) {
        await loadThreadMessages(threads[0].id);
      } else {
        await createNewThread();
      }
    } catch (error) {
      console.error('Error loading conversation threads:', error);
      toast.error('Failed to load conversation history');
      setMessages([getWelcomeMessage()]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Create a new conversation thread
  const createNewThread = async () => {
    if (!user) {
      setMessages([getWelcomeMessage()]);
      return;
    }

    try {
      const { data: thread, error } = await supabase
        .from('conversation_threads')
        .insert({
          user_id: user.id,
          title: 'New Conversation'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentThreadId(thread.id);
      setConversationThreads(prev => [thread, ...prev]);
      setMessages([getWelcomeMessage()]);
    } catch (error) {
      console.error('Error creating new thread:', error);
      toast.error('Failed to create new conversation');
      setMessages([getWelcomeMessage()]);
    }
  };

  // Load messages for a specific thread
  const loadThreadMessages = async (threadId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert database messages to AiMessage format
      const formattedMessages: AiMessage[] = messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        recommendations: msg.metadata?.recommendations,
        uiComponents: msg.metadata?.uiComponents,
        type: msg.metadata?.type,
        nextSteps: msg.metadata?.nextSteps,
        followUpQuestions: msg.metadata?.followUpQuestions
      }));

      // If no messages, add welcome message
      if (formattedMessages.length === 0) {
        formattedMessages.push(getWelcomeMessage());
      }

      setMessages(formattedMessages);
      setCurrentThreadId(threadId);
      
      // Set flag to scroll to bottom on initial load
      isInitialLoad.current = true;
      shouldScrollToBottom.current = true;
    } catch (error) {
      console.error('Error loading thread messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const getWelcomeMessage = (): AiMessage => ({
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm your AI Smart Advisor for SkillPulse! 🚀\n\nI can help you discover personalized courses, events, and learning paths tailored to your interests. I have access to your learning history and can provide smart recommendations.\n\nWhat would you like to learn about today?",
    timestamp: new Date(),
    type: 'welcome',
    followUpQuestions: [
      "What courses do you recommend for web development?",
      "Show me upcoming events in my area",
      "Help me choose my next learning path"
    ]
  });

  // Improved scroll behavior
  useEffect(() => {
    if (messages.length === 0) return;

    const scrollToBottom = () => {
      if (scrollAreaRef.current && shouldScrollToBottom.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    };

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 100);
    });

    // Reset initial load flag after first render
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        // If user is near the bottom (within 100px), auto-scroll to bottom
        shouldScrollToBottom.current = scrollHeight - scrollTop - clientHeight < 100;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AiMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Force scroll to bottom when user sends a message
    shouldScrollToBottom.current = true;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('smart-advisor', {
        body: {
          message: inputMessage,
          userId: user?.id || null,
          threadId: currentThreadId,
          conversationHistory: messages.slice(-4).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: AiMessage = {
        id: data.messageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        recommendations: data.recommendations,
        uiComponents: data.uiComponents,
        type: data.type,
        nextSteps: data.nextSteps,
        followUpQuestions: data.followUpQuestions
      };

      // Force scroll to bottom when AI responds
      shouldScrollToBottom.current = true;
      setMessages(prev => [...prev, assistantMessage]);

      // Update thread title if this is the first user message
      if (messages.length === 1 && currentThreadId && user) {
        const title = inputMessage.substring(0, 50) + (inputMessage.length > 50 ? '...' : '');
        await supabase
          .from('conversation_threads')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', currentThreadId);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: AiMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! ⚡",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    await createNewThread();
  };

  const handleDeleteThread = async (threadId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ is_active: false })
        .eq('id', threadId);

      if (error) throw error;

      setConversationThreads(prev => prev.filter(thread => thread.id !== threadId));
      
      // If we deleted the current thread, switch to the most recent one or create new
      if (threadId === currentThreadId) {
        if (conversationThreads.length > 1) {
          const nextThread = conversationThreads.find(thread => thread.id !== threadId);
          if (nextThread) {
            await loadThreadMessages(nextThread.id);
          } else {
            await createNewThread();
          }
        } else {
          await createNewThread();
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleCourseClick = (courseId: string) => {
    window.open(`/learning/course-detail/${courseId}`, '_blank');
  };

  const handleEventClick = (eventId: string) => {
    window.open(`/events/${eventId}`, '_blank');
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full min-h-[600px] mb-12"> {/* Reduced min-height */}
        <Card className="h-full bg-gradient-to-br from-orange-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-orange-200/30 shadow-2xl">
          <CardContent className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600 font-medium">Loading your conversations...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px] mb-12"> {/* Reduced min-height and increased margin */}
      <Card className="h-full bg-gradient-to-br from-orange-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-orange-200/30 shadow-2xl flex flex-col">
        {/* Reduced Header Height */}
        <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white relative overflow-hidden flex-shrink-0 py-4"> {/* Reduced padding */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-white rounded-full animate-pulse"></div> {/* Smaller elements */}
            <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div> {/* Smaller elements */}
          </div>
          
          <div className="flex items-center gap-2 relative z-10"> {/* Reduced gap */}
            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm"> {/* Smaller padding */}
              <Bot className="h-5 w-5" /> {/* Smaller icon */}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-1.5"> {/* Smaller text and gap */}
                AI Smart Advisor 
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" /> {/* Smaller icon */}
              </CardTitle>
              <p className="text-xs opacity-90 font-light"> {/* Smaller text */}
                {user ? 'Personalized recommendations based on your learning journey' : 'Ask me about courses, events, and learning paths'}
              </p>
            </div>
            <div className="px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm"> {/* Smaller padding */}
              <Zap className="h-3 w-3 text-yellow-300 animate-bounce" /> {/* Smaller icon */}
            </div>
          </div>

          {/* Conversation History Sidebar - Compact */}
          {user && conversationThreads.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20"> {/* Reduced margin and padding */}
              <div className="flex items-center justify-between mb-1.5"> {/* Reduced margin */}
                <span className="text-xs font-medium">Your Conversations</span> {/* Smaller text */}
                <Button
                  size="sm"
                  onClick={handleNewConversation}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs h-6 px-2" /* Smaller button */
                >
                  <MessageSquare className="h-2.5 w-2.5 mr-1" /> {/* Smaller icon */}
                  New
                </Button>
              </div>
              <ScrollArea className="h-16"> {/* Reduced height */}
                <div className="flex gap-1.5 flex-wrap"> {/* Reduced gap */}
                  {conversationThreads.map((thread) => (
                    <Badge
                      key={thread.id}
                      variant={currentThreadId === thread.id ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer transition-all duration-300 text-xs font-normal px-2 py-0.5 flex items-center gap-1 mb-0.5", /* Reduced padding */
                        currentThreadId === thread.id 
                          ? "bg-white text-orange-600" 
                          : "bg-white/20 text-white hover:bg-white/30"
                      )}
                      onClick={() => loadThreadMessages(thread.id)}
                    >
                      <span className="max-w-[100px] truncate text-xs">{thread.title}</span> {/* Smaller max-width and text */}
                      <Trash2 
                        className="h-2.5 w-2.5 ml-0.5 opacity-70 hover:opacity-100 flex-shrink-0" /* Smaller icon */
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                      />
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <ScrollArea 
            className="flex-1 p-3 md:p-4" /* Reduced padding */
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            <div className="space-y-3 md:space-y-4"> {/* Reduced spacing */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2 md:gap-3 transition-all duration-300", /* Reduced gap */
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <Avatar className={cn(
                    "w-7 h-7 md:w-9 md:h-9 flex-shrink-0 transition-all duration-300", /* Smaller avatar */
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-orange-500 shadow-lg' 
                      : 'bg-gradient-to-r from-orange-500 to-purple-500 shadow-lg'
                  )}>
                    <AvatarFallback className="bg-transparent text-white text-xs"> {/* Smaller text */}
                      {message.role === 'user' ? <User className="w-3 h-3 md:w-4 md:h-4" /> : <Bot className="w-3 h-3 md:w-4 md:h-4" />} /* Smaller icons */
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "flex-1 max-w-[82%] md:max-w-[85%] space-y-1.5 md:space-y-2", /* Reduced max-width and spacing */
                    message.role === 'user' ? 'text-right' : ''
                  )}>
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-xl p-2.5 md:p-3 transition-all duration-300", /* Reduced padding and border radius */
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white shadow-xl ml-auto'
                          : 'bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg border border-orange-100'
                      )}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {formatMessageContent(message.content)}
                      </div>
                    </div>

                    {/* Recommendations Grid */}
                    {message.role === 'assistant' && message.recommendations && (
                      <div className="space-y-2 md:space-y-3"> {/* Reduced spacing */}
                        {/* Course Recommendations */}
                        {message.recommendations.courses && message.recommendations.courses.length > 0 && (
                          <div className="space-y-1.5 md:space-y-2"> {/* Reduced spacing */}
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"> {/* Reduced gap */}
                              <BookOpen className="h-3.5 w-3.5 text-orange-500" /> {/* Smaller icon */}
                              <span className="text-sm">Recommended Courses</span> {/* Smaller text */}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3"> {/* Reduced gap */}
                              {message.recommendations.courses.map((course) => (
                                <CourseRecommendationCard
                                  key={course.id}
                                  course={course}
                                  onCourseClick={handleCourseClick}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Event Recommendations */}
                        {message.recommendations.events && message.recommendations.events.length > 0 && (
                          <div className="space-y-1.5 md:space-y-2"> {/* Reduced spacing */}
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"> {/* Reduced gap */}
                              <Calendar className="h-3.5 w-3.5 text-purple-500" /> {/* Smaller icon */}
                              <span className="text-sm">Upcoming Events</span> {/* Smaller text */}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3"> {/* Reduced gap */}
                              {message.recommendations.events.map((event) => (
                                <EventRecommendationCard
                                  key={event.id}
                                  event={event}
                                  onEventClick={handleEventClick}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="space-y-1.5"> {/* Reduced spacing */}
                        <div className="text-xs text-gray-500 font-medium">Quick questions:</div>
                        <div className="flex flex-wrap gap-1.5"> {/* Reduced gap */}
                          {message.followUpQuestions.map((question, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer bg-white/80 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white transition-all duration-300 border border-orange-200 text-xs font-normal px-2.5 py-0.5" /* Reduced padding */
                              onClick={() => handleQuickQuestion(question)}
                            >
                              {question}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {message.role === 'assistant' && message.nextSteps && message.nextSteps.length > 0 && (
                      <div className="space-y-1.5"> {/* Reduced spacing */}
                        <div className="text-xs text-gray-500 font-medium">Next steps:</div>
                        <div className="space-y-1">
                          {message.nextSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-sm text-gray-700"> {/* Reduced gap */}
                              <ArrowRight className="h-2.5 w-2.5 text-orange-500" /> {/* Smaller icon */}
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={cn(
                      "text-xs text-gray-500 transition-opacity duration-300",
                      message.role === 'user' ? 'text-right' : ''
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2 md:gap-3"> {/* Reduced gap */}
                  <Avatar className="w-7 h-7 md:w-9 md:h-9 bg-gradient-to-r from-orange-500 to-purple-500 shadow-lg"> {/* Smaller avatar */}
                    <AvatarFallback className="bg-transparent text-white">
                      <Bot className="w-3 h-3 md:w-4 md:h-4" /> {/* Smaller icon */}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2.5 md:p-3 shadow-lg border border-orange-100 max-w-[82%] md:max-w-[85%]"> {/* Reduced padding */}
                    <div className="flex items-center gap-1.5 md:gap-2"> {/* Reduced gap */}
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div> {/* Smaller dots */}
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Finding the best recommendations for you...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area - Now has more space */}
          <div className="border-t border-orange-200/50 bg-white/50 backdrop-blur-sm p-3 flex-shrink-0"> {/* Reduced padding */}
            <div className="flex gap-2 md:gap-2.5"> {/* Reduced gap */}
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about courses, events, or get learning advice..."
                className="flex-1 border-orange-200 focus:border-orange-400 bg-white/80 backdrop-blur-sm rounded-lg transition-all duration-300 focus:ring-2 focus:ring-orange-500/20 text-sm md:text-base" /* Reduced border radius */
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-lg flex-shrink-0" /* Reduced border radius */
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Action Tips */}
            <div className="text-xs text-gray-500 mt-2 text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3"> {/* Reduced margin and gap */
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-orange-500" />
                <span className="hidden xs:inline">Try: "Show me web development courses"</span>
                <span className="xs:hidden">"Web development courses"</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-purple-500" />
                <span className="hidden xs:inline">Or: "Upcoming events near me"</span>
                <span className="xs:hidden">"Upcoming events"</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiChatComponent;
