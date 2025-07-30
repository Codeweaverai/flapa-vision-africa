
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

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_creator: boolean;
  role: string;
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

  console.log('CreatorPublicProfile - creatorId from useParams:', creatorId);
  console.log('CreatorPublicProfile - current user:', user?.id);

  useEffect(() => {
    // Only proceed if creatorId is available
    if (!creatorId) {
      console.log('No creatorId found in URL params');
      setError('Creator ID not found in URL');
      setLoading(false);
      return;
    }

    // Validate creatorId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(creatorId)) {
      console.log('Invalid creator ID format:', creatorId);
      setError('Invalid creator ID format');
      setLoading(false);
      return;
    }

    console.log('Valid creatorId found, fetching data for:', creatorId);
    fetchCreatorData(creatorId);
  }, [creatorId]);

  const fetchCreatorData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching creator profile for ID:', id);
      
      // Fetch creator profile with explicit error handling
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url, username, is_creator, role')
        .eq('id', id)
        .maybeSingle();

      console.log('Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError(`Failed to fetch creator profile: ${profileError.message}`);
        return;
      }

      if (!profile) {
        console.log('No profile found for ID:', id);
        setError('Creator profile not found');
        return;
      }

      console.log('Profile loaded successfully:', profile);
      setCreator(profile);

      // Fetch courses and events in parallel
      console.log('Fetching courses and events for creator:', id);
      
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

      console.log('Courses query result:', coursesResult);
      console.log('Events query result:', eventsResult);

      // Handle courses
      if (coursesResult.error) {
        console.error('Courses fetch error:', coursesResult.error);
        setCourses([]);
      } else {
        setCourses(coursesResult.data || []);
        console.log('Courses loaded:', coursesResult.data?.length || 0);
      }

      // Handle events
      if (eventsResult.error) {
        console.error('Events fetch error:', eventsResult.error);
        setEvents([]);
      } else {
        setEvents(eventsResult.data || []);
        console.log('Events loaded:', eventsResult.data?.length || 0);
      }

    } catch (error) {
      console.error('Unexpected error in fetchCreatorData:', error);
      setError('An unexpected error occurred while loading the creator profile');
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

  // Loading state
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

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">
                Creator Profile Error
              </h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Creator ID: {creatorId || 'Not found'}
                </p>
                <Button asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // No creator found
  if (!creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">
                Creator Not Found
              </h2>
              <p className="text-muted-foreground mb-4">
                The creator profile you're looking for doesn't exist.
              </p>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 relative overflow-hidden">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Creator Header */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={creator?.avatar_url} alt={creator?.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-orange-400 to-purple-600 text-white">
                    {creator?.full_name?.split(' ').map(n => n[0]).join('') || creator?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {creator?.full_name || creator?.username}
                    </h1>
                    {creator?.is_creator && (
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
                  </div>
                  
                  {creator?.bio && (
                    <p className="text-muted-foreground leading-relaxed max-w-3xl mb-6">
                      {creator.bio}
                    </p>
                  )}

                  {user && user.id !== creatorId && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSendMessage}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Send Message
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
                  <Card 
                    key={course.id} 
                    className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          }}
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
                        <Badge 
                          variant={course.is_free ? "secondary" : "default"}
                          className="ml-2"
                        >
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
                        <Link to={`/learning/course-detail/${course.id}`} className="flex items-center justify-center">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className="group bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 rounded-t-lg overflow-hidden">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                          }}
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
                        <Badge 
                          variant={event.is_free ? "secondary" : "default"}
                          className="ml-2"
                        >
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
                        <Link to={`/events/${event.id}`} className="flex items-center justify-center">
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
        </div>
      </div>
    </Layout>
  );
};

export default CreatorPublicProfile;
