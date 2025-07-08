
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Star, StarHalf } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface CourseReviewsTabProps {
  courseId: string;
}

const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchReviews();
    }
  }, [courseId, user]);

  const fetchReviews = async () => {
    try {
      // Fetch reviews without join to profiles table for now
      const { data, error } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allReviews = data || [];
      
      // Fetch user profiles separately
      const userIds = allReviews.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Combine reviews with profiles
      const reviewsWithProfiles = allReviews.map(review => ({
        ...review,
        profiles: profilesData?.find(p => p.id === review.user_id)
      }));

      setReviews(reviewsWithProfiles);
      
      // Find user's existing review
      if (user) {
        const existingReview = reviewsWithProfiles.find(r => r.user_id === user.id);
        if (existingReview) {
          setUserReview(existingReview);
          setNewRating(existingReview.rating);
          setNewReview(existingReview.review_text || '');
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || newRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('course_reviews')
          .update({
            rating: newRating,
            review_text: newReview || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('Review updated successfully');
      } else {
        // Create new review
        const { error } = await supabase
          .from('course_reviews')
          .insert({
            course_id: courseId,
            user_id: user.id,
            rating: newRating,
            review_text: newReview || null
          });

        if (error) throw error;
        toast.success('Review submitted successfully');
      }
      
      setIsEditing(false);
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star 
            key={i} 
            className={`h-5 w-5 ${interactive ? 'cursor-pointer hover:scale-110' : ''} fill-yellow-400 text-yellow-400`}
            onClick={interactive ? () => setNewRating(i) : undefined}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarHalf 
            key={i} 
            className={`h-5 w-5 ${interactive ? 'cursor-pointer hover:scale-110' : ''} fill-yellow-400 text-yellow-400`}
            onClick={interactive ? () => setNewRating(i) : undefined}
          />
        );
      } else {
        stars.push(
          <Star 
            key={i} 
            className={`h-5 w-5 ${interactive ? 'cursor-pointer hover:scale-110' : ''} text-gray-300`}
            onClick={interactive ? () => setNewRating(i) : undefined}
          />
        );
      }
    }
    return stars;
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  if (!user) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Please sign in to view and write reviews</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {renderStars(averageRating)}
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-gray-600">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userReview ? (isEditing ? 'Edit Your Review' : 'Your Review') : 'Write a Review'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!userReview || isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center gap-1">
                  {renderStars(newRating, true)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                <Textarea
                  placeholder="Share your experience with this course..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={submitReview}
                  disabled={submitting || newRating === 0}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                </Button>
                {isEditing && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setNewRating(userReview?.rating || 0);
                      setNewReview(userReview?.review_text || '');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                {renderStars(userReview.rating)}
                <span className="font-medium">{userReview.rating}/5</span>
              </div>
              {userReview.review_text && (
                <p className="text-gray-700 mb-3">{userReview.review_text}</p>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Reviews</h3>
        
        {reviews.filter(r => r.user_id !== user.id).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No other reviews yet.</p>
            </CardContent>
          </Card>
        ) : (
          reviews
            .filter(r => r.user_id !== user.id)
            .map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={review.profiles?.avatar_url} />
                      <AvatarFallback>
                        {review.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {review.profiles?.full_name || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-700 whitespace-pre-wrap">{review.review_text}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};

export default CourseReviewsTab;
