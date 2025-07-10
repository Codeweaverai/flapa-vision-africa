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

      // Try to save attempt to database if possible
      try {
        console.log('Quiz attempt:', {
          user_id: user.id,
          quiz_id: quizId,
          lesson_id: lessonId,
          score: finalScore,
          passed: quizPassed,
          answers: Object.fromEntries(answers.map(a => [a.questionId, a.selectedOption]))
        });
        
        // Save to a generic attempts table if available
        // This is a placeholder for when quiz functionality is fully implemented
      } catch (dbError) {
        console.log('Database save failed, continuing with local results:', dbError);
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
        <DialogContent className="max
