
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getMediaPostById, MediaPostWithCategories } from '@/services/mediaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, Mic, Clock, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MediaPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<MediaPostWithCategories | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (!id) {
          navigate('/media');
          return;
        }

        setLoading(true);
        const data = await getMediaPostById(id);
        
        if (!data) {
          toast.error('Post not found');
          navigate('/media');
          return;
        }

        if (!data.is_published) {
          toast.error('This post is not currently published');
          navigate('/media');
          return;
        }

        setPost(data);
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('Failed to load media post');
        navigate('/media');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="section-container">
          <div className="text-center py-20">
            <h2 className="heading-md">Post not found</h2>
            <Button onClick={() => navigate('/media')} className="mt-4">
              Back to Media
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const formattedDate = post.published_at 
    ? format(new Date(post.published_at), 'MMMM dd, yyyy')
    : '';

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <Button variant="outline" onClick={() => navigate('/media')} className="mb-6 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Media
        </Button>

        <div className="mb-8">
          <h1 className="heading-lg mb-4">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            {post.post_type === 'news' && <FileText className="h-4 w-4" />}
            {post.post_type === 'podcast' && <Mic className="h-4 w-4" />}
            {post.post_type === 'resource' && <FileDown className="h-4 w-4" />}
            <span className="capitalize">{post.post_type}</span>
            
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formattedDate}
            </span>

            {post.duration_minutes && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {post.duration_minutes} minutes
              </span>
            )}
          </div>
        </div>

        {post.image_url && (
          <div className="mb-8">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full max-h-96 object-cover rounded-lg" 
            />
          </div>
        )}

        <Card className="mb-8">
          <CardContent className="p-6">
            {/* Render content with proper formatting */}
            <div className="prose prose-lg max-w-none">
              {post.content.split('\n').map((paragraph, index) => (
                paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </CardContent>
        </Card>

        {post.post_type === 'podcast' && post.media_url && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Listen to the Podcast</CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full">
                <source src={post.media_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}

        {post.post_type === 'resource' && post.media_url && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <Button asChild className="w-full md:w-auto flex items-center">
                <a href={post.media_url} target="_blank" rel="noopener noreferrer" download>
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Resource
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            <span className="text-muted-foreground mr-2">Categories:</span>
            {post.categories.map(category => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MediaPostDetailPage;
