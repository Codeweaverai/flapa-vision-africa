import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModernInboxComponent from '@/components/inbox/ModernInboxComponent';
import { Link } from 'react-router-dom';

const InboxPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {/* Gradient Back Button with Link */}
          <Link to="/">
            <Button className="mb-6 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            SkillPulse Chat
          </h1>
          <p className="text-gray-600 mt-2">Connect with learners, creators, and experts in real-time</p>
        </div>
        <ModernInboxComponent />
      </div>
    </div>
  );
};

export default InboxPage;
