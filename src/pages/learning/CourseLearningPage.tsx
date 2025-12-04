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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactPlayer from 'react-player';
import { 
  Play, Clock, User, BookOpen, Award, Star, Users,
  MessageCircle, Target, CheckCircle, StickyNote,
  CheckCircle2, GraduationCap, Eye, FileText, ChevronUp, ChevronDown,
  Zap, Bookmark, Share, Download, Crown, Rocket, Trophy, Sparkles,
  Menu, X, HelpCircle, AlertCircle, RotateCcw,
  ChevronLeft, ChevronRight, FileQuestion, Video,
  Send, Edit2, Trash2, Loader2, Maximize2, Volume2,
  ThumbsUp, Reply, Heart, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import AddToCartButton from '@/components/cart/AddToCartButton';
import FinalExamModal from '@/components/course/FinalExamModal';
import QuizModal from '@/components/course/QuizModal';
import VideoTranscripts from '@/components/course/VideoTranscripts';
import QuizResultsModal from '@/components/course/QuizResultsModal';
import FloatingAILearningAssistant from '@/components/learning/FloatingAILearningAssistant';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import Layout from '@/components/layout/Layout';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ==================== INTERFACES ====================

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_creator?: boolean;
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
  is_creator_reply?: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  replies?: LessonDiscussion[];
  likes_count?: number;
  is_liked?: boolean;
  user_votes?: any[];
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

// ==================== MODERN DISCUSSION COMPONENTS ====================

interface DiscussionCardProps {
  discussion: LessonDiscussion;
  onReply: (parentId: string) => void;
  onLike: (discussionId: string) => void;
  onDelete?: (discussionId: string) => void;
  currentUserId?: string;
  depth?: number;
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({ 
  discussion, 
  onReply, 
  onLike,
  onDelete,
  currentUserId,
  depth = 0
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const isOwner = currentUserId === discussion.user_id;
  const isCreator = discussion.profile?.is_creator || discussion.profile?.is_instructor;
  const maxDepth = 4; // Maximum nesting depth
  
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(discussion.id);
    } finally {
      setIsLiking(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className={`relative ${depth > 0 ? 'pl-6 sm:pl-8 mt-4' : 'mt-6'}`}>
      {/* Thread line for nested comments */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-orange-300/50 to-purple-400/50" />
      )}
      
      <div className={cn(
        "group relative rounded-2xl transition-all duration-300 hover:shadow-lg",
        depth === 0 ? "bg-gradient-to-br from-orange-50/80 to-purple-50/80 border border-orange-200/50" : 
        depth === 1 ? "bg-gradient-to-br from-orange-50/60 to-purple-50/60 border border-orange-200/30" :
        "bg-gradient-to-br from-orange-50/40 to-purple-50/40 border border-orange-200/20"
      )}>
        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage 
                  src={discussion.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${discussion.user_id}`} 
                  alt={discussion.profile?.full_name}
                />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  {discussion.profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {discussion.profile?.full_name || 'Anonymous'}
                  </span>
                  {isCreator && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs px-2 py-0.5">
                      Instructor
                    </Badge>
                  )}
                  {isOwner && !isCreator && (
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                      You
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(discussion.created_at)}
                </span>
              </div>
            </div>
            
            {(isOwner || isCreator) && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(discussion.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Content */}
          <p className="text-gray-800 whitespace-pre-wrap mb-4">
            {discussion.content}
          </p>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-all",
                discussion.is_liked 
                  ? "text-red-600" 
                  : "text-gray-600 hover:text-red-600"
              )}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn(
                  "h-4 w-4 transition-all",
                  discussion.is_liked && "fill-current"
                )} />
              )}
              <span>{discussion.likes_count || 0}</span>
            </button>
            
            {depth < maxDepth && (
              <button 
                onClick={() => onReply(discussion.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
            )}
            
            {discussion.replies && discussion.replies.length > 0 && (
              <button 
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors ml-auto"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide {discussion.replies.length} replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {discussion.replies.length} replies
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Nested Replies */}
      {showReplies && discussion.replies && discussion.replies.length > 0 && (
        <div className="space-y-3 mt-4">
          {discussion.replies.map((reply) => (
            <DiscussionCard
              key={reply.id}
              discussion={reply}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== MODERN NOTES COMPONENT ====================

interface NoteCardProps {
  note: LessonNote;
  onEdit: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
  isOwner: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, isOwner }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  
  const handleSave = () => {
    onEdit(note.id, editContent);
    setIsEditing(false);
  };
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50/80 to-purple-50/80 rounded-xl border border-orange-200/50 p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white">
            <AvatarImage 
              src={note.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.user_id}`}
              alt={note.profile?.full_name}
            />
            <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs">
              {note.profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium text-gray-900">
              {note.profile?.full_name || 'You'}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {getTimeAgo(note.created_at)}
            </span>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(note.content);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!editContent.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 whitespace-pre-wrap text-sm">
          {note.content}
        </p>
      )}
    </div>
  );
};

// ==================== LESSON DISCUSSION TAB ====================

interface LessonDiscussionTabProps {
  lessonId: string;
  userId?: string;
  onDiscussionAdded?: () => void;
}

const LessonDiscussionTab: React.FC<LessonDiscussionTabProps> = ({
  lessonId,
  userId,
  onDiscussionAdded
}) => {
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadDiscussions = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    try {
      // Load top-level discussions
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('lesson_discussions')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url,
            is_creator,
            is_instructor
          ),
          user_votes!left (*)
        `)
        .eq('lesson_id', lessonId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (discussionsError) {
        console.error('Error loading discussions:', discussionsError);
        setDiscussions([]);
        return;
      }

      if (!discussionsData) {
        setDiscussions([]);
        return;
      }

      // For each discussion, load replies recursively
      const discussionsWithReplies = await Promise.all(
        discussionsData.map(async (discussion: any) => {
          const replies = await loadReplies(discussion.id);
          
          // Get likes count
          const { data: likesData } = await supabase
            .from('discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id);
          
          // Check if current user liked
          const { data: userLikeData } = await supabase
            .from('discussion_likes')
            .select('*')
            .eq('discussion_id', discussion.id)
            .eq('user_id', userId)
            .maybeSingle();

          return {
            ...discussion,
            profile: discussion.profiles,
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
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (parentId: string): Promise<LessonDiscussion[]> => {
    const { data: repliesData, error } = await supabase
      .from('lesson_discussions')
      .select(`
        *,
        profiles!user_id (
          id,
          full_name,
          avatar_url,
          is_creator,
          is_instructor
        ),
        user_votes!left (*)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error || !repliesData) return [];

    // For each reply, load its replies recursively
    const repliesWithNestedReplies = await Promise.all(
      repliesData.map(async (reply: any) => {
        const nestedReplies = await loadReplies(reply.id);
        
        const { data: likesData } = await supabase
          .from('discussion_likes')
          .select('*')
          .eq('discussion_id', reply.id);
        
        const { data: userLikeData } = await supabase
          .from('discussion_likes')
          .select('*')
          .eq('discussion_id', reply.id)
          .eq('user_id', userId)
          .maybeSingle();

        return {
          ...reply,
          profile: reply.profiles,
          replies: nestedReplies,
          likes_count: likesData?.length || 0,
          is_liked: !!userLikeData
        };
      })
    );

    return repliesWithNestedReplies;
  };

  const handleAddDiscussion = async () => {
    if (!newDiscussion.trim() || !lessonId || !userId || posting) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          content: newDiscussion.trim(),
          is_creator_reply: false
        })
        .select()
        .single();

      if (error) throw error;

      setNewDiscussion('');
      toast.success('Discussion posted successfully');
      
      // Reload discussions
      await loadDiscussions();
      if (onDiscussionAdded) onDiscussionAdded();
    } catch (error) {
      console.error('Error adding discussion:', error);
      toast.error('Failed to post discussion');
    } finally {
      setPosting(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !lessonId || !userId || posting) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          parent_id: parentId,
          content: replyContent.trim(),
          is_creator_reply: false
        })
        .select()
        .single();

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully');
      
      // Reload discussions
      await loadDiscussions();
      if (onDiscussionAdded) onDiscussionAdded();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    if (!userId) return;

    try {
      const { data: existingLike, error: checkError } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', userId)
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
            user_id: userId,
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
        
        // Check in replies
        const updateReplies = (replies: LessonDiscussion[]): LessonDiscussion[] => {
          return replies.map(reply => {
            if (reply.id === discussionId) {
              const newLikesCount = existingLike 
                ? (reply.likes_count || 1) - 1 
                : (reply.likes_count || 0) + 1;
              
              return {
                ...reply,
                likes_count: newLikesCount,
                is_liked: !existingLike
              };
            }
            
            if (reply.replies && reply.replies.length > 0) {
              return {
                ...reply,
                replies: updateReplies(reply.replies)
              };
            }
            
            return reply;
          });
        };
        
        if (discussion.replies && discussion.replies.length > 0) {
          return {
            ...discussion,
            replies: updateReplies(discussion.replies)
          };
        }
        
        return discussion;
      }));
    } catch (error) {
      console.error('Error liking discussion:', error);
      toast.error('Failed to like discussion');
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;

    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .delete()
        .eq('id', discussionId);

      if (error) throw error;

      // Remove from local state
      const removeDiscussion = (discussions: LessonDiscussion[]): LessonDiscussion[] => {
        return discussions.filter(d => {
          if (d.id === discussionId) return false;
          
          if (d.replies && d.replies.length > 0) {
            d.replies = removeDiscussion(d.replies);
          }
          
          return true;
        });
      };

      setDiscussions(prev => removeDiscussion(prev));
      toast.success('Discussion deleted successfully');
    } catch (error) {
      console.error('Error deleting discussion:', error);
      toast.error('Failed to delete discussion');
    }
  };

  useEffect(() => {
    if (lessonId) {
      loadDiscussions();
    }
  }, [lessonId, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Discussion Input */}
      <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 rounded-xl border border-orange-200/50 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Start a Discussion</h3>
        <div className="space-y-3">
          <Textarea
            placeholder="Ask a question or share your thoughts about this lesson..."
            value={newDiscussion}
            onChange={(e) => setNewDiscussion(e.target.value)}
            rows={3}
            className="resize-none border-gray-300 focus:border-orange-500"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddDiscussion}
              disabled={!newDiscussion.trim() || posting}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Discussion
            </Button>
          </div>
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Discussions ({discussions.length})
          </h3>
          {discussions.length > 0 && (
            <span className="text-sm text-gray-500">
              Latest first
            </span>
          )}
        </div>
        
        <ScrollArea className="h-[500px] pr-4">
          {discussions.length > 0 ? (
            <div className="space-y-6">
              {discussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  onReply={setReplyingTo}
                  onLike={handleLikeDiscussion}
                  onDelete={handleDeleteDiscussion}
                  currentUserId={userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h4>
              <p className="text-gray-600 max-w-md mx-auto">
                Be the first to start a discussion! Ask a question or share your thoughts about this lesson.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Reply Input (floating) */}
      {replyingTo && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="container mx-auto max-w-6xl p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Replying to discussion</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none"
                  autoFocus
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
                    disabled={!replyContent.trim() || posting}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    {posting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
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

// ==================== LESSON NOTES TAB ====================

interface LessonNotesTabProps {
  lessonId: string;
  userId?: string;
  onNoteAdded?: () => void;
}

const LessonNotesTab: React.FC<LessonNotesTabProps> = ({
  lessonId,
  userId,
  onNoteAdded
}) => {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadNotes = async () => {
    if (!lessonId || !userId) return;
    
    setLoading(true);
    try {
      // FIXED QUERY - simpler approach
      const { data: notesData, error: notesError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error loading notes:', notesError);
        setNotes([]);
        return;
      }

      // Load profile data separately
      const notesWithProfiles = await Promise.all(
        (notesData || []).map(async (note) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', note.user_id)
            .maybeSingle();

          return {
            ...note,
            profile: profileData || undefined
          };
        })
      );

      setNotes(notesWithProfiles);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !lessonId || !userId || posting) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          content: newNote.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Load profile for the new note
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      const noteWithProfile = {
        ...data,
        profile: profileData || undefined
      };

      setNotes(prev => [noteWithProfile, ...prev]);
      setNewNote('');
      toast.success('Note added successfully');
      
      if (onNoteAdded) onNoteAdded();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, content: content.trim() } : note
      ));
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

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
      toast.error('Failed to delete note');
    }
  };

  useEffect(() => {
    if (lessonId && userId) {
      loadNotes();
    }
  }, [lessonId, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Note Input */}
      <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 rounded-xl border border-orange-200/50 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Add a Note</h3>
        <div className="space-y-3">
          <Textarea
            placeholder="Add your notes for this lesson..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none border-gray-300 focus:border-orange-500"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || posting}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {posting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <StickyNote className="h-4 w-4 mr-2" />
              )}
              Add Note
            </Button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Notes ({notes.length})
          </h3>
          {notes.length > 0 && (
            <span className="text-sm text-gray-500">
              Most recent first
            </span>
          )}
        </div>
        
        <ScrollArea className="h-[500px] pr-4">
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  isOwner={note.user_id === userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                <StickyNote className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h4>
              <p className="text-gray-600 max-w-md mx-auto">
                Add your first note above to capture important points from this lesson.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

// ==================== FIXED QUIZ FETCHING FUNCTION ====================

const fetchQuizData = async (lessonId?: string, moduleId?: string) => {
  try {
    let query = supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          *,
          quiz_answers (*)
        )
      `);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }
    
    if (moduleId) {
      query = query.eq('module_id', moduleId).is('lesson_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }

    // Transform the data to match Quiz interface
    return data?.map(quiz => ({
      ...quiz,
      questions: quiz.quiz_questions?.map(question => ({
        ...question,
        answers: question.quiz_answers || []
      })) || []
    })) || [];
  } catch (error) {
    console.error('Error in fetchQuizData:', error);
    return null;
  }
};

// ==================== MAIN COURSE LEARNING PAGE (SIMPLIFIED) ====================

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
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('content');
  const [secondaryTab, setSecondaryTab] = useState('transcripts');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Quiz states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  
  // Exam states
  const [showExamModal, setShowExamModal] = useState(false);
  const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
  const [examResult, setExamResult] = useState<FinalExamAttempt | null>(null);

  const isEnrolled = enrollment?.payment_status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;
  const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);

  // Load course data
  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        // Load course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Load modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Load lessons for each module
        const modulesWithLessons = await Promise.all(
          (modulesData || []).map(async (module) => {
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index', { ascending: true });

            if (lessonsError) {
              console.error('Error loading lessons:', lessonsError);
              return { ...module, lessons: [], quizzes: [] };
            }

            // Load quizzes for each lesson
            const lessonsWithQuizzes = await Promise.all(
              (lessonsData || []).map(async (lesson) => {
                const quizData = await fetchQuizData(lesson.id, undefined);
                return {
                  ...lesson,
                  quiz: quizData?.[0] || undefined
                };
              })
            );

            // Load module quizzes
            const moduleQuizzes = await fetchQuizData(undefined, module.id);

            return {
              ...module,
              lessons: lessonsWithQuizzes || [],
              quizzes: moduleQuizzes || []
            };
          })
        );

        setModules(modulesWithLessons);

        // Load enrollment and progress if user is logged in
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

        // Load final exam
        const { data: examData } = await supabase
          .from('final_exams')
          .select('*')
          .eq('course_id', courseId)
          .maybeSingle();
        setFinalExam(examData);

      } catch (error) {
        console.error('Error loading course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user]);

  // Load exam result
  useEffect(() => {
    const loadExamResult = async () => {
      if (!finalExam || !user || !enrollment) return;

      try {
        const { data: attemptData } = await supabase
          .from('final_exam_attempts')
          .select('*')
          .eq('exam_id', finalExam.id)
          .eq('user_id', user.id)
          .eq('enrollment_id', enrollment.id)
          .order('attempt_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        setExamResult(attemptData);
      } catch (error) {
        console.error('Error loading exam result:', error);
      }
    };

    loadExamResult();
  }, [finalExam, user, enrollment]);

  // Handle lesson selection
  const handleLessonSelect = async (lesson: CourseLesson) => {
    setSelectedLesson(lesson);
    setCurrentLessonId(lesson.id);
    setIsMobileSidebarOpen(false);
    
    if (isEnrolled && user) {
      // Update last accessed
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_accessed_lesson_id: lesson.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });
    }
  };

  // Handle quiz start
  const handleQuizStart = (quizId: string, lessonId: string) => {
    setCurrentQuizId(quizId);
    setCurrentLessonId(lessonId);
    setShowQuizModal(true);
  };

  // Handle module quiz start
  const handleModuleQuizStart = (quizId: string) => {
    setCurrentQuizId(quizId);
    setShowQuizModal(true);
  };

  // Mark lesson as complete
  const markLessonComplete = async (lessonId: string) => {
    if (!user || !enrollment) return;

    try {
      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString()
        }, {
          onConflict: 'enrollment_id,lesson_id'
        });

      // Update completed lessons list
      if (!completedLessons.includes(lessonId)) {
        setCompletedLessons(prev => [...prev, lessonId]);
      }

      // Update progress
      const newCompletedCount = completedLessons.length + 1;
      const newProgress = Math.round((newCompletedCount / totalLessons) * 100);

      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: newProgress,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      setProgress(prev => prev ? {
        ...prev,
        progress_percentage: newProgress
      } : null);

      toast.success('Lesson marked as complete!');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Failed to mark lesson as complete');
    }
  };

  // Simple loading component
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link to="/explore-courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="bg-gradient-to-br from-orange-50/30 via-white to-purple-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {course.title}
            </h1>
            <p className="text-gray-600 text-lg">{course.description}</p>
          </div>

          {/* Progress Section */}
          {isEnrolled && (
            <Card className="mb-6 bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
                    <p className="text-sm text-gray-600">
                      {completedLessons.length} of {totalLessons} lessons completed
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {progressPercentage}%
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-gray-200"
                />
              </CardContent>
            </Card>
          )}

          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600"
            >
              {isMobileSidebarOpen ? 'Hide' : 'Show'} Curriculum
            </Button>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className={`lg:col-span-1 ${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block`}>
              <Card className="sticky top-6 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {modules.map((module) => (
                      <div key={module.id} className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {module.title}
                        </h4>
                        <div className="space-y-2 ml-2">
                          {module.lessons.map((lesson) => (
                            <Button
                              key={lesson.id}
                              variant={selectedLesson?.id === lesson.id ? "default" : "ghost"}
                              className={`w-full justify-start ${selectedLesson?.id === lesson.id ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' : ''}`}
                              onClick={() => handleLessonSelect(lesson)}
                            >
                              <div className="flex items-center gap-2">
                                {completedLessons.includes(lesson.id) ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                <span className="text-left">{lesson.title}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-6">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="discussion">Discussion</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="space-y-6">
                      {selectedLesson ? (
                        <>
                          <div className="aspect-video bg-black rounded-lg">
                            {selectedLesson.video_url ? (
                              <ReactPlayer
                                url={selectedLesson.video_url}
                                width="100%"
                                height="100%"
                                controls
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-white">
                                No video available
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                            <p className="text-gray-600">{selectedLesson.description}</p>
                            
                            {selectedLesson.quiz && (
                              <Button
                                onClick={() => handleQuizStart(selectedLesson.quiz!.id, selectedLesson.id)}
                                className="bg-gradient-to-r from-orange-500 to-purple-600"
                              >
                                Take Lesson Quiz
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => markLessonComplete(selectedLesson.id)}
                              variant="outline"
                              className="border-orange-300 text-orange-600"
                            >
                              Mark as Complete
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-600">Select a lesson to get started</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="notes">
                      {selectedLesson ? (
                        <LessonNotesTab
                          lessonId={selectedLesson.id}
                          userId={user?.id}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-600">Select a lesson to view notes</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="discussion">
                      {selectedLesson ? (
                        <LessonDiscussionTab
                          lessonId={selectedLesson.id}
                          userId={user?.id}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-600">Select a lesson to view discussions</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="reviews">
                      <CourseReviewsTab courseId={courseId} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Quiz Modal */}
        <QuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          quizId={currentQuizId}
          lessonId={currentLessonId}
          onComplete={() => {
            setShowQuizModal(false);
            toast.success('Quiz completed!');
          }}
        />

        {/* Exam Modal */}
        {finalExam && (
          <FinalExamModal
            isOpen={showExamModal}
            onClose={() => setShowExamModal(false)}
            exam={finalExam}
            enrollmentId={enrollment?.id || ''}
            onComplete={(result) => {
              setShowExamModal(false);
              setExamResult(result);
              toast.success('Exam completed!');
            }}
            previousAttempt={examResult}
            maxAttempts={5}
          />
        )}
      </main>
    </Layout>
  );
};

export default CourseLearningPage;
