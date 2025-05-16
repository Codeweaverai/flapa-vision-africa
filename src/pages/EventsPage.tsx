
import Layout from '@/components/layout/Layout';
import { Calendar, Users, MapPin, Clock, Tag, CalendarClock, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EventsPage = () => {
  return (
    <Layout>
      <div className="section-container">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Live Events</h1>
          <p className="text-lg">
            Connect with Mbolela Pule through interactive webinars, mentorship sessions, 
            and in-person events focused on business growth, technology, and African entrepreneurship.
          </p>
          <div className="flex justify-center mt-6 gap-4">
            <Button size="lg">
              <Calendar className="h-5 w-5 mr-2" /> Browse All Events
            </Button>
            <Button size="lg" variant="outline">
              <CalendarClock className="h-5 w-5 mr-2" /> Subscribe to Calendar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="webinars">Webinars</TabsTrigger>
            <TabsTrigger value="in-person">In-Person Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-6">
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 bg-primary/10 flex items-center justify-center p-6 md:p-0 md:rounded-l-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold">25</div>
                      <div className="text-lg">June</div>
                      <div className="text-lg">2025</div>
                      <Badge className="mt-2">Webinar</Badge>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">AI Adoption in African Businesses</h3>
                    <p className="mb-4">
                      Join Mbolela for an interactive webinar exploring practical strategies for 
                      implementing AI solutions in African businesses of all sizes, with real-world 
                      case studies and implementation roadmaps.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>2:00 PM - 3:30 PM (CAT)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        <span>Online (Zoom)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>Free Registration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span>250 Spots Available</span>
                      </div>
                    </div>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" /> Register Now
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 bg-primary/10 flex items-center justify-center p-6 md:p-0 md:rounded-l-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold">10</div>
                      <div className="text-lg">July</div>
                      <div className="text-lg">2025</div>
                      <Badge className="mt-2" variant="secondary">In-Person</Badge>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">African Logistics Innovation Summit</h3>
                    <p className="mb-4">
                      A full-day conference featuring keynote speeches, panel discussions, and 
                      networking opportunities focused on the future of logistics and transportation 
                      across the African continent.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>9:00 AM - 5:00 PM (CAT)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>Kigali Convention Center, Rwanda</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>$149 Early Bird</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span>Limited to 300 Attendees</span>
                      </div>
                    </div>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" /> Register Now
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 bg-primary/10 flex items-center justify-center p-6 md:p-0 md:rounded-l-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold">18</div>
                      <div className="text-lg">July</div>
                      <div className="text-lg">2025</div>
                      <Badge className="mt-2" variant="outline">Mentorship</Badge>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">Startup Mentorship Roundtable</h3>
                    <p className="mb-4">
                      An exclusive small-group mentorship session where Mbolela works directly 
                      with early-stage entrepreneurs to address their specific business challenges 
                      and growth strategies.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>6:00 PM - 8:00 PM (CAT)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        <span>Online (Private Link)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>$99 per participant</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span>Limited to 10 Participants</span>
                      </div>
                    </div>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" /> Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="webinars" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Data-Driven Decision Making</CardTitle>
                      <CardDescription>July 30, 2025 • 3:00 PM (CAT)</CardDescription>
                    </div>
                    <Badge>Webinar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Learn how to leverage data analytics to make better business decisions 
                    and drive growth in competitive African markets.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Free</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Register Now</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Supply Chain Resilience</CardTitle>
                      <CardDescription>August 15, 2025 • 2:00 PM (CAT)</CardDescription>
                    </div>
                    <Badge>Webinar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Strategies for building robust supply chains that can withstand 
                    disruptions and adapt to changing market conditions.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Free</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Register Now</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Funding Strategies for African Startups</CardTitle>
                      <CardDescription>September 5, 2025 • 4:00 PM (CAT)</CardDescription>
                    </div>
                    <Badge>Webinar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Navigate the funding landscape for African startups, from bootstrapping 
                    to venture capital and everything in between.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Free</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Register Now</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Cross-Border E-Commerce</CardTitle>
                      <CardDescription>September 20, 2025 • 3:00 PM (CAT)</CardDescription>
                    </div>
                    <Badge>Webinar</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Expand your business across African borders with effective 
                    e-commerce strategies, payment solutions, and logistics approaches.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      <span>Online</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Free</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Register Now</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="in-person" className="mt-6">
            <div className="space-y-6">
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" 
                      alt="Nairobi Business Forum" 
                      className="w-full h-full object-cover md:absolute rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">Nairobi Business Innovation Forum</h3>
                    <p className="mb-4">
                      A full-day workshop focused on business innovation strategies for 
                      East African entrepreneurs, featuring hands-on exercises and networking.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>August 12, 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>Nairobi, Kenya</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>$199 (Early Bird)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Limited to 50 attendees</span>
                      </div>
                    </div>
                    <Button>Learn More & Register</Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                      alt="Lagos Tech Conference" 
                      className="w-full h-full object-cover md:absolute rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">Lagos Tech Leadership Summit</h3>
                    <p className="mb-4">
                      Join West Africa's top tech leaders for a two-day summit on the future 
                      of technology, innovation, and digital transformation in the region.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>September 28-29, 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>Lagos, Nigeria</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>$349 (Standard)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Limited to 200 attendees</span>
                      </div>
                    </div>
                    <Button>Learn More & Register</Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                      alt="Cape Town Workshop" 
                      className="w-full h-full object-cover md:absolute rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-bold mb-2">Cape Town AI Implementation Workshop</h3>
                    <p className="mb-4">
                      A hands-on workshop for business leaders looking to implement AI solutions 
                      in their organizations, with practical exercises and personalized guidance.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>October 15, 2025</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>Cape Town, South Africa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <span>$249 (Standard)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Limited to 30 attendees</span>
                      </div>
                    </div>
                    <Button>Learn More & Register</Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Never Miss an Event</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Stay updated on all upcoming events, webinars, and appearances by 
            subscribing to our newsletter or adding events to your calendar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">
              <CalendarClock className="h-5 w-5 mr-2" /> Subscribe to Calendar
            </Button>
            <Button size="lg" variant="outline">
              <Users className="h-5 w-5 mr-2" /> Join Our Community
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;
