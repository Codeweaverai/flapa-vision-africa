
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { 
  Course, 
  fetchCourseById, 
  updateCourse,
  VALID_CATEGORIES,
  VALID_DIFFICULTY_LEVELS
} from '@/services/courseService';

const CreatorCourseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    is_free: true,
    is_published: false,
    certificate_enabled: false,
    thumbnail_url: ''
  });

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
          is_free: courseData.is_free ?? true,
          is_published: courseData.is_published ?? false,
          certificate_enabled: courseData.certificate_enabled ?? false,
          thumbnail_url: courseData.thumbnail_url || ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? inputElement.checked : 
              type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
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
          <Button onClick={() => navigate('/creator/courses')} variant="outline">
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
          <Button onClick={() => navigate('/creator/courses')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/creator/courses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <h1 className="text-3xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">Update your course information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="summary">Course Summary *</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Brief summary of your course"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of your course"
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                  <Select 
                    value={formData.difficulty_level} 
                    onValueChange={(value) => handleSelectChange('difficulty_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
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
              </div>

              <div>
                <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  placeholder="Course duration in minutes"
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  placeholder="Course thumbnail image URL"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Settings</CardTitle>
              <CardDescription>
                Configure pricing and course settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => handleSwitchChange('is_free', checked)}
                />
                <Label htmlFor="is_free">Free Course</Label>
              </div>

              {!formData.is_free && (
                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Course price"
                    min="0"
                    step="0.01"
                    required={!formData.is_free}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="certificate_enabled"
                  checked={formData.certificate_enabled}
                  onCheckedChange={(checked) => handleSwitchChange('certificate_enabled', checked)}
                />
                <Label htmlFor="certificate_enabled">Enable Certificates</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleSwitchChange('is_published', checked)}
                />
                <Label htmlFor="is_published">Publish Course</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/creator/courses')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseEdit;
