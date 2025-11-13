import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users, DollarSign, Calendar, Share2, ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { Link } from 'react-router-dom';
import FundraisingMobileMoneyDialog from '@/components/fundraising/FundraisingMobileMoneyDialog';

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
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
    bio: string | null;
  };
}

const PublicFundraisingCampaign: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          profiles (id, full_name, avatar_url, username, bio)
        `)
        .eq('id', campaignId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Campaign not found');
    } finally {
      setLoading(false);
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

  const handleSupportClick = () => {
    if (!user) {
      toast.error('Please log in to support this campaign');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleShareCampaign = async () => {
    if (!campaign) return;

    const shareUrl = window.location.href;
    
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
      navigator.clipboard.writeText(shareUrl);
      toast.success('Campaign link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Campaign Not Found</h3>
              <p className="text-gray-600 mb-6">This campaign doesn't exist or is no longer active.</p>
              <Button asChild>
                <Link to="/courses">
                  Browse Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to={`/creator/${campaign.profiles.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Creator Profile
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Header */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
                <div className="relative h-80 bg-gradient-to-br from-orange-400 to-purple-400">
                  {campaign.cover_image_url ? (
                    <img 
                      src={campaign.cover_image_url} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Heart className="w-20 h-20 mx-auto mb-4 opacity-80" />
                        <p className="text-2xl font-semibold">{campaign.title}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                          {campaign.category}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Created {formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleShareCampaign}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Progress Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          <PriceDisplay amount={campaign.current_amount} originalCurrency="USD" />
                        </div>
                        <p className="text-sm text-gray-600">Raised</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          <PriceDisplay amount={campaign.goal_amount} originalCurrency="USD" />
                        </div>
                        <p className="text-sm text-gray-600">Goal</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {Math.round(progress)}%
                        </div>
                        <p className="text-sm text-gray-600">Funded</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-4 bg-white/50" />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>{progress.toFixed(1)}% of goal reached</span>
                      <span>
                        {campaign.end_date && `Ends ${formatDate(campaign.end_date)}`}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSupportClick}
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-lg py-6"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Support This Campaign
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign Story */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>About This Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
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
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {campaign.use_of_funds}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>About the Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16 border-2 border-orange-200">
                      <AvatarImage src={campaign.profiles.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-lg">
                        {campaign.profiles.full_name?.[0] || campaign.profiles.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.profiles.full_name || campaign.profiles.username}</h3>
                      <p className="text-sm text-gray-600">Creator</p>
                    </div>
                  </div>
                  {campaign.profiles.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {campaign.profiles.bio}
                    </p>
                  )}
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to={`/creator/${campaign.profiles.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span>Started {formatDate(campaign.start_date)}</span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>Ends {formatDate(campaign.end_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>Goal: <PriceDisplay amount={campaign.goal_amount} originalCurrency="USD" /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Category: {campaign.category}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support Button */}
              <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-xl">
                <CardContent className="p-6 text-center text-white">
                  <Heart className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Ready to Support?</h3>
                  <p className="text-white/90 text-sm mb-4">
                    Help bring this project to life by making a contribution.
                  </p>
                  <Button 
                    onClick={handleSupportClick}
                    size="lg"
                    className="w-full bg-white text-orange-600 hover:bg-white/90"
                  >
                    Support Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Money Payment Dialog */}
        {campaign && (
          <FundraisingMobileMoneyDialog
            isOpen={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            campaign={{
              id: campaign.id,
              title: campaign.title,
              goal_amount: campaign.goal_amount,
              current_amount: campaign.current_amount,
              currency: campaign.currency,
              creator_id: campaign.profiles.id
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default PublicFundraisingCampaign;
