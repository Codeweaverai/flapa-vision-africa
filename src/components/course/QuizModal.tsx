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
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  order_index: number;
  explanation?: string;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  question_count?: number;
  questions?: QuizQuestion[];
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
  onComplete?: (quiz: Quiz, score: number, passed: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ 
  isOpen, 
  onClose, 
  quizId, 
  lessonId, 
  onComplete 
}) => {
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    } else {
      resetQuizState();
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

  const resetQuizState = () => {
    setQuiz(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeLeft(0);
    setIsSubmitting(false);
    setShowResults(false);
    setScore(0);
    setPassed(false);
    setLoading(true);
    setError(null);
  };

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching quiz:', quizId);
      
      // First, fetch the quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) {
        console.error('Error fetching quiz details:', quizError);
        throw new Error('Failed to load quiz details');
      }

      console.log('Quiz details:', quizData);

      // Then fetch questions with their answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          answers:quiz_answers(*)
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) {
        console.error('Error fetching quiz questions:', questionsError);
        throw new Error('Failed to load quiz questions');
      }

      console.log('Questions data:', questionsData);

      // Check if we have questions
      if (!questionsData || questionsData.length === 0) {
        setError('This quiz has no questions yet.');
        setQuiz(quizData);
        return;
      }

      // Transform questions to match the expected format
      const transformedQuestions = questionsData.map((q: any) => ({
        id: q.id,
        quiz_id: q.quiz_id,
        question: q.question,
        order_index: q.order_index,
        explanation: q.explanation || '',
        answers: q.answers || []
      }));

      const fullQuiz: Quiz = {
        ...quizData,
        questions: transformedQuestions,
        question_count: transformedQuestions.length
      };

      console.log('Full quiz loaded:', fullQuiz);
      setQuiz(fullQuiz);
      setTimeLeft(15 * 60); // 15 minutes default for now
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResults(false);
      
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      setError(error.message || 'Failed to load quiz');
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
    if (!user || !quiz || !quiz.questions) return;

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const questionResults: any[] = [];
      
      quiz.questions.forEach(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        const correctAnswerIndex = question.answers.findIndex(a => a.is_correct);
        const isCorrect = userAnswer?.selectedOption === correctAnswerIndex;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        questionResults.push({
          question_id: question.id,
          selected_option: userAnswer?.selectedOption,
          correct_option: correctAnswerIndex,
          is_correct: isCorrect
        });
      });

      const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
      const quizPassed = finalScore >= quiz.passing_score;

      console.log('Quiz results:', {
        score: finalScore,
        passed: quizPassed,
        correct: correctAnswers,
        total: quiz.questions.length,
        questionResults
      });

      // Get enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', (window as any).currentCourseId || '') // You might need to pass courseId
        .maybeSingle();

      if (enrollment) {
        // Save quiz attempt
        const { data: attempt, error: attemptError } = await supabase
          .from('quiz_attempts')
          .insert({
            quiz_id: quizId,
            user_id: user.id,
            enrollment_id: enrollment.id,
            score: finalScore,
            passed: quizPassed,
            attempt_number: 1, // You might want to calculate this
            answers: questionResults,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (attemptError) {
          console.error('Error saving quiz attempt:', attemptError);
          // Continue anyway - don't fail the whole quiz submission
        } else {
          console.log('Quiz attempt saved:', attempt);
        }
      } else {
        console.log('No enrollment found, skipping database save');
      }

      setScore(finalScore);
      setPassed(quizPassed);
      setShowResults(true);

      // Call completion callback
      if (onComplete) {
        onComplete(quiz, finalScore, quizPassed);
      }

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

  const handleRetakeQuiz = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeLeft(15 * 60);
    setScore(0);
    setPassed(false);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Quiz...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col justify-center items-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <p className="text-gray-600">Loading quiz questions...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Error</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Quiz Not Available</h3>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={onClose}>Close</Button>
            </div>
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
          <div className="space-y-6">
            <div className="text-center">
              {passed ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-bold mb-2">
                {passed ? 'Congratulations!' : 'Not quite there yet'}
              </h3>
              <p className="text-lg mb-4">
                Your score: {score}% (Need {quiz.passing_score}% to pass)
              </p>
              
              {quiz.questions && (
                <div className="mt-6 text-left">
                  <h4 className="font-semibold mb-2">Question Review:</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {quiz.questions.map((question, index) => {
                      const userAnswer = answers.find(a => a.questionId === question.id);
                      const correctAnswerIndex = question.answers.findIndex(a => a.is_correct);
                      const isCorrect = userAnswer?.selectedOption === correctAnswerIndex;
                      
                      return (
                        <div key={question.id} className="p-3 border rounded-lg">
                          <p className="font-medium">Q{index + 1}: {question.question}</p>
                          <div className="mt-2 text-sm">
                            <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              Your answer: {userAnswer !== undefined 
                                ? question.answers[userAnswer.selectedOption]?.answer 
                                : 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-600">
                                Correct answer: {question.answers[correctAnswerIndex]?.answer}
                              </p>
                            )}
                            {question.explanation && (
                              <p className="text-gray-500 mt-1 italic">
                                Explanation: {question.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
              {!passed && (
                <Button onClick={handleRetakeQuiz}>
                  Retake Quiz
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz Unavailable</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Questions Available</h3>
              <p className="text-gray-600 mb-4">
                This quiz doesn't have any questions yet. Please check back later.
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{quiz.title}</DialogTitle>
          {quiz.description && (
            <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress and Timer */}
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>Progress: {Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            <div className="ml-6 flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question */}
          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
              {currentQuestion.explanation && (
                <p className="text-sm text-gray-500 mb-4 italic">{currentQuestion.explanation}</p>
              )}
              <div className="space-y-3">
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = currentAnswer?.selectedOption === index;
                  return (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-sm'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-gray-800">{answer.answer}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6"
            >
              Previous
            </Button>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || answers.length !== quiz.questions.length}
                className="bg-orange-600 hover:bg-orange-700 px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={!currentAnswer}
                className="px-8"
              >
                Next Question
              </Button>
            )}
          </div>

          {/* Question Indicators */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Questions:</p>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((_, index) => {
                const isAnswered = answers.some(a => a.questionId === quiz.questions![index].id);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-orange-500 text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
