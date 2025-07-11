
import React from 'react';
import { useParams } from 'react-router-dom';
import CourseDetailPage from './CourseDetailPage';

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  
  return <CourseDetailPage />;
};

export default CourseDetailsPage;
