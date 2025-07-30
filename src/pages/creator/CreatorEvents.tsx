
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import CreatorEventPagination from '@/components/creator/CreatorEventPagination';

const CreatorEvents = () => {
  const navigate = useNavigate();

  const handleEditEvent = (eventId: string) => {
    navigate(`/creator/events/edit/${eventId}`);
  };

  const handleViewRegistrations = (eventId: string) => {
    navigate(`/creator/events/${eventId}/registrations`);
  };

  const handleManageTickets = (eventId: string) => {
    navigate(`/creator/events/${eventId}/tickets`);
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
              <p className="text-gray-600">Manage and create your events and workshops</p>
            </div>
            <Button onClick={() => navigate('/creator/events/create')} className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          <CreatorEventPagination
            onEditEvent={handleEditEvent}
            onViewRegistrations={handleViewRegistrations}
            onManageTickets={handleManageTickets}
          />
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorEvents;
