
import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';

const AdminEnhancedNewsletters = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Newsletter</h1>
          <p className="text-muted-foreground">
            Create engaging newsletters using beautiful templates and dynamic content
          </p>
        </div>
        <EnhancedNewsletterForm />
      </div>
    </AdminLayout>
  );
};

export default AdminEnhancedNewsletters;
