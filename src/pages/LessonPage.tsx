
import React from 'react';
import { useParams } from 'react-router-dom';

const LessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Lesson</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Course ID: {courseId}</p>
          <p className="text-gray-600">Lesson ID: {lessonId}</p>
          <p className="mt-4">Individual lesson page is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
