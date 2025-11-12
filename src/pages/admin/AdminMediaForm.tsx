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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Upload, Eye, Clock, Languages, Star } from 'lucide-react';
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
  
  // New SEO and enhanced fields
  meta_description?: string;
  seo_title?: string;
  reading_time?: number;
  view_count?: number;
  updated_by?: string;
  last_updated_at?: string;
  featured: boolean;
  language: string;
  tags?: string[];
  guest_names?: string;
  episode_number?: string;
  series_name?: string;
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
    featured: false,
    language: 'en',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

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

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleContentChange = (content: string) => {
    const readingTime = calculateReadingTime(content);
    setPost(prev => ({ 
      ...prev, 
      content,
      reading_time: readingTime 
    }));
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
        last_updated_at: new Date().toISOString(),
        reading_time: post.reading_time || calculateReadingTime(post.content),
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
            view_count: 0,
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

  const addTag = () => {
    if (tagInput.trim() && !post.tags?.includes(tagInput.trim())) {
      setPost(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-b border-orange-200/50">
                <CardTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Basic Information
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
                    <Label htmlFor="seo_title" className="text-purple-700 font-medium">
                      SEO Title
                      <span className="text-sm text-slate-500 ml-2">(Optional - defaults to title)</span>
                    </Label>
                    <Input
                      id="seo_title"
                      value={post.seo_title || ''}
                      onChange={(e) => setPost({ ...post, seo_title: e.target.value })}
                      placeholder="Custom SEO title"
                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post_type" className="text-purple-700 font-medium">Post Type</Label>
                    <Select value={post.post_type} onValueChange={(value) => setPost({ ...post, post_type: value })}>
                      <SelectTrigger className="border-purple-300 focus:border-purple-500 focus:ring-purple-200">
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
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
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Innovation">Innovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(post.post_type === 'video' || post.post_type === 'podcast') && (
                    <>
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

                      <div className="space-y-2">
                        <Label htmlFor="guest_names" className="text-orange-700 font-medium">Guest Names</Label>
                        <Input
                          id="guest_names"
                          value={post.guest_names || ''}
                          onChange={(e) => setPost({ ...post, guest_names: e.target.value })}
                          placeholder="Guest names (comma separated)"
                          className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="episode_number" className="text-purple-700 font-medium">Episode Number</Label>
                        <Input
                          id="episode_number"
                          value={post.episode_number || ''}
                          onChange={(e) => setPost({ ...post, episode_number: e.target.value })}
                          placeholder="e.g., S01E01"
                          className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="series_name" className="text-orange-700 font-medium">Series Name</Label>
                        <Input
                          id="series_name"
                          value={post.series_name || ''}
                          onChange={(e) => setPost({ ...post, series_name: e.target.value })}
                          placeholder="Series or show name"
                          className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                        />
                      </div>
                    </>
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
                  <Label htmlFor="meta_description" className="text-purple-700 font-medium">
                    Meta Description
                    <span className="text-sm text-slate-500 ml-2">(For SEO - recommended: 150-160 characters)</span>
                  </Label>
                  <Textarea
                    id="meta_description"
                    value={post.meta_description || ''}
                    onChange={(e) => setPost({ ...post, meta_description: e.target.value })}
                    placeholder="Meta description for search engines"
                    rows={3}
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                  />
                  <div className="text-sm text-slate-500">
                    {post.meta_description?.length || 0} characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-purple-700 font-medium">Content *</Label>
                  <Textarea
                    id="content"
                    value={post.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Full content of the post"
                    rows={8}
                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-200 font-mono"
                  />
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Estimated reading time: {post.reading_time || calculateReadingTime(post.content)} minutes
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count || 0} views
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Uploads Card */}
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 border-b border-purple-200/50">
                <CardTitle className="bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                  Media Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-b border-orange-200/50">
                <CardTitle className="text-lg bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200/50">
                  <Label htmlFor="is_published" className="font-medium text-orange-700 cursor-pointer">
                    Publish Post
                  </Label>
                  <Switch
                    id="is_published"
                    checked={post.is_published}
                    onCheckedChange={(checked) => setPost({ ...post, is_published: checked })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-purple-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg border border-purple-200/50">
                  <Label htmlFor="featured" className="font-medium text-purple-700 cursor-pointer">
                    <Star className="h-4 w-4 inline mr-2" />
                    Featured Post
                  </Label>
                  <Switch
                    id="featured"
                    checked={post.featured}
                    onCheckedChange={(checked) => setPost({ ...post, featured: checked })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-orange-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO & Organization */}
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-orange-500/10 border-b border-purple-200/50">
                <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                  SEO & Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-purple-700 font-medium">
                    <Languages className="h-4 w-4 inline mr-2" />
                    Language
                  </Label>
                  <Select value={post.language} onValueChange={(value) => setPost({ ...post, language: value })}>
                    <SelectTrigger className="border-purple-300 focus:border-purple-500 focus:ring-purple-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-orange-700 font-medium">Tags</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add tags..."
                        className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                      />
                      <Button type="button" onClick={addTag} variant="outline" className="border-orange-300">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-orange-900"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Information */}
            <Card className="bg-gradient-to-br from-white to-slate-50/30 border-slate-200/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-500/10 to-slate-500/10 border-b border-slate-200/50">
                <CardTitle className="text-lg text-slate-700">
                  Post Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Post Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {post.post_type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Reading Time:</span>
                  <span>{post.reading_time || calculateReadingTime(post.content)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>{post.view_count || 0}</span>
                </div>
                {post.last_updated_at && (
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(post.last_updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMediaForm;
