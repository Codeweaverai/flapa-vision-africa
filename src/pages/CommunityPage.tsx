
import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CommunityLayout from '@/components/community/CommunityLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { MessageCircle, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { 
  CommunityPost, 
  fetchCommunityPosts, 
  createCommunityPost 
} from '@/services/communityService';
import { supabase } from '@/lib/supabaseClient';

const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  useEffect(() => {
    loadPosts();
    
    // Set up realtime subscription for new posts
    const channel = supabase
      .channel('public:community_posts')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'community_posts' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          loadPosts(); // Reload all posts when there's a change
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    const data = await fetchCommunityPosts();
    setPosts(data);
  };

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please provide both a title and content for your post');
      return;
    }
    
    setIsSubmitting(true);
    
    const post = await createCommunityPost(user?.id, newPostTitle, newPostContent);
    if (post) {
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostForm(false);
      // No need to manually update the posts array as the realtime subscription will handle it
    }
    
    setIsSubmitting(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch (value) {
      case 'feed':
        navigate('/community');
        break;
      case 'chat':
        navigate('/community/chat');
        break;
      case 'courses':
        navigate('/community/courses');
        break;
      case 'notifications':
        navigate('/community/notifications');
        break;
    }
  };

  return (
    <CommunityLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Community Feed</h2>
          <Button onClick={() => setShowNewPostForm(!showNewPostForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
        
        {showNewPostForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create a New Post</CardTitle>
              <CardDescription>Share your thoughts with the community</CardDescription>
            </CardHeader>
            <form onSubmit={handleNewPost}>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Post title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setShowNewPostForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {posts.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary/40" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start a conversation in the community!
            </p>
            <Button onClick={() => setShowNewPostForm(true)}>Create a Post</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {(post.profiles?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.profiles?.full_name || post.profiles?.username || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{post.content}</p>
                </CardContent>
                <CardFooter className="bg-muted/20 py-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CommunityLayout>
  );
};

export default CommunityPage;
