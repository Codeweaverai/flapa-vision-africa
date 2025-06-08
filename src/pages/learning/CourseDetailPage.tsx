import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Clock, Users, BookOpen, CheckCircle, Download, Smartphone, Award, PlayCircle, ShoppingCart } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourseById, fetchLearningOutcomes, fetchEnrollmentStatus, fetchCourseEnrollmentCount } from '@/services/courseService';
import { Course, LearningOutcome } from '@/types/Course';
import Layout from '@/components/layout/Layout';
import CourseModuleList from '@/components/course/CourseModuleList';
import CourseReviewsTab from '@/components/course/CourseReviewsTab';
import CourseEnrollmentButton from '@/components/course/CourseEnrollmentButton';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [userEnrollment, setUserEnrollment] = useState<boolean>(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const loadCourseDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!courseId) {
          throw new Error('Course ID is missing');
        }

        const courseData = await fetchCourseById(courseId);
        if (!courseData) {
          throw new Error('Course not found');
        }
        setCourse(courseData);

        const outcomesData = await fetchLearningOutcomes(courseId);
        setLearningOutcomes(outcomesData);

        if (user) {
          const enrollmentStatus = await fetchEnrollmentStatus(courseId, user.id);
          setUserEnrollment(enrollmentStatus);
        }

        const count = await fetchCourseEnrollmentCount(courseId);
        setEnrollmentCount(count);

      } catch (err: any) {
        setError(err.message || 'Failed to load course details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCourseDetails();
  }, [courseId, user]);

  const handleAddToCart = async () => {
    if (!course || course.is_free) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart({
        id: course.id,
        name: course.title,
        price: course.price || 0,
        type: 'course',
        quantity: 1
      });
      toast.success('Course added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add course to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const renderEnrollmentSection = () => {
    if (userEnrollment) {
      return (
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link to={`/learning/course/${course.id}`}>
            <BookOpen className="mr-2 h-5 w-5" />
            Continue Learning
          </Link>
        </Button>
      );
    }

    if (course.is_free) {
      return (
        <CourseEnrollmentButton
          courseId={course.id}
          courseName={course.title}
          isFree={true}
          price={0}
          currency="USD"
          isUserEnrolled={!!userEnrollment}
          creatorId={course.creator_id}
          className="w-full"
        />
      );
    }

    return (
      <div className="space-y-3">
        <CourseEnrollmentButton
          courseId={course.id}
          courseName={course.title}
          isFree={false}
          price={course.price || 0}
          currency="USD"
          isUserEnrolled={!!userEnrollment}
          creatorId={course.creator_id}
          className="w-full"
        />
        
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          variant="outline"
          className="w-full"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
                      <p className="text-gray-600 text-lg">{course.summary}</p>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {course.difficulty_level}
                    </Badge>
                  </div>

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration_minutes} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {enrollmentCount} students
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.category}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Course Video Preview */}
              {course.thumbnail_url && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Course Preview</h3>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <ReactPlayer
                        url={course.thumbnail_url}
                        width="100%"
                        height="100%"
                        controls={true}
                        config={{
                          file: {
                            attributes: {
                              controlsList: 'nodownload'
                            }
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Description */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Course Description</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">{course.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Outcomes */}
              {learningOutcomes.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                    <ul className="space-y-2">
                      {learningOutcomes.map((outcome) => (
                        <li key={outcome.id} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{outcome.outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Course Content/Modules */}
              <CourseModuleList courseId={course.id} />

              {/* Reviews Section */}
              <CourseReviewsTab courseId={course.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl sticky top-4">
                <CardContent className="p-6">
                  <div className="mb-6">
                    {course.is_free ? (
                      <div className="text-center">
                        <span className="text-3xl font-bold text-green-600">FREE</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl font-bold text-purple-600">
                          ${course.price}
                        </span>
                        <span className="text-gray-500 ml-1">USD</span>
                      </div>
                    )}
                  </div>

                  {renderEnrollmentSection()}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold mb-3">This course includes:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        {course.duration_minutes} minutes of video content
                      </li>
                      <li className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Downloadable resources
                      </li>
                      <li className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Access on mobile and desktop
                      </li>
                      {course.certificate_enabled && (
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Certificate of completion
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Info Card */}
              {course.creator && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {course.creator.avatar_url ? (
                        <img
                          src={course.creator.avatar_url}
                          alt={course.creator.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {course.creator.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{course.creator.full_name}</h4>
                        <p className="text-sm text-gray-500">Creator</p>
                      </div>
                    </div>
                    <p className="text-gray-700">{course.creator.bio || 'No bio available.'}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
