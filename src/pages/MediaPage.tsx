import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Video, Mic } from 'lucide-react';

const MediaPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Media Center</h1>
          <p className="text-lg">
            Explore our latest press releases, news features, podcast episodes, and resources for journalists.
          </p>
        </div>

        <Tabs defaultValue="news" className="mb-16">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="news" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="relative h-48 bg-muted">
                    <Image className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <CardDescription>May {i + 10}, 2023</CardDescription>
                    <CardTitle className="line-clamp-2">SkillPulse Launches New Learning Platform Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3">
                      SkillPulse introduces advanced AI-powered learning recommendations and interactive course content,
                      designed to enhance user engagement and improve learning outcomes.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="px-0">Read More</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button>Load More News</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="podcast" className="mt-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-48 h-48 bg-muted">
                      <Mic className="w-full h-full p-16 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardDescription>Episode {i} • May {i + 10}, 2023</CardDescription>
                          <span className="text-sm text-muted-foreground">45 min</span>
                        </div>
                        <CardTitle>The Future of Professional Development</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2">
                          In this episode, we discuss the evolving landscape of professional development
                          and how technology is shaping the future of learning and career advancement.
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">
                          <Mic className="w-4 h-4 mr-2" /> Listen Now
                        </Button>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button>View All Episodes</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="resources" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    Press Kit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Access our official logos, images, executive bios, and company information 
                    for media and press usage.
                  </p>
                  <Button>Download Press Kit</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Brand Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Access our brand guidelines, color palettes, typography information, and 
                    approved visual assets.
                  </p>
                  <Button>View Brand Assets</Button>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Media Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    For press inquiries, interview requests, or additional information, 
                    please contact our media relations team.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Media Relations</p>
                      <a href="mailto:media@skillpulse.com" className="text-primary">
                        media@skillpulse.com
                      </a>
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href="tel:+18005551234" className="text-primary">
                        +1 (800) 555-1234
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-card rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Stay updated with the latest news, upcoming events, and special offers from SkillPulse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MediaPage;
