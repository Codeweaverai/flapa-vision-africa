
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, BookOpen, Settings, Shield, CreditCard } from 'lucide-react';

const HelpCenterPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of using our platform",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign Up' button in the top right corner and fill out the registration form with your email and password."
        },
        {
          question: "How do I enroll in a course?",
          answer: "Browse our course catalog, select the course you're interested in, and click the 'Enroll Now' button. For paid courses, you'll need to complete the payment process."
        },
        {
          question: "How do I navigate the platform?",
          answer: "Use the main navigation menu to access different sections like Courses, Events, Community, and your account dashboard."
        }
      ]
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Manage your profile and preferences",
      faqs: [
        {
          question: "How do I update my profile?",
          answer: "Go to your account settings page and click on 'Profile' to update your personal information, bio, and profile picture."
        },
        {
          question: "How do I change my password?",
          answer: "In your account settings, click on 'Security' and then 'Change Password' to update your login credentials."
        },
        {
          question: "How do I enable creator mode?",
          answer: "Visit your account settings and look for the 'Creator Mode' option to start creating and selling courses."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description: "Questions about payments and payouts",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept major credit cards, PayPal, and mobile money payments for supported regions."
        },
        {
          question: "How do refunds work?",
          answer: "We offer refunds within 30 days of purchase if you're not satisfied with the course. Contact our support team for assistance."
        },
        {
          question: "How do I get paid as a creator?",
          answer: "Creator earnings are processed through Stripe or mobile money based on your preference. Payouts are made according to our payout schedule."
        }
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Information about data protection",
      faqs: [
        {
          question: "How is my data protected?",
          answer: "We use industry-standard encryption and security measures to protect your personal information and payment data."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can request account deletion through your account settings or by contacting our support team."
        },
        {
          question: "Who can see my information?",
          answer: "Your profile information visibility can be controlled in your privacy settings. We never share personal data with third parties without consent."
        }
      ]
    }
  ];

  const generalFaqs = [
    {
      question: "Can I access courses offline?",
      answer: "Currently, courses require an internet connection to access. We're working on offline capabilities for future updates."
    },
    {
      question: "How do I track my learning progress?",
      answer: "Your progress is automatically tracked as you complete lessons. You can view your progress in your account dashboard under 'My Courses'."
    },
    {
      question: "How do I get a certificate?",
      answer: "Certificates are available for courses that offer them. Complete all course requirements and pass any required assessments to receive your certificate."
    },
    {
      question: "How do I join community discussions?",
      answer: "Navigate to the Community section to participate in course discussions, ask questions, and connect with other learners."
    },
    {
      question: "Can I create my own courses?",
      answer: "Yes! Enable creator mode in your account settings to start creating and publishing your own courses and events."
    },
    {
      question: "How do I contact support?",
      answer: "You can contact our support team through the contact form at the bottom of this page or by emailing help@skillpulse.com."
    }
  ];

  const selectedCategoryData = helpCategories.find(cat => cat.title === selectedCategory);
  const displayFaqs = selectedCategoryData ? selectedCategoryData.faqs : generalFaqs;

  const filteredFaqs = searchTerm 
    ? displayFaqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : displayFaqs;

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Help Center</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions and get the support you need.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for help articles..."
                className="pl-10 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Card 
                key={index} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  selectedCategory === category.title ? 'ring-2 ring-purple-500 bg-purple-50' : ''
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Category Display */}
          {selectedCategory && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="bg-gradient-to-r from-purple-50 to-orange-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-purple-800">
                    {selectedCategory}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              {selectedCategory ? `${selectedCategory} FAQ` : 'Frequently Asked Questions'}
            </h2>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No FAQs found matching your search.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Back to All Categories */}
          {selectedCategory && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                View All Categories
              </Button>
            </div>
          )}

          {/* Contact Support */}
          <div className="max-w-2xl mx-auto mt-12">
            <Card>
              <CardHeader className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Still need help?</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="space-y-2">
                  <Button size="lg" className="w-full">
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
