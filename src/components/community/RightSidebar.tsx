import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { Image, TrendingUp, Play, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MediaPost {
  id: string;
  title: string;
  images?: { image_url: string }[];
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  created_at: string;
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
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('id, title, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsData) {
        const userIds = postsData.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profiles?.find(p => p.id === post.user_id)
        }));

        setMediaPosts(postsWithProfiles.slice(0, 5) as any);
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

  return (
    <aside className="hidden lg:block w-80 space-y-4 sticky top-4 h-fit">
      {/* Media Posts */}
      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Image className="h-5 w-5" />
            Media Posts
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
              <div key={post.id} className="group cursor-pointer">
                <div className="flex gap-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 p-2 rounded-lg transition-all duration-300">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-purple-700 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback className="text-[8px]">
                          {post.profiles?.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{post.profiles?.full_name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No media posts yet</p>
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
                <div className="flex gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-orange-50 p-2 rounded-lg transition-all duration-300">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-2 ring-white group-hover:ring-orange-200 transition-all">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                      ${course.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No courses available</p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};
