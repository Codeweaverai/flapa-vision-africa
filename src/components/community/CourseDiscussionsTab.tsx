import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, MessageCircle, Share2, Plus, Search, Clock, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  course_id?: string;
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  comments?: Comment[];
  comments_count?: number;
  likes_count?: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

const CourseDiscussionsTab = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [commentDialogs, setCommentDialogs] = useState<Record<string, boolean>>({});
  const [newPostData, setNewPostData] = useState({
    title: '',
    content: '',
    course_id: ''
  });
  const [newComments, setNewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      await loadPosts();
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get profiles for post authors
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Load comments and comment authors for each post
      const postsWithComments = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: comments, error: commentsError } = await supabase
            .from('post_comments')
            .select('id, content, created_at, user_id, post_id')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          if (commentsError) {
            console.error('Error loading comments:', commentsError);
          }

          // Get comment author profiles
          const commentUserIds = [...new Set(comments?.map(comment => comment.user_id) || [])];
          const { data: commentProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', commentUserIds);

          const commentsWithProfiles = (comments || []).map(comment => ({
            ...comment,
            profiles: (commentProfiles || []).find(profile => profile.id === comment.user_id) || {
              id: comment.user_id,
              username: 'Unknown User',
              full_name: 'Unknown User',
              avatar_url: null
            }
          }));

          return {
            ...post,
            profiles: (profiles || []).find(profile => profile.id === post.user_id) || {
              id: post.user_id,
              username: 'Unknown User',
              full_name: 'Unknown User',
              avatar_url: null
            },
            comments: commentsWithProfiles,
            comments_count: commentsWithProfiles.length,
            likes_count: Math.floor(Math.random() * 20) // Placeholder for now
          };
        })
      );

      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load discussions');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!newPostData.title.trim() || !newPostData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: newPostData.title.trim(),
          content: newPostData.content.trim(),
          user_id: currentUser.id,
          course_id: newPostData.course_id || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Post created successfully!');
      setNewPostDialog(false);
      setNewPostData({ title: '', content: '', course_id: '' });
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to comment');
      return;
    }

    const commentContent = newComments[postId]?.trim();
    if (!commentContent) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          content: commentContent,
          post_id: postId,
          user_id: currentUser.id
        });

      if (error) throw error;

      toast.success('Comment added successfully!');
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      setCommentDialogs(prev => ({ ...prev, [postId]: false }));
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const openCommentDialog = (postId: string) => {
    setCommentDialogs(prev => ({ ...prev, [postId]: true }));
  };

  const closeCommentDialog = (postId: string) => {
    setCommentDialogs(prev => ({ ...prev, [postId]: false }));
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserDisplayName = (profile: any) => {
    return profile?.full_name || profile?.username || 'Anonymous User';
  };

  const getUserInitials = (profile: any) => {
    const name = getUserDisplayName(profile);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Discussions</h2>
          <p className="text-muted-foreground">Join conversations about courses and share knowledge</p>
        </div>
        
        <Dialog open={newPostDialog} onOpenChange={setNewPostDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Start a New Discussion</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="title">Discussion Title</Label>
                <Input
                  id="title"
                  value={newPostData.title}
                  onChange={(e) => setNewPostData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What would you like to discuss?"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPostData.content}
                  onChange={(e) => setNewPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts, questions, or insights..."
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setNewPostDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  Create Discussion
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Total Discussions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{new Set(posts.map(p => p.user_id)).size}</p>
                <p className="text-sm text-muted-foreground">Active Contributors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Be the first to start a discussion!'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setNewPostDialog(true)}>
                  Start Discussion
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>{getUserInitials(post.profiles)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getUserDisplayName(post.profiles)}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  {post.course_id && (
                    <Badge variant="secondary">Course Discussion</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
                    <Heart className="h-4 w-4 mr-2" />
                    {post.likes_count || 0}
                  </Button>
                  
                  <Dialog 
                    open={commentDialogs[post.id] || false} 
                    onOpenChange={(open) => open ? openCommentDialog(post.id) : closeCommentDialog(post.id)}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-blue-600"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments_count || 0}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Comments on "{post.title}"</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Existing Comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-3">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.profiles?.avatar_url} />
                                  <AvatarFallback>{getUserInitials(comment.profiles)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{getUserDisplayName(comment.profiles)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add New Comment */}
                        {currentUser ? (
                          <div className="space-y-3 pt-4 border-t">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComments[post.id] || ''}
                              onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => closeCommentDialog(post.id)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComments[post.id]?.trim()}
                              >
                                Add Comment
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            Please sign in to add comments
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-600">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionsTab;
