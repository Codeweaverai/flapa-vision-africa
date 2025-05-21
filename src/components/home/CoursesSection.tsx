
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Course, fetchPublishedCourses } from '@/services/courseService';

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [visibleCourses, setVisibleCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMore, setShowMore] = useState<boolean>(false);
  const initialCoursesCount = 8; // Show 8 courses initially (2 rows of 4)

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        // Fetch courses and limit to 20 for display on homepage
        const allCourses = await fetchPublishedCourses();
        const limitedCourses = allCourses.slice(0, 20);
        setCourses(limitedCourses);
        setVisibleCourses(limitedCourses.slice(0, initialCoursesCount));
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleShowMore = () => {
    if (showMore) {
      // If already showing more, collapse back to initial view
      setVisibleCourses(courses.slice(0, initialCoursesCount));
      setShowMore(false);
    } else {
      // If showing initial view, expand to show all courses
      setVisibleCourses(courses);
      setShowMore(true);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="heading-md text-gradient">Featured Courses</h2>
            <p className="text-lg text-gray-600 mt-2">
              Expand your skills with our carefully crafted learning resources
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/learning" className="flex items-center gap-2">
              View All Courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No courses available</h3>
            <p className="mt-2 text-gray-500">Check back soon for new learning materials.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleCourses.map((course) => (
                <Card key={course.id} className="flex flex-col h-full transition-all hover:shadow-md">
                  <div className="relative h-48">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-t-lg">
                        <BookOpen className="h-12 w-12 text-primary/40" />
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
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-500 line-clamp-2">{course.summary}</p>
                    <div className="flex items-center mt-3 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="mr-4">New</span>
                      <span>{Math.round(course.duration_minutes / 60)} hours</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link to={`/learning/course/${course.id}`}>
                        View Course
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {courses.length > initialCoursesCount && (
              <div className="flex justify-center mt-10">
                <Button 
                  onClick={handleShowMore} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  {showMore ? "Show Less" : "View More Courses"} 
                  <ArrowRight className={`h-4 w-4 transition-transform ${showMore ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
