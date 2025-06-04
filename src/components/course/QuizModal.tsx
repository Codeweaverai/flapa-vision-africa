
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  order_index: number;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onComplete: (score: number, passed: boolean) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, quiz, onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes default
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (isOpen && quiz.id) {
      loadQuizQuestions();
    }
  }, [isOpen, quiz.id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && timeRemaining > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeRemaining, showResults]);

  const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      const { data: questionsData, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_answers (*)
        `)
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const processedQuestions = questionsData?.map(question => ({
        ...question,
        answers: question.quiz_answers
          ?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      })) || [];

      setQuestions(processedQuestions);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      toast.error('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach(question => {
      const userAnswerId = userAnswers[question.id];
      const correctAnswer = question.answers.find(answer => answer.is_correct);
      
      if (userAnswerId === correctAnswer?.id) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = finalScore >= quiz.passing_score;

    setScore(finalScore);
    setShowResults(true);
    setQuizStarted(false);
    
    onComplete(finalScore, passed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const answeredQuestions = Object.keys(userAnswers).length;
    return (answeredQuestions / questions.length) * 100;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(userAnswers).length === questions.length;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-orange-500" />
            {quiz.title}
          </DialogTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </DialogHeader>

        {!quizStarted && !showResults ? (
          // Quiz Introduction Screen
          <div className="space-y-6 p-6">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">Ready to take the quiz?</h3>
              <p className="text-muted-foreground mb-6">
                Test your knowledge and progress in the course
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                    <div className="text-sm text-blue-600">Questions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{quiz.passing_score}%</div>
                    <div className="text-sm text-green-600">Passing Score</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">30</div>
                    <div className="text-sm text-orange-600">Minutes</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Instructions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Read each question carefully before selecting your answer</li>
                    <li>You can navigate between questions using the Previous/Next buttons</li>
                    <li>You must answer all questions before submitting</li>
                    <li>You need {quiz.passing_score}% or higher to pass</li>
                    <li>If you don't pass, you can retake the quiz after reviewing the material</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={handleStartQuiz}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3"
                size="lg"
              >
                <Award className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            </div>
          </div>
        ) : showResults ? (
          // Results Screen
          <div className="space-y-6 p-6">
            <div className="text-center">
              {score >= quiz.passing_score ? (
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              )}
              
              <h3 className="text-2xl font-bold mb-2">
                {score >= quiz.passing_score ? 'Congratulations!' : 'Keep Learning!'}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {score >= quiz.passing_score 
                  ? 'You have successfully passed the quiz!' 
                  : 'You need to review the material and try again.'}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{score}%</div>
                    <div className="text-sm text-blue-600">Your Score</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{quiz.passing_score}%</div>
                    <div className="text-sm text-green-600">Required</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round((Object.keys(userAnswers).length / questions.length) * 100)}%
                    </div>
                    <div className="text-sm text-purple-600">Completion</div>
                  </div>
                </div>

                {score < quiz.passing_score && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Study Recommendations</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Review the lesson materials and try the quiz again. You need {quiz.passing_score}% 
                          to pass and unlock the next content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {score < quiz.passing_score && (
                <Button 
                  onClick={handleStartQuiz}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Quiz Taking Screen
          <div className="space-y-6">
            {/* Header with Timer and Progress */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600' : 'text-orange-600'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="font-medium">{Math.round(getProgressPercentage())}%</div>
              </div>
            </div>

            <Progress value={getProgressPercentage()} className="h-2" />

            {/* Current Question */}
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentQuestion.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={userAnswers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.answers.map((answer) => (
                        <div key={answer.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={answer.id} id={answer.id} />
                          <Label 
                            htmlFor={answer.id} 
                            className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {answer.answer}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-orange-500 text-white'
                        : userAnswers[questions[index].id]
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </Button>
              )}
            </div>

            {/* Summary */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">
                    Answered: {Object.keys(userAnswers).length} / {questions.length}
                  </span>
                  <span className="text-sm text-blue-600">
                    {allQuestionsAnswered ? 'All questions answered!' : 'Answer all questions to submit'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizModal;
