import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, Clock, Play, MessageCircle, Calendar, MapPin, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { getFollowStats } from '@/services/communityFollowerService';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_creator: boolean;
  role: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
  is_free: boolean;
  duration_minutes: number;
  difficulty_level: string;
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  is_free: boolean;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  total_attendees?: number;
}

const CreatorPublicProfile: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>(); 
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowers, setShowFollowers] = useState<{ userId: string; tab: 'followers' | 'following' } | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setError('Creator ID not found in URL');
      setLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(creatorId)) {
      setError('Invalid creator ID format');
      setLoading(false);
      return;
    }

    fetchCreatorData(creatorId);
  }, [creatorId]);

  const fetchCreatorData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch creator profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, username, is_creator, role')
        .eq('id', id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        setError('Creator profile not found');
        return;
      }

      // Get follow stats and status
      let followStats = { followers_count: 0, following_count: 0 };
      let isFollowing = false;
      
      try {
        followStats = await getFollowStats(id);
        
        if (user) {
          const { data: followData } = await supabase
            .from('community_followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', id)
            .single();
          isFollowing = !!followData;
        }
      } catch (error) {
        console.error('Error fetching follow stats:', error);
        // Continue with default values if follow stats fail
      }

      setCreator({
        ...profile,
        followers_count: followStats.followers_count,
        following_count: followStats.following_count,
        is_following: isFollowing
      });

      // Fetch courses with reviews and enrollments
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_reviews (rating),
          course_enrollments (id)
        `)
        .eq('creator_id', id)
        .eq('is_published', true);

      if (!coursesError && coursesData) {
        const coursesWithStats = coursesData.map(course => {
          const reviews = course.course_reviews || [];
          const enrollments = course.course_enrollments || [];
          
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            course_reviews: undefined,
            course_enrollments: undefined
          };
        });
        setCourses(coursesWithStats);
      }

      // Fetch events with bookings
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_bookings (id)
        `)
        .eq('creator_id', id);

      if (!eventsError && eventsData) {
        const eventsWithStats = eventsData.map(event => ({
          ...event,
          total_attendees: (event.event_bookings || []).length,
          event_bookings: undefined
        }));
        setEvents(eventsWithStats);
      }

    } catch (error) {
      console.error('Error loading creator data:', error);
      setError('Failed to load creator profile');
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('Please log in to send a message');
      return;
    }

    if (!creatorId || !creator) {
      toast.error('Creator information not available');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('inbox_conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${creatorId},user2_id.eq.${creatorId}`)
        .single();

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('inbox_conversations')
          .insert({
            user1_id: user.id,
            user2_id: creatorId,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;
      }

      // Send initial message
      const { error: messageError } = await supabase
        .from('inbox_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: creatorId,
          subject: `Message to ${creator.full_name}`,
          content: `Hi ${creator.full_name}, I'd like to connect with you!`,
          message_type: 'direct'
        });

      if (messageError) throw messageError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: creatorId,
          content: `You have a new message from ${user.user_metadata?.full_name || user.email}`,
          type: 'message',
          related_id: conversationId
        });

      toast.success('Message sent successfully!');
      // Redirect to inbox or conversation
      window.location.href = `/inbox?conversation=${conversationId}`;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (creator && creator.id === userId) {
      setCreator(prev => prev ? {
        ...prev,
        is_following: isFollowing,
        followers_count: Math.max(0, (prev.followers_count || 0) + (isFollowing ? 1 : -1))
      } : null);
    }
  };

  const handleFollowersClick = () => {
    if (creatorId) {
      setShowFollowers({ userId: creatorId, tab: 'followers' });
    }
  };

  const handleFollowingClick = () => {
    if (creatorId) {
      setShowFollowers({ userId: creatorId, tab: 'following' });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date TBD';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-32 h-32 bg-gradient-to-r from-orange-200 to-purple-200 rounded-full"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-8 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl shadow-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Creator Profile Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Creator Not Found</h2>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Creator Header with Orange-Purple Gradient Background */}
          <Card className="mb-8 bg-gradient-to-r from-orange-500 to-purple-600 shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-8 relative text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
                    <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                    <AvatarFallback className="text-2xl bg-white/20 text-white">
                      {creator.full_name?.split(' ').map(n => n[0]).join('') || creator.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {creator.is_creator && (
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm shadow-lg">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-white">
                      {creator.full_name || creator.username}
                    </h1>
                  </div>
                  
                  {/* Stats Grid with White Text */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-white" />
                        <span className="text-2xl font-bold text-white">{courses.length}</span>
                      </div>
                      <p className="text-xs text-white/80">Courses</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-white" />
                        <span className="text-2xl font-bold text-white">{events.length}</span>
                      </div>
                      <p className="text-xs text-white/80">Events</p>
                    </div>
                    <button 
                      onClick={handleFollowersClick}
                      className="bg-white/10 rounded-xl p-4 text-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-2xl font-bold text-white">{creator.followers_count || 0}</span>
                      </div>
                      <p className="text-xs text-white/80">Followers</p>
                    </button>
                    <button 
                      onClick={handleFollowingClick}
                      className="bg-white/10 rounded-xl p-4 text-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-2xl font-bold text-white">{creator.following_count || 0}</span>
                      </div>
                      <p className="text-xs text-white/80">Following</p>
                    </button>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-white/90 leading-relaxed max-w-3xl mb-6 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                      {creator.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {user && user.id !== creatorId && (
                      <>
                        <UserFollowButton
                          userId={creatorId!}
                          isFollowing={creator.is_following || false}
                          onFollowChange={handleFollowChange}
                          size="lg"
                          showCount={false}
                          followersCount={creator.followers_count}
                          variant="default"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          size="lg"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Message
                        </Button>
                      </>
                    )}
                    {!user && (
                      <div className="flex gap-3">
                        <Button 
                          asChild
                          size="lg"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        >
                          <Link to="/auth/login">
                            Follow
                          </Link>
                        </Button>
                        <Button 
                          asChild
                          size="lg"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        >
                          <Link to="/auth/login">
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Courses Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Published Courses</h2>
            </div>
            
            {courses.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No Courses Yet</h3>
                  <p className="text-gray-600">This creator hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="group bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                      
                      {/* Animated Play Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 rounded-full p-3 shadow-lg animate-pulse-slow">
                          <Play className="h-5 w-5 text-white fill-current" />
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <Link 
                        to={`/learning/course-detail/${course.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <div className="bg-white rounded-full p-3 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Play className="h-6 w-6 text-orange-600 fill-current" />
                        </div>
                      </Link>

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        {course.is_free ? (
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                            <PriceDisplay amount={course.price} originalCurrency="USD" />
                          </Badge>
                        )}
                      </div>

                      {/* Difficulty Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-purple-800 border-purple-200 backdrop-blur-sm">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                        {course.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                      
                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span>{formatDuration(course.duration_minutes)}</span>
                        </div>
                        {course.average_rating && course.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{course.average_rating.toFixed(1)}</span>
                            <span className="text-gray-500">({course.total_reviews})</span>
                          </div>
                        )}
                      </div>

                      {/* Students Count */}
                      {course.total_students && course.total_students > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span>{course.total_students} students</span>
                        </div>
                      )}
                      
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                        <Link to={`/learning/course-detail/${course.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          View Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Events Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-orange-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Published Events</h2>
            </div>
            
            {events.length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">No Events Yet</h3>
                  <p className="text-gray-600">This creator hasn't published any events yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="group bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-orange-400 overflow-hidden">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                      
                      {/* Animated Calendar Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 rounded-full p-3 shadow-lg animate-pulse-slow">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <Link 
                        to={`/events/${event.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <div className="bg-white rounded-full p-3 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                      </Link>

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        {event.is_free ? (
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                            <PriceDisplay amount={event.price} originalCurrency="USD" />
                          </Badge>
                        )}
                      </div>

                      {/* Event Type Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-purple-800 border-purple-200 backdrop-blur-sm">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                        {event.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                      
                      {/* Event Details */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span>{formatEventDate(event.start_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        {event.total_attendees && event.total_attendees > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>{event.total_attendees} attending</span>
                          </div>
                        )}
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                        <Link to={`/events/${event.id}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          View Event
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Followers Modal */}
          {showFollowers && (
            <FollowersList
              userId={showFollowers.userId}
              isOpen={!!showFollowers}
              onClose={() => setShowFollowers(null)}
              initialTab={showFollowers.tab}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

export default CreatorPublicProfile;
