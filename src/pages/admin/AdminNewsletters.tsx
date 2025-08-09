
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Calendar, Eye, Send, MapPin, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  currency: string;
  average_rating?: number;
  total_reviews?: number;
  enrollment_count?: number;
  creator: {
    full_name: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location?: string;
  start_date: string;
  end_date: string;
  price: number;
  currency: string;
  average_rating?: number;
  total_reviews?: number;
  registration_count?: number;
  creator: {
    full_name: string;
  };
}

interface Creator {
  id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  total_courses?: number;
  total_events?: number;
  average_rating?: number;
  total_students?: number;
}

interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: string;
  created_at: string;
  sent_at?: string;
  total_recipients?: number;
  successful_sends?: number;
  failed_sends?: number;
}

const AdminNewsletters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'drafts' | 'sent'>('create');
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContent();
    loadNewsletters();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load courses with ratings and enrollment count
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          price,
          currency,
          profiles:creator_id (
            full_name
          )
        `)
        .eq('status', 'published')
        .limit(20);

      // Load events with ratings and registration count
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          image_url,
          location,
          start_date,
          end_date,
          price,
          currency,
          profiles:creator_id (
            full_name
          )
        `)
        .gte('end_date', new Date().toISOString())
        .limit(20);

      // Load creators
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          bio,
          avatar_url
        `)
        .eq('role', 'creator')
        .limit(20);

      // Process the data to add additional stats
      const processedCourses = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id);

          // Get reviews and rating
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const averageRating = reviews && reviews.length > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            creator: course.profiles,
            enrollment_count: enrollmentCount || 0,
            average_rating: averageRating,
            total_reviews: reviews?.length || 0
          };
        })
      );

      const processedEvents = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get registration count
          const { count: registrationCount } = await supabase
            .from('event_bookings')
            .select('*', { count: 'exact' })
            .eq('event_id', event.id);

          return {
            ...event,
            creator: event.profiles,
            registration_count: registrationCount || 0,
            average_rating: 4.5, // Placeholder
            total_reviews: 12 // Placeholder
          };
        })
      );

      const processedCreators = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          // Get course count
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact' })
            .eq('creator_id', creator.id);

          // Get event count
          const { count: eventCount } = await supabase
            .from('events')
            .select('*', { count: 'exact' })
            .eq('creator_id', creator.id);

          // Get total students (enrollments)
          const { count: studentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .in('course_id', 
              (await supabase
                .from('courses')
                .select('id')
                .eq('creator_id', creator.id)
              ).data?.map(c => c.id) || []
            );

          return {
            ...creator,
            total_courses: courseCount || 0,
            total_events: eventCount || 0,
            total_students: studentCount || 0,
            average_rating: 4.7 // Placeholder
          };
        })
      );

      setCourses(processedCourses);
      setEvents(processedEvents);
      setCreators(processedCreators);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters(data || []);
    } catch (error) {
      console.error('Error loading newsletters:', error);
      toast.error('Failed to load newsletters');
    }
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-orange-50/20">
      <div className="relative overflow-hidden">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-40 object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          ${course.price}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2 bg-gradient-to-r from-orange-700 to-purple-700 bg-clip-text text-transparent">
          {course.title}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-2">
          {course.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{course.average_rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({course.total_reviews})</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-purple-600">
            <Users className="h-4 w-4" />
            <span>{course.enrollment_count} students</span>
          </div>
          <span className="text-orange-600 font-medium">by {course.creator?.full_name}</span>
        </div>
      </CardContent>
    </Card>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50/20">
      <div className="relative overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-40 object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          ${event.price}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2 bg-gradient-to-r from-purple-700 to-orange-700 bg-clip-text text-transparent">
          {event.title}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-2">
          {event.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{event.average_rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({event.total_reviews})</span>
            </div>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1 text-orange-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-purple-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{event.registration_count} registered</span>
            </div>
            <span className="text-purple-600 font-medium">by {event.creator?.full_name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-orange-50/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {creator.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg bg-gradient-to-r from-orange-700 to-purple-700 bg-clip-text text-transparent">
              {creator.full_name}
            </CardTitle>
            {creator.average_rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{creator.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {creator.bio && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">{creator.bio}</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-gradient-to-r from-orange-50 to-purple-50 rounded">
            <div className="font-semibold text-orange-600">{creator.total_courses}</div>
            <div className="text-xs text-gray-600">Courses</div>
          </div>
          <div className="text-center p-2 bg-gradient-to-r from-purple-50 to-orange-50 rounded">
            <div className="font-semibold text-purple-600">{creator.total_events}</div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
        </div>
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-purple-700">
            <User className="h-4 w-4" />
            <span className="font-medium">{creator.total_students} students</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NewsletterCard = ({ newsletter }: { newsletter: Newsletter }) => (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{newsletter.title}</CardTitle>
            <p className="text-sm text-gray-600 line-clamp-1">{newsletter.subject}</p>
          </div>
          <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
            {newsletter.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span>{new Date(newsletter.created_at).toLocaleDateString()}</span>
          </div>
          {newsletter.sent_at && (
            <div className="flex justify-between">
              <span className="text-gray-600">Sent:</span>
              <span>{new Date(newsletter.sent_at).toLocaleDateString()}</span>
            </div>
          )}
          {newsletter.total_recipients && (
            <div className="flex justify-between">
              <span className="text-gray-600">Recipients:</span>
              <span>{newsletter.total_recipients}</span>
            </div>
          )}
          {newsletter.successful_sends && (
            <div className="flex justify-between">
              <span className="text-gray-600">Successful:</span>
              <span className="text-green-600">{newsletter.successful_sends}</span>
            </div>
          )}
          {newsletter.failed_sends && newsletter.failed_sends > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="text-red-600">{newsletter.failed_sends}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Newsletter Management
          </h1>
          <p className="text-gray-600">
            Create engaging newsletters with dynamic content including courses, events, and creator spotlights
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('create')}
            className={activeTab === 'create' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' : ''}
          >
            Create Newsletter
          </Button>
          <Button
            variant={activeTab === 'drafts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('drafts')}
            className={activeTab === 'drafts' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' : ''}
          >
            <Eye className="h-4 w-4 mr-2" />
            Drafts ({newsletters.filter(n => n.status === 'draft').length})
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('sent')}
            className={activeTab === 'sent' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' : ''}
          >
            <Send className="h-4 w-4 mr-2" />
            Sent ({newsletters.filter(n => n.status === 'sent').length})
          </Button>
        </div>

        {activeTab === 'create' && (
          <div className="space-y-6">
            <EnhancedNewsletterForm />
            
            {/* Dynamic Content Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Available Content to Add
              </h2>
              
              {/* Courses Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-orange-600">Popular Courses</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.slice(0, 6).map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </div>

              {/* Events Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Upcoming Events</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.slice(0, 6).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {/* Creators Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Featured Creators
                </h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creators.slice(0, 6).map((creator) => (
                      <CreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Draft Newsletters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletters
                .filter(n => n.status === 'draft')
                .map((newsletter) => (
                  <NewsletterCard key={newsletter.id} newsletter={newsletter} />
                ))}
            </div>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Sent Newsletters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletters
                .filter(n => n.status === 'sent')
                .map((newsletter) => (
                  <NewsletterCard key={newsletter.id} newsletter={newsletter} />
                ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletters;
