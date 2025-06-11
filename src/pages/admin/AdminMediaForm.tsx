
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
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnail-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);

      setPost(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleMediaUpload = async (file: File) => {
    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `media-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(fileName);

      setPost(prev => ({ ...prev, media_url: publicUrl }));
      toast.success('Media file uploaded successfully!');
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media file');
    } finally {
      setUploadingMedia(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/admin/media')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Media
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                {postId && postId !== 'new' ? 'Edit Media Post' : 'Create Media Post'}
              </h1>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-orange-500 to-purple-600">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Media Post Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={post.title}
                    onChange={(e) => setPost({ ...post, title: e.target.value })}
                    placeholder="Enter post title"
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post_type">Post Type</Label>
                  <Select value={post.post_type} onValueChange={(value) => setPost({ ...post, post_type: value })}>
                    <SelectTrigger className="border-orange-200 focus:border-orange-500">
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="infographic">Infographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={post.category || ''} onValueChange={(value) => setPost({ ...post, category: value })}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500">
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
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={post.duration_minutes || ''}
                      onChange={(e) => setPost({ ...post, duration_minutes: parseInt(e.target.value) || undefined })}
                      placeholder="Duration in minutes"
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={post.summary}
                  onChange={(e) => setPost({ ...post, summary: e.target.value })}
                  placeholder="Brief summary of the post"
                  rows={3}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={post.content}
                  onChange={(e) => setPost({ ...post, content: e.target.value })}
                  placeholder="Full content of the post"
                  rows={8}
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Thumbnail Image</Label>
                  <FileUpload
                    onFileSelect={handleThumbnailUpload}
                    accept="image/*"
                    buttonText={uploadingThumbnail ? "Uploading..." : "Upload Thumbnail"}
                    disabled={uploadingThumbnail}
                  />
                  {post.image_url && (
                    <div className="mt-2">
                      <img
                        src={post.image_url}
                        alt="Post thumbnail"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-orange-200"
                      />
                    </div>
                  )}
                </div>

                {(post.post_type === 'video' || post.post_type === 'podcast') && (
                  <div className="space-y-2">
                    <Label>Media File</Label>
                    <FileUpload
                      onFileSelect={handleMediaUpload}
                      accept={post.post_type === 'video' ? 'video/*' : 'audio/*'}
                      buttonText={uploadingMedia ? "Uploading..." : `Upload ${post.post_type === 'video' ? 'Video' : 'Audio'}`}
                      disabled={uploadingMedia}
                    />
                    {post.media_url && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                          ✓ Media file uploaded successfully
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={post.is_published}
                  onCheckedChange={(checked) => setPost({ ...post, is_published: checked })}
                />
                <Label htmlFor="is_published" className="font-medium">
                  Publish Post
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMediaForm;
