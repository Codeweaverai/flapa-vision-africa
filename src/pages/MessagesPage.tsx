
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MessagesPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
        <p className="text-gray-600 mb-4">Messaging functionality coming soon</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default MessagesPage;
