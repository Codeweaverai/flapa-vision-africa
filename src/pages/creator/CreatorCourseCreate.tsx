import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, MessageCircle, BarChart3, Users, ChefHat, Code, Smartphone, Database, TrendingUp, Cpu, PaintBucket, Music, Camera, Heart, Globe, BookOpen, Cloud, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { name: 'Web Development', icon: Code, color: 'from-orange-500 to-purple-600' },
  { name: 'Mobile App Development', icon: Smartphone, color: 'from-orange-500 to-purple-600' },
  { name: 'Data Science', icon: Database, color: 'from-orange-500 to-purple-600' },
  { name: 'Artificial Intelligence (AI)', icon: Cpu, color: 'from-orange-500 to-purple-600' },
  { name: 'Communication', icon: MessageCircle, color: 'from-orange-500 to-purple-600' },
  { name: 'Business Analytics & Intelligence', icon: BarChart3, color: 'from-orange-500 to-purple-600' },
  { name: 'Leadership', icon: Users, color: 'from-orange-500 to-purple-600' },
  { name: 'Finance', icon: TrendingUp, color: 'from-orange-500 to-purple-600' },
  { name: 'Cooking', icon: ChefHat, color: 'from-orange-500 to-purple-600' },
  { name: 'Design', icon: PaintBucket, color: 'from-orange-500 to-purple-600' },
  { name: 'Music', icon: Music, color: 'from-orange-500 to-purple-600' },
  { name: 'Photography', icon: Camera, color: 'from-orange-500 to-purple-600' },
  { name: 'Health & Fitness', icon: Heart, color: 'from-orange-500 to-purple-600' },
  { name: 'Language', icon: Globe, color: 'from-orange-500 to-purple-600' },
  { name: 'Personal Development', icon: BookOpen, color: 'from-orange-500 to-purple-600' },
  { name: 'Cloud Computing', icon: Cloud, color: 'from-orange-500 to-purple-600' },
  { name: 'Cybersecurity', icon: Shield, color: 'from-orange-500 to-purple-600' }
];

const VALID_DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced',
  'Expert'
];

const CreatorCourseCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    summary: '',
    category: '',
    difficulty_level: '',
    duration_minutes: 0,
    price: 0,
    currency: 'USD',
    is_free: true,
    is_published: false,
    certificate_enabled: false,
    thumbnail_url: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a course');
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.summary || 
        !formData.category || !formData.difficulty_level) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        summary: formData.summary,
        category: formData.category,
        difficulty_level: formData.difficulty_level,
        duration_minutes: formData.duration_minutes,
        price: formData.is_free ? 0 : formData.price,
        is_free: formData.is_free,
        is_published: formData.is_published,
        certificate_enabled: formData.certificate_enabled,
        thumbnail_url: formData.thumbnail_url,
        tags: formData.tags,
        creator_id: user.id
      };

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Course created successfully');
      navigate('/creator/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `course-thumbnail-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);

      handleInputChange('thumbnail_url', publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <CreatorLayout title="Create Course">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Create New Course
          </CardTitle>
          <CardDescription className="text-lg">
            Build your next masterpiece and share your knowledge with the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Selection Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Course Category *</Label>
              <div className="relative">
                <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide">
                  {CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => handleInputChange('category', category.name)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[100px] transition-all duration-300 transform hover:scale-105 border-2 ${
                          formData.category === category.name
                            ? `border-transparent bg-gradient-to-r ${category.color} text-white shadow-lg`
                            : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                        }`}
                      >
                        <IconComponent className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium text-center leading-tight">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {formData.category && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-600`} />
                  <span>Selected: <strong>{formData.category}</strong></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter an engaging course title"
                  className="h-12 border-2 focus:border-orange-300 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level" className="text-base font-semibold">Difficulty Level *</Label>
                <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange('difficulty_level', value)}>
                  <SelectTrigger className="h-12 border-2 focus:border-orange-300">
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes" className="text-base font-semibold">Duration (minutes) *</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  placeholder="120"
                  min="0"
                  className="h-12 border-2 focus:border-orange-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-base font-semibold">Course Summary *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief summary of what students will learn..."
                rows={2}
                className="border-2 focus:border-orange-300 resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">Course Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of your course content, learning objectives, and target audience..."
                rows={4}
                className="border-2 focus:border-orange-300 resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-base font-semibold">Course Thumbnail</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('thumbnail')?.click()}
                  disabled={uploadingImage}
                  className="h-12 px-6 border-2 hover:border-orange-300 transition-colors"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImage ? 'Uploading...' : 'Upload Thumbnail'}
                </Button>
                {formData.thumbnail_url && (
                  <div className="relative">
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Thumbnail preview" 
                      className="h-12 w-12 object-cover rounded-lg border-2 border-orange-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-600/20 rounded-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Pricing</Label>
                <div className="flex items-center space-x-2 p-3 border-2 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={formData.is_free}
                    onChange={(e) => handleInputChange('is_free', e.target.checked)}
                    className="rounded border-2 border-orange-500 text-orange-500 focus:ring-orange-500"
                  />
                  <Label htmlFor="is_free" className="text-base cursor-pointer">Free Course</Label>
                </div>
              </div>

              {!formData.is_free && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-semibold">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="99.99"
                      min="0"
                      step="0.01"
                      className="h-12 border-2 focus:border-orange-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-base font-semibold">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="h-12 border-2 focus:border-orange-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Course Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add relevant tags..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="border-2 focus:border-orange-300"
                />
                <Button 
                  type="button" 
                  onClick={addTag} 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 text-orange-700"
                  >
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border-2 rounded-lg">
              <input
                type="checkbox"
                id="certificate_enabled"
                checked={formData.certificate_enabled}
                onChange={(e) => handleInputChange('certificate_enabled', e.target.checked)}
                className="rounded border-2 border-orange-500 text-orange-500 focus:ring-orange-500"
              />
              <Label htmlFor="certificate_enabled" className="text-base cursor-pointer">
                Enable Certificate of Completion
              </Label>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/creator/courses')}
                disabled={loading}
                className="h-12 px-8 border-2 hover:border-orange-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploadingImage}
                className="h-12 px-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Course...</span>
                  </div>
                ) : (
                  'Create Course'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseCreate;
