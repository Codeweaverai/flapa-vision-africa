import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, Upload, X, Plus } from 'lucide-react';
import { 
  Course, 
  fetchCourseById, 
  updateCourse,
  VALID_DIFFICULTY_LEVELS
} from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  // Original Categories
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
  { name: 'Cybersecurity', icon: Shield, color: 'from-orange-500 to-purple-600' },
  
  // Additional Upskilling Categories
  { name: 'Digital Marketing', icon: Target, color: 'from-orange-500 to-purple-600' },
  { name: 'Project Management', icon: Calendar, color: 'from-orange-500 to-purple-600' },
  { name: 'UI/UX Design', icon: Palette, color: 'from-orange-500 to-purple-600' },
  { name: 'Video Production', icon: Video, color: 'from-orange-500 to-purple-600' },
  { name: 'Public Speaking', icon: Mic, color: 'from-orange-500 to-purple-600' },
  { name: 'Game Development', icon: Gamepad2, color: 'from-orange-500 to-purple-600' },
  { name: 'Electric Vehicles', icon: Car, color: 'from-orange-500 to-purple-600' },
  { name: 'Sustainability', icon: Leaf, color: 'from-orange-500 to-purple-600' },
  { name: 'Real Estate', icon: Building2, color: 'from-orange-500 to-purple-600' },
  { name: 'Education & Teaching', icon: School, color: 'from-orange-500 to-purple-600' },
  { name: 'Psychology', icon: Brain, color: 'from-orange-500 to-purple-600' },
  { name: 'Physics', icon: Atom, color: 'from-orange-500 to-purple-600' },
  { name: 'Chemistry', icon: FlaskConical, color: 'from-orange-500 to-purple-600' },
  { name: 'Blockchain & Web3', icon: Binary, color: 'from-orange-500 to-purple-600' },
  { name: 'Networking', icon: Network, color: 'from-orange-500 to-purple-600' },
  { name: 'Entrepreneurship', icon: Rocket, color: 'from-orange-500 to-purple-600' },
  { name: 'Personal Finance', icon: Wallet, color: 'from-orange-500 to-purple-600' },
  { name: 'E-commerce', icon: ShoppingCart, color: 'from-orange-500 to-purple-600' },
  { name: 'Email Marketing', icon: Mail, color: 'from-orange-500 to-purple-600' },
  { name: 'Cryptography', icon: Lock, color: 'from-orange-500 to-purple-600' },
  { name: 'Human Resources', icon: Users2, color: 'from-orange-500 to-purple-600' },
  { name: 'Technical Writing', icon: FileText, color: 'from-orange-500 to-purple-600' },
  { name: 'Sales & Negotiation', icon: Presentation, color: 'from-orange-500 to-purple-600' },
  { name: 'Mathematics', icon: Calculator, color: 'from-orange-500 to-purple-600' },
  { name: 'Biotechnology', icon: TestTube, color: 'from-orange-500 to-purple-600' }
];

// Import all required Lucide icons
import { 
  Code, Smartphone, Database, Cpu, MessageCircle, BarChart3, Users, 
  ChefHat, PaintBucket, Music, Camera, Heart, Globe, BookOpen, Cloud, 
  Shield, Target, Calendar, Palette, Video, Mic, Gamepad2, Car, Leaf, 
  Building2, School, Brain, Atom, FlaskConical, Binary, Network, Rocket, 
  Wallet, ShoppingCart, Mail, Lock, Users2, FileText, Presentation, 
  Calculator, TestTube, TrendingUp 
} from 'lucide-react';

const CreatorCourseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
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

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) {
        setError('Course ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const courseData = await fetchCourseById(id);
        
        if (!courseData) {
          setError('Course not found');
          return;
        }

        setCourse(courseData);
        setFormData({
          title: courseData.title || '',
          summary: courseData.summary || '',
          description: courseData.description || '',
          category: courseData.category || '',
          difficulty_level: courseData.difficulty_level || '',
          duration_minutes: courseData.duration_minutes || 0,
          price: Number(courseData.price) || 0,
          currency: courseData.currency || 'USD',
          is_free: courseData.is_free ?? true,
          is_published: courseData.is_published ?? false,
          certificate_enabled: courseData.certificate_enabled ?? false,
          thumbnail_url: courseData.thumbnail_url || '',
          tags: courseData.tags || []
        });
      } catch (error) {
        console.error('Error loading course:', error);
        setError('Failed to load course data');
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !course) {
      toast.error('Course data not available');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Course title is required');
      return;
    }

    if (!formData.summary.trim()) {
      toast.error('Course summary is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Course description is required');
      return;
    }

    if (!formData.category) {
      toast.error('Course category is required');
      return;
    }

    if (!formData.difficulty_level) {
      toast.error('Difficulty level is required');
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    if (!formData.is_free && formData.price <= 0) {
      toast.error('Price must be greater than 0 for paid courses');
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        ...formData,
        price: formData.is_free ? 0 : formData.price
      };

      await updateCourse(id, updateData);
      toast.success('Course updated successfully');
      navigate('/creator/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading course...</span>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (error) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-red-500 text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Course</h2>
            <p>{error}</p>
          </div>
          <Button 
            onClick={() => navigate('/creator/courses')} 
            variant="outline"
            className="h-12 px-8 border-2 hover:border-orange-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  if (!course) {
    return (
      <CreatorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p>The course you're looking for doesn't exist.</p>
          </div>
          <Button 
            onClick={() => navigate('/creator/courses')} 
            variant="outline"
            className="h-12 px-8 border-2 hover:border-orange-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Edit Course">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/creator/courses')}
              className="h-12 px-6 border-2 hover:border-orange-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Edit Course
          </CardTitle>
          <CardDescription className="text-lg">
            Update your course information and improve your content
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
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2 p-3 border-2 rounded-lg">
                <Switch
                  id="certificate_enabled"
                  checked={formData.certificate_enabled}
                  onCheckedChange={(checked) => handleSwitchChange('certificate_enabled', checked)}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600"
                />
                <Label htmlFor="certificate_enabled" className="text-base cursor-pointer">
                  Enable Certificate of Completion
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border-2 rounded-lg">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleSwitchChange('is_published', checked)}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600"
                />
                <Label htmlFor="is_published" className="text-base cursor-pointer">
                  Publish Course
                </Label>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/creator/courses')}
                disabled={saving}
                className="h-12 px-8 border-2 hover:border-orange-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving || uploadingImage}
                className="h-12 px-8 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseEdit;
