import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, MessageCircle, Book, Phone, Mail, HelpCircle } from 'lucide-react';
import HelpCenterChatbot from '@/components/helpcenter/HelpCenterChatbot';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqData = [
    {
      question: 'How do I create a new course?',
      answer:
        'To create a new course, navigate to the "Create Course" section in your dashboard and follow the step-by-step instructions. Make sure to fill in all the required fields and add engaging content to attract students.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept a variety of payment methods, including credit cards (Visa, MasterCard, American Express), PayPal, and other local payment options. You can select your preferred payment method during the checkout process.',
    },
    {
      question: 'How can I reset my password?',
      answer:
        'If you have forgotten your password, click on the "Forgot Password" link on the login page. Enter your email address, and we will send you instructions on how to reset your password.',
    },
    {
      question: 'How do I enroll in a course?',
      answer:
        'To enroll in a course, simply navigate to the course page and click on the "Enroll Now" button. Follow the prompts to complete the enrollment process and gain access to the course materials.',
    },
    {
      question: 'How can I contact support?',
      answer:
        'If you need further assistance, you can contact our support team by visiting the "Contact Us" page on our website. Fill out the contact form, and we will get back to you as soon as possible.',
    },
  ];

  const filteredFaqs = faqData.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          status: 'new'
        }]);

      if (error) throw error;

      toast.success('Your message has been sent successfully!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to your questions or get in touch with our support team
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Live Chat</CardTitle>
              <CardDescription>Get instant help from our AI assistant</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Link to="/contact">
                <Phone className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Reach out to our support team directly</CardDescription>
              </Link>
            </CardHeader>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Email Support</CardTitle>
              <CardDescription>Send us a detailed message</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && searchQuery && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No articles found for "{searchQuery}"
                  </p>
                  <Button asChild>
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Chatbot */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="h-6 w-6" />
              <h2 className="text-2xl font-bold">AI Assistant</h2>
            </div>
            <HelpCenterChatbot />
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground">
              Can't find what you're looking for? Send us a message and we'll get back to you.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Fill out the form below and our support team will respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Button disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Submitting...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenterPage;
