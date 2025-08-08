
import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import NewsletterTemplateManager from '@/components/admin/NewsletterTemplateManager';

const AdminNewsletterTemplates = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Templates</h1>
          <p className="text-muted-foreground">
            Create and manage beautiful newsletter templates for different scenarios
          </p>
        </div>
        <NewsletterTemplateManager />
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletterTemplates;
