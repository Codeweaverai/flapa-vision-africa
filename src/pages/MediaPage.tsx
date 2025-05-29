
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Search, Play, Volume2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPost {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  post_type: string;
  image_url?: string;
  duration_minutes?: number;
  published_at: string;
  author_id?: string;
  profiles?: {
    full_name?: string;
    username?: string;
  };
}

const MediaPage = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('media_posts')
          .select(`
            *,
            profiles (
              full_name,
              username
            )
          `)
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) throw error;

        setPosts(data || []);
        setFilteredPosts(data || []);

        // Extract unique categories
        const uniqueCategories = [...new Set(
          (data || [])
            .map(post => post.category)
            .filter(Boolean)
        )] as string[];
        setCategories(uniqueCategories);

      } catch (error) {
        console.error('Error fetching media posts:', error);
        toast.error('Failed to load media posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.post_type === selectedType);
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedCategory, selectedType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAuthorName = (post: MediaPost) => {
    return post.profiles?.full_name || post.profiles?.username || 'Anonymous';
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'audio':
        return <Volume2 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Media & Content</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of videos, podcasts, articles, and other media content 
              designed to inspire and educate.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search media content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="article">Article</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No media content found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || selectedType !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Check back later for new content.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Link to={`/media/${post.id}`}>
                    {post.image_url && (
                      <div className="relative">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            {getPostIcon(post.post_type)}
                            <span className="capitalize">{post.post_type}</span>
                          </Badge>
                        </div>
                        {post.duration_minutes && (
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="outline" className="bg-black/70 text-white border-none">
                              <Clock className="h-3 w-3 mr-1" />
                              {post.duration_minutes}m
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                  
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(post.published_at)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {getAuthorName(post)}
                        </div>
                      </div>
                      
                      {post.category && (
                        <Badge variant="outline">{post.category}</Badge>
                      )}
                    </div>
                    
                    <Link to={`/media/${post.id}`}>
                      <CardTitle className="hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </Link>
                    
                    {post.summary && (
                      <CardDescription className="line-clamp-3">
                        {post.summary}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/media/${post.id}`}>
                        Read More
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
