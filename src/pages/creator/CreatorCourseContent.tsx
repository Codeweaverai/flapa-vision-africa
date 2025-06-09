import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  BookOpen, 
  Play, 
  Award,
  FileText,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import CreatorLayout from '@/components/creator/CreatorLayout';
import LessonTranscriptManager from '@/components/creator/LessonTranscriptManager';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  is_published: boolean;
  certificate_enabled: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  course_modules?: CourseModule[];
  course_learning_outcomes?: LearningOutcome[];
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  video_url?: string;
  content_type: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface LearningOutcome {
  id: string;
  outcome: string;
  order_index: number;
}

const CreatorCourseContent = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonContentType, setNewLessonContentType] = useState('video');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [isLessonCreateDialogOpen, setIsLessonCreateDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const [newOutcomeText, setNewOutcomeText] = useState('');
  const [isOutcomeDialogOpen, setIsOutcomeDialogOpen] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            course_modules (
              *,
              lessons (*)
            ),
            course_learning_outcomes (*)
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        setCourse(courseData);
        setModules(courseData?.course_modules || []);
        setOutcomes(courseData?.course_learning_outcomes || []);
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  const handleCreateModule = async () => {
    if (!courseId || !newModuleTitle) return;

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: newModuleTitle,
          description: newModuleDescription,
          order_index: modules.length + 1
        })
        .select('*')
        .single();

      if (error) throw error;

      setModules([...modules, data]);
      setNewModuleTitle('');
      setNewModuleDescription('');
      setIsModuleDialogOpen(false);
      toast.success('Module created successfully');
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedModuleId || !newLessonTitle) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          module_id: selectedModuleId,
          title: newLessonTitle,
          description: newLessonDescription,
          content_type: newLessonContentType,
          video_url: newLessonVideoUrl,
          order_index: modules.find(m => m.id === selectedModuleId)?.lessons?.length || 0
        })
        .select('*')
        .single();

      if (error) throw error;

      // Optimistically update the UI
      setModules(modules.map(module => {
        if (module.id === selectedModuleId) {
          return {
            ...module,
            lessons: [...(module.lessons || []), data]
          };
        }
        return module;
      }));

      setNewLessonTitle('');
      setNewLessonDescription('');
      setNewLessonContentType('video');
      setNewLessonVideoUrl('');
      setIsLessonCreateDialogOpen(false);
      toast.success('Lesson created successfully');
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    }
  };

  const handleCreateOutcome = async () => {
    if (!courseId || !newOutcomeText) return;

    try {
      const { data, error } = await supabase
        .from('course_learning_outcomes')
        .insert({
          course_id: courseId,
          outcome: newOutcomeText,
          order_index: outcomes.length + 1
        })
        .select('*')
        .single();

      if (error) throw error;

      setOutcomes([...outcomes, data]);
      setNewOutcomeText('');
      setIsOutcomeDialogOpen(false);
      toast.success('Learning outcome created successfully');
    } catch (error) {
      console.error('Error creating learning outcome:', error);
      toast.error('Failed to create learning outcome');
    }
  };

  return (
    <CreatorLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Course Content</h1>
          <p className="text-gray-500">Manage the modules, lessons, and learning outcomes for your course.</p>
        </div>
        
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
            <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
            <TabsTrigger value="preview">Course Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Modules</h2>
              <Button onClick={() => setIsModuleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
            
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Module</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="moduleTitle" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="moduleTitle"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="moduleDescription" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="moduleDescription"
                      value={newModuleDescription}
                      onChange={(e) => setNewModuleDescription(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" onClick={handleCreateModule}>
                    Create Module
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {course?.course_modules?.map((module, moduleIndex) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      Module {moduleIndex + 1}: {module.title}
                    </CardTitle>
                    <div className="space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                  )}
                  
                  {/* Lessons */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Lessons</h4>
                      <Button onClick={() => {
                        setIsLessonCreateDialogOpen(true);
                        setSelectedModuleId(module.id);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                    
                    {module.lessons?.map((lesson, lessonIndex) => (
                      <Card key={lesson.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <Play className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  Lesson {lessonIndex + 1}: {lesson.title}
                                </span>
                                <Badge variant="outline">{lesson.content_type}</Badge>
                              </div>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                              )}
                              {lesson.video_url && (
                                <p className="text-xs text-blue-600">Video: {lesson.video_url}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          {/* Add Video Transcript Manager */}
                          {lesson.content_type === 'video' && (
                            <LessonTranscriptManager 
                              lessonId={lesson.id} 
                              lessonTitle={lesson.title} 
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Quizzes - To be implemented later */}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="outcomes">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Learning Outcomes</h2>
              <Button onClick={() => setIsOutcomeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Outcome
              </Button>
            </div>

            <Dialog open={isOutcomeDialogOpen} onOpenChange={setIsOutcomeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Learning Outcome</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="outcomeText" className="text-right">
                      Outcome Text
                    </Label>
                    <Input
                      id="outcomeText"
                      value={newOutcomeText}
                      onChange={(e) => setNewOutcomeText(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" onClick={handleCreateOutcome}>
                    Create Outcome
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-4">
              {outcomes.map((outcome, index) => (
                <Card key={outcome.id}>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      {outcome.outcome}
                    </div>
                    <div className="space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <div>
              <h2 className="text-xl font-semibold">Course Preview</h2>
              <p>This section is under development.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Lesson Dialog */}
      <Dialog open={isLessonCreateDialogOpen} onOpenChange={setIsLessonCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lessonTitle" className="text-right">
                Title
              </Label>
              <Input
                id="lessonTitle"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lessonDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="lessonDescription"
                value={newLessonDescription}
                onChange={(e) => setNewLessonDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lessonContentType" className="text-right">
                Content Type
              </Label>
              <Select value={newLessonContentType} onValueChange={setNewLessonContentType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newLessonContentType === 'video' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lessonVideoUrl" className="text-right">
                  Video URL
                </Label>
                <Input
                  id="lessonVideoUrl"
                  value={newLessonVideoUrl}
                  onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleCreateLesson}>
              Create Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CreatorCourseContent;
