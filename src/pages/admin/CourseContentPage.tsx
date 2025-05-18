
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { 
  fetchCourseWithModulesAndLessons, 
  createModule, 
  updateModule, 
  deleteModule,
  CourseModule,
  Course
} from '@/services/courseService';

const CourseContentPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');

  useEffect(() => {
    if (!courseId) return;
    
    const loadCourseContent = async () => {
      setLoading(true);
      const courseData = await fetchCourseWithModulesAndLessons(courseId);
      
      if (courseData) {
        setCourse(courseData);
        setModules(courseData.modules || []);
      } else {
        toast({
          title: "Error",
          description: "Could not load course content",
          variant: "destructive"
        });
      }
      
      setLoading(false);
    };
    
    loadCourseContent();
  }, [courseId]);

  const handleCreateModule = async () => {
    if (!courseId || !course) return;
    
    const newModuleData = {
      course_id: courseId,
      title: `New Module ${modules.length + 1}`,
      description: '',
      order_index: modules.length
    };
    
    const newModule = await createModule(newModuleData);
    
    if (newModule) {
      setModules([...modules, newModule]);
      toast({
        title: "Module Created",
        description: "New module has been created successfully",
      });
    }
  };

  return (
    <AdminLayout title={`${course?.title || 'Course'} Content`}>
      <div className="mb-4 flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Course Content: {course?.title || 'Loading...'}</h1>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="modules">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">Course Modules</h2>
                <Button onClick={handleCreateModule}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
              
              {modules.length === 0 ? (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground mb-4">This course doesn't have any modules yet</p>
                    <Button onClick={handleCreateModule}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create First Module
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between">
                          <span>Module {index + 1}: {module.title}</span>
                          <div className="text-sm font-normal text-muted-foreground">
                            {module.lessons?.length || 0} Lessons
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{module.description || 'No description'}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit Module</Button>
                          <Button variant="outline" size="sm">Add Lesson</Button>
                          <Button variant="outline" size="sm">Add Quiz</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quizzes">
              <h2 className="text-xl font-semibold mb-4">Course Quizzes</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Quiz management coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <h2 className="text-xl font-semibold mb-4">Content Settings</h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Content settings coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
};

export default CourseContentPage;
