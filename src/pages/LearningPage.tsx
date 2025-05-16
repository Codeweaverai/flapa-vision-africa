
import Layout from '@/components/layout/Layout';
import { BookOpen, Video, FileText, Lock, Award, Users, BookUser, Headphones, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const LearningPage = () => {
  return (
    <Layout>
      <div className="section-container">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Learning Platform</h1>
          <p className="text-lg">
            Elevate your skills with curated courses on AI implementation, business growth strategies, 
            and entrepreneurship in Africa's evolving tech landscape.
          </p>
          <div className="flex justify-center mt-6 gap-4">
            <Button size="lg">
              <BookUser className="h-5 w-5 mr-2" /> Browse Courses
            </Button>
            <Button size="lg" variant="outline">
              <Users className="h-5 w-5 mr-2" /> Join Community
            </Button>
          </div>
        </div>

        <Tabs defaultValue="featured" className="mb-16">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="ai-courses">AI & Tech</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" 
                    alt="AI Fundamentals Course" 
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-3 right-3">Featured</Badge>
                </div>
                <CardHeader>
                  <CardTitle>AI Implementation for Business Leaders</CardTitle>
                  <CardDescription>8 Modules • 24 Lessons • 6 Hours</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="mb-4">
                    A comprehensive guide to implementing AI solutions in your business, 
                    from identifying opportunities to measuring ROI and scaling deployment.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span className="mr-4">Beginner-Friendly</span>
                    <Users className="h-4 w-4 mr-1" />
                    <span>2,450+ Enrolled</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                    alt="Entrepreneurship Course" 
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-3 right-3" variant="secondary">Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Pan-African Entrepreneurship</CardTitle>
                  <CardDescription>6 Modules • 18 Lessons • 5 Hours</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="mb-4">
                    Learn how to build and scale businesses across African markets, 
                    navigate regulatory environments, and access funding opportunities.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span className="mr-4">Intermediate</span>
                    <Users className="h-4 w-4 mr-1" />
                    <span>1,820+ Enrolled</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                    alt="Logistics Optimization Course" 
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className="absolute top-3 right-3" variant="outline">New</Badge>
                </div>
                <CardHeader>
                  <CardTitle>Logistics Optimization Masterclass</CardTitle>
                  <CardDescription>10 Modules • 32 Lessons • 8 Hours</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="mb-4">
                    Master advanced techniques for optimizing logistics operations, 
                    from route planning to inventory management and supply chain resilience.
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span className="mr-4">Advanced</span>
                    <Users className="h-4 w-4 mr-1" />
                    <span>980+ Enrolled</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="ai-courses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>AI for Business Decision Making</CardTitle>
                  <CardDescription>5 Modules • 15 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Learn how to leverage AI for strategic business decisions, 
                    predictive analytics, and competitive advantage.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Practical Machine Learning</CardTitle>
                  <CardDescription>8 Modules • 24 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Hands-on course teaching practical applications of machine learning 
                    for business problems, with real-world case studies.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Data Strategy for Growth</CardTitle>
                  <CardDescription>6 Modules • 18 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Develop a comprehensive data strategy to fuel business growth, 
                    innovation, and customer insights.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="business" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>African Market Entry Strategies</CardTitle>
                  <CardDescription>7 Modules • 21 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Comprehensive guide to entering and succeeding in diverse 
                    African markets with tailored business strategies.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Sustainable Business Models</CardTitle>
                  <CardDescription>6 Modules • 18 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Design business models that combine profitability with positive 
                    social and environmental impact across Africa.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Funding & Investment</CardTitle>
                  <CardDescription>8 Modules • 24 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Navigate the African investment landscape, prepare for funding 
                    rounds, and build relationships with investors.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="leadership" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Cross-Cultural Leadership</CardTitle>
                  <CardDescription>5 Modules • 15 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Develop leadership skills for effectively managing diverse 
                    teams across different African cultural contexts.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Strategic Innovation</CardTitle>
                  <CardDescription>7 Modules • 21 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Master the art of fostering innovation within your organization 
                    and turning ideas into market-leading solutions.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Building Resilient Teams</CardTitle>
                  <CardDescription>6 Modules • 18 Lessons</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>
                    Learn strategies for building high-performing teams that can 
                    adapt to challenges and thrive in uncertain environments.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="heading-md mb-6">Learning Formats</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Video Courses</h3>
                  <p>
                    Professionally produced video lessons with practical demonstrations, 
                    case studies, and expert interviews from industry leaders.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Workbooks & Resources</h3>
                  <p>
                    Downloadable guides, templates, and worksheets to help you 
                    implement what you've learned in your business.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Live Workshops</h3>
                  <p>
                    Interactive online sessions with Mbolela and other experts where 
                    you can ask questions and get personalized feedback.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Podcast Episodes</h3>
                  <p>
                    On-the-go learning with in-depth discussions on business strategies, 
                    technology trends, and entrepreneurship in Africa.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Premium Membership</h3>
              <Badge variant="secondary" className="text-lg px-3 py-1">$29/month</Badge>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <Award className="h-5 w-5 text-primary mt-1" />
                <span>Unlimited access to all courses and learning materials</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="h-5 w-5 text-primary mt-1" />
                <span>Monthly live Q&A sessions with Mbolela and industry experts</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-primary mt-1" />
                <span>Exclusive members-only content and early access to new courses</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <span>Downloadable resources, templates, and implementation guides</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="h-5 w-5 text-primary mt-1" />
                <span>Completion certificates for all courses</span>
              </li>
            </ul>
            <Button size="lg" className="w-full">Join Premium Membership</Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              7-day free trial, cancel anytime. No obligations.
            </p>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Start Your Learning Journey Today</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Join our community of over 10,000 entrepreneurs and business leaders 
            learning practical skills to thrive in Africa's evolving business landscape.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Create Free Account</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
