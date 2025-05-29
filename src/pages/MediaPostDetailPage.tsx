
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Clock, Play } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  post_type: string;
  media_url?: string;
  image_url?: string;
  duration_minutes?: number;
  published_at: string;
  author_id?: string;
}

const MediaPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<MediaPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('media_posts')
          .select(`
            id,
            title,
            content,
            summary,
            category,
            post_type,
            media_url,
            image_url,
            duration_minutes,
            published_at,
            author_id
          `)
          .eq('id', id)
          .eq('is_published', true)
          .single();

        if (error) throw error;

        setPost(data);
      } catch (error) {
        console.error('Error fetching media post:', error);
        toast.error('Failed to load media post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="section-container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="section-container py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Media Post Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The media post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/media">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Media
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="section-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link to="/media">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Media
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(post.published_at)}
                  </div>
                  {post.duration_minutes && (
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {post.duration_minutes} min
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{post.post_type}</Badge>
                  {post.category && (
                    <Badge variant="outline">{post.category}</Badge>
                  )}
                </div>

                {/* Title */}
                <CardTitle className="text-3xl">{post.title}</CardTitle>

                {/* Summary */}
                {post.summary && (
                  <p className="text-lg text-muted-foreground">{post.summary}</p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Featured Image */}
              {post.image_url && (
                <div className="relative">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                  />
                  {post.media_url && post.post_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16"
                        onClick={() => {
                          if (post.media_url) {
                            window.open(post.media_url, '_blank');
                          }
                        }}
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Player */}
              {post.media_url && post.post_type === 'audio' && (
                <div className="bg-muted p-4 rounded-lg">
                  <audio controls className="w-full">
                    <source src={post.media_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Media Link for External Content */}
              {post.media_url && post.post_type !== 'audio' && (
                <div className="border-t pt-6">
                  <Button asChild className="w-full sm:w-auto">
                    <a 
                      href={post.media_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {post.post_type === 'video' ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Watch Video
                        </>
                      ) : (
                        'View Content'
                      )}
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPostDetailPage;
