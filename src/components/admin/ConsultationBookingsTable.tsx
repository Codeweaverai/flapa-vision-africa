
import { useState } from 'react';
import { Calendar, Edit, Clock } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConsultationBooking } from '@/services/consultationService';
import { format } from 'date-fns';

interface ConsultationBookingsTableProps {
  bookings: ConsultationBooking[];
  loading: boolean;
  onUpdateStatus: (bookingId: string, status: string) => void;
}

const ConsultationBookingsTable = ({ bookings, loading, onUpdateStatus }: ConsultationBookingsTableProps) => {
  const [selectedBooking, setSelectedBooking] = useState<ConsultationBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');

  const handleOpenDialog = (booking: ConsultationBooking) => {
    setSelectedBooking(booking);
    setSelectedStatus(booking.status);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (selectedBooking) {
      onUpdateStatus(selectedBooking.id, selectedStatus);
      setIsDialogOpen(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'; // Changed from 'success' to 'default'
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'secondary';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case 'google_meet':
        return 'Google Meet';
      case 'in_person':
        return 'In Person';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (bookings.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No consultation bookings found</h3>
        <p className="text-muted-foreground">
          There are no consultation bookings matching your search criteria.
        </p>
      </Card>
    );
  }
  
  return (
    <>
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {formatDateTime(booking.scheduled_time)}
                    </div>
                  </TableCell>
                  <TableCell>{getBookingTypeLabel(booking.booking_type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {booking.duration} minutes
                    </div>
                  </TableCell>
                  <TableCell>{booking.topic || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={booking.payment_status === 'paid' ? 'default' : 'outline'}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenDialog(booking)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedBooking && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Consultation Booking Status</DialogTitle>
              <DialogDescription>
                Update the status for the consultation scheduled on {formatDateTime(selectedBooking.scheduled_time)}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <p><strong>Type:</strong> {getBookingTypeLabel(selectedBooking.booking_type)}</p>
                <p><strong>Duration:</strong> {selectedBooking.duration} minutes</p>
                {selectedBooking.topic && <p><strong>Topic:</strong> {selectedBooking.topic}</p>}
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="mt-1 p-2 bg-muted rounded-md text-sm">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="status-select">Select Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleUpdateStatus}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ConsultationBookingsTable;
