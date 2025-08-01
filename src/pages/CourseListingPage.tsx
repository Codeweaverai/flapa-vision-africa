
import React from 'react';
import Layout from '@/components/layout/Layout';

const CourseListingPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Courses</h1>
            <p className="text-xl text-gray-600">
              Explore our comprehensive course catalog
            </p>
          </div>
          
          <div className="text-center py-20">
            <p className="text-gray-500">Course listing coming soon...</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseListingPage;
