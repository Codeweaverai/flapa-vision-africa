
import React from 'react';
import { useParams } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import EventRegistrationsList from '@/components/creator/EventRegistrationsList';

const CreatorEventRegistrations: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  if (!eventId) {
    return (
      <CreatorLayout title="Event Registrations">
        <div className="text-center py-8">
          <p className="text-red-600">Event ID not found</p>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Registrations">
      <EventRegistrationsList eventId={eventId} />
    </CreatorLayout>
  );
};

export default CreatorEventRegistrations;
