
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  createMediaPost,
  updateMediaPost,
  getMediaPostById,
  MediaPost
} from '@/services/mediaService';
import { Loader2, ArrowLeft, Save, FileUp } from 'lucide-react';

type FormData = {
  title: string;
  content: string;
  summary?: string;
  post_type: 'news' | 'podcast' | 'resource';
  category?: string;
  duration_minutes?: number;
  is_published: boolean;
};

const MediaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Initialize form with default values
  const defaultPostType = location.state?.type || 'news';
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      post_type: defaultPostType,
      is_published: true,
    }
  });
  
  const postType = watch('post_type');
  const category = watch('category');
  const isEditing = !!id;

  // Load post data if editing
  useEffect(() => {
    const loadPostData = async () => {
      if (id) {
        setLoading(true);
        try {
          const post = await getMediaPostById(id);
          if (post) {
            reset({
              title: post.title,
              content: post.content,
              summary: post.summary,
              post_type: post.post_type as 'news' | 'podcast' | 'resource',
              category: post.category,
              duration_minutes: post.duration_minutes,
              is_published: post.is_published
            });
            
            if (post.image_url) {
              setImagePreview(post.image_url);
            }
          } else {
            toast.error('Failed to load post data');
            navigate('/admin/media');
          }
        } catch (error) {
          console.error('Error loading post:', error);
          toast.error('Failed to load post data');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isEditing) {
      loadPostData();
    }
  }, [id, navigate, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      toast.info(`Selected file: ${file.name}`);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let result;
      
      if (isEditing && id) {
        result = await updateMediaPost(
          id, 
          data, 
          imageFile || undefined, 
          mediaFile || undefined
        );
      } else {
        result = await createMediaPost(
          data, 
          imageFile || undefined, 
          mediaFile || undefined
        );
      }
      
      if (result) {
        navigate('/admin/media');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Media Post' : 'Create Media Post'}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading post data...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Media Post' : 'Create Media Post'}>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/media')} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Media
        </Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="Enter post title"
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary (Optional)</Label>
                  <Textarea
                    id="summary"
                    {...register('summary')}
                    placeholder="Enter a brief summary"
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post_type">Post Type *</Label>
                  <Select
                    value={postType}
                    onValueChange={(value) => setValue('post_type', value as 'news' | 'podcast' | 'resource')}
                    disabled={isEditing} // Don't allow changing post type when editing
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">News Article</SelectItem>
                      <SelectItem value="podcast">Podcast Episode</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="artificial-intelligence">Artificial Intelligence</SelectItem>
                      <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="professional-development">Professional Development</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {postType === 'podcast' && (
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      {...register('duration_minutes', { 
                        valueAsNumber: true,
                        min: { value: 1, message: 'Duration must be at least 1 minute' }
                      })}
                      placeholder="Enter podcast duration"
                    />
                    {errors.duration_minutes && <p className="text-sm text-red-500">{errors.duration_minutes.message}</p>}
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="is_published"
                    checked={watch('is_published')}
                    onCheckedChange={(checked) => setValue('is_published', !!checked)}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">Publish immediately</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Thumbnail Image</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4">
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-md mb-2" 
                        />
                        <Button type="button" size="sm" variant="outline" onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}>
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="image-input" className="cursor-pointer flex flex-col items-center justify-center w-full h-40">
                        <FileUp className="h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Click to upload image</p>
                        <input
                          id="image-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {(postType === 'podcast' || postType === 'resource') && (
                  <div className="space-y-2">
                    <Label htmlFor="media">
                      {postType === 'podcast' ? 'Audio File' : 'Resource File'}
                    </Label>
                    <div className="flex items-center border-2 border-dashed border-gray-300 rounded-md p-4">
                      <label htmlFor="media-input" className="cursor-pointer flex items-center justify-center w-full">
                        <FileUp className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {mediaFile ? `Selected: ${mediaFile.name}` : `Upload ${postType === 'podcast' ? 'audio' : 'file'}`}
                        </span>
                        <input
                          id="media-input"
                          type="file"
                          accept={postType === 'podcast' ? "audio/*" : "*/*"}
                          className="hidden"
                          onChange={handleMediaChange}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register('content', { required: 'Content is required' })}
                placeholder="Enter post content"
                className="resize-none"
                rows={10}
              />
              {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
            </div>

            <div className="mt-6 flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AdminLayout>
  );
};

export default MediaForm;
