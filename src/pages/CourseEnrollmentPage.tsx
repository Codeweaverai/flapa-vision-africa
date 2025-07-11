
import React from 'react';
import { useParams } from 'react-router-dom';

const CourseEnrollmentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Course Enrollment</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Enrollment for course ID: {courseId}</p>
          <p className="mt-4">Course enrollment functionality is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollmentPage;
