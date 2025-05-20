import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getMediaPosts, deleteMediaPost, MediaPost } from '@/services/mediaService';
import { Pencil, Trash, Plus, FileText, Mic, Files } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const AdminMedia = () => {
  const navigate = useNavigate();
  const [newsPosts, setNewsPosts] = useState<MediaPost[]>([]);
  const [podcastPosts, setPodcastPosts] = useState<MediaPost[]>([]);
  const [resourcePosts, setResourcePosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState({
    news: true,
    podcasts: true,
    resources: true
  });

  const loadPosts = async () => {
    try {
      setLoading({ news: true, podcasts: true, resources: true });
      
      // Load all three types in parallel
      const [newsData, podcastData, resourceData] = await Promise.all([
        getMediaPosts('news', true),
        getMediaPosts('podcast', true),
        getMediaPosts('resource', true)
      ]);
      
      setNewsPosts(newsData);
      setPodcastPosts(podcastData);
      setResourcePosts(resourceData);
    } catch (error) {
      console.error('Error loading media posts:', error);
      toast.error('Failed to load some media content');
    } finally {
      setLoading({ news: false, podcasts: false, resources: false });
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleEdit = (post: MediaPost) => {
    navigate(`/admin/media/edit/${post.id}`);
  };

  const handleDelete = async (post: MediaPost) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      const success = await deleteMediaPost(post.id);
      if (success) {
        // Refresh the posts list
        loadPosts();
      }
    }
  };

  const handleCreate = (type: 'news' | 'podcast' | 'resource') => {
    navigate(`/admin/media/create`, { state: { type } });
  };

  const formatCategoryName = (category: string | undefined): string => {
    if (!category) return '';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderPostCard = (post: MediaPost) => {
    const isPublished = post.is_published;
    const timeAgo = formatDistanceToNow(new Date(post.published_at), { addSuffix: true });
    
    return (
      <Card key={post.id} className="overflow-hidden mb-4">
        <div className="md:flex">
          {post.image_url && (
            <div className="relative w-full md:w-64 h-48 bg-muted">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <div className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-2">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {!isPublished && <Badge variant="outline" className="bg-amber-100 text-amber-800">Draft</Badge>}
                    {post.category && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-800">
                        {formatCategoryName(post.category)}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{timeAgo}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2">{post.summary}</p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(post)}>
                <Trash className="h-4 w-4 mr-2" /> Delete
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AdminLayout title="Media Management">
      <Tabs defaultValue="news">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="news" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" /> News
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="flex items-center">
              <Mic className="h-4 w-4 mr-2" /> Podcasts
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center">
              <Files className="h-4 w-4 mr-2" /> Resources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="news">
          <div className="mb-4">
            <Button onClick={() => handleCreate('news')} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Create News Article
            </Button>
          </div>
          
          {loading.news ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading news articles...</p>
            </div>
          ) : newsPosts.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No news articles found. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            newsPosts.map(post => renderPostCard(post))
          )}
        </TabsContent>

        <TabsContent value="podcasts">
          <div className="mb-4">
            <Button onClick={() => handleCreate('podcast')} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Create Podcast
            </Button>
          </div>
          
          {loading.podcasts ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading podcasts...</p>
            </div>
          ) : podcastPosts.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No podcasts found. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            podcastPosts.map(post => renderPostCard(post))
          )}
        </TabsContent>

        <TabsContent value="resources">
          <div className="mb-4">
            <Button onClick={() => handleCreate('resource')} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" /> Create Resource
            </Button>
          </div>
          
          {loading.resources ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading resources...</p>
            </div>
          ) : resourcePosts.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No resources found. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            resourcePosts.map(post => renderPostCard(post))
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminMedia;
