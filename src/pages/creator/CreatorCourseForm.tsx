import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  createCourse, 
  updateCourse, 
  fetchCourseById,
  VALID_CATEGORIES,
  VALID_DIFFICULTY_LEVELS 
} from '@/services/courseService';
import { fetchUserWorkplaces, type UserWorkplace } from '@/services/workplaceService';
import { ArrowLeft, Building2 } from 'lucide-react';

const CreatorCourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    summary: '',
    category: 'Technology',
    difficulty_level: 'Beginner',
    duration_minutes: 60,
    price: 99,
    currency: 'USD',
    is_free: false,
    is_published: false,
    certificate_enabled: false,
    thumbnail_url: '',
    tags: []
  });
  const [loading, setLoading] = useState(false);

  const [workplaces, setWorkplaces] = useState<UserWorkplace[]>([]);
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
  };

  useEffect(() => {
    loadWorkplaces();
    if (isEdit && id) {
      loadCourse();
    }
  }, [isEdit, id]);

  const loadWorkplaces = async () => {
    const userWorkplaces = await fetchUserWorkplaces();
    setWorkplaces(userWorkplaces);
  };

  const loadCourse = async () => {
    if (!id) return;
    
    try {
      const course = await fetchCourseById(id);
      if (course) {
        setFormData({
          title: course.title,
          description: course.description,
          summary: course.summary,
          category: course.category,
          difficulty_level: course.difficulty_level,
          duration_minutes: course.duration_minutes,
          price: course.price,
          currency: course.currency || 'USD',
          is_free: course.is_free,
          is_published: course.is_published,
          certificate_enabled: course.certificate_enabled,
          thumbnail_url: course.thumbnail_url || '',
          tags: course.tags || []
        });
        setSelectedWorkplace(course.creator_id || '');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const courseData = {
        ...formData,
        price: formData.is_free ? 0 : formData.price,
        currency: formData.is_free ? null : (formData.currency || 'USD')
      };

      if (isEdit && id) {
        await updateCourse(id, courseData);
        toast.success('Course updated successfully');
      } else {
        await createCourse(courseData);
        toast.success('Course created successfully');
      }
      
      navigate('/creator/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/creator/courses')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workspace Selection */}
            <div className="space-y-2">
              <Label htmlFor="workplace">
                <Building2 className="h-4 w-4 inline mr-2" />
                Workspace (Optional)
              </Label>
              <Select value={selectedWorkplace} onValueChange={setSelectedWorkplace}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace or leave empty for personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Personal (No Workspace)</SelectItem>
                  {workplaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center gap-2">
                        <span>{workspace.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {workspace.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Assign this course to a workspace to allow collaborative editing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter course title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter course description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Enter course summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => handleSelectChange('difficulty_level', value)}
              >
                <SelectTrigger>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="is_free">Free Course</Label>
              <Switch
                id="is_free"
                name="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => handleSwitchChange('is_free', checked)}
              />
            </div>

            {!formData.is_free && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter course price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="is_published">Publish Course</Label>
              <Switch
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => handleSwitchChange('is_published', checked)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="certificate_enabled">Enable Certificate</Label>
              <Switch
                id="certificate_enabled"
                name="certificate_enabled"
                checked={formData.certificate_enabled}
                onCheckedChange={(checked) => handleSwitchChange('certificate_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            variant="secondary"
            onClick={() => navigate('/creator/courses')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="ml-4"
          >
            {loading ? 'Saving...' : 'Save Course'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatorCourseForm;
