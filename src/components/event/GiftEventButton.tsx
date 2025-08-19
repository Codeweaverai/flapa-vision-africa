
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import GiftEventModal from '@/components/gifts/GiftEventModal';

interface GiftEventButtonProps {
  event: {
    id: string;
    title: string;
    start_time: string;
    location: string;
  };
  ticket: {
    id: string;
    name: string;
    price: number;
  };
}

const GiftEventButton: React.FC<GiftEventButtonProps> = ({ event, ticket }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="border-orange-200 text-orange-700 hover:bg-orange-50"
      >
        <Gift className="h-4 w-4 mr-2" />
        Gift This Ticket
      </Button>
      
      <GiftEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
        ticket={ticket}
      />
    </>
  );
};

export default GiftEventButton;
