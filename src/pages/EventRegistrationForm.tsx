
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EventRegistrationForm from '@/components/event/EventRegistrationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EventRegistrationFormPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock event data - in real app, fetch from Supabase
  const mockEvent = {
    id: eventId || '',
    title: 'Sample Event',
    description: 'Sample event description',
    price: 50,
    currency: 'USD',
    is_free: false,
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    location: 'Sample Location',
    event_type: 'workshop',
    capacity: 100,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: 'sample-creator-id'
  };

  const handleRegistrationSuccess = () => {
    navigate(`/event/${eventId}`);
  };

  const handleCancel = () => {
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Event Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventRegistrationForm
                event={mockEvent}
                user={user}
                onRegistrationSuccess={handleRegistrationSuccess}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationFormPage;
