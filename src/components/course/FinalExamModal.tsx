
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  created_at: string;
  updated_at: string;
}

interface ExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  question_type: string;
  difficulty_level: string;
  order_index: number;
  answers: ExamAnswer[];
}

interface ExamAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}

interface FinalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: FinalExam;
  enrollmentId: string;
  onExamComplete?: (examResult: any) => Promise<void>;
}

const FinalExamModal: React.FC<FinalExamModalProps> = ({
  isOpen,
  onClose,
  exam,
  enrollmentId,
  onExamComplete
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(exam.time_limit_minutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && exam.id) {
      fetchQuestions();
    }
  }, [isOpen, exam.id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('final_exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answersData, error: answersError } = await supabase
            .from('final_exam_answers')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true });

          if (answersError) {
            console.error('Error fetching answers:', answersError);
            return { ...question, answers: [] };
          }

          return { ...question, answers: answersData || [] };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      toast.error('Failed to load exam questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    setHasStarted(true);
    setTimeRemaining(exam.time_limit_minutes * 60);
  };

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmitExam = async () => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = questions.length;

      questions.forEach(question => {
        const selectedAnswerId = answers[question.id];
        const correctAnswer = question.answers.find(answer => answer.is_correct);
        
        if (selectedAnswerId === correctAnswer?.id) {
          correctAnswers++;
        }
      });

      const score = correctAnswers;
      const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const passed = percentage >= exam.passing_score;

      // Get attempt number
      const { data: existingAttempts } = await supabase
        .from('final_exam_attempts')
        .select('attempt_number')
        .eq('exam_id', exam.id)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

      const examResult = {
        score,
        percentage,
        passed,
        answers,
        attempt_number: attemptNumber
      };

      if (onExamComplete) {
        await onExamComplete(examResult);
      }

      onClose();
      
      if (passed) {
        toast.success(`Congratulations! You passed with ${percentage.toFixed(1)}%`);
      } else {
        toast.error(`You scored ${percentage.toFixed(1)}%. You need ${exam.passing_score}% to pass.`);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-orange-600" />
            {exam.title}
          </DialogTitle>
        </DialogHeader>

        {!hasStarted ? (
          <Card>
            <CardHeader>
              <CardTitle>Exam Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{exam.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>Time Limit: {exam.time_limit_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span>Questions: {questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Passing Score: {exam.passing_score}%</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Once started, the timer cannot be paused</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• You can navigate between questions before submitting</li>
                  <li>• The exam will auto-submit when time runs out</li>
                </ul>
              </div>

              <Button 
                onClick={handleStartExam}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                Start Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Timer and Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-orange-700">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Progress value={progress} className="w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentQuestion.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {currentQuestion.answers.map((answer) => (
                      <div key={answer.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={answer.id} id={answer.id} />
                        <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                          {answer.answer}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                )}
              </div>
            </div>

            {/* Question Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 ${
                        answers[questions[index]?.id] 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamModal;
