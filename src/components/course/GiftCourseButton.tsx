
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import GiftCourseModal from '@/components/gifts/GiftCourseModal';

interface GiftCourseButtonProps {
  course: {
    id: string;
    title: string;
    price: number;
  };
}

const GiftCourseButton: React.FC<GiftCourseButtonProps> = ({ course }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        <Gift className="h-4 w-4 mr-2" />
        Gift This Course
      </Button>
      
      <GiftCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={course}
      />
    </>
  );
};

export default GiftCourseButton;
