import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Trash2, Eye, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Registration } from '@/services/eventService';

const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<(Registration & {event_title?: string, user_name?: string, user_email?: string})[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [deleteRegistrationId, setDeleteRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          events:event_id (id, title),
          profiles:user_id (id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format the data to include event title and user info
      const formattedRegistrations = data.map(registration => ({
        ...registration,
        event_title: registration.events?.title,
        // Use optional chaining to safely access properties
        user_name: registration.profiles?.full_name || 'Unknown',
        user_email: registration.profiles?.email || 'Unknown'
      }));

      setRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update state after successful deletion
      setRegistrations(prevRegistrations => 
        prevRegistrations.filter(reg => reg.id !== id)
      );
      
      toast.success('Registration deleted successfully');
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    } finally {
      setDeleteRegistrationId(null);
    }
  };

  // Filter registrations based on search term and filters
  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      searchTerm === '' || 
      (registration.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (registration.user_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (registration.event_title?.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = 
      statusFilter === 'all' || 
      registration.status === statusFilter;
      
    const matchesPaymentStatus = 
      paymentStatusFilter === 'all' || 
      registration.payment_status === paymentStatusFilter;
      
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const exportToCsv = () => {
    if (filteredRegistrations.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Create CSV headers
    const headers = ['ID', 'User', 'Email', 'Event', 'Status', 'Payment Status', 'Amount', 'Date', 'Phone Number'];
    
    // Format data for CSV
    const data = filteredRegistrations.map(reg => [
      reg.id,
      reg.user_name || 'N/A',
      reg.user_email || 'N/A',
      reg.event_title || 'N/A',
      reg.status || 'N/A',
      reg.payment_status || 'N/A',
      reg.payment_amount ? `${reg.payment_currency} ${reg.payment_amount}` : 'N/A',
      new Date(reg.created_at || '').toLocaleDateString(),
      reg.phone_number || 'N/A'
    ]);
    
    // Combine headers and data
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Registrations</h1>
            <p className="text-muted-foreground">Manage all event registrations and attendees</p>
          </div>
          
          <Button variant="outline" onClick={exportToCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter registrations by status or search for specific records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Registration Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>All Registrations</CardTitle>
            <CardDescription>
              Showing {filteredRegistrations.length} registrations 
              {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all' ? ' (filtered)' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No registrations found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all' ? 
                    'Try adjusting your search or filter criteria' : 
                    'No registrations have been made yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{registration.user_name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{registration.user_email || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{registration.event_title || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            registration.status === 'confirmed' ? 'default' :
                            registration.status === 'pending' ? 'outline' :
                            'destructive'
                          }>
                            {registration.status || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            registration.payment_status === 'paid' ? 'success' :
                            registration.payment_status === 'free' ? 'default' :
                            registration.payment_status === 'pending' ? 'outline' :
                            'destructive'
                          }>
                            {registration.payment_status || 'N/A'}
                          </Badge>
                          {registration.payment_amount && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {registration.payment_currency} {registration.payment_amount}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {registration.created_at ? 
                            new Date(registration.created_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>{registration.phone_number || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteRegistrationId === registration.id}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setDeleteRegistrationId(registration.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Registration</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this registration? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteRegistrationId(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteRegistration(registration.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
