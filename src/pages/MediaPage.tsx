import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Play, FileText, Headphones, Eye, Star, Search, Video } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { getMediaPosts } from '@/services/mediaService';

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

const MediaPage = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchMediaPosts();
  }, []);

  const fetchMediaPosts = async () => {
    try {
      // Get all posts and categorize them properly
      const [newsData, videoPodcastData, audioPodcastData] = await Promise.all([
        getMediaPosts('news'),
        getMediaPosts('podcast', false, 'video'), // Video podcasts
        getMediaPosts('podcast', false, 'audio')  // Audio podcasts
      ]);

      // Map posts to correct display types
      const allPosts = [
        ...newsData.map(post => ({ ...post, post_type: 'article' as const })),
        ...videoPodcastData.map(post => ({ ...post, post_type: 'video' as const })),
        ...audioPodcastData.map(post => ({ ...post, post_type: 'podcast' as const }))
      ];

      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching media posts:', error);
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

  const renderMediaContent = (post: MediaPost) => {
    // Always show image thumbnail first, then overlay play button for videos
    if (post.image_url) {
      return (
        <AspectRatio ratio={16/9}>
          <div className="relative w-full h-full">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Show play overlay for video content */}
            {post.post_type === 'video' && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play className="h-8 w-8 text-gray-800 ml-1" />
                </div>
              </div>
            )}
          </div>
        </AspectRatio>
      );
    }

    // Fallback to gradient background with icon
    return (
      <AspectRatio ratio={16/9}>
        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center">
          <span className="text-white opacity-80 text-6xl">
            {getPostIcon(post.post_type)}
          </span>
        </div>
      </AspectRatio>
    );
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.post_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="relative">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                SkillPulse Insights
              </h1>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-orange-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover expert insights, thought leadership, and industry trends to accelerate your professional growth
            </p>
          </div>

          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search insights..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={selectedType === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('all')}
                      className={selectedType === 'all' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                        : 'border-orange-200 text-gray-600 hover:bg-orange-50'
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant={selectedType === 'article' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('article')}
                      className={selectedType === 'article' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                        : 'border-orange-200 text-gray-600 hover:bg-orange-50'
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Articles
                    </Button>
                    <Button
                      variant={selectedType === 'video' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('video')}
                      className={selectedType === 'video' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                        : 'border-orange-200 text-gray-600 hover:bg-orange-50'
                      }
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Videos
                    </Button>
                    <Button
                      variant={selectedType === 'podcast' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('podcast')}
                      className={selectedType === 'podcast' 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                        : 'border-orange-200 text-gray-600 hover:bg-orange-50'
                      }
                    >
                      <Headphones className="h-4 w-4 mr-2" />
                      Podcasts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center p-12">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No insights found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    {renderMediaContent(post)}
                    
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-semibold">
                        <span className="mr-1">{getPostIcon(post.post_type)}</span>
                        {post.post_type === 'video' ? 'Video' : 
                         post.post_type === 'podcast' ? 'Podcast' : 'Article'}
                      </Badge>
                    </div>
                    
                    {post.category && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 font-medium">
                          {post.category}
                        </Badge>
                      </div>
                    )}

                    {post.duration_minutes && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.duration_minutes}m
                      </div>
                    )}

                    {post.post_type === 'video' && post.media_url && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Play className="h-8 w-8 text-gray-800 ml-1" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
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
                          <span>{post.duration_minutes} minute {post.post_type === 'article' ? 'read' : post.post_type === 'video' ? 'watch' : 'listen'}</span>
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
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
