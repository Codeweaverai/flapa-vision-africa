
import React from 'react';
import Layout from '@/components/layout/Layout';
import InboxComponent from '@/components/inbox/InboxComponent';

const InboxPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">Manage your messages and conversations</p>
        </div>
        <InboxComponent />
      </div>
    </Layout>
  );
};

export default InboxPage;
