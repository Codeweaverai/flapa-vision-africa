
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CSVLink } from 'react-csv';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RegistrationEditDialog from '@/components/admin/RegistrationEditDialog';
import { supabase } from '@/lib/supabaseClient';

type RegistrationType = 'event' | 'course' | 'all';

interface RegistrationItem {
  id: string;
  user_id: string;
  entity_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string;
  user_fullname: string;
  user_email: string;
  title: string;
  date: string;
  type: 'event' | 'course';
}

interface RegistrationsTableProps {
  data: RegistrationItem[];
  loading: boolean;
  type: RegistrationType;
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ data, loading, type }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleEdit = (registration: RegistrationItem) => {
    setSelectedRegistration(registration);
    setIsEditDialogOpen(true);
  };

  const handleStatusUpdate = async (registrationId: string, newStatus: string, registrationType: 'event' | 'course') => {
    try {
      if (registrationType === 'event') {
        await supabase
          .from('registrations')
          .update({ status: newStatus })
          .eq('id', registrationId);
      } else {
        // For course enrollments, update the corresponding field
        await supabase
          .from('course_enrollments')
          .update({ 
            is_completed: newStatus === 'completed',
            completion_date: newStatus === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', registrationId);
      }
      
      toast.success('Registration status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePaymentStatusUpdate = async (registrationId: string, newStatus: string, registrationType: 'event' | 'course') => {
    try {
      if (registrationType === 'event') {
        await supabase
          .from('registrations')
          .update({ payment_status: newStatus })
          .eq('id', registrationId);
      } else {
        await supabase
          .from('course_enrollments')
          .update({ payment_status: newStatus })
          .eq('id', registrationId);
      }
      
      toast.success('Payment status updated');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const filteredData = data.filter(item => {
    const searchString = searchTerm.toLowerCase();
    return (
      item.user_fullname.toLowerCase().includes(searchString) ||
      item.user_email.toLowerCase().includes(searchString) ||
      item.title.toLowerCase().includes(searchString) ||
      item.status.toLowerCase().includes(searchString) ||
      item.payment_status.toLowerCase().includes(searchString)
    );
  });

  const csvData = filteredData.map(item => ({
    ID: item.id,
    Type: item.type,
    Name: item.title,
    Date: item.date,
    User: item.user_fullname,
    Email: item.user_email,
    Status: item.status,
    'Payment Status': item.payment_status,
    'Payment Amount': item.payment_amount,
    'Payment Currency': item.payment_currency,
    'Payment Method': item.payment_method,
    'Registration Date': format(new Date(item.created_at), 'PPP')
  }));

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'active':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'free':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search registrations..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <div>
          <CSVLink
            data={csvData}
            filename={`${type}-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            className="inline-flex"
          >
            <Button variant="outline" size="sm" className="ml-2">
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CSVLink>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading registrations...</div>
      ) : filteredData.length === 0 ? (
        <div className="py-8 text-center">No registrations found.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {type === 'all' && <TableHead>Type</TableHead>}
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((registration) => (
                <TableRow key={`${registration.type}-${registration.id}`}>
                  {type === 'all' && (
                    <TableCell>
                      <Badge variant="outline">
                        {registration.type === 'event' ? 'Event' : 'Course'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{registration.title}</TableCell>
                  <TableCell>{registration.date}</TableCell>
                  <TableCell>
                    <div>
                      <div>{registration.user_fullname}</div>
                      <div className="text-sm text-gray-500">{registration.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(registration.status)}>
                      {registration.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusBadgeColor(registration.payment_status)}>
                      {registration.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {registration.payment_amount ? 
                      `${registration.payment_currency || 'USD'} ${registration.payment_amount}` : 
                      'Free'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(registration.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(registration)}>
                          Edit Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuLabel>Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(registration.id, 'confirmed', registration.type)}>
                          Mark as Confirmed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(registration.id, 'cancelled', registration.type)}>
                          Mark as Cancelled
                        </DropdownMenuItem>
                        {registration.type === 'course' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(registration.id, 'completed', registration.type)}>
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuLabel>Payment</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handlePaymentStatusUpdate(registration.id, 'paid', registration.type)}>
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePaymentStatusUpdate(registration.id, 'pending', registration.type)}>
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePaymentStatusUpdate(registration.id, 'failed', registration.type)}>
                          Mark as Failed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedRegistration && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Registration</DialogTitle>
              <DialogDescription>
                Update registration details for {selectedRegistration.title}
              </DialogDescription>
            </DialogHeader>
            <RegistrationEditDialog 
              registration={selectedRegistration}
              onClose={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RegistrationsTable;
