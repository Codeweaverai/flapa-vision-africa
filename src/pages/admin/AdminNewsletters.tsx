
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Users, Calendar, Eye, Send, MapPin, User, Mail, Plus } from 'lucide-react';
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
  const [selectedContent, setSelectedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContent();
    loadNewsletters();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Use the get_user_emails function to fetch user emails
      const { data, error } = await supabase.rpc('get_user_emails', {
        user_ids: []
      });

      if (error) {
        // Fallback: try to get users from profiles table
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name');

        if (profilesData) {
          const usersWithEmails = profilesData.map(profile => ({
            id: profile.id,
            email: `user-${profile.id.slice(0, 8)}@email.com`, // Placeholder email
            full_name: profile.full_name,
            created_at: new Date().toISOString()
          }));
          setUsers(usersWithEmails);
        }
        return;
      }

      if (data) {
        const formattedUsers = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name || `User ${user.email}`,
          created_at: user.created_at
        }));
        setUsers(formattedUsers);
      }
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

  const addToNewsletter = (item: Course | Event | Creator, type: 'course' | 'event' | 'creator') => {
    const newItem = { ...item, type };
    setSelectedContent(prev => {
      if (prev.find(content => content.id === item.id && content.type === type)) {
        toast.info('Item already added to newsletter');
        return prev;
      }
      toast.success('Item added to newsletter');
      return [...prev, newItem];
    });
  };

  const removeFromNewsletter = (itemId: string, type: string) => {
    setSelectedContent(prev => prev.filter(item => !(item.id === itemId && item.type === type)));
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/30 to-purple-50/30 overflow-hidden transform hover:-translate-y-2">
      <div className="relative overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold">No Image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-purple-600 shadow-lg">
          ${course.price}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-gray-800 group-hover:text-purple-700 transition-colors">
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
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{course.enrollment_count} students</span>
          </div>
          <span className="text-gray-700 font-medium">by {course.creator?.full_name}</span>
        </div>
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 shadow-lg" 
          size="sm"
          onClick={() => addToNewsletter(course, 'course')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Newsletter
        </Button>
      </CardContent>
    </Card>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-orange-50/30 overflow-hidden transform hover:-translate-y-2">
      <div className="relative overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-100 via-orange-100 to-pink-100 flex items-center justify-center">
            <span className="text-orange-600 font-semibold">No Image</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-orange-600 shadow-lg">
          ${event.price}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-gray-800 group-hover:text-orange-700 transition-colors">
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
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 shadow-lg" 
          size="sm"
          onClick={() => addToNewsletter(event, 'event')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Newsletter
        </Button>
      </CardContent>
    </Card>
  );

  const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-purple-50/20 overflow-hidden transform hover:-translate-y-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 via-orange-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              {creator.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-800 group-hover:text-purple-700 transition-colors">
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
          <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg">
            <div className="font-bold text-purple-600">{creator.total_courses}</div>
            <div className="text-xs text-gray-600">Courses</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
            <div className="font-bold text-orange-600">{creator.total_events}</div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
        </div>
        <div className="flex items-center justify-center py-3 border-t border-gray-100 mb-3">
          <div className="flex items-center gap-1 text-gray-700">
            <User className="h-4 w-4" />
            <span className="font-medium">{creator.total_students} students</span>
          </div>
        </div>
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 shadow-lg" 
          size="sm"
          onClick={() => addToNewsletter(creator, 'creator')}
        >
          <Plus className="h-4 w-4 mr-2" />
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
            <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600">
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
              Newsletter Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create engaging newsletters with dynamic content and send to selected users
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gradient-to-r from-orange-100 to-purple-100 rounded-lg p-1 shadow-md">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className={activeTab === 'create' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : ''}
            >
              Create Newsletter
            </Button>
            <Button
              variant={activeTab === 'drafts' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('drafts')}
              className={activeTab === 'drafts' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : ''}
            >
              <Eye className="h-4 w-4 mr-2" />
              Drafts ({newsletters.filter(n => n.status === 'draft').length})
            </Button>
            <Button
              variant={activeTab === 'sent' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('sent')}
              className={activeTab === 'sent' ? 'bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:from-purple-700 hover:to-orange-600' : ''}
            >
              <Send className="h-4 w-4 mr-2" />
              Sent ({newsletters.filter(n => n.status === 'sent').length})
            </Button>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-8">
              {/* User Selection */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Mail className="h-5 w-5" />
                    Select Recipients ({users.length} users available)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button onClick={selectAllUsers} variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
                      Select All ({users.length})
                    </Button>
                    <Button onClick={clearSelection} variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                      Clear Selection
                    </Button>
                    <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700">
                      {selectedUsers.length} selected
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 transition-colors shadow-sm">
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
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No users found. Users will appear here once they register.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <EnhancedNewsletterForm />
              
              {/* Dynamic Content Section */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Dynamic Content Selection
                </h2>
                
                {/* Latest Courses */}
                <div>
                  <h3 className="text-2xl font-semibold mb-6 text-purple-600">Latest Courses</h3>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 h-80 rounded-lg shadow-lg"></div>
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
                  <h3 className="text-2xl font-semibold mb-6 text-orange-600">Upcoming Events</h3>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 h-80 rounded-lg shadow-lg"></div>
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
                  <h3 className="text-2xl font-semibold mb-6 text-purple-600">High Performing Creators</h3>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 h-80 rounded-lg shadow-lg"></div>
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

                {/* Selected Content for Newsletter */}
                {selectedContent.length > 0 && (
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30">
                    <CardHeader>
                      <CardTitle className="text-purple-700">Selected Content for Newsletter ({selectedContent.length} items)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {selectedContent.map((item) => (
                          <div key={`${item.id}-${item.type}`} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-white">
                                {item.type}
                              </Badge>
                              <div>
                                <p className="font-medium">{item.title || item.full_name}</p>
                                <p className="text-sm text-gray-600 line-clamp-1">
                                  {item.description || item.bio || 'No description'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromNewsletter(item.id, item.type)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'drafts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Draft Newsletters</h2>
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
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Sent Newsletters</h2>
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
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletters;
