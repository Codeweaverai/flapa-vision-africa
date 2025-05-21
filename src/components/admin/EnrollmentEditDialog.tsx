
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CourseEnrollment } from './EnrollmentsTable';

interface EnrollmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: CourseEnrollment;
  onSave: (enrollment: CourseEnrollment) => void;
}

const EnrollmentEditDialog = ({
  isOpen,
  onClose,
  enrollment,
  onSave,
}: EnrollmentEditDialogProps) => {
  const [updatedEnrollment, setUpdatedEnrollment] = useState<CourseEnrollment>(enrollment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (value: string) => {
    setUpdatedEnrollment((prev) => ({
      ...prev,
      payment_status: value,
    }));
  };

  const handleCompletionChange = (checked: boolean) => {
    setUpdatedEnrollment((prev) => ({
      ...prev,
      is_completed: checked,
      completion_date: checked ? new Date().toISOString() : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(updatedEnrollment);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Enrollment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Input 
                value={enrollment.profiles?.full_name || 'Unknown'} 
                disabled
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Course</Label>
              <Input 
                value={enrollment.courses?.title || 'Unknown Course'} 
                disabled
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={updatedEnrollment.payment_status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="enrollment_date">Enrollment Date</Label>
              <Input
                id="enrollment_date"
                type="date"
                value={updatedEnrollment.enrollment_date.split('T')[0]}
                disabled
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="is_completed">Mark as Completed</Label>
              <Switch
                id="is_completed"
                checked={updatedEnrollment.is_completed}
                onCheckedChange={handleCompletionChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentEditDialog;
