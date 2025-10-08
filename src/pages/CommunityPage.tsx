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
import { MessageCircle, Heart, Share2, Send, Users, Reply, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedPostCreation } from '@/components/community/EnhancedPostCreation';
import { ImageGallery } from '@/components/community/ImageGallery';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { RightSidebar } from '@/components/community/RightSidebar';
import { fetchCommunityPosts } from '@/services/communityService';
import { useNavigate } from 'react-router-dom';
import CommunityChatTab from '@/components/community/CommunityChatTab';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommunityPost {
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
    is_following?: boolean;
    followers_count?: number;
    following_count?: number;
  } | null;
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
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

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50">
      <CommunityLayout>
        <div className="flex flex-col items-center justify-center min-h-96 py-12">
          {/* Pulse Animation Container */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            {/* Outer Pulse Circle */}
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
            
            {/* Middle Pulse Circle */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
            
            {/* Inner Pulse Circle */}
            <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
            
            {/* Center Icon */}
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Loading Community
            </h3>
            <p className="text-muted-foreground text-lg">
              Preparing your community feed...
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex space-x-2 mt-6">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </CommunityLayout>
    </div>
  );
};

// PostContent component with See More functionality
interface PostContentProps {
  content: string;
  maxLength?: number;
}

const PostContent: React.FC<PostContentProps> = ({ content, maxLength = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = content.length > maxLength;
  const displayContent = isExpanded || !shouldTruncate ? content : content.slice(0, maxLength) + '...';

  return (
    <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap mb-3">
      <p>{displayContent}</p>
      {shouldTruncate && (
        <Button
          variant="link"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium text-sm mt-1"
        >
          {isExpanded ? 'See Less' : 'See More'}
        </Button>
      )}
    </div>
  );
};

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
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [activeChannel, setActiveChannel] = useState('general');
  const [showFollowers, setShowFollowers] = useState<{ userId: string; tab: 'followers' | 'following' } | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Tab configurations
  const upperTabs = [
    { id: 'feed', label: 'Feed', icon: MessageCircle },
    { id: 'create', label: 'Create Post', icon: Send },
  ];

  const lowerTabs = [
    { id: 'chat', label: 'Ai Chat Support', icon: MessageCircle },
    { id: 'community-chat', label: 'Community Chat', icon: MessageCircle },
  ];

  useEffect(() => {
    if (user) {
      fetchData();
      const unsubscribe = subscribeToRealtime();
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user, activeChannel]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use Promise.all for parallel data fetching
      const [postsData, messagesData, coursesEventsData] = await Promise.allSettled([
        fetchPostsEnhanced(),
        fetchMessages(),
        loadCoursesAndEvents()
      ]);

      // Handle posts data
      if (postsData.status === 'fulfilled') {
        setPosts(postsData.value);
      }

      // Handle messages data
      if (messagesData.status === 'fulfilled') {
        setMessages(messagesData.value);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

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

    return () => {
      postsChannel.unsubscribe();
      messagesChannel.unsubscribe();
    };
  };

  const fetchPostsEnhanced = async (): Promise<CommunityPost[]> => {
    try {
      const postsData = await fetchCommunityPosts();
      
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          // Use Promise.all for parallel data fetching for each post
          const [likesData, commentsData, userLikeData] = await Promise.allSettled([
            // Fetch likes count
            supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id),
            
            // Fetch comments count
            supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id),
            
            // Check if current user liked this post
            user && user.id ? 
              supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
              : Promise.resolve({ data: null, error: null })
          ]);

          const likesCount = likesData.status === 'fulfilled' && !likesData.value.error ? 
            likesData.value.count : 0;
          
          const commentsCount = commentsData.status === 'fulfilled' && !commentsData.value.error ? 
            commentsData.value.count : 0;

          const userLiked = userLikeData.status === 'fulfilled' && userLikeData.value.data ? 
            userLikeData.value.data.length > 0 : false;

          return {
            ...post,
            profiles: post.profiles ? {
              id: post.profiles.id,
              full_name: post.profiles.full_name,
              username: post.profiles.username || 'user', 
              avatar_url: post.profiles.avatar_url || '',
              is_following: post.profiles.is_following,
              followers_count: post.profiles.followers_count,
              following_count: post.profiles.following_count
            } : null,
            images: post.images || [],
            likes_count: likesCount || 0,
            user_liked: userLiked,
            comments_count: commentsCount || 0
          };
        })
      );
      
      return postsWithDetails;
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load community posts');
      return [];
    }
  };

  const loadCoursesAndEvents = async () => {
    try {
      const [coursesResult, eventsResult] = await Promise.all([
        supabase.from('courses').select('id, title, thumbnail_url').eq('is_published', true).limit(5),
        supabase.from('events').select('id, title, image_url, start_time').eq('is_published', true).limit(5)
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
        .order('created_at', { ascending: true })
        .limit(50); // Limit comments to improve performance

      if (error) throw error;

      const userIds = commentsData?.map(comment => comment.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      // Use Promise.all for parallel comment processing
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const profile = profilesData?.find(p => p.id === comment.user_id);
          
          // Fetch comment likes and user like status in parallel
          const [likesData, userLikeData] = await Promise.allSettled([
            supabase
              .from('comment_likes')
              .select('*', { count: 'exact', head: true })
              .eq('comment_id', comment.id),
            user && user.id ? 
              supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
              : Promise.resolve({ data: null, error: null })
          ]);

          const likesCount = likesData.status === 'fulfilled' && !likesData.value.error ? 
            likesData.value.count : 0;

          const userLiked = userLikeData.status === 'fulfilled' && userLikeData.value.data ? 
            userLikeData.value.data.length > 0 : false;

          return {
            ...comment,
            profiles: profile,
            likes_count: likesCount || 0,
            user_liked: userLiked
          };
        })
      );

      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchMessages = async (): Promise<CommunityMessage[]> => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('community_messages')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: true })
        .limit(50); // Limit messages for better performance

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

      return messagesWithProfiles;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  };

  const handlePostCreated = () => {
    fetchPostsEnhanced().then(posts => setPosts(posts));
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

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const currentLike = posts.find(p => p.id === postId)?.user_liked;

      if (currentLike) {
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

      // Optimistically update UI
      setPosts(prev => prev.map(post => 
        post.id === postId ? {
          ...post,
          user_liked: !currentLike,
          likes_count: (post.likes_count || 0) + (currentLike ? -1 : 1)
        } : post
      ));
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
      
      // Refresh comments and update post count
      fetchComments(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? {
          ...post,
          comments_count: (post.comments_count || 0) + 1
        } : post
      ));
      
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
      // Optimistically update messages
      fetchMessages().then(messages => setMessages(messages));
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
      const comment = comments[postId]?.find(c => c.id === commentId);
      const isLiked = comment?.user_liked;

      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            like_type: 'like'
          });
      }

      // Refresh comments for this post
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

  const handlePostClick = (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/community/post/${postId}`);
  };

  const startEditingPost = (post: CommunityPost) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const saveEditedPost = async (postId: string) => {
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ 
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setEditingPost(null);
      setEditContent('');
      fetchPostsEnhanced().then(posts => setPosts(posts));
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const getAvatarFallback = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const getSafeAvatarUrl = (url: string | null | undefined) => {
    if (!url) return '';
    return url;
  };

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  // ... rest of the component remains the same (renderFeed, renderChat, renderCommunityChat, etc.)
  // The main content rendering functions are unchanged from your original code

  const renderFeed = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        {posts
          .sort((a, b) => (b.profiles?.followers_count || 0) - (a.profiles?.followers_count || 0))
          .map((post) => (
          <Card 
            key={post.id} 
            className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
            onClick={(e) => handlePostClick(post.id, e)}
          >
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="cursor-pointer">
                  <Avatar className="w-12 h-12 ring-2 ring-white shadow-md hover:ring-purple-200 transition-all">
                    <AvatarImage 
                      src={getSafeAvatarUrl(post.profiles?.avatar_url)} 
                      alt={post.profiles?.full_name || 'User'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                      {getAvatarFallback(post.profiles?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-gray-900 truncate">
                        {post.profiles?.full_name || 'Anonymous'}
                      </span>
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
                    {user?.id === post.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPost(post);
                            }}
                            className="flex items-center gap-2"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            Edit Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-1">
                    <span>@{post.profiles?.username || 'user'}</span>
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
              {editingPost === post.id ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="Edit your post..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveEditedPost(post.id)}
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <PostContent content={post.content} maxLength={150} />
              )}
              
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
                      toggleLike(post.id);
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
                        <AvatarImage src={getSafeAvatarUrl(user.user_metadata?.avatar_url)} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                          {getAvatarFallback(user.user_metadata?.full_name)}
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
                              <AvatarImage src={getSafeAvatarUrl(comment.profiles?.avatar_url)} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-200 to-green-200">
                                {getAvatarFallback(comment.profiles?.full_name)}
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

                          {replies.length > 0 && (
                            <div className="ml-12 space-y-3 pl-4 border-l-2 border-gray-200">
                              {replies.map(reply => (
                                <div key={reply.id} className="flex space-x-3">
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage src={getSafeAvatarUrl(reply.profiles?.avatar_url)} />
                                    <AvatarFallback className="bg-gradient-to-r from-purple-200 to-orange-200 text-xs">
                                      {getAvatarFallback(reply.profiles?.full_name)}
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
    <CommunityChatTab />
  );

  const renderCommunityChat = () => (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-2xl">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Community Chat
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={getSafeAvatarUrl(message.profiles?.avatar_url)} />
                <AvatarFallback className="bg-gradient-to-r from-green-200 to-teal-200">
                  {getAvatarFallback(message.profiles?.full_name)}
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
        
        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message to the community..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return renderFeed();
      case 'create':
        return user ? (
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
        ) : null;
      case 'chat':
        return renderChat();
      case 'community-chat':
        return renderCommunityChat();
      default:
        return renderFeed();
    }
  };

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
                {renderTabContent()}
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
