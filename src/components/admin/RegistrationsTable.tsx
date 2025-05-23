
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RegistrationItem } from '@/types/eventTypes';
import { Link } from 'react-router-dom';

interface RegistrationsTableProps {
  data: RegistrationItem[];
  loading?: boolean;
  type: 'event' | 'course' | 'all';
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ 
  data, 
  loading = false,
  type
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  
  const filteredData = data.filter(item => {
    // Apply search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.user_fullname?.toLowerCase().includes(searchLower) || 
      item.user_email?.toLowerCase().includes(searchLower) ||
      item.title?.toLowerCase().includes(searchLower) ||
      (item.ticket_number && item.ticket_number.toLowerCase().includes(searchLower));
    
    // Apply status filter
    const matchesStatus = !statusFilter || item.status === statusFilter;
    
    // Apply payment filter
    const matchesPayment = !paymentFilter || item.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'free':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Free</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or event..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={statusFilter === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          All Statuses
        </Button>
        <Button 
          variant={statusFilter === 'confirmed' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter('confirmed')}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" /> Confirmed
        </Button>
        <Button 
          variant={statusFilter === 'pending' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter('pending')}
          className="flex items-center gap-1"
        >
          <Calendar className="h-3 w-3" /> Pending
        </Button>
        <Button 
          variant={statusFilter === 'cancelled' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setStatusFilter('cancelled')}
          className="flex items-center gap-1"
        >
          <Ban className="h-3 w-3" /> Cancelled
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={paymentFilter === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPaymentFilter(null)}
        >
          All Payments
        </Button>
        <Button 
          variant={paymentFilter === 'completed' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPaymentFilter('completed')}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" /> Paid
        </Button>
        <Button 
          variant={paymentFilter === 'pending' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPaymentFilter('pending')}
          className="flex items-center gap-1"
        >
          <Calendar className="h-3 w-3" /> Pending
        </Button>
        <Button 
          variant={paymentFilter === 'free' ? "secondary" : "outline"}
          size="sm"
          onClick={() => setPaymentFilter('free')}
        >
          Free
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>{type === 'course' ? 'Course' : 'Event'}</TableHead>
              <TableHead>Date</TableHead>
              {type === 'event' && <TableHead>Ticket #</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading registrations...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.user_fullname || 'Unknown'}</TableCell>
                  <TableCell>{item.user_email || 'Unknown'}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    {format(new Date(item.date), 'MMM d, yyyy')}
                  </TableCell>
                  {type === 'event' && (
                    <TableCell>{item.ticket_number || 'N/A'}</TableCell>
                  )}
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(item.payment_status)}</TableCell>
                  <TableCell className="text-right">
                    {item.type === 'event' ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/events/${item.entity_id}/ticket/${item.id}`}>
                          View Ticket
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegistrationsTable;
