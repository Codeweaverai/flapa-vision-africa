import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Users, Award, Clock, Play, MessageCircle, Calendar, MapPin, TrendingUp, Eye, Heart, Target, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { getFollowStats } from '@/services/communityFollowerService';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { Progress } from '@/components/ui/progress';

// Currency conversion rates (static - same as other pages)
const exchangeRates: { [key: string]: number } = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  ZMW: 0.044,
  NGN: 0.0012,
  GHS: 0.082,
  KES: 0.0078,
  UGX: 0.00027,
  TZS: 0.00043,
  RWF: 0.0010,
  XOF: 0.0016,
  XAF: 0.0016,
  CDF: 0.00049,
  MZN: 0.015,
  MWK: 0.0009,
  LSL: 0.054,
  SLL: 0.000048
};

// Optimized currency conversion function using useMemo
const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  const usdAmount = amount * fromRate;
  const targetAmount = usdAmount / toRate;

  return Number(targetAmount.toFixed(2));
};

interface CreatorProfile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  username: string;
  is_creator: boolean;
  role: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
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
  average_rating?: number;
  total_reviews?: number;
  total_students?: number;
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
  total_attendees?: number;
}

interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  currency: string;
  category: string;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  use_of_funds: string | null;
  created_at: string;
}

interface CampaignContribution {
  id: string;
  amount: number;
  currency: string;
  net_amount: number;
  transaction_fee: number;
  status: string;
}

interface CampaignStats {
  total_raised: number;
  contributions_count: number;
}

const CreatorPublicProfile: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuth();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [fundraisingCampaigns, setFundraisingCampaigns] = useState<(FundraisingCampaign & CampaignStats)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowers, setShowFollowers] = useState<{ userId: string; tab: 'followers' | 'following' } | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setError('Creator ID not found in URL');
      setLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(creatorId)) {
      setError('Invalid creator ID format');
      setLoading(false);
      return;
    }

    fetchCreatorData(creatorId);
  }, [creatorId]);

  const calculateCampaignStats = (contributions: CampaignContribution[], campaign: FundraisingCampaign): CampaignStats => {
    const completedContributions = contributions.filter(c => c.status === 'completed');
    const campaignBaseCurrency = campaign.currency || 'USD';

    let totalRaised = 0;

    for (const contribution of completedContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount || 0);

      let amountInBaseCurrency = originalAmount;

      if (contributionCurrency !== campaignBaseCurrency) {
        try {
          amountInBaseCurrency = convertCurrency(originalAmount, contributionCurrency, campaignBaseCurrency);
        } catch (error) {
          console.warn(`Currency conversion failed for contribution:`, error);
          amountInBaseCurrency = originalAmount;
        }
      }

      totalRaised += amountInBaseCurrency;
    }

    return {
      total_raised: totalRaised,
      contributions_count: completedContributions.length
    };
  };

  const fetchCreatorData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent data fetching using Promise.all for faster loading
      const [profileResult, followStatsResult, coursesResult, eventsResult, campaignsResult] = await Promise.allSettled([
        // Fetch creator profile
        supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url, username, is_creator, role')
          .eq('id', id)
          .maybeSingle(),

        // Get follow stats
        getFollowStats(id),

        // Fetch courses with reviews and enrollments
        supabase
          .from('courses')
          .select(`
            *,
            course_reviews (rating),
            course_enrollments (id)
          `)
          .eq('creator_id', id)
          .eq('is_published', true),

        // Fetch events with bookings
        supabase
          .from('events')
          .select(`
            *,
            event_bookings (id)
          `)
          .eq('creator_id', id),

        // Fetch fundraising campaigns
        supabase
          .from('fundraising_campaigns')
          .select(`
            *,
            campaign_contributions (*)
          `)
          .eq('creator_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
      ]);

      // Handle profile result
      if (profileResult.status === 'rejected' || profileResult.value.error) {
        throw profileResult.status === 'rejected' ? profileResult.reason : profileResult.value.error;
      }

      const profile = profileResult.value.data;
      if (!profile) {
        setError('Creator profile not found');
        return;
      }

      // Handle follow stats
      let followStats = { followers_count: 0, following_count: 0 };
      let isFollowing = false;

      if (followStatsResult.status === 'fulfilled') {
        followStats = followStatsResult.value;

        if (user) {
          const { data: followData } = await supabase
            .from('community_followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', id)
            .single();
          isFollowing = !!followData;
        }
      } else {
        console.error('Error fetching follow stats:', followStatsResult.reason);
      }

      setCreator({
        ...profile,
        followers_count: followStats.followers_count,
        following_count: followStats.following_count,
        is_following: isFollowing
      });

      // Handle courses
      if (coursesResult.status === 'fulfilled' && coursesResult.value.data) {
        const coursesData = coursesResult.value.data;
        const coursesWithStats = coursesData.map(course => {
          const reviews = course.course_reviews || [];
          const enrollments = course.course_enrollments || [];

          const averageRating = reviews.length > 0
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
            : 0;

          return {
            ...course,
            average_rating: Math.round(averageRating * 10) / 10,
            total_reviews: reviews.length,
            total_students: enrollments.length,
            course_reviews: undefined,
            course_enrollments: undefined
          };
        });
        setCourses(coursesWithStats);
      }

      // Handle events
      if (eventsResult.status === 'fulfilled' && eventsResult.value.data) {
        const eventsData = eventsResult.value.data;
        const eventsWithStats = eventsData.map(event => ({
          ...event,
          total_attendees: (event.event_bookings || []).length,
          event_bookings: undefined
        }));
        setEvents(eventsWithStats);
      }

      // Handle fundraising campaigns
      if (campaignsResult.status === 'fulfilled' && campaignsResult.value.data) {
        const campaigns = campaignsResult.value.data;
        const campaignsWithStats = campaigns.map(campaign => {
          const contributions = campaign.campaign_contributions as CampaignContribution[] || [];
          const stats = calculateCampaignStats(contributions, campaign);

          return {
            ...campaign,
            ...stats,
            campaign_contributions: undefined
          };
        });
        setFundraisingCampaigns(campaignsWithStats);
      }

    } catch (error) {
      console.error('Error loading creator data:', error);
      setError('Failed to load creator profile');
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('Please log in to send a message');
      return;
    }

    if (!creatorId || !creator) {
      toast.error('Creator information not available');
      return;
    }

    // Validate user IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id) || !uuidRegex.test(creatorId)) {
      toast.error('Invalid user ID format');
      return;
    }

    try {
      // Send direct message using inbox_messages table
      const { data: newMessage, error: messageError } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: creatorId,
          subject: `Message from ${user.user_metadata?.full_name || user.email}`,
          content: `Hi ${creator.full_name}, I'd like to connect with you!`,
          message_type: 'direct',
          is_read: false
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw new Error(`Failed to send message: ${messageError.message}`);
      }

      if (!newMessage) {
        throw new Error('Failed to send message: No data returned');
      }

      toast.success('Message sent successfully!');
      
      // Redirect to inbox
      window.location.href = `/inbox`;

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (creator && creator.id === userId) {
      setCreator(prev => prev ? {
        ...prev,
        is_following: isFollowing,
        followers_count: Math.max(0, (prev.followers_count || 0) + (isFollowing ? 1 : -1))
      } : null);
    }
  };

  const handleFollowersClick = () => {
    if (creatorId) {
      setShowFollowers({ userId: creatorId, tab: 'followers' });
    }
  };

  const handleFollowingClick = () => {
    if (creatorId) {
      setShowFollowers({ userId: creatorId, tab: 'following' });
    }
  };

  // Memoized formatting functions
  const formatDuration = React.useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  const formatEventDate = React.useCallback((dateString: string) => {
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
  }, []);

  const formatDate = React.useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const calculateProgress = React.useCallback((current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-32 h-32 bg-gradient-to-r from-orange-200 to-purple-200 rounded-full"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-8 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-orange-200 to-purple-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl shadow-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Creator Profile Error</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Creator Not Found</h2>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Enhanced Creator Header with Orange-Purple Gradient Background */}
          <Card className="mb-8 bg-gradient-to-r from-orange-500 to-purple-600 shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-6 relative text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl">
                    <AvatarImage
                      src={creator.avatar_url}
                      alt={creator.full_name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = `https://placehold.co/96x96/ff7b00/ffffff?text=${encodeURIComponent((creator.full_name || creator.username || 'U').substring(0, 2))}`;
                      }}
                    />
                    <AvatarFallback className="text-xl bg-white/20 text-white">
                      {creator.full_name?.split(' ').map(n => n[0]).join('') || creator.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {creator.is_creator && (
                    <div className="absolute -bottom-2 -right-2">
                      <Badge className="bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm shadow-lg text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-2xl font-bold text-white">
                      {creator.full_name || creator.username}
                    </h1>
                  </div>
                  
                  {/* Stats Grid with White Text */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                        <span className="text-lg font-bold text-white font-mono">{courses.length}</span>
                      </div>
                      <p className="text-xs text-white/80">Courses</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        <span className="text-lg font-bold text-white font-mono">{events.length}</span>
                      </div>
                      <p className="text-xs text-white/80">Events</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="w-3.5 h-3.5 text-white" />
                        <span className="text-lg font-bold text-white font-mono">{fundraisingCampaigns.length}</span>
                      </div>
                      <p className="text-xs text-white/80">Campaigns</p>
                    </div>
                    <button 
                      onClick={handleFollowersClick}
                      className="bg-white/10 rounded-lg p-3 text-center border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-3.5 h-3.5 text-white" />
                        <span className="text-lg font-bold text-white font-mono">{creator.followers_count || 0}</span>
                      </div>
                      <p className="text-xs text-white/80">Followers</p>
                    </button>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-white/90 leading-relaxed max-w-3xl mb-4 p-3 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm text-sm">
                      {creator.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {user && user.id !== creatorId && (
                      <>
                        <UserFollowButton
                          userId={creatorId!}
                          isFollowing={creator.is_following || false}
                          onFollowChange={handleFollowChange}
                          size="sm"
                          showCount={false}
                          followersCount={creator.followers_count}
                          variant="default"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm text-sm"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          Message
                        </Button>
                      </>
                    )}
                    {!user && (
                      <div className="flex gap-2">
                        <Button 
                          asChild
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl backdrop-blur-sm text-sm"
                        >
                          <Link to="/auth">
                            Follow
                          </Link>
                        </Button>
                        <Button 
                          asChild
                          size="sm"
                          className="border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-lg hover:shadow-xl backdrop-blur-sm text-sm"
                        >
                          <Link to="/auth">
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Courses Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Published Courses</h2>
            </div>
            
            {courses.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">No Courses Yet</h3>
                  <p className="text-slate-600 text-sm">This creator hasn't published any courses yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-0 overflow-hidden">
                    <div className="relative h-40 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = `https://placehold.co/400x225/ff7b00/ffffff?text=${encodeURIComponent(course.title.substring(0, 20))}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                      
                      {/* Animated Play Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 rounded-full p-2 shadow-lg animate-pulse-slow">
                          <Play className="h-4 w-4 text-white fill-current" />
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <Link 
                        to={`/learning/course-detail/${course.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <div className="bg-white rounded-full p-2 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Play className="h-5 w-5 text-orange-600 fill-current" />
                        </div>
                      </Link>

                      {/* Price Badge */}
                      <div className="absolute top-2 right-2">
                        {course.is_free ? (
                          <Badge className="bg-emerald-500 text-white border-0 shadow-lg text-xs">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white border-0 shadow-lg text-xs">
                            <PriceDisplay amount={course.price} originalCurrency="USD" showOriginal={false} />
                          </Badge>
                        )}
                      </div>

                      {/* Difficulty Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/95 text-purple-800 border-purple-200 backdrop-blur-sm text-xs">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 text-sm leading-tight">
                        {course.title}
                      </h3>
                      
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                      
                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>{formatDuration(course.duration_minutes)}</span>
                        </div>
                        {course.average_rating && course.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{course.average_rating.toFixed(1)}</span>
                            <span className="text-slate-500">({course.total_reviews})</span>
                          </div>
                        )}
                      </div>

                      {/* Students Count */}
                      {course.total_students && course.total_students > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 mb-3">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{course.total_students} students</span>
                        </div>
                      )}
                      
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-xs h-8" asChild>
                        <Link to={`/learning/course-detail/${course.id}`}>
                          <Play className="h-3 w-3 mr-1.5" />
                          View Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Fundraising Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Support My Work</h2>
            </div>
            
            {fundraisingCampaigns.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">No Active Fundraising Campaigns</h3>
                  <p className="text-slate-600 text-sm">This creator hasn't launched any fundraising campaigns yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fundraisingCampaigns.map((campaign) => {
                  const progress = calculateProgress(campaign.total_raised, campaign.goal_amount);
                  const campaignBaseCurrency = campaign.currency || 'USD';
                  
                  return (
                    <Card key={campaign.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-0 overflow-hidden">
                      <div className="relative h-40 bg-gradient-to-br from-orange-400 to-purple-400 overflow-hidden">
                        {campaign.cover_image_url ? (
                          <img
                            src={campaign.cover_image_url}
                            alt={campaign.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = `https://placehold.co/400x225/ff7b00/ffffff?text=${encodeURIComponent(campaign.title.substring(0, 20))}`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="w-10 h-10 text-white/80" />
                          </div>
                        )}
                        
                        {/* Animated Heart Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-orange-500/90 rounded-full p-2 shadow-lg animate-pulse-slow">
                            <Heart className="h-4 w-4 text-white fill-current" />
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <Link 
                          to={`/fundraising/${campaign.id}`}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          <div className="bg-white rounded-full p-2 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                            <Heart className="h-5 w-5 text-orange-600 fill-current" />
                          </div>
                        </Link>

                        {/* Progress Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <div className="text-white">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold">
                                <PriceDisplay 
                                  amount={campaign.total_raised} 
                                  originalCurrency={campaignBaseCurrency}
                                  showOriginal={false}
                                />
                              </span>
                              <span className="text-white/90">
                                <PriceDisplay 
                                  amount={campaign.goal_amount} 
                                  originalCurrency={campaignBaseCurrency}
                                  showOriginal={false}
                                />
                              </span>
                            </div>
                            <Progress 
                              value={progress} 
                              className="h-1.5 bg-white/20"
                            />
                            <div className="flex justify-between text-xs mt-1">
                              <span>{Math.round(progress)}% funded</span>
                              <span>{campaign.contributions_count || 0} supporters</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 text-sm leading-tight">
                          {campaign.title}
                        </h3>
                        
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                          {campaign.description}
                        </p>
                        
                        {/* Use of Funds */}
                        {campaign.use_of_funds && (
                          <div className="text-xs text-slate-600 mb-3 p-2 bg-slate-50 rounded-lg">
                            <strong className="text-slate-700">Use of funds:</strong> {campaign.use_of_funds}
                          </div>
                        )}
                        
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-xs h-8" asChild>
                          <Link to={`/fundraising/${campaign.id}`}>
                            <Heart className="h-3 w-3 mr-1.5" />
                            Support Campaign
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Events Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-orange-600 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Published Events</h2>
            </div>
            
            {events.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-purple-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">No Events Yet</h3>
                  <p className="text-slate-600 text-sm">This creator hasn't published any events yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="group bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-0 overflow-hidden">
                    <div className="relative h-40 bg-gradient-to-br from-purple-400 to-orange-400 overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = `https://placehold.co/400x225/ff7b00/ffffff?text=${encodeURIComponent(event.title.substring(0, 20))}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                      
                      {/* Animated Calendar Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 rounded-full p-2 shadow-lg animate-pulse-slow">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <Link 
                        to={`/events/${event.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <div className="bg-white rounded-full p-2 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                      </Link>

                      {/* Price Badge */}
                      <div className="absolute top-2 right-2">
                        {event.is_free ? (
                          <Badge className="bg-emerald-500 text-white border-0 shadow-lg text-xs">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white border-0 shadow-lg text-xs">
                            <PriceDisplay amount={event.price} originalCurrency="USD" showOriginal={false} />
                          </Badge>
                        )}
                      </div>

                      {/* Event Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/95 text-purple-800 border-purple-200 backdrop-blur-sm text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 text-sm leading-tight">
                        {event.title}
                      </h3>
                      
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                      
                      {/* Event Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          <span>{formatEventDate(event.start_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        {event.total_attendees && event.total_attendees > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{event.total_attendees} attending</span>
                          </div>
                        )}
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-xs h-8" asChild>
                        <Link to={`/events/${event.id}`}>
                          <Calendar className="h-3 w-3 mr-1.5" />
                          View Event
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Followers Modal */}
          {showFollowers && (
            <FollowersList
              userId={showFollowers.userId}
              isOpen={!!showFollowers}
              onClose={() => setShowFollowers(null)}
              initialTab={showFollowers.tab}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

export default CreatorPublicProfile;
