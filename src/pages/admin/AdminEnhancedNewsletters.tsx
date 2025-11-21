
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EnhancedNewsletterForm from '@/components/admin/EnhancedNewsletterForm';

const AdminEnhancedNewsletters = () => {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<any[]>([]);

  const handleNewsletterSent = () => {
    // Reset selections after newsletter is sent
    setSelectedRecipients([]);
    setSelectedContent([]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Newsletter</h1>
          <p className="text-muted-foreground">
            Create engaging newsletters using beautiful templates and dynamic content
          </p>
        </div>
        <EnhancedNewsletterForm 
          selectedRecipients={selectedRecipients}
          selectedContent={selectedContent}
          onNewsletterSent={handleNewsletterSent}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminEnhancedNewsletters;
