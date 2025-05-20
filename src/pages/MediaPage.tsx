
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Mic, FileDown, Calendar, Clock, ArrowRight } from 'lucide-react';
import { getMediaPosts, MediaPost } from '@/services/mediaService';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MediaPage = () => {
  const navigate = useNavigate();
  const [newsPosts, setNewsPosts] = useState<MediaPost[]>([]);
  const [podcastPosts, setPodcastPosts] = useState<MediaPost[]>([]);
  const [resourcePosts, setResourcePosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState({
    news: true,
    podcasts: true,
    resources: true
  });
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadMediaContent = async () => {
      try {
        // Load all media content in parallel
        const [newsData, podcastData, resourceData] = await Promise.all([
          getMediaPosts('news'),
          getMediaPosts('podcast'),
          getMediaPosts('resource')
        ]);
        
        setNewsPosts(newsData);
        setPodcastPosts(podcastData);
        setResourcePosts(resourceData);
      } catch (error) {
        console.error('Error loading media content:', error);
        toast.error('Failed to load some media content');
      } finally {
        setLoading({
          news: false,
          podcasts: false,
          resources: false
        });
      }
    };

    loadMediaContent();
  }, []);

  const handleViewPost = (post: MediaPost) => {
    navigate(`/media/${post.id}`);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Here you would typically call an API to subscribe the user
    toast.success('Thank you for subscribing to our newsletter!');
    setEmail('');
  };

  const renderNewsCard = (post: MediaPost, index: number) => {
    const publishedDate = format(new Date(post.published_at), 'MMMM d, yyyy');
    
    return (
      <Card key={post.id} className="overflow-hidden h-full">
        <div className="relative h-48 bg-muted">
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-100">
              <FileText className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardDescription>{publishedDate}</CardDescription>
          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3">
            {post.summary || post.content.substring(0, 150) + '...'}
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="link" 
            className="px-0 flex items-center"
            onClick={() => handleViewPost(post)}
          >
            Read More <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderPodcastCard = (post: MediaPost, index: number) => {
    const publishedDate = format(new Date(post.published_at), 'MMMM d, yyyy');
    
    return (
      <Card key={post.id} className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-48 h-48 bg-muted">
            {post.image_url ? (
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100">
                <Mic className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {publishedDate}
                </CardDescription>
                {post.duration_minutes && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1" /> {post.duration_minutes} min
                  </span>
                )}
              </div>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2">
                {post.summary || post.content.substring(0, 150) + '...'}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={() => handleViewPost(post)}
              >
                <Mic className="w-4 h-4 mr-2" /> Listen Now
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  };

  const renderResourceCard = (post: MediaPost) => {
    return (
      <Card key={post.id} className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 line-clamp-3">
            {post.summary || post.content.substring(0, 150) + '...'}
          </p>
          <Button onClick={() => handleViewPost(post)}>View Resource</Button>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingState = (type: string) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Loading {type}...</p>
    </div>
  );

  const renderEmptyState = (type: string) => (
    <div className="text-center py-12">
      <p className="text-xl text-muted-foreground">No {type} available at the moment.</p>
      <p className="mt-2">Please check back soon for updates!</p>
    </div>
  );

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Media Center</h1>
          <p className="text-lg">
            Explore our latest press releases, news features, podcast episodes, and resources for journalists.
          </p>
        </div>

        <Tabs defaultValue="news" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="news" className="mt-6">
            {loading.news ? (
              renderLoadingState('news articles')
            ) : newsPosts.length === 0 ? (
              renderEmptyState('news articles')
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newsPosts.map((post, index) => renderNewsCard(post, index))}
                </div>
                {newsPosts.length >= 6 && (
                  <div className="flex justify-center mt-8">
                    <Button>Load More News</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="podcast" className="mt-6">
            {loading.podcasts ? (
              renderLoadingState('podcasts')
            ) : podcastPosts.length === 0 ? (
              renderEmptyState('podcasts')
            ) : (
              <>
                <div className="space-y-6 max-w-4xl mx-auto">
                  {podcastPosts.map((post, index) => renderPodcastCard(post, index))}
                </div>
                {podcastPosts.length >= 4 && (
                  <div className="flex justify-center mt-8">
                    <Button>View All Episodes</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="resources" className="mt-6">
            {loading.resources ? (
              renderLoadingState('resources')
            ) : resourcePosts.length === 0 ? (
              renderEmptyState('resources')
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {resourcePosts.map((post) => renderResourceCard(post))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="bg-card rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Stay updated with the latest news, upcoming events, and special offers from SkillPulse.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
