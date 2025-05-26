
import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Course, 
  VALID_DIFFICULTY_LEVELS, 
  createCourseWithCreator, 
  updateCourse, 
  fetchCourseById 
} from '@/services/courseService';

const AdminCourseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: courseId } = useParams<{ id?: string }>();
  const isEditing = !!courseId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty_level: '',
    category: '',
    duration_minutes: 0,
    is_free: true,
    price: 0,
    certificate_enabled: false,
    thumbnail_url: '',
    summary: '',
    is_published: false,
    tags: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && courseId) {
      loadCourseData();
    }
  }, [isEditing, courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      const course = await fetchCourseById(courseId);
      if (course) {
        setFormData({
          title: course.title || '',
          description: course.description || '',
          difficulty_level: course.difficulty_level || '',
          category: course.category || '',
          duration_minutes: course.duration_minutes || 0,
          is_free: course.is_free ?? true,
          price: course.price || 0,
          certificate_enabled: course.certificate_enabled ?? false,
          thumbnail_url: course.thumbnail_url || '',
          summary: course.summary || '',
          is_published: course.is_published ?? false,
          tags: course.tags || []
        });

        if (course.thumbnail_url) {
          setThumbnailPreview(course.thumbnail_url);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course data');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnail_url: '' }));
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return formData.thumbnail_url || null;

    try {
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('courses')
        .upload(filePath, thumbnailFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('courses')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error("Title is required");
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error("Description is required");
        return;
      }
      
      if (!formData.difficulty_level.trim()) {
        toast.error("Difficulty level is required");
        return;
      }
      
      if (!formData.category.trim()) {
        toast.error("Category is required");
        return;
      }
      
      if (!formData.duration_minutes || formData.duration_minutes <= 0) {
        toast.error("Valid duration is required");
        return;
      }
      
      if (!formData.summary.trim()) {
        toast.error("Summary is required");
        return;
      }

      // Upload thumbnail if provided
      const thumbnailUrl = await uploadThumbnail();

      const courseData = {
        title: formData.title,
        description: formData.description,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        duration_minutes: formData.duration_minutes,
        is_free: formData.is_free,
        summary: formData.summary,
        price: formData.is_free ? 0 : formData.price,
        certificate_enabled: formData.certificate_enabled,
        thumbnail_url: thumbnailUrl || '',
        is_published: formData.is_published,
        tags: formData.tags
      };

      let result;
      
      if (isEditing && courseId) {
        // Update existing course
        result = await updateCourse(courseId, courseData);
        if (result) {
          toast.success("Course updated successfully!");
        }
      } else {
        // Create new course
        result = await createCourseWithCreator(courseData, user?.id || '');
        if (result) {
          toast.success("Course created successfully!");
        }
      }
      
      if (result) {
        // Redirect to courses list
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error("Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title={isEditing ? 'Edit Course' : 'Create New Course'}>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</CardTitle>
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
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter course title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter course description"
                required
              />
            </div>

            {/* Summary */}
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Enter course summary"
                required
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <Label htmlFor="thumbnail">Course Thumbnail</Label>
              <div className="space-y-4">
                {thumbnailPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="max-h-40 rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeThumbnail}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="thumbnail" className="cursor-pointer">
                        <span className="text-sm text-gray-600">Click to upload thumbnail</span>
                      </Label>
                    </div>
                  </div>
                )}
                
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select onValueChange={(value) => handleChange('difficulty_level', value)} value={formData.difficulty_level}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleChange('category', value)} value={formData.category}>
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
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
                placeholder="Enter duration in minutes"
                required
              />
            </div>

            <Separator />

            {/* Is Free */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free">Is Free</Label>
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => handleChange('is_free', checked)}
              />
            </div>

            {/* Price (only show if not free) */}
            {!formData.is_free && (
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="Enter price"
                />
              </div>
            )}

            {/* Certificate Enabled */}
            <div className="flex items-center justify-between">
              <Label htmlFor="certificate_enabled">Certificate Enabled</Label>
              <Switch
                id="certificate_enabled"
                checked={formData.certificate_enabled}
                onCheckedChange={(checked) => handleChange('certificate_enabled', checked)}
              />
            </div>

            {/* Is Published */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_published">Published</Label>
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => handleChange('is_published', checked)}
              />
            </div>

            <div className="flex gap-4">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
              </Button>
              
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(`/admin/courses/${courseId}/content`)}
                >
                  Manage Content
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCourseForm;
