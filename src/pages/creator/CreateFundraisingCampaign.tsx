import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, DollarSign, Calendar } from 'lucide-react';
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
}

const CreateFundraisingCampaign: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    if (!file) return;

    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll use a placeholder
    toast.info('Image upload functionality coming soon!');
    setFormData(prev => ({
      ...prev,
      cover_image_url: URL.createObjectURL(file)
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
              <h1 className="text-3xl font-bold">Create Fundraising Campaign</h1>
              <p className="text-muted-foreground">
                Set up your campaign to start receiving support from your community
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Title */}
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
                      {formData.goal_amount > 0 && (
                        <p className="text-sm text-gray-600">
                          You'll receive: <PriceDisplay amount={formData.goal_amount * 0.95} originalCurrency="USD" /> 
                          <span className="text-gray-500"> (5% platform fee: <PriceDisplay amount={formData.goal_amount * 0.05} originalCurrency="USD" />)</span>
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

                {/* Campaign Preview */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Campaign Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goal:</span>
                        <span className="font-medium">
                          {formData.goal_amount ? (
                            <PriceDisplay amount={formData.goal_amount} originalCurrency="USD" />
                          ) : (
                            'Not set'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">{formData.category || 'Not set'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Publish Button */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                      disabled={!isFormValid() || loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Campaign...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </Button>
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Your campaign will be live immediately after creation
                    </p>
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

// Add Badge component since it's used in the preview
const Badge: React.FC<{ variant?: 'secondary' | 'default'; className?: string; children: React.ReactNode }> = ({ 
  variant = 'default', 
  className, 
  children 
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = variant === 'secondary' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800';
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export default CreateFundraisingCampaign;
