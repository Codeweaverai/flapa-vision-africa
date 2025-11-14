import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, DollarSign, Calendar, Image, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignFormData {
  title: string;
  description: string;
  goal_amount: number;
  category: string;
  end_date: string;
  use_of_funds: string;
  cover_image_url: string;
}

const CreateFundraisingCampaign: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    goal_amount: 0,
    category: '',
    end_date: '',
    use_of_funds: '',
    cover_image_url: ''
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

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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
      const fileName = `temp/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
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

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      cover_image_url: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a campaign');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('fundraising_campaigns')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          goal_amount: formData.goal_amount,
          category: formData.category,
          end_date: formData.end_date || null,
          use_of_funds: formData.use_of_funds,
          cover_image_url: formData.cover_image_url,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Campaign created successfully!');
      navigate('/creator/fundraising');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
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
                  Create Campaign
                </h1>
                <p className="text-slate-600 mt-1">
                  Set up your campaign to start receiving support from your community
                </p>
              </div>
            </div>
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
                            onClick={handleRemoveImage}
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
                <CardContent className="p-6">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300"
                    disabled={!isFormValid() || loading || uploading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Campaign...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Your campaign will be live immediately after creation
                  </p>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreateFundraisingCampaign;
