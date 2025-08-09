
import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';

const AdminNewsletters = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Create Enhanced Newsletter
          </h1>
          <p className="text-gray-600">
            Create engaging newsletters with dynamic content including courses, events, and creator spotlights
          </p>
        </div>
        <EnhancedNewsletterForm />
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletters;
