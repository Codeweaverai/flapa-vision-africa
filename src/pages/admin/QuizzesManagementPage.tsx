
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  PenSquare, 
  PlusCircle, 
  Trash2, 
  BookOpen, 
  Edit, 
  X,
  ChevronRight,
  Check,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  fetchAllCourses,
  Course,
  CourseWithModules,
  fetchCourseWithModulesAndLessons,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuizQuestion,
  createQuizAnswer
} from '@/services/courseService';

interface QuizFormData {
  id?: string;
  title: string;
  description: string;
  module_id?: string;
  lesson_id?: string;
  passing_score: number;
  questions: {
    id?: string;
    question: string;
    order_index: number;
    answers: {
      id?: string;
      answer: string;
      is_correct: boolean;
      order_index: number;
    }[];
  }[];
}

const QuizzesManagementPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lesson' | 'module'>('all');
  const [editingQuiz, setEditingQuiz] = useState<QuizFormData | null>(null);
  const [targetModule, setTargetModule] = useState<string | null>(null);
  const [targetLesson, setTargetLesson] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const allCourses = await fetchAllCourses();
      setCourses(allCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (courseId: string) => {
    setLoading(true);
    try {
      const courseWithDetails = await fetchCourseWithModulesAndLessons(courseId);
      setSelectedCourse(courseWithDetails);
    } catch (error) {
      console.error("Error loading course details:", error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter quizzes based on search and filter type
  const getFilteredQuizzes = (): {quiz: Quiz, moduleName: string, lessonName?: string}[] => {
    if (!selectedCourse) return [];
    
    const quizzes: {quiz: Quiz, moduleName: string, lessonName?: string}[] = [];
    
    selectedCourse.modules.forEach(module => {
      // Module quizzes
      if (module.quiz && (filterType === 'all' || filterType === 'module')) {
        if (searchQuery && !module.quiz.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }
        quizzes.push({
          quiz: module.quiz,
          moduleName: module.title
        });
      }
      
      // Lesson quizzes
      if (module.lessons && (filterType === 'all' || filterType === 'lesson')) {
        module.lessons.forEach(lesson => {
          if (lesson.quizzes && lesson.quizzes.length > 0) {
            lesson.quizzes.forEach(quiz => {
              if (searchQuery && !quiz.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return;
              }
              quizzes.push({
                quiz: quiz,
                moduleName: module.title,
                lessonName: lesson.title
              });
            });
          }
        });
      }
    });
    
    return quizzes;
  };

  const handleCreateQuiz = (moduleId?: string, lessonId?: string) => {
    const newQuiz: QuizFormData = {
      title: '',
      description: '',
      module_id: moduleId || undefined,
      lesson_id: lessonId || undefined,
      passing_score: 70,
      questions: [
        {
          question: '',
          order_index: 0,
          answers: [
            { answer: '', is_correct: true, order_index: 0 },
            { answer: '', is_correct: false, order_index: 1 },
            { answer: '', is_correct: false, order_index: 2 },
            { answer: '', is_correct: false, order_index: 3 }
          ]
        }
      ]
    };
    
    setEditingQuiz(newQuiz);
    setTargetModule(moduleId || null);
    setTargetLesson(lessonId || null);
    setQuizDialogOpen(true);
  };

  const handleEditQuiz = (quiz: Quiz, moduleId?: string, lessonId?: string) => {
    // Transform the quiz object to match our form structure
    const formData: QuizFormData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      module_id: moduleId,
      lesson_id: lessonId,
      passing_score: quiz.passing_score || 70,
      questions: quiz.questions?.map(q => ({
        id: q.id,
        question: q.question,
        order_index: q.order_index,
        answers: q.answers?.map(a => ({
          id: a.id,
          answer: a.answer,
          is_correct: a.is_correct,
          order_index: a.order_index
        })) || []
      })) || []
    };
    
    // If there are no questions, add a default one
    if (formData.questions.length === 0) {
      formData.questions.push({
        question: '',
        order_index: 0,
        answers: [
          { answer: '', is_correct: true, order_index: 0 },
          { answer: '', is_correct: false, order_index: 1 },
          { answer: '', is_correct: false, order_index: 2 },
          { answer: '', is_correct: false, order_index: 3 }
        ]
      });
    }
    
    setEditingQuiz(formData);
    setTargetModule(moduleId || null);
    setTargetLesson(lessonId || null);
    setQuizDialogOpen(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      setLoading(true);
      try {
        await deleteQuiz(quizId);
        toast({
          title: "Success",
          description: "Quiz deleted successfully"
        });
        
        // Refresh course data
        if (selectedCourse) {
          const updatedCourse = await fetchCourseWithModulesAndLessons(selectedCourse.id);
          setSelectedCourse(updatedCourse);
        }
      } catch (error) {
        console.error("Error deleting quiz:", error);
        toast({
          title: "Error",
          description: "Failed to delete quiz",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const addQuestion = () => {
    if (!editingQuiz) return;
    
    setEditingQuiz({
      ...editingQuiz,
      questions: [
        ...editingQuiz.questions,
        {
          question: '',
          order_index: editingQuiz.questions.length,
          answers: [
            { answer: '', is_correct: true, order_index: 0 },
            { answer: '', is_correct: false, order_index: 1 },
            { answer: '', is_correct: false, order_index: 2 },
            { answer: '', is_correct: false, order_index: 3 }
          ]
        }
      ]
    });
  };

  const removeQuestion = (index: number) => {
    if (!editingQuiz) return;
    
    const newQuestions = [...editingQuiz.questions];
    newQuestions.splice(index, 1);
    
    // Update order indices
    newQuestions.forEach((q, idx) => {
      q.order_index = idx;
    });
    
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  const handleQuestionChange = (index: number, value: string) => {
    if (!editingQuiz) return;
    
    const newQuestions = [...editingQuiz.questions];
    newQuestions[index].question = value;
    
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    if (!editingQuiz) return;
    
    const newQuestions = [...editingQuiz.questions];
    newQuestions[questionIndex].answers[answerIndex].answer = value;
    
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  const handleCorrectAnswerChange = (questionIndex: number, answerIndex: number) => {
    if (!editingQuiz) return;
    
    const newQuestions = [...editingQuiz.questions];
    
    // Set all answers to incorrect first
    newQuestions[questionIndex].answers.forEach(a => {
      a.is_correct = false;
    });
    
    // Set the selected one to correct
    newQuestions[questionIndex].answers[answerIndex].is_correct = true;
    
    setEditingQuiz({
      ...editingQuiz,
      questions: newQuestions
    });
  };

  const saveQuiz = async () => {
    if (!editingQuiz || !editingQuiz.title) {
      toast({
        title: "Error",
        description: "Quiz title is required",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      let quizId = editingQuiz.id;
      
      // Check if questions are valid
      const invalidQuestions = editingQuiz.questions.filter(q => !q.question);
      if (invalidQuestions.length > 0) {
        toast({
          title: "Error",
          description: "All questions must have content",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Check if answers are valid
      for (const question of editingQuiz.questions) {
        const emptyAnswers = question.answers.filter(a => !a.answer);
        if (emptyAnswers.length > 0) {
          toast({
            title: "Error",
            description: "All answers must have content",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Check if at least one answer is correct
        if (!question.answers.some(a => a.is_correct)) {
          toast({
            title: "Error",
            description: "Each question must have at least one correct answer",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }
      
      // Create or update the quiz
      if (quizId) {
        // Update existing quiz
        await updateQuiz(quizId, {
          title: editingQuiz.title,
          description: editingQuiz.description,
          passing_score: editingQuiz.passing_score
        });
      } else {
        // Create new quiz
        const newQuiz = await createQuiz({
          title: editingQuiz.title,
          description: editingQuiz.description,
          module_id: editingQuiz.module_id,
          lesson_id: editingQuiz.lesson_id,
          passing_score: editingQuiz.passing_score
        });
        
        if (!newQuiz) throw new Error("Failed to create quiz");
        quizId = newQuiz.id;
      }
      
      // Create/Update questions and answers
      for (const question of editingQuiz.questions) {
        let questionId = question.id;
        
        if (!questionId) {
          // Create new question
          const newQuestion = await createQuizQuestion({
            quiz_id: quizId,
            question: question.question,
            order_index: question.order_index
          });
          
          if (!newQuestion) throw new Error("Failed to create question");
          questionId = newQuestion.id;
          
          // Create answers for the new question
          for (const answer of question.answers) {
            await createQuizAnswer({
              question_id: questionId,
              answer: answer.answer,
              is_correct: answer.is_correct,
              order_index: answer.order_index
            });
          }
        }
        // For existing questions, we'd need additional APIs to update questions and answers
        // This is simplified for now
      }
      
      toast({
        title: "Success",
        description: quizId === editingQuiz.id ? "Quiz updated successfully" : "Quiz created successfully"
      });
      
      // Refresh course data
      if (selectedCourse) {
        const updatedCourse = await fetchCourseWithModulesAndLessons(selectedCourse.id);
        setSelectedCourse(updatedCourse);
      }
      
      // Close dialog
      setQuizDialogOpen(false);
      setEditingQuiz(null);
      
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Quiz Management</h1>
        </div>
        
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="all-quizzes" disabled={!selectedCourse}>All Quizzes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <Card key={course.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{course.category}</Badge>
                      <Button size="sm" onClick={() => selectCourse(course.id)}>
                        Manage Quizzes <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {courses.length === 0 && !loading && (
                <div className="col-span-3 text-center py-10">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No courses found</h3>
                  <p className="text-muted-foreground mt-2">Create a course first to manage quizzes</p>
                  <Button className="mt-4" onClick={() => navigate('/admin/courses/new')}>
                    Create Course
                  </Button>
                </div>
              )}
              
              {loading && (
                <div className="col-span-3 text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading courses...</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all-quizzes">
            {selectedCourse && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search quizzes..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | 'lesson' | 'module')}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Quizzes</SelectItem>
                        <SelectItem value="module">Module Quizzes</SelectItem>
                        <SelectItem value="lesson">Lesson Quizzes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={() => handleCreateQuiz()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Quiz
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Passing Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredQuizzes().map(({quiz, moduleName, lessonName}) => (
                        <TableRow key={quiz.id}>
                          <TableCell className="font-medium">{quiz.title}</TableCell>
                          <TableCell>
                            <Badge variant={lessonName ? "outline" : "secondary"}>
                              {lessonName ? "Lesson Quiz" : "Module Quiz"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{moduleName}</span>
                              {lessonName && <span className="text-xs text-muted-foreground">{lessonName}</span>}
                            </div>
                          </TableCell>
                          <TableCell>{quiz.questions?.length || 0}</TableCell>
                          <TableCell>{quiz.passing_score}%</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditQuiz(quiz, lessonName ? undefined : quiz.module_id, lessonName ? quiz.lesson_id : undefined)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteQuiz(quiz.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {getFilteredQuizzes().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center">
                              <PenSquare className="h-10 w-10 text-muted-foreground mb-2" />
                              {searchQuery || filterType !== 'all' ? (
                                <>
                                  <p className="text-muted-foreground">No quizzes match your search</p>
                                  <Button 
                                    variant="link" 
                                    onClick={() => {
                                      setSearchQuery('');
                                      setFilterType('all');
                                    }}
                                  >
                                    Clear filters
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <p className="text-muted-foreground">No quizzes created yet</p>
                                  <Button 
                                    variant="link" 
                                    onClick={() => handleCreateQuiz()}
                                  >
                                    Create your first quiz
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Quiz Creation/Edit Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz?.id ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
            <DialogDescription>
              {editingQuiz?.id 
                ? 'Update the quiz details and questions below.' 
                : 'Add details and questions for your new quiz.'}
            </DialogDescription>
          </DialogHeader>
          
          {editingQuiz && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quiz-title" className="text-right">
                    Quiz Title
                  </Label>
                  <Input
                    id="quiz-title"
                    value={editingQuiz.title}
                    onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})}
                    placeholder="Enter quiz title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quiz-description" className="text-right">
                    Description (Optional)
                  </Label>
                  <Input
                    id="quiz-description"
                    value={editingQuiz.description}
                    onChange={e => setEditingQuiz({...editingQuiz, description: e.target.value})}
                    placeholder="Enter quiz description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="passing-score" className="text-right">
                    Passing Score (%)
                  </Label>
                  <Input
                    id="passing-score"
                    type="number"
                    min="1"
                    max="100"
                    value={editingQuiz.passing_score}
                    onChange={e => setEditingQuiz({...editingQuiz, passing_score: parseInt(e.target.value) || 70})}
                  />
                </div>
                
                {!targetModule && !targetLesson && (
                  <div className="space-y-2">
                    <Label>Quiz Location</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select 
                        value={targetModule || ''} 
                        onValueChange={setTargetModule}
                        disabled={!!targetLesson}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (General Quiz)</SelectItem>
                          {selectedCourse?.modules.map(module => (
                            <SelectItem key={module.id} value={module.id}>
                              {module.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {targetModule && (
                        <Select
                          value={targetLesson || ''}
                          onValueChange={setTargetLesson}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select lesson (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None (Module Quiz)</SelectItem>
                            {selectedCourse?.modules
                              .find(m => m.id === targetModule)?.lessons
                              .map(lesson => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {targetModule 
                        ? (targetLesson 
                            ? "This quiz will be attached to a specific lesson" 
                            : "This quiz will be a module-level quiz")
                        : "This quiz will not be attached to any module or lesson"}
                    </p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                {/* Questions Section */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Quiz Questions</h3>
                    <Button onClick={addQuestion} size="sm" variant="outline">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  
                  {editingQuiz.questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                      
                      <CardHeader>
                        <div className="space-y-2">
                          <Label htmlFor={`question-${questionIndex}`}>
                            Question {questionIndex + 1}
                          </Label>
                          <Input
                            id={`question-${questionIndex}`}
                            value={question.question}
                            onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                            placeholder="Enter your question"
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <Label>Answers (select the correct one)</Label>
                          
                          <RadioGroup 
                            value={question.answers.findIndex(a => a.is_correct).toString()}
                            onValueChange={(value) => handleCorrectAnswerChange(questionIndex, parseInt(value))}
                          >
                            {question.answers.map((answer, answerIndex) => (
                              <div key={answerIndex} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={answerIndex.toString()} 
                                  id={`q${questionIndex}-a${answerIndex}`} 
                                />
                                <Input
                                  value={answer.answer}
                                  onChange={(e) => handleAnswerChange(questionIndex, answerIndex, e.target.value)}
                                  placeholder={`Answer ${answerIndex + 1}`}
                                  className={`flex-1 ${answer.is_correct ? 'border-green-400' : ''}`}
                                />
                                {answer.is_correct && (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {editingQuiz.questions.length === 0 && (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-4">No questions added yet</p>
                      <Button onClick={addQuestion} variant="outline">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Your First Question
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuizDialogOpen(false);
                    setEditingQuiz(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveQuiz} disabled={loading}>
                  {loading ? 'Saving...' : (editingQuiz.id ? 'Update Quiz' : 'Create Quiz')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default QuizzesManagementPage;
