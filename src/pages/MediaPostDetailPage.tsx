
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Clock, Play, FileText, Headphones, Eye, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactPlayer from 'react-player/lazy';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Media Post Not Found</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  The media post you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
                  <Link to="/media">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Media
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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

  const getPostIcon = () => {
    switch (post.post_type) {
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'podcast':
        return <Headphones className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Check if the media URL is a video that can be played by ReactPlayer
  const isVideoContent = (mediaUrl?: string) => {
    if (!mediaUrl) return false;
    return ReactPlayer.canPlay(mediaUrl) && (
      mediaUrl.includes('youtube') || 
      mediaUrl.includes('vimeo') || 
      mediaUrl.includes('.mp4') || 
      mediaUrl.includes('.webm') || 
      mediaUrl.includes('.mov') ||
      post.post_type === 'video'
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm border-white/40 hover:bg-white/90">
                <Link to="/media">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Media
                </Link>
              </Button>
            </div>

            {/* Main Content */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden">
              {/* Hero Section */}
              <div className="relative">
                {post.image_url ? (
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                ) : (
                  <div className="h-80 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="text-white/80 text-8xl">
                      {getPostIcon()}
                    </div>
                  </div>
                )}
                
                {/* Floating Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                  <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-semibold text-sm px-3 py-1">
                    <span className="mr-2">{getPostIcon()}</span>
                    {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                  </Badge>
                  {post.category && (
                    <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/40 text-gray-800 font-medium">
                      {post.category}
                    </Badge>
                  )}
                </div>
                
                {post.duration_minutes && (
                  <div className="absolute top-6 right-6 bg-black/70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.duration_minutes} min
                  </div>
                )}
              </div>

              <CardHeader className="p-8 pb-6">
                <div className="space-y-6">
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium">{formatDate(post.published_at)}</span>
                    </div>
                    {post.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-medium">{post.duration_minutes} min read/watch</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <CardTitle className="text-4xl font-bold leading-tight bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    {post.title}
                  </CardTitle>

                  {/* Summary */}
                  {post.summary && (
                    <p className="text-xl text-gray-700 leading-relaxed font-medium">{post.summary}</p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-8">
                {/* Media Player Section */}
                {post.media_url && (
                  <div className="bg-gradient-to-br from-orange-50 to-purple-50 p-6 rounded-2xl border border-orange-200">
                    {isVideoContent(post.media_url) ? (
                      <AspectRatio ratio={16 / 9} className="bg-black rounded-xl overflow-hidden">
                        <ReactPlayer
                          url={post.media_url}
                          width="100%"
                          height="100%"
                          controls
                          playing={false}
                          light={post.image_url}
                          playIcon={<div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform"><Play className="h-10 w-10 text-gray-800 ml-1" /></div>}
                        />
                      </AspectRatio>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center">
                          <Headphones className="h-10 w-10 text-white" />
                        </div>
                        <audio controls className="w-full rounded-lg">
                          <source src={post.media_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
                  {post.media_url && !isVideoContent(post.media_url) && (
                    <Button 
                      asChild 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      <a 
                        href={post.media_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Content
                      </a>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-semibold"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Content Section */}
            <div className="mt-12 text-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link to="/media">
                  Explore More Insights
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPostDetailPage;
