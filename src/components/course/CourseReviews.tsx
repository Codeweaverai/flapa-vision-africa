import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
  } | null;
}

interface CourseReviewsProps {
  courseId: string;
}

const CourseReviews: React.FC<CourseReviewsProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`course_reviews_${courseId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_reviews',
        filter: `course_id=eq.${courseId}`
      }, () => {
        loadReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            username
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = (data || []) as unknown as Review[];
      setReviews(reviewsData);
      setTotalReviews(reviewsData.length);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, review) => acc + review.rating, 0);
        setAverageRating(sum / reviewsData.length);
      } else {
        setAverageRating(0);
      }

      // Find user's review if logged in
      if (user) {
        const currentUserReview = reviewsData.find(review => review.user_id === user.id);
        setUserReview(currentUserReview || null);
        if (currentUserReview) {
          setRating(currentUserReview.rating);
          setReviewText(currentUserReview.review_text || '');
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        course_id: courseId,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null
      };

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('course_reviews')
          .update(reviewData)
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        const { error } = await supabase
          .from('course_reviews')
          .insert(reviewData);

        if (error) throw error;
        toast.success('Review submitted successfully!');
      }

      setShowReviewForm(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from('course_reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      setUserReview(null);
      setRating(0);
      setReviewText('');
      setShowReviewForm(false);
      toast.success('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm', interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={interactive ? () => setRating(i) : undefined}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Student Reviews</span>
          <div className="flex items-center space-x-2 text-sm">
            {renderStars(Math.round(averageRating))}
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Review Form */}
        {user && (
          <div className="border-b pb-6">
            {!showReviewForm && !userReview ? (
              <Button 
                onClick={() => setShowReviewForm(true)}
                variant="outline"
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Write a Review
              </Button>
            ) : (showReviewForm || userReview) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  {renderStars(rating, 'lg', true)}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this course..."
                    rows={4}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleSubmitReview} disabled={submitting}>
                    {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewForm(false);
                      if (!userReview) {
                        setRating(0);
                        setReviewText('');
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  {userReview && (
                    <Button variant="destructive" onClick={handleDeleteReview}>
                      Delete Review
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={review.profiles?.avatar_url} />
                    <AvatarFallback>
                      {review.profiles?.full_name?.[0] || review.profiles?.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {review.profiles?.full_name || review.profiles?.username || 'Anonymous'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseReviews;
