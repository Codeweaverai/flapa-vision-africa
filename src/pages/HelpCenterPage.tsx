
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Headphones, MessageCircle, BookOpen, Phone, Mail, Search } from 'lucide-react';

const HelpCenterPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12 max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Find answers to common questions or reach out to our support team for assistance.
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input 
                type="text" 
                placeholder="Search for help articles..." 
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-purple-200 focus:border-purple-400"
              />
              <Button 
                className="absolute right-2 top-2 rounded-full h-10 px-6 bg-gradient-to-r from-orange-500 to-purple-600"
                variant="default"
              >
                Search
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="faq" className="mb-16">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="contact">Contact Us</TabsTrigger>
            </TabsList>
            
            <TabsContent value="faq" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      <AccordionItem value="item-1" className="border border-purple-100 rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold">How do I sign up for an account?</AccordionTrigger>
                        <AccordionContent className="text-gray-600 pt-2">
                          To create an account, click on the "Sign in" button in the top right corner and then select "Create an account". 
                          Fill in your details, verify your email address, and you're all set to start using SkillPulse.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2" className="border border-purple-100 rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold">How do I register for an event?</AccordionTrigger>
                        <AccordionContent className="text-gray-600 pt-2">
                          Browse our Events page to find an event you're interested in. Click on the event to view details, 
                          then click "Register" or "Buy Ticket". Follow the instructions to complete your registration and payment if required.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3" className="border border-purple-100 rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold">How do I access my purchased courses?</AccordionTrigger>
                        <AccordionContent className="text-gray-600 pt-2">
                          After purchasing a course, you can access it by logging into your account and navigating to "My Learning" 
                          or "My Courses" in your account dashboard. All your purchased courses will be available there.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-4" className="border border-purple-100 rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold">What payment methods do you accept?</AccordionTrigger>
                        <AccordionContent className="text-gray-600 pt-2">
                          We accept major credit cards (Visa, Mastercard, American Express), PayPal, and mobile payment options 
                          depending on your region. All transactions are secured with industry-standard encryption.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-5" className="border border-purple-100 rounded-lg px-4">
                        <AccordionTrigger className="text-left font-semibold">What is your refund policy?</AccordionTrigger>
                        <AccordionContent className="text-gray-600 pt-2">
                          For courses, we offer a 30-day money-back guarantee if you're not satisfied. 
                          For events, refund policies vary depending on the event. Please check the specific 
                          event details for refund information or contact our support team for assistance.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="guides" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
                    <CardTitle>Getting Started Guide</CardTitle>
                    <CardDescription>Learn the basics of using SkillPulse</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">This comprehensive guide covers everything from creating your account to registering for your first event or course.</p>
                    <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <MessageCircle className="h-8 w-8 text-orange-600 mb-2" />
                    <CardTitle>Creating Your Profile</CardTitle>
                    <CardDescription>Stand out with a complete profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Learn how to set up your profile to highlight your skills and interests, making networking more effective.</p>
                    <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <BookOpen className="h-8 w-8 text-purple-600 mb-2" />
                    <CardTitle>Course Learning Tips</CardTitle>
                    <CardDescription>Get the most from your courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Discover strategies to maximize your learning experience and retain more information from your courses.</p>
                    <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">Read Guide</Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <MessageCircle className="h-8 w-8 text-orange-600 mb-2" />
                    <CardTitle>Event Hosting Guide</CardTitle>
                    <CardDescription>For creators and organizers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Everything you need to know about hosting successful events on our platform.</p>
                    <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">Read Guide</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Headphones className="h-5 w-5 text-purple-600" />
                        Contact Support
                      </CardTitle>
                      <CardDescription>Get help from our team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6 text-gray-600">Our support team is available Monday through Friday, 9am-5pm EST.</p>
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Email</p>
                            <a href="mailto:support@skillpulse.com" className="text-purple-600 hover:underline">
                              support@skillpulse.com
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <a href="tel:+18005551234" className="text-purple-600 hover:underline">
                              +1 (800) 555-1234
                            </a>
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600">Submit a Ticket</Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        Help Resources
                      </CardTitle>
                      <CardDescription>Self-service support options</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Video Tutorials
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Documentation
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Community Forums
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-purple-200 hover:bg-purple-50">
                          <BookOpen className="mr-2 h-4 w-4" />
                          System Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenterPage;
