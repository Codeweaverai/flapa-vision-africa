
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Trash2, SquarePlus, Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createQuiz, createQuizQuestion, createQuizAnswer } from "@/services/courseService";

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

  useEffect(() => {
    // Reset form when dialog opens
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
    
    // Set all answers to not correct
    updatedQuestions[questionIndex].answers.forEach(answer => {
      answer.is_correct = false;
    });
    
    // Set the selected answer as correct
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        toast({
          title: "Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        });
        return;
      }
      
      for (let j = 0; j < questions[i].answers.length; j++) {
        if (!questions[i].answers[j].answer.trim()) {
          toast({
            title: "Error",
            description: `Answer ${j + 1} for Question ${i + 1} is required`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the quiz
      const quiz = await createQuiz({
        title,
        description,
        lesson_id: lessonId,
        module_id: moduleId,
        passing_score: 70 // Default passing score
      });
      
      if (quiz) {
        // Create questions and answers
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          const savedQuestion = await createQuizQuestion({
            quiz_id: quiz.id,
            question: question.question,
            order_index: i
          });
          
          if (savedQuestion) {
            // Create answers for this question
            for (let j = 0; j < question.answers.length; j++) {
              await createQuizAnswer({
                question_id: savedQuestion.id,
                answer: question.answers[j].answer,
                is_correct: question.answers[j].is_correct,
                order_index: j
              });
            }
          }
        }
        
        toast({
          title: "Quiz Created",
          description: "Quiz has been created successfully",
        });
        
        onQuizSaved();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Lesson Quiz
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Quiz Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description"
                rows={2}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="border rounded-md p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Question {questionIndex + 1}</h3>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`question-${questionIndex}`}>Question Text</Label>
                  <Textarea
                    id={`question-${questionIndex}`}
                    value={question.question}
                    onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                    placeholder="Enter your question"
                    rows={2}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Answer Options</Label>
                  <RadioGroup 
                    value={String(question.correctAnswerIndex)}
                    onValueChange={(value) => handleCorrectAnswerChange(questionIndex, Number(value))}
                    className="space-y-3"
                  >
                    {question.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={String(answerIndex)} 
                          id={`q${questionIndex}-a${answerIndex}`}
                        />
                        <Input
                          value={answer.answer}
                          onChange={(e) => handleAnswerChange(questionIndex, answerIndex, e.target.value)}
                          placeholder={`Answer option ${answerIndex + 1}`}
                          className="flex-1"
                          required
                        />
                        {answer.is_correct && (
                          <span className="text-green-500 flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Select the radio button next to the correct answer
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`explanation-${questionIndex}`}>Explanation (Optional)</Label>
                  <Textarea
                    id={`explanation-${questionIndex}`}
                    value={question.explanation || ""}
                    onChange={(e) => handleExplanationChange(questionIndex, e.target.value)}
                    placeholder="Explain why the correct answer is right (shown after answering)"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={addQuestion}
            >
              <SquarePlus className="h-4 w-4 mr-2" />
              Add Another Question
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuizFormDialog;
