import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MessageCircle, Heart, Share2, Send, Reply, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ImageGallery } from '@/components/community/ImageGallery';
import { UserFollowButton } from '@/components/community/UserFollowButton';

interface PostDetail {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  course_id?: string;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  images?: {
    id: string;
    image_url: string;
    alt_text?: string;
    upload_order: number;
  }[];
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
  likes_count: number;
  user_liked: boolean;
}

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (postId && isValidUUID(postId)) {
      fetchPostDetail();
    } else {
      toast.error('Invalid post ID');
      setLoading(false);
    }
  }, [postId]);

  // Validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchPostDetail = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      
      // Fetch post with profile data
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw postError;
      }

      if (!postData) {
        toast.error('Post not found');
        setLoading(false);
        return;
      }

      // Fetch images
      const { data: imagesData } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', postId)
        .order('upload_order', { ascending: true });

      // Fetch likes count
      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
      }

      // Check if current user liked this post
      let userLiked = false;
      if (user) {
        const { data: userLikeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        userLiked = !!userLikeData;
      }

      // Fetch comments count
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', postId);

      if (commentsError) {
        console.error('Error fetching comments count:', commentsError);
      }

      const initialPost: PostDetail = {
        ...postData,
        images: imagesData || [],
        likes_count: likesData?.length || 0,
        comments_count: commentsData?.length || 0,
        user_liked: userLiked,
        comments: []
      };

      setPost(initialPost);
      await fetchComments();

    } catch (error) {
      console.error('Error fetching post detail:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postId) return;

    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setPost(prev => prev ? { ...prev, comments: [] } : null);
        return;
      }

      // Get unique user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      
      // Fetch user profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      // Fetch comment likes for current user
      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const profile = profilesData?.find(p => p.id === comment.user_id);
          
          // Get total likes for this comment
          const { data: likesData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id);

          // Check if current user liked this comment
          let userLiked = false;
          if (user) {
            const { data: userLikeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            userLiked = !!userLikeData;
          }

          return {
            ...comment,
            profiles: profile || null,
            likes_count: likesData?.length || 0,
            user_liked: userLiked
          };
        })
      );

      setPost(prev => prev ? {
        ...prev,
        comments: commentsWithDetails
      } : null);

    } catch (error) {
      console.error('Error in fetchComments:', error);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      setSubmitting(true);

      if (post.user_liked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setPost(prev => prev ? {
          ...prev,
          likes_count: Math.max(0, (prev.likes_count || 0) - 1),
          user_liked: false
        } : null);
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            like_type: 'like'
          });

        if (error) throw error;

        setPost(prev => prev ? {
          ...prev,
          likes_count: (prev.likes_count || 0) + 1,
          user_liked: true
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim() || !post) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: replyTo || null
        });

      if (error) throw error;

      setNewComment('');
      setReplyTo('');
      toast.success('Comment added!');
      
      // Refresh comments and update count
      await fetchComments();
      await updateCommentsCount();

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentsCount = async () => {
    if (!postId) return;

    try {
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', postId);

      setPost(prev => prev ? {
        ...prev,
        comments_count: commentsData?.length || 0
      } : null);
    } catch (error) {
      console.error('Error updating comments count:', error);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      const comment = post?.comments?.find(c => c.id === commentId);
      if (!comment) return;

      if (comment.user_liked) {
        // Unlike comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        setPost(prev => prev ? {
          ...prev,
          comments: prev.comments?.map(c => 
            c.id === commentId 
              ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) - 1), user_liked: false }
              : c
          )
        } : null);
      } else {
        // Like comment
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            like_type: 'like'
          });

        if (error) throw error;

        setPost(prev => prev ? {
          ...prev,
          comments: prev.comments?.map(c => 
            c.id === commentId 
              ? { ...c, likes_count: (c.likes_count || 0) + 1, user_liked: true }
              : c
          )
        } : null);
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleSharePost = async () => {
    if (!post) return;

    try {
      const shareUrl = `${window.location.origin}/community/post/${post.id}`;
      const shareText = post.title ? `Check out this post: ${post.title}` : 'Check out this post';
      
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Community Post',
          text: shareText,
          url: shareUrl,
        });
        toast.success('Post shared successfully!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (error instanceof Error && !error.message.includes('AbortError')) {
        toast.error('Failed to share post');
      }
    }
  };

  const getAvatarFallback = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
            <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/community')}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              Back to Community
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/community')}
          className="mb-6 flex items-center gap-2 hover:bg-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Button>

        {/* Post Card */}
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg mb-6">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12 cursor-pointer ring-2 ring-white shadow-md">
                <AvatarImage 
                  src={post.profiles?.avatar_url || ''} 
                  alt={post.profiles?.full_name || 'User'}
                  onError={(e) => {
                    // Hide broken images
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                  {getAvatarFallback(post.profiles?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">
                      {post.profiles?.full_name || 'Anonymous'}
                    </h4>
                    {user?.id !== post.user_id && post.profiles && (
                      <UserFollowButton
                        userId={post.user_id}
                        isFollowing={false}
                        onFollowChange={() => {}}
                        size="sm"
                        showCount={false}
                        variant="ghost"
                        className="shrink-0"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-1">
                  <span className="font-medium">@{post.profiles?.username || 'user'}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            {post.title && (
              <h1 className="text-2xl font-bold text-gray-900 mt-4 leading-tight">{post.title}</h1>
            )}
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </p>
            
            {post.images && post.images.length > 0 && (
              <div className="mt-4 rounded-xl overflow-hidden">
                <ImageGallery images={post.images} />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={toggleLike}
                  disabled={submitting}
                  className={`px-6 py-3 rounded-full text-base font-medium transition-all ${
                    post.user_liked 
                      ? 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100' 
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50'
                  }`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${post.user_liked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="px-6 py-3 rounded-full text-base font-medium text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  <span>{post.comments_count} comments</span>
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleSharePost}
                  className="px-6 py-3 rounded-full text-base font-medium text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Comments ({post.comments_count})
            </h3>
            
            {/* Add Comment */}
            {user && (
              <div className="flex space-x-4 mb-8">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                    {getAvatarFallback(user.user_metadata?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  {replyTo && (
                    <div className="text-sm text-muted-foreground bg-blue-50 rounded-lg p-3">
                      Replying to comment...
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTo('')}
                        className="ml-2 h-auto p-0 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none border-gray-200 text-base"
                      disabled={submitting}
                    />
                    <Button
                      onClick={addComment}
                      disabled={!newComment.trim() || submitting}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 h-auto px-6"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {post.comments && post.comments.length > 0 ? (
                post.comments
                  .filter(comment => !comment.parent_id)
                  .map((comment) => {
                    const replies = post.comments?.filter(c => c.parent_id === comment.id) || [];
                    
                    return (
                      <div key={comment.id} className="space-y-4">
                        <div className="flex space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-200 to-green-200">
                              {getAvatarFallback(comment.profiles?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-gray-900">
                                  {comment.profiles?.full_name || 'Anonymous'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                            <div className="flex items-center space-x-4 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCommentLike(comment.id)}
                                className={`h-auto p-2 text-sm transition-colors ${
                                  comment.user_liked 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-muted-foreground hover:text-orange-500'
                                }`}
                              >
                                <Heart className={`h-4 w-4 mr-1 ${comment.user_liked ? 'fill-current' : ''}`} />
                                {comment.likes_count}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyTo(comment.id)}
                                className="h-auto p-2 text-sm text-muted-foreground hover:text-purple-500"
                              >
                                <Reply className="h-4 w-4 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Threaded Replies */}
                        {replies.length > 0 && (
                          <div className="ml-14 space-y-4 pl-6 border-l-2 border-gray-200">
                            {replies.map(reply => (
                              <div key={reply.id} className="flex space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={reply.profiles?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-to-r from-purple-200 to-orange-200 text-xs">
                                    {getAvatarFallback(reply.profiles?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm">
                                        {reply.profiles?.full_name || 'Anonymous'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{reply.content}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCommentLike(reply.id)}
                                      className={`h-auto p-1 text-xs transition-colors ${
                                        reply.user_liked 
                                          ? 'text-red-500 hover:text-red-600' 
                                          : 'text-muted-foreground hover:text-orange-500'
                                      }`}
                                    >
                                      <Heart className={`h-3 w-3 mr-1 ${reply.user_liked ? 'fill-current' : ''}`} />
                                      {reply.likes_count}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostDetailPage;
