import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, Star, LayoutDashboard, ListChecks, MessageSquare, PlayCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Link } from 'react-router-dom';
import CourseDetailActions from '@/components/course/CourseDetailActions';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { useCart } from '@/contexts/CartContext';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  price: number;
  is_free: boolean;
  duration_minutes: number;
  difficulty_level: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  sections: CourseSection[];
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
    bio?: string;
  };
}

interface CourseSection {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCourseDetails();
      loadEnrollmentStatus();
      loadReviews();
    }
  }, [id, user]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch basic course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      // Fetch course modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            description,
            video_url,
            order_index
          )
        `)
        .eq('course_id', id)
        .order('order_index', { ascending: true });

      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', courseData.creator_id)
        .single();

      // Build the enriched course object
      const enrichedCourse: Course = {
        ...courseData,
        image_url: courseData.thumbnail_url || undefined,
        sections: (modulesData || []).map(module => ({
          id: module.id,
          title: module.title,
          order: module.order_index,
          lessons: (module.lessons || []).map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            video_url: lesson.video_url || '',
            duration_minutes: 0, // Default duration
            order: lesson.order_index
          }))
        })),
        author: creatorData || {
          id: courseData.creator_id || '',
          full_name: 'Unknown Author',
          avatar_url: '',
          bio: ''
        }
      };

      setCourse(enrichedCourse);
    } catch (error) {
      console.error('Error loading course details:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollmentStatus = async () => {
    if (!user) return;

    try {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError && enrollmentError.message !== 'No rows found') {
        throw enrollmentError;
      }

      setIsEnrolled(!!enrollmentData);

      // Fetch enrollment count
      const { data: countData, error: countError } = await supabase
        .from('course_enrollments')
        .select('count', { count: 'exact' })
        .eq('course_id', id);

      if (countError) throw countError;

      setEnrollmentCount(countData ? countData[0].count : 0);
    } catch (error) {
      console.error('Error loading enrollment status:', error);
      toast.error('Failed to load enrollment status');
      setIsEnrolled(false);
      setEnrollmentCount(0);
    }
  };

  const loadReviews = async () => {
    try {
      // Fetch reviews
      const { data: reviewData, error: reviewError } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (reviewError) throw reviewError;

      // If we have reviews, fetch the user profiles
      const transformedReviews: Review[] = [];
      
      if (reviewData && reviewData.length > 0) {
        const userIds = reviewData.map(review => review.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        // Transform the data to match our Review interface
        reviewData.forEach(review => {
          const profile = profilesData?.find(p => p.id === review.user_id);
          transformedReviews.push({
            id: review.id,
            rating: review.rating,
            comment: review.review_text || '',
            created_at: review.created_at,
            user: profile || {
              id: review.user_id,
              full_name: 'Anonymous',
              avatar_url: ''
            }
          });
        });
      }

      setReviews(transformedReviews);

      // Calculate average rating
      if (transformedReviews && transformedReviews.length > 0) {
        const totalRating = transformedReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / transformedReviews.length;
        setRating(avgRating);
        setReviewCount(transformedReviews.length);
      } else {
        setRating(0);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to submit a review');
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('course_reviews')
        .insert({
          course_id: id,
          user_id: user.id,
          rating: reviewRating,
          review_text: reviewText,
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setIsReviewModalOpen(false);
      setReviewText('');
      setReviewRating(5);
      loadReviews(); // Reload reviews to update the list
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFreeEnrollment = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!course || !course.is_free) return;

    try {
      setLoading(true);
      
      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .single();

      if (existingEnrollment) {
        toast.success('You are already enrolled in this course!');
        navigate(`/learning/course/${course.id}`);
        return;
      }

      // Create free enrollment
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          payment_status: 'completed',
          enrollment_date: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Successfully enrolled in the course!');
      setIsEnrolled(true);
      navigate(`/learning/course/${course.id}`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!course) return;

    setLoading(true);
    try {
      await addToCart({
        itemType: 'course',
        itemId: course.id,
        itemName: course.title,
        quantity: 1,
        price: course.price,
        ticketHolderNames: []
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto mt-8">
        <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-orange-50 to-purple-50">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto mt-8">
        <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-orange-50 to-purple-50">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Course Not Found</h2>
            <p className="text-gray-600">The course you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 bg-gradient-to-br from-orange-50 to-purple-50 min-h-screen py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
            {course.image_url && (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-64 object-cover rounded-t-md"
              />
            )}
            <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100">
              <CardTitle className="text-2xl font-bold text-gray-800">{course.title}</CardTitle>
              <CardDescription className="text-gray-700">
                <ReactMarkdown>{course.description}</ReactMarkdown>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-gradient-to-br from-orange-50 to-purple-50">
              {/* Course Sections and Lessons */}
              <Accordion type="single" collapsible className="w-full">
                {course.sections.sort((a, b) => a.order - b.order).map((section) => (
                  <AccordionItem key={section.id} value={section.id} className="border-orange-200">
                    <AccordionTrigger className="text-lg font-semibold text-gray-800 hover:text-orange-600">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="py-2">
                      <ul className="space-y-2">
                        {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                          <li key={lesson.id} className="flex items-start justify-between p-3 rounded-lg bg-white/50 border border-orange-100">
                            <div>
                              <h5 className="font-medium text-gray-800">{lesson.title}</h5>
                              <p className="text-sm text-gray-600">{lesson.description}</p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDuration(lesson.duration_minutes)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <Separator className="my-6 bg-orange-200" />

              {/* Reviews Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Reviews</h3>

                {/* Review Submission */}
                {user && (
                  <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-orange-200 hover:bg-orange-50">
                        Add a Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-orange-50 to-purple-50">
                      <DialogHeader>
                        <DialogTitle className="text-gray-800">Submit a Review</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Share your thoughts about this course.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="rating" className="text-right text-gray-700">
                            Rating
                          </Label>
                          <Input
                            type="number"
                            id="rating"
                            defaultValue="5"
                            min="1"
                            max="5"
                            className="col-span-3 border-orange-200"
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="comment" className="text-right mt-2 text-gray-700">
                            Comment
                          </Label>
                          <Textarea
                            id="comment"
                            className="col-span-3 border-orange-200"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          onClick={handleSubmitReview} 
                          disabled={submittingReview}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Display Reviews */}
                {reviews.length > 0 ? (
                  <ul className="space-y-4">
                    {reviews.map((review) => (
                      <li key={review.id} className="border rounded-md p-4 bg-white/50 border-orange-100">
                        <div className="flex items-center space-x-4 mb-2">
                          <Avatar>
                            <AvatarImage src={review.user.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-600 text-white">
                              {review.user.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h6 className="font-medium text-gray-800">{review.user.full_name}</h6>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{review.rating}</span>
                              <span> - {format(new Date(review.created_at), 'PPP')}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Details Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-100 to-purple-100">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Award className="h-5 w-5 text-orange-500" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Price</span>
                  {course.is_free ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Free</Badge>
                  ) : (
                    <PriceDisplay amount={course.price} className="font-bold text-orange-600" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Duration</span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.duration_minutes)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Students</span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{enrollmentCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({reviewCount})</span>
                  </div>
                </div>
                
                <Separator className="bg-orange-200" />
                
                {isEnrolled ? (
                  <Button asChild className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <Link to={`/learning/course/${course.id}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : course.is_free ? (
                  <Button 
                    onClick={handleFreeEnrollment}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Enrolling...' : 'Enroll for Free'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add to Cart'}
                  </Button>
                )}
                
                <div className="pt-4 border-t border-orange-200">
                  <h4 className="font-medium text-gray-800 mb-2">Created by</h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={course.author.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-600 text-white">
                        {course.author.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">{course.author.full_name}</p>
                      {course.author.bio && (
                        <p className="text-sm text-gray-600">{course.author.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
