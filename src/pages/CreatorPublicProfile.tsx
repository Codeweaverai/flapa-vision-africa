import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, Clock, Play, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { getFollowStats } from '@/services/communityFollowerService';

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

      // Get follow stats and status if user is logged in
      let followStats = { followers_count: 0, following_count: 0 };
      let isFollowing = false;
      
      if (user) {
        followStats = await getFollowStats(id);
        const { data: followData } = await supabase
          .from('community_followers')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .single();
        isFollowing = !!followData;
      }

      setCreator({
        ...profile,
        followers_count: followStats.followers_count,
        following_count: followStats.following_count,
        is_following: isFollowing
      });

      // Fetch courses and events in parallel
      const [coursesResult, eventsResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, thumbnail_url, price, is_free, duration_minutes, difficulty_level')
          .eq('creator_id', id)
          .eq('is_published', true),
        
        supabase
          .from('events')
          .select('id, title, description, image_url, price, is_free, start_time, end_time, location, event_type')
          .eq('creator_id', id)
      ]);

      setCourses(coursesResult.data || []);
      setEvents(eventsResult.data || []);

    } catch (error) {
      console.error('Error loading creator data:', error);
      setError('Failed to load creator profile');
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !creatorId || !creator) {
      toast.error('Please log in to send a message');
      return;
    }

    try {
      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: creatorId,
          subject: `Message to ${creator.full_name}`,
          content: `Hi ${creator.full_name}, I'd like to connect with you!`,
          message_type: 'direct'
        });

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: creatorId,
          content: `You have a new message from ${user.user_metadata?.full_name || user.email}`,
          type: 'message',
          related_id: creatorId
        });

      toast.success('Message sent successfully!');
      window.location.href = '/inbox';
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
        followers_count: (prev.followers_count || 0) + (isFollowing ? 1 : -1)
      } : null);
    }
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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-300 rounded"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Creator Profile Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
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
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Creator Not Found</h2>
              <Button asChild>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          {/* Creator Header */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={creator.avatar_url} alt={creator.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-orange-400 to-purple-600 text-white">
                    {creator.full_name?.split(' ').map(n => n[0]).join('') || creator.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {creator.full_name || creator.username}
                    </h1>
                    {creator.is_creator && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Verified Creator
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      <span>{courses.length} Courses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span>{events.length} Events</span>
                    </div>
                    <button 
                      onClick={() => setShowFollowers({ userId: creatorId!, tab: 'followers' })}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{creator.followers_count || 0} Followers</span>
                    </button>
                    <button 
                      onClick={() => setShowFollowers({ userId: creatorId!, tab: 'following' })}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Users className="w-4 h-4 text-green-500" />
                      <span>{creator.following_count || 0} Following</span>
                    </button>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">
                      {creator.bio}
                    </p>
                  )}

                  {user && user.id !== creatorId && (
                    <div className="flex gap-3">
                      <UserFollowButton
                        userId={creatorId!}
                        isFollowing={creator.is_following || false}
                        onFollowChange={handleFollowChange}
                        size="lg"
                        showCount={true}
                        followersCount={creator.followers_count}
                        variant="default"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        size="lg"
                        variant="outline"
                        className="border-gray-300"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Published Courses</h2>
            
            {courses.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">This creator hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0">
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white/60" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {course.title}
                        </h3>
                        <Badge variant={course.is_free ? "secondary" : "default"} className="ml-2">
                          {course.is_free ? 'Free' : `$${course.price}`}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" asChild>
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

          {/* Events Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Published Events</h2>
            
            {events.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground">This creator hasn't published any events yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0">
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/60" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                          {event.title}
                        </h3>
                        <Badge variant={event.is_free ? "secondary" : "default"} className="ml-2">
                          {event.is_free ? 'Free' : `$${event.price}`}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span>{formatEventDate(event.start_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700" asChild>
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
    </Layout>
  );
};

export default CreatorPublicProfile;