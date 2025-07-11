
import React from 'react';
import { useParams } from 'react-router-dom';

const MessagesPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Messages with user ID: {userId}</p>
          <p className="mt-4">Messaging functionality is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
