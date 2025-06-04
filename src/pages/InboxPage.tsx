
import React from 'react';
import Layout from '@/components/layout/Layout';
import InboxComponent from '@/components/inbox/InboxComponent';

const InboxPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">Send and receive messages from other users</p>
        </div>
        <InboxComponent />
      </div>
    </Layout>
  );
};

export default InboxPage;
