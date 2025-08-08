import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Heart, Share2, BookOpen, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from './EmojiPicker';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

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
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeCommentForms, setActiveCommentForms] = useState<Record<string, boolean>>({});
  const [activeReplyForms, setActiveReplyForms] = useState<Record<string, string | null>>({});

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

  useEffect(() => {
    const channel = supabase
      .channel('comments-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, payload => {
        const newComment: Comment = payload.new as any;
        fetchComments(newComment.post_id);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      console.error(error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursePosts = async () => {
    if (!selectedCourse) return;
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!community_posts_user_id_fkey(full_name, username, avatar_url),
          courses!community_posts_course_id_fkey(title)
        `)
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async post => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase.from('post_likes').select('id').eq('post_id', post.id),
            supabase.from('post_comments').select('id').eq('post_id', post.id),
            user
              ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
              : Promise.resolve({ data: null })
          ]);
          await fetchComments(post.id);
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
        })
      );
      setPosts(postsWithCounts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load discussions');
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rootComments = (data || []).filter(c => !c.parent_id);
      const replies = (data || []).filter(c => c.parent_id);
      rootComments.forEach(c => {
        (c as any).replies = replies.filter(r => r.parent_id === c.id);
      });
      setComments(prev => ({ ...prev, [postId]: rootComments }));
    } catch (error) {
      console.error(error);
    }
  };

  const createComment = async (postId: string, parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyInputs[parentId] : commentInputs[postId];
    if (!content?.trim()) return;
    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId
      });
      if (error) throw error;
      toast.success('Comment added');
      if (parentId) {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
        setActiveReplyForms(prev => ({ ...prev, [postId]: null }));
      } else {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setActiveCommentForms(prev => ({ ...prev, [postId]: false }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add comment');
    }
  };

  const sharePost = async (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!user) return;
    try {
      if (liked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id, like_type: 'like' });
      }
      fetchCoursePosts();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-12 w-12 border-b-2 border-orange-500 rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Course Search */}
      {/* ... course search code remains unchanged ... */}

      {/* Posts */}
      <div className="space-y-4">
        {postsLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-orange-500 rounded-full" /></div>
        ) : posts.map(post => (
          <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url || ''} />
                  <AvatarFallback>{post.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <CardTitle className="mt-4">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{post.content}</p>
              <div className="flex items-center space-x-4 border-t pt-4">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(post.id, post.user_liked || false)}>
                  <Heart className="h-4 w-4 mr-2" /> {post.likes_count || 0}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveCommentForms(prev => ({ ...prev, [post.id]: !prev[post.id] }))}>
                  <MessageCircle className="h-4 w-4 mr-2" /> {post.comments_count || 0}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => sharePost(post.id)}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>

              {activeCommentForms[post.id] && (
                <div className="flex items-center mt-3 gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <Button
                    onClick={() => createComment(post.id)}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {comments[post.id]?.map(c => (
                <div key={c.id} className="mt-4 pl-4 border-l">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.profiles?.avatar_url || ''} />
                      <AvatarFallback>{c.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold">{c.profiles?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                  </div>
                  <p className="ml-8">{c.content}</p>
                  <Button variant="ghost" size="xs" onClick={() => setActiveReplyForms(prev => ({ ...prev, [post.id]: c.id }))}>
                    Reply
                  </Button>

                  {activeReplyForms[post.id] === c.id && (
                    <div className="flex items-center mt-2 ml-8 gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyInputs[c.id] || ''}
                        onChange={e => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                      />
                      <Button
                        onClick={() => createComment(post.id, c.id)}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {c.replies?.map(r => (
                    <div key={r.id} className="mt-2 ml-8">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={r.profiles?.avatar_url || ''} />
                          <AvatarFallback>{r.profiles?.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold">{r.profiles?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                      </div>
                      <p className="ml-8">{r.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseDiscussionsTab;
