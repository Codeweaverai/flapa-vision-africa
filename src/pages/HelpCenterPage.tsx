import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Headphones, Image } from 'lucide-react';

const HelpCenterPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Help Center</h1>
          <p className="text-lg">
            Find answers to common questions or reach out to our support team for assistance.
          </p>
          
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search for help articles..." 
                className="pl-4 pr-12 py-6 text-lg rounded-full"
              />
              <Button 
                className="absolute right-1 top-1 rounded-full h-10 px-4"
                variant="default"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="faq" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I sign up for an account?</AccordionTrigger>
                  <AccordionContent>
                    To create an account, click on the "Sign in" button in the top right corner and then select "Create an account". 
                    Fill in your details, verify your email address, and you're all set to start using SkillPulse.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I register for an event?</AccordionTrigger>
                  <AccordionContent>
                    Browse our Events page to find an event you're interested in. Click on the event to view details, 
                    then click "Register" or "Buy Ticket". Follow the instructions to complete your registration and payment if required.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I access my purchased courses?</AccordionTrigger>
                  <AccordionContent>
                    After purchasing a course, you can access it by logging into your account and navigating to "My Learning" 
                    or "My Courses" in your account dashboard. All your purchased courses will be available there.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent>
                    We accept major credit cards (Visa, Mastercard, American Express), PayPal, and mobile payment options 
                    depending on your region. All transactions are secured with industry-standard encryption.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>What is your refund policy?</AccordionTrigger>
                  <AccordionContent>
                    For courses, we offer a 30-day money-back guarantee if you're not satisfied. 
                    For events, refund policies vary depending on the event. Please check the specific 
                    event details for refund information or contact our support team for assistance.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="guides" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started Guide</CardTitle>
                  <CardDescription>Learn the basics of using SkillPulse</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">This comprehensive guide covers everything from creating your account to registering for your first event or course.</p>
                  <Button variant="outline">Read Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Creating Your Profile</CardTitle>
                  <CardDescription>Stand out with a complete profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Learn how to set up your profile to highlight your skills and interests, making networking more effective.</p>
                  <Button variant="outline">Read Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Learning Tips</CardTitle>
                  <CardDescription>Get the most from your courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Discover strategies to maximize your learning experience and retain more information from your courses.</p>
                  <Button variant="outline">Read Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Event Hosting Guide</CardTitle>
                  <CardDescription>For creators and organizers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Everything you need to know about hosting successful events on our platform.</p>
                  <Button variant="outline">Read Guide</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5 text-primary" />
                      Contact Support
                    </CardTitle>
                    <CardDescription>Get help from our team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Our support team is available Monday through Friday, 9am-5pm EST.</p>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:support@skillpulse.com" className="text-primary">
                          support@skillpulse.com
                        </a>
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a href="tel:+18005551234" className="text-primary">
                          +1 (800) 555-1234
                        </a>
                      </div>
                      <Button className="w-full">Submit a Ticket</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" />
                      Help Resources
                    </CardTitle>
                    <CardDescription>Self-service support options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        Video Tutorials
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Documentation
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Community Forums
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
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
    </Layout>
  );
};

export default HelpCenterPage;
