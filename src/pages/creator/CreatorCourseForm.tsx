
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';

interface CourseFormData {
  title?: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  duration_minutes?: number;
  is_free?: boolean;
  price?: number;
  certificate_enabled?: boolean;
  thumbnail_url?: string;
  summary?: string;
}

const CreatorCourseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams<{ id?: string }>();
  const [formData, setFormData] = useState<CourseFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        description: data.description,
        difficulty_level: data.difficulty_level,
        category: data.category,
        duration_minutes: data.duration_minutes,
        is_free: data.is_free,
        price: data.price,
        certificate_enabled: data.certificate_enabled,
        thumbnail_url: data.thumbnail_url,
        summary: data.summary,
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value, 10) : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        toast.error("Title is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.description?.trim()) {
        toast.error("Description is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.difficulty_level?.trim()) {
        toast.error("Difficulty level is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.category?.trim()) {
        toast.error("Category is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.duration_minutes || formData.duration_minutes <= 0) {
        toast.error("Valid duration is required");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.summary?.trim()) {
        toast.error("Summary is required");
        setIsSubmitting(false);
        return;
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        duration_minutes: formData.duration_minutes,
        is_free: formData.is_free ?? true,
        summary: formData.summary,
        price: formData.is_free ? 0 : formData.price ?? 0,
        certificate_enabled: formData.certificate_enabled ?? false,
        thumbnail_url: formData.thumbnail_url,
        creator_id: user?.id
      };

      let result;
      
      if (courseId) {
        // Update existing course
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success("Course updated successfully!");
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success("Course created successfully!");
      }
      
      // Redirect to courses list
      navigate('/creator/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error("Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreatorLayout title={courseId ? 'Edit Course' : 'Create New Course'}>
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link to="/creator/courses" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{courseId ? 'Edit Course' : 'Create New Course'}</CardTitle>
          <CardDescription>Fill in the details for your course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="Enter course title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Enter course description"
                required
              />
            </div>

            {/* Summary */}
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary || ''}
                onChange={handleChange}
                placeholder="Enter course summary"
                required
              />
            </div>

            {/* Difficulty Level */}
            <div>
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select onValueChange={(value) => handleSelectChange('difficulty_level', value)} defaultValue={formData.difficulty_level || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleSelectChange('category', value)} defaultValue={formData.category || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Personal Development">Personal Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Minutes */}
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                value={formData.duration_minutes || ''}
                onChange={handleNumberChange}
                placeholder="Enter duration in minutes"
                required
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                type="text"
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url || ''}
                onChange={handleChange}
                placeholder="Enter thumbnail URL"
              />
            </div>

            <Separator />

            {/* Is Free */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free">Is Free</Label>
              <Switch
                id="is_free"
                name="is_free"
                checked={formData.is_free ?? false}
                onCheckedChange={(checked) => handleSwitchChange('is_free', checked)}
              />
            </div>

            {/* Price (only show if not free) */}
            {!formData.is_free && (
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleNumberChange}
                  placeholder="Enter price"
                />
              </div>
            )}

            {/* Certificate Enabled */}
            <div className="flex items-center justify-between">
              <Label htmlFor="certificate_enabled">Certificate Enabled</Label>
              <Switch
                id="certificate_enabled"
                name="certificate_enabled"
                checked={formData.certificate_enabled ?? false}
                onCheckedChange={(checked) => handleSwitchChange('certificate_enabled', checked)}
              />
            </div>

            <div className="flex gap-4">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Submitting...' : 'Save Course'}
              </Button>
              
              {courseId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(`/creator/courses/${courseId}/content`)}
                >
                  Course Content
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseForm;
