import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, Award } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  answers: Array<{
    id: string;
    answer: string;
    is_correct: boolean;
    order_index: number;
  }>;
}

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
}

interface Answer {
  questionId: string;
  selectedAnswerId: string;
}

interface FinalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: FinalExam;
  enrollmentId: string;
  onComplete: (result: any) => void;
}

const FinalExamModal: React.FC<FinalExamModalProps> = ({ 
  isOpen, 
  onClose, 
  exam, 
  enrollmentId,
  onComplete
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && exam) {
      fetchExamQuestions();
      setTimeLeft(exam.time_limit_minutes * 60);
    }
  }, [isOpen, exam]);

  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam && isOpen) {
      handleSubmitExam();
    }
  }, [timeLeft, isOpen, exam]);

  const fetchExamQuestions = async () => {
    setLoading(true);
    try {
      // Fetch questions with their answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('final_exam_questions')
        .select(`
          id,
          question,
          order_index,
          final_exam_answers (
            id,
            answer,
            is_correct,
            order_index
          )
        `)
        .eq('exam_id', exam.id)
        .order('order_index');

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        toast.error('No questions found for this exam');
        onClose();
        return;
      }

      // Transform data and shuffle questions for retakes
      const transformedQuestions: Question[] = questionsData.map(q => ({
        id: q.id,
        question: q.question,
        answers: q.final_exam_answers
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((a: any) => ({
            id: a.id,
            answer: a.answer,
            is_correct: a.is_correct,
            order_index: a.order_index
          }))
      }));

      // Shuffle questions for retakes (check if user has previous attempts)
      const { data: attemptData } = await supabase
        .from('final_exam_attempts')
        .select('attempt_number')
        .eq('user_id', user?.id)
        .eq('exam_id', exam.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      let finalQuestions = transformedQuestions;
      if (attemptData && attemptData.length > 0) {
        // Shuffle questions for retakes
        finalQuestions = [...transformedQuestions].sort(() => Math.random() - 0.5);
      }

      setQuestions(finalQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      toast.error('Failed to load exam questions');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!user || !exam || !enrollmentId) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        if (userAnswer) {
          const correctAnswer = question.answers.find(a => a.is_correct);
          if (correctAnswer && userAnswer.selectedAnswerId === correctAnswer.id) {
            correctAnswers++;
          }
        }
      });

      const finalScore = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
      const examPassed = finalScore >= exam.passing_score;

      console.log('Calculated score:', finalScore, 'Questions:', questions.length, 'Correct:', correctAnswers);

      // Get current attempt number
      const { data: existingAttempts, error: attemptError } = await supabase
        .from('final_exam_attempts')
        .select('attempt_number')
        .eq('user_id', user.id)
        .eq('exam_id', exam.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (attemptError && attemptError.code !== 'PGRST116') {
        console.error('Error fetching existing attempts:', attemptError);
      }

      const nextAttemptNumber = existingAttempts && existingAttempts.length > 0 
        ? existingAttempts[0].attempt_number + 1 
        : 1;

      // Create exam attempt record
      const attemptData = {
        user_id: user.id,
        exam_id: exam.id,
        enrollment_id: enrollmentId,
        score: finalScore,
        passed: examPassed,
        attempt_number: nextAttemptNumber,
        answers: Object.fromEntries(answers.map(a => [a.questionId, a.selectedAnswerId])),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const { error: attemptInsertError } = await supabase
        .from('final_exam_attempts')
        .insert(attemptData);

      if (attemptInsertError) {
        console.error('Error saving exam attempt:', attemptInsertError);
        throw attemptInsertError;
      }

      // Prepare exam result data
      const examResultData = {
        user_id: user.id,
        exam_id: exam.id,
        course_id: exam.course_id,
        enrollment_id: enrollmentId,
        score: finalScore,
        percentage_score: finalScore,
        passed: examPassed,
        attempt_number: nextAttemptNumber,
        completed_at: new Date().toISOString(),
        quiz_scores: [],
        final_grade: finalScore
      };

      console.log('Submitting exam result:', examResultData);

      // Use upsert with proper conflict resolution
      const { error: resultError } = await supabase
        .from('final_exam_results')
        .upsert(examResultData, {
          onConflict: 'user_id,exam_id,attempt_number'
        });

      if (resultError) {
        console.error('Error saving exam result:', resultError);
        throw resultError;
      }

      if (examPassed) {
        toast.success(`Congratulations! You passed the final exam with ${finalScore}%`);
        
        // Generate certificate if exam is passed
        try {
          const { error: certError } = await supabase
            .from('certificates')
            .upsert({
              user_id: user.id,
              enrollment_id: enrollmentId,
              course_id: exam.course_id,
              issue_date: new Date().toISOString(),
              verification_code: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }, {
              onConflict: 'enrollment_id'
            });

          if (certError) {
            console.error('Error generating certificate:', certError);
          } else {
            toast.success('Certificate generated successfully!');
          }
        } catch (certError) {
          console.error('Certificate generation failed:', certError);
        }
      } else {
        toast.error(`You scored ${finalScore}%. You need ${exam.passing_score}% to pass.`);
      }

      // Call onComplete with result data
      const resultForCallback = {
        id: `${user.id}-${exam.id}-${nextAttemptNumber}`,
        passed: examPassed,
        score: finalScore,
        final_grade: finalScore,
        quiz_scores: [],
        attempt_number: nextAttemptNumber
      };

      if (onComplete && typeof onComplete === 'function') {
        onComplete(resultForCallback);
      }

    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerSelect = (questionId: string, selectedAnswerId: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedAnswerId }
            : a
        );
      }
      return [...prev, { questionId, selectedAnswerId }];
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.selectedAnswerId;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Exam</DialogTitle>
            <DialogDescription>Please wait while we prepare your exam.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-500" />
              <span>{exam.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-orange-600">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Complete this {exam.time_limit_minutes}-minute exam to test your knowledge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
          </div>

          {/* Question */}
          {currentQuestion && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                <div className="space-y-3">
                  {currentQuestion.answers.map((answer, index) => (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        getCurrentAnswer(currentQuestion.id) === answer.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {answer.answer}
                      </div>
                    </button>
                  ))}
                </div>
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
                  className="bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting || answers.length !== questions.length}
                  className="bg-gradient-to-r from-green-500 to-blue-600"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamModal;
