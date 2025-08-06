
import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CommunityLayout from '@/components/community/CommunityLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
import { Course, fetchPublishedCourses } from '@/services/courseService';
import CourseDiscussionSection from '@/components/community/CourseDiscussionSection';

const CommunityCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      const data = await fetchPublishedCourses();
      setCourses(data);
      setLoading(false);
    };
    
    loadCourses();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    switch (value) {
      case 'feed':
        navigate('/community');
        break;
      case 'chat':
        navigate('/community/chat');
        break;
      case 'courses':
        navigate('/community/courses');
        break;
      case 'notifications':
        navigate('/community/notifications');
        break;
    }
  };

  return (
    <CommunityLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-2xl font-bold mb-4">Course Discussions</h2>
            {loading ? (
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
              </Card>
            ) : courses.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary/40" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  There are no courses available for discussion
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <Button 
                    key={course.id}
                    variant={selectedCourse?.id === course.id ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-white text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 w-fit">{course.category}
                     </div>
                      </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2">
          {selectedCourse ? (
            <CourseDiscussionSection courseId={selectedCourse.id} />
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary/40" />
              <h3 className="text-xl font-semibold mb-2">Select a course</h3>
              <p className="text-muted-foreground">
                Choose a course from the list to view and participate in discussions
              </p>
            </Card>
          )}
        </div>
      </div>
    </CommunityLayout>
  );
};

export default CommunityCoursesPage;
