import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Share2, Heart, Search, BookOpen, Calendar, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_time: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  course_id?: string;
  event_id?: string;
  profiles: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  comments: Comment[];
  comments_count: number;
  likes_count: number;
  emoji_reactions: Record<string, number>;
}

const CourseDiscussionsTab = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | 'course' | 'event'>('all');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commentDialogs, setCommentDialogs] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'course' as 'course' | 'event',
    content_id: ''
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      await Promise.all([
        loadPosts(),
        loadCourses(),
        loadEvents()
      ]);
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      // Load comments for each post separately
      const postsWithComments = await Promise.all(
        (data || []).map(async (post) => {
          const { data: comments, error: commentsError } = await supabase
            .from('post_comments')
            .select(`
              *,
              profiles:user_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          if (commentsError) {
            console.error('Error loading comments:', commentsError);
          }

          return {
            ...post,
            comments: comments || [],
            comments_count: comments?.length || 0,
            likes_count: 0, // You can implement likes later
          };
        })
      );

      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .eq('is_published', true)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error loading courses:', error);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, image_url, start_time')
        .eq('is_published', true)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to create a post');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        user_id: currentUser.id,
        course_id: formData.content_type === 'course' ? formData.content_id : null,
        event_id: formData.content_type === 'event' ? formData.content_id : null
      };

      const { error } = await supabase
        .from('community_posts')
        .insert(postData);

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return;
      }

      toast.success('Post created successfully');
      setDialogOpen(false);
      setFormData({ title: '', content: '', content_type: 'course', content_id: '' });
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }

    const commentText = newComment[postId]?.trim();
    if (!commentText) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: commentText
        });

      if (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
        return;
      }

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setCommentDialogs(prev => ({ ...prev, [postId]: false }));
      toast.success('Comment added successfully');
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const toggleCommentDialog = (postId: string) => {
    setCommentDialogs(prev => ({ 
      ...prev, 
      [postId]: !prev[postId] 
    }));
  };

  const handleShare = async (post: CommunityPost) => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (contentType === 'course') {
      return matchesSearch && post.course_id;
    } else if (contentType === 'event') {
      return matchesSearch && post.event_id;
    }
    
    return matchesSearch;
  });

  const getContentBadge = (post: CommunityPost) => {
    if (post.course_id) {
      const course = courses.find(c => c.id === post.course_id);
      return (
        <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 border-purple-200">
          <BookOpen className="h-3 w-3 mr-1" />
          {course ? course.title : 'Course'}
        </Badge>
      );
    } else if (post.event_id) {
      const event = events.find(e => e.id === post.event_id);
      return (
        <Badge className="bg-gradient-to-r from-orange-100 to-purple-100 text-orange-800 border-orange-200">
          <Calendar className="h-3 w-3 mr-1" />
          {event ? event.title : 'Event'}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search" className="text-gray-700 font-medium">Search Discussions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search posts, courses, or events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="contentType" className="text-gray-700 font-medium">Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger className="w-40 border-gray-200 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="course">Courses Only</SelectItem>
                  <SelectItem value="event">Events Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                    Create New Discussion
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-medium">Discussion Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What would you like to discuss?"
                      className="border-gray-200 focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="content_type" className="text-gray-700 font-medium">Discussion Type</Label>
                      <Select 
                        value={formData.content_type} 
                        onValueChange={(value: 'course' | 'event') => 
                          setFormData(prev => ({ ...prev, content_type: value, content_id: '' }))
                        }
                      >
                        <SelectTrigger className="border-gray-200 focus:border-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">Course Discussion</SelectItem>
                          <SelectItem value="event">Event Discussion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="content_id" className="text-gray-700 font-medium">
                        Select {formData.content_type === 'course' ? 'Course' : 'Event'}
                      </Label>
                      <Select 
                        value={formData.content_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, content_id: value }))}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-orange-500">
                          <SelectValue placeholder={`Choose ${formData.content_type}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.content_type === 'course' 
                            ? courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.title}
                                </SelectItem>
                              ))
                            : events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.title}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-gray-700 font-medium">Discussion Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts, questions, or insights..."
                      className="min-h-24 border-gray-200 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-300 text-gray-700">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                      Create Discussion
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="pt-8 pb-10 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No discussions found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? `No discussions match "${searchQuery}"`
                  : 'Be the first to start a discussion!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt={post.profiles.full_name || post.profiles.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {(post.profiles?.full_name || post.profiles?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {post.profiles?.full_name || post.profiles?.username || 'Anonymous User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getContentBadge(post)}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{post.title}</h3>
                <p className="text-gray-700 mb-4">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-700 hover:bg-purple-50">
                    <Heart className="h-4 w-4 mr-2" />
                    {post.likes_count || 0}
                  </Button>
                  
                  <Dialog open={commentDialogs[post.id]} onOpenChange={(open) => toggleCommentDialog(post.id)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-700 hover:bg-orange-50">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments_count || 0}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                          Comments on "{post.title}"
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Existing Comments */}
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                            {comment.profiles?.avatar_url ? (
                              <img
                                src={comment.profiles.avatar_url}
                                alt={comment.profiles.full_name || comment.profiles.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                {(comment.profiles?.full_name || comment.profiles?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous User'}
                              </p>
                              <p className="text-gray-700 mt-1">{comment.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )) || []}

                        {/* Add New Comment */}
                        {currentUser && (
                          <div className="flex space-x-3 p-4 border-t border-gray-200">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                              {(currentUser.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <Textarea
                                placeholder="Add your comment..."
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="mb-2 border-gray-200 focus:border-purple-500"
                                rows={2}
                              />
                              <Button
                                onClick={() => handleAddComment(post.id)}
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                              >
                                <Send className="h-3 w-3 mr-2" />
                                Post Comment
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleShare(post)}
                    className="text-gray-600 hover:text-orange-700 hover:bg-orange-50"
                  >
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
