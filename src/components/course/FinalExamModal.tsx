import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FinalExamResultsModal from './FinalExamResultsModal';

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
}

interface ExamQuestion {
  id: string;
  question: string;
  difficulty_level: string;
  answers: ExamAnswer[];
}

interface ExamAnswer {
  id: string;
  answer: string;
  is_correct: boolean;
}

interface FinalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: FinalExam;
  enrollmentId: string;
}

const FinalExamModal: React.FC<FinalExamModalProps> = ({
  isOpen,
  onClose,
  exam,
  enrollmentId
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.time_limit_minutes * 60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [examResults, setExamResults] = useState<{
    score: number;
    passed: boolean;
    quizScores: number[];
    finalGrade: number;
    courseName: string;
    studentName: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && !examStarted) {
      loadQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStarted, timeLeft]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data: questionsData, error } = await supabase
        .from('final_exam_questions')
        .select(`
          *,
          final_exam_answers(*)
        `)
        .eq('exam_id', exam.id)
        .order('order_index');

      if (error) throw error;

      const formattedQuestions = questionsData?.map(q => ({
        id: q.id,
        question: q.question,
        difficulty_level: q.difficulty_level,
        answers: q.final_exam_answers?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error loading exam questions:', error);
      toast.error('Failed to load exam questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleAutoSubmit = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && Object.keys(answers).length < questions.length) {
      if (!confirm('You have not answered all questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const answerDetails: Record<string, any> = {};

      questions.forEach(question => {
        const userAnswerId = answers[question.id];
        const correctAnswer = question.answers.find(a => a.is_correct);
        const isCorrect = userAnswerId === correctAnswer?.id;
        
        if (isCorrect) correctAnswers++;
        
        answerDetails[question.id] = {
          user_answer: userAnswerId,
          correct_answer: correctAnswer?.id,
          is_correct: isCorrect
        };
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= exam.passing_score;

      // Get attempt number
      const { data: existingAttempts } = await supabase
        .from('final_exam_attempts')
        .select('attempt_number')
        .eq('exam_id', exam.id)
        .eq('enrollment_id', enrollmentId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

      // Save attempt
      const { error } = await supabase
        .from('final_exam_attempts')
        .insert({
          exam_id: exam.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          enrollment_id: enrollmentId,
          score,
          passed,
          attempt_number: attemptNumber,
          completed_at: new Date().toISOString(),
          answers: answerDetails
        });

      if (error) throw error;

      // Get course and student info for results - Simplified approach
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('course_id, user_id')
        .eq('id', enrollmentId)
        .single();

      let courseName = 'Course';
      let studentName = 'Student';

      if (enrollmentData) {
        // Get course name
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', enrollmentData.course_id)
          .single();

        // Get student name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', enrollmentData.user_id)
          .single();

        courseName = courseData?.title || 'Course';
        studentName = profileData?.full_name || 'Student';
      }

      // Get quiz scores (placeholder for now)
      const quizScores: number[] = [];
      
      setExamResults({
        score,
        passed,
        quizScores,
        finalGrade: score, // For now, just use exam score
        courseName,
        studentName
      });

      setShowResults(true);
      toast.success(`Exam completed! Score: ${score}%`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / (exam.time_limit_minutes * 60)) * 100;
    if (percentage <= 10) return 'text-red-600';
    if (percentage <= 25) return 'text-orange-600';
    return 'text-green-600';
  };

  const handleResultsClose = () => {
    setShowResults(false);
    onClose();
  };

  const handleRetake = () => {
    setShowResults(false);
    setExamStarted(false);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(exam.time_limit_minutes * 60);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResults && examResults) {
    return (
      <FinalExamResultsModal
        isOpen={showResults}
        onClose={handleResultsClose}
        examScore={examResults.score}
        quizScores={examResults.quizScores}
        finalGrade={examResults.finalGrade}
        passed={examResults.passed}
        courseName={examResults.courseName}
        studentName={examResults.studentName}
        enrollmentId={enrollmentId}
        onRetake={handleRetake}
      />
    );
  }

  if (!examStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-orange-500" />
              {exam.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
            )}
            
            <Card className="bg-gradient-to-r from-orange-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="text-lg font-semibold">{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Limit</p>
                    <p className="text-lg font-semibold">{exam.time_limit_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passing Score</p>
                    <p className="text-lg font-semibold">{exam.passing_score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Question Types</p>
                    <p className="text-lg font-semibold">Multiple Choice</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span>You must answer all questions within the time limit</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Your score will be combined with quiz scores for final grade</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Timer starts immediately when you begin</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setExamStarted(true)}
                className="bg-gradient-to-r from-orange-500 to-purple-600"
              >
                Start Final Exam
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              {exam.title}
            </DialogTitle>
            <div className={`flex items-center gap-2 font-mono text-lg ${getTimeColor()}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Question */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {currentQuestion.difficulty_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
              
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.answers.map((answer, index) => (
                  <div key={answer.id} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={answer.id} id={`answer-${answer.id}`} />
                    <Label 
                      htmlFor={`answer-${answer.id}`} 
                      className="flex-1 cursor-pointer"
                    >
                      {String.fromCharCode(65 + index)}. {answer.answer}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium ${
                    index === currentQuestionIndex
                      ? 'bg-orange-500 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="bg-gradient-to-r from-orange-500 to-purple-600"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamModal;
