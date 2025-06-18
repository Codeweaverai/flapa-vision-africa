
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Search, Eye, Trash2, Flag, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  review?: string;
  created_at: string;
  user_id: string;
  course_id?: string;
  event_id?: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
  course?: {
    title: string;
  };
  event?: {
    title: string;
  };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'events'>('all');
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, filterType]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch course reviews
      const { data: courseReviews, error: courseError } = await supabase
        .from('course_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          user_id,
          course_id,
          profiles:user_id (
            full_name,
            avatar_url
          ),
          courses:course_id (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (courseError) throw courseError;

      // Fetch event reviews
      const { data: eventReviews, error: eventError } = await supabase
        .from('event_reviews')
        .select(`
          id,
          rating,
          review,
          created_at,
          user_id,
          event_id,
          profiles:user_id (
            full_name,
            avatar_url
          ),
          events:event_id (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (eventError) throw eventError;

      // Combine and format reviews
      const allReviews: Review[] = [
        ...(courseReviews || []).map(review => ({
          ...review,
          user: Array.isArray(review.profiles) ? review.profiles[0] : review.profiles,
          course: Array.isArray(review.courses) ? review.courses[0] : review.courses,
          review_text: review.review_text || '',
        })),
        ...(eventReviews || []).map(review => ({
          ...review,
          user: Array.isArray(review.profiles) ? review.profiles[0] : review.profiles,
          event: Array.isArray(review.events) ? review.events[0] : review.events,
          review_text: review.review || '',
        }))
      ];

      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    // Filter by type
    if (filterType === 'courses') {
      filtered = filtered.filter(review => review.course_id);
    } else if (filterType === 'events') {
      filtered = filtered.filter(review => review.event_id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => {
        const courseName = review.course?.title?.toLowerCase() || '';
        const eventName = review.event?.title?.toLowerCase() || '';
        const userName = review.user?.full_name?.toLowerCase() || '';
        const reviewText = review.review_text?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        return courseName.includes(search) || 
               eventName.includes(search) || 
               userName.includes(search) || 
               reviewText.includes(search);
      });
    }

    setFilteredReviews(filtered);
  };

  const handleDeleteReview = async (reviewId: string, type: 'course' | 'event') => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const table = type === 'course' ? 'course_reviews' : 'event_reviews';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Reviews">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reviews Management">
      <div className="space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              All Reviews ({filteredReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by course name, event name, reviewer, or review content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(value: 'all' | 'courses' | 'events') => setFilterType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="courses">Course Reviews</SelectItem>
                  <SelectItem value="events">Event Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reviews found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <Badge variant={review.course_id ? "default" : "secondary"}>
                            {review.course_id ? (
                              <><BookOpen className="h-3 w-3 mr-1" />Course</>
                            ) : (
                              <><Calendar className="h-3 w-3 mr-1" />Event</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {review.course?.title || review.event?.title || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {review.user?.avatar_url ? (
                              <img
                                src={review.user.avatar_url}
                                alt={review.user.full_name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {review.user?.full_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                            )}
                            <span className="font-medium">
                              {review.user?.full_name || 'Anonymous'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderStars(review.rating)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {review.review_text ? (
                              <p className="text-sm text-gray-600 truncate" title={review.review_text}>
                                {review.review_text}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">No review text</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // View full review in modal (could be implemented later)
                                alert(`Full review: ${review.review_text || 'No review text'}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id, review.course_id ? 'course' : 'event')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Course Reviews</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => r.course_id).length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Reviews</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => r.event_id).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
