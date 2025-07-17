
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import FileUpload from '@/components/common/FileUpload';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  is_published: boolean;
  certificate_enabled: boolean;
}

const CreatorCourseEdit = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user]);

  const fetchCourse = async () => {
    if (!courseId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('creator_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course');
        navigate('/creator/courses');
        return;
      }
      
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/creator/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!course || !courseId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          summary: course.summary,
          category: course.category,
          price: course.price,
          is_free: course.is_free,
          difficulty_level: course.difficulty_level,
          duration_minutes: course.duration_minutes,
          thumbnail_url: course.thumbnail_url,
          is_published: course.is_published,
          certificate_enabled: course.certificate_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      toast.success('Course updated successfully!');
      navigate('/creator/courses');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = (url: string, path: string) => {
    if (course) {
      setCourse({ ...course, thumbnail_url: url });
      toast.success('Thumbnail uploaded successfully!');
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </CreatorLayout>
    );
  }

  if (!course) {
    return (
      <CreatorLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
          <Button onClick={() => navigate('/creator/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/creator/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  placeholder="Enter course title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={course.category} onValueChange={(value) => setCourse({ ...course, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Fitness">Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={course.difficulty_level} onValueChange={(value) => setCourse({ ...course, difficulty_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={course.duration_minutes}
                  onChange={(e) => setCourse({ ...course, duration_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="Duration in minutes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Course Summary</Label>
              <Textarea
                id="summary"
                value={course.summary}
                onChange={(e) => setCourse({ ...course, summary: e.target.value })}
                placeholder="Brief description of the course"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                placeholder="Detailed description of the course"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <FileUpload
                bucket="course-thumbnails"
                path="thumbnails"
                accept="image/*"
                maxSize={5}
                onUploadComplete={handleThumbnailUpload}
                existingUrl={course.thumbnail_url}
                label="Course Thumbnail"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_free"
                  checked={course.is_free}
                  onCheckedChange={(checked) => setCourse({ ...course, is_free: checked, price: checked ? 0 : course.price })}
                />
                <Label htmlFor="is_free">Free Course</Label>
              </div>

              {!course.is_free && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Course price"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="certificate_enabled"
                checked={course.certificate_enabled}
                onCheckedChange={(checked) => setCourse({ ...course, certificate_enabled: checked })}
              />
              <Label htmlFor="certificate_enabled">Enable Certificates</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={course.is_published}
                onCheckedChange={(checked) => setCourse({ ...course, is_published: checked })}
              />
              <Label htmlFor="is_published">Publish Course</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseEdit;
