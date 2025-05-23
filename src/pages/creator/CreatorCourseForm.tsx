
import React from "react";
import CourseForm from "@/components/creator/CourseForm";
import { useAuth } from "@/contexts/AuthContext";
import CreatorLayout from "@/components/creator/CreatorLayout";

const CreatorCourseForm = () => {
  const { user } = useAuth();
  
  return (
    <CreatorLayout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Manage Course</h1>
        <CourseForm isCreator={true} creatorId={user?.id} />
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseForm;
