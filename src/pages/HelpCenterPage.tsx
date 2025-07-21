
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, BookOpen, Settings, Shield, CreditCard, Play, FileText, Headphones, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface MediaPost {
  id: string;
  title: string;
  summary?: string;
  post_type: 'article' | 'video' | 'podcast';
  published_at: string;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

const HelpCenterPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaPosts, setMediaPosts] = useState<MediaPost[]>([]);
  const [filteredMediaPosts, setFilteredMediaPosts] = useState<MediaPost[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  useEffect(() => {
    fetchMediaPosts();
    fetchFAQs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = mediaPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMediaPosts(filtered);
    } else {
      setFilteredMediaPosts([]);
    }
  }, [searchTerm, mediaPosts]);

  const fetchFAQs = async () => {
    try {
      setFaqsLoading(true);
      const { data, error } = await supabase
        .from('help_center_faqs')
        .select('id, category, question, answer, order_index')
        .eq('is_published', true)
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqsLoading(false);
    }
  };

  const fetchMediaPosts = async () => {
    try {
      setMediaLoading(true);
      const { data, error } = await supabase
        .from('media_posts')
        .select('id, title, summary, post_type, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      const typedPosts: MediaPost[] = (data || []).map(post => ({
        ...post,
        post_type: post.post_type as 'article' | 'video' | 'podcast'
      }));
      
      setMediaPosts(typedPosts);
    } catch (error) {
      console.error('Error fetching media posts:', error);
    } finally {
      setMediaLoading(false);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'podcast':
        return <Headphones className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of using our platform"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Manage your profile and preferences"
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description: "Questions about payments and payouts"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Information about data protection"
    }
  ];

  // Get FAQs for selected category or all FAQs
  const selectedCategoryFaqs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  // Filter FAQs by search term
  const filteredFaqs = searchTerm 
    ? selectedCategoryFaqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedCategoryFaqs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Help Center</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions, search media posts, and get the support you need.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search help articles and media posts..."
                className="pl-10 h-12 text-lg bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Media Posts Search Results */}
            {searchTerm && filteredMediaPosts.length > 0 && (
              <Card className="mt-4 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Media Posts ({filteredMediaPosts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredMediaPosts.map((post) => (
                      <div key={post.id} className="flex items-start gap-3 p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                          {getPostIcon(post.post_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-1">
                            {post.title}
                          </h3>
                          {post.summary && (
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {post.summary}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/media/${post.id}`} className="flex items-center gap-1 text-xs">
                                <Eye className="h-3 w-3" />
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Card 
                key={index} 
                className={`hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-xl ${
                  selectedCategory === category.title ? 'ring-2 ring-purple-500 bg-purple-50/80' : ''
                }`}
                onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
              >
                <CardHeader className="text-center">
                  <category.icon className={`h-12 w-12 mx-auto mb-4 ${
                    selectedCategory === category.title ? 'text-purple-600' : 'text-primary'
                  }`} />
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">
                    {category.description}
                  </p>
                  <div className="text-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {faqs.filter(faq => faq.category === category.title).length} FAQs
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Category Display */}
          {selectedCategory && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="bg-gradient-to-r from-purple-100/80 to-orange-100/80 border-purple-200 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-purple-800">
                    {selectedCategory}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              {selectedCategory ? `${selectedCategory} FAQ` : 'Frequently Asked Questions'}
            </h2>
            
            {faqsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No FAQs found matching your search.' : 'No FAQs available for this category.'}
                </p>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Media Posts Section */}
          <div className="max-w-6xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Media Posts
              </span>
            </h2>
            {mediaLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg">
                    <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:-translate-y-2">
                    <div className="relative p-6 bg-gradient-to-br from-orange-100 to-purple-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          {getPostIcon(post.post_type)}
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded-full">
                          {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {post.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                        <Button asChild size="sm" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                          <Link to={`/media/${post.id}`} className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="text-center mt-8">
              <Button asChild size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-white/80 backdrop-blur-sm">
                <Link to="/media">
                  View All Media Posts
                </Link>
              </Button>
            </div>
          </div>

          {/* Back to All Categories */}
          {selectedCategory && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-white/80 backdrop-blur-sm"
              >
                View All Categories
              </Button>
            </div>
          )}

          {/* Contact Support */}
          <div className="max-w-2xl mx-auto mt-12">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Still need help?</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="space-y-2">
                  <Button size="lg" className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    Contact Support
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Or email us at <a href="mailto:help@skillpulse.com" className="text-primary hover:underline">help@skillpulse.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default HelpCenterPage;
