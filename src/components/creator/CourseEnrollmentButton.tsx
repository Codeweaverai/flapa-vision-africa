
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import CourseEnrollmentsList from './CourseEnrollmentsList';

interface CourseEnrollmentButtonProps {
  courseId: string;
  courseTitle: string;
}

const CourseEnrollmentButton = ({ courseId, courseTitle }: CourseEnrollmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Users className="h-4 w-4" />
        Enrollments
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Enrollments - {courseTitle}</DialogTitle>
            <DialogDescription>
              View all enrollments for this course
            </DialogDescription>
          </DialogHeader>
          <CourseEnrollmentsList courseId={courseId} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseEnrollmentButton;
