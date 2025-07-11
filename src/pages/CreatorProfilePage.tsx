
import React from 'react';
import { useParams } from 'react-router-dom';

const CreatorProfilePage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Creator Profile</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Creator profile for ID: {creatorId}</p>
          <p className="mt-4">This page is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfilePage;
