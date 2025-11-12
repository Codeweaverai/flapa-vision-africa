import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Play, FileText, Headphones, Eye, Star, Search, Video, Filter } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
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

  const getPostTypeGradient = (type: string) => {
    switch (type) {
      case 'video':
        return 'from-orange-500 to-red-500';
      case 'podcast':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-amber-500 to-orange-500';
    }
  };

  const getPostTypeLight = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-orange-100/80 text-orange-700 border-orange-200';
      case 'podcast':
        return 'bg-purple-100/80 text-purple-700 border-purple-200';
      default:
        return 'bg-amber-100/80 text-amber-700 border-amber-200';
    }
  };

  const renderMediaContent = (post: MediaPost) => {
    if (post.image_url) {
      return (
        <AspectRatio ratio={16/9}>
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {(post.post_type === 'video' || post.post_type === 'podcast') && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
                  <Play className="h-6 w-6 text-slate-800 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>
        </AspectRatio>
      );
    }

    return (
      <AspectRatio ratio={16/9}>
        <div className={`w-full h-full bg-gradient-to-br ${getPostTypeGradient(post.post_type)} flex items-center justify-center`}>
          <div className="text-white/90 text-6xl backdrop-blur-sm rounded-2xl p-4">
            {getPostIcon(post.post_type)}
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-200/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-r from-orange-400/10 to-purple-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-12 relative">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm mb-8">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-700">SkillPulse Insights</span>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Expert Insights
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover cutting-edge knowledge, industry trends, and professional growth strategies
            </p>
          </div>

          {/* Search & Filter Section */}
          <div className="mb-12">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search insights, topics, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 h-14 text-lg border-2 border-slate-200/60 focus:border-orange-300 rounded-2xl shadow-sm bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mr-2">
                      <Filter className="h-4 w-4" />
                      Filter:
                    </div>
                    <Button
                      variant={selectedType === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('all')}
                      className={`
                        rounded-xl px-6 py-2 h-10 font-semibold transition-all duration-300
                        ${selectedType === 'all' 
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-orange-500/25' 
                          : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      All Content
                    </Button>
                    <Button
                      variant={selectedType === 'article' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('article')}
                      className={`
                        rounded-xl px-6 py-2 h-10 font-semibold transition-all duration-300
                        ${selectedType === 'article' 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                          : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Articles
                    </Button>
                    <Button
                      variant={selectedType === 'video' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('video')}
                      className={`
                        rounded-xl px-6 py-2 h-10 font-semibold transition-all duration-300
                        ${selectedType === 'video' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25' 
                          : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Videos
                    </Button>
                    <Button
                      variant={selectedType === 'podcast' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('podcast')}
                      className={`
                        rounded-xl px-6 py-2 h-10 font-semibold transition-all duration-300
                        ${selectedType === 'podcast' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                          : 'border-slate-200 text-slate-600 hover:bg-white hover:shadow-md'
                        }
                      `}
                    >
                      <Headphones className="h-4 w-4 mr-2" />
                      Podcasts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="mb-8">
              <p className="text-slate-600 text-lg">
                Showing <span className="font-semibold text-slate-800">{filteredPosts.length}</span> 
                {filteredPosts.length === 1 ? ' insight' : ' insights'}
                {searchTerm && ` for "${searchTerm}"`}
                {selectedType !== 'all' && ` in ${selectedType}s`}
              </p>
            </div>
          )}

          {/* Content Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="group">
                  <Skeleton className="h-64 rounded-2xl mb-4 bg-gradient-to-r from-slate-200 to-slate-300" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-20 rounded-full bg-slate-300" />
                    <Skeleton className="h-6 w-full rounded bg-slate-300" />
                    <Skeleton className="h-4 w-3/4 rounded bg-slate-300" />
                    <Skeleton className="h-12 w-full rounded-xl mt-4 bg-gradient-to-r from-slate-300 to-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl text-center p-16">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No insights found</h3>
              <p className="text-slate-600 text-lg mb-6 max-w-md mx-auto">
                {searchTerm || selectedType !== 'all' 
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "No content available at the moment. Please check back later."
                }
              </p>
              {(searchTerm || selectedType !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                  }}
                  className="rounded-xl px-8 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className={`
                    relative overflow-hidden border-0 bg-white/90 backdrop-blur-sm 
                    shadow-lg hover:shadow-2xl transition-all duration-500 
                    group-hover:scale-[1.02] h-full flex flex-col rounded-3xl
                  `}>
                    {/* Media Content */}
                    <div className="relative overflow-hidden rounded-t-3xl">
                      {renderMediaContent(post)}
                      
                      {/* Top badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge 
                          className={`
                            backdrop-blur-sm border-0 font-semibold text-white px-3 py-1.5
                            bg-gradient-to-r ${getPostTypeGradient(post.post_type)}
                            shadow-lg rounded-xl
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
                            className={`backdrop-blur-sm bg-white/90 font-medium shadow-sm rounded-lg ${getPostTypeLight(post.post_type)}`}
                          >
                            {post.category}
                          </Badge>
                        </div>
                      )}

                      {/* Duration */}
                      {post.duration_minutes && (
                        <div className="absolute bottom-4 right-4 backdrop-blur-sm bg-black/70 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <Clock className="h-3.5 w-3.5" />
                          {post.duration_minutes}m
                        </div>
                      )}

                      {/* Premium Badge */}
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1.5 text-white text-sm font-medium backdrop-blur-sm bg-black/50 px-3 py-1.5 rounded-full">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span>Premium</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <CardHeader className="pb-4 flex-1 px-6">
                      <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 group-hover:bg-clip-text transition-all duration-300 mb-3">
                        {post.title}
                      </CardTitle>
                      
                      {post.summary && (
                        <p className="text-slate-600 line-clamp-3 leading-relaxed text-sm">
                          {post.summary}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0 mt-auto px-6 pb-6">
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
                        
                        {post.duration_minutes && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              {post.duration_minutes}m {post.post_type === 'article' ? 'read' : post.post_type === 'video' ? 'watch' : 'listen'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <Button 
                        asChild 
                        className={`
                          w-full rounded-2xl h-12 font-semibold text-sm 
                          bg-gradient-to-r from-orange-500 to-purple-600
                          hover:from-orange-600 hover:to-purple-700
                          hover:shadow-xl transform hover:scale-[1.02] 
                          transition-all duration-300 border-0 text-white
                          shadow-lg shadow-orange-500/25
                          group/btn
                        `}
                      >
                        <Link to={`/media/${post.id}`} className="flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4" />
                          {post.post_type === 'video' ? 'Watch Now' : 
                           post.post_type === 'podcast' ? 'Listen Now' : 'Read Article'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
