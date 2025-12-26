import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { Image, TrendingUp, Play, Calendar, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface MediaPost {
  id: string;
  title: string;
  content: string;
  images?: {
    id: string;
    image_url: string;
    image_path: string;
    alt_text?: string;
    upload_order: number;
  }[];
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

interface TrendingCourse {
  id: string;
  title: string;
  thumbnail_url: string;
  enrollments_count?: number;
  price: number;
}

export const RightSidebar = () => {
  const navigate = useNavigate();
  const [mediaPosts, setMediaPosts] = useState<MediaPost[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<TrendingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMediaPosts();
    fetchTrendingCourses();
  }, []);

  const fetchMediaPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select(`
          id, 
          title, 
          content,
          created_at, 
          user_id,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (postsData) {
        // Fetch images for each post
        const postsWithImages = await Promise.all(
          postsData.map(async (post) => {
            const { data: images } = await supabase
              .from('community_post_images')
              .select('*')
              .eq('post_id', post.id)
              .order('upload_order', { ascending: true })
              .limit(1); // Just get first image for thumbnail

            // Fetch likes count
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Fetch comments count
            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              images: images || [],
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0
            };
          })
        );

        setMediaPosts(postsWithImages.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching media posts:', error);
    }
  };

  const fetchTrendingCourses = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, price')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (coursesData) {
        setTrendingCourses(coursesData as any);
      }
    } catch (error) {
      console.error('Error fetching trending courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  const getSafeImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    const matches = url.match(/asset\/(.+)/) || url.match(/community-posts\/(.+)/);
    if (matches && matches[1]) {
      return supabase.storage.from('asset').getPublicUrl(matches[1]).data.publicUrl;
    }
    
    if (!url.includes('/') && url.includes('.')) {
      return supabase.storage.from('asset').getPublicUrl(url).data.publicUrl;
    }
    
    return url;
  };

  const getAvatarFallback = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <aside className="hidden lg:block w-80 space-y-4 sticky top-4 h-fit">
      {/* Media Posts */}
      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : mediaPosts.length > 0 ? (
            mediaPosts.map((post) => (
              <div 
                key={post.id} 
                className="group cursor-pointer"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="flex gap-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 p-2 rounded-lg transition-all duration-300 border border-transparent hover:border-orange-200">
                  {/* Post Thumbnail */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-2 ring-white group-hover:ring-purple-200 transition-all">
                    {post.images && post.images.length > 0 ? (
                      <img 
                        src={getSafeImageUrl(post.images[0].image_url) || ''}
                        alt={post.images[0].alt_text || 'Post image'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-purple-700 transition-colors">
                      {post.title || post.content?.substring(0, 50) + '...'}
                    </h4>
                    
                    {/* User Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Avatar className="w-4 h-4">
                        <AvatarImage 
                          src={getSafeImageUrl(post.profiles?.avatar_url) || ''} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="text-[8px] bg-gradient-to-br from-orange-400 to-purple-600 text-white">
                          {getAvatarFallback(post.profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{post.profiles?.full_name || 'Anonymous'}</span>
                    </div>

                    {/* Post Stats */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      {post.likes_count && post.likes_count > 0 && (
                        <span>❤️ {post.likes_count}</span>
                      )}
                      {post.comments_count && post.comments_count > 0 && (
                        <span>💬 {post.comments_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No posts yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending Courses */}
      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-orange-500 text-white pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : trendingCourses.length > 0 ? (
            trendingCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="group cursor-pointer"
                onClick={() => navigate(`/learning/course-detail/${course.id}`)}
              >
                <div className="flex gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 p-2 rounded-lg transition-all duration-300 border border-transparent hover:border-purple-200">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-2 ring-white group-hover:ring-orange-200 transition-all">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-1 left-1">
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-purple-600 border-none text-white font-bold">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-700 transition-colors">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Play className="h-3 w-3" />
                      <span>Popular</span>
                    </div>
                    <p className="text-sm font-bold text-purple-600 mt-1">
                      <PriceDisplay amount={course.price} originalCurrency="USD" />
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No courses available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};
