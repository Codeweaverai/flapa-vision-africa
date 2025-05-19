
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Download, Edit, Trash2 } from 'lucide-react';
import { CSVLink } from 'react-csv';
import { CombinedRegistration } from '@/types/eventTypes';

interface EventRegistrationsTableProps {
  registrations: CombinedRegistration[];
  loading: boolean;
  onEdit?: (registration: CombinedRegistration) => void;
  onDelete?: (registration: CombinedRegistration) => void;
  isCreator?: boolean;
}

const EventRegistrationsTable: React.FC<EventRegistrationsTableProps> = ({
  registrations,
  loading,
  onEdit,
  onDelete,
  isCreator = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegistrations = registrations.filter((reg) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reg.user?.email?.toLowerCase().includes(searchLower) ||
      reg.user?.full_name?.toLowerCase().includes(searchLower) ||
      reg.phone_number?.toLowerCase().includes(searchLower) ||
      reg.status?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'free':
        return <Badge variant="secondary">Free</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getExportData = () => {
    return filteredRegistrations.map(reg => ({
      'Full Name': reg.user?.full_name || 'N/A',
      'Email': reg.user?.email || 'N/A',
      'Phone Number': reg.phone_number || 'N/A',
      'Mobile Operator': reg.mobile_operator || 'N/A',
      'Registration Date': formatDate(reg.created_at),
      'Status': reg.status,
      'Payment Status': reg.payment_status,
      'Payment Amount': reg.payment_amount || 'Free',
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No registrations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search registrations..."
            className="px-4 py-2 border rounded-md w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CSVLink
          data={getExportData()}
          filename="registrations.csv"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </CSVLink>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell>
                  <div className="font-medium">{registration.user?.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{registration.user?.email || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <div>{registration.phone_number || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{registration.mobile_operator || 'N/A'}</div>
                </TableCell>
                <TableCell>{formatDate(registration.created_at)}</TableCell>
                <TableCell>{getStatusBadge(registration.status)}</TableCell>
                <TableCell>
                  {getPaymentStatusBadge(registration.payment_status)}
                  {registration.payment_amount && registration.payment_status !== 'free' && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {registration.payment_amount} {registration.payment_currency || 'USD'}
                    </div>
                  )}
                </TableCell>
                {(onEdit || onDelete) && (
                  <TableCell className="text-right">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(registration)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(registration)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EventRegistrationsTable;
