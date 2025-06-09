import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash, Save, X, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import LessonTranscriptManager from '@/components/creator/LessonTranscriptManager';

interface Course {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes: number;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  certificate_enabled: boolean;
  creator_id: string;
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
}

const AdminCourseContent = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newOutcomeText, setNewOutcomeText] = useState('');

  const [editingCourse, setEditingCourse] = useState(false);
  const [editedCourseData, setEditedCourseData] = useState<Partial<Course>>({});

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        // Fetch course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);
        setEditedCourseData(courseData);

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        // Fetch learning outcomes
        const { data: outcomesData, error: outcomesError } = await supabase
          .from('course_learning_outcomes')
          .select('*')
          .eq('course_id', courseId);

        if (outcomesError) throw outcomesError;
        setLearningOutcomes(outcomesData || []);

      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleAddModule = async () => {
    if (!newModuleTitle.trim() || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert([{
          course_id: courseId,
          title: newModuleTitle.trim(),
          order_index: modules.length
        }])
        .select()
        .single();

      if (error) throw error;

      setModules([...modules, data]);
      setNewModuleTitle('');
      toast.success('Module added successfully');
    } catch (error) {
      console.error('Error adding module:', error);
      toast.error('Failed to add module');
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([{
          module_id: moduleId,
          title: newLessonTitle.trim(),
          order_index: modules.find(m => m.id === moduleId)?.lessons?.length || 0,
          content_type: 'video'
        }])
        .select()
        .single();

      if (error) throw error;

      // Optimistically update the UI
      setModules(prevModules =>
        prevModules.map(module =>
          module.id === moduleId
            ? { ...module, lessons: [...(module.lessons || []), data] }
            : module
        )
      );

      setNewLessonTitle('');
      toast.success('Lesson added successfully');
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error('Failed to add lesson');
    }
  };

  const handleAddOutcome = async () => {
    if (!newOutcomeText.trim() || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('course_learning_outcomes')
        .insert([{
          course_id: courseId,
          outcome: newOutcomeText.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      setLearningOutcomes([...learningOutcomes, data]);
      setNewOutcomeText('');
      toast.success('Learning outcome added successfully');
    } catch (error) {
      console.error('Error adding learning outcome:', error);
      toast.error('Failed to add learning outcome');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return;

    try {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      setModules(modules.filter(module => module.id !== moduleId));
      toast.success('Module deleted successfully');
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      // Optimistically update the UI
      setModules(prevModules =>
        prevModules.map(module =>
          module.id === moduleId
            ? { ...module, lessons: (module.lessons || []).filter(lesson => lesson.id !== lessonId) }
            : module
        )
      );

      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleDeleteOutcome = async (outcomeId: string) => {
    if (!window.confirm('Are you sure you want to delete this learning outcome?')) return;

    try {
      const { error } = await supabase
        .from('course_learning_outcomes')
        .delete()
        .eq('id', outcomeId);

      if (error) throw error;

      setLearningOutcomes(learningOutcomes.filter(outcome => outcome.id !== outcomeId));
      toast.success('Learning outcome deleted successfully');
    } catch (error) {
      console.error('Error deleting learning outcome:', error);
      toast.error('Failed to delete learning outcome');
    }
  };

  const handleEditCourse = () => {
    setEditingCourse(true);
  };

  const handleSaveCourse = async () => {
    if (!courseId) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update(editedCourseData)
        .eq('id', courseId);

      if (error) throw error;

      setCourse({ ...course, ...editedCourseData } as Course);
      setEditingCourse(false);
      toast.success('Course updated successfully');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleCancelEdit = () => {
    setEditingCourse(false);
    setEditedCourseData(course);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCourseData({ ...editedCourseData, [name]: value });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditedCourseData({ ...editedCourseData, [name]: checked });
  };

  if (loading) {
    return <div>Loading course content...</div>;
  }

  if (!course) {
    return <div>Course not found.</div>;
  }

  const renderLesson = (lesson: Lesson, moduleIndex: number, lessonIndex: number) => (
    <div key={lesson.id} className="border rounded-lg p-4 bg-gray-50">
      <h4 className="text-md font-semibold mb-2">
        Lesson {lessonIndex + 1}: {lesson.title}
      </h4>
      <p className="text-sm text-gray-600 mb-3">
        Type: {lesson.content_type}, Order: {lesson.order_index}
      </p>
      
      {/* Add transcript manager for video lessons */}
      {lesson.content_type === 'video' && (
        <LessonTranscriptManager 
          lessonId={lesson.id} 
          lessonTitle={lesson.title} 
        />
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteLesson(lesson.id, modules[moduleIndex].id)}
          className="bg-red-500 text-white hover:bg-red-700"
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Course Content</h1>
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          {editingCourse ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={course.title}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  defaultValue={course.summary}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={course.description}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  type="text"
                  id="category"
                  name="category"
                  defaultValue={course.category}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="difficulty_level">Difficulty Level</Label>
                <Select
                  defaultValue={course.difficulty_level}
                  onValueChange={(value) => setEditedCourseData({ ...editedCourseData, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  type="number"
                  id="duration_minutes"
                  name="duration_minutes"
                  defaultValue={course.duration_minutes}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  type="number"
                  id="price"
                  name="price"
                  defaultValue={course.price}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="is_free">Is Free</Label>
                <Switch
                  id="is_free"
                  name="is_free"
                  checked={course.is_free}
                  onCheckedChange={(checked) => setEditedCourseData({ ...editedCourseData, is_free: checked })}
                />
              </div>
              <div>
                <Label htmlFor="certificate_enabled">Certificate Enabled</Label>
                <Switch
                  id="certificate_enabled"
                  name="certificate_enabled"
                  checked={course.certificate_enabled}
                  onCheckedChange={(checked) => setEditedCourseData({ ...editedCourseData, certificate_enabled: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveCourse}><Save className="h-4 w-4 mr-2" />Save</Button>
                <Button variant="secondary" onClick={handleCancelEdit}><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>Title:</strong> {course.title}</p>
              <p><strong>Summary:</strong> {course.summary}</p>
              <p><strong>Description:</strong> {course.description}</p>
              <p><strong>Category:</strong> {course.category}</p>
              <p><strong>Difficulty Level:</strong> {course.difficulty_level}</p>
              <p><strong>Duration:</strong> {course.duration_minutes} minutes</p>
              <p><strong>Price:</strong> ${course.price}</p>
              <p><strong>Is Free:</strong> {course.is_free ? 'Yes' : 'No'}</p>
              <p><strong>Certificate Enabled:</strong> {course.certificate_enabled ? 'Yes' : 'No'}</p>
              <Button onClick={handleEditCourse}><Pencil className="h-4 w-4 mr-2" />Edit Course</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="newOutcome">New Outcome</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                id="newOutcome"
                placeholder="Enter learning outcome"
                value={newOutcomeText}
                onChange={(e) => setNewOutcomeText(e.target.value)}
              />
              <Button onClick={handleAddOutcome}><Plus className="h-4 w-4 mr-2" />Add Outcome</Button>
            </div>
          </div>
          <ul>
            {learningOutcomes.map((outcome) => (
              <li key={outcome.id} className="flex justify-between items-center py-2 border-b">
                <span>{outcome.outcome}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteOutcome(outcome.id)}
                  className="bg-red-500 text-white hover:bg-red-700"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Course Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="newModule">New Module Title</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                id="newModule"
                placeholder="Enter module title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
              <Button onClick={handleAddModule}><Plus className="h-4 w-4 mr-2" />Add Module</Button>
            </div>
          </div>
          <Accordion type="multiple">
            {modules.map((module, moduleIndex) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="text-left">
                  {module.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-4">
                    <Label htmlFor={`newLesson-${module.id}`}>New Lesson Title</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        id={`newLesson-${module.id}`}
                        placeholder="Enter lesson title"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                      />
                      <Button onClick={() => handleAddLesson(module.id)}><Plus className="h-4 w-4 mr-2" />Add Lesson</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, lessonIndex) => (
                        renderLesson(lesson, moduleIndex, lessonIndex)
                      ))
                    ) : (
                      <p>No lessons in this module yet.</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                    className="bg-red-500 text-white hover:bg-red-700 mt-4"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Module
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourseContent;
