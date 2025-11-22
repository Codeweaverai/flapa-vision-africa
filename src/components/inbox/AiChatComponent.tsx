import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles, Bot, User, BookOpen, Calendar, Clock, Users, Star, MapPin, Play, ArrowRight, Zap } from 'lucide-react';
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

// Course Card Component - Updated with reduced width and removed creator
const CourseRecommendationCard = ({ course, onCourseClick }: { course: any; onCourseClick: (id: string) => void }) => {
  return (
    <Card 
      className="group cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-orange-300 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full max-w-[280px] mx-auto"
      onClick={() => onCourseClick(course.id)}
    >
      <div className="relative h-32 overflow-hidden rounded-t-lg">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 via-purple-100 to-pink-200 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-gray-600 opacity-70" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <Badge className="bg-white/95 text-gray-700 backdrop-blur-sm font-medium text-xs px-2 py-1">
            {course.category}
          </Badge>
          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-medium text-xs px-2 py-1">
            {course.difficulty_level}
          </Badge>
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-full p-2 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
            <Play className="h-4 w-4 text-white fill-current" />
          </div>
        </div>
      </div>

      <CardContent className="p-3">
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-tight group-hover:text-orange-600 transition-colors">
          {course.title}
        </h4>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-500" />
            <span>{course._ui?.duration || `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}m`}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-purple-500" />
            <span>{course.total_students}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span>{course.average_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn(
              "font-bold text-base",
              course.is_free ? "bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent" : "text-gray-900"
            )}>
              {course.is_free ? 'Free' : `$${course.price}`}
            </span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-xs h-8 px-3">
            Enroll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Event Card Component - Updated with reduced width and removed creator
const EventRecommendationCard = ({ event, onEventClick }: { event: any; onEventClick: (id: string) => void }) => {
  const eventDate = new Date(event.start_time);
  const isUpcoming = eventDate > new Date();

  return (
    <Card 
      className="group cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full max-w-[280px] mx-auto"
      onClick={() => onEventClick(event.id)}
    >
      <div className="relative h-32 overflow-hidden rounded-t-lg">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 via-orange-100 to-pink-200 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-gray-600 opacity-70" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <Badge className={cn(
            "text-white border-0 font-medium text-xs px-2 py-1",
            isUpcoming 
              ? "bg-gradient-to-r from-green-500 to-emerald-600" 
              : "bg-gradient-to-r from-red-500 to-pink-600"
          )}>
            {isUpcoming ? 'Upcoming' : 'Live'}
          </Badge>
          <Badge className="bg-white/95 text-gray-700 backdrop-blur-sm font-medium text-xs px-2 py-1">
            {event.event_type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-3">
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-tight group-hover:text-purple-600 transition-colors">
          {event.title}
        </h4>

        {/* Event Details */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="h-3 w-3 text-purple-500" />
            <span className="truncate">{eventDate.toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-3 w-3 text-orange-500" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn(
              "font-bold text-base",
              event.is_free ? "bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent" : "text-gray-900"
            )}>
              {event.is_free ? 'Free' : `$${event.minPrice}`}
            </span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white text-xs h-8 px-3">
            {isUpcoming ? 'Register' : 'Join'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AiChatComponent = () => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
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
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          conversationHistory: messages.slice(-4).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        recommendations: data.recommendations,
        uiComponents: data.uiComponents,
        type: data.type,
        nextSteps: data.nextSteps,
        followUpQuestions: data.followUpQuestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: AiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! ⚡",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="h-full flex flex-col min-h-0"> {/* Added layout division */}
      <Card className="flex-1 flex flex-col bg-gradient-to-br from-orange-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-orange-200/30 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white relative overflow-hidden shrink-0">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-white rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                AI Smart Advisor 
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </CardTitle>
              <p className="text-sm opacity-90 font-light">
                {user ? 'Personalized recommendations based on your learning journey' : 'Ask me about courses, events, and learning paths'}
              </p>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-300 animate-bounce" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col flex-1 min-h-0"> {/* Fixed flex layout */}
          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 transition-all duration-300",
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <Avatar className={cn(
                    "w-8 h-8 md:w-10 md:h-10 flex-shrink-0 transition-all duration-300",
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-orange-500 shadow-lg' 
                      : 'bg-gradient-to-r from-orange-500 to-purple-500 shadow-lg'
                  )}>
                    <AvatarFallback className="bg-transparent text-white text-xs md:text-sm">
                      {message.role === 'user' ? <User className="w-3 h-3 md:w-4 md:h-4" /> : <Bot className="w-3 h-3 md:w-4 md:h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "flex-1 max-w-[80%] space-y-3",
                    message.role === 'user' ? 'text-right' : ''
                  )}>
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl p-3 md:p-4 transition-all duration-300",
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
                      <div className="space-y-4">
                        {/* Course Recommendations */}
                        {message.recommendations.courses && message.recommendations.courses.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <BookOpen className="h-4 w-4 text-orange-500" />
                              <span className="text-xs md:text-sm">Recommended Courses</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 justify-items-center">
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
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span className="text-xs md:text-sm">Upcoming Events</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 justify-items-center">
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
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Quick questions:</div>
                        <div className="flex flex-wrap gap-2">
                          {message.followUpQuestions.map((question, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer bg-white/80 hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:text-white transition-all duration-300 border border-orange-200 text-xs font-normal px-3 py-1"
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
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Next steps:</div>
                        <div className="space-y-1">
                          {message.nextSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                              <ArrowRight className="h-3 w-3 text-orange-500" />
                              <span className="text-xs md:text-sm">{step}</span>
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
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-orange-500 to-purple-500 shadow-lg">
                    <AvatarFallback className="bg-transparent text-white">
                      <Bot className="w-3 h-3 md:w-4 md:h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg border border-orange-100 max-w-[80%]">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Finding the best recommendations for you...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t border-orange-200/50 bg-white/50 backdrop-blur-sm p-4 shrink-0"> {/* Fixed to bottom */}
            <div className="flex gap-2 md:gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about courses, events, or get learning advice..."
                className="flex-1 border-orange-200 focus:border-orange-400 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300 focus:ring-2 focus:ring-orange-500/20 text-sm md:text-base"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl shrink-0"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Action Tips */}
            <div className="text-xs text-gray-500 mt-3 text-center hidden sm:flex items-center justify-center gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-orange-500" />
                <span>Try: "Show me web development courses"</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-purple-500" />
                <span>Or: "Upcoming events near me"</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiChatComponent;
