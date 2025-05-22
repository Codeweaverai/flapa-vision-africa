
import React from "react";
import CourseForm from "@/pages/admin/CourseForm";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";

const CreatorCourseForm = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <div className="section-container">
        <h1 className="text-2xl font-bold mb-6">Manage Course</h1>
        <CourseForm isCreator={true} creatorId={user?.id} />
      </div>
    </Layout>
  );
};

export default CreatorCourseForm;
