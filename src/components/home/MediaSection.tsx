import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, Play, FileText, Headphones, Eye, Star } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/lib/supabaseClient';

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
}

const MediaSection = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMediaPosts();
  }, []);

  const fetchMediaPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Map the database response to match our interface types
      const mappedPosts = data?.map(post => ({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        post_type: post.post_type as 'article' | 'video' | 'podcast',
        image_url: post.image_url,
        media_url: post.media_url,
        duration_minutes: post.duration_minutes,
        published_at: post.published_at,
        category: post.category
      })) || [];

      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching media posts:', error);
      // Fallback to mock data if there's an error
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
        return <Play className="h-4 w-4" />;
      case 'podcast':
        return <Headphones className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
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
    <section className="py-20 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Latest Insights
            </h2>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with our curated content featuring industry insights, thought leadership, and actionable strategies
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  {post.image_url ? (
                    <AspectRatio ratio={16/9}>
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </AspectRatio>
                  ) : (
                    <AspectRatio ratio={16/9}>
                      <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center`}>
                        <span className="text-white opacity-80 text-6xl">
                          {post.post_type === 'video' && <Play className="h-16 w-16" />}
                          {post.post_type === 'podcast' && <Headphones className="h-16 w-16" />}
                          {post.post_type === 'article' && <FileText className="h-16 w-16" />}
                        </span>
                      </div>
                    </AspectRatio>
                  )}
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-semibold"
                    >
                      <span className="mr-1">{getPostIcon(post.post_type)}</span>
                      {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                    </Badge>
                  </div>
                  
                  {post.category && (
                    <div className="absolute top-4 right-4">
                      <Badge 
                        variant="outline" 
                        className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium"
                      >
                        {post.category}
                      </Badge>
                    </div>
                  )}

                  {/* Duration for video/podcast */}
                  {post.duration_minutes && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.duration_minutes}m
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Quality Indicator */}
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span>Premium</span>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {post.title}
                  </CardTitle>
                  {post.summary && (
                    <p className="text-gray-600 line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                        <Calendar className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="font-medium">
                        {new Date(post.published_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {post.duration_minutes && (
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                          <Clock className="h-3 w-3 text-orange-600" />
                        </div>
                        <span>{post.duration_minutes} minute read/watch</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 rounded-xl h-12 font-semibold text-base group"
                  >
                    <Link to={`/media/${post.id}`} className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      {post.post_type === 'video' ? 'Watch Now' : 
                       post.post_type === 'podcast' ? 'Listen Now' : 'Read Article'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link to="/media" className="flex items-center gap-2">
              Explore All Insights
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MediaSection;
