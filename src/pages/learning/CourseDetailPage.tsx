import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  BookOpen, 
  Star, 
  Play, 
  CheckCircle,
  Award,
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronUp,
  Share2,
  BarChart3,
  GraduationCap,
  ThumbsUp,
  Zap,
  Target
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CourseReviews from '@/components/course/CourseReviews';
import CreatorCard from '@/components/course/CreatorCard';
import RecommendedCourses from '@/components/course/RecommendedCourses';
import { useCart } from '@/contexts/CartContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import OptimizedVideoPlayer from '@/components/video/OptimizedVideoPlayer';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface Course {
  id: string;
  title: string;
  description: string;
  summary: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  is_published: boolean;
  certificate_enabled: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  };
  course_preview?: {
    id: string;
    preview_video_url?: string;
    preview_video_path?: string;
  };
  course_modules: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      description?: string;
      order_index: number;
      content_type: string;
      video_url?: string;
    }>;
  }>;
  course_learning_outcomes: Array<{
    id: string;
    outcome: string;
    order_index: number;
  }>;
  course_skill_outcomes: Array<{
    id: string;
    skill_name: string;
    skill_description?: string;
    skill_level: string;
    order_index: number;
    is_core_skill: boolean;
  }>;
  course_reviews: Array<{
    id: string;
    rating: number;
    review_text?: string;
    created_at: string;
    profiles: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
  course_enrollments: Array<{
    id: string;
    enrollment_date: string;
  }>;
}

interface CreatorProfile {
  id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  average_rating?: number;
  total_courses?: number;
  total_students?: number;
  total_reviews?: number;
}

// Skills You'll Gain Component for the new tab - UPDATED COLORS
const SkillsYouWillGain = ({ skills }: { skills: Course['course_skill_outcomes'] }) => {
  if (!skills || skills.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
            <p className="text-gray-600">No specific skills listed for this course.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSkillLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'from-orange-500 to-purple-600'; // CHANGED from green to orange-purple
      case 'intermediate':
        return 'from-orange-500 to-purple-600'; // CHANGED from blue to orange-purple
      case 'advanced':
        return 'from-orange-500 to-purple-600'; // CHANGED from purple to orange-purple
      case 'expert':
        return 'from-orange-500 to-purple-600'; // CHANGED from red to orange-purple
      default:
        return 'from-orange-500 to-purple-600';
    }
  };

  const getSkillLevelIcon = (level: string) => {
    const gradientClass = getSkillLevelColor(level);
    return (
      <div className={`bg-gradient-to-r ${gradientClass} p-2 rounded-lg text-white`}>
        <Zap className="h-4 w-4" />
      </div>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          Skills You'll Gain
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills
            .sort((a, b) => a.order_index - b.order_index)
            .map((skill) => (
              <div 
                key={skill.id}
                className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-200 p-4 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getSkillLevelIcon(skill.skill_level)}
                    <div>
                      <h5 className="font-semibold text-gray-900 text-base">
                        {skill.skill_name}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          className={`bg-gradient-to-r ${getSkillLevelColor(skill.skill_level)} text-white border-0 text-xs`}
                        >
                          {skill.skill_level || 'Intermediate'}
                        </Badge>
                        {skill.is_core_skill && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-gradient-to-r from-orange-50 to-purple-50 text-orange-700 border-orange-200" // CHANGED from yellow to orange-purple
                          >
                            Core Skill
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {skill.skill_description && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {skill.skill_description}
                  </p>
                )}
              </div>
            ))}
        </div>
        
        {/* Skills Summary - UPDATED COLORS */}
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5" />
            <h4 className="font-semibold">Skills Summary</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{skills.length}</div>
              <div className="text-orange-100">Total Skills</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">
                {skills.filter(s => s.is_core_skill).length}
              </div>
              <div className="text-orange-100">Core Skills</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">
                {skills.filter(s => s.skill_level?.toLowerCase() === 'advanced' || s.skill_level?.toLowerCase() === 'expert').length}
              </div>
              <div className="text-orange-100">Advanced</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">
                {skills.filter(s => s.skill_level?.toLowerCase() === 'beginner' || s.skill_level?.toLowerCase() === 'intermediate').length}
              </div>
              <div className="text-orange-100">Beginner/Intermediate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Social Share Icons Component
const SocialShareIcons = ({ courseTitle, courseUrl }: { courseTitle: string; courseUrl: string }) => {
  const shareText = `Check out this amazing course: ${courseTitle}`;
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}&quote=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${courseUrl}`)}`,
    instagram: `https://www.instagram.com/?url=${encodeURIComponent(courseUrl)}`,
    tiktok: `https://www.tiktok.com/share/url?url=${encodeURIComponent(courseUrl)}`
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 text-sm">Share this course</h4>
      <div className="flex gap-3">
        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
        >
          <div className="w-6 h-6 mb-1">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-blue-600">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <span className="text-xs text-blue-600 font-medium">Facebook</span>
        </a>

        {/* WhatsApp */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
        >
          <div className="w-6 h-6 mb-1">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-green-600">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.189-1.248-6.189-3.515-8.444"/>
            </svg>
          </div>
          <span className="text-xs text-green-600 font-medium">WhatsApp</span>
        </a>

        {/* Instagram */}
        <a
          href={shareLinks.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center p-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
        >
          <div className="w-6 h-6 mb-1">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-pink-600">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <span className="text-xs text-pink-600 font-medium">Instagram</span>
        </a>

        {/* TikTok */}
        <a
          href={shareLinks.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors group"
        >
          <div className="w-6 h-6 mb-1">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </div>
          <span className="text-xs text-white font-medium">TikTok</span>
        </a>
      </div>
    </div>
  );
};

// FAQ Component
const FAQSection = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How long do I have access to the course?",
      answer: "You get lifetime access to this course. Once you enroll, you can access the content anytime, anywhere, on any device."
    },
    {
      question: "Can I get a certificate after completion?",
      answer: "Yes! This course offers a certificate of completion that you can download and share on your LinkedIn profile and resume."
    },
    {
      question: "What if I'm not satisfied with the course?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied with the course, you can request a full refund within 30 days of purchase."
    },
    {
      question: "Do I need any prior experience?",
      answer: "This course is designed for all skill levels - from complete beginners to advanced learners. We start with the basics and gradually progress to more advanced topics."
    },
    {
      question: "Can I access the course on mobile?",
      answer: "Absolutely! The course is fully responsive and can be accessed on any device - desktop, tablet, or mobile phone."
    },
    {
      question: "How often is the course content updated?",
      answer: "We regularly update our course content to ensure it stays current with the latest industry trends and best practices."
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 text-sm mb-3">Frequently Asked Questions</h4>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200 overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-orange-100 hover:to-purple-100 transition-colors"
            >
              <span className="font-medium text-gray-800 text-sm pr-2">{faq.question}</span>
              {expandedFaq === index ? (
                <ChevronUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
              )}
            </button>
            {expandedFaq === index && (
              <div className="px-4 pb-3 border-t border-orange-200">
                <p className="text-gray-600 text-sm pt-2 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Pulse Loading Component
const PulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Course
              </h3>
              <p className="text-muted-foreground text-lg">
                Preparing your learning experience...
              </p>
            </div>

            {/* Progress Dots */}
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

const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setAuthChecked(true);
        
        // If we have a user, check enrollment status
        if (session?.user && id) {
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('course_id', id)
            .eq('user_id', session.user.id)
            .eq('payment_status', 'completed')
            .single();

          setIsEnrolled(!!enrollment);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      // If user just signed in, check enrollment status
      if (session?.user && id && event === 'SIGNED_IN') {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', id)
          .eq('user_id', session.user.id)
          .eq('payment_status', 'completed')
          .single();

        setIsEnrolled(!!enrollment);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  useEffect(() => {
    if (id && authChecked) {
      fetchCourse();
    }
  }, [id, authChecked]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      // First get the course data to get creator_id
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (courseError || !courseData) {
        console.error('Error fetching course:', courseError);
        toast.error('Failed to load course');
        return;
      }

      // Use Promise.all for parallel data fetching
      const [
        creatorResult,
        previewResult,
        modulesResult,
        outcomesResult,
        skillsResult,
        reviewsResult,
        enrollmentsResult
      ] = await Promise.allSettled([
        // Creator profile - use the actual creator_id from courseData
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .eq('id', courseData.creator_id)
          .single(),

        // Course preview
        supabase
          .from('course_previews')
          .select('id, preview_video_url, preview_video_path')
          .eq('course_id', id)
          .maybeSingle(),

        // Course modules with lessons
        supabase
          .from('course_modules')
          .select(`
            id,
            title,
            description,
            order_index,
            lessons (
              id,
              title,
              description,
              order_index,
              content_type,
              video_url
            )
          `)
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        // Learning outcomes
        supabase
          .from('course_learning_outcomes')
          .select('id, outcome, order_index')
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        // Skill outcomes
        supabase
          .from('course_skill_outcomes')
          .select('id, skill_name, skill_description, skill_level, order_index, is_core_skill')
          .eq('course_id', id)
          .order('order_index', { ascending: true }),

        // Course reviews
        supabase
          .from('course_reviews')
          .select(`
            id,
            rating,
            review_text,
            created_at,
            user_id
          `)
          .eq('course_id', id)
          .order('created_at', { ascending: false })
          .limit(10),

        // Course enrollments
        supabase
          .from('course_enrollments')
          .select('id, enrollment_date')
          .eq('course_id', id)
      ]);

      // Process creator data
      const creatorData = creatorResult.status === 'fulfilled' && !creatorResult.value.error ? 
        creatorResult.value.data : { 
          id: courseData.creator_id, 
          full_name: 'Unknown Creator',
          avatar_url: null,
          bio: null
        };

      // Process preview data
      const previewData = previewResult.status === 'fulfilled' && !previewResult.value.error ? 
        previewResult.value.data : undefined;

      // Process modules data
      const modulesData = modulesResult.status === 'fulfilled' && !modulesResult.value.error ? 
        modulesResult.value.data : [];

      // Process outcomes data
      const outcomesData = outcomesResult.status === 'fulfilled' && !outcomesResult.value.error ? 
        outcomesResult.value.data : [];

      // Process skills data
      const skillsData = skillsResult.status === 'fulfilled' && !skillsResult.value.error ? 
        skillsResult.value.data : [];

      // Process enrollments data
      const enrollmentsData = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error ? 
        enrollmentsResult.value.data : [];

      // Process reviews with user profiles
      let reviewsWithProfiles = [];
      if (reviewsResult.status === 'fulfilled' && !reviewsResult.value.error && reviewsResult.value.data) {
        const reviewsData = reviewsResult.value.data;
        const userIds = reviewsData.map(review => review.user_id);
        
        // Fetch user profiles for reviews in parallel
        const { data: reviewProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profiles: reviewProfiles?.find(profile => profile.id === review.user_id) || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        }));
      }

      // Combine all data
      const completeCourse: Course = {
        ...courseData,
        profiles: creatorData,
        course_preview: previewData,
        course_modules: modulesData,
        course_learning_outcomes: outcomesData,
        course_skill_outcomes: skillsData,
        course_reviews: reviewsWithProfiles,
        course_enrollments: enrollmentsData
      };

      setCourse(completeCourse);

      // Fetch creator profile with stats in background
      fetchCreatorProfile(courseData.creator_id);

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading the course');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorProfile = async (creatorId: string) => {
    try {
      // First get the creator's basic profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', creatorId)
        .single();

      // Use Promise.all for parallel data fetching
      const [coursesResult, enrollmentsResult] = await Promise.allSettled([
        // Creator courses
        supabase
          .from('courses')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('is_published', true),

        // Course enrollments for this creator
        supabase
          .from('course_enrollments')
          .select('id, course_id')
          .eq('payment_status', 'completed')
          .in('course_id', 
            course?.id ? [course.id] : 
            profileData ? await supabase
              .from('courses')
              .select('id')
              .eq('creator_id', creatorId)
              .then(({ data }) => data?.map(c => c.id) || [])
            : []
          )
      ]);

      const courses = coursesResult.status === 'fulfilled' && !coursesResult.value.error ? 
        coursesResult.value.data : [];

      const enrollments = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error ? 
        enrollmentsResult.value.data : [];

      // Get reviews for all creator's courses
      const courseIds = courses.map(c => c.id);
      let totalReviews = 0;
      let totalRating = 0;

      if (courseIds.length > 0) {
        const { data: reviews } = await supabase
          .from('course_reviews')
          .select('rating')
          .in('course_id', courseIds)
          .limit(100);

        totalReviews = reviews?.length || 0;
        totalRating = reviews?.reduce((sum, review) => sum + review.rating, 0) || 0;
      }

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      setCreatorProfile({
        ...profileData,
        total_courses: courses.length,
        total_students: enrollments.length,
        total_reviews: totalReviews,
        average_rating: averageRating
      });
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (isEnrolled) {
      toast.info('You are already enrolled in this course');
      navigate(`/learning/course/${course.id}`);
      return;
    }

    try {
      setLoading(true);
      await addToCart({
        itemType: 'course',
        itemId: course.id,
        itemName: course.title,
        quantity: 1,
        price: course.price,
        ticketHolderNames: []
      });
      toast.success('Course added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollNow = () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (isEnrolled) {
      toast.info('You are already enrolled in this course');
      navigate(`/learning/course/${course.id}`);
      return;
    }

    if (course?.is_free) {
      handleFreeEnrollment();
    } else {
      handleAddToCart();
      navigate('/checkout');
    }
  };

  const handleFreeEnrollment = async () => {
    if (!course || !user) return;

    try {
      setEnrollmentLoading(true);
      
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id, user_id, course_id, payment_status')
        .eq('user_id', user.id)
        .eq('course_id', course.id);

      if (checkError) {
        console.error('Error checking enrollment:', checkError);
        toast.error('Failed to check enrollment status');
        return;
      }

      if (existingEnrollment && existingEnrollment.length > 0) {
        setIsEnrolled(true);
        toast.success('You are already enrolled in this course!');
        navigate(`/learning/course/${course.id}`);
        return;
      }

      const enrollmentData = {
        user_id: user.id,
        course_id: course.id,
        payment_status: 'completed',
        enrollment_date: new Date().toISOString()
      };

      const { data: newEnrollment, error: insertError } = await supabase
        .from('course_enrollments')
        .insert(enrollmentData)
        .select();

      if (insertError) {
        if (insertError.code === '23505') {
          setIsEnrolled(true);
          toast.success('You are already enrolled in this course!');
          navigate(`/learning/course/${course.id}`);
          return;
        }
        
        toast.error(`Failed to enroll: ${insertError.message}`);
        return;
      }

      setIsEnrolled(true);
      toast.success('Successfully enrolled in course!');
      navigate(`/learning/course/${course.id}`);
    } catch (error) {
      console.error('Unexpected enrollment error:', error);
      toast.error('An unexpected error occurred during enrollment');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Gradient Icon Component
  const GradientIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg text-white">
      {children}
    </div>
  );

  // Use the PulseLoading component
  if (loading) {
    return <PulseLoading />;
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
            <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/courses')} 
              className="mt-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
            >
              Browse Courses
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const averageRating = course.course_reviews.length > 0
    ? course.course_reviews.reduce((sum, review) => sum + review.rating, 0) / course.course_reviews.length
    : 0;

  const totalLessons = course.course_modules.reduce((total, module) => total + module.lessons.length, 0);
  const courseUrl = window.location.href;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                        {course.category}
                      </Badge>
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        {course.difficulty_level}
                      </Badge>
                      {course.certificate_enabled && (
                        <Badge variant="outline" className="bg-gradient-to-r from-orange-50 to-purple-50 text-orange-700 border-orange-200"> {/* CHANGED from yellow to orange-purple */}
                          <Award className="w-3 h-3 mr-1" />
                          Certificate
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-gray-600 text-base mb-6">{course.summary}</p>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Star className="w-4 h-4" />
                        </GradientIcon>
                        <span>{averageRating.toFixed(1)}</span>
                        <span>({course.course_reviews.length} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Users className="w-4 h-4" />
                        </GradientIcon>
                        <span>{course.course_enrollments.length} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <Clock className="w-4 h-4" />
                        </GradientIcon>
                        <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GradientIcon>
                          <BookOpen className="w-4 h-4" />
                        </GradientIcon>
                        <span>{totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Preview Video */}
                  {course.course_preview?.preview_video_url && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-3">Course Preview</h3>
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <OptimizedVideoPlayer
                          url={course.course_preview.preview_video_url}
                          poster={course.thumbnail_url}
                          controls={true}
                          light={course.thumbnail_url}
                          playsinline={true}
                          preload="metadata"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Course Tabs - UPDATED: Replaced Instructor with Skills You'll Gain */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="curriculum" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Curriculum
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    Skills
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        About this course
                      </h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed text-base">{course.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {course.course_learning_outcomes.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                          What you'll learn
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.course_learning_outcomes
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((outcome) => (
                              <div key={outcome.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-purple-50">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700">{outcome.outcome}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="curriculum">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        Course curriculum
                      </h3>
                      <div className="space-y-4">
                        {course.course_modules
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((module, moduleIndex) => (
                            <div key={module.id} className="border border-gray-200 rounded-lg p-4 bg-white/80 backdrop-blur-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <GradientIcon>
                                  <BookOpen className="w-4 h-4" />
                                </GradientIcon>
                                <h4 className="font-semibold text-lg text-gray-900">
                                  Module {moduleIndex + 1}: {module.title}
                                </h4>
                              </div>
                              {module.description && (
                                <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                              )}
                              <div className="space-y-2">
                                {module.lessons
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-lg transition-all duration-200">
                                      <GradientIcon>
                                        <Play className="w-3 h-3" />
                                      </GradientIcon>
                                      <span className="text-sm text-gray-700">
                                        {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                      </span>
                                      {lesson.content_type === 'video' && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Video</Badge>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <CourseReviews courseId={course.id} />
                </TabsContent>

                <TabsContent value="skills">
                  <SkillsYouWillGain skills={course.course_skill_outcomes} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and Enrollment Card */}
              <Card className="lg:sticky lg:top-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.is_free ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        <PriceDisplay amount={course.price} originalCurrency="USD" />
                      </div>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Button 
                      className="w-full mb-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700"
                      onClick={() => navigate(`/learning/course/${course.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 font-semibold py-3"
                        onClick={handleEnrollNow}
                        disabled={enrollmentLoading}
                      >
                        {enrollmentLoading ? (
                          'Enrolling...'
                        ) : course.is_free ? (
                          'Enroll for Free'
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                      {!course.is_free && (
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-semibold py-3"
                          onClick={handleAddToCart}
                          disabled={loading}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {loading ? 'Adding...' : 'Add to Cart'}
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-center text-sm text-gray-600 mt-6 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p>30-day money-back guarantee</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p>Full lifetime access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card - FIXED: Always show student count regardless of login status */}
              {creatorProfile && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-orange-300">
                        <AvatarImage src={creatorProfile.avatar_url || course.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-lg">
                          {creatorProfile.full_name?.charAt(0) || course.profiles?.full_name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {creatorProfile.full_name || course.profiles?.full_name || 'Course Creator'}
                        </h3>
                        <p className="text-sm text-gray-600">Instructor</p>
                      </div>
                    </div>
                    
                    {/* Stats with Icons - ALWAYS VISIBLE regardless of login status */}
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <BookOpen className="w-4 h-4 text-orange-600" />
                          <p className="font-bold text-gray-900 text-lg">{creatorProfile.total_courses || 0}</p>
                        </div>
                        <p className="text-xs text-gray-600">Courses</p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-purple-600" />
                          <p className="font-bold text-gray-900 text-lg">{creatorProfile.total_students || 0}</p>
                        </div>
                        <p className="text-xs text-gray-600">Students</p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-3 rounded-lg">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <p className="font-bold text-gray-900 text-lg">{creatorProfile.average_rating?.toFixed(1) || '0.0'}</p>
                        </div>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 font-semibold py-2"
                      onClick={() => navigate(`/creator/profile/${creatorProfile.id}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Course Features */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900">This course includes:</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Clock className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{Math.floor(course.duration_minutes / 60)} hours on-demand video</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <BookOpen className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GradientIcon>
                        <Users className="w-4 h-4" />
                      </GradientIcon>
                      <span className="text-sm text-gray-700">Access on mobile and desktop</span>
                    </div>
                    {course.certificate_enabled && (
                      <div className="flex items-center gap-3">
                        <GradientIcon>
                          <Award className="w-4 h-4" />
                        </GradientIcon>
                        <span className="text-sm text-gray-700">Certificate of completion</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Wishlist Button */}
                  {!isEnrolled && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <WishlistButton
                        itemId={course.id}
                        itemType="course"
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                      >
            
                        Add to Wishlist
                      </WishlistButton>
                    </div>
                  )}

                  {/* Social Share Icons */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <SocialShareIcons courseTitle={course.title} courseUrl={courseUrl} />
                  </div>

                  {/* FAQ Section */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <FAQSection />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-gray-900">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200 text-orange-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Courses Section */}
        <RecommendedCourses 
          currentCourseId={course.id} 
          category={course.category} 
        />
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
