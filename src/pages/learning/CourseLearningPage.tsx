import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ReactPlayer from 'react-player';
import { 
  Play, Clock, User, BookOpen, Award, Star, Users,
  MessageCircle, Target, CheckCircle, StickyNote,
  CheckCircle2, GraduationCap, Eye, FileText, ChevronUp, ChevronDown,
  Zap, Bookmark, Share, Download, Crown, Rocket, Trophy, Sparkles,
  Menu, X, HelpCircle, AlertCircle, RotateCcw,
  ChevronLeft, ChevronRight, FileQuestion, Video,
  Send, Edit2, Trash2, Loader2, Maximize2, Volume2, Settings,
  ThumbsUp, ThumbsDown, Flag, MoreVertical, Reply,
  Battery, Wifi, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import LessonDiscussionTab from '@/components/course/LessonDiscussionTab';
import AddToCartButton from '@/components/cart/AddToCartButton';
import LessonNotesTab from '@/components/course/LessonNotesTab';
import FinalExamModal from '@/components/course/FinalExamModal';
import QuizModal from '@/components/course/QuizModal';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import FloatingAILearningAssistant from '@/components/learning/FloatingAILearningAssistant';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import Layout from '@/components/layout/Layout';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// ==================== INTERFACES ====================

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_instructor?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  thumbnail_url?: string;
  category: string;
  price: number;
  is_free: boolean;
  creator_id: string;
  duration_minutes: number;
  difficulty_level: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  certificate_enabled: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  question_count?: number;
  is_completed?: boolean;
  user_score?: number;
  questions?: QuizQuestion[];
}

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

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  completed_at?: string;
}

interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: any;
  content_type: string;
  video_url?: string;
  materials_urls: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  is_complete?: boolean;
  duration_minutes?: number;
  has_quiz?: boolean;
  quiz_id?: string;
  quiz?: Quiz;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  lessons: CourseLesson[];
  quizzes: Quiz[];
}

interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  payment_status: string;
  completion_date?: string;
  is_completed?: boolean;
}

interface ProgressData {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  last_accessed_lesson_id?: string;
  created_at: string;
  updated_at: string;
}

interface FinalExam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  created_at: string;
  updated_at: string;
  questions?: FinalExamQuestion[];
  user_attempt?: FinalExamAttempt;
}

interface FinalExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  question_type: string;
  difficulty_level: string;
  order_index: number;
  answers: FinalExamAnswer[];
}

interface FinalExamAnswer {
  id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  order_index: number;
}

interface FinalExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  enrollment_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  completed_at?: string;
}

interface ExamResult {
  id: string;
  enrollment_id: string;
  exam_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  attempts: number;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
}

interface LessonNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

interface LessonDiscussion {
  id: string;
  user_id: string;
  lesson_id: string;
  parent_id?: string;
  content: string;
  is_instructor_reply?: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  replies?: LessonDiscussion[];
  likes_count?: number;
  is_liked?: boolean;
}

interface LessonTranscript {
  id: string;
  lesson_id: string;
  start_time: number;
  end_time: number;
  text: string;
  created_at: string;
  updated_at: string;
}

interface Certificate {
  id: string;
  enrollment_id: string;
  verification_code: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

// ==================== CUSTOM VIDEO PLAYER ====================

interface CustomVideoPlayerProps {
  videoUrl: string;
  onProgress?: (progress: { played: number, playedSeconds: number }) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  onReady?: () => void;
  thumbnail?: string;
  playing?: boolean;
  controls?: boolean;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ 
  videoUrl, 
  onProgress, 
  onError, 
  onEnd, 
  onReady,
  thumbnail,
  playing = false,
  controls = true
}) => {
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<any>(null);

  const handleReady = () => {
    console.log('Video ready to play');
    if (onReady) onReady();
  };

  const handleBuffer = () => {
    setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    
    if (!isFullscreen) {
      const playerWrapper = playerRef.current.getInternalPlayer()?.parentElement;
      if (playerWrapper && playerWrapper.requestFullscreen) {
        playerWrapper.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Buffering...</p>
          </div>
        </div>
      )}
      
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={controls}
        playsinline
        light={thumbnail}
        playbackRate={playbackRate}
        volume={volume}
        onReady={handleReady}
        onBuffer={handleBuffer}
        onBufferEnd={handleBufferEnd}
        onProgress={onProgress}
        onError={onError}
        onEnded={onEnd}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload noremoteplayback',
              preload: 'auto',
              crossOrigin: 'anonymous',
            },
            forceVideo: true,
            forceAudio: true,
            tracks: [
              {
                kind: 'subtitles',
                src: `${videoUrl}.vtt`,
                srcLang: 'en',
                label: 'English',
                default: true,
              },
            ],
          },
        }}
      />

      {/* Custom Controls Overlay */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlaybackRateChange(playbackRate === 1 ? 1.5 : 1)}
                className="text-white text-sm bg-white/10 hover:bg-white/20 rounded px-2 py-1"
              >
                {playbackRate}x
              </button>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 p-2 rounded"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== QUIZ ITEM COMPONENT ====================

interface QuizItemProps {
  quiz: Quiz;
  onStart: () => void;
  isModuleQuiz?: boolean;
}

const QuizItem: React.FC<QuizItemProps> = ({ quiz, onStart, isModuleQuiz = false }) => {
  const passed = quiz.is_completed && (quiz.user_score || 0) >= quiz.passing_score;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
        passed 
          ? "bg-green-50 border-green-200 hover:bg-green-100" 
          : quiz.is_completed 
            ? "bg-red-50 border-red-200 hover:bg-red-100"
            : "bg-blue-50 border-blue-200 hover:bg-blue-100"
      )}
      onClick={onStart}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          passed 
            ? "bg-green-100 text-green-600" 
            : quiz.is_completed 
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
        )}>
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {isModuleQuiz ? 'Module Quiz' : 'Lesson Quiz'}: {quiz.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className={cn(
              "text-xs",
              passed 
                ? "bg-green-100 text-green-700 border-green-300" 
                : quiz.is_completed 
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-blue-100 text-blue-700 border-blue-300"
            )}>
              {quiz.passing_score}% to pass
            </Badge>
            <span className="text-xs text-gray-500">
              {quiz.question_count || 0} questions
            </span>
            {quiz.is_completed && quiz.user_score && (
              <Badge className={cn(
                passed ? "bg-green-500" : "bg-red-500"
              )}>
                {quiz.user_score}%
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div>
        {quiz.is_completed ? (
          <div className="flex items-center gap-1">
            {passed ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Passed</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Failed</span>
              </>
            )}
          </div>
        ) : (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Start Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

// ==================== DISCUSSION COMPONENTS ====================

interface DiscussionThreadProps {
  discussion: LessonDiscussion;
  onReply: (parentId: string) => void;
  onLike: (discussionId: string) => void;
  onDelete?: (discussionId: string) => void;
  currentUserId?: string;
}

const DiscussionThread: React.FC<DiscussionThreadProps> = ({ 
  discussion, 
  onReply, 
  onLike,
  onDelete,
  currentUserId 
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(discussion.id);
      setReplyContent('');
      setReplying(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await onDelete(discussion.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const canDelete = currentUserId === discussion.user_id || discussion.profile?.is_instructor;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={discussion.profile?.avatar_url} />
          <AvatarFallback>
            {discussion.profile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {discussion.profile?.full_name || 'Anonymous'}
                </span>
                {discussion.profile?.is_instructor && (
                  <Badge className="bg-purple-500 text-white text-xs">Instructor</Badge>
                )}
                <span className="text-xs text-gray-500">
                  {new Date(discussion.created_at).toLocaleDateString()}
                </span>
              </div>
              {canDelete && (
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{discussion.content}</p>
            
            <div className="flex items-center gap-4 mt-3">
              <button 
                onClick={() => onLike(discussion.id)}
                className={cn(
                  "flex items-center gap-1 text-sm",
                  discussion.is_liked ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{discussion.likes_count || 0}</span>
              </button>
              
              <button 
                onClick={() => {
                  setReplying(!replying);
                  if (!replying) setShowReplies(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
              
              {discussion.replies && discussion.replies.length > 0 && (
                <button 
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {showReplies ? 'Hide' : 'Show'} {discussion.replies.length} replies
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Reply Input */}
      {replying && (
        <div className="ml-12">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReplying(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Nested Replies */}
      {showReplies && discussion.replies && discussion.replies.length > 0 && (
        <div className="ml-12 space-y-3">
          {discussion.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reply.profile?.avatar_url} />
                <AvatarFallback>
                  {reply.profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {reply.profile?.full_name || 'Anonymous'}
                      </span>
                      {reply.profile?.is_instructor && (
                        <Badge className="bg-purple-500 text-white text-xs">Instructor</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== COURSE COMPLETION CARD ====================

interface CourseCompletionCardProps {
  isCourseCompleted: boolean;
  hasCertificate: boolean;
  completedLessons: number;
  totalLessons: number;
  allQuizzesPassed: boolean;
  finalExam?: FinalExam;
  examResult?: FinalExamAttempt | null;
  onViewCertificate: () => void;
}

const CourseCompletionCard: React.FC<CourseCompletionCardProps> = ({
  isCourseCompleted,
  hasCertificate,
  completedLessons,
  totalLessons,
  allQuizzesPassed,
  finalExam,
  examResult,
  onViewCertificate
}) => {
  if (!isCourseCompleted) return null;

  const passedExam = examResult?.passed;
  const showExamInfo = finalExam && examResult;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-green-500 text-white p-3 rounded-full">
          <CheckCircle className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-green-800">Course Completed!</h3>
          <p className="text-green-600">
            {hasCertificate 
              ? 'Your certificate has been issued successfully.'
              : 'Congratulations on completing the course!'
            }
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">
            All lessons completed ({completedLessons}/{totalLessons})
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {allQuizzesPassed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          <span className="text-green-700">
            {allQuizzesPassed ? 'All quizzes passed' : 'Some quizzes pending'}
          </span>
        </div>
        
        {showExamInfo && (
          <div className="flex items-center gap-3">
            {passedExam ? (
              <Award className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-green-700">
              Final Exam: {passedExam ? 'Passed' : 'Failed'} ({examResult.score}%)
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <Award className="h-5 w-5 text-green-500" />
          <span className="text-green-700">
            {hasCertificate ? 'Certificate issued' : 'Certificate available'}
          </span>
        </div>
      </div>
      
      {hasCertificate && (
        <Button 
          onClick={onViewCertificate}
          className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Award className="h-5 w-5 mr-2" />
          View Certificate
        </Button>
      )}
    </div>
  );
};

// ==================== PULSE LOADING COMPONENT ====================

const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Your Course
              </h3>
              <p className="text-muted-foreground text-lg">
                Preparing your learning experience...
              </p>
            </div>
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

// ==================== ENHANCED COURSE MODULE LIST ====================

interface EnhancedCourseModuleListProps {
  modules: CourseModule[];
  courseId: string;
  creatorId?: string;
  onLessonSelect: (lesson: CourseLesson) => void;
  currentLessonId?: string;
  completedLessons?: string[];
  onQuizStart?: (quizId: string, lessonId: string) => void;
  onModuleQuizStart?: (quizId: string, moduleId: string) => void;
  onFinalExamStart?: (examId: string) => void;
  examResult?: ExamResult | null;
  maxExamAttempts?: number;
  onRestartCourse?: () => void;
}

const EnhancedCourseModuleList: React.FC<EnhancedCourseModuleListProps> = ({
  modules,
  courseId,
  creatorId,
  onLessonSelect,
  currentLessonId,
  completedLessons = [],
  onQuizStart,
  onModuleQuizStart,
  onFinalExamStart,
  examResult,
  maxExamAttempts = 5,
  onRestartCourse
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [quizResults, setQuizResults] = useState<{[key: string]: QuizResult}>({});

  useEffect(() => {
    if (courseId) {
      fetchFinalExam();
    }
    if (creatorId) {
      fetchCreatorProfile();
    }
  }, [courseId, creatorId]);

  useEffect(() => {
    calculateProgress();
  }, [modules, completedLessons]);

  useEffect(() => {
    if (user && courseId) {
      fetchQuizResults();
    }
  }, [user, courseId, modules]);

  const fetchFinalExam = async () => {
    try {
      const { data, error } = await supabase
        .from('final_exams')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setFinalExam(data);
    } catch (error) {
      console.error('Error fetching final exam:', error);
    }
  };

  const fetchCreatorProfile = async () => {
    if (!creatorId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, is_instructor')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      setCreatorProfile(data);
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const fetchQuizResults = async () => {
    if (!user) return;

    try {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) return;

      const { data: results, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('enrollment_id', enrollment.id);

      if (error) throw error;

      const resultsMap: {[key: string]: QuizResult} = {};
      results?.forEach(result => {
        resultsMap[result.quiz_id] = result;
      });

      setQuizResults(resultsMap);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  };

  const calculateProgress = () => {
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    if (totalLessons === 0) {
      setCourseProgress(0);
      return;
    }
    const progress = (completedLessons.length / totalLessons) * 100;
    setCourseProgress(Math.round(progress));
  };

  const getCurrentLessonPosition = () => {
    if (!currentLessonId) return null;
    
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(lesson => lesson.id === currentLessonId);
      if (lessonIndex !== -1) {
        return { moduleIndex, lessonIndex };
      }
    }
    return null;
  };

  const getNextLesson = () => {
    const position = getCurrentLessonPosition();
    if (!position) return null;
    
    const { moduleIndex, lessonIndex } = position;
    const currentModule = modules[moduleIndex];
    
    if (lessonIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[lessonIndex + 1];
    }
    
    if (moduleIndex < modules.length - 1) {
      const nextModule = modules[moduleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return nextModule.lessons[0];
      }
    }
    
    return null;
  };

  const getPreviousLesson = () => {
    const position = getCurrentLessonPosition();
    if (!position) return null;
    
    const { moduleIndex, lessonIndex } = position;
    
    if (lessonIndex > 0) {
      return modules[moduleIndex].lessons[lessonIndex - 1];
    }
    
    if (moduleIndex > 0) {
      const previousModule = modules[moduleIndex - 1];
      if (previousModule.lessons.length > 0) {
        return previousModule.lessons[previousModule.lessons.length - 1];
      }
    }
    
    return null;
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) return;

      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString()
        });

      const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const newCompletedCount = completedLessons.length + 1;
      const newProgress = Math.round((newCompletedCount / totalLessons) * 100);

      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: newProgress,
          last_lesson_completed: lessonId
        });

    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleNextLesson = async () => {
    const nextLesson = getNextLesson();
    if (!nextLesson || isNavigating) return;
    
    setIsNavigating(true);
    
    if (currentLessonId && !completedLessons.includes(currentLessonId)) {
      await markLessonComplete(currentLessonId);
    }
    
    onLessonSelect(nextLesson);
    setIsNavigating(false);
  };

  const handlePreviousLesson = () => {
    const previousLesson = getPreviousLesson();
    if (!previousLesson || isNavigating) return;
    
    onLessonSelect(previousLesson);
  };

  const isLessonCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const getQuizResult = (quizId: string) => {
    return quizResults[quizId];
  };

  const hasPassedQuiz = (quizId: string) => {
    const result = getQuizResult(quizId);
    return result?.passed || false;
  };

  const getQuizScore = (quizId: string) => {
    const result = getQuizResult(quizId);
    return result?.score || 0;
  };

  const hasPassedExam = examResult?.passed;
  const hasExceededAttempts = examResult && examResult.attempts >= maxExamAttempts;
  const showFinalExamButton = finalExam && courseProgress >= 80 && !hasPassedExam && !hasExceededAttempts;
  const showRestartCourseButton = finalExam && courseProgress >= 80 && !hasPassedExam && hasExceededAttempts;

  return (
    <div className="space-y-4 w-full">
      <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-3 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm sm:text-base font-medium text-gray-800">Course Progress</span>
          <span className="text-xs sm:text-sm font-bold text-orange-600">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-1.5 sm:h-2" />
      </div>

      {currentLessonId && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousLesson}
            disabled={!getPreviousLesson() || isNavigating}
            className="px-3 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            size="sm"
            onClick={handleNextLesson}
            disabled={!getNextLesson() || isNavigating}
            className="px-3 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <Accordion 
        type="multiple" 
        value={openModules}
        onValueChange={setOpenModules}
        className="space-y-2"
      >
        {modules.map((module) => (
          <AccordionItem 
            key={module.id} 
            value={module.id}
            className="border rounded-lg bg-gradient-to-r from-orange-50 to-purple-50"
          >
            <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 text-left">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  <span className="text-sm sm:text-base font-medium">{module.title}</span>
                  <Badge variant="outline" className="bg-white text-xs">
                    {module.lessons?.length || 0} lessons
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              {module.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {module.description}
                </p>
              )}
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="space-y-3">
                  {module.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="space-y-2">
                      <div 
                        className={cn(
                          "flex flex-col items-start justify-between p-3 border rounded-lg cursor-pointer transition-all",
                          currentLessonId === lesson.id 
                            ? 'bg-gradient-to-r from-orange-100 to-purple-100 border-orange-300 shadow-sm' 
                            : 'hover:bg-gray-50 hover:shadow-sm'
                        )}
                        onClick={() => onLessonSelect(lesson)}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {isLessonCompleted(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                            )}
                            {lesson.content_type === 'video' ? (
                              <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium truncate">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant={currentLessonId === lesson.id ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "w-full mt-2",
                            currentLessonId === lesson.id && "bg-gradient-to-r from-orange-500 to-purple-600"
                          )}
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {currentLessonId === lesson.id ? 'Watching' : 'Watch'}
                        </Button>
                      </div>

                      {/* Lesson Quizzes */}
                      {lesson.quiz && (
                        <div className="ml-4 space-y-2 border-l-2 border-orange-200 pl-3">
                          <QuizItem
                            quiz={lesson.quiz}
                            onStart={() => onQuizStart?.(lesson.quiz!.id, lesson.id)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-xs sm:text-sm text-muted-foreground">
                  No lessons available in this module
                </div>
              )}

              {/* Module-level Quizzes */}
              {module.quizzes && module.quizzes.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-gray-700">Module Quizzes</span>
                  </div>
                  <div className="space-y-2">
                    {module.quizzes.map((quiz) => (
                      <QuizItem
                        key={quiz.id}
                        quiz={quiz}
                        onStart={() => onModuleQuizStart?.(quiz.id, module.id)}
                        isModuleQuiz
                      />
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {showFinalExamButton && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-orange-800">{finalExam.title}</h4>
                {finalExam.description && (
                  <p className="text-xs sm:text-sm text-orange-600 mt-1 line-clamp-2">{finalExam.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <Badge variant="outline" className="text-xs sm:text-sm text-orange-700 border-orange-300">
                    {finalExam.passing_score}% to pass
                  </Badge>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {finalExam.time_limit_minutes} mins
                  </div>
                  {examResult && (
                    <Badge variant="outline" className="text-xs sm:text-sm text-orange-700 border-orange-300">
                      Attempt {examResult.attempts}/{maxExamAttempts}
                    </Badge>
                  )}
                </div>
                {examResult && (
                  <p className="text-xs text-orange-600 mt-1">
                    Previous score: {examResult.score}%
                  </p>
                )}
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              onClick={() => onFinalExamStart?.(finalExam.id)}
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {examResult ? 'Retake Exam' : 'Take Exam'}
            </Button>
          </div>
        </div>
      )}

      {showRestartCourseButton && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-red-800">Maximum Attempts Reached</h4>
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  You've used all {maxExamAttempts} exam attempts. Review the course materials and restart to try again.
                </p>
                {examResult && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-600">
                      Last score: {examResult.score}% (Required: {finalExam?.passing_score}%)
                    </p>
                    <p className="text-xs text-red-600">
                      Attempts: {examResult.attempts}/{maxExamAttempts}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              onClick={onRestartCourse}
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Restart Course & Review Materials
            </Button>
          </div>
        </div>
      )}

      {courseProgress === 100 && (!finalExam || hasPassedExam) && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-green-800">Course Completed!</h4>
                <p className="text-xs sm:text-sm text-green-600 mt-1">View your final results and certificate</p>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              onClick={() => navigate(`/course/${courseId}/results`)}
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              View Results
            </Button>
          </div>
        </div>
      )}

      {creatorProfile && (
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={creatorProfile.avatar_url || undefined} />
                <AvatarFallback>
                  {creatorProfile.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-orange-800">Your Instructor</h4>
                <p className="text-xs sm:text-sm font-medium text-orange-700 truncate">{creatorProfile.full_name}</p>
                {creatorProfile.bio && (
                  <p className="text-xs text-orange-600 mt-1 line-clamp-2">{creatorProfile.bio}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-100"
              onClick={() => navigate(`/creator/profile/${creatorProfile.id}`)}
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COURSE LEARNING PAGE ====================

const CourseLearningPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const courseId = params.courseId || params.id;
  
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [examResult, setExamResult] = useState<FinalExamAttempt | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showQuizResultsModal, setShowQuizResultsModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLesson, setResumeLesson] = useState<CourseLesson | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [secondaryTab, setSecondaryTab] = useState('transcripts');
  const [nextLesson, setNextLesson] = useState<CourseLesson | null>(null);
  const [showNextLessonDialog, setShowNextLessonDialog] = useState(false);
  const [currentLessonProgress, setCurrentLessonProgress] = useState(0);
  
  // Discussion & Notes State
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [transcripts, setTranscripts] = useState<LessonTranscript[]>([]);
  
  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);
  
  // Completion state guards
  const completionInProgress = useRef(false);
  const completionAttempted = useRef(false);
  
  const isEnrolled = enrollment?.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const isNotComplete = progressPercentage < 100;
  const hasLessons = modules.some(module => module.lessons.length > 0);
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
  const isCourseCompleted = enrollment?.is_completed || false;
  const hasPassedExam = examResult?.passed;
  const isFirstExamAttempt = !examResult;
  const maxExamAttempts = 5;
  const hasExceededAttempts = examResult && examResult.attempts >= maxExamAttempts;
  const hasCertificate = !!certificate;
  
  const allQuizzesPassed = modules.every(module => 
    module.lessons.every(lesson => 
      !lesson.quiz || lesson.quiz.is_completed
    ) && 
    module.quizzes.every(quiz => quiz.is_completed)
  );
  
  const showTakeExamButton = isCourseCompleted && finalExam && isFirstExamAttempt;
  const showRetakeExamButton = isCourseCompleted && finalExam && examResult && !hasPassedExam && !hasExceededAttempts;
  const showRestartCourseButton = isCourseCompleted && finalExam && examResult && !hasPassedExam && hasExceededAttempts;
  const showViewCertificateButton = isCourseCompleted && (!finalExam || hasPassedExam);

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  const setupRealtimeSubscription = (lessonId: string) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`lesson_discussions_${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_discussions',
          filter: `lesson_id=eq.${lessonId}`
        },
        async (payload) => {
          console.log('Realtime discussion change:', payload);
          await loadDiscussions(lessonId);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  };

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // ==================== COMPLETION VALIDATION ====================

  const validateCompletionConditions = async (): Promise<boolean> => {
    if (!enrollment || !courseId || isCourseCompleted) return false;

    try {
      const { data: lessonProgress, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (error) {
        console.error('Error validating completion conditions:', error);
        return false;
      }

      const actualCompletedCount = lessonProgress?.length || 0;
      const allLessonsCompleted = actualCompletedCount === totalLessons;

      console.log(`Completion validation: ${actualCompletedCount}/${totalLessons} lessons completed`);

      return allLessonsCompleted && !finalExam;
    } catch (error) {
      console.error('Error validating completion conditions:', error);
      return false;
    }
  };

  const completeCourse = async (): Promise<boolean> => {
    if (!enrollment || !user || isCourseCompleted || completionInProgress.current) {
      console.log('Course completion prevented: already completed or in progress');
      return false;
    }

    completionInProgress.current = true;
    completionAttempted.current = true;

    try {
      const { data: currentEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('completion_date, is_completed')
        .eq('id', enrollment.id)
        .single();

      if (checkError) {
        console.error('Error checking enrollment status:', checkError);
        return false;
      }
      
      if (currentEnrollment?.completion_date) {
        console.log('Course already completed');
        setEnrollment(prev => prev ? { 
          ...prev, 
          completion_date: currentEnrollment.completion_date,
          is_completed: currentEnrollment.is_completed 
        } : null);
        return true;
      }

      const isValid = await validateCompletionConditions();
      if (!isValid) {
        console.log('Course completion conditions not met');
        return false;
      }

      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .update({ 
          completion_date: new Date().toISOString(),
          is_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollment.id)
        .is('completion_date', null);

      if (enrollmentError) {
        if (enrollmentError.code === '23505') {
          console.log('Course already completed (unique constraint)');
          return true;
        }
        console.error('Error updating enrollment:', enrollmentError);
        throw enrollmentError;
      }

      const { data: updatedEnrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('id', enrollment.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated enrollment:', fetchError);
        throw fetchError;
      }
      
      setEnrollment(updatedEnrollment);

      // Check for certificate with retry logic
      let retries = 3;
      while (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkCertificate();
        if (certificate) break;
        retries--;
      }

      toast.success('Course completed! Certificate has been issued.');
      return true;
    } catch (error) {
      console.error('Error completing course:', error);
      toast.error('Failed to mark course as completed. Please try again.');
      return false;
    } finally {
      completionInProgress.current = false;
    }
  };

  // ==================== DATA LOADING FUNCTIONS ====================

  const syncCourseProgress = async () => {
    if (!user || !courseId || !enrollment || completionInProgress.current) return;

    try {
      const { data: completedData, error: completedError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (completedError) throw completedError;

      const completedLessonIds = completedData?.map(item => item.lesson_id) || [];
      const progressPercentage = Math.round((completedLessonIds.length / totalLessons) * 100);

      setCompletedLessons(completedLessonIds);
      
      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (progressError) throw progressError;

      const { data: progressData } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      setProgress(progressData);

      // Auto-complete course when conditions are met
      const shouldAutoComplete = !finalExam && 
                                completedLessonIds.length === totalLessons && 
                                totalLessons > 0 && 
                                !isCourseCompleted &&
                                !completionAttempted.current;

      if (shouldAutoComplete) {
        console.log('Attempting auto-completion...');
        await completeCourse();
      }
    } catch (error) {
      console.error('Error syncing course progress:', error);
    }
  };

  const checkCertificate = async () => {
    if (!enrollment) return;

    try {
      const { data: certificateData, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setCertificate(certificateData || null);
    } catch (error) {
      console.error('Error checking certificate:', error);
    }
  };

  const loadFinalExamAttempt = async () => {
    if (!finalExam || !user || !enrollment) return;

    try {
      const { data: attemptData, error } = await supabase
        .from('final_exam_attempts')
        .select('*')
        .eq('exam_id', finalExam.id)
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollment.id)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setExamResult(attemptData);
    } catch (error) {
      console.error('Error loading final exam attempt:', error);
    }
  };

  const loadQuizAttempts = async () => {
    if (!user || !enrollment) return;

    try {
      const { data: quizAttempts, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, passed')
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollment.id);

      if (error) throw error;

      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            quiz: lesson.quiz ? {
              ...lesson.quiz,
              is_completed: quizAttempts?.some(attempt => attempt.quiz_id === lesson.quiz?.id && attempt.passed) || false,
              user_score: quizAttempts?.find(attempt => attempt.quiz_id === lesson.quiz?.id)?.score
            } : undefined
          })),
          quizzes: module.quizzes.map(quiz => ({
            ...quiz,
            is_completed: quizAttempts?.some(attempt => attempt.quiz_id === quiz.id && attempt.passed) || false,
            user_score: quizAttempts?.find(attempt => attempt.quiz_id === quiz.id)?.score
          }))
        }))
      );
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
    }
  };

  const loadDiscussions = async (lessonId: string) => {
    try {
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('lesson_discussions')
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_instructor
          )
        `)
        .eq('lesson_id', lessonId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (discussionsError) {
        console.error('Error loading discussions:', discussionsError);
        setDiscussions([]);
        return;
      }

      if (!discussionsData || discussionsData.length === 0) {
        setDiscussions([]);
        return;
      }

      // Fetch replies for each discussion
      const discussionsWithReplies = await Promise.all(
        discussionsData.map(async (discussion) => {
          const { data: repliesData, error: repliesError } = await supabase
            .from('lesson_discussions')
            .select(`
              *,
              profile:profiles!user_id (
                id,
                full_name,
                avatar_url,
                is_instructor
              )
            `)
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true });

          let replies = [];
          if (!repliesError && repliesData) {
            replies = repliesData;
          }

          // Fetch likes count
          const { data: likesData } = await supabase
            .from('discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id);

          // Check if current user liked
          const { data: userLikeData } = await supabase
            .from('discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          return {
            ...discussion,
            replies,
            likes_count: likesData?.length || 0,
            is_liked: !!userLikeData
          };
        })
      );

      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error loading discussions:', error);
      setDiscussions([]);
    }
  };

  const loadLessonData = async (lessonId: string) => {
    if (!user) return;

    try {
      // Load notes
      const { data: notesData, error: notesError } = await supabase
        .from('lesson_notes')
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error loading notes:', notesError);
      } else {
        setNotes(notesData || []);
      }

      // Load discussions
      await loadDiscussions(lessonId);
      
      // Setup realtime subscription
      setupRealtimeSubscription(lessonId);

      // Load transcripts
      const { data: transcriptsData, error: transcriptsError } = await supabase
        .from('lesson_transcripts')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('start_time', { ascending: true });

      if (transcriptsError) {
        console.error('Error loading transcripts:', transcriptsError);
        setTranscripts([]);
      } else {
        setTranscripts(transcriptsData || []);
      }
    } catch (error) {
      console.error('Error loading lesson data:', error);
    }
  };

  const findNextLesson = (currentLesson: CourseLesson): CourseLesson | null => {
    const allLessons: CourseLesson[] = [];
    
    modules
      .sort((a, b) => a.order_index - b.order_index)
      .forEach(module => {
        const sortedLessons = module.lessons.sort((a, b) => a.order_index - b.order_index);
        allLessons.push(...sortedLessons);
      });
    
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);
    
    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    
    return null;
  };

  // ==================== EVENT HANDLERS ====================

  const handleVideoProgress = async (progress: { played: number, playedSeconds: number }) => {
    setCurrentVideoTime(progress.playedSeconds);
    
    if (!selectedLesson || !isEnrolled || !enrollment) return;

    const watchPercentage = progress.played * 100;
    setCurrentLessonProgress(watchPercentage);
    
    // Preload next lesson when progress reaches 97%
    if (watchPercentage >= 97 && !showNextLessonDialog) {
      const nextLessonToLoad = findNextLesson(selectedLesson);
      if (nextLessonToLoad) {
        setNextLesson(nextLessonToLoad);
        setShowNextLessonDialog(true);
        console.log('Preloading next lesson:', nextLessonToLoad.title);
      }
    }
    
    if (watchPercentage > 80 && !completedLessons.includes(selectedLesson.id)) {
      try {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment.id,
            lesson_id: selectedLesson.id,
            is_completed: true,
            completion_date: new Date().toISOString(),
            last_position_seconds: Math.floor(progress.playedSeconds)
          }, {
            onConflict: 'enrollment_id,lesson_id'
          });

        if (error) throw error;
        await syncCourseProgress();
      } catch (error) {
        console.error('Error updating lesson progress:', error);
      }
    }
  };

  const handleVideoEnd = async () => {
    console.log('Video ended, proceeding to next content');
    
    if (!selectedLesson || !enrollment) return;

    // Mark lesson as completed
    if (!completedLessons.includes(selectedLesson.id)) {
      try {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            enrollment_id: enrollment.id,
            lesson_id: selectedLesson.id,
            is_completed: true,
            completion_date: new Date().toISOString(),
            last_position_seconds: 0
          }, {
            onConflict: 'enrollment_id,lesson_id'
          });

        if (error) throw error;
        await syncCourseProgress();
      } catch (error) {
        console.error('Error updating lesson progress:', error);
      }
    }

    // Check for quiz
    if (selectedLesson.quiz) {
      console.log('Loading quiz for lesson:', selectedLesson.title);
      setCurrentQuiz(selectedLesson.quiz);
      setCurrentQuizId(selectedLesson.quiz.id);
      setShowQuizModal(true);
      return;
    }

    // Proceed to next lesson
    const nextLessonToLoad = findNextLesson(selectedLesson);
    if (nextLessonToLoad) {
      console.log('Auto-proceeding to next lesson:', nextLessonToLoad.title);
      await handleLessonSelect(nextLessonToLoad);
    }
  };

  const handleQuizComplete = async (quiz: Quiz, score: number, passed: boolean) => {
    console.log(`Quiz completed: ${passed ? 'Passed' : 'Failed'} with score ${score}%`);
    
    // Reload quiz attempts to update completion status
    await loadQuizAttempts();
    
    // Proceed to next lesson after quiz completion
    const nextLessonToLoad = findNextLesson(selectedLesson!);
    if (nextLessonToLoad) {
      console.log('Proceeding to next lesson after quiz:', nextLessonToLoad.title);
      await handleLessonSelect(nextLessonToLoad);
    }
  };

  const handleLessonSelect = async (lesson: CourseLesson) => {
    if (!lesson?.title?.trim()) return;
    
    setSelectedLesson(lesson);
    setCurrentLessonId(lesson.id);
    setShowNextLessonDialog(false);
    setNextLesson(null);
    setCurrentLessonProgress(0);
    
    // Load lesson-specific data
    await loadLessonData(lesson.id);
    
    if (isEnrolled && user) {
      supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_accessed_lesson_id: lesson.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        })
        .then(({ error }) => {
          if (error) console.error('Error updating last accessed:', error);
        });
    }
    
    setIsMobileSidebarOpen(false);
  };

  const handleQuizStart = (quizId: string, lessonId: string) => {
    setCurrentQuizId(quizId);
    setCurrentLessonId(lessonId);
    
    // Find the quiz in modules
    const quiz = modules.flatMap(m => [...m.lessons.map(l => l.quiz), ...m.quizzes])
      .find(q => q?.id === quizId);
    
    if (quiz) {
      setCurrentQuiz(quiz);
      setShowQuizModal(true);
    }
  };

  const handleModuleQuizStart = (quizId: string, moduleId: string) => {
    setCurrentQuizId(quizId);
    
    const module = modules.find(m => m.id === moduleId);
    const quiz = module?.quizzes.find(q => q.id === quizId);
    
    if (quiz) {
      setCurrentQuiz(quiz);
      setShowQuizModal(true);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedLesson || !user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          content: newNote.trim()
        })
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note. Please try again.');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .update({ 
          content: editNoteContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => note.id === noteId ? data : note));
      setEditingNote(null);
      setEditNoteContent('');
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note. Please try again.');
    }
  };

  const handleAddDiscussion = async () => {
    if (!newDiscussion.trim() || !selectedLesson || !user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          content: newDiscussion.trim(),
          is_instructor_reply: false
        })
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_instructor
          )
        `)
        .single();

      if (error) throw error;

      setNewDiscussion('');
      toast.success('Discussion added successfully');
      
      // Realtime subscription will update the list
    } catch (error) {
      console.error('Error adding discussion:', error);
      toast.error('Failed to add discussion. Please try again.');
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !selectedLesson || !user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          parent_id: parentId,
          content: replyContent.trim(),
          is_instructor_reply: false
        })
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_instructor
          )
        `)
        .single();

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply. Please try again.');
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    if (!user) return;

    try {
      const { data: existingLike, error: checkError } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('discussion_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('discussion_likes')
          .insert({
            user_id: user.id,
            discussion_id: discussionId
          });

        if (error) throw error;
      }

      // Update local state
      setDiscussions(prev => prev.map(discussion => {
        if (discussion.id === discussionId) {
          const newLikesCount = existingLike 
            ? (discussion.likes_count || 1) - 1 
            : (discussion.likes_count || 0) + 1;
          
          return {
            ...discussion,
            likes_count: newLikesCount,
            is_liked: !existingLike
          };
        }
        return discussion;
      }));
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .delete()
        .eq('id', discussionId);

      if (error) throw error;

      setDiscussions(prev => prev.filter(d => d.id !== discussionId));
      toast.success('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion. Please try again.');
    }
  };

  const handleProceedToNextLesson = async () => {
    if (nextLesson) {
      await handleLessonSelect(nextLesson);
      setShowNextLessonDialog(false);
      setNextLesson(null);
      setCurrentLessonProgress(0);
    }
  };

  const handleResumeLearning = () => {
    if (resumeLesson) {
      setSelectedLesson(resumeLesson);
      setCurrentLessonId(resumeLesson.id);
      setShowResumeModal(false);
    }
  };

  const handleStartFromBeginning = () => {
    const firstLesson = modules[0]?.lessons?.[0];
    if (firstLesson) {
      setSelectedLesson(firstLesson);
      setCurrentLessonId(firstLesson.id);
      setShowResumeModal(false);
    }
  };

  const markAllLessonsComplete = async () => {
    if (!user || !courseId || !modules.length || !enrollment) {
      toast.error('Unable to mark lessons complete');
      return;
    }

    setMarkingComplete(true);
    try {
      const allLessonIds = modules.flatMap(module => 
        module.lessons.map(lesson => lesson.id)
      );

      const { error } = await supabase
        .from('lesson_progress')
        .upsert(
          allLessonIds.map(lessonId => ({
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            is_completed: true,
            completion_date: new Date().toISOString()
          })), {
            onConflict: 'enrollment_id,lesson_id'
          }
        );

      if (error) throw error;
      await syncCourseProgress();
      toast.success('All lessons marked as complete!');
    } catch (error) {
      console.error('Error marking lessons complete:', error);
      toast.error('Failed to mark lessons complete');
    } finally {
      setMarkingComplete(false);
    }
  };

  const resetCourseProgress = async () => {
    if (!user || !courseId || !enrollment) return;

    try {
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('enrollment_id', enrollment.id);

      if (progressError) throw progressError;

      const { error: courseProgressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (courseProgressError) throw courseProgressError;

      if (examResult) {
        const { error: examError } = await supabase
          .from('exam_results')
          .delete()
          .eq('id', examResult.id);

        if (examError) throw examError;
      }

      setCompletedLessons([]);
      setExamResult(null);
      await syncCourseProgress();
      
      toast.success('Course progress reset successfully. Please review all materials before retaking the exam.');
    } catch (error) {
      console.error('Error resetting course progress:', error);
      toast.error('Failed to reset course progress');
    }
  };

  const handleTakeExam = () => {
    setShowExamModal(true);
  };

  const handleExamComplete = async (result: any) => {
    setShowExamModal(false);
    await loadFinalExamAttempt();
  };

  const handleRetakeQuiz = () => {
    setShowQuizResultsModal(false);
    setShowQuizModal(true);
  };

  const navigateToCourseResults = () => {
    navigate(`/course/${courseId}/results`);
  };

  // ==================== USE EFFECTS ====================

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || dataLoaded) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (courseError) throw courseError;
        if (!courseData) {
          setCourse(null);
          setLoading(false);
          return;
        }

        setCourse(courseData);

        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        const modulesWithLessons = await Promise.all(
          (modulesData as CourseModule[]).map(async (module) => {
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index', { ascending: true });

            if (lessonsError) return { ...module, lessons: [], quizzes: [] };
            
            const lessonsWithQuizInfo = await Promise.all(
              (lessonsData as CourseLesson[]).map(async (lesson) => {
                const { data: quizData } = await supabase
                  .from('quizzes')
                  .select(`
                    *,
                    questions:quiz_questions(
                      *,
                      answers:quiz_answers(*)
                    )
                  `)
                  .eq('lesson_id', lesson.id)
                  .maybeSingle();

                return {
                  ...lesson,
                  quiz: quizData || undefined
                };
              })
            );

            // Fetch module-level quizzes
            const { data: moduleQuizzes, error: moduleQuizzesError } = await supabase
              .from('quizzes')
              .select(`
                *,
                questions:quiz_questions(
                  *,
                  answers:quiz_answers(*)
                )
              `)
              .eq('module_id', module.id)
              .is('lesson_id', null);

            if (moduleQuizzesError) {
              console.error('Error fetching module quizzes:', moduleQuizzesError);
            }

            return { 
              ...module, 
              lessons: lessonsWithQuizInfo || [],
              quizzes: moduleQuizzes || []
            };
          })
        );
        
        setModules(modulesWithLessons);

        const [examData, instructorData] = await Promise.all([
          supabase
            .from('final_exams')
            .select('*')
            .eq('course_id', courseId)
            .maybeSingle(),
          courseData.creator_id ? 
            supabase
              .from('profiles')
              .select('*')
              .eq('id', courseData.creator_id)
              .maybeSingle() : 
            Promise.resolve({ data: null, error: null })
        ]);

        if (examData.data) setFinalExam(examData.data);

        if (user?.id) {
          const [enrollmentData, progressData] = await Promise.all([
            supabase
              .from('course_enrollments')
              .select('*')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .maybeSingle(),
            supabase
              .from('course_progress')
              .select('*')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .maybeSingle()
          ]);

          setEnrollment(enrollmentData.data);
          setProgress(progressData.data);

          if (enrollmentData.data) {
            const { data: completedData } = await supabase
              .from('lesson_progress')
              .select('lesson_id')
              .eq('enrollment_id', enrollmentData.data.id)
              .eq('is_completed', true);
            setCompletedLessons(completedData?.map(item => item.lesson_id) || []);
          }
        }

        setDataLoaded(true);
      } catch (error) {
        toast.error('Failed to load course data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user, dataLoaded]);

  useEffect(() => {
    if (finalExam && enrollment) {
      loadFinalExamAttempt();
    }
  }, [finalExam, enrollment]);

  useEffect(() => {
    if (enrollment && modules.length > 0) {
      loadQuizAttempts();
    }
  }, [enrollment, modules]);

  useEffect(() => {
    if (isEnrolled && modules.length > 0 && !selectedLesson && !loading) {
      const determineInitialLesson = () => {
        if (progress?.last_accessed_lesson_id) {
          const lastLesson = modules.flatMap(m => m.lessons)
            .find(l => l.id === progress.last_accessed_lesson_id);
          if (lastLesson) {
            setResumeLesson(lastLesson);
            setShowResumeModal(true);
            return lastLesson;
          }
        }

        const firstIncomplete = modules.flatMap(m => m.lessons)
          .find(l => !completedLessons.includes(l.id));
        if (firstIncomplete) return firstIncomplete;

        return modules[0]?.lessons?.[0];
      };

      const initialLesson = determineInitialLesson();
      if (initialLesson) {
        setSelectedLesson(initialLesson);
        setCurrentLessonId(initialLesson.id);
      }
    }
  }, [isEnrolled, modules, progress, completedLessons, loading]);

  // Auto-completion logic
  useEffect(() => {
    const autoCompleteIfNeeded = async () => {
      const shouldAutoComplete = !finalExam && 
                                completedLessons.length === totalLessons && 
                                totalLessons > 0 && 
                                !isCourseCompleted &&
                                !completionAttempted.current &&
                                enrollment?.payment_status === 'completed';

      if (shouldAutoComplete) {
        console.log('Auto-completion conditions met, validating...');
        const isValid = await validateCompletionConditions();
        if (isValid) {
          await completeCourse();
        }
      }
    };

    autoCompleteIfNeeded();
  }, [completedLessons.length, totalLessons, isCourseCompleted, finalExam, enrollment]);

  // ==================== RENDER ====================

  if (loading) {
    return <PulseLoading />;
  }

  if (!courseId) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid course URL</h1>
            <p className="text-gray-600 mb-4">The course ID is missing from the URL.</p>
            <Link to="/explore-courses">
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Browse Courses
              </Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <main className="flex-grow flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Link to="/explore-courses">
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Browse Courses
              </Button>
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="flex-grow bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700">{course.category}</Badge>
              <Badge variant="outline" className="text-sm border-orange-200 text-orange-600">{course.difficulty_level}</Badge>
              {course.is_free && <Badge className="bg-green-500 text-sm">Free</Badge>}
              {course.certificate_enabled && <Badge className="bg-purple-500 text-sm flex items-center gap-1"><Award className="h-3 w-3" /> Certificate</Badge>}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{course.title}</h1>
          </div>

          {/* Progress Section */}
          {isEnrolled && (
            <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Learning Progress</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {progressPercentage < 50 ? 'Keep going! You\'re doing great.' : 
                       progressPercentage < 80 ? 'You\'re making excellent progress!' :
                       'Almost there! Finish strong!'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                      {progressPercentage}%
                    </span>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                
                <Progress value={progressPercentage} className="h-3 bg-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </Progress>

                <div className="flex flex-col gap-3 mt-4">
                  {isNotComplete && hasLessons && (
                    <Button
                      onClick={markAllLessonsComplete}
                      disabled={markingComplete}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    >
                      {markingComplete ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {markingComplete ? 'Processing...' : 'Mark All Complete'}
                    </Button>
                  )}
                  
                  {showTakeExamButton && (
                    <Button
                      onClick={handleTakeExam}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white w-full sm:w-auto"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Take Final Exam
                    </Button>
                  )}

                  {showRetakeExamButton && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleTakeExam}
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white w-full sm:w-auto"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Retake Final Exam (Attempt {examResult?.attempt_number || 1}/{maxExamAttempts})
                      </Button>
                      {examResult && (
                        <p className="text-sm text-gray-600 text-center">
                          Previous score: {examResult.score}% - {examResult.passed ? 'Passed' : 'Failed'}
                        </p>
                      )}
                    </div>
                  )}

                  {showRestartCourseButton && (
                    <div className="space-y-2">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-800 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Maximum exam attempts reached</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          You've used all {maxExamAttempts} attempts. Please review the course materials and restart the course to try again.
                        </p>
                        <Button
                          onClick={resetCourseProgress}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restart Course & Review Materials
                        </Button>
                      </div>
                    </div>
                  )}

                  {showViewCertificateButton && (
                    <Button
                      onClick={navigateToCourseResults}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Completion Card */}
          <CourseCompletionCard
            isCourseCompleted={isCourseCompleted}
            hasCertificate={hasCertificate}
            completedLessons={completedLessons.length}
            totalLessons={totalLessons}
            allQuizzesPassed={allQuizzesPassed}
            finalExam={finalExam || undefined}
            examResult={examResult}
            onViewCertificate={navigateToCourseResults}
          />

          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {isMobileSidebarOpen ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Menu className="h-4 w-4 mr-2" />
              )}
              {isMobileSidebarOpen ? 'Close Curriculum' : 'Show Curriculum'}
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className={`xl:col-span-1 ${isMobileSidebarOpen ? 'block' : 'hidden'} xl:block`}>
              <Card className="sticky top-8 shadow-xl border-0 h-fit max-w-full overflow-hidden">
                <CardHeader className="p-6 border-b bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                      Course Content
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="xl:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{completedLessons.length} of {totalLessons} lessons completed</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-w-full overflow-x-hidden">
                  <EnhancedCourseModuleList 
                    modules={modules}
                    courseId={courseId}
                    creatorId={course.creator_id}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={currentLessonId}
                    completedLessons={completedLessons}
                    onQuizStart={handleQuizStart}
                    onModuleQuizStart={handleModuleQuizStart}
                    onFinalExamStart={() => setShowExamModal(true)}
                    examResult={examResult}
                    maxExamAttempts={maxExamAttempts}
                    onRestartCourse={resetCourseProgress}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3 w-full">
              <Card className="shadow-xl border-0 w-full">
                <CardContent className="p-0 w-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full h-12 bg-slate-50/50 p-1 rounded-t-lg">
                      <TabsTrigger 
                        value="content" 
                        className="w-full text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 transition-all duration-200"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Content
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="p-6 m-0 w-full">
                      {isEnrolled ? (
                        selectedLesson || modules[0]?.lessons[0] ? (
                          <div className="space-y-6 w-full">
                            {/* Lesson Header */}
                            <div className="flex items-start justify-between w-full">
                              <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                  {selectedLesson?.title || modules[0]?.lessons[0]?.title}
                                </h2>
                                {selectedLesson?.description && (
                                  <p className="text-gray-600 text-lg">
                                    {selectedLesson.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {selectedLesson && completedLessons.includes(selectedLesson.id) && (
                                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                  </Badge>
                                )}
                                {selectedLesson?.quiz && (
                                  <Badge className="bg-blue-500 text-white flex items-center gap-1">
                                    <HelpCircle className="h-3 w-3" />
                                    Quiz Available
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Video Player */}
                            {(selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url) && (
                              <div className="space-y-6 w-full">
                                <CustomVideoPlayer
                                  videoUrl={selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url || ''}
                                  thumbnail={course.thumbnail_url}
                                  onProgress={handleVideoProgress}
                                  onEnd={handleVideoEnd}
                                  onError={(error) => {
                                    console.error('Video error:', error);
                                    toast.error('There was a problem playing this video. Please try again.');
                                  }}
                                />
                                
                                {/* Video Controls */}
                                <div className="flex flex-wrap gap-3 w-full">
                                  <Button variant="outline" size="sm">
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    Bookmark
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Share className="h-4 w-4 mr-2" />
                                    Share
                                  </Button>
                                  {selectedLesson?.quiz && (
                                    <Button 
                                      onClick={() => handleQuizStart(selectedLesson.quiz!.id, selectedLesson.id)}
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-2" />
                                      Take Quiz
                                    </Button>
                                  )}
                                </div>

                                {/* Secondary Tabs */}
                                <div className="border border-gray-200 rounded-lg mt-6 w-full">
                                  <Tabs value={secondaryTab} onValueChange={setSecondaryTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-4 h-12 bg-gray-50/50 p-1">
                                      <TabsTrigger value="transcripts" className="text-sm">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Transcript
                                      </TabsTrigger>
                                      <TabsTrigger value="notes" className="text-sm">
                                        <StickyNote className="h-4 w-4 mr-2" />
                                        Notes
                                      </TabsTrigger>
                                      <TabsTrigger value="reviews" className="text-sm">
                                        <Star className="h-4 w-4 mr-2" />
                                        Reviews
                                      </TabsTrigger>
                                      <TabsTrigger value="discussion" className="text-sm">
                                        <Users className="h-4 w-4 mr-2" />
                                        Discussion
                                      </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="transcripts" className="p-4">
                                      {transcripts.length > 0 ? (
                                        <div className="space-y-3">
                                          <p className="text-sm text-gray-500 text-center">
                                            {transcripts.length} transcript segments
                                          </p>
                                          {transcripts.map((transcript) => (
                                            <div key={transcript.id} className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg">
                                              <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium bg-orange-500 text-white px-2 py-1 rounded">
                                                  {Math.floor(transcript.start_time / 60)}:{String(Math.floor(transcript.start_time % 60)).padStart(2, '0')}
                                                </span>
                                                <p className="text-sm">{transcript.text}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-8">
                                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                          <p className="text-gray-500">No transcripts available for this lesson.</p>
                                        </div>
                                      )}
                                    </TabsContent>
                                    
                                    <TabsContent value="notes" className="p-4">
                                      <div className="space-y-4">
                                        {/* Add Note */}
                                        <div className="space-y-3">
                                          <h4 className="font-medium text-gray-900">Add a Note</h4>
                                          <Textarea
                                            placeholder="Add your notes for this lesson..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            rows={3}
                                          />
                                          <div className="flex justify-end">
                                            <Button
                                              onClick={handleAddNote}
                                              disabled={!newNote.trim()}
                                              size="sm"
                                            >
                                              <Send className="h-4 w-4 mr-2" />
                                              Add Note
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Notes List */}
                                        <div className="space-y-3">
                                          <h4 className="font-medium text-gray-900">Your Notes</h4>
                                          {notes.length > 0 ? (
                                            notes.map((note) => (
                                              <div key={note.id} className="bg-white border rounded-lg p-4">
                                                {editingNote === note.id ? (
                                                  <div className="space-y-3">
                                                    <Textarea
                                                      value={editNoteContent}
                                                      onChange={(e) => setEditNoteContent(e.target.value)}
                                                      rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditingNote(null);
                                                          setEditNoteContent('');
                                                        }}
                                                      >
                                                        Cancel
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateNote(note.id)}
                                                      >
                                                        Save
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                    <div className="flex justify-between items-center mt-3">
                                                      <span className="text-xs text-gray-500">
                                                        {new Date(note.created_at).toLocaleDateString()}
                                                      </span>
                                                      <div className="flex gap-2">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => {
                                                            setEditingNote(note.id);
                                                            setEditNoteContent(note.content);
                                                          }}
                                                        >
                                                          <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => handleDeleteNote(note.id)}
                                                        >
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            ))
                                          ) : (
                                            <p className="text-gray-500 text-center py-4">No notes yet. Add your first note above!</p>
                                          )}
                                        </div>
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="reviews" className="p-4">
                                      <CourseReviewsTab courseId={courseId} />
                                    </TabsContent>
                                    
                                    <TabsContent value="discussion" className="p-4">
                                      <div className="space-y-4">
                                        {/* Add Discussion */}
                                        <div className="space-y-3">
                                          <h4 className="font-medium text-gray-900">Start a Discussion</h4>
                                          <Textarea
                                            placeholder="Ask a question or share your thoughts..."
                                            value={newDiscussion}
                                            onChange={(e) => setNewDiscussion(e.target.value)}
                                            rows={3}
                                          />
                                          <div className="flex justify-end">
                                            <Button
                                              onClick={handleAddDiscussion}
                                              disabled={!newDiscussion.trim()}
                                              size="sm"
                                            >
                                              <Send className="h-4 w-4 mr-2" />
                                              Post Discussion
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Discussions List */}
                                        <div className="space-y-6">
                                          <h4 className="font-medium text-gray-900">Discussions</h4>
                                          {discussions.length > 0 ? (
                                            discussions.map((discussion) => (
                                              <DiscussionThread
                                                key={discussion.id}
                                                discussion={discussion}
                                                onReply={(parentId) => {
                                                  setReplyingTo(parentId);
                                                }}
                                                onLike={handleLikeDiscussion}
                                                onDelete={handleDeleteDiscussion}
                                                currentUserId={user?.id}
                                              />
                                            ))
                                          ) : (
                                            <p className="text-gray-500 text-center py-4">No discussions yet. Start the conversation!</p>
                                          )}
                                        </div>

                                        {/* Reply Input */}
                                        {replyingTo && (
                                          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
                                            <div className="container mx-auto max-w-4xl">
                                              <div className="flex gap-3">
                                                <div className="flex-1">
                                                  <Textarea
                                                    placeholder="Write a reply..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    rows={2}
                                                    className="resize-none"
                                                  />
                                                  <div className="flex justify-end gap-2 mt-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyContent('');
                                                      }}
                                                    >
                                                      Cancel
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleAddReply(replyingTo)}
                                                      disabled={!replyContent.trim()}
                                                    >
                                                      <Send className="h-4 w-4 mr-1" />
                                                      Reply
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </div>
                            )}

                            {/* Lesson Content */}
                            {(selectedLesson?.content || modules[0]?.lessons[0]?.content) && (
                              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mt-6 w-full">
                                <div className="flex items-center gap-3 mb-4">
                                  <FileText className="h-6 w-6 text-orange-500" />
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Lesson Materials</h3>
                                    <p className="text-gray-600 text-sm">
                                      Supplementary resources and materials to enhance your learning experience
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="prose prose-lg max-w-none bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
                                  {typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
                                    ? (selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                    : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content)
                                  }
                                </div>
                                
                                {selectedLesson?.materials_urls && selectedLesson.materials_urls.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Downloadable Resources</h4>
                                    <div className="space-y-2">
                                      {selectedLesson.materials_urls.map((url, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                                          <Download className="h-4 w-4" />
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            Resource {index + 1}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 w-full">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 text-lg">This course doesn't have any lessons yet</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-12 w-full">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Crown className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Enroll to Access Content</h3>
                          <p className="text-gray-600 mb-6">Join thousands of students learning this course</p>
                          <Button 
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-lg px-8 py-3 shadow-lg transition-all duration-200"
                            onClick={() => navigate(`/course/${courseId}/enroll`)}
                          >
                            <Rocket className="h-5 w-5 mr-2" />
                            Enroll Now
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enrollment Card */}
          {!isEnrolled && (
            <Card className="mt-8 sticky bottom-6 shadow-2xl border-0 bg-gradient-to-r from-orange-50 to-purple-50 z-10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {course.is_free ? 'Free' : (
                        <PriceDisplay 
                          amount={course.price} 
                          originalCurrency="USD" 
                          className="text-orange-600"
                        />
                      )}
                    </div>
                    <p className="text-gray-600">Lifetime access • Certificate included</p>
                  </div>
                  {user ? (
                    <div className="flex gap-3">
                      {!course.is_free && (
                        <AddToCartButton
                          itemType="course"
                          itemId={courseId}
                          itemName={course.title}
                          price={course.price || 0}
                          size="lg"
                        />
                      )}
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-lg px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                        size="lg"
                        onClick={() => navigate(`/course/${courseId}/enroll`)}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-lg px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                      size="lg"
                      onClick={() => navigate('/auth')}
                    >
                      Sign in to Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Courses */}
          <div className="mt-12">
            <RecommendedCourses 
              currentCourseId={course.id} 
              category={course.category} 
            />
          </div>
        </div>

        {/* AI Learning Assistant */}
        <FloatingAILearningAssistant 
          courseId={courseId}
          lessonId={selectedLesson?.id || modules[0]?.lessons[0]?.id || ''}
          lessonTitle={selectedLesson?.title || modules[0]?.lessons[0]?.title || ''}
          lessonContent={typeof (selectedLesson?.content || modules[0]?.lessons[0]?.content) === 'string' 
            ? (selectedLesson?.content || modules[0]?.lessons[0]?.content || '')
            : JSON.stringify(selectedLesson?.content || modules[0]?.lessons[0]?.content || {})}
        />
      </main>

      {/* Next Lesson Dialog */}
      <Dialog open={showNextLessonDialog} onOpenChange={setShowNextLessonDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 to-purple-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Ready for Next Lesson!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-700 mb-3">
              Great progress! You've completed 97% of this lesson.
            </p>
            {nextLesson && (
              <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm mb-4">
                <p className="font-medium text-gray-900">{nextLesson.title}</p>
                <p className="text-sm text-gray-600 mt-1">Next lesson</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowNextLessonDialog(false)}
              variant="outline"
              className="flex-1"
            >
              Continue Current
            </Button>
            <Button
              onClick={handleProceedToNextLesson}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Proceed to Next Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Learning Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 to-purple-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              {isCourseCompleted ? 'Course Completed!' : 'Continue Learning?'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            {isCourseCompleted ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Congratulations! 🎉</h3>
                <p className="text-gray-600">
                  {finalExam 
                    ? "You've completed all lessons! Ready to take the final exam and earn your certificate?"
                    : "You've successfully completed this course! You can now generate your certificate."
                  }
                </p>
                {examResult && !hasPassedExam && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Previous exam score: {examResult.score}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Welcome Back!</h3>
                <p className="text-gray-600">
                  Continue from where you left off or start from the beginning.
                </p>
                {resumeLesson && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                    <p className="font-medium text-gray-900">{resumeLesson.title}</p>
                    <p className="text-sm text-gray-600 mt-1">Your last watched lesson</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isCourseCompleted ? (
              <>
                <Button
                  onClick={() => setShowResumeModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Review Course
                </Button>
                {showTakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    Take Final Exam
                  </Button>
                )}
                {showRetakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg"
                  >
                    Retake Exam
                  </Button>
                )}
                {showRestartCourseButton && (
                  <Button
                    onClick={resetCourseProgress}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Course
                  </Button>
                )}
                {showViewCertificateButton && (
                  <Button
                    onClick={navigateToCourseResults}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                  >
                    View Certificate
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleStartFromBeginning}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleResumeLearning}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Modal */}
      {finalExam && (
        <FinalExamModal
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          exam={finalExam}
          enrollmentId={enrollment?.id || ''}
          onComplete={handleExamComplete}
          previousAttempt={examResult}
          maxAttempts={maxExamAttempts}
        />
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        quizId={currentQuizId}
        lessonId={currentLessonId}
        onComplete={handleQuizComplete}
      />

      {/* Quiz Results Modal */}
      {currentQuiz && (
        <QuizResultsModal
          isOpen={showQuizResultsModal}
          onClose={() => setShowQuizResultsModal(false)}
          quiz={currentQuiz}
          score={quizScore}
          passed={quizPassed}
          onRetake={handleRetakeQuiz}
          onProceed={() => setShowQuizResultsModal(false)}
          hasNextContent={true}
        />
      )}
    </Layout>
  );
};

export default CourseLearningPage;
