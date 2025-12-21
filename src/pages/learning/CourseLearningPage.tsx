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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

// ==================== PERFORMANCE OPTIMIZATIONS ====================

// Video Cache Manager
class VideoCacheManager {
  private static instance: VideoCacheManager;
  private cache: Map<string, { url: string; timestamp: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // Max 50 cached videos
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): VideoCacheManager {
    if (!VideoCacheManager.instance) {
      VideoCacheManager.instance = new VideoCacheManager();
    }
    return VideoCacheManager.instance;
  }

  set(url: string, blobUrl: string): void {
    this.cleanup();
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .reduce((oldest, current) => 
          current[1].timestamp < oldest[1].timestamp ? current : oldest
        )[0];
      this.delete(oldestKey);
    }
    this.cache.set(url, { url: blobUrl, timestamp: Date.now() });
  }

  get(url: string): string | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      return cached.url;
    }
    return null;
  }

  delete(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      URL.revokeObjectURL(cached.url);
      this.cache.delete(url);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [url, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_EXPIRY) {
        this.delete(url);
      }
    }
  }

  clear(): void {
    for (const [url] of this.cache.entries()) {
      this.delete(url);
    }
  }
}

// Network Quality Detector
class NetworkQualityDetector {
  private static instance: NetworkQualityDetector;
  private connection: any;
  private listeners: ((quality: string) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
      
      if (this.connection) {
        this.connection.addEventListener('change', this.handleConnectionChange.bind(this));
      }
    }
  }

  static getInstance(): NetworkQualityDetector {
    if (!NetworkQualityDetector.instance) {
      NetworkQualityDetector.instance = new NetworkQualityDetector();
    }
    return NetworkQualityDetector.instance;
  }

  private handleConnectionChange(): void {
    const quality = this.getNetworkQuality();
    this.listeners.forEach(listener => listener(quality));
  }

  getNetworkQuality(): 'slow' | 'medium' | 'fast' {
    if (!this.connection) return 'fast';

    const { downlink, effectiveType } = this.connection;
    
    if (downlink < 1.5 || effectiveType === '2g' || effectiveType === '3g') {
      return 'slow';
    } else if (downlink < 5 || effectiveType === '4g') {
      return 'medium';
    }
    return 'fast';
  }

  addListener(listener: (quality: string) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (quality: string) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD', 
        mode: 'no-cors' 
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ==================== ENHANCED VIDEO PLAYER WITH CACHING ====================

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

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = React.memo(({ 
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
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [optimizedUrl, setOptimizedUrl] = useState(videoUrl);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'medium' | 'fast'>('fast');
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cacheManager = useRef(VideoCacheManager.getInstance());
  const networkDetector = useRef(NetworkQualityDetector.getInstance());
  
  const videoType = useMemo(() => {
    if (!videoUrl) return 'unknown';
    const lowerUrl = videoUrl.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('.m3u8')) return 'hls';
    if (lowerUrl.includes('.mpd')) return 'dash';
    if (lowerUrl.includes('.mp4')) return 'mp4';
    if (lowerUrl.includes('.webm')) return 'webm';
    
    return 'generic';
  }, [videoUrl]);

  // Cache video on mount
  useEffect(() => {
    const cacheVideo = async () => {
      if (videoType === 'mp4' || videoType === 'webm') {
        const cachedUrl = cacheManager.current.get(videoUrl);
        if (cachedUrl) {
          setOptimizedUrl(cachedUrl);
          return;
        }

        try {
          // Create a preload link for better performance
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'video';
          link.href = videoUrl;
          document.head.appendChild(link);
          
          // Cache the video
          const response = await fetch(videoUrl, { 
            mode: 'cors',
            cache: 'force-cache'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            cacheManager.current.set(videoUrl, blobUrl);
            setOptimizedUrl(blobUrl);
          }
        } catch (error) {
          console.warn('Failed to cache video, using original URL:', error);
          setOptimizedUrl(videoUrl);
        }
      } else {
        setOptimizedUrl(videoUrl);
      }
    };

    cacheVideo();
  }, [videoUrl, videoType]);

  // Network quality monitoring
  useEffect(() => {
    const handleNetworkChange = (quality: string) => {
      setNetworkQuality(quality as 'slow' | 'medium' | 'fast');
    };

    networkDetector.current.addListener(handleNetworkChange);
    setNetworkQuality(networkDetector.current.getNetworkQuality());

    return () => {
      networkDetector.current.removeListener(handleNetworkChange);
    };
  }, []);

  // Adaptive quality based on network
  useEffect(() => {
    if (videoType === 'mp4' || videoType === 'webm') {
      const url = new URL(videoUrl);
      const params = new URLSearchParams(url.search);
      
      if (networkQuality === 'slow') {
        params.set('quality', '360');
      } else if (networkQuality === 'medium') {
        params.set('quality', '720');
      } else {
        params.set('quality', '1080');
      }
      
      url.search = params.toString();
      setOptimizedUrl(url.toString());
    }
  }, [networkQuality, videoUrl, videoType]);

  const handleReady = useCallback(() => {
    console.log('Video ready to play:', videoType);
    setIsReady(true);
    setHasError(false);
    setRetryCount(0);
    if (onReady) onReady();
  }, [videoType, onReady]);

  const handleBuffer = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleBufferEnd = useCallback(() => {
    setIsBuffering(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Video playback error:', error, 'Type:', videoType);
    
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setHasError(false);
        // Try with lower quality on retry
        if (networkQuality !== 'slow') {
          setNetworkQuality('slow');
        }
      }, 1000 * (retryCount + 1));
    } else {
      setHasError(true);
      if (onError) onError(error);
    }
  }, [videoType, retryCount, networkQuality, onError]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Throttled progress handler
  const throttledProgress = useCallback(throttle((progress: { played: number, playedSeconds: number }) => {
    if (onProgress) onProgress(progress);
  }, 1000), [onProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoType === 'mp4' || videoType === 'webm') {
        // Don't revoke blob URL if it's cached
        const cached = cacheManager.current.get(videoUrl);
        if (!cached) {
          if (optimizedUrl.startsWith('blob:')) {
            URL.revokeObjectURL(optimizedUrl);
          }
        }
      }
    };
  }, [videoUrl, optimizedUrl, videoType]);

  const config = useMemo(() => ({
    file: {
      attributes: {
        controlsList: 'nodownload noremoteplayback',
        preload: 'auto',
        crossOrigin: 'anonymous',
        playsInline: true,
      },
      forceVideo: true,
      forceAudio: false,
      forceHLS: videoType === 'hls',
      forceDASH: videoType === 'dash',
      hlsOptions: {
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: networkQuality === 'slow' ? 30 : 90,
        maxBufferLength: networkQuality === 'slow' ? 15 : 30,
        maxMaxBufferLength: networkQuality === 'slow' ? 300 : 600,
        startLevel: -1,
      },
      dashOptions: {
        autoPlay: false,
      },
    },
    youtube: {
      playerVars: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1,
        origin: window.location.origin,
      },
    },
    vimeo: {
      playerOptions: {
        autopause: false,
        byline: false,
        portrait: false,
        title: false,
        responsive: true,
      },
    },
  }), [videoType, networkQuality]);

  if (hasError && retryCount >= 3) {
    return (
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
        <div className="text-center text-white p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Unable to load video</h3>
          <p className="text-sm text-gray-400 mb-4">
            The video could not be played. Please check your connection or try again later.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setHasError(false);
                setRetryCount(0);
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {networkQuality !== 'slow' && (
              <Button
                onClick={() => setNetworkQuality('slow')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Try Lower Quality
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl group"
    >
      {/* Network Quality Indicator */}
      {networkQuality !== 'fast' && (
        <div className="absolute top-4 left-4 z-20">
          <Badge variant="secondary" className={cn(
            "bg-opacity-90",
            networkQuality === 'slow' ? "bg-red-500" : "bg-yellow-500"
          )}>
            {networkQuality === 'slow' ? 'Low Quality' : 'Medium Quality'}
          </Badge>
        </div>
      )}

      {/* Loading/Buffering Overlay */}
      {(isBuffering || !isReady) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
          <div className="text-white text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">
              {!isReady ? 'Loading video...' : 'Buffering...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Network: {networkQuality}
            </p>
          </div>
        </div>
      )}
      
      <ReactPlayer
        ref={playerRef}
        url={optimizedUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={controls}
        playsinline
        pip
        stopOnUnmount
        light={thumbnail && !isReady ? thumbnail : false}
        playbackRate={playbackRate}
        volume={volume}
        onReady={handleReady}
        onBuffer={handleBuffer}
        onBufferEnd={handleBufferEnd}
        onProgress={throttledProgress}
        onError={handleError}
        onEnded={onEnd}
        config={config}
        fallback={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        }
      />

      {/* Enhanced Custom Controls Overlay */}
      {controls && isReady && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="text-white text-sm bg-white/10 hover:bg-white/20 rounded px-2 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={1.75}>1.75x</option>
                <option value={2}>2x</option>
              </select>
              
              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Network Quality */}
              <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                {networkQuality}
              </span>
              
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 hover:bg-white/10 p-2 rounded-lg transition-all"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';

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

const EnhancedCourseModuleList: React.FC<EnhancedCourseModuleListProps> = React.memo(({
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

  // Memoized calculations
  const totalLessons = useMemo(() => 
    modules.reduce((acc, module) => acc + module.lessons.length, 0), 
    [modules]
  );

  const progressPercentage = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.length / totalLessons) * 100);
  }, [completedLessons, totalLessons]);

  // Fetch data with caching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examData, profileData] = await Promise.all([
          courseId ? supabase
            .from('final_exams')
            .select('*')
            .eq('course_id', courseId)
            .eq('is_published', true)
            .maybeSingle() : Promise.resolve({ data: null, error: null }),
          creatorId ? supabase
            .from('profiles')
            .select('id, full_name, avatar_url, bio, is_creator')
            .eq('id', creatorId)
            .single() : Promise.resolve({ data: null, error: null })
        ]);

        if (examData.data) setFinalExam(examData.data);
        if (profileData.data) setCreatorProfile(profileData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [courseId, creatorId]);

  useEffect(() => {
    setCourseProgress(progressPercentage);
  }, [progressPercentage]);

  const getNextLesson = useCallback(() => {
    if (!currentLessonId) return null;
    
    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    
    return currentIndex !== -1 && currentIndex < allLessons.length - 1 
      ? allLessons[currentIndex + 1] 
      : null;
  }, [currentLessonId, modules]);

  const getPreviousLesson = useCallback(() => {
    if (!currentLessonId) return null;
    
    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
    
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  }, [currentLessonId, modules]);

  const handleNextLesson = useCallback(async () => {
    const nextLesson = getNextLesson();
    if (!nextLesson || isNavigating) return;
    
    setIsNavigating(true);
    try {
      await onLessonSelect(nextLesson);
    } finally {
      setIsNavigating(false);
    }
  }, [getNextLesson, isNavigating, onLessonSelect]);

  const handlePreviousLesson = useCallback(() => {
    const previousLesson = getPreviousLesson();
    if (!previousLesson || isNavigating) return;
    onLessonSelect(previousLesson);
  }, [getPreviousLesson, isNavigating, onLessonSelect]);

  const hasPassedExam = examResult?.passed;
  const hasExceededAttempts = examResult && examResult.attempts >= maxExamAttempts;
  const showFinalExamButton = finalExam && courseProgress >= 80 && !hasPassedExam && !hasExceededAttempts;
  const showRestartCourseButton = finalExam && courseProgress >= 80 && !hasPassedExam && hasExceededAttempts;

  return (
    <div className="space-y-4 w-full">
      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-3 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm sm:text-base font-medium text-gray-800">Course Progress</span>
          <span className="text-xs sm:text-sm font-bold text-blue-600">{courseProgress}%</span>
        </div>
        <Progress value={courseProgress} className="h-1.5 sm:h-2 bg-blue-100" />
      </div>

      {/* Navigation Buttons */}
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

      {/* Modules */}
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
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
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
                            {completedLessons.includes(lesson.id) ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{index + 1}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium truncate">{lesson.title}</h4>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-xs sm:text-sm text-muted-foreground">
                  No lessons available in this module
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Final Exam Button */}
      {showFinalExamButton && (
        <div className="bg-gradient-to-r from-orange-50/80 to-yellow-50/80 border-2 border-orange-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-orange-800">{finalExam.title}</h4>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                  <Badge variant="outline" className="text-xs sm:text-sm text-orange-700 border-orange-300">
                    {finalExam.passing_score}% to pass
                  </Badge>
                </div>
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

      {/* Instructor Profile */}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedCourseModuleList.displayName = 'EnhancedCourseModuleList';

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
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLesson, setResumeLesson] = useState<CourseLesson | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [secondaryTab, setSecondaryTab] = useState('transcripts');
  const [nextLesson, setNextLesson] = useState<CourseLesson | null>(null);
  const [showNextLessonDialog, setShowNextLessonDialog] = useState(false);
  const [currentLessonProgress, setCurrentLessonProgress] = useState(0);
  
  // Performance optimizations
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [discussions, setDiscussions] = useState<LessonDiscussion[]>([]);
  const [transcripts, setTranscripts] = useState<LessonTranscript[]>([]);
  
  const subscriptionRef = useRef<any>(null);
  const completionInProgress = useRef(false);
  const completionAttempted = useRef(false);

  // Memoized calculations
  const isEnrolled = useMemo(() => enrollment?.payment_status === 'completed', [enrollment]);
  const progressPercentage = useMemo(() => progress?.progress_percentage || 0, [progress]);
  const totalLessons = useMemo(() => 
    modules.reduce((total, module) => total + module.lessons.length, 0), 
    [modules]
  );
  const isCourseCompleted = useMemo(() => enrollment?.is_completed || false, [enrollment]);
  const hasCertificate = useMemo(() => !!certificate, [certificate]);

  // Debounced note saving
  const saveNoteDebounced = useCallback(
    debounce(async (content: string, lessonId: string) => {
      if (!content.trim() || !user) return;
      
      try {
        await supabase
          .from('lesson_notes')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            content: content.trim(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,lesson_id'
          });
      } catch (error) {
        console.error('Error auto-saving note:', error);
      }
    }, 2000),
    [user]
  );

  // Optimized data loading
  const loadCourseData = useCallback(async () => {
    if (!courseId || dataLoaded) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Load course and modules in parallel
      const [coursePromise, modulesPromise] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
        supabase.from('course_modules').select('*').eq('course_id', courseId).order('order_index', { ascending: true })
      ]);

      if (coursePromise.error) throw coursePromise.error;
      if (!coursePromise.data) {
        setCourse(null);
        setLoading(false);
        return;
      }

      setCourse(coursePromise.data);

      if (modulesPromise.error) throw modulesPromise.error;
      
      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
        (modulesPromise.data || []).map(async (module) => {
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true });

          return { 
            ...module, 
            lessons: lessonsData || [],
            quizzes: [] 
          };
        })
      );

      setModules(modulesWithLessons);

      // Load user data if logged in
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
      console.error('Error loading course data:', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId, user, dataLoaded]);

  // Load lesson data with caching
  const loadLessonData = useCallback(async (lessonId: string) => {
    if (!user) return;

    try {
      // Load notes, discussions, and transcripts in parallel
      const [notesData, discussionsData, transcriptsData] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false }),
        supabase
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
          .order('created_at', { ascending: false })
          .limit(20), // Limit to 20 discussions for performance
        supabase
          .from('lesson_transcripts')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('start_time', { ascending: true })
      ]);

      setNotes(notesData.data || []);
      setDiscussions(discussionsData.data || []);
      setTranscripts(transcriptsData.data || []);
    } catch (error) {
      console.error('Error loading lesson data:', error);
    }
  }, [user]);

  // Handle video progress with debouncing
  const handleVideoProgress = useCallback(
    debounce(async (progress: { played: number, playedSeconds: number }) => {
      if (!selectedLesson || !isEnrolled || !enrollment) return;

      const watchPercentage = progress.played * 100;
      setCurrentLessonProgress(watchPercentage);
      
      // Preload next lesson at 95%
      if (watchPercentage >= 95 && !showNextLessonDialog) {
        const nextLessonToLoad = findNextLesson(selectedLesson);
        if (nextLessonToLoad) {
          setNextLesson(nextLessonToLoad);
          setShowNextLessonDialog(true);
        }
      }
      
      // Mark as completed at 90%
      if (watchPercentage > 90 && !completedLessons.includes(selectedLesson.id)) {
        try {
          await supabase
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

          setCompletedLessons(prev => [...prev, selectedLesson.id]);
        } catch (error) {
          console.error('Error updating lesson progress:', error);
        }
      }
    }, 1000),
    [selectedLesson, isEnrolled, enrollment, completedLessons, showNextLessonDialog]
  );

  // Find next lesson efficiently
  const findNextLesson = useCallback((currentLesson: CourseLesson): CourseLesson | null => {
    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLesson.id);
    return currentIndex !== -1 && currentIndex < allLessons.length - 1 
      ? allLessons[currentIndex + 1] 
      : null;
  }, [modules]);

  // Handle lesson selection with caching
  const handleLessonSelect = useCallback(async (lesson: CourseLesson) => {
    if (!lesson?.title?.trim()) return;
    
    setSelectedLesson(lesson);
    setCurrentLessonId(lesson.id);
    setShowNextLessonDialog(false);
    setNextLesson(null);
    setCurrentLessonProgress(0);
    
    // Load lesson data
    await loadLessonData(lesson.id);
    
    if (isEnrolled && user) {
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
    
    setIsMobileSidebarOpen(false);
  }, [isEnrolled, user, courseId, loadLessonData]);

  // Auto-save note
  const handleNoteChange = useCallback((content: string) => {
    setNewNote(content);
    if (selectedLesson) {
      saveNoteDebounced(content, selectedLesson.id);
    }
  }, [selectedLesson, saveNoteDebounced]);

  // Initial data load
  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Auto-select initial lesson
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
  }, [isEnrolled, modules, progress, completedLessons, loading, selectedLesson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      VideoCacheManager.getInstance().clear();
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
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
            </div>
          </div>
        </div>
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
              </CardContent>
            </Card>
          )}

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
                            </div>

                            {/* Video Player */}
                            {(selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url) && (
                              <div className="space-y-6 w-full">
                                <CustomVideoPlayer
                                  videoUrl={selectedLesson?.video_url || modules[0]?.lessons[0]?.video_url || ''}
                                  thumbnail={course.thumbnail_url}
                                  onProgress={handleVideoProgress}
                                  onError={(error) => {
                                    console.error('Video playback error:', error);
                                    toast.error('There was an issue loading the video. Please try again.');
                                  }}
                                />
                                
                                {/* Secondary Tabs */}
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
                                    </TabsList>
                                    
                                    <TabsContent value="transcripts" className="p-6">
                                      {transcripts.length > 0 ? (
                                        <div className="space-y-3">
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
                                            onChange={(e) => handleNoteChange(e.target.value)}
                                            rows={3}
                                            className="border-gray-300 focus:border-blue-400 focus:ring-blue-300 rounded-xl"
                                          />
                                        </div>

                                        {/* Notes List */}
                                        <div className="space-y-3">
                                          <h4 className="font-medium text-gray-900">Your Notes</h4>
                                          {notes.length > 0 ? (
                                            notes.map((note) => (
                                              <div key={note.id} className="bg-gradient-to-r from-gray-50/80 to-slate-50/80 border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all duration-200">
                                                <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                <div className="flex justify-between items-center mt-3">
                                                  <span className="text-xs text-gray-500">
                                                    {new Date(note.created_at).toLocaleDateString()}
                                                  </span>
                                                </div>
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
                                  </Tabs>
                                </div>
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
              Great progress! You've completed 95% of this lesson.
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
              onClick={() => nextLesson && handleLessonSelect(nextLesson)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Proceed to Next Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CourseLearningPage;
