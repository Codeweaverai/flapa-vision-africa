import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Course, updateCourse, createCourseWithCreator } from '@/services/courseService';

const CourseForm = () => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    summary: '',
    description: '',
    duration_minutes: 60,
    category: 'Technology',
    difficulty_level: 'Beginner',
    is_free: false,
    price: 0,
    certificate_enabled: false,
    is_published: false,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourse = async () => {
      if (courseId) {
        setIsEditing(true);
        try {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setCourse(data);
          }
        } catch (error: any) {
          console.error("Error fetching course:", error.message);
          toast.error("Failed to fetch course data.");
        }
      }
    };

    loadCourse();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourse(prevCourse => ({
      ...prevCourse,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourse(prevCourse => ({
      ...prevCourse,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setCourse(prevCourse => ({
      ...prevCourse,
      [name]: checked
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setThumbnailFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Not authenticated');
        return;
      }

      // First upload thumbnail if exists
      let thumbnailUrl = course.thumbnail_url;
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `courses/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('course-materials')
          .upload(filePath, thumbnailFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('course-materials')
          .getPublicUrl(filePath);

        thumbnailUrl = urlData.publicUrl;
      }

      if (isEditing && courseId) {
        // Update existing course
        const result = await updateCourse(courseId, {
          ...course,
          thumbnail_url: thumbnailUrl
        });

        if (result) {
          toast.success('Course updated successfully!');
          navigate('/admin/courses');
        }
      } else {
        // Create new course, making sure all required fields are included
        const result = await createCourseWithCreator({
          title: course.title!,
          summary: course.summary!,
          description: course.description!,
          duration_minutes: course.duration_minutes!,
          category: course.category!,
          difficulty_level: course.difficulty_level!,
          is_free: course.is_free,
          price: course.price,
          is_published: course.is_published,
          certificate_enabled: course.certificate_enabled,
          thumbnail_url: thumbnailUrl
        }, user.user.id);

        if (result) {
          toast.success('Course created successfully!');
          navigate('/admin/courses');
        }
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Error saving course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="section-container">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={course.title || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Input
                  type="text"
                  id="summary"
                  name="summary"
                  value={course.summary || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={course.description || ''}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  value={course.duration_minutes || 60}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" defaultValue={course.category || 'Technology'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty_level">Difficulty Level</Label>
                <Select onValueChange={(value) => handleSelectChange('difficulty_level', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" defaultValue={course.difficulty_level || 'Beginner'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="is_free">Is Free</Label>
                <Switch
                  id="is_free"
                  name="is_free"
                  checked={course.is_free || false}
                  onCheckedChange={(checked) => handleSwitchChange('is_free', checked)}
                />
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  type="number"
                  id="price"
                  name="price"
                  value={course.price || 0}
                  onChange={handleChange}
                  disabled={course.is_free}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="certificate_enabled">Certificate Enabled</Label>
                <Switch
                  id="certificate_enabled"
                  name="certificate_enabled"
                  checked={course.certificate_enabled || false}
                  onCheckedChange={(checked) => handleSwitchChange('certificate_enabled', checked)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="is_published">Is Published</Label>
                <Switch
                  id="is_published"
                  name="is_published"
                  checked={course.is_published || false}
                  onCheckedChange={(checked) => handleSwitchChange('is_published', checked)}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">Thumbnail</Label>
                <Input
                  type="file"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
                {course.thumbnail_url && typeof course.thumbnail_url === 'string' && (
                  <img src={course.thumbnail_url} alt="Thumbnail" className="mt-2 max-h-40" />
                )}
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  isEditing ? 'Update Course' : 'Create Course'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CourseForm;
