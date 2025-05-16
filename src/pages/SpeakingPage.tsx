
import Layout from '@/components/layout/Layout';
import { Mic, Video, Calendar, BookOpen, MessageSquare, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const SpeakingPage = () => {
  return (
    <Layout>
      <div className="section-container">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Speaking & Media</h1>
          <p className="text-lg">
            Mbolela Pule is a dynamic speaker on technology, entrepreneurship, 
            and African innovation. Book him for your next event or explore his 
            past appearances and media features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="heading-md mb-6 flex items-center gap-2">
              <Mic className="h-6 w-6 text-primary" />
              Speaking Topics
            </h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>The Future of African Logistics</CardTitle>
                  <CardDescription>Technology, Infrastructure, and Innovation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    How emerging technologies and innovative business models are transforming 
                    logistics across Africa, creating new opportunities and solving longstanding challenges.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI-Driven Business Transformation</CardTitle>
                  <CardDescription>Practical Applications for African Enterprises</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Real-world case studies on implementing AI solutions in businesses across Africa, 
                    with practical insights on overcoming implementation challenges and measuring ROI.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Building Pan-African Businesses</CardTitle>
                  <CardDescription>Strategies for Cross-Border Success</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Lessons learned from scaling FlapaBay across multiple African countries, 
                    navigating regulatory environments, and building effective multicultural teams.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <h2 className="heading-md mb-6 flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Recent Appearances
            </h2>
            <div className="space-y-6">
              <div className="bg-card rounded-lg overflow-hidden shadow">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" 
                  alt="Tech conference presentation" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Africa Tech Summit</h3>
                    <Badge>Keynote</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">March 15, 2025 • Nairobi, Kenya</p>
                  <p className="mb-4">
                    "AI-Powered Logistics: Revolutionizing Movement Across Africa" - 
                    An exploration of how artificial intelligence is transforming 
                    transportation and logistics on the continent.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <Video className="h-4 w-4 mr-2" /> Watch Recording
                  </Button>
                </div>
              </div>
              
              <div className="bg-card rounded-lg overflow-hidden shadow">
                <img 
                  src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6" 
                  alt="Panel discussion" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Future of Travel Conference</h3>
                    <Badge variant="secondary">Panel</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">January 22, 2025 • Cape Town, South Africa</p>
                  <p className="mb-4">
                    "Sustainable Tourism in Africa: Balancing Growth with Environmental Responsibility" - 
                    Panel discussion on creating eco-friendly travel businesses.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" /> View Summary
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-8 shadow-lg">
          <h2 className="heading-md mb-6 text-center">Book Mbolela for Your Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Speaking Formats</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  <span>Keynote Presentations (30-60 minutes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Panel Discussions & Fireside Chats</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Workshops & Training Sessions (2-4 hours)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <span>Virtual Events & Webinars</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">Upcoming Availability</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>June 2025: Europe & Middle East</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>August 2025: West Africa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>October 2025: North America</span>
                </div>
              </div>
            </div>
            
            <div>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="Full Name" />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" placeholder="Company or Event Name" />
                </div>
                <div>
                  <Label htmlFor="event-type">Event Type</Label>
                  <Input id="event-type" placeholder="Conference, Workshop, etc." />
                </div>
                <div>
                  <Label htmlFor="event-date">Event Date</Label>
                  <Input id="event-date" type="date" />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm">
                    I understand that submitting this form doesn't guarantee availability, and I'll receive a response within 48 hours.
                  </Label>
                </div>
                <Button type="submit" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" /> Submit Speaking Request
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SpeakingPage;
