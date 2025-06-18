
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Star, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  BookOpen,
  CalendarDays,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CourseReview {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
  course_id: string;
  user_id: string;
  course?: {
    title: string;
    category: string;
  } | null;
  user?: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface EventReview {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  event_id: string;
  user_id: string;
  event?: {
    title: string;
    event_type: string;
  } | null;
  user?: {
    full_name: string;
    avatar_url: string;
  } | null;
}

const AdminReviews = () => {
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([]);
  const [eventReviews, setEventReviews] = useState<EventReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch course reviews
      const { data: courseReviewsData, error: courseError } = await supabase
        .from('course_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseError) {
        console.error('Course reviews error:', courseError);
        setCourseReviews([]);
      } else {
        // Fetch related course and user data for each review
        const enrichedCourseReviews = await Promise.all(
          (courseReviewsData || []).map(async (review) => {
            // Fetch course data
            const { data: courseData } = await supabase
              .from('courses')
              .select('title, category')
              .eq('id', review.course_id)
              .single();

            // Fetch user profile data
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', review.user_id)
              .single();

            return {
              ...review,
              course: courseData,
              user: userData
            };
          })
        );
        setCourseReviews(enrichedCourseReviews);
      }

      // Fetch event reviews
      const { data: eventReviewsData, error: eventError } = await supabase
        .from('event_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventError) {
        console.error('Event reviews error:', eventError);
        setEventReviews([]);
      } else {
        // Fetch related event and user data for each review
        const enrichedEventReviews = await Promise.all(
          (eventReviewsData || []).map(async (review) => {
            // Fetch event data
            const { data: eventData } = await supabase
              .from('events')
              .select('title, event_type')
              .eq('id', review.event_id)
              .single();

            // Fetch user profile data
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', review.user_id)
              .single();

            return {
              ...review,
              event: eventData,
              user: userData
            };
          })
        );
        setEventReviews(enrichedEventReviews);
      }

    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
      setCourseReviews([]);
      setEventReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourseReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('course_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setCourseReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Course review deleted successfully');
    } catch (error) {
      console.error('Error deleting course review:', error);
      toast.error('Failed to delete course review');
    }
  };

  const deleteEventReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('event_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setEventReviews(prev => prev.filter(review => review.id !== reviewId));
      toast.success('Event review deleted successfully');
    } catch (error) {
      console.error('Error deleting event review:', error);
      toast.error('Failed to delete event review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating}/5
        </span>
      </div>
    );
  };

  const filteredCourseReviews = courseReviews.filter(review =>
    review.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEventReviews = eventReviews.filter(review =>
    review.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReviews = courseReviews.length + eventReviews.length;
  const averageRating = totalReviews > 0 
    ? (courseReviews.reduce((sum, r) => sum + r.rating, 0) + 
       eventReviews.reduce((sum, r) => sum + r.rating, 0)) / totalReviews 
    : 0;

  if (loading) {
    return (
      <AdminLayout title="Reviews Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reviews Management">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-blue-800">{totalReviews}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Course Reviews</p>
                  <p className="text-2xl font-bold text-green-800">{courseReviews.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Event Reviews</p>
                  <p className="text-2xl font-bold text-purple-800">{eventReviews.length}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-800">{averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by course/event name or reviewer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="courses">Course Reviews</TabsTrigger>
            <TabsTrigger value="events">Event Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {/* Course Reviews */}
              {filteredCourseReviews.map((review) => (
                <Card key={`course-${review.id}`} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {review.user?.avatar_url ? (
                            <img 
                              src={review.user.avatar_url} 
                              alt={review.user.full_name || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user?.full_name || 'Anonymous User'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <BookOpen className="h-4 w-4" />
                            <span>{review.course?.title || 'Unknown Course'}</span>
                            {review.course?.category && (
                              <Badge variant="secondary">{review.course.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Course Review
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this course review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteCourseReview(review.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.review_text && (
                      <p className="text-gray-600 mb-3">{review.review_text}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(review.created_at), 'PPP')}</span>
                      </div>
                      {review.updated_at !== review.created_at && (
                        <span className="text-xs">Updated: {format(parseISO(review.updated_at), 'PPP')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Event Reviews */}
              {filteredEventReviews.map((review) => (
                <Card key={`event-${review.id}`} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {review.user?.avatar_url ? (
                            <img 
                              src={review.user.avatar_url} 
                              alt={review.user.full_name || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user?.full_name || 'Anonymous User'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="h-4 w-4" />
                            <span>{review.event?.title || 'Unknown Event'}</span>
                            {review.event?.event_type && (
                              <Badge variant="secondary">{review.event.event_type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Event Review
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this event review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteEventReview(review.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.review && (
                      <p className="text-gray-600 mb-3">{review.review}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(review.created_at), 'PPP')}</span>
                      </div>
                      {review.updated_at !== review.created_at && (
                        <span className="text-xs">Updated: {format(parseISO(review.updated_at), 'PPP')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <div className="grid gap-4">
              {filteredCourseReviews.map((review) => (
                <Card key={review.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {review.user?.avatar_url ? (
                            <img 
                              src={review.user.avatar_url} 
                              alt={review.user.full_name || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user?.full_name || 'Anonymous User'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <BookOpen className="h-4 w-4" />
                            <span>{review.course?.title || 'Unknown Course'}</span>
                            {review.course?.category && (
                              <Badge variant="secondary">{review.course.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this course review? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteCourseReview(review.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.review_text && (
                      <p className="text-gray-600 mb-3">{review.review_text}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(review.created_at), 'PPP')}</span>
                      </div>
                      {review.updated_at !== review.created_at && (
                        <span className="text-xs">Updated: {format(parseISO(review.updated_at), 'PPP')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="grid gap-4">
              {filteredEventReviews.map((review) => (
                <Card key={review.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {review.user?.avatar_url ? (
                            <img 
                              src={review.user.avatar_url} 
                              alt={review.user.full_name || 'User'} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{review.user?.full_name || 'Anonymous User'}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="h-4 w-4" />
                            <span>{review.event?.title || 'Unknown Event'}</span>
                            {review.event?.event_type && (
                              <Badge variant="secondary">{review.event.event_type}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event Review</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this event review? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteEventReview(review.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.review && (
                      <p className="text-gray-600 mb-3">{review.review}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(parseISO(review.created_at), 'PPP')}</span>
                      </div>
                      {review.updated_at !== review.created_at && (
                        <span className="text-xs">Updated: {format(parseISO(review.updated_at), 'PPP')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
