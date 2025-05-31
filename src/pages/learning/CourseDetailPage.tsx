
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { fetchCourseDetails, fetchCourseWithModulesAndLessons, CourseDetail, CoursePreview } from '@/services/courseService';
import VideoPlayer from '@/components/video/VideoPlayer';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [coursePreview, setCoursePreview] = useState<CoursePreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseDetail = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const detail = await fetchCourseDetails(courseId);
        setCourseDetail(detail);

        // Extract preview from course details
        if (detail?.course_preview) {
          setCoursePreview(detail.course_preview);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourseDetail();
  }, [courseId]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading course details...</p>
        </div>
      </Layout>
    );
  }

  if (!courseDetail) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Course not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4">
          <Link to="/" className="text-blue-500 hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/learning" className="text-blue-500 hover:underline">
            Learning
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{courseDetail.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Preview Video */}
            {coursePreview?.preview_video_url && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Course Preview</h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <VideoPlayer
                    src={coursePreview.preview_video_url}
                    controls={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Course Details Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{courseDetail.title}</CardTitle>
                <CardDescription>{courseDetail.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge>{courseDetail.category}</Badge>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (courseDetail.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">
                      ({courseDetail.ratingCount || 0} ratings)
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold">Description</h4>
                  <p className="text-gray-700">{courseDetail.description}</p>
                </div>
              </CardContent>
            </div>

            {/* Learning Outcomes Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">What You'll Learn</h3>
              <ul className="list-disc pl-5 space-y-2">
                {courseDetail.learning_outcomes?.map((outcome, index) => (
                  <li key={index} className="text-gray-700">
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews Section (Example) */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Reviews</h3>
              <p className="text-gray-700">No reviews yet.</p>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enroll Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {courseDetail.is_free ? 'Free' : `$${courseDetail.price}`}
                </div>
                <Button className="w-full">
                  {courseDetail.is_free ? 'Start Learning' : 'Enroll Now'}
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Info (Example) */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Instructor name here</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
