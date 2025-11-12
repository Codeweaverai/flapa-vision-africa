import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Play, FileText, Headphones, Eye, Share2, Bookmark, Star } from 'lucide-react';
import { toast } from 'sonner';
import ReactPlayer from 'react-player/lazy';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

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
  const navigate = useNavigate();
  const [post, setPost] = useState<MediaPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<MediaPost[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('Invalid post ID');
        setLoading(false);
        return;
      }

      try {
        setError(null);
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
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Post not found');
        }

        setPost(data);

        // Increment view count
        try {
          await supabase
            .from('media_posts')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', id);
        } catch (viewCountError) {
          console.warn('Failed to update view count:', viewCountError);
        }

        // Fetch related posts
        fetchRelatedPosts(data.category, data.post_type, data.id);
      } catch (error) {
        console.error('Error fetching media post:', error);
        setError(error instanceof Error ? error.message : 'Failed to load media post');
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
          .eq('post_type', postType)
          .eq('is_published', true)
          .neq('id', currentId)
          .order('published_at', { ascending: false })
          .limit(3);

        if (category) {
          query = query.eq('category', category);
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

  // Fallback mock data for development
  const getMockPost = (): MediaPost => ({
    id: id || '1',
    title: 'Sample Media Post',
    content: '<p>This is a sample media post content. In a real application, this would be fetched from the database.</p><p>You can add rich content here including images, videos, and formatted text.</p>',
    summary: 'This is a sample summary of the media post that provides an overview of the content.',
    category: 'Technology',
    post_type: 'article',
    image_url: '/api/placeholder/800/400',
    published_at: new Date().toISOString(),
    view_count: 0,
    reading_time: 3,
    featured: false,
    language: 'en'
  });

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
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

  const getReadingTime = () => {
    if (post?.reading_time) return post.reading_time;
    
    // Calculate reading time based on content length
    const wordsPerMinute = 200;
    const wordCount = post?.content.split(/\s+/).length || 0;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const isVideoContent = (mediaUrl?: string) => {
    if (!mediaUrl) return false;
    
    // Check if it's a playable video URL
    const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v'];
    const videoDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'wistia.com'];
    
    const isVideoExtension = videoExtensions.some(ext => mediaUrl.toLowerCase().includes(ext));
    const isVideoDomain = videoDomains.some(domain => mediaUrl.toLowerCase().includes(domain));
    
    return ReactPlayer.canPlay(mediaUrl) && (isVideoExtension || isVideoDomain || post?.post_type === 'video');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.summary,
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled share, don't show error
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getMetaDescription = () => {
    return post?.meta_description || post?.summary || 
           `Discover this ${post?.post_type} about ${post?.title}. ${post?.summary?.substring(0, 150)}...` ||
           `Read ${post?.title} on SkillPulse Insights. Expert content for professional growth.`;
  };

  const getSafeImageUrl = (url?: string) => {
    if (!url || url.includes('undefined') || url.includes('null')) {
      return '/api/placeholder/800/400';
    }
    return url;
  };

  if (loading) {
    return (
      <Layout>
        <Helmet>
          <title>Loading... | SkillPulse Insights</title>
          <meta name="description" content="Loading media content..." />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <Skeleton className="h-12 w-48 rounded-2xl" />
              <Skeleton className="h-96 rounded-3xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post || error) {
    return (
      <Layout>
        <Helmet>
          <title>Post Not Found | SkillPulse Insights</title>
          <meta name="description" content="The requested media post was not found." />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-slate-200/60">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center shadow-lg">
                  <FileText className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-4xl font-bold mb-4 text-slate-800">
                  {error ? 'Error Loading Post' : 'Media Post Not Found'}
                </h2>
                <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                  {error || "The media post you're looking for doesn't exist or has been removed."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-2xl"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Go Back
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link to="/media">
                      Browse All Insights
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{post.seo_title || post.title} | SkillPulse Insights</title>
        <meta name="description" content={getMetaDescription()} />
        <meta name="keywords" content={post.tags?.join(', ') || post.category || 'professional growth, insights'} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:image" content={getSafeImageUrl(post.image_url)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo_title || post.title} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <meta name="twitter:image" content={getSafeImageUrl(post.image_url)} />
        
        {/* Additional SEO */}
        <meta name="author" content="SkillPulse" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": getMetaDescription(),
            "image": getSafeImageUrl(post.image_url),
            "datePublished": post.published_at,
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
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-200/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-r from-orange-400/10 to-purple-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-8 relative">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                asChild 
                className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:bg-white/90 hover:shadow-md transition-all duration-300 rounded-2xl px-6 py-3"
              >
                <Link to="/media">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Insights
                </Link>
              </Button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Article Content */}
              <div className="lg:col-span-3">
                <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 overflow-hidden rounded-3xl">
                  {/* Hero Section */}
                  <div className="relative">
                    <div className="relative h-80 md:h-96 overflow-hidden">
                      <img
                        src={getSafeImageUrl(post.image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                          // Fallback to gradient background
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {!post.image_url || post.image_url.includes('undefined') || post.image_url.includes('null') ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex items-center justify-center">
                          <div className="text-white/80 text-6xl md:text-8xl">
                            {getPostIcon()}
                          </div>
                        </div>
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-2 md:gap-3">
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-semibold text-sm px-3 md:px-4 py-1 md:py-2 rounded-xl shadow-lg">
                        <span className="mr-2">{getPostIcon()}</span>
                        {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                      </Badge>
                      {post.featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold text-sm px-3 py-1 rounded-lg shadow-lg">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {post.category && (
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/40 text-slate-800 font-medium rounded-lg px-3 py-1">
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    
                    {post.duration_minutes && (
                      <div className="absolute top-4 md:top-6 right-4 md:right-6 backdrop-blur-sm bg-black/70 text-white text-sm px-3 md:px-4 py-1 md:py-2 rounded-full flex items-center gap-2 shadow-lg">
                        <Clock className="h-4 w-4" />
                        {post.duration_minutes} min
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-6 md:p-8 pb-4 md:pb-6">
                    <div className="space-y-4 md:space-y-6">
                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 shadow-sm">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="font-medium">{formatDate(post.published_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-slate-100 shadow-sm">
                            <Clock className="h-4 w-4 text-slate-600" />
                          </div>
                          <span className="font-medium">{getReadingTime()} min read</span>
                        </div>

                        {post.view_count !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-slate-100 shadow-sm">
                              <Eye className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="font-medium">{post.view_count} views</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <CardTitle className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {post.title}
                      </CardTitle>

                      {/* Summary */}
                      {post.summary && (
                        <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium bg-slate-50/50 rounded-2xl p-4 md:p-6 border border-slate-200/60">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 md:p-8 pt-0 space-y-6 md:space-y-8">
                    {/* Media Player Section */}
                    {post.media_url && (
                      <div className="bg-gradient-to-br from-orange-50/50 to-purple-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-orange-200/60 shadow-lg">
                        {isVideoContent(post.media_url) ? (
                          <AspectRatio ratio={16 / 9} className="bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-xl">
                            <ReactPlayer
                              url={post.media_url}
                              width="100%"
                              height="100%"
                              controls
                              playing={false}
                              light={getSafeImageUrl(post.image_url)}
                              playIcon={
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform shadow-2xl">
                                  <Play className="h-6 w-6 md:h-8 md:w-8 text-slate-800 ml-0.5 md:ml-1" />
                                </div>
                              }
                            />
                          </AspectRatio>
                        ) : (
                          <div className="text-center space-y-4 md:space-y-6">
                            {post.image_url && (
                              <div className="w-32 h-32 md:w-48 md:h-48 mx-auto rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
                                <img
                                  src={getSafeImageUrl(post.image_url)}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
                              <Headphones className="h-8 w-8 md:h-10 md:w-10 text-white" />
                            </div>
                            <audio controls className="w-full rounded-xl md:rounded-2xl shadow-lg">
                              <source src={post.media_url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <article className="prose prose-sm md:prose-lg max-w-none prose-slate">
                      <div 
                        className="text-slate-700 leading-relaxed text-base md:text-lg"
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                      />
                    </article>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-6">
                        {post.tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-slate-100 text-slate-700 border-slate-200 rounded-lg px-3 py-1 text-sm"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 md:gap-4 pt-6 md:pt-8 border-t border-slate-200">
                      <Button 
                        onClick={handleShare}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-5 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`border-2 rounded-xl md:rounded-2xl px-5 md:px-6 py-2 md:py-3 font-semibold transition-all duration-300 text-sm md:text-base ${
                          isBookmarked 
                            ? 'border-orange-200 bg-orange-50 text-orange-600' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Post Info */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-3xl p-4 md:p-6">
                  <h3 className="font-semibold text-slate-800 mb-3 md:mb-4">About This Content</h3>
                  <div className="space-y-2 md:space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Published: {formatDate(post.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>Reading: {getReadingTime()} min</span>
                    </div>
                    {post.view_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-slate-400" />
                        <span>Views: {post.view_count}</span>
                      </div>
                    )}
                    {post.language && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">🌐</span>
                        <span>Language: {post.language.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-3xl p-4 md:p-6">
                    <h3 className="font-semibold text-slate-800 mb-3 md:mb-4">Related Insights</h3>
                    <div className="space-y-3 md:space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link 
                          key={relatedPost.id} 
                          to={`/media/${relatedPost.id}`}
                          className="block p-3 rounded-xl md:rounded-2xl hover:bg-slate-50/50 transition-all duration-300 border border-transparent hover:border-slate-200"
                        >
                          <h4 className="font-medium text-slate-800 text-sm leading-tight mb-1 line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
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
            <div className="mt-12 md:mt-16 text-center">
              <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-orange-200/40">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 md:mb-4">Ready to Explore More?</h3>
                <p className="text-slate-600 mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base">
                  Discover more expert insights, industry trends, and professional growth strategies in our media library.
                </p>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link to="/media">
                    Explore All Insights
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPostDetailPage;
