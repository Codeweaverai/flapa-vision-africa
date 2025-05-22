
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, FileDown, RefreshCw, Search } from 'lucide-react';
import { CSVLink } from 'react-csv';

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string;
  user_fullname?: string;
  user_email?: string;
  event_title?: string;
  event_date?: string;
}

interface Event {
  id: string;
  title: string;
}

interface ProfileData {
  full_name?: string;
  email?: string;
}

interface EventData {
  title?: string;
  start_time?: string;
}

// Improved type definition for joined data from Supabase
interface RegistrationRecord {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_method?: string;
  payment_id?: string;
  profiles?: ProfileData | null;
  events?: EventData | null;
  [key: string]: any;
}

const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      // Using table joins to get user and event data
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles:user_id (full_name, email),
          events:event_id (title, start_time)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Transform data to match our Registration interface with proper type safety
      const formattedRegistrations: Registration[] = (data || []).map((item: any) => {
        // Handle cases where related data might not be available
        const profileData = item.profiles || {};
        const eventData = item.events || {};
        
        return {
          id: item.id,
          user_id: item.user_id,
          event_id: item.event_id,
          created_at: item.created_at,
          status: item.status || 'pending',
          payment_status: item.payment_status || 'pending',
          payment_amount: item.payment_amount,
          payment_currency: item.payment_currency,
          payment_method: item.payment_method,
          payment_id: item.payment_id,
          user_fullname: profileData.full_name || 'Unknown',
          user_email: profileData.email || 'Unknown',
          event_title: eventData.title || 'Unknown Event',
          event_date: eventData.start_time
        };
      });
      
      setRegistrations(formattedRegistrations);
      setFilteredRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  useEffect(() => {
    filterRegistrations();
  }, [selectedEvent, searchTerm, statusFilter, paymentFilter, activeTab, registrations]);

  const filterRegistrations = () => {
    let filtered = [...registrations];
    
    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(reg => reg.event_id === selectedEvent);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg => 
        (reg.user_email?.toLowerCase().includes(term)) ||
        (reg.user_fullname?.toLowerCase().includes(term)) ||
        (reg.event_title?.toLowerCase().includes(term))
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }
    
    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.payment_status === paymentFilter);
    }
    
    // Filter by tab (registration age)
    if (activeTab === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(reg => new Date(reg.created_at) >= oneWeekAgo);
    }
    
    setFilteredRegistrations(filtered);
  };

  const handleEditRegistration = (registration: Registration) => {
    setSelectedRegistration(registration);
    setDialogOpen(true);
  };

  const handleUpdateRegistration = async () => {
    if (!selectedRegistration) return;
    
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: selectedRegistration.status,
          payment_status: selectedRegistration.payment_status,
        })
        .eq('id', selectedRegistration.id);
        
      if (error) throw error;
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === selectedRegistration.id ? selectedRegistration : reg
      ));
      
      setDialogOpen(false);
      toast.success('Registration updated successfully');
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const exportRegistrationsToCSV = () => {
    // Format the data for CSV export
    const csvData = filteredRegistrations.map(reg => ({
      'Registration ID': reg.id,
      'User': reg.user_fullname,
      'Email': reg.user_email,
      'Event': reg.event_title,
      'Event Date': reg.event_date ? format(new Date(reg.event_date), 'MMM d, yyyy') : 'Unknown',
      'Registration Date': format(new Date(reg.created_at), 'MMM d, yyyy'),
      'Status': reg.status,
      'Payment Status': reg.payment_status,
      'Amount': reg.payment_amount && reg.payment_currency ? `${reg.payment_currency} ${reg.payment_amount}` : 'N/A',
      'Payment Method': reg.payment_method || 'N/A',
    }));
    
    return csvData;
  };

  const csvHeaders = [
    { label: "Registration ID", key: "Registration ID" },
    { label: "User", key: "User" },
    { label: "Email", key: "Email" },
    { label: "Event", key: "Event" },
    { label: "Event Date", key: "Event Date" },
    { label: "Registration Date", key: "Registration Date" },
    { label: "Status", key: "Status" },
    { label: "Payment Status", key: "Payment Status" },
    { label: "Amount", key: "Amount" },
    { label: "Payment Method", key: "Payment Method" }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Event Registrations</h1>
          <div className="space-x-2">
            <CSVLink 
              data={exportRegistrationsToCSV()} 
              headers={csvHeaders}
              filename={`event-registrations-${new Date().toISOString().split('T')[0]}.csv`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </CSVLink>
            <Button variant="outline" onClick={fetchRegistrations}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter registrations by various criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-filter">Event</Label>
                <Select 
                  value={selectedEvent} 
                  onValueChange={setSelectedEvent}
                >
                  <SelectTrigger id="event-filter">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Registration Status</Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-filter">Payment Status</Label>
                <Select 
                  value={paymentFilter} 
                  onValueChange={setPaymentFilter}
                >
                  <SelectTrigger id="payment-filter">
                    <SelectValue placeholder="All Payment Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Registrations</TabsTrigger>
                <TabsTrigger value="recent">Recent (Last 7 days)</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="border rounded-md p-4">
                <RegistrationsTable 
                  registrations={filteredRegistrations} 
                  loading={loading}
                  onEditRegistration={handleEditRegistration}
                />
              </TabsContent>
              <TabsContent value="recent" className="border rounded-md p-4">
                <RegistrationsTable 
                  registrations={filteredRegistrations}
                  loading={loading}
                  onEditRegistration={handleEditRegistration}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update the status of this registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRegistration && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Event</p>
                    <p className="text-sm">{selectedRegistration.event_title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Registrant</p>
                    <p className="text-sm">{selectedRegistration.user_fullname}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Email</p>
                    <p className="text-sm">{selectedRegistration.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Registration Date</p>
                    <p className="text-sm">
                      {format(new Date(selectedRegistration.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Registration Status</Label>
                  <Select 
                    value={selectedRegistration.status} 
                    onValueChange={(value) => setSelectedRegistration({...selectedRegistration, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-status">Payment Status</Label>
                  <Select 
                    value={selectedRegistration.payment_status} 
                    onValueChange={(value) => setSelectedRegistration({...selectedRegistration, payment_status: value})}
                  >
                    <SelectTrigger id="payment-status">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRegistration}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface RegistrationsTableProps {
  registrations: Registration[];
  loading: boolean;
  onEditRegistration: (registration: Registration) => void;
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({ registrations, loading, onEditRegistration }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No registrations found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No registrations match your current filters.
        </p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Registrant</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((registration) => (
          <TableRow key={registration.id}>
            <TableCell>
              <div>
                <p className="font-medium">{registration.user_fullname}</p>
                <p className="text-sm text-muted-foreground">{registration.user_email}</p>
              </div>
            </TableCell>
            <TableCell>{registration.event_title}</TableCell>
            <TableCell>
              <div>
                <p className="text-sm">
                  {registration.event_date ? format(new Date(registration.event_date), 'MMM d, yyyy') : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Registered: {format(new Date(registration.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={
                registration.status === 'confirmed' ? 'default' :
                registration.status === 'cancelled' ? 'destructive' :
                registration.status === 'attended' ? 'success' : 'outline'
              }>
                {registration.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={
                registration.payment_status === 'paid' ? 'success' :
                registration.payment_status === 'failed' ? 'destructive' :
                registration.payment_status === 'refunded' ? 'secondary' : 'outline'
              }>
                {registration.payment_status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onEditRegistration(registration)}>
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AdminRegistrations;
