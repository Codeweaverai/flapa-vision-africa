
import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EventReview {
  id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface EventReviewsTabProps {
  eventId: string;
  averageRating: number;
  totalReviews: number;
}

const EventReviewsTab: React.FC<EventReviewsTabProps> = ({ 
  eventId, 
  averageRating, 
  totalReviews 
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [userReview, setUserReview] = useState<EventReview | null>(null);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkUserReview();
    }

    // Subscribe to real-time updates
    const channel = supabase
      .channel('event-reviews')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_reviews',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select(`
          id,
          user_id,
          rating,
          review,
          created_at,
          updated_at
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            profiles: profile || { full_name: 'Anonymous User', avatar_url: null }
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_reviews')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserReview(data);
        setNewRating(data.rating);
        setNewReview(data.review || '');
      }
    } catch (error) {
      // User hasn't reviewed yet, which is fine
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('event_reviews')
          .update({
            rating: newRating,
            review: newReview,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('Review updated successfully');
      } else {
        // Create new review
        const { error } = await supabase
          .from('event_reviews')
          .insert({
            event_id: eventId,
            user_id: user.id,
            rating: newRating,
            review: newReview
          });

        if (error) throw error;
        toast.success('Review submitted successfully');
      }

      await checkUserReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 cursor-pointer ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : interactive 
              ? 'text-gray-300 hover:text-yellow-300' 
              : 'text-gray-300'
        }`}
        onClick={() => interactive && onStarClick && onStarClick(i + 1)}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            Event Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <Badge variant="outline">{totalReviews} reviews</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>
              {userReview ? 'Update Your Review' : 'Leave a Review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {renderStars(newRating, true, setNewRating)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Review (Optional)</label>
              <Textarea
                placeholder="Share your thoughts about this event..."
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              onClick={submitReview}
              disabled={submitting || newRating === 0}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No reviews yet. Be the first to review this event!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.profiles?.avatar_url} />
                    <AvatarFallback>
                      {review.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{review.profiles?.full_name || 'Anonymous User'}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {review.review && (
                      <p className="text-gray-700">{review.review}</p>
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

export default EventReviewsTab;
