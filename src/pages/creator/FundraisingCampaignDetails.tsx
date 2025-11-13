import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Eye, Edit, Users, DollarSign, Calendar, Share2 } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  use_of_funds: string | null;
  created_at: string;
}

interface Contribution {
  id: string;
  amount: number;
  supporter_id: string;
  is_anonymous: boolean;
  message_to_creator: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

const FundraisingCampaignDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    if (!user || !campaignId) return;

    try {
      // Load campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('creator_id', user.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load contributions
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq('campaign_id', campaignId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (contributionsError) throw contributionsError;
      setContributions(contributionsData || []);
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const handleShareCampaign = async () => {
    if (!campaign) return;

    const shareUrl = `${window.location.origin}/fundraising/${campaign.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success('Campaign link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (!campaign) {
    return (
      <CreatorLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
          <div className="p-6 text-center">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl max-w-md mx-auto">
              <CardContent className="p-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Eye className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Campaign Not Found</h3>
                <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have access to it.</p>
                <Button asChild>
                  <Link to="/creator/fundraising">
                    Back to Campaigns
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/creator/fundraising">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{campaign.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Created {formatDate(campaign.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShareCampaign}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button asChild>
                <Link to={`/creator/fundraising/${campaign.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Cover & Progress */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-orange-400 to-purple-400">
                  {campaign.cover_image_url ? (
                    <img 
                      src={campaign.cover_image_url} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <DollarSign className="w-16 h-16 mx-auto mb-2 opacity-80" />
                        <p className="text-lg font-semibold">No cover image</p>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        <PriceDisplay amount={campaign.current_amount} originalCurrency="USD" />
                      </div>
                      <p className="text-sm text-gray-600">Raised</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        <PriceDisplay amount={campaign.goal_amount} originalCurrency="USD" />
                      </div>
                      <p className="text-sm text-gray-600">Goal</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {contributions.length}
                      </div>
                      <p className="text-sm text-gray-600">Supporters</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{Math.round(progress)}% funded</span>
                    <span>
                      {campaign.end_date && `Ends ${formatDate(campaign.end_date)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Description */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>About This Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {campaign.description}
                  </p>
                </CardContent>
              </Card>

              {/* Use of Funds */}
              {campaign.use_of_funds && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Use of Funds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {campaign.use_of_funds}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campaign Stats */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{campaign.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">{formatDate(campaign.start_date)}</span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ends:</span>
                      <span className="font-medium">{formatDate(campaign.end_date)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Supporters */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Supporters</CardTitle>
                  <CardDescription>
                    People who have supported this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contributions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No supporters yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contributions.slice(0, 5).map((contribution) => (
                        <div key={contribution.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                              {contribution.is_anonymous ? 'A' : contribution.profiles.full_name?.[0] || 'U'}
                            </div>
                            <span className="text-sm">
                              {contribution.is_anonymous ? 'Anonymous' : contribution.profiles.full_name}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            <PriceDisplay amount={contribution.amount} originalCurrency="USD" />
                          </span>
                        </div>
                      ))}
                      {contributions.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          View all {contributions.length} supporters
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Public View */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <Button asChild className="w-full">
                    <Link to={`/fundraising/${campaign.id}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </Button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    See how your campaign appears to supporters
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default FundraisingCampaignDetails;
