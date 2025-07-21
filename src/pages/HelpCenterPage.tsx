
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
}

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('help_center_faqs')
        .select('*')
        .eq('is_published', true)
        .order('category')
        .order('order_index');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of using our platform'
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      description: 'Manage your profile and account preferences'
    },
    {
      id: 'billing-payments',
      title: 'Billing & Payments',
      description: 'Payment methods, refunds, and billing questions'
    },
    {
      id: 'privacy-security',
      title: 'Privacy & Security',
      description: 'Data protection and security features'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFaqs = categories.reduce((acc, category) => {
    const categoryKey = category.title;
    acc[categoryKey] = filteredFaqs.filter(faq => faq.category === categoryKey);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container">
          <div className="text-center">Loading help content...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <div className="text-center mb-12">
          <h1 className="heading-xl mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to common questions and get the help you need
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {category.title}
                </CardTitle>
                <p className="text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedFaqs[category.title]?.length === 0 ? (
                    <p className="text-muted-foreground">No FAQs available in this category.</p>
                  ) : (
                    groupedFaqs[category.title]?.map((faq) => (
                      <div key={faq.id} className="border rounded-lg">
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium">{faq.question}</span>
                          {expandedFaq === faq.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-4 pb-4 text-muted-foreground">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Contact Support
              </button>
              <button className="border border-border px-6 py-2 rounded-lg hover:bg-muted transition-colors">
                Browse Tutorials
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HelpCenterPage;
