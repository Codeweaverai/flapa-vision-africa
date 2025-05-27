import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, BookOpen, Settings, Shield, CreditCard } from 'lucide-react';

const HelpCenterPage = () => {
  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer: "To enroll in a course, browse our course catalog, select the course you're interested in, and click the 'Enroll Now' button. For paid courses, you'll need to complete the payment process."
    },
    {
      question: "Can I access courses offline?",
      answer: "Currently, courses require an internet connection to access. We're working on offline capabilities for future updates."
    },
    {
      question: "How do I track my learning progress?",
      answer: "Your progress is automatically tracked as you complete lessons. You can view your progress in your account dashboard under 'My Courses'."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, PayPal, and mobile money payments for supported regions."
    },
    {
      question: "How do I get a certificate?",
      answer: "Certificates are available for courses that offer them. Complete all course requirements and pass any required assessments to receive your certificate."
    },
    {
      question: "Can I get a refund?",
      answer: "We offer refunds within 30 days of purchase if you're not satisfied with the course. Please contact our support team for assistance."
    }
  ];

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
      description: "Questions about payments and subscriptions"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Information about data protection"
    }
  ];

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
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
              />
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <category.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
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

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
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
          </div>

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
                <Button size="lg">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default HelpCenterPage;
