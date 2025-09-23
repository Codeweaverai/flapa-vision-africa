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
import { MessageCircle, Heart, Share2, Send, Users, Reply, MoreVertical, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from '@/components/community/EmojiPicker';
import CourseDiscussionsTab from '@/components/community/CourseDiscussionsTab';
import NotificationsTab from '@/components/community/NotificationsTab';
import { EnhancedPostCreation } from '@/components/community/EnhancedPostCreation';
import { ImageGallery } from '@/components/community/ImageGallery';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import { FollowersList } from '@/components/community/FollowersList';
import { fetchCommunityPosts } from '@/services/communityService';
import { getImagesForPosts } from '@/services/communityImageService';
import { getFollowStatusForUsers } from '@/services/communityFollowerService';

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

  useEffect(() => {
    if (user) {
      fetchPostsEnhanced();
      fetchMessages();
      loadCoursesAndEvents();
      subscribeToRealtime();
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

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(commentsChannel);
    };
  };

  const fetchPostsEnhanced = async () => {
    try {
      // Use the enhanced service to get posts with images and follow status
      const postsData = await fetchCommunityPosts();
      
      // Filter out course-specific posts for the main feed  
      const mainFeedPosts = postsData.filter(post => !post.course_id).map(post => ({
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
        images: post.images || []
      }));
      
      setPosts(mainFeedPosts);
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
    // Update the posts to reflect the new follow status
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

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const renderFeed = () => (
    <div className="space-y-6">
      {user && (
        <EnhancedPostCreation 
          onPostCreated={handlePostCreated}
          courses={courses}
          events={events}
          className="bg-white/90 backdrop-blur-sm border-0 shadow-xl"
        />
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="cursor-pointer" onClick={() => setShowFollowers({ userId: post.user_id, tab: 'followers' })}>
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
                      {user?.id !== post.user_id && post.profiles && (
                        <UserFollowButton
                          userId={post.user_id}
                          isFollowing={post.profiles.is_following || false}
                        onFollowChange={(isFollowing) => handleFollowChange(post.user_id, isFollowing)}
                          size="sm"
                          showCount={false}
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>@{post.profiles?.username || 'user'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      {post.profiles?.followers_count && (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => setShowFollowers({ userId: post.user_id, tab: 'followers' })}
                            className="hover:text-orange-500 transition-colors"
                          >
                            <Users className="h-3 w-3 inline mr-1" />
                            {post.profiles.followers_count} followers
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <CardTitle className="mt-4 text-lg">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap mb-4">{post.content}</p>
              
              {/* Image Gallery */}
              {post.images && post.images.length > 0 && (
                <div className="mb-4">
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
              <div className="flex items-center justify-between pt-4 border-t border-gradient-to-r from-orange-100 to-purple-100">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id, 'like')}
                    className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all ${post.user_liked ? 'text-orange-500' : 'text-gray-500'}`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${post.user_liked ? 'fill-current' : ''}`} />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id, 'love')}
                    className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all ${post.user_love ? 'text-purple-500' : 'text-gray-500'}`}
                  >
                    ❤️ Love
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComments(post.id)}
                    className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.comments_count || 0} Comments
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent font-medium">
                    {post.likes_count || 0} likes
                  </span>
                </div>
              </div>

              {showComments[post.id] && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {user && (
                    <div className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                          {user.user_metadata?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        {replyTo[post.id] && (
                          <div className="bg-gray-100 p-2 rounded text-sm">
                            <span className="text-gray-600">Replying to a comment</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: '' }))}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="flex-1 bg-white/50"
                          />
                          <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => ({ ...prev, [post.id]: (prev[post.id] || '') + emoji }))} />
                          <Button
                            onClick={() => addComment(post.id)}
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex space-x-3 bg-gray-50/80 backdrop-blur-sm p-3 rounded-lg">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200 text-xs">
                            {comment.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium">{comment.profiles?.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              {comment.likes_count || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: comment.id }))}
                              className="h-6 px-2 text-xs"
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Chat
            </CardTitle>
            <Badge variant="outline" className="bg-white/50">
              {activeChannel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg">
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.profiles?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200">
                    {message.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium">{message.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm bg-white/80 backdrop-blur-sm p-2 rounded">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          {user && (
            <form onSubmit={sendMessage} className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white/50"
              />
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <CommunityLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {!user ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Join the Community</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to connect with fellow learners and share your experiences.
              </p>
              <Button onClick={() => window.location.href = '/auth'} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'courses' && <CourseDiscussionsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </>
        )}
      </CommunityLayout>
    </div>
  );
};

export default CommunityPage;
