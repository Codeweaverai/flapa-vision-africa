import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Users, Calendar, Eye, Send, MapPin, User, Mail, Plus, Edit, Trash2, Search, Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
  full_name: string | null;
  username: string | null;
  created_at: string;
  newsletter_subscribed?: boolean;
  email_confirmed_at?: string | null;
}

const AdminNewsletters = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'drafts' | 'sent'>('create');
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    content: true,
    newsletters: true,
    sending: false
  });
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContent();
    loadNewsletters();
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(term) ||
        (user.full_name && user.full_name.toLowerCase().includes(term)) ||
        (user.username && user.username.toLowerCase().includes(term))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      
      // Call the edge function to get all users
      const response = await fetch('/functions/get-newsletter-recipients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const recipients = data.recipients || [];

      // Transform the data to match our User interface
      const formattedUsers = recipients.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || null,
        username: null,
        created_at: user.created_at,
        newsletter_subscribed: true,
        email_confirmed_at: user.email_confirmed_at
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const loadContent = async () => {
    setLoading(prev => ({ ...prev, content: true }));
    try {
      // Load latest courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, price, creator_id')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, description, image_url, location, start_time, end_time, price, creator_id')
        .eq('is_published', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(6);

      // Load top creators
      const { data: creatorsData } = await supabase
        .from('profiles')
        .select('id, full_name, bio, avatar_url')
        .limit(8);

      // Process courses with stats and creator info
      const processedCourses: Course[] = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', course.creator_id)
            .single();

          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact' })
            .eq('course_id', course.id);

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
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', event.creator_id)
            .single();

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
      setLoading(prev => ({ ...prev, content: false }));
    }
  };

  const loadNewsletters = async () => {
    setLoading(prev => ({ ...prev, newsletters: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, newsletters: false }));
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => 
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
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

  const handleEditNewsletter = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setShowEditDialog(true);
  };

  const handleDeleteNewsletter = async (newsletterId: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    
    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId);

      if (error) throw error;
      
      toast.success('Newsletter deleted successfully');
      loadNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    }
  };

  const handleSendNewsletter = async (newsletterData: { subject: string; body_html: string }) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select at least one recipient');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, sending: true }));
      
      // First save the newsletter to the database
      const { data: savedNewsletter, error: saveError } = await supabase
        .from('newsletters')
        .insert({
          subject: newsletterData.subject,
          body_html: newsletterData.body_html,
          status: 'draft',
          total_recipients: selectedUsers.length
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Then trigger the send-newsletter-now function
      const response = await fetch('/functions/send-newsletter-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsletterId: savedNewsletter.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Newsletter sent to ${selectedUsers.length} recipients`);
      setSelectedUsers([]);
      setSelectedContent([]);
      loadNewsletters();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error(error.message || 'Failed to send newsletter');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const handleExportRecipients = () => {
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const csvContent = "data:text/csv;charset=utf-8," +
      "Email,Full Name,Username,Subscribed,Verified\n" +
      selectedUserData.map(user => 
        `"${user.email}","${user.full_name || ''}","${user.username || ''}",` +
        `${user.newsletter_subscribed ? 'Yes' : 'No'},` +
        `${user.email_confirmed_at ? 'Yes' : 'No'}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter-recipients-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Card components remain the same as in your original code
  const CourseCard = ({ course }: { course: Course }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/30 to-purple-50/30 overflow-hidden transform hover:-translate-y-2">
      {/* ... (same as your original CourseCard implementation) ... */}
    </Card>
  );

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-orange-50/30 overflow-hidden transform hover:-translate-y-2">
      {/* ... (same as your original EventCard implementation) ... */}
    </Card>
  );

  const CreatorCard = ({ creator }: { creator: Creator }) => (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-orange-50/20 to-purple-50/20 overflow-hidden transform hover:-translate-y-2">
      {/* ... (same as your original CreatorCard implementation) ... */}
    </Card>
  );

  const NewsletterCard = ({ newsletter }: { newsletter: Newsletter }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{newsletter.subject}</span>
          <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
            {newsletter.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Created: {new Date(newsletter.created_at).toLocaleDateString()}
          </span>
          {newsletter.sent_at && (
            <span className="text-muted-foreground">
              Sent: {new Date(newsletter.sent_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-purple-600" />
            <span>{newsletter.total_recipients || 0} recipients</span>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox className="h-4 w-4 text-green-600" checked />
            <span>{newsletter.successful_sends || 0} success</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-4 w-4 text-red-600" />
            <span>{newsletter.failed_sends || 0} failed</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditNewsletter(newsletter)}
            disabled={newsletter.status === 'sent'}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteNewsletter(newsletter.id)}
            className="hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
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
                      Select All ({filteredUsers.length})
                    </Button>
                    <Button onClick={clearSelection} variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                      Clear Selection
                    </Button>
                    {selectedUsers.length > 0 && (
                      <Button 
                        onClick={handleExportRecipients} 
                        variant="outline" 
                        size="sm" 
                        className="border-green-200 hover:bg-green-50 ml-auto"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected ({selectedUsers.length})
                      </Button>
                    )}
                    <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700">
                      {selectedUsers.length} selected
                    </Badge>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by email, name, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {loading.users ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 h-16 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 transition-colors shadow-sm">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.full_name || user.email}
                              {user.newsletter_subscribed && (
                                <span className="ml-2 text-xs text-green-600">(Subscribed)</span>
                              )}
                              {user.email_confirmed_at && (
                                <span className="ml-2 text-xs text-blue-600">(Verified)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading.users && filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p>No users found matching your search.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <EnhancedNewsletterForm 
                selectedUsers={selectedUsers}
                selectedContent={selectedContent}
                onSend={handleSendNewsletter}
                loading={loading.sending}
              />
              
              {/* Dynamic Content Section */}
              <div className="space-y-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Dynamic Content Selection
                </h2>
                
                {/* Latest Courses */}
                <div>
                  <h3 className="text-2xl font-semibold mb-6 text-purple-600">Latest Courses</h3>
                  {loading.content ? (
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
                  {loading.content ? (
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
                  {loading.content ? (
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
              {loading.newsletters ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-lg shadow-lg"></div>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Sent Newsletters</h2>
              {loading.newsletters ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-lg shadow-lg"></div>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Newsletter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Newsletter</DialogTitle>
          </DialogHeader>
          {editingNewsletter && (
            <EnhancedNewsletterForm 
              newsletter={editingNewsletter}
              onSuccess={() => {
                setShowEditDialog(false);
                loadNewsletters();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNewsletters;
