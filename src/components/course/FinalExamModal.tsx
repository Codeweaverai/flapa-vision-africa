
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
  options: string[];
  correct_answer: number;
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
  selectedOption: number;
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
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && exam) {
      fetchExamQuestions();
      setTimeLeft(exam.time_limit_minutes * 60);
    }
  }, [isOpen, exam]);

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam && !showResults) {
      handleSubmitExam();
    }
  }, [timeLeft, showResults, exam]);

  const fetchExamQuestions = async () => {
    setLoading(true);
    try {
      // Since we don't have exam questions table, we'll create a mock exam
      const mockQuestions: Question[] = [
        {
          id: "eq1",
          question: "This is a sample question for the final exam.",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: 0
        }
      ];

      setQuestions(mockQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setShowResults(false);
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
      // Calculate score properly
      let correctAnswers = 0;
      questions.forEach(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        if (userAnswer && userAnswer.selectedOption === question.correct_answer) {
          correctAnswers++;
        }
      });

      // Ensure we have valid numeric score
      const finalScore = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
      const examPassed = finalScore >= exam.passing_score;

      console.log('Calculated score:', finalScore, 'Questions:', questions.length, 'Correct:', correctAnswers);

      // Validate score before submission
      if (typeof finalScore !== 'number' || isNaN(finalScore)) {
        throw new Error('Invalid score calculated');
      }

      // Get current attempt number
      const { data: existingAttempts, error: attemptError } = await supabase
        .from('final_exam_results')
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

      // Prepare exam result data with all required fields
      const examResultData = {
        user_id: user.id,
        exam_id: exam.id,
        course_id: exam.course_id,
        enrollment_id: enrollmentId,
        score: finalScore, // Ensure this is a valid number
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

      // Create exam attempt record
      const examAttemptData = {
        user_id: user.id,
        exam_id: exam.id,
        enrollment_id: enrollmentId,
        score: finalScore,
        passed: examPassed,
        attempt_number: nextAttemptNumber,
        answers: Object.fromEntries(answers.map(a => [a.questionId, a.selectedOption])),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const { error: attemptInsertError } = await supabase
        .from('final_exam_attempts')
        .upsert(examAttemptData, {
          onConflict: 'user_id,exam_id,attempt_number'
        });

      if (attemptInsertError) {
        console.error('Error saving exam attempt:', attemptInsertError);
      }

      setScore(finalScore);
      setPassed(examPassed);
      setShowResults(true);

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
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setIsSubmitting(false);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-500" />
              <span>{exam.title}</span>
            </div>
            {!showResults && (
              <div className="flex items-center gap-4">
                <div className="flex items-center text-orange-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {showResults 
              ? "Your exam results are ready" 
              : `Complete this ${exam.time_limit_minutes}-minute exam to test your knowledge`
            }
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          <div className="text-center py-6">
            {passed ? (
              <div>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-green-800">
                  Congratulations! 🎉
                </h3>
                <p className="text-lg mb-4">
                  Your Score: <span className="font-bold text-green-600">{score}%</span>
                </p>
                <p className="text-gray-600 mb-6">
                  You have successfully passed the final exam!
                </p>
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-green-800 font-medium">
                    🏆 Your certificate has been generated and is available in your course results.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-red-800">
                  Try Again
                </h3>
                <p className="text-lg mb-4">
                  Your Score: <span className="font-bold text-red-600">{score}%</span>
                </p>
                <p className="text-gray-600 mb-6">
                  Passing Score: {exam.passing_score}%
                </p>
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="text-red-800">
                    Review the course material and try again when you're ready.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setShowResults(false);
                    setCurrentQuestionIndex(0);
                    setAnswers([]);
                    setTimeLeft(exam.time_limit_minutes * 60);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 mr-4"
                >
                  Retake Exam
                </Button>
              </div>
            )}
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        ) : (
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
            {questions[currentQuestionIndex] && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{questions[currentQuestionIndex].question}</h3>
                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(questions[currentQuestionIndex].id, index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                          answers.find(a => a.questionId === questions[currentQuestionIndex].id)?.selectedOption === index
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamModal;
