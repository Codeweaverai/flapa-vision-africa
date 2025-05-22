
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CombinedRegistration {
  id: string;
  type: 'event' | 'course';
  title: string;
  date: string;
  user_name: string;
  user_email: string;
  status?: string;
  payment_status?: string;
  user_id: string;
  event_id?: string;
  course_id?: string;
}

interface RegistrationsTableProps {
  registrations: CombinedRegistration[];
  onUpdateStatus?: (id: string, type: 'event' | 'course', status: string) => Promise<void>;
}

export const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ 
  registrations, 
  onUpdateStatus 
}) => {
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenDialog = (registration: CombinedRegistration) => {
    setSelectedRegistration(registration);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRegistration(null);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRegistration || !onUpdateStatus) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedRegistration.id, selectedRegistration.type, status);
      toast.success(`Registration status updated to ${status}`);
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'paid':
        return 'bg-green-500';
      case 'free':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'in progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={`${registration.type}-${registration.id}`}>
              <TableCell className="capitalize">
                {registration.type}
              </TableCell>
              <TableCell>
                {registration.title}
              </TableCell>
              <TableCell>
                {registration.user_name}
                <div className="text-xs text-gray-500">{registration.user_email}</div>
              </TableCell>
              <TableCell>
                {registration.date && format(new Date(registration.date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeVariant(registration.status)}>
                  {registration.status || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeVariant(registration.payment_status)}>
                  {registration.payment_status || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => handleOpenDialog(registration)}>
                  Manage
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {registrations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No registrations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Registration</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="capitalize">{selectedRegistration.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Title</p>
                  <p>{selectedRegistration.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p>{selectedRegistration.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedRegistration.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p>{selectedRegistration.date && format(new Date(selectedRegistration.date), 'PP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={getStatusBadgeVariant(selectedRegistration.status)}>
                    {selectedRegistration.status || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment</p>
                  <Badge className={getStatusBadgeVariant(selectedRegistration.payment_status)}>
                    {selectedRegistration.payment_status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {selectedRegistration.type === 'event' && onUpdateStatus && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Update Status</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus('confirmed')}
                      disabled={isUpdating}
                    >
                      Confirm
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedRegistration.type === 'course' && onUpdateStatus && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Update Status</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus('paid')}
                      disabled={isUpdating}
                    >
                      Mark Paid
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus('completed')}
                      disabled={isUpdating}
                    >
                      Mark Completed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus('cancelled')}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" onClick={handleCloseDialog} disabled={isUpdating}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationsTable;
