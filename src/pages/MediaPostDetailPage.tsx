import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Play, FileText, Headphones, Eye, Share2, Star } from 'lucide-react';
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
  guest_names?: string;
  episode_number?: string;
  series_name?: string;
  tags?: string[];
  meta_description?: string;
  seo_title?: string;
  reading_time?: number;
  view_count?: number;
  featured?: boolean;
  language?: string;
}

const MediaPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<MediaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<MediaPost[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        // Select ALL columns that exist in your schema
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
            author_id,
            guest_names,
            episode_number,
            series_name,
            tags,
            meta_description,
            seo_title,
            reading_time,
            view_count,
            featured,
            language
          `)
          .eq('id', id)
          .eq('is_published', true)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          toast.error('Post not found');
          return;
        }

        if (data) {
          setPost(data);
          
          // Increment view count
          try {
            await supabase
              .from('media_posts')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('id', id);
          } catch (viewError) {
            console.warn('Could not update view count:', viewError);
          }

          // Fetch related posts
          fetchRelatedPosts(data.category, data.post_type, data.id);
        }
      } catch (error) {
        console.error('Error fetching media post:', error);
        toast.error('Failed to load media post');
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedPosts = async (category: string | undefined, postType: string, currentId: string) => {
      try {
        let query = supabase
          .from('media_posts')
          .select('*')
          .eq('is_published', true)
          .neq('id', currentId)
          .order('published_at', { ascending: false })
          .limit(3);

        if (category) {
          query = query.eq('category', category);
        } else {
          query = query.eq('post_type', postType);
        }

        const { data, error } = await query;

        if (!error && data) {
          setRelatedPosts(data);
        }
      } catch (error) {
        console.error('Error fetching related posts:', error);
      }
    };

    fetchPost();
  }, [id]);

  // SEO Optimization Functions
  const getMetaDescription = () => {
    return post?.meta_description || post?.summary || 
           `Read "${post?.title}" - ${post?.summary?.substring(0, 120)}...` ||
           `Discover expert insights on ${post?.title}. Professional development content from SkillPulse.`;
  };

  const getReadingTime = () => {
    if (post?.reading_time) return post.reading_time;
    
    const wordsPerMinute = 200;
    const wordCount = post?.content.split(/\s+/).length || 0;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getStructuredData = () => {
    if (!post) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": getMetaDescription(),
      "image": post.image_url || '/default-og-image.jpg',
      "datePublished": post.published_at,
      "dateModified": post.published_at,
      "author": {
        "@type": "Organization",
        "name": "SkillPulse"
      },
      "publisher": {
        "@type": "Organization",
        "name": "SkillPulse",
        "logo": {
          "@type": "ImageObject",
          "url": "/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      }
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPostIcon = () => {
    switch (post?.post_type) {
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'podcast':
        return <Headphones className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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
      post?.post_type === 'video'
    );
  };

  const formatContentWithParagraphs = (content: string) => {
    const paragraphs = content.split('\n').filter(para => para.trim().length > 0);
    
    if (paragraphs.length === 0) {
      return <p className="mb-4 leading-relaxed text-gray-700">{content}</p>;
    }

    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed text-gray-700">
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <Layout>
        <Helmet>
          <title>Loading... | SkillPulse Insights</title>
          <meta name="description" content="Loading media content..." />
        </Helmet>
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
        <Helmet>
          <title>Post Not Found | SkillPulse Insights</title>
          <meta name="description" content="The requested media post was not found." />
        </Helmet>
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

  const structuredData = getStructuredData();

  return (
    <Layout>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.seo_title || post.title} | SkillPulse Insights</title>
        <meta name="description" content={getMetaDescription()} />
        <meta name="keywords" content={post.tags?.join(', ') || post.category || 'professional growth, insights, career development'} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:image" content={post.image_url || '/default-og-image.jpg'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="SkillPulse Insights" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo_title || post.title} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <meta name="twitter:image" content={post.image_url || '/default-og-image.jpg'} />
        
        {/* Additional SEO */}
        <meta name="author" content="SkillPulse" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Structured Data */}
        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm border-white/40 hover:bg-white/90">
                <Link to="/media">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Media
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden rounded-3xl">
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
                      {post.featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold text-sm px-3 py-1">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
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
                        
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                            <Clock className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="font-medium">{getReadingTime()} min read</span>
                        </div>

                        {post.view_count !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                              <Eye className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="font-medium">{post.view_count} views</span>
                          </div>
                        )}

                        {post.duration_minutes && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                              <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <span className="font-medium">{post.duration_minutes} min {post.post_type === 'video' ? 'watch' : 'listen'}</span>
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
                          <div className="text-center space-y-4">
                            {/* Show image thumbnail for audio content */}
                            {post.image_url && (
                              <div className="w-48 h-48 mx-auto rounded-xl overflow-hidden mb-4">
                                <img
                                  src={post.image_url}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
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

                    {/* Content with Proper Paragraphing */}
                    <article className="prose prose-lg max-w-none">
                      <div className="text-gray-700 leading-relaxed">
                        {formatContentWithParagraphs(post.content)}
                      </div>
                    </article>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-6">
                        {post.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gray-100 text-gray-700 border-gray-200 rounded-lg px-3 py-1"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

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
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Post Info */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-3xl p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">About This Content</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Published: {formatDate(post.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Reading: {getReadingTime()} min</span>
                    </div>
                    {post.view_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>Views: {post.view_count}</span>
                      </div>
                    )}
                    {post.language && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🌐</span>
                        <span>Language: {post.language.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-3xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Related Insights</h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link 
                          key={relatedPost.id} 
                          to={`/media/${relatedPost.id}`}
                          className="block p-3 rounded-2xl hover:bg-gray-50/50 transition-all duration-300 border border-transparent hover:border-gray-200"
                        >
                          <h4 className="font-medium text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="capitalize">{relatedPost.post_type}</span>
                            <span>•</span>
                            <span>{formatDate(relatedPost.published_at)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* CTA Section */}
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
