
import React from 'react';
import Layout from '@/components/layout/Layout';
import ModernInboxComponent from '@/components/inbox/ModernInboxComponent';

const InboxPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              SkillPulse Chat
            </h1>
            <p className="text-gray-600 mt-2">Connect with learners, creators, and experts</p>
          </div>
          <ModernInboxComponent />
        </div>
      </div>
    </Layout>
  );
};

export default InboxPage;
