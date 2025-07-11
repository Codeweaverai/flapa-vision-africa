
import React from 'react';
import { useParams } from 'react-router-dom';

const MessagesPage = () => {
  const { userId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <p>Messaging with user: {userId}</p>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Message interface will be implemented here.</p>
      </div>
    </div>
  );
};

export default MessagesPage;
