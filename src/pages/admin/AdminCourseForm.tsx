
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Course, 
  createCourse, 
  updateCourse, 
  fetchCourseById, 
  VALID_CATEGORIES, 
  VALID_DIFFICULTY_LEVELS 
} from '@/services/courseService';

const AdminCourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
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
    certificate_enabled: false,
    thumbnail_url: '',
    tags: [] as string[],
    is_published: false
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      loadCourse();
    }
  }, [isEditing, id]);

  const loadCourse = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const courseData = await fetchCourseById(id);
      if (courseData) {
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          description: courseData.description,
          summary: courseData.summary,
          category: courseData.category,
          difficulty_level: courseData.difficulty_level,
          duration_minutes: courseData.duration_minutes,
          price: courseData.price,
          currency: courseData.currency || 'USD',
          is_free: courseData.is_free,
          certificate_enabled: courseData.certificate_enabled,
          thumbnail_url: courseData.thumbnail_url || '',
          tags: courseData.tags || [],
          is_published: courseData.is_published
        });
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        currency: formData.currency,
        is_free: formData.is_free,
        certificate_enabled: formData.certificate_enabled,
        thumbnail_url: formData.thumbnail_url,
        tags: formData.tags,
        is_published: formData.is_published
      };

      let result;
      if (isEditing && id) {
        result = await updateCourse(id, courseData);
      } else {
        result = await createCourse(courseData);
      }

      if (result) {
        toast.success(`Course ${isEditing ? 'updated' : 'created'} successfully`);
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} course`);
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

  if (loading && isEditing) {
    return (
      <AdminLayout title={isEditing ? 'Edit Course' : 'Create Course'}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Course' : 'Create Course'}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update course information' : 'Create a new course for your platform'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange('difficulty_level', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  placeholder="120"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief summary of the course"
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed course description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={formData.is_free}
                    onChange={(e) => handleInputChange('is_free', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is_free">Free Course</Label>
                </div>
              </div>

              {!formData.is_free && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="99.99"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
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
              <Label>Course Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="certificate_enabled"
                  checked={formData.certificate_enabled}
                  onChange={(e) => handleInputChange('certificate_enabled', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="certificate_enabled">Enable Certificates</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_published">Publish Course</Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/courses')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCourseForm;
