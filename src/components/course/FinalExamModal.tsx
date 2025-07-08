
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  difficulty_level: string;
  order_index: number;
  answers: Array<{
    id: string;
    answer: string;
    is_correct: boolean;
    order_index: number;
  }>;
}

interface FinalExam {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes: number;
  questions: Question[];
}

interface Answer {
  questionId: string;
  selectedAnswerId: string;
}

interface FinalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: { id: string };
  enrollmentId: string;
}

const FinalExamModal: React.FC<FinalExamModalProps> = ({ isOpen, onClose, exam, enrollmentId }) => {
  const { user } = useAuth();
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && exam.id) {
      fetchExam();
    }
  }, [isOpen, exam.id]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && finalExam && !showResults) {
      handleSubmitExam();
    }
  }, [timeLeft, showResults, finalExam]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      // Fetch final exam
      const { data: examData, error: examError } = await supabase
        .from('final_exams')
        .select('*')
        .eq('id', exam.id)
        .single();

      if (examError) throw examError;

      // Fetch questions with answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('final_exam_questions')
        .select(`
          *,
          final_exam_answers (*)
        `)
        .eq('exam_id', exam.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData.map(q => ({
        ...q,
        answers: (q.final_exam_answers || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      const examWithQuestions: FinalExam = {
        ...examData,
        questions: formattedQuestions
      };

      setFinalExam(examWithQuestions);
      setTimeLeft(examData.time_limit_minutes * 60);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResults(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      toast.error('Failed to load exam');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedAnswerId: answerId }
            : a
        );
      }
      return [...prev, { questionId, selectedAnswerId: answerId }];
    });
  };

  const handleSubmitExam = async () => {
    if (!user || !finalExam) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      finalExam.questions.forEach(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        if (userAnswer) {
          const correctAnswer = question.answers.find(a => a.is_correct);
          if (correctAnswer && userAnswer.selectedAnswerId === correctAnswer.id) {
            correctAnswers++;
          }
        }
      });

      const finalScore = Math.round((correctAnswers / finalExam.questions.length) * 100);
      const examPassed = finalScore >= finalExam.passing_score;

      // Save results to database
      const { error } = await supabase
        .from('final_exam_results')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          course_id: finalExam.course_id,
          enrollment_id: enrollmentId,
          score: correctAnswers,
          percentage_score: finalScore,
          passed: examPassed,
          final_grade: finalScore
        });

      if (error) throw error;

      setScore(finalScore);
      setPassed(examPassed);
      setShowResults(true);

      if (examPassed) {
        toast.success(`Congratulations! You passed with ${finalScore}%`);
      } else {
        toast.error(`You scored ${finalScore}%. You need ${finalExam.passing_score}% to pass.`);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!finalExam) return null;

  if (showResults) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Final Exam Results</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h3 className="text-2xl font-bold mb-2">
              {passed ? 'Congratulations!' : 'Better luck next time!'}
            </h3>
            <p className="text-lg mb-4">
              Your Score: <span className="font-bold">{score}%</span>
            </p>
            <p className="text-gray-600 mb-6">
              Passing Score: {finalExam.passing_score}%
            </p>
            <Button onClick={onClose} className="bg-gradient-to-r from-orange-500 to-purple-600">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = finalExam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / finalExam.questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{finalExam.title}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-orange-600">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {finalExam.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question */}
          {currentQuestion && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                <div className="space-y-3">
                  {currentQuestion.answers.map((answer) => (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        answers.find(a => a.questionId === currentQuestion.id)?.selectedAnswerId === answer.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {answer.answer}
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
              {currentQuestionIndex < finalExam.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(finalExam.questions.length - 1, prev + 1))}
                  className="bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting || answers.length !== finalExam.questions.length}
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
