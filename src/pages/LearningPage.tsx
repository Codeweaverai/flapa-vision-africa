
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FileText, Lock, Award, Users, BookUser, Headphones, Play, MessageCircle } from 'lucide-react';
import { Course, fetchPublishedCourses } from '@/services/courseService';

const LearningPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        const coursesData = await fetchPublishedCourses();
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter courses when category changes
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredCourses(courses);
    } else {
      setFilteredCourses(courses.filter(course => {
        // Case insensitive comparison
        return course.category.toLowerCase() === activeCategory.toLowerCase();
      }));
    }
  }, [activeCategory, courses]);

  // Get unique categories from courses
  const categories = ['all', ...new Set(courses.map(course => course.category))];

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-8 text-gradient">Learning Resources</h1>
          <p className="text-lg">
            Elevate your skills with curated courses on AI implementation, business growth strategies, 
            and entrepreneurship in Africa's evolving tech landscape.
          </p>
          <div className="flex justify-center mt-6 gap-4">
            <Button size="lg">
              <BookUser className="h-5 w-5 mr-2" /> Browse Courses
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/community">
                <Users className="h-5 w-5 mr-2" /> Join Community
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-16" onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {categories.slice(0, 4).map(category => (
              <TabsTrigger key={category} value={category.toLowerCase()}>
                {category === 'all' ? 'All Courses' : category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {activeCategory === 'all' 
                    ? "There are currently no courses available." 
                    : `No courses found in the ${activeCategory} category.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <Card key={course.id} className="flex flex-col">
                    <div className="relative">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3">
                        {course.is_free ? "Free" : `$${course.price}`}
                      </Badge>
                    </div>
                    <CardHeader>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{course.category}</Badge>
                        <Badge variant="outline">{course.difficulty_level}</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4 mr-1" />
                        <span className="mr-4">{course.difficulty_level}</span>
                        <Users className="h-4 w-4 mr-1" />
                        <span>New</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button className="flex-1" asChild>
                        <Link to={`/learning/course/${course.id}`}>
                          <Play className="h-4 w-4 mr-2" /> View Course
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/community/courses?course=${course.id}`}>
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
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
                  <h3 className="text-xl font-semibold mb-1">Community</h3>
                  <p>
                    Connect with fellow learners in our community forum, join discussions,
                    and get support as you implement what you've learned.
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
                <MessageCircle className="h-5 w-5 text-primary mt-1" />
                <span>Full access to the community and premium discussion groups</span>
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
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/community">Join Our Community</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LearningPage;
