
import React from 'react';
import { useParams } from 'react-router-dom';

const CourseEnrollmentPage = () => {
  const { courseId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Enrollment</h1>
      <p>Enrolling in course: {courseId}</p>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Course enrollment functionality will be implemented here.</p>
      </div>
    </div>
  );
};

export default CourseEnrollmentPage;
