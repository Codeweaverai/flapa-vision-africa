
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  PlusCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  FileUp,
  Save,
  Move
} from 'lucide-react';

import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/hooks/use-toast';

// Define schema for quiz question
const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).min(2, "At least two options are required"),
  correctOptionIndex: z.number().min(0, "You must select a correct answer"),
  explanation: z.string().optional(),
});

// Define schema for lesson
const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  video_url: z.string().url("Must be a valid URL"),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute"),
  resources: z.array(z.object({
    name: z.string(),
    file_url: z.string(),
  })).optional(),
  has_quiz: z.boolean().default(false),
  quiz: z.array(quizQuestionSchema).optional(),
  order: z.number().optional(),
});

// Define schema for module
const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lessons: z.array(lessonSchema).optional(),
  order: z.number().optional(),
});

// Define schema for the entire form
const courseModulesSchema = z.object({
  modules: z.array(moduleSchema),
});

type CourseModuleFormData = z.infer<typeof courseModulesSchema>;

interface CourseModuleEditorProps {
  courseId: string;
  existingModules?: any[];
  onSaveComplete?: () => void;
}

const CourseModuleEditor = ({ courseId, existingModules = [], onSaveComplete }: CourseModuleEditorProps) => {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<{moduleIndex: number, lessonIndex: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Setup form with react-hook-form and zod validation
  const form = useForm<CourseModuleFormData>({
    resolver: zodResolver(courseModulesSchema),
    defaultValues: {
      modules: existingModules.length > 0 
        ? existingModules 
        : [{ title: '', description: '', lessons: [] }],
    },
  });

  // Setup field arrays for modules and lessons
  const { fields: moduleFields, append: appendModule, remove: removeModule, move: moveModule } = 
    useFieldArray({
      control: form.control,
      name: "modules",
    });

  // Function to handle adding a new lesson to a module
  const handleAddLesson = (moduleIndex: number) => {
    const moduleLessons = form.getValues(`modules.${moduleIndex}.lessons`) || [];
    
    form.setValue(`modules.${moduleIndex}.lessons`, [
      ...moduleLessons,
      {
        title: '',
        description: '',
        video_url: '',
        duration_minutes: 5,
        has_quiz: false,
        quiz: [],
        order: moduleLessons.length,
      }
    ]);
    
    // Expand the module to show the new lesson
    setExpandedModule(moduleIndex);
  };

  // Function to handle removing a lesson from a module
  const handleRemoveLesson = (moduleIndex: number, lessonIndex: number) => {
    const currentLessons = form.getValues(`modules.${moduleIndex}.lessons`) || [];
    const updatedLessons = currentLessons.filter((_, i) => i !== lessonIndex);
    
    form.setValue(`modules.${moduleIndex}.lessons`, updatedLessons);
  };
  
  // Function to add a question to a lesson's quiz
  const handleAddQuestion = (moduleIndex: number, lessonIndex: number) => {
    const currentQuiz = form.getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`) || [];
    
    form.setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`, [
      ...currentQuiz,
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
      }
    ]);
  };
  
  // Function to remove a question from a lesson's quiz
  const handleRemoveQuestion = (moduleIndex: number, lessonIndex: number, questionIndex: number) => {
    const currentQuiz = form.getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`) || [];
    const updatedQuiz = currentQuiz.filter((_, i) => i !== questionIndex);
    
    form.setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`, updatedQuiz);
  };
  
  // Function to handle form submission
  const onSubmit = async (data: CourseModuleFormData) => {
    setIsSaving(true);
    
    try {
      // This would be replaced with your actual API call
      console.log("Saving course modules:", data);
      
      // Mock successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Modules Saved",
        description: "Your course modules have been saved successfully.",
      });
      
      if (onSaveComplete) onSaveComplete();
    } catch (error) {
      console.error("Error saving course modules:", error);
      toast({
        title: "Error Saving Modules",
        description: "There was an error saving your course modules. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to toggle quiz for a lesson
  const handleToggleQuiz = (moduleIndex: number, lessonIndex: number, hasQuiz: boolean) => {
    form.setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.has_quiz`, hasQuiz);
    
    // If enabling quiz and no questions exist, add a first empty question
    if (hasQuiz) {
      const currentQuiz = form.getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`) || [];
      if (currentQuiz.length === 0) {
        handleAddQuestion(moduleIndex, lessonIndex);
      }
    }
  };
  
  // Function to handle moving a module up or down
  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < moduleFields.length) {
      moveModule(index, newIndex);
    }
  };
  
  // Function to handle moving a lesson up or down within a module
  const handleMoveLesson = (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    const lessons = form.getValues(`modules.${moduleIndex}.lessons`) || [];
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    if (newIndex >= 0 && newIndex < lessons.length) {
      const updatedLessons = [...lessons];
      const [removedLesson] = updatedLessons.splice(lessonIndex, 1);
      updatedLessons.splice(newIndex, 0, removedLesson);
      
      // Update the order property for each lesson
      updatedLessons.forEach((lesson, idx) => {
        lesson.order = idx;
      });
      
      form.setValue(`modules.${moduleIndex}.lessons`, updatedLessons);
    }
  };
  
  // Function to handle file uploads for lesson resources
  const handleFileUpload = (moduleIndex: number, lessonIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const currentResources = form.getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.resources`) || [];
    
    // In a real application, you would upload the file to your server/storage here
    // For now, we'll just create mock file URLs
    const newResources = Array.from(files).map(file => ({
      name: file.name,
      file_url: URL.createObjectURL(file), // This is just for demonstration
    }));
    
    form.setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources`, [
      ...currentResources,
      ...newResources,
    ]);
  };
  
  // Function to remove a resource from a lesson
  const handleRemoveResource = (moduleIndex: number, lessonIndex: number, resourceIndex: number) => {
    const currentResources = form.getValues(`modules.${moduleIndex}.lessons.${lessonIndex}.resources`) || [];
    const updatedResources = currentResources.filter((_, i) => i !== resourceIndex);
    
    form.setValue(`modules.${moduleIndex}.lessons.${lessonIndex}.resources`, updatedResources);
  };
  
  return (
    <div className="bg-light-purple px-4 py-6 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Course Modules</h2>
            <Button
              type="button" 
              onClick={() => appendModule({ title: '', description: '', lessons: [] })}
              className="bg-primary hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
          
          <Separator className="my-6" />
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {moduleFields.map((moduleField, moduleIndex) => (
              <AccordionItem 
                key={moduleField.id} 
                value={`module-${moduleIndex}`}
                className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`modules.${moduleIndex}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Module Title" 
                                {...field} 
                                className="text-lg font-medium border-none shadow-none focus-visible:ring-0 p-0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMoveModule(moduleIndex, 'up')}
                        disabled={moduleIndex === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMoveModule(moduleIndex, 'down')}
                        disabled={moduleIndex === moduleFields.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <AccordionTrigger className="ml-2 h-8 w-8" />
                    </div>
                  </div>
                </div>
                
                <AccordionContent className="pb-0">
                  <div className="p-4 pt-0">
                    <FormField
                      control={form.control}
                      name={`modules.${moduleIndex}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Module Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter module description..." 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Lessons</h3>
                        <Button
                          type="button" 
                          onClick={() => handleAddLesson(moduleIndex)}
                          size="sm"
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Lesson
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {form.watch(`modules.${moduleIndex}.lessons`)?.map((_, lessonIndex) => (
                          <Card key={lessonIndex} className="border border-gray-200">
                            <CardHeader className="pb-3 pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input 
                                            placeholder="Lesson Title" 
                                            {...field} 
                                            className="text-md font-medium border-none shadow-none focus-visible:ring-0 p-0"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleMoveLesson(moduleIndex, lessonIndex, 'up')}
                                    disabled={lessonIndex === 0}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleMoveLesson(moduleIndex, lessonIndex, 'down')}
                                    disabled={lessonIndex === (form.watch(`modules.${moduleIndex}.lessons`)?.length || 0) - 1}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    type="button" 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleRemoveLesson(moduleIndex, lessonIndex)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  
                                  <CollapsibleTrigger 
                                    className="ml-2 h-8 w-8"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (expandedLesson?.moduleIndex === moduleIndex && expandedLesson?.lessonIndex === lessonIndex) {
                                        setExpandedLesson(null);
                                      } else {
                                        setExpandedLesson({ moduleIndex, lessonIndex });
                                      }
                                    }}
                                  >
                                    {expandedLesson?.moduleIndex === moduleIndex && expandedLesson?.lessonIndex === lessonIndex ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <Collapsible
                              open={expandedLesson?.moduleIndex === moduleIndex && expandedLesson?.lessonIndex === lessonIndex}
                            >
                              <CollapsibleContent>
                                <CardContent className="pb-4 space-y-4">
                                  <FormField
                                    control={form.control}
                                    name={`modules.${moduleIndex}.lessons.${lessonIndex}.description`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Lesson Description</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Enter lesson description..." 
                                            {...field} 
                                            rows={2}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`modules.${moduleIndex}.lessons.${lessonIndex}.video_url`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Video URL</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="https://youtube.com/..." 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormDescription>
                                            YouTube or Vimeo video URL
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name={`modules.${moduleIndex}.lessons.${lessonIndex}.duration_minutes`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Duration (minutes)</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="number" 
                                              {...field} 
                                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="mb-2 block">Lesson Resources</Label>
                                    
                                    <div className="mt-2">
                                      <div className="flex items-center space-x-2">
                                        <Input 
                                          type="file" 
                                          multiple
                                          id={`resources-${moduleIndex}-${lessonIndex}`}
                                          className="hidden"
                                          onChange={(e) => handleFileUpload(moduleIndex, lessonIndex, e.target.files)}
                                        />
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => document.getElementById(`resources-${moduleIndex}-${lessonIndex}`)?.click()}
                                        >
                                          <FileUp className="h-4 w-4 mr-1" />
                                          Upload Resources
                                        </Button>
                                      </div>
                                      
                                      <div className="mt-2 space-y-1">
                                        {form.watch(`modules.${moduleIndex}.lessons.${lessonIndex}.resources`)?.map((resource, resourceIndex) => (
                                          <div 
                                            key={resourceIndex} 
                                            className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded-md"
                                          >
                                            <span className="text-sm truncate">{resource.name}</span>
                                            <Button
                                              type="button" 
                                              size="sm" 
                                              variant="ghost"
                                              onClick={() => handleRemoveResource(moduleIndex, lessonIndex, resourceIndex)}
                                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <FormField
                                          control={form.control}
                                          name={`modules.${moduleIndex}.lessons.${lessonIndex}.has_quiz`}
                                          render={({ field }) => (
                                            <FormItem className="flex items-center space-x-2">
                                              <FormControl>
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    handleToggleQuiz(moduleIndex, lessonIndex, checked);
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="cursor-pointer">Add Quiz</FormLabel>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      {form.watch(`modules.${moduleIndex}.lessons.${lessonIndex}.has_quiz`) && (
                                        <Button
                                          type="button" 
                                          size="sm" 
                                          onClick={() => handleAddQuestion(moduleIndex, lessonIndex)}
                                        >
                                          <PlusCircle className="h-4 w-4 mr-1" />
                                          Add Question
                                        </Button>
                                      )}
                                    </div>
                                    
                                    {form.watch(`modules.${moduleIndex}.lessons.${lessonIndex}.has_quiz`) && (
                                      <div className="mt-4 space-y-6">
                                        {form.watch(`modules.${moduleIndex}.lessons.${lessonIndex}.quiz`)?.map((_, questionIndex) => (
                                          <Card key={questionIndex} className="bg-gray-50 border border-gray-200">
                                            <CardHeader className="pb-3">
                                              <div className="flex items-center justify-between">
                                                <CardTitle className="text-md">
                                                  Question {questionIndex + 1}
                                                </CardTitle>
                                                <Button
                                                  type="button" 
                                                  size="sm" 
                                                  variant="ghost"
                                                  onClick={() => handleRemoveQuestion(moduleIndex, lessonIndex, questionIndex)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </CardHeader>
                                            
                                            <CardContent className="space-y-4">
                                              <FormField
                                                control={form.control}
                                                name={`modules.${moduleIndex}.lessons.${lessonIndex}.quiz.${questionIndex}.question`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Question</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        placeholder="Enter question text..." 
                                                        {...field} 
                                                      />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              
                                              <div className="space-y-3">
                                                <FormLabel>Answer Options</FormLabel>
                                                {[0, 1, 2, 3].map((optionIndex) => (
                                                  <div key={optionIndex} className="flex items-center space-x-2">
                                                    <FormField
                                                      control={form.control}
                                                      name={`modules.${moduleIndex}.lessons.${lessonIndex}.quiz.${questionIndex}.correctOptionIndex`}
                                                      render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-2">
                                                          <FormControl>
                                                            <input
                                                              type="radio"
                                                              checked={field.value === optionIndex}
                                                              onChange={() => field.onChange(optionIndex)}
                                                              className="radio"
                                                            />
                                                          </FormControl>
                                                        </FormItem>
                                                      )}
                                                    />
                                                    
                                                    <FormField
                                                      control={form.control}
                                                      name={`modules.${moduleIndex}.lessons.${lessonIndex}.quiz.${questionIndex}.options.${optionIndex}`}
                                                      render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                          <FormControl>
                                                            <Input 
                                                              placeholder={`Option ${optionIndex + 1}`} 
                                                              {...field} 
                                                            />
                                                          </FormControl>
                                                        </FormItem>
                                                      )}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                              
                                              <FormField
                                                control={form.control}
                                                name={`modules.${moduleIndex}.lessons.${lessonIndex}.quiz.${questionIndex}.explanation`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Explanation (Optional)</FormLabel>
                                                    <FormControl>
                                                      <Textarea 
                                                        placeholder="Explanation for the correct answer..." 
                                                        {...field} 
                                                        rows={2}
                                                      />
                                                    </FormControl>
                                                    <FormDescription>
                                                      This will be shown to students after they answer
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        ))}
                        
                        {form.watch(`modules.${moduleIndex}.lessons`)?.length === 0 && (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                            <p className="text-muted-foreground mb-2">No lessons added yet</p>
                            <Button
                              type="button" 
                              onClick={() => handleAddLesson(moduleIndex)}
                              size="sm"
                              variant="outline"
                            >
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add First Lesson
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {moduleFields.length === 0 && (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg bg-white">
              <h3 className="text-lg font-medium mb-2">No Modules Added Yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first course module</p>
              <Button
                type="button" 
                onClick={() => appendModule({ title: '', description: '', lessons: [] })}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Module
              </Button>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Modules
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseModuleEditor;
