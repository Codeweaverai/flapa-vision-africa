
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
  options: string[];
  correct_answer: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  questions: Question[];
}

interface Answer {
  questionId: string;
  selectedOption: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  lessonId: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, quizId, lessonId }) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    }
  }, [isOpen, quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quiz && !showResults) {
      handleSubmitQuiz();
    }
  }, [timeLeft, showResults, quiz]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      // Since we don't have lesson_quizzes table, we'll create a mock quiz
      const mockQuiz: Quiz = {
        id: quizId,
        title: "Lesson Quiz",
        description: "Test your understanding of this lesson",
        passing_score: 70,
        questions: [
          {
            id: "q1",
            question: "This is a sample question for the lesson quiz.",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct_answer: 0
          }
        ]
      };

      setQuiz(mockQuiz);
      setTimeLeft(15 * 60); // 15 minutes default
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResults(false);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, selectedOption: number) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => 
          a.questionId === questionId 
            ? { ...a, selectedOption }
            : a
        );
      }
      return [...prev, { questionId, selectedOption }];
    });
  };

  const handleSubmitQuiz = async () => {
    if (!user || !quiz) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      quiz.questions.forEach(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        if (userAnswer && userAnswer.selectedOption === question.correct_answer) {
          correctAnswers++;
        }
      });

      const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
      const quizPassed = finalScore >= quiz.passing_score;

      // Save attempt to database (placeholder - would use actual quiz_attempts table)
      console.log('Quiz attempt:', {
        user_id: user.id,
        quiz_id: quizId,
        lesson_id: lessonId,
        score: finalScore,
        passed: quizPassed,
        answers: Object.fromEntries(answers.map(a => [a.questionId, a.selectedOption]))
      });

      setScore(finalScore);
      setPassed(quizPassed);
      setShowResults(true);

      if (quizPassed) {
        toast.success(`Congratulations! You passed with ${finalScore}%`);
      } else {
        toast.error(`You scored ${finalScore}%. You need ${quiz.passing_score}% to pass.`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
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

  if (!quiz) return null;

  if (showResults) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Results</DialogTitle>
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
              Passing Score: {quiz.passing_score}%
            </p>
            <Button onClick={onClose} className="bg-gradient-to-r from-orange-500 to-purple-600">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{quiz.title}</span>
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
              <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
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
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        answers.find(a => a.questionId === currentQuestion.id)?.selectedOption === index
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
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
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                  className="bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || answers.length !== quiz.questions.length}
                  className="bg-gradient-to-r from-green-500 to-blue-600"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
