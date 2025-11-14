import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, DollarSign, Calendar, Trash2, Save, Image, Eye } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
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
    if (!file || !user || !campaignId) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaignId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fundraising_assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fundraising_assets')
        .getPublicUrl(fileName);

      // Update form data with new image URL
      setFormData(prev => ({
        ...prev,
        cover_image_url: publicUrl
      }));

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
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
      // Delete cover image from storage if exists
      if (campaign.cover_image_url) {
        const imagePath = campaign.cover_image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('fundraising_assets')
            .remove([`${campaignId}/${imagePath}`]);
        }
      }

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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/80 transition-all duration-300">
                <Link to="/creator/fundraising">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Edit Campaign
                </h1>
                <p className="text-slate-600 mt-1">
                  Update your campaign details and settings
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="border-slate-300 hover:bg-white/80"
            >
              <Link to={`/fundraising/${campaignId}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                View Public
              </Link>
            </Button>
          </div>

          {/* Single Column Layout */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Details */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Campaign Information</CardTitle>
                  <CardDescription>
                    Basic details about your fundraising campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">Campaign Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Build My Podcast Studio"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="bg-white/50 border-slate-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell your story and explain why you're raising funds..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="bg-white/50 border-slate-200 resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="use_of_funds" className="text-sm font-medium text-slate-700">Use of Funds *</Label>
                    <Textarea
                      id="use_of_funds"
                      placeholder="Explain exactly how the funds will be used..."
                      rows={3}
                      value={formData.use_of_funds}
                      onChange={(e) => handleInputChange('use_of_funds', e.target.value)}
                      className="bg-white/50 border-slate-200 resize-none"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Funding Goal & Settings */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Funding & Settings</CardTitle>
                  <CardDescription>
                    Set your funding goal and campaign preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal_amount" className="text-sm font-medium text-slate-700">Goal Amount (USD) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="goal_amount"
                          type="number"
                          placeholder="0.00"
                          className="pl-10 bg-white/50 border-slate-200"
                          min="1"
                          step="0.01"
                          value={formData.goal_amount || ''}
                          onChange={(e) => handleInputChange('goal_amount', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-slate-700">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200">
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
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date" className="text-sm font-medium text-slate-700">End Date (Optional)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          id="end_date"
                          type="date"
                          className="pl-10 bg-white/50 border-slate-200"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.end_date}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Image */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900">Cover Image</CardTitle>
                  <CardDescription>
                    Upload a compelling image for your campaign (Max 10MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors duration-300">
                    {formData.cover_image_url ? (
                      <div className="space-y-4">
                        <img 
                          src={formData.cover_image_url} 
                          alt="Cover preview" 
                          className="w-full h-48 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex gap-2 justify-center">
                          <Label htmlFor="cover-image-change" className="cursor-pointer">
                            <Button variant="outline" size="sm" className="border-slate-300">
                              <Upload className="h-4 w-4 mr-2" />
                              Change Image
                            </Button>
                            <Input
                              id="cover-image-change"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploading}
                            />
                          </Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleInputChange('cover_image_url', '')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Label htmlFor="cover-image" className="cursor-pointer">
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            <Image className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                            <span className="text-slate-600"> or drag and drop</span>
                          </div>
                          <p className="text-sm text-slate-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <Input
                          id="cover-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </Label>
                    )}
                    {uploading && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-slate-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading image...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6 space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300"
                    disabled={!isFormValid() || loading || uploading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating Campaign...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Campaign
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                    onClick={handleDeleteCampaign}
                    disabled={loading || uploading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </Button>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default EditFundraisingCampaign;
