
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';
import CreatorCoursePagination from '@/components/creator/CreatorCoursePagination';

const CreatorCourses = () => {
  const navigate = useNavigate();

  const handleEditCourse = (courseId: string) => {
    navigate(`/creator/courses/edit/${courseId}`);
  };

  const handleViewContent = (courseId: string) => {
    navigate(`/creator/courses/${courseId}/content`);
  };

  const handlePublishToggle = async (courseId: string, isPublished: boolean) => {
    // This will be handled by the pagination component
    window.location.reload(); // Temporary solution to refresh the data
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">Manage and create your educational content</p>
            </div>
            <Button onClick={() => navigate('/creator/courses/create')} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>

          <CreatorCoursePagination
            onEditCourse={handleEditCourse}
            onViewContent={handleViewContent}
            onPublishToggle={handlePublishToggle}
          />
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourses;
