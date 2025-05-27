
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
import { MessageCircle, Heart, Share2, Send, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
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
  };
}

const CommunityPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchMessages();
      subscribeToRealtime();
    }
  }, [user]);

  const subscribeToRealtime = () => {
    // Subscribe to community posts
    const postsChannel = supabase
      .channel('community-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_posts'
      }, (payload) => {
        console.log('New post:', payload);
        fetchPosts(); // Refresh posts when new one is added
      })
      .subscribe();

    // Subscribe to community messages
    const messagesChannel = supabase
      .channel('community-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, (payload) => {
        console.log('New message:', payload);
        fetchMessages(); // Refresh messages when new one is added
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('channel', activeChannel)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          title: newPost.title,
          content: newPost.content,
          user_id: user.id
        });

      if (error) throw error;
      
      setNewPost({ title: '', content: '' });
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
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

  const renderFeed = () => (
    <div className="space-y-6">
      {/* Create Post Form */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Share with the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-4">
              <Input
                placeholder="Post title"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                required
              />
              <Button type="submit" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Post
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>
                    {post.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    @{post.profiles?.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <CardTitle className="mt-4">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Channel List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['general', 'courses', 'events', 'help'].map((channel) => (
              <Button
                key={channel}
                variant={activeChannel === channel ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveChannel(channel);
                  fetchMessages();
                }}
              >
                # {channel}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b">
            <CardTitle># {activeChannel}</CardTitle>
          </CardHeader>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.profiles?.avatar_url} />
                  <AvatarFallback>
                    {message.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-sm">
                      {message.profiles?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          {user && (
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <Input
                  placeholder={`Message #${activeChannel}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-light-purple">
      <CommunityLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {!user ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">Join the Community</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to connect with fellow learners and share your experiences.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'courses' && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">Course Discussions</h3>
                <p className="text-muted-foreground">
                  Course-specific discussions will appear here.
                </p>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">Notifications</h3>
                <p className="text-muted-foreground">
                  Your community notifications will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </CommunityLayout>
    </div>
  );
};

export default CommunityPage;
