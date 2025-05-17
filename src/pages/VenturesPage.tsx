import Layout from '@/components/layout/Layout';
import { Briefcase, Home, Truck, Plane, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VenturesPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="heading-lg mb-6 text-gradient">Ventures</h1>
          <p className="text-lg">
            FlapaBay's core businesses span vacation rentals and trucking operations, 
            creating an integrated ecosystem that's transforming travel and logistics across Africa.
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vacation-rentals">Vacation Rentals</TabsTrigger>
            <TabsTrigger value="trucking">Trucking Operations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    FlapaBay Ecosystem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    FlapaBay's business model uniquely combines hospitality and logistics, 
                    creating synergies that enhance operational efficiency and customer experience. 
                    Our integrated approach allows us to offer seamless travel experiences 
                    while optimizing resource utilization across our ventures.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Our Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Across our ventures, we've created over 500 jobs, connected remote communities 
                    to essential services, and helped reduce carbon emissions through optimized logistics. 
                    Our businesses are designed to generate both profit and positive social impact.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="vacation-rentals" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="heading-md mb-4">Premium Vacation Properties</h2>
                <p className="mb-6">
                  FlapaBay Vacation Rentals manages a portfolio of 75+ premium properties across 
                  Africa's most beautiful destinations. We offer travelers authentic, comfortable 
                  accommodations with the convenience of modern amenities and local experiences.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Home className="h-5 w-5 text-primary mt-1" />
                    <span>Luxury villas, apartments, and unique stays in 12 African countries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <span>Professional property management with local hosts and 24/7 support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Plane className="h-5 w-5 text-primary mt-1" />
                    <span>Integrated travel services including airport transfers and excursions</span>
                  </li>
                </ul>
                <Button>Explore Properties</Button>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                  alt="Luxury vacation rental" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trucking" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="rounded-lg overflow-hidden shadow-lg md:order-2">
                <img 
                  src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                  alt="Logistics operations" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="md:order-1">
                <h2 className="heading-md mb-4">Logistics Solutions</h2>
                <p className="mb-6">
                  FlapaBay Trucking provides reliable, efficient logistics services across Africa's 
                  challenging transportation landscape. Our fleet of 120+ vehicles specializes in 
                  last-mile delivery, cross-border transport, and specialized cargo handling.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Truck className="h-5 w-5 text-primary mt-1" />
                    <span>Modern, well-maintained fleet with real-time tracking capabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-primary mt-1" />
                    <span>Industry-leading safety standards and driver training programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Plane className="h-5 w-5 text-primary mt-1" />
                    <span>Integrated multimodal transport solutions connecting air, road, and rail</span>
                  </li>
                </ul>
                <Button>Learn About Services</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Partner With Us</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Interested in collaborating with FlapaBay? We're always open to strategic 
            partnerships that align with our mission to transform travel and logistics in Africa.
          </p>
          <Button size="lg" asChild>
            <a href="mailto:partnerships@flapabay.com">Contact Our Partnership Team</a>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default VenturesPage;
