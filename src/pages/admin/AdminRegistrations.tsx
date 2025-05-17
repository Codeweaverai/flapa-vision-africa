
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download, Search } from 'lucide-react';
import { Event, Registration } from '@/services/eventService';
import * as XLSX from 'xlsx';

interface EventWithRegistrations extends Event {
  registrations_count: number;
}

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchRegistrations(selectedEvent);
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Get events with registration counts
      const { data, error } = await supabase
        .from('events')
        .select('*, registrations:registrations(count)')
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include registration counts
      const eventsWithCounts = data.map(event => ({
        ...event,
        registrations_count: event.registrations[0]?.count || 0
      })) as EventWithRegistrations[];
      
      setEvents(eventsWithCounts);
      fetchRegistrations('all');
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (eventId: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('registrations')
        .select(`
          *,
          events(*),
          profiles:user_id(full_name, email:username)
        `)
        .order('created_at', { ascending: false });
      
      if (eventId !== 'all') {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setRegistrations(data as unknown as Registration[]);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (registrationId: string, status: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status, payment_status: paymentStatus })
        .eq('id', registrationId);
      
      if (error) throw error;
      
      toast.success('Registration updated successfully');
      fetchRegistrations(selectedEvent);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId);
      
      if (error) throw error;
      
      toast.success('Registration deleted successfully');
      fetchRegistrations(selectedEvent);
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  const exportAttendees = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Filter registrations for the selected event
    const filteredRegistrations = registrations.filter(reg => reg.event_id === eventId);
    
    // Convert to Excel format
    const exportData = filteredRegistrations.map((reg: any) => ({
      'Name': reg.profiles?.full_name || 'Unknown',
      'Email': reg.profiles?.email || 'Unknown',
      'Phone': reg.phone_number || 'Not provided',
      'Status': reg.status,
      'Payment Status': reg.payment_status,
      'Registration Date': format(parseISO(reg.created_at || new Date().toISOString()), 'MMM d, yyyy')
    }));
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${event.title}-attendees.xlsx`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const filterRegistrations = () => {
    if (!searchQuery) return registrations;
    
    return registrations.filter((reg: any) => {
      const fullName = reg.profiles?.full_name?.toLowerCase() || '';
      const email = reg.profiles?.email?.toLowerCase() || '';
      const phone = reg.phone_number?.toLowerCase() || '';
      const eventTitle = reg.events?.title?.toLowerCase() || '';
      
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        eventTitle.includes(query)
      );
    });
  };
  
  const filteredRegistrations = filterRegistrations();

  return (
    <AdminLayout title="Event Registrations">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Event Registrations</h2>
          <p className="text-muted-foreground">Manage event registrations and attendees.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-1/2">
          <Label htmlFor="event-filter">Filter by Event</Label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger id="event-filter">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} ({event.registrations_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, email, or phone..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No registrations found</h3>
          <p className="text-muted-foreground">
            {selectedEvent !== 'all' ? 'No one has registered for this event yet.' : 'There are no event registrations yet.'}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration: any) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{registration.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{registration.profiles?.email || 'No email'}</p>
                        {registration.phone_number && (
                          <p className="text-xs text-muted-foreground">{registration.phone_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{registration.events?.title || 'Unknown Event'}</TableCell>
                    <TableCell>{formatDate(registration.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        registration.status === 'confirmed' ? 'default' : 
                        registration.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }>
                        {registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        registration.payment_status === 'confirmed' ? 'outline' : 
                        registration.payment_status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {registration.is_free ? 'Free' : registration.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteRegistration(registration.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Event Export Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Export Attendees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.filter(event => event.registrations_count > 0).map(event => (
            <Card key={event.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {event.registrations_count} {event.registrations_count === 1 ? 'attendee' : 'attendees'}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => exportAttendees(event.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update the status of this registration.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">{(selectedRegistration as any).events?.title}</h4>
                <p className="text-sm">Attendee: {(selectedRegistration as any).profiles?.full_name || 'Unknown'}</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Registration Status</Label>
                <Select
                  defaultValue={selectedRegistration.status}
                  onValueChange={(value) => {
                    setSelectedRegistration({
                      ...selectedRegistration,
                      status: value
                    });
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select
                  defaultValue={selectedRegistration.payment_status}
                  onValueChange={(value) => {
                    setSelectedRegistration({
                      ...selectedRegistration,
                      payment_status: value
                    });
                  }}
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                if (selectedRegistration) {
                  handleUpdateStatus(
                    selectedRegistration.id, 
                    selectedRegistration.status, 
                    selectedRegistration.payment_status
                  );
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRegistrations;
