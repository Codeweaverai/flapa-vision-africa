import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Share2, Heart, Search, BookOpen, Calendar, Plus, Send, Reply, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { UserFollowButton } from './UserFollowButton';
import { FollowersList } from './FollowersList';
import { EnhancedPostCreation } from './EnhancedPostCreation';
import { ImageGallery } from './ImageGallery';
import { fetchCommunityPosts } from '@/services/communityService';
import { getFollowers, getFollowing } from '@/services/communityFollowerService';
import { formatDistanceToNow } from 'date-fns';

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
  post_id: string;
  parent_id?: string;
  emoji_reactions?: any;
  profiles: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
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
    is_following?: boolean;
    followers_count?: number;
  };
  comments: Comment[];
  comments_count: number;
  likes_count: number;
  emoji_reactions: Record<string, number>;
  images?: any[];
}

const CourseDiscussionsTab = () => {
  const [activeTab, setActiveTab] = useState('discussions');
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
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [people, setPeople] = useState<any[]>([]);
  const [showFollowers, setShowFollowers] = useState<{ userId: string; tab: 'followers' | 'following' } | null>(null);
  
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
        loadEvents(),
        loadPeople()
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
      const postsData = await fetchCommunityPosts();
      // Ensure type compatibility
      const mappedPosts = postsData.map(post => ({
        ...post,
        profiles: post.profiles || {
          id: '',
          username: 'user',
          full_name: 'Anonymous',
          avatar_url: '',
          is_following: false,
          followers_count: 0
        },
        comments_count: post.comments?.length || 0,
        likes_count: post.like_count || 0,
        emoji_reactions: {},
        comments: post.comments || []
      }));
      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadPeople = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .neq('id', currentUser?.id)
        .limit(20);

      if (error) throw error;

      // Get follow status for each person if user is logged in
      if (currentUser && profiles) {
        const followPromises = profiles.map(async (profile) => {
          const { data: followData } = await supabase
            .from('community_followers')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
            .single();
          
          const [followersResult, followingResult] = await Promise.all([
            supabase.from('community_followers').select('id').eq('following_id', profile.id),
            supabase.from('community_followers').select('id').eq('follower_id', profile.id)
          ]);

          return {
            ...profile,
            is_following: !!followData,
            followers_count: followersResult.data?.length || 0,
            following_count: followingResult.data?.length || 0
          };
        });

        const peopleWithFollowStatus = await Promise.all(followPromises);
        setPeople(peopleWithFollowStatus);
      } else {
        setPeople(profiles || []);
      }
    } catch (error) {
      console.error('Error loading people:', error);
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

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setPeople(prev => prev.map(person => 
      person.id === userId 
        ? { ...person, is_following: isFollowing, followers_count: (person.followers_count || 0) + (isFollowing ? 1 : -1) }
        : person
    ));
  };

  const handlePostCreated = () => {
    loadPosts();
    toast.success('Discussion created successfully!');
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
        <Badge className="bg-gradient-to-r from-orange-100 to-purple-100 text-orange-800 border-orange-200">
          <BookOpen className="h-3 w-3 mr-1" />
          {course ? course.title : 'Course'}
        </Badge>
      );
    } else if (post.event_id) {
      const event = events.find(e => e.id === post.event_id);
      return (
        <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200">
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-orange-500 to-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <TabsTrigger 
              value="discussions" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4" />
              Course Discussions
            </TabsTrigger>
            <TabsTrigger 
              value="people" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-6">
            {/* Search and Filter Section */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
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
                </div>

                {/* Enhanced Post Creation */}
                {currentUser && (
                  <div className="mt-6">
                    <EnhancedPostCreation
                      onPostCreated={handlePostCreated}  
                      courses={courses}
                      events={events}
                      className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
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
                            {currentUser?.id !== post.user_id && post.profiles && (
                              <UserFollowButton
                                userId={post.user_id}
                                isFollowing={post.profiles.is_following || false}
                                onFollowChange={(userId, isFollowing) => handleFollowChange(userId, isFollowing)}
                                size="sm"
                                showCount={false}
                              />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">@{post.profiles?.username || 'user'}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            {getContentBadge(post)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-lg bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap mb-4 text-gray-700">{post.content}</p>
                    
                    {/* Image Gallery */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        <ImageGallery images={post.images} />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gradient-to-r from-orange-100 to-purple-100">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all text-orange-600"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          {post.likes_count || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all text-purple-600"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {post.comments_count || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all text-orange-600"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredPosts.length === 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-600">No discussions found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to start a discussion!'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            {/* People Grid */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  Discover People
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {people.map((person) => (
                    <Card key={person.id} className="bg-gradient-to-br from-orange-50 to-purple-50 border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3 cursor-pointer" onClick={() => setShowFollowers({ userId: person.id, tab: 'followers' })}>
                          <AvatarImage src={person.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-orange-200 to-purple-200 text-orange-700">
                            {person.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <h3 className="font-semibold text-lg mb-1 text-gray-800">{person.full_name || 'Anonymous'}</h3>
                        <p className="text-sm text-gray-600 mb-2">@{person.username || 'user'}</p>
                        
                        {person.bio && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{person.bio}</p>
                        )}
                        
                        <div className="flex items-center justify-center space-x-4 mb-3 text-sm text-gray-500">
                          <button 
                            onClick={() => setShowFollowers({ userId: person.id, tab: 'followers' })}
                            className="hover:text-orange-500 transition-colors"
                          >
                            <span className="font-medium">{person.followers_count || 0}</span> followers
                          </button>
                          <button 
                            onClick={() => setShowFollowers({ userId: person.id, tab: 'following' })}
                            className="hover:text-purple-500 transition-colors"
                          >
                            <span className="font-medium">{person.following_count || 0}</span> following
                          </button>
                        </div>
                        
                        <UserFollowButton
                          userId={person.id}
                          isFollowing={person.is_following || false}
                          onFollowChange={(userId, isFollowing) => handleFollowChange(userId, isFollowing)}
                          className="w-full"
                          variant={person.is_following ? "outline" : "default"}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {people.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-600">No people found</h3>
                    <p className="text-gray-500">Check back later for new community members!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Followers Modal */}
        {showFollowers && (
          <FollowersList
            userId={showFollowers.userId}
            isOpen={true}
            onClose={() => setShowFollowers(null)}
            initialTab={showFollowers.tab}
          />
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionsTab;