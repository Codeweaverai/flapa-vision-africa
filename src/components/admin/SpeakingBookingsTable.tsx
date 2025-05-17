
import { useState } from 'react';
import { Calendar, Edit } from 'lucide-react';
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

interface SpeakingBooking {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  organization: string;
  event_type: string;
  event_date: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

interface SpeakingBookingsTableProps {
  bookings: SpeakingBooking[];
  loading: boolean;
  onUpdateStatus: (bookingId: string, status: 'pending' | 'approved' | 'rejected' | 'completed') => void;
}

const SpeakingBookingsTable = ({ bookings, loading, onUpdateStatus }: SpeakingBookingsTableProps) => {
  const [selectedBooking, setSelectedBooking] = useState<SpeakingBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');

  const handleOpenDialog = (booking: SpeakingBooking) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'default';
      case 'pending':
      default:
        return 'outline';
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
        <h3 className="text-lg font-medium mb-2">No speaking requests found</h3>
        <p className="text-muted-foreground">
          There are no speaking or media appearance requests matching your search criteria.
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
                <TableHead>Requester</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{booking.organization}</TableCell>
                  <TableCell>{booking.event_type}</TableCell>
                  <TableCell>{formatDate(booking.event_date)}</TableCell>
                  <TableCell>{formatDate(booking.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status) as any}>
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
              <DialogTitle>Update Speaking Request Status</DialogTitle>
              <DialogDescription>
                Update the status for the speaking request from {selectedBooking.name} at {selectedBooking.organization}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <p><strong>Event Type:</strong> {selectedBooking.event_type}</p>
                <p><strong>Event Date:</strong> {formatDate(selectedBooking.event_date)}</p>
              </div>
              
              {selectedBooking.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 p-2 bg-muted rounded-md text-sm">
                    {selectedBooking.description}
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="status-select">Select Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={(value) => setSelectedStatus(value as any)}
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

export default SpeakingBookingsTable;
