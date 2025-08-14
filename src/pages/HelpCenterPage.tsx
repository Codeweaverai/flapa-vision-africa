import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, BookOpen, Settings, CreditCard, Shield, Play, Calendar, Eye, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import HelpCenterChatbot from '@/components/helpcenter/HelpCenterChatbot';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

interface MediaPost {
  id: string;
  title: string;
  description: string;
  image_url: string;
  content_type: string;
  is_published: boolean;
  created_at: string;
  content: string;
  post_type: string;
  category?: string;
  media_url?: string;
}

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [mediaPosts, setMediaPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch FAQs
      const { data: faqData, error: faqError } = await supabase
        .from('help_center_faqs')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('order_index');

      if (faqError) throw faqError;
      setFaqs(faqData || []);

      // Fetch media posts with proper mapping
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (mediaError) {
        console.error('Error fetching media posts:', mediaError);
      }
      
      // Transform the data to match MediaPost interface
      const transformedMediaData = (mediaData || []).map(post => ({
        id: post.id,
        title: post.title,
        description: post.summary || post.content?.substring(0, 150) + '...' || '',
        image_url: post.image_url || '',
        content_type: post.post_type || 'article',
        is_published: post.is_published,
        created_at: post.created_at,
        content: post.content || '',
        post_type: post.post_type || 'article',
        category: post.category,
        media_url: post.media_url
      }));
      
      setMediaPosts(transformedMediaData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of using our platform',
      icon: BookOpen,
      gradient: 'from-orange-400 to-purple-500'
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      description: 'Manage your profile and account preferences',
      icon: Settings,
      gradient: 'from-purple-400 to-orange-500'
    },
    {
      id: 'billing-payments',
      title: 'Billing & Payments',
      description: 'Payment methods, refunds, and billing questions',
      icon: CreditCard,
      gradient: 'from-orange-500 to-purple-400'
    },
    {
      id: 'privacy-security',
      title: 'Privacy & Security',
      description: 'Data protection and security features',
      icon: Shield,
      gradient: 'from-purple-500 to-orange-400'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMediaPosts = mediaPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFaqs = categories.reduce((acc, category) => {
    const categoryKey = category.title;
    acc[categoryKey] = filteredFaqs.filter(faq => faq.category === categoryKey);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleViewPost = (postId: string) => {
    navigate(`/media/${postId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 to-purple-100">
          <div className="section-container">
            <div className="text-center">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                <div className="h-12 bg-gray-300 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-purple-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-orange-300 to-purple-400 rounded-full animate-pulse opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="section-container relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Find answers to common questions, search media posts, and get the support you need
            </p>
            
            <div className="max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-500 rounded-lg blur opacity-25"></div>
              <div className="relative bg-white rounded-lg shadow-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help or media posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border-0 focus:ring-0 text-base"
                />
              </div>
            </div>
          </div>

          {/* FAQ Categories Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="group bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${category.gradient}`}></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${category.gradient} text-white shadow-lg`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {category.title}
                    </CardTitle>
                    <p className="text-gray-700 text-sm">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupedFaqs[category.title]?.length === 0 ? (
                        <p className="text-gray-600 text-sm italic">No FAQs available in this category.</p>
                      ) : (
                        groupedFaqs[category.title]?.map((faq) => (
                          <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <button
                              onClick={() => toggleFaq(faq.id)}
                              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-200 group"
                            >
                              <span className="font-medium text-gray-800 group-hover:text-gray-900">{faq.question}</span>
                              {expandedFaq === faq.id ? (
                                <ChevronUp className="h-5 w-5 text-purple-500 transform group-hover:scale-110 transition-transform" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-orange-500 transform group-hover:scale-110 transition-transform" />
                              )}
                            </button>
                            {expandedFaq === faq.id && (
                              <div className="px-4 pb-4 bg-gradient-to-r from-orange-50/50 to-purple-50/50 border-t border-gray-100">
                                <p className="text-gray-700 leading-relaxed pt-3">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Media Posts Section */}
          {(searchTerm || mediaPosts.length > 0) && (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Media Posts
                </h2>
                <p className="text-gray-700">
                  Explore our latest tutorials, guides, and educational content
                </p>
              </div>

              {filteredMediaPosts.length === 0 ? (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                      {searchTerm ? 'No media posts found' : 'No media posts available'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? `No media posts match your search for "${searchTerm}"`
                        : 'Check back later for new content'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMediaPosts.map((post) => (
                    <Card key={post.id} className="group bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-orange-200 to-purple-200 overflow-hidden">
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/60" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg line-clamp-2 flex-1 text-gray-800">
                            {post.title}
                          </h3>
                          <Badge 
                            variant="outline"
                            className="ml-2 bg-gradient-to-r from-orange-100 to-purple-100 border-orange-200"
                          >
                            {post.content_type}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {post.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewPost(post.id)}
                          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Post
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Support Section */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl overflow-hidden mb-8">
            <div className="h-2 bg-gradient-to-r from-orange-400 to-purple-500"></div>
            <CardContent className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Still need help?
                </h3>
                <p className="text-gray-700 mb-6">
                  Can't find what you're looking for? Our support team is here to help you succeed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setShowChatbot(true)}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    AI Support Chat
                  </Button>
                  <Button
                    onClick={() => navigate('/contact')}
                    className="border-2 border-gray-200 px-8 py-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 hover:border-purple-200 transition-all duration-200"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Center Chatbot */}
        {showChatbot && (
          <HelpCenterChatbot onClose={() => setShowChatbot(false)} />
        )}
      </div>
    </Layout>
  );
};

export default HelpCenterPage;
