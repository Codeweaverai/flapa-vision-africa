import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, DollarSign, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface CampaignFormData {
  title: string;
  description: string;
  goal_amount: number;
  category: string;
  end_date: string;
  use_of_funds: string;
  cover_image_url: string;
  status: string;
}

const EditFundraisingCampaign: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    goal_amount: 0,
    category: '',
    end_date: '',
    use_of_funds: '',
    cover_image_url: '',
    status: 'active'
  });

  const categories = [
    'equipment',
    'education', 
    'project',
    'travel',
    'production',
    'research',
    'community',
    'emergency',
    'creative',
    'business'
  ];

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    if (!user || !campaignId) return;

    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('creator_id', user.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Campaign not found');
        navigate('/creator/fundraising');
        return;
      }

      setCampaign(data);
      setFormData({
        title: data.title,
        description: data.description,
        goal_amount: data.goal_amount,
        category: data.category,
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        use_of_funds: data.use_of_funds || '',
        cover_image_url: data.cover_image_url || '',
        status: data.status
      });
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
      navigate('/creator/fundraising');
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload to Supabase Storage
    toast.info('Image upload functionality coming soon!');
    setFormData(prev => ({
      ...prev,
      cover_image_url: URL.createObjectURL(file)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !campaignId) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('fundraising_campaigns')
        .update({
          title: formData.title,
          description: formData.description,
          goal_amount: formData.goal_amount,
          category: formData.category,
          end_date: formData.end_date || null,
          use_of_funds: formData.use_of_funds,
          cover_image_url: formData.cover_image_url,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast.success('Campaign updated successfully!');
      navigate('/creator/fundraising');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!user || !campaignId) return;

    // Check if campaign has contributions
    const { data: contributions } = await supabase
      .from('campaign_contributions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed')
      .limit(1);

    if (contributions && contributions.length > 0) {
      toast.error('Cannot delete campaign with completed contributions');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('fundraising_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast.success('Campaign deleted successfully!');
      navigate('/creator/fundraising');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.goal_amount > 0 &&
      formData.category &&
      formData.use_of_funds.trim()
    );
  };

  if (!campaign) {
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

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/creator/fundraising">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Campaign</h1>
              <p className="text-muted-foreground">
                Update your campaign details and settings
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Status */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Campaign Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Campaign Details */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                      Basic information about your fundraising campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Build My Podcast Studio"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell your story and explain why you're raising funds..."
                        rows={5}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="use_of_funds">Use of Funds *</Label>
                      <Textarea
                        id="use_of_funds"
                        placeholder="Explain exactly how the funds will be used..."
                        rows={3}
                        value={formData.use_of_funds}
                        onChange={(e) => handleInputChange('use_of_funds', e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Funding Goal */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Funding Goal</CardTitle>
                    <CardDescription>
                      Set your target amount and campaign duration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal_amount">Goal Amount (USD) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          id="goal_amount"
                          type="number"
                          placeholder="0.00"
                          className="pl-10"
                          min="1"
                          step="0.01"
                          value={formData.goal_amount || ''}
                          onChange={(e) => handleInputChange('goal_amount', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      {campaign.current_amount > 0 && (
                        <p className="text-sm text-yellow-600 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Campaign has already raised <PriceDisplay amount={campaign.current_amount} originalCurrency="USD" />
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date (Optional)</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            id="end_date"
                            type="date"
                            className="pl-10"
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.end_date}
                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Cover Image */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Cover Image</CardTitle>
                    <CardDescription>
                      Add a compelling image for your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.cover_image_url ? (
                        <div className="space-y-2">
                          <img 
                            src={formData.cover_image_url} 
                            alt="Cover preview" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleInputChange('cover_image_url', '')}
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <Label htmlFor="cover-image" className="cursor-pointer">
                              <span className="text-blue-600 hover:text-blue-700">Upload an image</span>
                              <span className="text-gray-600"> or drag and drop</span>
                            </Label>
                            <Input
                              id="cover-image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Stats */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Campaign Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raised:</span>
                      <span className="font-medium">
                        <PriceDisplay amount={campaign.current_amount} originalCurrency="USD" />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goal:</span>
                      <span className="font-medium">
                        <PriceDisplay amount={campaign.goal_amount} originalCurrency="USD" />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">
                        {Math.round((campaign.current_amount / campaign.goal_amount) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6 space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                      disabled={!isFormValid() || loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Campaign...
                        </>
                      ) : (
                        'Update Campaign'
                      )}
                    </Button>

                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={handleDeleteCampaign}
                      disabled={loading || campaign.current_amount > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Campaign
                    </Button>

                    {campaign.current_amount > 0 && (
                      <p className="text-xs text-red-600 text-center">
                        Cannot delete campaign with contributions
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default EditFundraisingCampaign;
