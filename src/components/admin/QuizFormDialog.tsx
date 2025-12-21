import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Trash2, SquarePlus, Check, Sparkles, Loader2, BookOpen } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createQuiz, createQuizQuestion, createQuizAnswer } from "@/services/courseService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  moduleId: string;
  onQuizSaved: () => void;
}

interface QuizQuestion {
  id?: string;
  question: string;
  answers: QuizAnswer[];
  correctAnswerIndex: number;
  explanation?: string;
}

interface QuizAnswer {
  id?: string;
  answer: string;
  is_correct: boolean;
}

const QuizFormDialog = ({
  open,
  onOpenChange,
  lessonId,
  moduleId,
  onQuizSaved
}: QuizFormDialogProps) => {
  const [title, setTitle] = useState("Lesson Quiz");
  const [description, setDescription] = useState("Test your knowledge from this lesson");
  const [questions, setQuestions] = useState<QuizQuestion[]>([{
    question: "",
    answers: [
      { answer: "", is_correct: true },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
      { answer: "", is_correct: false }
    ],
    correctAnswerIndex: 0,
    explanation: ""
  }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingProgress, setSavingProgress] = useState({ current: 0, total: 0, message: "" });

  useEffect(() => {
    if (open) {
      setTitle("Lesson Quiz");
      setDescription("Test your knowledge from this lesson");
      setQuestions([{
        question: "",
        answers: [
          { answer: "", is_correct: true },
          { answer: "", is_correct: false },
          { answer: "", is_correct: false },
          { answer: "", is_correct: false }
        ],
        correctAnswerIndex: 0,
        explanation: ""
      }]);
      setSavingProgress({ current: 0, total: 0, message: "" });
    }
  }, [open]);

  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = value;
    setQuestions(updatedQuestions);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers[answerIndex].answer = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex: number, answerIndex: number) => {
    const updatedQuestions = [...questions];
    
    updatedQuestions[questionIndex].answers.forEach(answer => {
      answer.is_correct = false;
    });
    
    updatedQuestions[questionIndex].answers[answerIndex].is_correct = true;
    updatedQuestions[questionIndex].correctAnswerIndex = answerIndex;
    
    setQuestions(updatedQuestions);
  };

  const handleExplanationChange = (index: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].explanation = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        answers: [
          { answer: "", is_correct: true },
          { answer: "", is_correct: false },
          { answer: "", is_correct: false },
          { answer: "", is_correct: false }
        ],
        correctAnswerIndex: 0,
        explanation: ""
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "Quiz must have at least one question",
        variant: "destructive",
      });
      return;
    }
    
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const addAnswerOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers.push({
      answer: "",
      is_correct: false
    });
    setQuestions(updatedQuestions);
  };

  const removeAnswerOption = (questionIndex: number, answerIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (question.answers.length <= 2) {
      toast({
        title: "Cannot Remove",
        description: "Each question must have at least 2 answer options",
        variant: "destructive",
      });
      return;
    }
    
    // If removing the correct answer, set first answer as correct
    if (question.answers[answerIndex].is_correct) {
      question.answers[0].is_correct = true;
      question.correctAnswerIndex = 0;
    }
    
    question.answers.splice(answerIndex, 1);
    setQuestions(updatedQuestions);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a quiz title",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question.trim()) {
        toast({
          title: "Missing Question",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        });
        return false;
      }
      
      // Check for empty answers and at least 2 non-empty answers
      const nonEmptyAnswers = question.answers.filter(answer => answer.answer.trim());
      if (nonEmptyAnswers.length < 2) {
        toast({
          title: "Not Enough Answers",
          description: `Question ${i + 1} needs at least 2 answer options`,
          variant: "destructive",
        });
        return false;
      }

      // Validate that exactly one answer is correct
      const correctAnswers = question.answers.filter(answer => answer.is_correct && answer.answer.trim());
      if (correctAnswers.length !== 1) {
        toast({
          title: "Correct Answer Required",
          description: `Question ${i + 1} must have exactly one correct answer`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const totalOperations = 1 + questions.length + questions.reduce((acc, q) => acc + q.answers.length, 0);
    setSavingProgress({ current: 0, total: totalOperations, message: "Creating quiz..." });

    try {
      // Create the quiz
      setSavingProgress(prev => ({ ...prev, message: "Creating quiz structure..." }));
      const quiz = await createQuiz({
        title,
        description,
        lesson_id: lessonId,
        module_id: moduleId,
        passing_score: 70
      });
      setSavingProgress(prev => ({ ...prev, current: prev.current + 1 }));

      if (quiz) {
        // Create questions and answers
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          setSavingProgress(prev => ({ ...prev, message: `Adding question ${i + 1}...` }));
          const savedQuestion = await createQuizQuestion({
            quiz_id: quiz.id,
            question: question.question,
            explanation: question.explanation || null,
            order_index: i
          });
          setSavingProgress(prev => ({ ...prev, current: prev.current + 1 }));

          if (savedQuestion) {
            // Create answers for this question
            for (let j = 0; j < question.answers.length; j++) {
              const answer = question.answers[j];
              if (answer.answer.trim()) { // Only save non-empty answers
                setSavingProgress(prev => ({ ...prev, message: `Adding answers for question ${i + 1}...` }));
                await createQuizAnswer({
                  question_id: savedQuestion.id,
                  answer: answer.answer,
                  is_correct: answer.is_correct,
                  order_index: j
                });
                setSavingProgress(prev => ({ ...prev, current: prev.current + 1 }));
              }
            }
          }
        }
        
        toast({
          title: "🎉 Quiz Created Successfully",
          description: `Your quiz "${title}" with ${questions.length} questions has been saved.`,
        });
        
        onQuizSaved();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Creation Failed",
        description: "Failed to create the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSavingProgress({ current: 0, total: 0, message: "" });
    }
  };

  const GradientButton = ({ children, ...props }: any) => (
    <Button
      {...props}
      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {children}
    </Button>
  );

  const GradientIcon = () => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
      <Sparkles className="h-5 w-5 text-white" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <GradientIcon />
            <DialogTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold">
              Create Lesson Quiz
            </DialogTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <BookOpen className="h-3 w-3 mr-1" />
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {questions.reduce((acc, q) => acc + q.answers.filter(a => a.answer.trim()).length, 0)} Answers
            </Badge>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Header Section */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                    Quiz Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter an engaging quiz title..."
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Quiz Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this quiz covers..."
                    rows={2}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Questions Section */}
          <div className="space-y-4">
            {questions.map((question, questionIndex) => (
              <Card key={questionIndex} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {questionIndex + 1}
                      </div>
                      <h3 className="font-semibold text-gray-800">Question {questionIndex + 1}</h3>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${questionIndex}`} className="text-sm font-semibold">
                        Question Text <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={`question-${questionIndex}`}
                        value={question.question}
                        onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                        placeholder="Enter your question here..."
                        rows={2}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Answer Options <span className="text-red-500">*</span>
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAnswerOption(questionIndex)}
                          className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <SquarePlus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      
                      <RadioGroup 
                        value={String(question.correctAnswerIndex)}
                        onValueChange={(value) => handleCorrectAnswerChange(questionIndex, Number(value))}
                        className="space-y-3"
                      >
                        {question.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center space-x-3 group">
                            <RadioGroupItem 
                              value={String(answerIndex)} 
                              id={`q${questionIndex}-a${answerIndex}`}
                              className="text-orange-600 border-gray-300"
                            />
                            <Input
                              value={answer.answer}
                              onChange={(e) => handleAnswerChange(questionIndex, answerIndex, e.target.value)}
                              placeholder={`Answer option ${answerIndex + 1}`}
                              className="flex-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              required
                            />
                            {answer.is_correct && (
                              <span className="text-green-600 flex items-center text-sm font-medium">
                                <Check className="h-4 w-4 mr-1" />
                                Correct
                              </span>
                            )}
                            {question.answers.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswerOption(questionIndex, answerIndex)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      <p className="text-xs text-gray-500">
                        💡 Select the radio button to mark the correct answer
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`explanation-${questionIndex}`} className="text-sm font-semibold">
                        Explanation (Optional)
                      </Label>
                      <Textarea
                        id={`explanation-${questionIndex}`}
                        value={question.explanation || ""}
                        onChange={(e) => handleExplanationChange(questionIndex, e.target.value)}
                        placeholder="Explain why the correct answer is right (shown after answering)..."
                        rows={2}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-600 hover:text-orange-600 py-6 transition-all"
              onClick={addQuestion}
            >
              <SquarePlus className="h-5 w-5 mr-2" />
              Add Another Question
            </Button>
          </div>
          
          {/* Progress Indicator */}
          {isSubmitting && (
            <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{savingProgress.message}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${savingProgress.total > 0 ? (savingProgress.current / savingProgress.total) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {savingProgress.current} of {savingProgress.total} operations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <GradientButton 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Quiz
                </>
              )}
            </GradientButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuizFormDialog;
