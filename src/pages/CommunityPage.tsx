import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CommunityLayout from '@/components/community/CommunityLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MessageCircle, Heart, Share2, Send, Users, Reply, MoreVertical, UserPlus, BookOpen, Bell, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from '@/components/community/EmojiPicker';
import CourseDiscussionsTab from '@/components/community/CourseDiscussionsTab';
import NotificationsTab from '@/components/community/NotificationsTab';
import { EnhancedPostCreation } from '@/components/community/EnhancedPostCreation';
import { ImageGallery } from '@/components/community/ImageGallery';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { RightSidebar } from '@/components/community/RightSidebar';
import { fetchCommunityPosts } from '@/services/communityService';
import { getImagesForPosts } from '@/services/communityImageService';
import { getFollowStatusForUsers } from '@/services/communityFollowerService';
import { useNavigate } from 'react-router-dom';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  course_id?: string;
  emoji_reactions?: any;
  profiles?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    is_following?: boolean;
    followers_count?: number;
    following_count?: number;
  } | null;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
  user_love?: boolean;
  images?: {
    id: string;
    image_url: string;
    alt_text?: string;
    upload_order: number;
  }[];
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
  likes_count?: number;
  user_liked?: boolean;
}

interface CommunityMessage {
  id: string;
  content: string;
  user_id: string;
  channel: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
}

const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Record<string, string>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [activeChannel, setActiveChannel] = useState('general');
  const [showFollowers, setShowFollowers] = useState<{ userId: string; tab: 'followers' | 'following' } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Tab configurations
  const upperTabs = [
    { id: 'feed', label: 'Feed', icon: MessageCircle },
    { id: 'create', label: 'Create Post', icon: Send },
    { id: 'discussions', label: 'Discussions', icon: BookOpen },
  ];

  const lowerTabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'alerts', label: 'Alerts', icon: Bell }
  ];

  useEffect(() => {
    if (user) {
      fetchPostsEnhanced();
      fetchMessages();
      loadCoursesAndEvents();
      const unsubscribe = subscribeToRealtime();
      return () => unsubscribe();
    }
  }, [user, activeChannel]);

  const subscribeToRealtime = () => {
    const postsChannel = supabase
      .channel('community-posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_posts'
      }, () => {
        fetchPostsEnhanced();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('community-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('post-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments'
      }, () => {
        fetchPostsEnhanced();
      })
      .subscribe();

    const likesChannel = supabase
      .channel('post-likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, () => {
        fetchPostsEnhanced();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const fetchPostsEnhanced = async () => {
    try {
      const postsData = await fetchCommunityPosts();
      
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          // Fetch likes count and user like status for each post
          const [likesResult, userLikeResult, commentsResult] = await Promise.all([
            supabase.from('post_likes').select('id').eq('post_id', post.id),
            user ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single() : Promise.resolve({ data: null }),
            supabase.from('post_comments').select('id').eq('post_id', post.id)
          ]);

          return {
            ...post,
            profiles: post.profiles ? {
              id: post.profiles.id,
              full_name: post.profiles.full_name || 'Anonymous',
              username: post.profiles.username || 'user', 
              avatar_url: post.profiles.avatar_url || '',
              is_following: post.profiles.is_following,
              followers_count: post.profiles.followers_count,
              following_count: post.profiles.following_count
            } : null,
            images: post.images || [],
            likes_count: likesResult.data?.length || 0,
            user_liked: !!userLikeResult.data,
            comments_count: commentsResult.data?.length || 0
          };
        })
      );
      
      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndEvents = async () => {
    try {
      const [coursesResult, eventsResult] = await Promise.all([
        supabase.from('courses').select('id, title, thumbnail_url').eq('is_published', true),
        supabase.from('events').select('id, title, image_url, start_time').eq('is_published', true)
      ]);

      if (coursesResult.data) setCourses(coursesResult.data);
      if (eventsResult.data) setEvents(eventsResult.data);
    } catch (error) {
      console.error('Error loading courses and events:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = commentsData?.map(comment => comment.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const profile = profilesData?.find(p => p.id === comment.user_id);
          
          const [likesResult, userLikeResult] = await Promise.all([
            supabase.from('comment_likes').select('id').eq('comment_id', comment.id),
            user ? supabase.from('comment_likes').select('id').eq('comment_id', comment.id).eq('user_id', user.id).single() : Promise.resolve({ data: null })
          ]);

          return {
            ...comment,
            profiles: profile,
            likes_count: likesResult.data?.length || 0,
            user_liked: !!userLikeResult.data
          };
        })
      );

      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      const userIds = messagesData?.map(message => message.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesData?.find(profile => profile.id === message.user_id) || null
      })) || [];

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handlePostCreated = () => {
    fetchPostsEnhanced();
    toast.success('Post created successfully!');
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setPosts(prev => prev.map(post => ({
      ...post,
      profiles: post.profiles?.id === userId ? {
        ...post.profiles,
        is_following: isFollowing,
        followers_count: (post.profiles.followers_count || 0) + (isFollowing ? 1 : -1)
      } : post.profiles
    })));
  };

  const toggleLike = async (postId: string, type: 'like' | 'love' = 'like') => {
    if (!user) return;

    try {
      const currentLike = type === 'like' ? 
        posts.find(p => p.id === postId)?.user_liked :
        posts.find(p => p.id === postId)?.user_love;

      if (currentLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('like_type', type);
      } else {
        await supabase
          .from('post_likes')
          .upsert({
            post_id: postId,
            user_id: user.id,
            like_type: type
          });
      }

      fetchPostsEnhanced();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment[postId],
          parent_id: replyTo[postId] || null
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setReplyTo(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
      fetchPostsEnhanced();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          content: newMessage,
          user_id: user.id,
          channel: activeChannel
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const toggleComments = (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const toggleCommentLike = async (commentId: string, postId: string) => {
    if (!user) return;

    try {
      const isLiked = commentLikes[commentId];

      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        
        setCommentLikes(prev => ({ ...prev, [commentId]: false }));
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            like_type: 'like'
          });
        
        setCommentLikes(prev => ({ ...prev, [commentId]: true }));
      }

      fetchComments(postId);
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleSharePost = async (post: CommunityPost) => {
    try {
      const shareUrl = `${window.location.origin}/community/post/${post.id}`;
      const shareText = `Check out this post: ${post.title}`;
      
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Post shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share post');
    }
  };

  const handlePostClick = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  const renderFeed = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        {posts
          .sort((a, b) => (b.profiles?.followers_count || 0) - (a.profiles?.followers_count || 0))
          .map((post) => (
          <Card 
            key={post.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
            onClick={() => handlePostClick(post.id)}
          >
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-start space-x-3">
                <Avatar 
                  className="w-12 h-12 cursor-pointer ring-2 ring-white shadow-md hover:ring-purple-200 transition-all" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFollowers({ userId: post.user_id, tab: 'followers' });
                  }}
                >
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                    {post.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{post.profiles?.full_name || 'Anonymous'}</h4>
                      {user?.id !== post.user_id && post.profiles && (
                        <UserFollowButton
                          userId={post.user_id}
                          isFollowing={post.profiles.is_following || false}
                          onFollowChange={(userId, isFollowing) => handleFollowChange(userId, isFollowing)}
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
                    {post.profiles?.followers_count && post.profiles.followers_count > 0 && (
                      <>
                        <span>•</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFollowers({ userId: post.user_id, tab: 'followers' });
                          }}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                        >
                          <Users className="h-3 w-3" />
                          <span>{post.profiles.followers_count} followers</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {post.title && (
                <h3 className="text-xl font-bold text-gray-900 mt-4 leading-tight">{post.title}</h3>
              )}
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>
              
              {post.images && post.images.length > 0 && (
                <div className="mt-4 rounded-xl overflow-hidden">
                  <ImageGallery images={post.images.map(img => ({
                    id: img.id,
                    image_url: img.image_url,
                    alt_text: img.alt_text,
                    upload_order: img.upload_order,
                    post_id: '',
                    image_path: '',
                    file_size: 0,
                    file_type: '',
                    created_at: '',
                    updated_at: ''
                  }))} />
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(post.id, 'like');
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      post.user_liked 
                        ? 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100' 
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${post.user_liked ? 'fill-current' : ''}`} />
                    <span>{post.likes_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleComments(post.id, e)}
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span>{post.comments_count || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSharePost(post);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>

              {showComments[post.id] && (
                <div 
                  className="mt-4 pt-4 border-t border-gray-100 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {user && (
                    <div className="flex space-x-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                          {user.user_metadata?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        {replyTo[post.id] && (
                          <div className="text-sm text-muted-foreground">
                            Replying to comment...
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: '' }))}
                              className="ml-2 h-auto p-0 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="min-h-[60px] resize-none border-gray-200"
                          />
                          <Button
                            onClick={() => addComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {comments[post.id]
                    ?.filter(comment => !comment.parent_id)
                    .map((comment) => {
                      const replies = comments[post.id]?.filter(c => c.parent_id === comment.id) || [];
                      
                      return (
                        <div key={comment.id} className="space-y-3">
                          <div className="flex space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-200 to-green-200">
                                {comment.profiles?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">{comment.profiles?.full_name || 'Anonymous'}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCommentLike(comment.id, post.id)}
                                  className={`h-auto p-1 text-xs transition-colors ${
                                    comment.user_liked 
                                      ? 'text-red-500 hover:text-red-600' 
                                      : 'text-muted-foreground hover:text-orange-500'
                                  }`}
                                >
                                  <Heart className={`h-3 w-3 mr-1 ${comment.user_liked ? 'fill-current' : ''}`} />
                                  {comment.likes_count || 0}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: comment.id }))}
                                  className="h-auto p-1 text-xs text-muted-foreground hover:text-purple-500"
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Threaded Replies */}
                          {replies.length > 0 && (
                            <div className="ml-12 space-y-3 pl-4 border-l-2 border-gray-200">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex space-x-3">
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage src={reply.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-r from-purple-200 to-orange-200 text-xs">
                                      {reply.profiles?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-3">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-xs">{reply.profiles?.full_name || 'Anonymous'}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-xs">{reply.content}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleCommentLike(reply.id, post.id)}
                                        className={`h-auto p-1 text-[10px] transition-colors ${
                                          reply.user_liked 
                                            ? 'text-red-500 hover:text-red-600' 
                                            : 'text-muted-foreground hover:text-orange-500'
                                        }`}
                                      >
                                        <Heart className={`h-2.5 w-2.5 mr-1 ${reply.user_liked ? 'fill-current' : ''}`} />
                                        {reply.likes_count || 0}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && !loading && (
          <Card className="bg-white rounded-xl border shadow-sm">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2 text-gray-600">No posts yet</h3>
              <p className="text-gray-500 mb-4">Be the first to share something with the community!</p>
              <Button 
                onClick={() => setActiveTab('create')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                Create First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.profiles?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                {message.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-sm">{message.profiles?.full_name || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );

  if (loading) {
    return (
      <CommunityLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50">
        {!user ? (
          <div className="flex items-center justify-center min-h-screen">
            <Card className="max-w-md mx-4 bg-white/90 backdrop-blur-sm shadow-2xl border-0">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gradient-to-r from-orange-500 to-purple-600" />
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">Join the Community</h2>
                <p className="text-muted-foreground mb-6">Connect with learners worldwide and share your journey.</p>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg" onClick={() => window.location.href = '/login'}>
                  Sign In to Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex gap-6 max-w-7xl mx-auto px-4">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Upper Tabs - Fixed Navigation */}
              <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-lg mb-6 overflow-hidden">
                <div className="flex overflow-x-auto hide-scrollbar">
                  {upperTabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center justify-center space-x-2 px-6 py-4 text-sm font-semibold transition-all duration-300 flex-1 min-w-[120px] ${
                        activeTab === id
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lower Tabs */}
              <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200 shadow-md mb-6 overflow-hidden">
                <div className="flex overflow-x-auto hide-scrollbar">
                  {lowerTabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium transition-all duration-300 flex-1 min-w-[100px] ${
                        activeTab === id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-screen pb-8">
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'create' && user && (
                  <div className="space-y-4">
                    <EnhancedPostCreation 
                      onPostCreated={() => {
                        handlePostCreated();
                        setActiveTab('feed');
                      }}
                      courses={courses}
                      events={events}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                  </div>
                )}
                {activeTab === 'discussions' && (
                  <div>
                    <CourseDiscussionsTab />
                  </div>
                )}
                {activeTab === 'chat' && (
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg">
                    <CardContent className="p-0">
                      {renderChat()}
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'alerts' && user && (
                  <div>
                    <NotificationsTab />
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <RightSidebar />
          </div>
        )}

        {/* Followers Modal */}
        {showFollowers && (
          <FollowersList
            userId={showFollowers.userId}
            isOpen={!!showFollowers}
            onClose={() => setShowFollowers(null)}
            initialTab={showFollowers.tab}
          />
        )}
      </div>
    </CommunityLayout>
  );
};

export default CommunityPage;
