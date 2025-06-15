
import React from 'react';
import { useParams } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import EventForm from '@/pages/admin/EventForm';

const CreatorEventEdit: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  return (
    <CreatorLayout title="Edit Event">
      <EventForm isCreator={true} />
    </CreatorLayout>
  );
};

export default CreatorEventEdit;
