
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Calendar, User, Clock, ArrowRight } from 'lucide-react';

interface MediaPost {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  post_type: string;
  media_url?: string;
  image_url?: string;
  duration_minutes?: number;
  published_at: string;
  author_id?: string;
}

const MediaPage = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const categories = ['Technology', 'Business', 'Health', 'Education', 'Lifestyle'];
  const postTypes = ['video', 'audio', 'article'];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, selectedCategory, selectedType]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('media_posts')
        .select(`
          id,
          title,
          content,
          summary,
          category,
          post_type,
          media_url,
          image_url,
          duration_minutes,
          published_at,
          author_id
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (error) {
      console.error('Error fetching media posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.post_type === selectedType);
    }

    setFilteredPosts(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-light-purple min-h-screen">
          <div className="section-container py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-light-purple min-h-screen">
        <div className="section-container py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Media & Resources</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our latest videos, podcasts, and articles on technology, business, and innovation.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="all">All Types</option>
                  {postTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Grid */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-4">No media posts found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new content.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center">
                          <span className="text-4xl">
                            {post.post_type === 'video' ? '🎥' : post.post_type === 'audio' ? '🎧' : '📰'}
                          </span>
                        </div>
                      )}
                      {post.post_type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3">
                            <Play className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">{post.post_type}</Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {formatDate(post.published_at)}
                        </div>
                        {post.duration_minutes && (
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {post.duration_minutes} min
                          </div>
                        )}
                      </div>
                      {post.category && (
                        <Badge variant="outline" className="w-fit mb-2">
                          {post.category}
                        </Badge>
                      )}
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>

                    <CardContent>
                      {post.summary && (
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {post.summary}
                        </p>
                      )}
                      <Button asChild className="w-full">
                        <Link to={`/media/${post.id}`}>
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
