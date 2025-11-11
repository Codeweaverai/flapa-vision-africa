import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, Play, FileText, Headphones, Eye, Star, Video } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { getMediaPosts } from '@/services/mediaService';
import { Skeleton } from '@/components/ui/skeleton';

interface MediaPost {
  id: string;
  title: string;
  summary?: string;
  content: string;
  post_type: 'article' | 'video' | 'podcast';
  image_url?: string;
  media_url?: string;
  duration_minutes?: number;
  published_at: string;
  category?: string;
  file_storage_path?: string;
}

const MediaSection = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMediaPosts();
  }, []);

  const fetchMediaPosts = async () => {
    try {
      const [newsData, videoPodcastData, audioPodcastData] = await Promise.all([
        getMediaPosts('news'),
        getMediaPosts('podcast', false, 'video'),
        getMediaPosts('podcast', false, 'audio')
      ]);

      const allPosts = [
        ...newsData.map(post => ({ ...post, post_type: 'article' as const })),
        ...videoPodcastData.map(post => ({ ...post, post_type: 'video' as const })),
        ...audioPodcastData.map(post => ({ ...post, post_type: 'podcast' as const }))
      ];

      const sortedPosts = allPosts
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, 3);

      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching media posts:', error);
      const mockPosts: MediaPost[] = [
        {
          id: '1',
          title: 'The Future of Digital Innovation in Africa',
          summary: 'Exploring how African entrepreneurs are leveraging technology to solve local challenges and create global impact.',
          content: 'Content here...',
          post_type: 'article',
          image_url: '/placeholder.svg',
          published_at: '2024-01-15T10:00:00Z',
          category: 'Innovation'
        },
        {
          id: '2',
          title: 'Building Sustainable Business Models',
          summary: 'A deep dive into creating business models that balance profit with social and environmental impact.',
          content: 'Content here...',
          post_type: 'video',
          image_url: '/placeholder.svg',
          media_url: '/video.mp4',
          duration_minutes: 25,
          published_at: '2024-01-12T14:30:00Z',
          category: 'Business'
        },
        {
          id: '3',
          title: 'Leadership in the Digital Age',
          summary: 'How modern leaders are adapting their strategies to navigate the complexities of digital transformation.',
          content: 'Content here...',
          post_type: 'podcast',
          image_url: '/placeholder.svg',
          media_url: '/audio.mp3',
          duration_minutes: 45,
          published_at: '2024-01-10T08:00:00Z',
          category: 'Leadership'
        }
      ];
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'podcast':
        return <Headphones className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-gradient-to-br from-red-500/10 to-pink-600/10 border-red-200';
      case 'podcast':
        return 'bg-gradient-to-br from-green-500/10 to-teal-600/10 border-green-200';
      default:
        return 'bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border-blue-200';
    }
  };

  const getPostTypeGradient = (type: string) => {
    switch (type) {
      case 'video':
        return 'from-red-500 to-pink-600';
      case 'podcast':
        return 'from-green-500 to-teal-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-orange-400/20 to-purple-600/20 rounded-full blur-3xl opacity-30" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-slate-700">Latest Insights</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Stay Informed & Inspired
          </h2>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover cutting-edge insights, expert perspectives, and actionable strategies 
            across articles, videos, and podcasts.
          </p>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="group">
                <div className="h-64 bg-slate-200 rounded-2xl mb-4 animate-pulse" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-6 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card */}
                <Card className={`
                  relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm 
                  shadow-sm hover:shadow-2xl transition-all duration-500 
                  group-hover:scale-[1.02] h-full flex flex-col
                  ${getPostTypeColor(post.post_type)}
                `}>
                  {/* Image/Media Section */}
                  <div className="relative overflow-hidden">
                    {post.image_url ? (
                      <AspectRatio ratio={16/9}>
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </AspectRatio>
                    ) : (
                      <AspectRatio ratio={16/9}>
                        <div className={`w-full h-full bg-gradient-to-br ${getPostTypeGradient(post.post_type)} flex items-center justify-center`}>
                          <div className="text-white/90 text-6xl backdrop-blur-sm rounded-2xl p-4">
                            {getPostIcon(post.post_type)}
                          </div>
                        </div>
                      </AspectRatio>
                    )}
                    
                    {/* Overlay with play button for media */}
                    {(post.post_type === 'video' || post.post_type === 'podcast') && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="h-6 w-6 text-slate-800 fill-current ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge 
                        className={`
                          backdrop-blur-sm border-0 font-semibold text-white px-3 py-1.5
                          bg-gradient-to-r ${getPostTypeGradient(post.post_type)}
                          shadow-lg
                        `}
                      >
                        <span className="mr-1.5">{getPostIcon(post.post_type)}</span>
                        {post.post_type === 'video' ? 'Video' : 
                         post.post_type === 'podcast' ? 'Podcast' : 'Article'}
                      </Badge>
                    </div>
                    
                    {post.category && (
                      <div className="absolute top-4 right-4">
                        <Badge 
                          variant="secondary" 
                          className="backdrop-blur-sm bg-white/90 border-white/40 text-slate-700 font-medium shadow-sm"
                        >
                          {post.category}
                        </Badge>
                      </div>
                    )}

                    {/* Duration */}
                    {post.duration_minutes && (
                      <div className="absolute bottom-4 right-4 backdrop-blur-sm bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Clock className="h-3 w-3" />
                        {post.duration_minutes}m
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <CardHeader className="pb-4 flex-1">
                    <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 group-hover:bg-clip-text transition-all duration-300 mb-3">
                      {post.title}
                    </CardTitle>
                    
                    {post.summary && (
                      <p className="text-slate-600 line-clamp-3 leading-relaxed text-sm">
                        {post.summary}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0 mt-auto">
                    {/* Meta information */}
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100/80">
                          <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        <span className="font-medium">
                          {new Date(post.published_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-slate-400">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">Premium</span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      asChild 
                      className={`
                        w-full rounded-xl h-11 font-semibold text-sm 
                        bg-gradient-to-r ${getPostTypeGradient(post.post_type)}
                        hover:shadow-lg transform hover:scale-[1.02] 
                        transition-all duration-300 border-0 text-white
                        group/btn
                      `}
                    >
                      <Link to={`/media/${post.id}`} className="flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        {post.post_type === 'video' ? 'Watch Now' : 
                         post.post_type === 'podcast' ? 'Listen Now' : 'Read Article'}
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-6">
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="rounded-2xl px-8 py-6 text-base font-semibold border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 group/cta"
            >
              <Link to="/media" className="flex items-center gap-3 text-slate-700">
                <span>Explore All Content</span>
                <ArrowRight className="h-5 w-5 group-hover/cta:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
            
            <p className="text-sm text-slate-500 max-w-md">
              Join thousands of professionals who stay ahead with our curated insights and expert content.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaSection;
