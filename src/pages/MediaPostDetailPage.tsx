import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Clock, Play, FileText, Headphones, Eye, Share2, BookOpen } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
              <div className="h-6 bg-gray-200 rounded w-32 mb-8"></div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-64 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-gray-200 rounded-xl"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Media Post Not Found</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  The media post you're looking for doesn't exist or has been removed.
                  Please check the URL or browse our media library for other content.
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Link to="/media">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Media Library
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
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (post.post_type) {
      case 'video':
        return 'from-red-500 to-orange-500';
      case 'podcast':
        return 'from-green-500 to-teal-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                asChild 
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 rounded-xl px-6 py-2"
              >
                <Link to="/media">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Media
                </Link>
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden rounded-3xl">
                  {/* Hero Section */}
                  <div className="relative">
                    {post.image_url ? (
                      <div className="relative h-96 overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                      </div>
                    ) : (
                      <div className={`h-96 bg-gradient-to-br ${getTypeColor()} flex items-center justify-center`}>
                        <div className="text-white/90 text-9xl">
                          {getPostIcon()}
                        </div>
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div className="absolute top-6 left-6 flex flex-col gap-3">
                      <Badge className={`bg-gradient-to-r ${getTypeColor()} text-white border-0 font-semibold text-sm px-4 py-2 rounded-full shadow-lg`}>
                        <span className="mr-2">{getPostIcon()}</span>
                        {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                      </Badge>
                      {post.category && (
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/40 text-slate-800 font-medium px-3 py-1 rounded-full">
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    
                    {post.duration_minutes && (
                      <div className="absolute top-6 right-6 bg-black/80 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
                        <Clock className="h-4 w-4" />
                        {post.duration_minutes} min
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-8 pb-6">
                    <div className="space-y-6">
                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="font-medium">{formatDate(post.published_at)}</span>
                        </div>
                        {post.duration_minutes && (
                          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="font-medium">{post.duration_minutes} min</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <CardTitle className="text-4xl font-bold leading-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {post.title}
                      </CardTitle>

                      {/* Summary */}
                      {post.summary && (
                        <p className="text-xl text-slate-700 leading-relaxed font-light tracking-wide">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 space-y-8">
                    {/* Media Player Section */}
                    {post.media_url && (
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-2xl border border-slate-200">
                        {isVideoContent(post.media_url) ? (
                          <AspectRatio ratio={16 / 9} className="bg-black rounded-2xl overflow-hidden shadow-lg">
                            <ReactPlayer
                              url={post.media_url}
                              width="100%"
                              height="100%"
                              controls
                              playing={isPlaying}
                              onPlay={() => setIsPlaying(true)}
                              onPause={() => setIsPlaying(false)}
                              light={post.image_url}
                              playIcon={
                                <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform shadow-2xl">
                                  <Play className="h-12 w-12 text-slate-800 ml-1" />
                                </div>
                              }
                            />
                          </AspectRatio>
                        ) : (
                          <div className="text-center space-y-6">
                            {post.image_url && (
                              <div className="w-56 h-56 mx-auto rounded-2xl overflow-hidden shadow-lg mb-6">
                                <img
                                  src={post.image_url}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
                              <Headphones className="h-12 w-12 text-white" />
                            </div>
                            <audio 
                              controls 
                              className="w-full rounded-xl shadow-lg"
                            >
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
                        className="text-slate-700 leading-relaxed tracking-wide space-y-6"
                        dangerouslySetInnerHTML={{ 
                          __html: post.content.replace(
                            /<p>/g, 
                            '<p class="mb-6 text-lg leading-8 text-slate-700">'
                          ) 
                        }} 
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-200">
                      {post.media_url && !isVideoContent(post.media_url) && (
                        <Button 
                          asChild 
                          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <a 
                            href={post.media_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Full Content
                          </a>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline"
                        className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Link copied to clipboard!');
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Article
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info Card */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-800 mb-4 text-lg">Content Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 rounded-lg bg-blue-100">
                        {getPostIcon()}
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Type</p>
                        <p className="font-medium capitalize">{post.post_type}</p>
                      </div>
                    </div>
                    {post.category && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 rounded-lg bg-green-100">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Category</p>
                          <p className="font-medium">{post.category}</p>
                        </div>
                      </div>
                    )}
                    {post.duration_minutes && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Duration</p>
                          <p className="font-medium">{post.duration_minutes} minutes</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* CTA Card */}
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl border-0 rounded-2xl p-6">
                  <h3 className="font-semibold mb-3 text-lg">Enjoying this content?</h3>
                  <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                    Discover more insightful articles, videos, and podcasts in our media library.
                  </p>
                  <Button 
                    asChild 
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-xl py-3 transition-all duration-300"
                  >
                    <Link to="/media">
                      Explore More
                    </Link>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPostDetailPage;
