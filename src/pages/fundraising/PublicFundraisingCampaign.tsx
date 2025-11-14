import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Users, 
  DollarSign, 
  Calendar, 
  Share2, 
  ArrowLeft,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Instagram,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { Link } from 'react-router-dom';
import FundraisingMobileMoneyDialog from '@/components/fundraising/FundraisingMobileMoneyDialog';

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

// Currency conversion function
const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  
  const usdAmount = amount * fromRate;
  const targetAmount = usdAmount / toRate;
  
  return Number(targetAmount.toFixed(2));
};

// Social Media Icons with brand colors
const SocialPlatforms = [
  {
    platform: 'whatsapp',
    Icon: MessageCircle,
    color: 'text-white bg-[#25D366] hover:bg-[#25D366]/90',
    label: 'WhatsApp'
  },
  {
    platform: 'facebook',
    Icon: Facebook,
    color: 'text-white bg-[#1877F2] hover:bg-[#1877F2]/90',
    label: 'Facebook'
  },
  {
    platform: 'twitter',
    Icon: Twitter,
    color: 'text-white bg-[#1DA1F2] hover:bg-[#1DA1F2]/90',
    label: 'X'
  },
  {
    platform: 'instagram',
    Icon: Instagram,
    color: 'text-white bg-gradient-to-r from-[#405DE6] via-[#E1306C] to-[#FFDC80] hover:opacity-90',
    label: 'Instagram'
  },
  {
    platform: 'linkedin',
    Icon: Linkedin,
    color: 'text-white bg-[#0A66C2] hover:bg-[#0A66C2]/90',
    label: 'LinkedIn'
  },
  {
    platform: 'link',
    Icon: Link2,
    color: 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300',
    label: 'Copy Link'
  }
];

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
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

const PublicFundraisingCampaign: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const calculateCampaignStats = async (contributions: CampaignContribution[], campaign: Campaign): Promise<CampaignStats> => {
    const completedContributions = contributions.filter(c => c.status === 'completed');
    const campaignBaseCurrency = campaign.currency || 'USD';
    
    let totalRaised = 0;

    for (const contribution of completedContributions) {
      const contributionCurrency = contribution.currency || 'USD';
      const originalAmount = Number(contribution.amount || 0);

      let amountInBaseCurrency = originalAmount;

      if (contributionCurrency !== campaignBaseCurrency) {
        try {
          amountInBaseCurrency = await convertCurrency(originalAmount, contributionCurrency, campaignBaseCurrency);
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

  const loadCampaign = async () => {
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from('fundraising_campaigns')
        .select(`
          *,
          profiles (id, full_name, avatar_url, username, bio)
        `)
        .eq('id', campaignId)
        .eq('status', 'active')
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load contributions to calculate current amount
      const { data: contributionsData, error: contributionsError } = await supabase
        .from('campaign_contributions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'completed');

      if (contributionsError) throw contributionsError;

      if (campaignData && contributionsData) {
        const stats = await calculateCampaignStats(contributionsData, campaignData);
        setCampaignStats(stats);
      }
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
      month: 'short',
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

  const handleSocialShare = (platform: string) => {
    if (!campaign) return;

    const shareUrl = window.location.href;
    const title = encodeURIComponent(campaign.title);
    const text = encodeURIComponent(campaign.description.substring(0, 200));
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${title}%20${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${title}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${shareUrl}`,
      instagram: `https://www.instagram.com/?url=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${text}`,
    };

    if (platform === 'link') {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Campaign link copied to clipboard!');
      return;
    }

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100 flex items-center justify-center">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800">Campaign Not Found</h3>
              <p className="text-slate-600 mb-6">This campaign doesn't exist or is no longer active.</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
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

  const currentAmount = campaignStats?.total_raised || 0;
  const goalAmount = campaign.goal_amount || 1;
  const progress = calculateProgress(currentAmount, goalAmount);
  const campaignBaseCurrency = campaign.currency || 'USD';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6 hover:bg-white/80 transition-all duration-300">
            <Link to={`/creator/profile/${campaign.profiles.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Creator Profile
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Header */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
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
                        <Heart className="w-16 h-16 mx-auto mb-4 opacity-80" />
                        <p className="text-xl font-semibold">{campaign.title}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-2">{campaign.title}</h1>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 text-xs">
                          {campaign.category}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          Created {formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleShareCampaign} className="border-slate-300 hover:bg-white/80">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Progress Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-900 font-mono">
                          <PriceDisplay 
                            amount={currentAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </div>
                        <p className="text-xs text-slate-600">Raised</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-900 font-mono">
                          <PriceDisplay 
                            amount={goalAmount} 
                            originalCurrency={campaignBaseCurrency}
                            showOriginal={false}
                          />
                        </div>
                        <p className="text-xs text-slate-600">Goal</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-900 font-mono">
                          {Math.round(progress)}%
                        </div>
                        <p className="text-xs text-slate-600">Funded</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/50" />
                    <div className="flex justify-between text-xs text-slate-600 mt-2">
                      <span>{progress.toFixed(1)}% of goal reached</span>
                      <span>
                        {campaign.end_date && `Ends ${formatDate(campaign.end_date)}`}
                      </span>
                    </div>
                    {campaignStats?.contributions_count && (
                      <div className="text-xs text-slate-500 text-center mt-2">
                        From {campaignStats.contributions_count} contributions
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleSupportClick}
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white py-4 text-base transition-all duration-300"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Support This Campaign
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign Story */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    About This Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
                    {campaign.description}
                  </p>
                </CardContent>
              </Card>

              {/* Use of Funds */}
              {campaign.use_of_funds && (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Use of Funds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {campaign.use_of_funds}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Creator Info */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">About the Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 border-2 border-orange-200">
                      <AvatarImage src={campaign.profiles.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm">
                        {campaign.profiles.full_name?.[0] || campaign.profiles.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{campaign.profiles.full_name || campaign.profiles.username}</h3>
                      <p className="text-xs text-slate-600">Creator</p>
                    </div>
                  </div>
                  {campaign.profiles.bio && (
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {campaign.profiles.bio}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full border-slate-300 hover:bg-white/80" asChild>
                    <Link to={`/creator/profile/${campaign.profiles.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                    <span>Started {formatDate(campaign.start_date)}</span>
                  </div>
                  {campaign.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-orange-500" />
                      <span>Ends {formatDate(campaign.end_date)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      Goal: <PriceDisplay 
                        amount={goalAmount} 
                        originalCurrency={campaignBaseCurrency}
                        showOriginal={false}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span>Category: {campaign.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Currency: {campaignBaseCurrency}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Social Share */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Share This Campaign</CardTitle>
                  <CardDescription className="text-xs">
                    Help spread the word about this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {SocialPlatforms.map(({ platform, Icon, color, label }) => (
                      <Button
                        key={platform}
                        variant="ghost"
                        size="sm"
                        className={`h-12 flex flex-col gap-1 transition-all duration-200 ${color} rounded-lg text-xs`}
                        onClick={() => handleSocialShare(platform)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support Card */}
              <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-xl">
                <CardContent className="p-4 text-center text-white">
                  <Heart className="h-6 w-6 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm mb-1">Ready to Support?</h3>
                  <p className="text-white/90 text-xs mb-3 leading-relaxed">
                    Help bring this project to life by making a contribution.
                  </p>
                  <Button 
                    onClick={handleSupportClick}
                    size="sm"
                    className="w-full bg-white text-orange-600 hover:bg-white/90 font-semibold text-xs"
                  >
                    <Heart className="h-3 w-3 mr-1.5" />
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
              current_amount: currentAmount,
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
