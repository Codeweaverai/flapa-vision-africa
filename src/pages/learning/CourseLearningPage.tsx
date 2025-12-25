import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import ReactPlayer from 'react-player';
import { 
  Play, Clock, User, BookOpen, Award, Star, Users,
  MessageCircle, Target, CheckCircle, StickyNote,
  CheckCircle2, GraduationCap, Eye, FileText, ChevronUp, ChevronDown,
  Zap, Bookmark, Share, Download, Crown, Rocket, Trophy, Sparkles,
  Menu, X, HelpCircle, AlertCircle, RotateCcw,
  ChevronLeft, ChevronRight, FileQuestion, Video,
  Send, Edit2, Trash2, Loader2, Maximize2, Volume2,
  ThumbsUp, Reply, Heart, MoreVertical, Calendar,
  MessageSquare, TrendingUp, Globe, Hash, Paperclip,
  Smile, Image, Code, Link as LinkIcon, AtSign,
  Filter, Search, SortAsc, Pin, Flag, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism.css';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import AddToCartButton from '@/components/cart/AddToCartButton';
import FinalExamModal from '@/components/course/FinalExamModal';
import QuizModal from '@/components/course/QuizModal';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import FloatingAILearningAssistant from '@/components/learning/FloatingAILearningAssistant';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import Layout from '@/components/layout/Layout';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { cn } from '@/lib/utils';

// ==================== INTERFACES ====================

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_creator?: boolean;
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
  lesson_id?: string;
  module_id?: string;
  created_at?: string;
  updated_at?: string;
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
  started_at: string;
  completed_at?: string;
  answers: any;
  created_at: string;
  updated_at: string;
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
  reply_count?: number;
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

// ==================== ENHANCED DISCUSSION COMPONENTS ====================

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
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(discussion.id);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await onDelete(discussion.id);
      } finally {
        setIsDeleting(false);
        setShowOptions(false);
      }
    }
  };

  const canDelete = currentUserId === discussion.user_id || discussion.profile?.is_creator;
  const isInstructor = discussion.profile?.is_creator;
  const hasReplies = discussion.replies && discussion.replies.length > 0;
  const replyCount = discussion.reply_count || (discussion.replies ? discussion.replies.length : 0);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className={`relative group p-4 rounded-2xl transition-all duration-300 hover:shadow-lg ${
        isInstructor 
          ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-l-4 border-blue-500' 
          : 'bg-gradient-to-br from-gray-50/80 to-slate-50/80 border-l-4 border-gray-300'
      }`}>
        {/* Avatar and Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <Avatar className={`h-12 w-12 ring-2 ${isInstructor ? 'ring-blue-200' : 'ring-gray-200'} shadow-sm`}>
              <AvatarImage src={discussion.profile?.avatar_url} />
              <AvatarFallback className={`${isInstructor ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                {discussion.profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isInstructor && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Crown className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${isInstructor ? 'text-blue-700' : 'text-gray-900'}`}>
                    {discussion.profile?.full_name || 'Anonymous'}
                  </span>
                  {isInstructor && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Instructor
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {getTimeAgo(discussion.created_at)}
                  {discussion.is_instructor_reply && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <MessageSquare className="h-3 w-3" />
                      Official reply
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <div className="py-1">
                      {canDelete && (
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete Comment
                        </button>
                      )}
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                        <Flag className="h-4 w-4" />
                        Report
                      </button>
                      <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                        <EyeOff className="h-4 w-4" />
                        Hide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {discussion.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onLike(discussion.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
                discussion.is_liked 
                  ? "bg-gradient-to-r from-pink-50 to-rose-50 text-pink-600 border border-pink-200" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Heart className={cn("h-4 w-4", discussion.is_liked && "fill-pink-500")} />
              <span className="text-sm font-medium">{discussion.likes_count || 0}</span>
            </button>
            
            <button 
              onClick={() => {
                setShowReplyInput(true);
                setShowReplies(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-all duration-200"
            >
              <Reply className="h-4 w-4" />
              <span className="text-sm font-medium">Reply</span>
            </button>
            
            {hasReplies && (
              <button 
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {showReplies ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
              <Share className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-4 pl-4 border-l-2 border-blue-300">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 ring-1 ring-gray-300">
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  {currentUserId?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`Reply to ${discussion.profile?.full_name || 'this comment'}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                      <Smile className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                      <Image className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                      <Code className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReplyInput(false)}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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

      {/* Nested Replies */}
      {showReplies && discussion.replies && discussion.replies.length > 0 && (
        <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
          {discussion.replies.map((reply) => (
            <div key={reply.id} className="relative">
              {/* Reply Connector Line */}
              <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300" />
              
              <div className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${
                reply.profile?.is_creator
                  ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 border-l-2 border-purple-400'
                  : 'bg-gradient-to-br from-slate-50/80 to-gray-50/80 border-l-2 border-gray-300'
              }`}>
                <div className="flex items-start gap-3">
                  <Avatar className={`h-8 w-8 ring-1 ${reply.profile?.is_creator ? 'ring-purple-200' : 'ring-gray-200'}`}>
                    <AvatarImage src={reply.profile?.avatar_url} />
                    <AvatarFallback className={`${reply.profile?.is_creator ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                      {reply.profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${reply.profile?.is_creator ? 'text-purple-700' : 'text-gray-900'}`}>
                        {reply.profile?.full_name || 'Anonymous'}
                      </span>
                      {reply.profile?.is_creator && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-1.5 py-0 rounded-full">
                          Instructor
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => onLike(reply.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          reply.is_liked ? "text-pink-600" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <Heart className={cn("h-3 w-3", reply.is_liked && "fill-pink-500")} />
                        <span>{reply.likes_count || 0}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setShowReplyInput(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== DISCUSSION FILTERS ====================

interface DiscussionFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DiscussionFilters: React.FC<DiscussionFiltersProps> = ({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange
}) => {
  const filters = [
    { id: 'all', label: 'All Comments', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'instructor', label: 'Instructor Replies', icon: <Crown className="h-4 w-4" /> },
    { id: 'popular', label: 'Most Liked', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'recent', label: 'Recent', icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              activeFilter === filter.id
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {filter.icon}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <SortAsc className="h-4 w-4" />
        <span>Sort by:</span>
        <select className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium">
          <option>Newest First</option>
          <option>Most Liked</option>
          <option>Oldest First</option>
        </select>
      </div>
    </div>
  );
};

// ==================== ENHANCED DISCUSSION SECTION ====================

interface EnhancedDiscussionSectionProps {
  discussions: LessonDiscussion[];
  onAddDiscussion: (content: string) => void;
  onReply: (parentId: string, content: string) => void;
  onLike: (discussionId: string) => void;
  onDelete: (discussionId: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
}

const EnhancedDiscussionSection: React.FC<EnhancedDiscussionSectionProps> = ({
  discussions,
  onAddDiscussion,
  onReply,
  onLike,
  onDelete,
  currentUserId,
  isLoading = false
}) => {
  const [newDiscussion, setNewDiscussion] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeValue, setCodeValue] = useState('// Enter your code here\n');
  const [language, setLanguage] = useState('javascript');

  const filteredDiscussions = discussions.filter(discussion => {
    if (activeFilter === 'instructor' && !discussion.profile?.is_creator) return false;
    if (searchQuery && !discussion.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAddDiscussion = () => {
    if (newDiscussion.trim()) {
      onAddDiscussion(newDiscussion.trim());
      setNewDiscussion('');
    }
  };

  const handleAddReply = (parentId: string) => {
    if (replyContent.trim()) {
      onReply(parentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleReplyClick = (discussionId: string) => {
    setReplyingTo(discussionId);
  };

  const stats = {
    total: discussions.length,
    instructorReplies: discussions.filter(d => d.profile?.is_creator).length,
    popular: discussions.filter(d => (d.likes_count || 0) > 5).length,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading discussions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discussion Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Instructor Replies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.instructorReplies}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Popular Discussions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.popular}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Discussion Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600">
              {currentUserId?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 mb-1">Start a Discussion</h3>
              <p className="text-sm text-gray-600">
                Ask questions, share insights, or help other learners
              </p>
            </div>
            
            <div className="relative">
              <Textarea
                placeholder="What would you like to discuss?"
                value={newDiscussion}
                onChange={(e) => setNewDiscussion(e.target.value)}
                rows={3}
                className="resize-none border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl pr-10"
              />

              {/* Emoji Picker Button */}
              <div className="absolute right-3 bottom-3">
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </button>

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div className="absolute bottom-10 left-0 z-50">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewDiscussion(prev => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={Theme.LIGHT}
                      height={350}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                  onClick={() => setShowCodeEditor(true)}
                >
                  <Code className="h-5 w-5" />
                </button>
              </div>

              <Button
                onClick={() => onAddDiscussion(newDiscussion)}
                disabled={!newDiscussion.trim()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Discussion
              </Button>
            </div>

            {/* Code Editor Modal */}
            {showCodeEditor && (
              <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Insert Code Snippet</DialogTitle>
                    <DialogDescription>
                      Add code to your discussion with syntax highlighting
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="css">CSS</option>
                        <option value="html">HTML</option>
                        <option value="sql">SQL</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code
                      </label>
                      <Editor
                        value={codeValue}
                        onValueChange={setCodeValue}
                        highlight={code => Prism.highlight(code, Prism.languages[language] || Prism.languages.javascript, language)}
                        padding={10}
                        className="border border-gray-300 rounded-lg p-2 min-h-[200px] max-h-[300px] overflow-auto text-sm"
                        style={{
                          fontFamily: '"Fira code", "Fira Mono", monospace',
                          fontSize: 12,
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCodeEditor(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      const codeBlock = `\`\`\`${language}\n${codeValue}\n\`\`\`\n`;
                      setNewDiscussion(prev => prev + codeBlock);
                      setShowCodeEditor(false);
                    }}>
                      Insert Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <DiscussionFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.length > 0 ? (
          filteredDiscussions.map((discussion) => (
            <DiscussionThread
              key={discussion.id}
              discussion={discussion}
              onReply={(parentId) => handleReplyClick(parentId)}
              onLike={onLike}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No matching discussions found' : 'No discussions yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try different search terms or clear the search'
                : 'Be the first to start a discussion! Share your thoughts or ask a question.'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start First Discussion
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Floating Reply Input */}
      {replyingTo && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">Replying to discussion</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddReply(replyingTo)}
                    disabled={!replyContent.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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
  );
};

// ==================== VIDEO PLAYER WRAPPER ====================
// Uses ReactPlayer component for direct video playback

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
        "flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer",
        passed 
          ? "bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200 hover:bg-green-100" 
          : quiz.is_completed 
            ? "bg-gradient-to-r from-red-50/80 to-orange-50/80 border-red-200 hover:bg-red-100"
            : "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200 hover:bg-blue-100"
      )}
      onClick={onStart}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "p-2 rounded-full shadow-sm flex-shrink-0",
          passed 
            ? "bg-green-100 text-green-600" 
            : quiz.is_completed 
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
        )}>
          <HelpCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {isModuleQuiz ? 'Module Quiz' : 'Lesson Quiz'}: {quiz.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <Badge variant="outline" className={cn(
              "text-xs flex-shrink-0",
              passed 
                ? "bg-green-100 text-green-700 border-green-300" 
                : quiz.is_completed 
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-blue-100 text-blue-700 border-blue-300"
            )}>
              {quiz.passing_score}% to pass
            </Badge>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {quiz.question_count || 0} questions
            </span>
            {quiz.is_completed && quiz.user_score && (
              <Badge className={cn(
                "flex-shrink-0",
                passed ? "bg-green-500" : "bg-red-500"
              )}>
                {quiz.user_score}%
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        {quiz.is_completed ? (
          <div className="flex items-center gap-1">
            {passed ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-600 font-medium flex-shrink-0">Passed</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600 font-medium flex-shrink-0">Failed</span>
              </>
            )}
          </div>
        ) : (
          <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex-shrink-0 whitespace-nowrap">
            Start Quiz
          </Button>
        )}
      </div>
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
    <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-full shadow-md">
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
          className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
        >
          <Award className="h-5 w-5 mr-2" />
          View Certificate
        </Button>
      )}
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
  const [quizAttempts, setQuizAttempts] = useState<{[key: string]: QuizAttempt}>({});

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
      fetchQuizAttempts();
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
        .select('id, full_name, avatar_url, bio, is_creator')
        .eq('id', creatorId)
        .single();

      if (error) throw error;
      setCreatorProfile(data);
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const fetchQuizAttempts = async () => {
    if (!user) return;

    try {
      // Get enrollment
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!enrollment) return;

      console.log('Loading quiz attempts for enrollment:', enrollment.id);
      
      // Get all quiz attempts for this enrollment
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, passed')
        .eq('enrollment_id', enrollment.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz attempts:', error);
        return;
      }

      console.log('Found quiz attempts:', attempts);

      // Group attempts by quiz_id to get the latest attempt
      const latestAttempts = new Map();
      attempts?.forEach(attempt => {
        if (!latestAttempts.has(attempt.quiz_id)) {
          latestAttempts.set(attempt.quiz_id, attempt);
        }
      });

      setQuizAttempts(Object.fromEntries(latestAttempts));
      
      // Update modules with quiz completion status
      const updatedModules = modules.map(module => {
        // Update lesson quizzes
        const updatedLessons = module.lessons.map(lesson => {
          if (lesson.quiz) {
            const attempt = latestAttempts.get(lesson.quiz.id);
            console.log(`Checking quiz ${lesson.quiz.id} for lesson ${lesson.title}:`, attempt);
            return {
              ...lesson,
              quiz: {
                ...lesson.quiz,
                is_completed: attempt?.passed || false,
                user_score: attempt?.score || 0
              }
            };
          }
          return lesson;
        });

        // Update module quizzes
        const updatedModuleQuizzes = module.quizzes.map(quiz => {
          const attempt = latestAttempts.get(quiz.id);
          console.log(`Checking module quiz ${quiz.id}:`, attempt);
          return {
            ...quiz,
            is_completed: attempt?.passed || false,
            user_score: attempt?.score || 0
          };
        });

        return {
          ...module,
          lessons: updatedLessons,
          quizzes: updatedModuleQuizzes
        };
      });

      // Only update if modules changed
      if (JSON.stringify(modules) !== JSON.stringify(updatedModules)) {
        // We'll let the parent component handle this update
        console.log('Quiz attempts updated modules');
      }
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
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

  const hasPassedExam = examResult?.passed;
  const hasExceededAttempts = examResult && examResult.attempts >= maxExamAttempts;
  const showFinalExamButton = finalExam && courseProgress >= 80 && !hasPassedExam && !hasExceededAttempts;
  const showRestartCourseButton = finalExam && courseProgress >= 80 && !hasPassedExam && hasExceededAttempts;

  return (
    <div className="space-y-4 w-full">
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-3 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm sm:text-base font-medium text-gray-800">Course Progress</span>
          <span className="text-xs sm:text-sm font-bold text-blue-600">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-1.5 sm:h-2 bg-blue-100" />
      </div>

      {currentLessonId && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousLesson}
            disabled={!getPreviousLesson() || isNavigating}
            className="px-3 w-full sm:w-auto border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            size="sm"
            onClick={handleNextLesson}
            disabled={!getNextLesson() || isNavigating}
            className="px-3 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
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
            className="border rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
          >
            <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-3 text-left">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="text-sm sm:text-base font-medium">{module.title}</span>
                  <Badge variant="outline" className="bg-white/80 text-xs">
                    {module.lessons?.length || 0} lessons
                  </Badge>
                  {module.quizzes?.length > 0 && (
                    <Badge variant="outline" className="bg-white/80 text-xs border-purple-200 text-purple-600">
                      {module.quizzes.length} quiz{module.quizzes.length !== 1 ? 'zes' : ''}
                    </Badge>
                  )}
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
                          "flex flex-col items-start justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
                          currentLessonId === lesson.id 
                            ? 'bg-gradient-to-r from-blue-100/80 to-indigo-100/80 border-blue-300 shadow-sm' 
                            : 'hover:bg-gray-50/80'
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
                            {lesson.quiz && (
                              <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
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
                            currentLessonId === lesson.id && "bg-gradient-to-r from-blue-500 to-indigo-600"
                          )}
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {currentLessonId === lesson.id ? 'Watching' : 'Watch'}
                        </Button>
                      </div>

                      {/* Lesson Quizzes */}
                      {lesson.quiz && (
                        <div className="ml-4 space-y-2 border-l-2 border-blue-200 pl-3">
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
                    <Award className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-sm text-gray-700">Module Quizzes</span>
                    <Badge variant="outline" className="text-xs">
                      {module.quizzes.length} quiz{module.quizzes.length !== 1 ? 'zes' : ''}
                    </Badge>
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
        <div className="bg-gradient-to-r from-orange-50/80 to-yellow-50/80 border-2 border-orange-200 rounded-xl p-3 sm:p-4">
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
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-md hover:shadow-lg"
              onClick={() => onFinalExamStart?.(finalExam.id)}
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {examResult ? 'Retake Exam' : 'Take Exam'}
            </Button>
          </div>
        </div>
      )}

      {showRestartCourseButton && (
        <div className="bg-gradient-to-r from-red-50/80 to-orange-50/80 border-2 border-red-200 rounded-xl p-3 sm:p-4">
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
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md hover:shadow-lg"
              onClick={onRestartCourse}
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Restart Course & Review Materials
            </Button>
          </div>
        </div>
      )}

      {courseProgress === 100 && (!finalExam || hasPassedExam) && (
        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-2 border-green-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-green-800">Course Completed!</h4>
                <p className="text-xs sm:text-sm text-green-600 mt-1">View your final results and certificate</p>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
              onClick={() => navigate(`/course/${courseId}/results`)}
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              View Results
            </Button>
          </div>
        </div>
      )}

      {creatorProfile && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-blue-200">
                <AvatarImage src={creatorProfile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600">
                  {creatorProfile.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-semibold text-blue-800">Your Instructor</h4>
                <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">{creatorProfile.full_name}</p>
                {creatorProfile.bio && (
                  <p className="text-xs text-blue-600 mt-1 line-clamp-2">{creatorProfile.bio}</p>
                )}
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="w-full border-blue-300 text-blue-600 hover:bg-blue-100"
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

// ==================== PULSE LOADING COMPONENT ====================

const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 flex items-center justify-center shadow-lg">
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


// ==================== MAIN COURSE LEARNING PAGE ====================

const CourseLearningPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const courseId = params.courseId || params.id;

  const { user } = useAuth();

  // Caching mechanisms for better performance
  const quizAttemptsCacheRef = useRef<{[key: string]: any}>({});
  const lessonProgressCacheRef = useRef<{[key: string]: boolean}>({});
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [examResult, setExamResult] = useState<FinalExamAttempt | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [secondaryTab, setSecondaryTab] = useState('transcripts');
  const [nextLesson, setNextLesson] = useState<CourseLesson | null>(null);
  const [showNextLessonDialog, setShowNextLessonDialog] = useState(false);
  const [currentLessonProgress, setCurrentLessonProgress] = useState(0);
  
  // Enhanced Discussion & Notes State
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeValue, setCodeValue] = useState('// Enter your code here\n');
  const [language, setLanguage] = useState('javascript');
  const [discussionFilter, setDiscussionFilter] = useState('all');
  const [discussionSearch, setDiscussionSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [transcripts, setTranscripts] = useState<LessonTranscript[]>([]);
  
  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);
  
  // Completion state guards
  const completionInProgress = useRef(false);
  const completionAttempted = useRef(false);

  // ==================== DEBUG LOGGING ====================
  useEffect(() => {
    console.log('=== QUIZ DEBUG INFO ===');
    console.log('Modules:', modules.length);
    
    modules.forEach((module, modIndex) => {
      console.log(`\nModule ${modIndex + 1}: ${module.title}`);
      console.log(`  Total lessons: ${module.lessons.length}`);
      console.log(`  Total module quizzes: ${module.quizzes.length}`);
      
      // Check lesson quizzes
      module.lessons.forEach((lesson, lessonIndex) => {
        if (lesson.quiz) {
          console.log(`  Lesson ${lessonIndex + 1}: ${lesson.title}`);
          console.log(`    Has quiz: Yes`);
          console.log(`    Quiz ID: ${lesson.quiz.id}`);
          console.log(`    Quiz title: ${lesson.quiz.title}`);
          console.log(`    Question count: ${lesson.quiz.question_count}`);
          console.log(`    Is completed: ${lesson.quiz.is_completed}`);
          console.log(`    User score: ${lesson.quiz.user_score}`);
        }
      });
      
      // Check module quizzes
      module.quizzes.forEach((quiz, quizIndex) => {
        console.log(`  Module Quiz ${quizIndex + 1}: ${quiz.title}`);
        console.log(`    Quiz ID: ${quiz.id}`);
        console.log(`    Question count: ${quiz.question_count}`);
        console.log(`    Is completed: ${quiz.is_completed}`);
        console.log(`    User score: ${quiz.user_score}`);
      });
    });
  }, [modules]);
  
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
        .from('lesson_progress_with_user')
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
        .from('lesson_progress_with_user')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .eq('is_completed', true);

      if (completedError) throw completedError;

      const completedLessonIds = completedData?.map(item => item.lesson_id) || [];

      // Update the cache with the completed lessons
      completedLessonIds.forEach(lessonId => {
        lessonProgressCacheRef.current[lessonId] = true;
      });

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
      console.log('Loading quiz attempts for enrollment:', enrollment.id);

      // Get all quiz attempts
      const { data: quizAttempts, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, passed')
        .eq('enrollment_id', enrollment.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quiz attempts:', error);
        return;
      }

      console.log('Found quiz attempts:', quizAttempts);

      // Group attempts by quiz_id to get the latest attempt
      const latestAttempts = new Map();
      quizAttempts?.forEach(attempt => {
        // Only store the first (most recent) attempt for each quiz
        if (!latestAttempts.has(attempt.quiz_id)) {
          latestAttempts.set(attempt.quiz_id, attempt);
        }
      });

      // Update modules with quiz completion status
      setModules(prevModules => {
        const updatedModules = prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => {
            if (lesson.quiz) {
              const attempt = latestAttempts.get(lesson.quiz.id);
              console.log(`Checking quiz ${lesson.quiz.id} for lesson ${lesson.title}:`, attempt);
              return {
                ...lesson,
                quiz: {
                  ...lesson.quiz,
                  is_completed: attempt?.passed || false,
                  user_score: attempt?.score || 0
                }
              };
            }
            return lesson;
          }),
          quizzes: module.quizzes.map(quiz => {
            const attempt = latestAttempts.get(quiz.id);
            console.log(`Checking module quiz ${quiz.id}:`, attempt);
            return {
              ...quiz,
              is_completed: attempt?.passed || false,
              user_score: attempt?.score || 0
            };
          })
        }));

        return updatedModules;
      });
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
            is_creator
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
                is_creator
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
            .from('lesson_discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id);

          // Check if current user liked
          const { data: userLikeData } = await supabase
            .from('lesson_discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          return {
            ...discussion,
            replies,
            likes_count: likesData?.length || 0,
            is_liked: !!userLikeData,
            reply_count: replies.length
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

  const findNextLesson = useCallback((currentLesson: CourseLesson): CourseLesson | null => {
    if (!modules || modules.length === 0) return null;

    const allLessons: CourseLesson[] = [];

    modules
      .sort((a, b) => a.order_index - b.order_index)
      .forEach(module => {
        const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index);
        allLessons.push(...sortedLessons);
      });

    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);

    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }

    return null;
  }, [modules]);

  // ==================== TEST QUIZ FETCHING ====================

  const testQuizFetching = async () => {
    if (!courseId) return;
    
    console.log('=== TESTING QUIZ FETCHING ===');
    
    try {
      // Test 1: Get all quizzes for this course - broken down into simpler queries
      // First get lesson quizzes
      const { data: lessonQuizzes, error: lessonQuizError } = await supabase
        .from('quizzes')
        .select('*, lesson:lessons(title), module:course_modules(title)')
        .eq('course_id', courseId)
        .not('lesson_id', 'is', null);

      // Then get module quizzes
      const { data: moduleQuizzes, error: moduleQuizError } = await supabase
        .from('quizzes')
        .select('*, lesson:lessons(title), module:course_modules(title)')
        .eq('course_id', courseId)
        .is('lesson_id', null);

      let allQuizzes = [];
      if (!lessonQuizError && lessonQuizzes) allQuizzes = allQuizzes.concat(lessonQuizzes);
      if (!moduleQuizError && moduleQuizzes) allQuizzes = allQuizzes.concat(moduleQuizzes);

      if (lessonQuizError) {
        console.error('Error fetching lesson quizzes:', lessonQuizError);
      }
      if (moduleQuizError) {
        console.error('Error fetching module quizzes:', moduleQuizError);
      }
      
      console.log('All quizzes in course:', allQuizzes);
      
      // Test 2: Check if quizzes have questions
      await Promise.all(
        allQuizzes?.map(async (quiz) => {
          const { data: questions, error: qError } = await supabase
            .from('quiz_questions')
            .select('*, answers:quiz_answers(*)')
            .eq('quiz_id', quiz.id);
          
          if (qError) {
            console.error(`Error fetching questions for quiz ${quiz.id}:`, qError);
          } else {
            console.log(`Quiz ${quiz.title} (${quiz.id}): ${questions?.length || 0} questions`);
          }
        }) || []
      );
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  // ==================== EVENT HANDLERS ====================

  const handleVideoProgress = useCallback(async (progress: { played: number, playedSeconds: number }) => {
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

    if (watchPercentage > 80 && !completedLessons.includes(selectedLesson.id) && !lessonProgressCacheRef.current[selectedLesson.id]) {
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

        // Update the cache immediately to prevent duplicate calls
        lessonProgressCacheRef.current[selectedLesson.id] = true;

        await syncCourseProgress();
      } catch (error) {
        console.error('Error updating lesson progress:', error);
      }
    }
  }, [selectedLesson, isEnrolled, enrollment, completedLessons, syncCourseProgress]);

  const handleVideoEnd = useCallback(async () => {
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
  }, [selectedLesson, enrollment, completedLessons, syncCourseProgress]); // Removed handleLessonSelect to avoid circular dependency

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

  const handleLessonSelect = useCallback(async (lesson: CourseLesson) => {
    if (!lesson?.title?.trim()) return;

    setSelectedLesson(lesson);
    setCurrentLessonId(lesson.id);
    setShowNextLessonDialog(false);
    setNextLesson(null);
    setCurrentLessonProgress(0);

    // Load lesson-specific data
    await loadLessonData(lesson.id);

    if (isEnrolled && user && courseId) {
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
  }, [isEnrolled, user, courseId, loadLessonData]);

  const handleQuizStart = (quizId: string, lessonId: string) => {
    console.log('Starting quiz:', { quizId, lessonId });
    
    setCurrentQuizId(quizId);
    setCurrentLessonId(lessonId);
    
    // Find the quiz in modules
    let foundQuiz: Quiz | undefined;
    
    for (const module of modules) {
      // Check lesson quizzes
      for (const lesson of module.lessons) {
        if (lesson.quiz?.id === quizId) {
          foundQuiz = lesson.quiz;
          break;
        }
      }
      
      // Check module quizzes
      if (!foundQuiz) {
        const moduleQuiz = module.quizzes.find(q => q.id === quizId);
        if (moduleQuiz) {
          foundQuiz = moduleQuiz;
          break;
        }
      }
      
      if (foundQuiz) break;
    }
    
    if (foundQuiz) {
      console.log('Found quiz:', foundQuiz);
      setCurrentQuiz(foundQuiz);
      setShowQuizModal(true);
    } else {
      console.error('Quiz not found:', quizId);
      toast.error('Quiz not found or not available');
    }
  };

  const handleModuleQuizStart = (quizId: string, moduleId: string) => {
    console.log('Starting module quiz:', { quizId, moduleId });
    
    setCurrentQuizId(quizId);
    
    const module = modules.find(m => m.id === moduleId);
    const quiz = module?.quizzes.find(q => q.id === quizId);
    
    if (quiz) {
      console.log('Found module quiz:', quiz);
      setCurrentQuiz(quiz);
      setShowQuizModal(true);
    } else {
      console.error('Module quiz not found:', quizId);
      toast.error('Module quiz not found or not available');
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

  // Function to handle bookmarking the current video position
  const handleBookmarkCurrentPosition = async () => {
    if (!selectedLesson || !user || !currentVideoTime) return;

    try {
      // Create a bookmark at the current video position
      const { data, error } = await supabase
        .from('lesson_bookmarks')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          timestamp_seconds: Math.floor(currentVideoTime),
          title: `Bookmark at ${Math.floor(currentVideoTime / 60)}:${String(Math.floor(currentVideoTime % 60)).padStart(2, '0')}`
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Bookmark added successfully!');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast.error('Failed to add bookmark. Please try again.');
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

  const handleAddDiscussion = async (content: string) => {
    if (!content.trim() || !selectedLesson || !user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          content: content.trim(),
          is_instructor_reply: false
        })
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_creator
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        // Add the new discussion to the state immediately for instant UI update
        setDiscussions(prev => [data, ...prev]);
        setNewDiscussion('');
        toast.success('Discussion added successfully');
      }
    } catch (error) {
      console.error('Error adding discussion:', error);
      toast.error('Failed to add discussion. Please try again.');
    }
  };

  const handleAddReply = async (parentId: string, content: string) => {
    if (!content.trim() || !selectedLesson || !user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          parent_id: parentId,
          content: content.trim(),
          is_instructor_reply: false
        })
        .select(`
          *,
          profile:profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_creator
          )
        `)
        .single();

      if (data) {
        // Update the parent discussion with the new reply
        setDiscussions(prev =>
          prev.map(discussion =>
            discussion.id === parentId
              ? { ...discussion, replies: [...(discussion.replies || []), data], reply_count: (discussion.reply_count || 0) + 1 }
              : discussion
          )
        );

        setReplyContent('');
        setReplyingTo(null);
        toast.success('Reply added successfully');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply. Please try again.');
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    if (!user) return;

    try {
      const { data: existingLike, error: checkError } = await supabase
        .from('lesson_discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('lesson_discussion_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('lesson_discussion_likes')
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
        // Fetch course and modules in parallel
        const [courseDataResult, modulesDataResult] = await Promise.allSettled([
          supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .maybeSingle(),
          supabase
            .from('course_modules')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true })
        ]);

        if (courseDataResult.status === 'rejected' || !courseDataResult.value.data) {
          if (courseDataResult.reason) {
            console.error('Course fetch error:', courseDataResult.reason);
          }
          setCourse(null);
          setLoading(false);
          return;
        }

        const courseData = courseDataResult.value.data;
        setCourse(courseData);

        if (modulesDataResult.status === 'rejected') {
          console.error('Modules fetch error:', modulesDataResult.reason);
          setModules([]);
          setLoading(false);
          return;
        }

        const modulesData = modulesDataResult.value.data as CourseModule[];

        // Fetch all lessons for all modules in a single query
        const moduleIds = modulesData.map(m => m.id);
        const { data: allLessonsData, error: allLessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('order_index', { ascending: true });

        if (allLessonsError) {
          console.error('Error fetching all lessons:', allLessonsError);
          // Continue with empty lessons array
        }

        // Group lessons by module_id for efficient lookup
        const lessonsByModuleId = new Map<string, CourseLesson[]>();
        if (allLessonsData) {
          allLessonsData.forEach(lesson => {
            const moduleId = lesson.module_id;
            if (!lessonsByModuleId.has(moduleId)) {
              lessonsByModuleId.set(moduleId, []);
            }
            lessonsByModuleId.get(moduleId)!.push(lesson as CourseLesson);
          });
        }

        // Fetch all quizzes for lessons in a single query
        const lessonIds = allLessonsData?.map(l => l.id) || [];
        let lessonQuizzesData = [];
        let lessonQuizzesError = null;

        if (lessonIds.length > 0) {
          const { data, error } = await supabase
            .from('quizzes')
            .select(`
              *,
              questions:quiz_questions(
                *,
                answers:quiz_answers(*)
              )
            `)
            .in('lesson_id', lessonIds); // Only lesson quizzes (by filtering with lesson IDs)
          lessonQuizzesData = data;
          lessonQuizzesError = error;
        }

        if (lessonQuizzesError) {
          console.error('Error fetching lesson quizzes:', lessonQuizzesError);
        }

        // Group lesson quizzes by lesson_id for efficient lookup
        const lessonQuizzesByLessonId = new Map<string, any>();
        if (lessonQuizzesData) {
          lessonQuizzesData.forEach(quiz => {
            if (quiz.lesson_id) {
              lessonQuizzesByLessonId.set(quiz.lesson_id, {
                ...quiz,
                question_count: quiz.questions?.length || 0
              });
            }
          });
        }

        // Fetch all module-level quizzes in a single query
        const { data: moduleQuizzesData, error: moduleQuizzesError } = await supabase
          .from('quizzes')
          .select(`
            *,
            questions:quiz_questions(
              *,
              answers:quiz_answers(*)
            )
          `)
          .in('module_id', moduleIds)
          .is('lesson_id', null); // Only module quizzes (where lesson_id is null, meaning it's a module quiz)

        if (moduleQuizzesError) {
          console.error('Error fetching module quizzes:', moduleQuizzesError);
        }

        // Group module quizzes by module_id for efficient lookup
        const moduleQuizzesByModuleId = new Map<string, any[]>();
        if (moduleQuizzesData) {
          moduleQuizzesData.forEach(quiz => {
            if (quiz.module_id) {
              if (!moduleQuizzesByModuleId.has(quiz.module_id)) {
                moduleQuizzesByModuleId.set(quiz.module_id, []);
              }
              moduleQuizzesByModuleId.get(quiz.module_id)!.push({
                ...quiz,
                question_count: quiz.questions?.length || 0
              });
            }
          });
        }

        // Build modules with lessons and quizzes
        const modulesWithLessons = modulesData.map(module => {
          const lessons = lessonsByModuleId.get(module.id) || [];
          const lessonsWithQuizzes = lessons.map(lesson => {
            const quiz = lessonQuizzesByLessonId.get(lesson.id);
            return {
              ...lesson,
              quiz: quiz || undefined,
              has_quiz: !!quiz
            };
          });

          const moduleQuizzes = moduleQuizzesByModuleId.get(module.id) || [];

          return {
            ...module,
            lessons: lessonsWithQuizzes,
            quizzes: moduleQuizzes
          };
        });

        console.log('Loaded modules with quizzes:', modulesWithLessons);
        setModules(modulesWithLessons);

        // Fetch final exam and instructor profile in parallel
        const [examDataResult, instructorDataResult] = await Promise.allSettled([
          supabase
            .from('final_exams')
            .select('*')
            .eq('course_id', courseId)
            .maybeSingle(),
          courseData.creator_id
            ? supabase
                .from('profiles')
                .select('*')
                .eq('id', courseData.creator_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null })
        ]);

        if (examDataResult.status === 'fulfilled' && examDataResult.value.data) {
          setFinalExam(examDataResult.value.data);
        }

        if (user?.id) {
          // Fetch enrollment and progress in parallel
          const [enrollmentResult, progressResult] = await Promise.allSettled([
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

          // Fetch completed lessons using the lesson_progress_with_user view to simplify the query
          let completedLessonsData = [];
          try {
            const { data, error } = await supabase
              .from('lesson_progress_with_user')
              .select('lesson_id')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .eq('is_completed', true);
            if (!error) {
              completedLessonsData = data?.map(item => item.lesson_id) || [];
            }
          } catch (error) {
            console.error('Error fetching completed lessons:', error);
          }

          if (enrollmentResult.status === 'fulfilled') {
            setEnrollment(enrollmentResult.value.data);
          }

          if (progressResult.status === 'fulfilled') {
            setProgress(progressResult.value.data);
          }

          setCompletedLessons(completedLessonsData);
        }

        setDataLoaded(true);

        // Run test - commented out to prevent additional API calls
        // await testQuizFetching();

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
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
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
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
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
      <main className="flex-grow bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">{course.category}</Badge>
              <Badge variant="outline" className="text-sm border-blue-200 text-blue-600">{course.difficulty_level}</Badge>
              {course.is_free && <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-sm">Free</Badge>}
              {course.certificate_enabled && <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-sm flex items-center gap-1"><Award className="h-3 w-3" /> Certificate</Badge>}
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
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                      {progressPercentage}%
                    </span>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                
                <Progress value={progressPercentage} className="h-3 bg-blue-100">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </Progress>

                <div className="flex flex-col gap-3 mt-4">
                  {showTakeExamButton && (
                    <Button
                      onClick={handleTakeExam}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-full sm:w-auto shadow-md hover:shadow-lg"
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
                        className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white w-full sm:w-auto shadow-md hover:shadow-lg"
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
                      <div className="bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border border-yellow-200 rounded-xl p-3">
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
                          className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white w-full shadow-md hover:shadow-lg"
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
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white w-full sm:w-auto shadow-md hover:shadow-lg"
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
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
                <CardHeader className="p-6 border-b bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                      <BookOpen className="h-5 w-5 text-blue-500" />
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
                    <TabsList className="w-full h-12 bg-slate-50/50 p-1 rounded-t-xl">
                      <TabsTrigger 
                        value="content" 
                        className="w-full text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all duration-200"
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
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-1 shadow-sm">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                  </Badge>
                                )}
                                {selectedLesson?.quiz && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center gap-1 shadow-sm">
                                    <HelpCircle className="h-3 w-3" />
                                    Quiz Available
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Video Player */}
                            {(selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url) && (
                              <div className="space-y-6 w-full">
                                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
                                  <ReactPlayer
                                    url={selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url || ''}
                                    controls={true}
                                    playing={true}
                                    width="100%"
                                    height="100%"
                                    light={course.thumbnail_url}
                                    config={{
                                      file: {
                                        attributes: {
                                          controlsList: 'nodownload noremoteplayback',
                                          disablePictureInPicture: true,
                                          preload: 'metadata',
                                          onContextMenu: (e: any) => e.preventDefault()
                                        }
                                      }
                                    }}
                                    onProgress={handleVideoProgress}
                                    onEnded={handleVideoEnd}
                                    onError={(error) => {
                                      console.error('Video playback error:', error);
                                      toast.error('There was an issue loading the video. Please try again.');
                                    }}
                                    style={{
                                      minHeight: '400px'
                                    }}
                                  />
                                </div>

                                {/* Video Controls */}
                                <div className="flex flex-wrap gap-3 w-full">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 hover:bg-gray-100"
                                    onClick={handleBookmarkCurrentPosition}
                                  >
                                    <Bookmark className="h-4 w-4 mr-2" />
                                    Bookmark
                                  </Button>
                                  {selectedLesson?.quiz && (
                                    <Button
                                      onClick={() => handleQuizStart(selectedLesson.quiz!.id, selectedLesson.id)}
                                      size="sm"
                                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                                    >
                                      <HelpCircle className="h-4 w-4 mr-2" />
                                      Take Quiz
                                    </Button>
                                  )}
                                </div>

                                {/* Secondary Tabs - Enhanced Design */}
                                <div className="border border-gray-200 rounded-2xl mt-6 w-full overflow-hidden">
                                  <Tabs value={secondaryTab} onValueChange={setSecondaryTab} className="w-full">
                                    <TabsList className="w-full grid grid-cols-4 h-14 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-1 border-b">
                                      <TabsTrigger 
                                        value="transcripts" 
                                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Transcript
                                      </TabsTrigger>
                                      <TabsTrigger 
                                        value="notes" 
                                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                                      >
                                        <StickyNote className="h-4 w-4 mr-2" />
                                        Notes
                                      </TabsTrigger>
                                      <TabsTrigger 
                                        value="reviews" 
                                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                                      >
                                        <Star className="h-4 w-4 mr-2" />
                                        Reviews
                                      </TabsTrigger>
                                      <TabsTrigger 
                                        value="discussion" 
                                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                                      >
                                        <Users className="h-4 w-4 mr-2" />
                                        Discussion
                                      </TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="transcripts" className="p-6">
                                      {transcripts.length > 0 ? (
                                        <div className="space-y-3">
                                          <p className="text-sm text-gray-500 text-center">
                                            {transcripts.length} transcript segments
                                          </p>
                                          {transcripts.map((transcript) => (
                                            <div key={transcript.id} className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-200">
                                              <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-1 rounded">
                                                  {Math.floor(transcript.start_time / 60)}:{String(Math.floor(transcript.start_time % 60)).padStart(2, '0')}
                                                </span>
                                                <p className="text-sm text-gray-700">{transcript.text}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-12">
                                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                          <p className="text-gray-500">No transcripts available for this lesson.</p>
                                        </div>
                                      )}
                                    </TabsContent>
                                    
                                    <TabsContent value="notes" className="p-6">
                                      <div className="space-y-6">
                                        {/* Add Note */}
                                        <div className="space-y-3">
                                          <h4 className="font-medium text-gray-900">Add a Note</h4>
                                          <Textarea
                                            placeholder="Add your notes for this lesson..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            rows={3}
                                            className="border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl"
                                          />
                                          <div className="flex justify-end">
                                            <Button
                                              onClick={handleAddNote}
                                              disabled={!newNote.trim()}
                                              size="sm"
                                              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg"
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
                                              <div key={note.id} className="bg-gradient-to-r from-gray-50/80 to-slate-50/80 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                                                {editingNote === note.id ? (
                                                  <div className="space-y-3">
                                                    <Textarea
                                                      value={editNoteContent}
                                                      onChange={(e) => setEditNoteContent(e.target.value)}
                                                      rows={3}
                                                      className="border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          setEditingNote(null);
                                                          setEditNoteContent('');
                                                        }}
                                                        className="border-gray-300 hover:bg-gray-100"
                                                      >
                                                        Cancel
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateNote(note.id)}
                                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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
                                                          className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                        >
                                                          <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => handleDeleteNote(note.id)}
                                                          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
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
                                            <div className="text-center py-12">
                                              <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                              <p className="text-gray-500">No notes yet. Add your first note above!</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="reviews" className="p-6">
                                      <CourseReviewsTab courseId={courseId} />
                                    </TabsContent>
                                    
                                    <TabsContent value="discussion" className="p-6">
                                      <EnhancedDiscussionSection
                                        discussions={discussions}
                                        onAddDiscussion={handleAddDiscussion}
                                        onReply={handleAddReply}
                                        onLike={handleLikeDiscussion}
                                        onDelete={handleDeleteDiscussion}
                                        currentUserId={user?.id}
                                      />
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </div>
                            )}

                            {/* Lesson Content */}
                            {(selectedLesson?.content || modules[0]?.lessons[0]?.content) && (
                              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm mt-6 w-full">
                                <div className="flex items-center gap-3 mb-4">
                                  <FileText className="h-6 w-6 text-blue-500" />
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Lesson Materials</h3>
                                    <p className="text-gray-600 text-sm">
                                      Supplementary resources and materials to enhance your learning experience
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="prose prose-lg max-w-none bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200 w-full">
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
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <Crown className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Enroll to Access Content</h3>
                          <p className="text-gray-600 mb-6">Join thousands of students learning this course</p>
                          <Button 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
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
            <Card className="mt-8 sticky bottom-6 shadow-2xl border-0 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 z-10">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                      {course.is_free ? 'Free' : (
                        <PriceDisplay 
                          amount={course.price} 
                          originalCurrency="USD" 
                          className="text-blue-600"
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
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        size="lg"
                        onClick={() => navigate(`/course/${courseId}/enroll`)}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {course.is_free ? 'Enroll Free' : 'Enroll Now'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
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
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ready for Next Lesson!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-700 mb-3">
              Great progress! You've completed 97% of this lesson.
            </p>
            {nextLesson && (
              <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm mb-4">
                <p className="font-medium text-gray-900">{nextLesson.title}</p>
                <p className="text-sm text-gray-600 mt-1">Next lesson</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowNextLessonDialog(false)}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-100"
            >
              Continue Current
            </Button>
            <Button
              onClick={handleProceedToNextLesson}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Proceed to Next Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Learning Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isCourseCompleted ? 'Course Completed!' : 'Continue Learning?'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            {isCourseCompleted ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
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
                  <div className="bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Previous exam score: {examResult.score}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Welcome Back!</h3>
                <p className="text-gray-600">
                  Continue from where you left off or start from the beginning.
                </p>
                {resumeLesson && (
                  <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
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
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  Review Course
                </Button>
                {showTakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg"
                  >
                    Take Final Exam
                  </Button>
                )}
                {showRetakeExamButton && (
                  <Button
                    onClick={handleTakeExam}
                    className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg"
                  >
                    Retake Exam
                  </Button>
                )}
                {showRestartCourseButton && (
                  <Button
                    onClick={resetCourseProgress}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Course
                  </Button>
                )}
                {showViewCertificateButton && (
                  <Button
                    onClick={navigateToCourseResults}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg"
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
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleResumeLearning}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
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
        courseId={courseId} // Add this
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
