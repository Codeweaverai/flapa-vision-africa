
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, ArrowLeft, Layers, Video, List } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ModuleForm from '@/components/creator/ModuleForm';
import LessonForm from '@/components/creator/LessonForm';
import CourseModuleList from '@/components/creator/CourseModuleList';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
}

const CreatorCourseContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate('/creator/courses');
      return;
    }
    
    const fetchCourse = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
        toast.error('Failed to load course');
        navigate('/creator/courses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [id, navigate]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleModuleSelect = (moduleId: string | null) => {
    setSelectedModuleId(moduleId);
    if (moduleId) {
      setActiveTab('lessons');
    }
  };

  if (loading) {
    return (
      <CreatorLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/creator/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Course Content: {course?.title}</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px] mb-8">
            <TabsTrigger value="modules" onClick={() => setSelectedModuleId(null)}>
              <Layers className="h-4 w-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="lessons" disabled={!selectedModuleId}>
              <Video className="h-4 w-4 mr-2" />
              Lessons
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Modules</h2>
              <Button onClick={() => setActiveTab('add-module')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {course && (
                  <CourseModuleList 
                    courseId={course.id} 
                    onModuleSelect={handleModuleSelect} 
                    refreshTrigger={refreshTrigger}
                    editable={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Module Lessons</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('modules')}>
                  Back to Modules
                </Button>
                <Button onClick={() => setActiveTab('add-lesson')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                {selectedModuleId && (
                  <LessonList 
                    moduleId={selectedModuleId} 
                    refreshTrigger={refreshTrigger} 
                    onRefresh={handleRefresh}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add-module">
            <Card>
              <CardHeader>
                <CardTitle>Add New Module</CardTitle>
              </CardHeader>
              <CardContent>
                <ModuleForm 
                  courseId={id!} 
                  onSuccess={() => {
                    handleRefresh();
                    setActiveTab('modules');
                  }} 
                  onCancel={() => setActiveTab('modules')}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add-lesson">
            <Card>
              <CardHeader>
                <CardTitle>Add New Lesson</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedModuleId && (
                  <LessonForm 
                    moduleId={selectedModuleId} 
                    onSuccess={() => {
                      handleRefresh();
                      setActiveTab('lessons');
                    }} 
                    onCancel={() => setActiveTab('lessons')}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

// Lesson list component
interface LessonListProps {
  moduleId: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content_type: string;
  video_url?: string;
  order_index: number;
}

const LessonList = ({ moduleId, refreshTrigger, onRefresh }: LessonListProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: true });
          
        if (error) throw error;
        setLessons(data || []);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessons();
  }, [moduleId, refreshTrigger]);

  const handleEditLesson = (lessonId: string) => {
    // Navigate to lesson edit page or open modal
    navigate(`/creator/courses/lesson/${lessonId}`);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      
      if (error) throw error;
      toast.success('Lesson deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <List className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No lessons yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Get started by adding your first lesson to this module
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map(lesson => (
        <Card key={lesson.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-muted text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  {lesson.order_index}
                </span>
                <div>
                  <h3 className="font-medium">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.content_type === 'video' ? '🎬 Video Lesson' : '📝 Text Lesson'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEditLesson(lesson.id)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CreatorCourseContent;
