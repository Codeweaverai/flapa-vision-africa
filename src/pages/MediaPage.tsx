
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Mic, FileDown, Search, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { getMediaPosts, MediaPost } from '@/services/mediaService';

const MediaPage = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const allPosts = await getMediaPosts();
        setPosts(allPosts);
        setFilteredPosts(allPosts);
      } catch (error) {
        console.error('Error loading media posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedCategory]);

  const formatCategoryName = (category: string | undefined): string => {
    if (!category) return '';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'news':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'podcast':
        return <Mic className="h-4 w-4 mr-2" />;
      case 'resource':
        return <FileDown className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  const getUniqueCategories = () => {
    const categories = posts
      .map(post => post.category)
      .filter((category, index, array) => category && array.indexOf(category) === index);
    return categories;
  };

  const filterByType = (type: string) => {
    return posts.filter(post => post.post_type === type);
  };

  const renderPostGrid = (postsToRender: MediaPost[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {postsToRender.map((post) => (
        <Card key={post.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
          <div className="relative h-48">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                {getPostIcon(post.post_type)}
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <Badge className="absolute top-3 right-3 capitalize">
              {post.post_type}
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {post.category && (
                <Badge variant="outline">
                  {formatCategoryName(post.category)}
                </Badge>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(post.published_at), 'MMM dd, yyyy')}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 line-clamp-3">
              {post.summary || post.content.substring(0, 150) + '...'}
            </p>
            {post.duration_minutes && (
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <Mic className="h-3 w-3 mr-1" />
                {post.duration_minutes} minutes
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/media/${post.id}`}>
                {post.post_type === 'podcast' ? 'Listen Now' : 'Read More'}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gradient">Media Hub</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our latest news, insightful podcasts, and valuable resources to stay informed and inspired.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search articles, podcasts, and resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                {getUniqueCategories().map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category!)}
                  >
                    {formatCategoryName(category)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="all">All ({filteredPosts.length})</TabsTrigger>
                <TabsTrigger value="news">News ({filterByType('news').length})</TabsTrigger>
                <TabsTrigger value="podcast">Podcasts ({filterByType('podcast').length})</TabsTrigger>
                <TabsTrigger value="resource">Resources ({filterByType('resource').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2">No content found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedCategory !== 'all' 
                        ? 'Try adjusting your search or filters.' 
                        : 'Check back later for new content.'}
                    </p>
                  </div>
                ) : (
                  renderPostGrid(filteredPosts)
                )}
              </TabsContent>

              <TabsContent value="news">
                {renderPostGrid(filterByType('news').filter(post => {
                  if (searchTerm) {
                    return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
                  }
                  if (selectedCategory !== 'all') {
                    return post.category === selectedCategory;
                  }
                  return true;
                }))}
              </TabsContent>

              <TabsContent value="podcast">
                {renderPostGrid(filterByType('podcast').filter(post => {
                  if (searchTerm) {
                    return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
                  }
                  if (selectedCategory !== 'all') {
                    return post.category === selectedCategory;
                  }
                  return true;
                }))}
              </TabsContent>

              <TabsContent value="resource">
                {renderPostGrid(filterByType('resource').filter(post => {
                  if (searchTerm) {
                    return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.content.toLowerCase().includes(searchTerm.toLowerCase());
                  }
                  if (selectedCategory !== 'all') {
                    return post.category === selectedCategory;
                  }
                  return true;
                }))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default MediaPage;
