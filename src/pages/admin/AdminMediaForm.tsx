
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import FileUpload from '@/components/common/FileUpload';

interface MediaPost {
  id?: string;
  title: string;
  content: string;
  summary: string;
  post_type: string;
  category: string;
  media_url?: string;
  image_url?: string;
  duration_minutes?: number;
  is_published: boolean;
  author_id?: string;
}

const AdminMediaForm = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<MediaPost>({
    title: '',
    content: '',
    summary: '',
    post_type: 'article',
    category: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (postId && postId !== 'new') {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load media post');
      navigate('/admin/media');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!post.title || !post.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...post,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (postId && postId !== 'new') {
        result = await supabase
          .from('media_posts')
          .update(postData)
          .eq('id', postId);
      } else {
        result = await supabase
          .from('media_posts')
          .insert([{
            ...postData,
            created_at: new Date().toISOString(),
            published_at: post.is_published ? new Date().toISOString() : null,
          }]);
      }

      if (result.error) throw result.error;

      toast.success(`Media post ${postId && postId !== 'new' ? 'updated' : 'created'} successfully!`);
      navigate('/admin/media');
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save media post');
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = (url: string, path: string) => {
    setPost(prev => ({ ...prev, image_url: url }));
  };

  const handleMediaUpload = (url: string, path: string) => {
    setPost(prev => ({ ...prev, media_url: url }));
  };

  if (loading) {
    return (
      <AdminLayout title={postId && postId !== 'new' ? 'Edit Media Post' : 'Create Media Post'}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={postId && postId !== 'new' ? 'Edit Media Post' : 'Create Media Post'}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/admin/media')} className="hover:bg-orange-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Media
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-b border-orange-200/50">
            <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Media Post Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-orange-700 font-medium">Title *</Label>
                <Input
                  id="title"
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                  placeholder="Enter post title"
                  className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post_type" className="text-purple-700 font-medium">Post Type</Label>
                <Select value={post.post_type} onValueChange={(value) => setPost({ ...post, post_type: value })}>
                  <SelectTrigger className="border-purple-300 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue placeholder="Select post type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="infographic">Infographic</SelectItem>
                    <SelectItem value="article">article</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-orange-700 font-medium">Category</Label>
                <Select value={post.category || ''} onValueChange={(value) => setPost({ ...post, category: value })}>
                  <SelectTrigger className="border-orange-300 focus:border-orange-500 focus:ring-orange-200">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(post.post_type === 'video' || post.post_type === 'podcast') && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-purple-700 font-medium">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={post.duration_minutes || ''}
                    onChange={(e) => setPost({ ...post, duration_minutes: parseInt(e.target.value) || undefined })}
                    placeholder="Duration in minutes"
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-orange-700 font-medium">Summary</Label>
              <Textarea
                id="summary"
                value={post.summary}
                onChange={(e) => setPost({ ...post, summary: e.target.value })}
                placeholder="Brief summary of the post"
                rows={3}
                className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-purple-700 font-medium">Content *</Label>
              <Textarea
                id="content"
                value={post.content}
                onChange={(e) => setPost({ ...post, content: e.target.value })}
                placeholder="Full content of the post"
                rows={8}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FileUpload
                  bucket="course-thumbnails"
                  path="thumbnails"
                  accept="image/*"
                  maxSize={5}
                  onUploadComplete={handleThumbnailUpload}
                  existingUrl={post.image_url}
                  label="Thumbnail Image"
                />
              </div>

              {(post.post_type === 'video' || post.post_type === 'podcast') && (
                <div className="space-y-2">
                  <FileUpload
                    bucket="course-thumbnails"
                    path="media"
                    accept={post.post_type === 'video' ? 'video/*' : 'audio/*'}
                    maxSize={100}
                    onUploadComplete={handleMediaUpload}
                    existingUrl={post.media_url}
                    label={`Media File (${post.post_type === 'video' ? 'Video' : 'Audio'})`}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200/50">
              <Switch
                id="is_published"
                checked={post.is_published}
                onCheckedChange={(checked) => setPost({ ...post, is_published: checked })}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600"
              />
              <Label htmlFor="is_published" className="font-medium text-orange-700">
                Publish Post
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMediaForm;
