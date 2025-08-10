
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Users, Calendar, Eye, Send, MapPin, User, Mail } from 'lucide-react';
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
  start_time: string;
  end_time: string;
  price: number;
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
  subject: string;
  body_html: string;
  status: string;
  created_at: string;
  sent_at?: string;
  total_recipients?: number;
  successful_sends?: number;
  failed_sends?: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

const AdminNewsletters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'drafts' | 'sent'>('create');
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContent();
    loadNewsletters();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: authUsers, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const usersWithProfiles = await Promise.all(
        (authUsers?.users || []).map(async (user) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          return {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.user_metadata?.full_name,
            created_at: user.created_at
          };
        })
      );

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load latest courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          price,
          creator_id
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          image_url,
          location,
          start_time,
          end_time,
          price,
          creator_id
        `)
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(6);

      // Load top creators
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          bio,
          avatar_url
        `)
        .limit(8);

      // Process courses with stats and creator info
      const processedCourses: Course[] = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get creator profile
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', course.creator_id)
            .single();

          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id);

          // Get reviews
          const { data: reviews } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id);

          const averageRating = reviews && reviews.length > 0 
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
            : 0;

          return {
            ...course,
            creator: {
              full_name: creatorProfile?.full_name || 'Unknown Creator'
            },
            enrollment_count: enrollmentCount || 0,
            average_rating: averageRating,
            total_reviews: reviews?.length || 0
          };
        })
      );

      // Process events with stats and creator info
      const processedEvents: Event[] = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get creator profile
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', event.creator_id)
            .single();

          // Get registration count
          const { count: registrationCount } = await supabase
            .from('event_bookings')
            .select('*', { count: 'exact' })
            .eq('event_id', event.id);

          return {
            ...event,
            creator: {
              full_name: creatorProfile?.full_name || 'Unknown Creator'
            },
            registration_count: registrationCount || 0,
            average_rating: 4.5,
            total_reviews: 12
          };
        })
      );

      // Process creators with stats
      const processedCreators: Creator[] = await Promise.all(
        (creatorsData || []).map(async (creator) => {
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact' })
            .eq('creator_id', creator.id);

          const { count: eventCount } = await supabase
            .from('events')
            .select('*', { count: 'exact' })
            .eq('creator_id', creator.id);

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
            average_rating: 4.7
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

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30 overflow-hidden">
      <div className="relative overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold">No Image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-purple-600">
          ${course.price}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-gray-800">
          {course.title}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          {course.average_rating && course.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{course.average_rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({course.total_reviews})</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{course.enrollment_count} students</span>
          </div>
          <span className="text-gray-700 font-medium">by {course.creator?.full_name}</span>
        </div>
        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" size="sm">
          Add to Newsletter
        </Button>
      </CardContent>
    </Card>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30 overflow-hidden">
      <div className="relative overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">No Image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
          ${event.price}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-gray-800">
          {event.title}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm mb-3">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_time).toLocaleDateString()}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.registration_count} registered</span>
          </div>
        </div>
        <div className="text-sm text-gray-700 font-medium mb-3">
          by {event.creator?.full_name}
        </div>
        <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
          Add to Newsletter
        </Button>
      </CardContent>
    </Card>
  );

  const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {creator.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-800">
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
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{creator.bio}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="font-semibold text-purple-600">{creator.total_courses}</div>
            <div className="text-xs text-gray-600">Courses</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <div className="font-semibold text-blue-600">{creator.total_events}</div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
        </div>
        <div className="flex items-center justify-center py-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-gray-700">
            <User className="h-4 w-4" />
            <span className="font-medium">{creator.total_students} students</span>
          </div>
        </div>
        <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
          Feature Creator
        </Button>
      </CardContent>
    </Card>
  );

  const NewsletterCard = ({ newsletter }: { newsletter: Newsletter }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{newsletter.subject}</CardTitle>
            <div className="text-sm text-gray-600 line-clamp-2 mt-2" 
                 dangerouslySetInnerHTML={{ __html: newsletter.body_html.substring(0, 100) + '...' }} />
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
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {newsletter.status === 'draft' && (
            <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Newsletter Management
          </h1>
          <p className="text-gray-600">
            Create engaging newsletters with dynamic content and send to selected users
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'create' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('create')}
            className={activeTab === 'create' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
          >
            Create Newsletter
          </Button>
          <Button
            variant={activeTab === 'drafts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('drafts')}
            className={activeTab === 'drafts' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
          >
            <Eye className="h-4 w-4 mr-2" />
            Drafts ({newsletters.filter(n => n.status === 'draft').length})
          </Button>
          <Button
            variant={activeTab === 'sent' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('sent')}
            className={activeTab === 'sent' ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
          >
            <Send className="h-4 w-4 mr-2" />
            Sent ({newsletters.filter(n => n.status === 'sent').length})
          </Button>
        </div>

        {activeTab === 'create' && (
          <div className="space-y-8">
            {/* User Selection */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  Select Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button onClick={selectAllUsers} variant="outline" size="sm">
                    Select All ({users.length})
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear Selection
                  </Button>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedUsers.length} selected
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <EnhancedNewsletterForm />
            
            {/* Dynamic Content Section */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Dynamic Content Selection
              </h2>
              
              {/* Latest Courses */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-purple-600">Latest Courses</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Upcoming Events</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {/* High Performing Creators */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">High Performing Creators</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {creators.map((creator) => (
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
            <h2 className="text-2xl font-bold text-gray-800">Draft Newsletters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletters
                .filter(n => n.status === 'draft')
                .map((newsletter) => (
                  <NewsletterCard key={newsletter.id} newsletter={newsletter} />
                ))}
            </div>
            {newsletters.filter(n => n.status === 'draft').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No draft newsletters found
              </div>
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Sent Newsletters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletters
                .filter(n => n.status === 'sent')
                .map((newsletter) => (
                  <NewsletterCard key={newsletter.id} newsletter={newsletter} />
                ))}
            </div>
            {newsletters.filter(n => n.status === 'sent').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No sent newsletters found
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletters;
