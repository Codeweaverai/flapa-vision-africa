import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { MessageCircle, Heart, Share2, Send, Reply, ArrowLeft, Image as ImageIcon, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RightSidebar } from '@/components/community/RightSidebar';
import { UserFollowButton } from '@/components/community/UserFollowButton';
import Layout from '@/components/layout/Layout';

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
    is_following?: boolean;
    followers_count?: number;
    following_count?: number;
  } | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  images?: {
    id: string;
    image_url: string;
    image_path: string;
    alt_text?: string;
    upload_order: number;
    file_size: number;
    file_type: string;
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

// Left Sidebar - Discover People Component
const DiscoverPeople = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPeople();
    }
  }, [user]);

  const fetchPeople = async () => {
    try {
      if (!user?.id) return;

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .neq('id', user.id)
        .limit(8);

      if (error) throw error;

      if (profiles) {
        const profilesWithDetails = await Promise.all(
          profiles.map(async (profile) => {
            const { count: followersCount } = await supabase
              .from('community_followers')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', profile.id);

            const { data: followStatus } = await supabase
              .from('community_followers')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', profile.id)
              .single();

            return {
              ...profile,
              followers_count: followersCount || 0,
              is_following: !!followStatus
            };
          })
        );

        const sortedProfiles = profilesWithDetails.sort((a, b) => 
          (b.followers_count || 0) - (a.followers_count || 0)
        );

        setPeople(sortedProfiles);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
      toast.error('Failed to load suggested people');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = async (userId: string, isFollowing: boolean) => {
    if (!user) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('community_followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        
        setPeople(prev => prev.map(person => 
          person.id === userId 
            ? { 
                ...person, 
                is_following: true,
                followers_count: (person.followers_count || 0) + 1
              } 
            : person
        ));
        
        toast.success('User followed successfully!');
      } else {
        const { error } = await supabase
          .from('community_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        
        setPeople(prev => prev.map(person => 
          person.id === userId 
            ? { 
                ...person, 
                is_following: false,
                followers_count: Math.max(0, (person.followers_count || 0) - 1)
              } 
            : person
        ));
        
        toast.success('User unfollowed successfully!');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const getSafeImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    const matches = url.match(/asset\/(.+)/) || url.match(/profile_pictures\/(.+)/);
    if (matches && matches[1]) {
      return supabase.storage.from('asset').getPublicUrl(matches[1]).data.publicUrl;
    }
    
    return url;
  };

  const getAvatarFallback = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleUserClick = (userId: string) => {
    navigate(`/creator/profile/${userId}`);
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg sticky top-6">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Discover People</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg sticky top-6">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-gray-900">Discover People</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {people.map((person) => (
            <div key={person.id} className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                onClick={() => handleUserClick(person.id)}
              >
                <Avatar className="w-10 h-10 hover:ring-2 hover:ring-purple-200 transition-all">
                  <AvatarImage 
                    src={getSafeImageUrl(person.avatar_url) || ''} 
                    alt={person.full_name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white text-sm">
                    {getAvatarFallback(person.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate hover:text-purple-600 transition-colors mt-2">
                    {person.full_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{person.username || 'user'}</p>
                  {person.followers_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold mt-1">
                      <Users className="h-3 w-3" />
                      <span>{person.followers_count} followers</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-3 mt-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowChange(person.id, !person.is_following);
                  }}
                  size="sm"
                  className={`text-xs px-3 py-1 h-auto transition-all duration-200 ${
                    person.is_following 
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {person.is_following ? 'Following' : 'Follow'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {people.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No people to discover yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
    const extractPostIdFromUrl = () => {
      const pathSegments = window.location.pathname.split('/');
      const postIdIndex = pathSegments.indexOf('post') + 1;
      return pathSegments[postIdIndex];
    };

    let actualPostId = postId;
    
    if (!actualPostId || actualPostId === 'undefined') {
      actualPostId = extractPostIdFromUrl();
    }

    if (actualPostId && actualPostId !== 'undefined' && isValidUUID(actualPostId)) {
      fetchPostDetail(actualPostId);
    } else {
      toast.error('Invalid post URL');
      setLoading(false);
    }
  }, [postId]);

  const isValidUUID = (uuid: string) => {
    if (!uuid || uuid === 'undefined') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchPostDetail = async (postIdToFetch: string) => {
    if (!postIdToFetch) return;

    try {
      setLoading(true);
      
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
        .eq('id', postIdToFetch)
        .single();

      if (postError) {
        console.error('Error fetching post details:', postError);
        throw postError;
      }

      if (!postData) {
        toast.error('Post not found');
        setLoading(false);
        return;
      }

      // Fetch images from community_post_images table
      let imagesData = [];
      try {
        const { data: images, error: imagesError } = await supabase
          .from('community_post_images')
          .select('*')
          .eq('post_id', postIdToFetch)
          .order('upload_order', { ascending: true });

        if (!imagesError) {
          imagesData = images || [];
        }
      } catch (imagesError) {
        console.error('Error fetching images:', imagesError);
      }

      // Fetch likes count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postIdToFetch);

      // Check if current user liked this post
      let userLiked = false;
      if (user && user.id) {
        const { data: userLikeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postIdToFetch)
          .eq('user_id', user.id);
        userLiked = !!(userLikeData && userLikeData.length > 0);
      }

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postIdToFetch);

      const initialPost: PostDetail = {
        ...postData,
        images: imagesData,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_liked: userLiked,
        comments: []
      };

      setPost(initialPost);
      await fetchComments(postIdToFetch);

    } catch (error) {
      console.error('Error in fetchPostDetail:', error);
      toast.error('Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postIdToFetch: string) => {
    if (!postIdToFetch) return;

    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postIdToFetch)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setPost(prev => prev ? { ...prev, comments: [] } : null);
        return;
      }

      const userIds = [...new Set(commentsData.map(comment => comment.user_id).filter(Boolean))];
      
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);
        profilesData = profiles || [];
      }

      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const profile = profilesData.find(p => p.id === comment.user_id);
          
          const { count: likesCount } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          let userLiked = false;
          if (user) {
            const { data: userLikeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id);
            userLiked = !!(userLikeData && userLikeData.length > 0);
          }

          return {
            ...comment,
            profiles: profile || null,
            likes_count: likesCount || 0,
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
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setPost(prev => prev ? {
          ...prev,
          likes_count: Math.max(0, prev.likes_count - 1),
          user_liked: false
        } : null);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            like_type: 'like'
          });

        setPost(prev => prev ? {
          ...prev,
          likes_count: prev.likes_count + 1,
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
      
      await fetchComments(post.id);
      await updateCommentsCount();

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateCommentsCount = async () => {
    if (!post) return;

    try {
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      setPost(prev => prev ? {
        ...prev,
        comments_count: commentsCount || 0
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
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        setPost(prev => prev ? {
          ...prev,
          comments: prev.comments?.map(c => 
            c.id === commentId 
              ? { ...c, likes_count: Math.max(0, c.likes_count - 1), user_liked: false }
              : c
          )
        } : null);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            like_type: 'like'
          });

        setPost(prev => prev ? {
          ...prev,
          comments: prev.comments?.map(c => 
            c.id === commentId 
              ? { ...c, likes_count: c.likes_count + 1, user_liked: true }
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
      
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Community Post',
          text: post.content?.substring(0, 100) || 'Check out this post',
          url: shareUrl,
        });
        toast.success('Post shared successfully!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } else {
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  const handleUserProfileClick = (userId: string) => {
    navigate(`/creator/profile/${userId}`);
  };

  // Updated PostImageGallery with click handler to route to detail page
  const PostImageGallery = ({ images }: { images: any[] }) => {
    if (!images || images.length === 0) return null;

    const handleImageClick = (image: any, index: number) => {
      // Since we're already on the post detail page, we can implement:
      // 1. Image modal for better viewing
      // 2. Zoom functionality
      // 3. Image carousel
      console.log('Image clicked:', image, index);
      
      // You can implement modal opening logic here:
      // setSelectedImage({ image, index });
      // setShowImageModal(true);
    };

    return (
      <div className="mt-4 space-y-4">
        {images.map((image, index) => {
          const imageUrl = getSafeImageUrl(image.image_url) || getSafeImageUrl(image.image_path);
          
          if (!imageUrl) return null;
          
          return (
            <div 
              key={image.id} 
              className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer transition-transform hover:scale-[1.02] duration-200"
              onClick={() => handleImageClick(image, index)}
            >
              <img
                src={imageUrl}
                alt={image.alt_text || `Post image ${index + 1}`}
                className="w-full h-auto max-h-96 object-contain"
                onError={handleImageError}
              />
              {image.alt_text && (
                <div className="p-2 bg-white border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">{image.alt_text}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
              <p className="text-gray-600 mb-6">The post may have been deleted or the URL is incorrect.</p>
              <Button 
                onClick={() => navigate('/community')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                Back to Community
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-orange-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Button - Updated with orange-purple gradient */}
          <div className="mb-6">
            <Button
              onClick={() => navigate('/community')}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Button>
          </div>

          <div className="flex gap-6">
            {/* Left Sidebar - Discover People */}
            <div className="w-80 flex-shrink-0">
              <DiscoverPeople />
            </div>

            {/* Main Content - Reduced Width */}
            <div className="flex-1 max-w-2xl">
              {/* Post Card */}
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg mb-6 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      className="w-12 h-12 cursor-pointer ring-2 ring-white shadow-md hover:ring-purple-200 transition-all"
                      onClick={() => post.profiles && handleUserProfileClick(post.profiles.id)}
                    >
                      <AvatarImage 
                        src={getSafeImageUrl(post.profiles?.avatar_url) || ''} 
                        alt={post.profiles?.full_name || 'User'}
                        onError={handleImageError}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-semibold">
                        {getAvatarFallback(post.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 
                          className="font-bold text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => post.profiles && handleUserProfileClick(post.profiles.id)}
                        >
                          {post.profiles?.full_name || 'Anonymous'}
                        </h4>
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
                  
                  {/* Images Section with click handling */}
                  {post.images && post.images.length > 0 ? (
                    <PostImageGallery images={post.images} />
                  ) : (
                    <div className="mt-4 text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded-lg">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No images in this post</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={toggleLike}
                        disabled={submitting}
                        className={`px-6 py-3 rounded-full text-base font-medium transition-all duration-200 ${
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
                        className="px-6 py-3 rounded-full text-base font-medium text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        <span>{post.comments_count} comments</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleSharePost}
                        className="px-6 py-3 rounded-full text-base font-medium text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-200"
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Comments ({post.comments_count})
                  </h3>
                  
                  {/* Add Comment */}
                  {user && (
                    <div className="flex space-x-4 mb-8">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={getSafeImageUrl(user.user_metadata?.avatar_url) || ''} 
                          onError={handleImageError}
                        />
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
                            className="min-h-[80px] resize-none border-gray-200 text-base focus:border-purple-300 transition-colors duration-200"
                            disabled={submitting}
                          />
                          <Button
                            onClick={addComment}
                            disabled={!newComment.trim() || submitting}
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white h-auto px-6 transition-all duration-200"
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
                                <Avatar 
                                  className="w-10 h-10 cursor-pointer"
                                  onClick={() => comment.profiles && handleUserProfileClick(comment.user_id)}
                                >
                                  <AvatarImage 
                                    src={getSafeImageUrl(comment.profiles?.avatar_url) || ''} 
                                    onError={handleImageError}
                                  />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-200 to-green-200">
                                    {getAvatarFallback(comment.profiles?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <span 
                                        className="font-semibold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors"
                                        onClick={() => comment.profiles && handleUserProfileClick(comment.user_id)}
                                      >
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
                                      className={`h-auto p-2 text-sm transition-colors duration-200 ${
                                        comment.user_liked 
                                          ? 'text-red-500 hover:text-red-600' 
                                          : 'text-muted-foreground hover:text-orange-500'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 mr-1 ${comment.user_liked ? 'fill-current' : ''}`} />
                                      {comment.likes_count}
                                    </Button>
                                    {user && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReplyTo(comment.id)}
                                        className="h-auto p-2 text-sm text-muted-foreground hover:text-purple-500 transition-colors duration-200"
                                      >
                                        <Reply className="h-4 w-4 mr-1" />
                                        Reply
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Threaded Replies */}
                              {replies.length > 0 && (
                                <div className="ml-14 space-y-4 pl-6 border-l-2 border-gray-200">
                                  {replies.map(reply => (
                                    <div key={reply.id} className="flex space-x-3">
                                      <Avatar 
                                        className="w-8 h-8 cursor-pointer"
                                        onClick={() => reply.profiles && handleUserProfileClick(reply.user_id)}
                                      >
                                        <AvatarImage 
                                          src={getSafeImageUrl(reply.profiles?.avatar_url) || ''} 
                                          onError={handleImageError}
                                        />
                                        <AvatarFallback className="bg-gradient-to-r from-purple-200 to-orange-200 text-xs">
                                          {getAvatarFallback(reply.profiles?.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-3 hover:from-purple-100 hover:to-orange-100 transition-all duration-200">
                                          <div className="flex items-center space-x-2 mb-1">
                                            <span 
                                              className="font-medium text-sm cursor-pointer hover:text-purple-600 transition-colors"
                                              onClick={() => reply.profiles && handleUserProfileClick(reply.user_id)}
                                            >
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
                                            className={`h-auto p-1 text-xs transition-colors duration-200 ${
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

            {/* Right Sidebar */}
            <div className="w-80 flex-shrink-0">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostDetailPage;
