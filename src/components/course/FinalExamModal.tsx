
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
import { Clock, CheckCircle, XCircle, Award, AlertCircle, Download, Calendar } from 'lucide-react';
import FinalExamResultsModal from './FinalExamResultsModal';
import CertificateDisplay from '@/components/certificate/CertificateDisplay';

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
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [courseSkills, setCourseSkills] = useState<Record<string, any>>({});

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
      console.log('Fetching questions for exam:', exam.id);

      // First, let's check if the exam exists
      const { data: examCheck, error: examError } = await supabase
        .from('final_exams')
        .select('id, title, is_published')
        .eq('id', exam.id)
        .single();

      if (examError) {
        console.error('Error checking exam:', examError);
        toast.error('Failed to verify exam');
        onClose();
        return;
      }

      if (!examCheck) {
        console.error('Exam not found:', exam.id);
        toast.error('Exam not found');
        onClose();
        return;
      }

      console.log('Exam found:', examCheck);

      // Fetch questions with their answers using the correct relation name
      const { data: questionsData, error: questionsError } = await supabase
        .from('final_exam_questions')
        .select(`
          id,
          question,
          order_index,
          final_exam_answers!question_id (
            id,
            answer,
            is_correct,
            order_index
          )
        `)
        .eq('exam_id', exam.id)
        .order('order_index');

      console.log('Questions query result:', { questionsData, questionsError });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        toast.error('Failed to load exam questions');
        onClose();
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        console.warn('No questions found for exam:', exam.id);
        toast.error('No questions found for this exam. Please contact support.');
        onClose();
        return;
      }

      // Transform data and validate that each question has answers
      const transformedQuestions: Question[] = questionsData
        .map(q => {
          const answers = q.final_exam_answers || [];
          
          if (answers.length === 0) {
            console.warn('Question has no answers:', q.id);
            return null;
          }

          return {
            id: q.id,
            question: q.question,
            answers: answers
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((a: any) => ({
                id: a.id,
                answer: a.answer,
                is_correct: a.is_correct,
                order_index: a.order_index
              }))
          };
        })
        .filter(q => q !== null) as Question[];

      if (transformedQuestions.length === 0) {
        console.error('No valid questions with answers found');
        toast.error('No valid questions found for this exam');
        onClose();
        return;
      }

      console.log('Transformed questions:', transformedQuestions);

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
        console.log('Questions shuffled for retake');
      }

      setQuestions(finalQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      
      console.log('Final questions set:', finalQuestions.length);
      toast.success(`Exam loaded with ${finalQuestions.length} questions`);
      
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      toast.error('Failed to load exam questions');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!user || !exam || !enrollmentId) {
      console.error('Missing required data for submission:', { user: !!user, exam: !!exam, enrollmentId });
      return;
    }

    console.log('Submitting exam with:', {
      questionsCount: questions.length,
      answersCount: answers.length,
      answers: answers
    });

    setIsSubmitting(true);
    try {
      // Calculate score
      let correctAnswers = 0;
      const detailedResults = questions.map(question => {
        const userAnswer = answers.find(a => a.questionId === question.id);
        const correctAnswer = question.answers.find(a => a.is_correct);
        const isCorrect = userAnswer && correctAnswer && userAnswer.selectedAnswerId === correctAnswer.id;
        
        if (isCorrect) {
          correctAnswers++;
        }

        return {
          questionId: question.id,
          question: question.question,
          userAnswerId: userAnswer?.selectedAnswerId,
          correctAnswerId: correctAnswer?.id,
          isCorrect: !!isCorrect
        };
      });

      console.log('Detailed results:', detailedResults);

      const finalScore = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
      const examPassed = finalScore >= exam.passing_score;

      console.log('Calculated score:', {
        finalScore,
        correctAnswers,
        totalQuestions: questions.length,
        passingScore: exam.passing_score,
        examPassed
      });

      if (questions.length === 0) {
        console.error('Cannot submit exam with 0 questions');
        toast.error('Cannot submit exam: No questions loaded');
        return;
      }

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

      console.log('Saving attempt:', attemptData);

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

      // Generate certificate if exam is passed
      if (examPassed) {
        try {
          // First check if certificate already exists
          const { data: existingCert } = await supabase
            .from('certificates')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .maybeSingle();

          let certificateInfo = null;

          if (!existingCert) {
            const { data: newCert, error: certError } = await supabase
              .from('certificates')
              .insert({
                user_id: user.id,
                enrollment_id: enrollmentId,
                course_id: exam.course_id,
                issue_date: new Date().toISOString(),
                verification_code: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              })
              .select()
              .single();

            if (certError) {
              console.error('Error generating certificate:', certError);
            } else {
              console.log('Certificate generated successfully!', newCert);
              certificateInfo = newCert;
            }
          } else {
            certificateInfo = existingCert;
          }

          // Fetch course skills to display on certificate
          const { data: skillsData, error: skillsError } = await supabase
            .from('course_skill_outcomes')
            .select('*')
            .eq('course_id', exam.course_id)
            .order('order_index', { ascending: true });

          if (!skillsError && skillsData) {
            const skillsByCourse: Record<string, any> = {};
            skillsByCourse[exam.course_id] = skillsData;
            setCourseSkills(skillsByCourse);

            // Prepare certificate data
            const certData = {
              id: certificateInfo.id,
              verification_code: certificateInfo.verification_code,
              issue_date: certificateInfo.issue_date,
              course_title: exam.title,
              creator_id: exam.course_id, // This will be updated when we fetch course creator
              course_id: exam.course_id
            };

            setCertificateData(certData);

            // Show certificate modal instead of or in addition to results modal
            setShowCertificateModal(true);
          }
        } catch (certError) {
          console.error('Certificate generation failed:', certError);
        }
      } else {
        // Prepare result data for the modal (for failed exams)
        const resultData = {
          passed: examPassed,
          examScore: finalScore,
          quizScores: [],
          finalGrade: finalScore,
          courseName: exam.title,
          studentName: user.email || 'Student',
          enrollmentId: enrollmentId,
          onRetake: () => {
            setShowResultsModal(false);
            setCurrentQuestionIndex(0);
            setAnswers([]);
            fetchExamQuestions();
          }
        };

        // Show results modal
        setExamResult(resultData);
        setShowResultsModal(true);
      }

      // Call onComplete callback
      onComplete({
        passed: examPassed,
        score: finalScore,
        final_grade: finalScore,
        quiz_scores: [],
        attempt_number: nextAttemptNumber,
        detailedResults
      });

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

  const handleCloseResults = () => {
    setShowResultsModal(false);
    setExamResult(null);
    onClose();
  };

  const handleCloseCertificate = () => {
    setShowCertificateModal(false);
    setCertificateData(null);
    onClose();
  };

  // Function to share certificate as a post to LinkedIn
  const shareToLinkedInPost = (certificate: any) => {
    // Get skills for this course to include in the post
    const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
    const skillNames = skills.slice(0, 5).map((skill: any) => skill.skill_name).join(', '); // Limit to first 5 skills

    // Create share URL for LinkedIn with a congratulatory message
    const certificateUrl = `https://skillpulse.cloud/verify?code=${certificate.verification_code}`;
    const shareText = `🎓 Just completed ${certificate.course_title} with SkillPulse Innovations Limited! 🌟 Achieved professional development in ${skillNames || 'various skills'} and earned my certification. So proud of this milestone! 🚀 #LearningJourney #Achievement #Certification #ProfessionalDevelopment #SkillPulse`;

    // LinkedIn doesn't allow pre-populating text in shares anymore for privacy reasons
    // We'll use the official share URL that opens the share composer with the URL pre-filled
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  // Function to add certificate to LinkedIn profile
  const addToLinkedInProfile = (certificate: any) => {
    // Get skills for this course to include in the profile
    const skills = certificate.course_id ? (courseSkills[certificate.course_id] || []) : [];
    const skillNames = skills.slice(0, 5).map((skill: any) => skill.skill_name).join(', '); // Limit to first 5 skills

    // Extract year from issue date
    const issueDate = new Date(certificate.issue_date);
    const year = issueDate.getFullYear();
    const month = issueDate.getMonth() + 1; // Month is 0-indexed

    // Create the LinkedIn add to profile URL with course details and skills
    const profileUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.course_title)}&organizationId=1337&organizationName=${encodeURIComponent('SkillPulse Innovations Limited')}&issueYear=${year}&issueMonth=${month}&certUrl=${encodeURIComponent(`https://skillpulse.cloud/verify?code=${certificate.verification_code}`)}&certId=${certificate.verification_code}`;

    window.open(profileUrl, '_blank', 'width=800,height=600');
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

  if (questions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Exam Not Available
            </DialogTitle>
            <DialogDescription>
              No questions are available for this exam. Please contact support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <Dialog open={isOpen && !showResultsModal} onOpenChange={onClose}>
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

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mt-4">
                <p>Debug: {questions.length} questions loaded, {answers.length} answers provided</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      {showResultsModal && examResult && (
        <FinalExamResultsModal
          isOpen={showResultsModal}
          onClose={handleCloseResults}
          examScore={examResult.examScore}
          quizScores={examResult.quizScores}
          finalGrade={examResult.finalGrade}
          passed={examResult.passed}
          courseName={examResult.courseName}
          studentName={examResult.studentName}
          enrollmentId={examResult.enrollmentId}
          onRetake={examResult.onRetake}
        />
      )}

      {/* Certificate Modal - Show when exam is passed and certificate is generated */}
      {showCertificateModal && certificateData && (
        <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Congratulations! You've Earned a Certificate</DialogTitle>
              <DialogDescription>
                Your achievement has been recognized. View and share your certificate below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <CertificateDisplay
                certificate={certificateData}
                courseSkills={courseSkills}
                showActions={true}
              />
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={() => shareToLinkedInPost(certificateData)}
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Share Post
                </Button>
                <Button
                  onClick={() => addToLinkedInProfile(certificateData)}
                  size="sm"
                  variant="outline"
                  className="border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:border-blue-600"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Add to Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FinalExamModal;
