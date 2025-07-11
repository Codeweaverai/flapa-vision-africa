
import React from 'react';
import { useParams } from 'react-router-dom';

const LessonPage = () => {
  const { courseId, lessonId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Lesson</h1>
      <p>Course: {courseId}</p>
      <p>Lesson: {lessonId}</p>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Lesson content will be displayed here.</p>
      </div>
    </div>
  );
};

export default LessonPage;
