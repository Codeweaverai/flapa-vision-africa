
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';

// Define MediaPost type
interface MediaPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  post_type: string;
  media_url?: string;
  image_url?: string;
  category?: string;
  duration_minutes?: number;
  is_published: boolean;
  author_id?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Define form schema
const mediaFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  summary: z.string().optional(),
  post_type: z.string().min(1, { message: 'Post type is required' }),
  media_url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  image_url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  category: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  is_published: z.boolean().default(false),
});

type MediaFormValues = z.infer<typeof mediaFormSchema>;

const POST_TYPES = ['article', 'video', 'podcast', 'interview', 'resource'];
const CATEGORIES = ['Technology', 'Business', 'Health', 'Education', 'Lifestyle', 'Personal Development', 'Other'];

const AdminMediaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  
  // Initialize form
  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaFormSchema),
    defaultValues: {
      title: '',
      content: '',
      summary: '',
      post_type: 'article',
      media_url: '',
      image_url: '',
      category: '',
      duration_minutes: undefined,
      is_published: false,
    },
  });

  // Load media post if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchMediaPost = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('media_posts')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          // Set form values from data
          form.reset({
            title: data.title,
            content: data.content,
            summary: data.summary || '',
            post_type: data.post_type,
            media_url: data.media_url || '',
            image_url: data.image_url || '',
            category: data.category || '',
            duration_minutes: data.duration_minutes || undefined,
            is_published: data.is_published,
          });
        } catch (error) {
          console.error('Error fetching media post:', error);
          toast.error('Failed to load media post');
          navigate('/admin/media');
        } finally {
          setLoading(false);
        }
      };
      
      fetchMediaPost();
    }
  }, [id, isEditing, form, navigate]);

  const onSubmit = async (values: MediaFormValues) => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create or edit media');
        return;
      }
      
      const mediaData = {
        title: values.title,
        content: values.content,
        summary: values.summary || null,
        post_type: values.post_type,
        media_url: values.media_url || null,
        image_url: values.image_url || null,
        category: values.category || null,
        duration_minutes: values.duration_minutes || null,
        is_published: values.is_published,
        author_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      if (isEditing) {
        // Update existing post
        const { error } = await supabase
          .from('media_posts')
          .update(mediaData)
          .eq('id', id);
        
        if (error) throw error;
        
        toast.success('Media post updated successfully');
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('media_posts')
          .insert({ ...mediaData, published_at: values.is_published ? new Date().toISOString() : null })
          .select();
        
        if (error) throw error;
        
        toast.success('Media post created successfully');
      }
      
      navigate('/admin/media');
    } catch (error) {
      console.error('Error saving media post:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} media post`);
    } finally {
      setLoading(false);
    }
  };

  const postType = form.watch('post_type');

  return (
    <AdminLayout title={isEditing ? "Edit Media" : "Create Media"}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Media Post' : 'Create New Media Post'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update your media post details below' 
              : 'Enter the details for your new media post'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter media title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="post_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select media type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POST_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief summary of your content" 
                        className="min-h-[80px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This will appear in listings and previews
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your content here" 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(postType === 'video' || postType === 'podcast') && (
                <FormField
                  control={form.control}
                  name="media_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{postType === 'video' ? 'Video URL' : 'Audio URL'}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={`Enter ${postType === 'video' ? 'video' : 'audio'} URL`} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {postType === 'video' 
                          ? 'YouTube, Vimeo or direct video URL' 
                          : 'SoundCloud, Spotify or direct audio URL'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(postType === 'video' || postType === 'podcast') && (
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Media duration in minutes" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(!isNaN(value) ? value : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter image URL" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish</FormLabel>
                      <FormDescription>
                        Make this {postType} visible to visitors
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/media')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Media' : 'Create Media'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminMediaForm;
