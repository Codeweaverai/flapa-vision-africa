
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Heart, Share2, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from './EmojiPicker';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  creator_id: string;
}

interface CoursePost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  course_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  courses?: {
    title: string;
  } | null;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

const CourseDiscussionsTab: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<CoursePost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCoursePosts();
    } else {
      setPosts([]);
    }
  }, [selectedCourse, user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursePosts = async () => {
    if (!selectedCourse) return;
    
    setPostsLoading(true);
    try {
      console.log('Fetching posts for course:', selectedCourse);
      
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id(full_name, username, avatar_url),
          courses:course_id(title)
        `)
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      console.log('Fetched posts:', data);

      // Process the data to get likes and comments counts
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post: any) => {
          try {
            const [likesResult, commentsResult, userLikeResult] = await Promise.all([
              supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id),
              supabase
                .from('post_comments')
                .select('id')
                .eq('post_id', post.id),
              user ? supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .maybeSingle() : Promise.resolve({ data: null })
            ]);

            return {
              id: post.id,
              title: post.title,
              content: post.content,
              user_id: post.user_id,
              course_id: post.course_id,
              created_at: post.created_at,
              profiles: post.profiles,
              courses: post.courses,
              likes_count: likesResult.data?.length || 0,
              comments_count: commentsResult.data?.length || 0,
              user_liked: !!userLikeResult.data
            } as CoursePost;
          } catch (error) {
            console.error('Error processing post:', post.id, error);
            return {
              id: post.id,
              title: post.title,
              content: post.content,
              user_id: post.user_id,
              course_id: post.course_id,
              created_at: post.created_at,
              profiles: post.profiles,
              courses: post.courses,
              likes_count: 0,
              comments_count: 0,
              user_liked: false
            } as CoursePost;
          }
        })
      );

      console.log('Processed posts with counts:', postsWithCounts);
      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching course posts:', error);
      toast.error('Failed to load discussions');
    } finally {
      setPostsLoading(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCourse || !newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please select a course and fill in all fields');
      return;
    }

    try {
      console.log('Creating post:', { title: newPost.title, content: newPost.content, course_id: selectedCourse });
      
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          user_id: user.id,
          course_id: selectedCourse
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully:', data);
      setNewPost({ title: '', content: '' });
      toast.success('Post created successfully!');
      fetchCoursePosts(); // Refresh posts
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            like_type: 'like'
          });
      }

      fetchCoursePosts(); // Refresh to update counts
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Search and Selection */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCourse === course.id 
                      ? 'ring-2 ring-orange-500 bg-gradient-to-r from-orange-50 to-purple-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-200 to-purple-200 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{course.title}</h3>
                        <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Post Form */}
      {selectedCourse && user && (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Share Your Thoughts</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-4">
              <Input
                placeholder="Post title"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <div className="relative">
                <Textarea
                  placeholder="What's on your mind about this course?"
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
                <div className="absolute bottom-2 right-2">
                  <EmojiPicker onEmojiSelect={(emoji) => setNewPost(prev => ({ ...prev, content: prev.content + emoji }))} />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                <Share2 className="h-4 w-4 mr-2" />
                Share Post
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {selectedCourse ? (
          postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                        {post.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
                        <Badge variant="outline" className="text-xs">
                          {post.courses?.title}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                  <div className="flex items-center space-x-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.id, post.user_liked || false)}
                      className={post.user_liked ? 'text-red-500' : 'text-gray-500'}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${post.user_liked ? 'fill-current' : ''}`} />
                      {post.likes_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {post.comments_count || 0}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                <p className="text-gray-600">Be the first to start a discussion about this course!</p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
              <p className="text-gray-600">Choose a course above to view and participate in discussions.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionsTab;
