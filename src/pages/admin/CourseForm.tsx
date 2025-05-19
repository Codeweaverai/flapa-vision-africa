import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Course, createCourse, fetchCourseById, updateCourse, CourseModule, Lesson, Quiz, updateQuiz, deleteQuiz, uploadCourseThumbnail } from '@/services/courseService';
import Layout from '@/components/layout/Layout';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import ModuleFormDialog from '@/components/admin/ModuleFormDialog';
import LessonFormDialog from '@/components/admin/LessonFormDialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

interface CourseFormProps {
  isCreator?: boolean;
}

const CourseForm = ({ isCreator = false }: CourseFormProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [category, setCategory] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [tags, setTags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [openLessonDialog, setOpenLessonDialog] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (courseId) {
        const course = await fetchCourseById(courseId);
        if (course) {
          setEditingCourse(course);
          setTitle(course.title);
          setSummary(course.summary);
          setDescription(course.description);
          setDifficulty(course.difficulty_level as DifficultyLevel);
          setCategory(course.category);
          setDurationHours(Math.floor(course.duration_minutes / 60).toString());
          setDurationMinutes((course.duration_minutes % 60).toString());
          setPrice(course.price.toString());
          setIsFree(course.is_free);
          setIsPublished(course.is_published);
          setCertificateEnabled(course.certificate_enabled);
          setTags(course.tags ? course.tags.join(', ') : '');
          setThumbnailUrl(course.thumbnail_url || null);
          setModules(course.modules || []);
        }
      }
    };

    loadCourse();
  }, [courseId]);

  const handleModuleSaved = (module: CourseModule) => {
    if (editingModule) {
      // Update existing module
      setModules(modules.map(m => m.id === module.id ? module : m));
      setEditingModule(null);
    } else {
      // Add new module
      setModules([...modules, module]);
    }
  };

  const handleLessonSaved = (lesson: Lesson) => {
    // Logic to update lessons state
    setLessons([...lessons, lesson]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const courseData = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        difficulty_level: difficulty,
        category: category.trim(),
        duration_minutes: parseInt(durationHours) * 60 + parseInt(durationMinutes),
        price: parseFloat(price),
        is_free: isFree,
        is_published: isPublished,
        certificate_enabled: certificateEnabled,
        tags: tags.length > 0 ? tags.split(',').map(tag => tag.trim()) : []
      };

      if (courseId) {
        // Update existing course
        const updatedCourse = await updateCourse(editingCourse?.id || '', courseData);
        if (updatedCourse) {
          toast({
            title: "Course Updated",
            description: "The course has been updated successfully.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update the course.",
            variant: "destructive",
          });
        }
      } else {
        // Create new course
        if (isCreator && user) {
          // Creator is creating a course
          const newCourse = await createCourseWithCreator(courseData, user.id);
          if (newCourse) {
            toast.success("Course created successfully!");
            navigate(isCreator ? "/creator/courses" : "/admin/courses");
          }
        } else {
          // Admin is creating a course
          const newCourse = await createCourse(courseData);
          if (newCourse) {
            toast.success("Course created successfully!");
            navigate("/admin/courses");
          }
        }
      }
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "Failed to save the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!editingCourse) {
      toast({
        title: "Error",
        description: "Please save the course first before uploading a thumbnail.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = await uploadCourseThumbnail(editingCourse.id, file);
      if (url) {
        setThumbnailUrl(url);
        toast({
          title: "Thumbnail Uploaded",
          description: "The course thumbnail has been uploaded successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload the course thumbnail.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast({
        title: "Error",
        description: "Failed to upload the course thumbnail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="section-container">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="heading-md">{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>
              Enter the details for the course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")}
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationHours">Duration (Hours)</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="durationMinutes">Duration (Minutes)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Input
                    id="summary"
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isFree"
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
                <Label htmlFor="isFree">Is Free</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="isPublished">Is Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="certificateEnabled"
                  checked={certificateEnabled}
                  onCheckedChange={setCertificateEnabled}
                />
                <Label htmlFor="certificateEnabled">Certificate Enabled</Label>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Course'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>Course Thumbnail</CardTitle>
            <CardDescription>
              Upload a thumbnail for the course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Upload Thumbnail</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
              <Button type="button" onClick={handleUpload} disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Course Thumbnail"
                className="mt-4 rounded-md"
              />
            )}
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="md:flex items-start justify-between mb-4">
          <h3 className="heading-md">Course Modules</h3>
          <Button onClick={() => { setOpenModuleDialog(true); setEditingModule(null); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>

        {modules.map((module) => (
          <Card key={module.id} className="mb-4">
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:flex items-start justify-between">
                <div>
                  <h4 className="mb-2">Lessons</h4>
                  {/* List of Lessons */}
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between">
                      <span>{lesson.title}</span>
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => { setOpenLessonDialog(true); setEditingLesson(lesson); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this lesson and remove its data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <Button variant="destructive">Delete</Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" size="sm" onClick={() => { setOpenLessonDialog(true); setSelectedModuleId(module.id); }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Lesson
                  </Button>
                </div>
                <div>
                  <Button variant="ghost" size="sm" onClick={() => { setOpenModuleDialog(true); setEditingModule(module); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Module
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Module
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this module and remove its data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive">Delete</Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <ModuleFormDialog
          open={openModuleDialog}
          onOpenChange={setOpenModuleDialog}
          courseId={editingCourse?.id || ''}
          onModuleSaved={handleModuleSaved}
          editingModule={editingModule}
          modules={modules}
        />

        <LessonFormDialog
          open={openLessonDialog}
          onOpenChange={setOpenLessonDialog}
          moduleId={selectedModuleId || ''}
          onLessonSaved={handleLessonSaved}
          editingLesson={editingLesson}
          lessons={lessons}
          courseId={editingCourse?.id || ''}
        />
      </div>
    </Layout>
  );
};

export default CourseForm;
