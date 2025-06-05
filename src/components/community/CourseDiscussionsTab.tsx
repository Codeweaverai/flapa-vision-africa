
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import EmojiPicker from './EmojiPicker';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Reply, 
  Search, 
  Send, 
  ThumbsUp,
  BookOpen,
  Star,
  Users
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
}

interface CoursePost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  course_id: string;
  emoji_reactions: any;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  courses: {
    id: string;
    title: string;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  emoji_reactions: any;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  likes_count: number;
  user_liked: boolean;
}

const CourseDiscussionsTab: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [posts, setPosts] = useState<CoursePost[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCourse, setNewPostCourse] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
    loadPosts();
  }, [selectedCourse, searchQuery]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .eq('is_published', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey (
            full_name,
            username,
            avatar_url
          ),
          courses (
            id,
            title
          )
        `)
        .not('course_id', 'is', null)
        .order('created_at', { ascending: false });

      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('id', { count: 'exact' })
            .eq('post_id', post.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('id', { count: 'exact' })
            .eq('post_id', post.id);

          // Check if current user liked this post
          const { data: userLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_liked: !!userLike,
            profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
            courses: Array.isArray(post.courses) ? post.courses[0] : post.courses
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get likes count for each comment
      const commentsWithCounts = await Promise.all(
        (data || []).map(async (comment) => {
          const { count: likesCount } = await supabase
            .from('comment_likes')
            .select('id', { count: 'exact' })
            .eq('comment_id', comment.id);

          const { data: userLike } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...comment,
            likes_count: likesCount || 0,
            user_liked: !!userLike,
            profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles
          };
        })
      );

      setComments(prev => ({
        ...prev,
        [postId]: commentsWithCounts
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim() || !newPostCourse) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: newPostTitle.trim(),
          content: newPostContent.trim(),
          course_id: newPostCourse,
          user_id: user.id,
          emoji_reactions: {}
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Post created successfully!');
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCourse('');
      setShowNewPostForm(false);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          content: newComment[postId].trim(),
          post_id: postId,
          user_id: user.id,
          parent_id: replyTo?.postId === postId ? replyTo.commentId : null,
          emoji_reactions: {}
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setReplyTo(null);
      loadComments(postId);
      loadPosts(); // Reload to update comment counts
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Remove like
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            like_type: 'like'
          });

        if (error) throw error;
      }

      loadPosts(); // Reload to update like counts
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleLikeComment = async (commentId: string, postId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Remove like
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            like_type: 'like'
          });

        if (error) throw error;
      }

      loadComments(postId);
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            Course Discussions
          </h2>
          <p className="text-gray-600 mt-1">Discuss courses with fellow learners</p>
        </div>
        <Button
          onClick={() => setShowNewPostForm(!showNewPostForm)}
          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New Post Form */}
      {showNewPostForm && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg">Start a New Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={newPostCourse} onValueChange={setNewPostCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Discussion title..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <Textarea
              placeholder="What would you like to discuss about this course?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleCreatePost}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Discussion
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewPostForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="text-center p-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-gray-600 mb-4">Be the first to start a course discussion!</p>
            <Button
              onClick={() => setShowNewPostForm(true)}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              Start Discussion
            </Button>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        {post.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {post.courses?.title}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-4">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{post.content}</p>
                
                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id)}
                    className={post.user_liked ? 'text-red-500' : 'text-gray-500'}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.user_liked ? 'fill-current' : ''}`} />
                    {post.likes_count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadComments(post.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.comments_count}
                  </Button>
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      // Handle emoji reaction
                      console.log('Emoji selected:', emoji);
                    }}
                  />
                </div>

                {/* Comments Section */}
                {comments[post.id] && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold text-gray-800">Comments</h4>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3">
                        {comments[post.id].map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>
                                {comment.profiles?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {comment.profiles?.full_name || 'Anonymous'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLikeComment(comment.id, post.id)}
                                  className={`text-xs ${comment.user_liked ? 'text-red-500' : 'text-gray-500'}`}
                                >
                                  <ThumbsUp className={`h-3 w-3 mr-1 ${comment.user_liked ? 'fill-current' : ''}`} />
                                  {comment.likes_count}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyTo({ postId: post.id, commentId: comment.id })}
                                  className="text-xs"
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder={replyTo?.postId === post.id ? "Write a reply..." : "Write a comment..."}
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionsTab;
