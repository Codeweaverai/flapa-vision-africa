
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
    profile_description: string;
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
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          sections (
            id,
            title,
            order,
            lessons (
              id,
              title,
              description,
              video_url,
              duration_minutes,
              order
            )
          ),
          author:profiles (
            id,
            full_name,
            avatar_url,
            profile_description
          )
        `)
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      // Ensure the course data has the required image_url property
      const enrichedCourse: Course = {
        ...courseData,
        image_url: courseData.image_url || courseData.thumbnail_url || undefined,
        sections: courseData.sections || [],
        author: courseData.author || {
          id: courseData.creator_id || '',
          full_name: 'Unknown Author',
          avatar_url: '',
          profile_description: ''
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
      const { data: reviewData, error: reviewError } = await supabase
        .from('course_reviews')
        .select(`
          *,
          user:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (reviewError) throw reviewError;

      // Transform the data to match our Review interface
      const transformedReviews: Review[] = (reviewData || []).map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.review_text || '', // Map review_text to comment
        created_at: review.created_at,
        user: review.user || {
          id: '',
          full_name: 'Anonymous',
          avatar_url: ''
        }
      }));

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
          review_text: reviewText, // Use review_text instead of comment
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
        <Card className="w-full max-w-4xl mx-auto">
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
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4">Course Not Found</h2>
            <p className="text-gray-600">The course you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            {course.image_url && (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-64 object-cover rounded-t-md"
              />
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{course.title}</CardTitle>
              <CardDescription>
                <ReactMarkdown>{course.description}</ReactMarkdown>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {/* Course Sections and Lessons */}
              <Accordion type="single" collapsible className="w-full">
                {course.sections.sort((a, b) => a.order - b.order).map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                    <AccordionContent className="py-2">
                      <ul className="space-y-2">
                        {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                          <li key={lesson.id} className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium">{lesson.title}</h5>
                              <p className="text-sm text-gray-500">{lesson.description}</p>
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

              <Separator className="my-6" />

              {/* Reviews Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Reviews</h3>

                {/* Review Submission */}
                {user && (
                  <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add a Review</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Submit a Review</DialogTitle>
                        <DialogDescription>
                          Share your thoughts about this course.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="rating" className="text-right">
                            Rating
                          </Label>
                          <Input
                            type="number"
                            id="rating"
                            defaultValue="5"
                            min="1"
                            max="5"
                            className="col-span-3"
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="comment" className="text-right mt-2">
                            Comment
                          </Label>
                          <Textarea
                            id="comment"
                            className="col-span-3"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleSubmitReview} disabled={submittingReview}>
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
                      <li key={review.id} className="border rounded-md p-4">
                        <div className="flex items-center space-x-4 mb-2">
                          <Avatar>
                            <AvatarImage src={review.user.avatar_url} />
                            <AvatarFallback>{review.user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h6 className="font-medium">{review.user.full_name}</h6>
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
        <CourseDetailActions
          course={course}
          isEnrolled={isEnrolled}
          enrollmentCount={enrollmentCount}
          rating={rating}
          reviewCount={reviewCount}
        />
      </div>
    </div>
  );
};

export default CourseDetailPage;
