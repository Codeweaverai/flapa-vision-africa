
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
import { Download, Search, FileSpreadsheet, FileText } from 'lucide-react';
import { Event, Registration, EventBooking } from '@/services/eventService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventWithRegistrations extends Event {
  registrations_count: number;
  bookings_count: number;
  total_attendees: number;
}

// Combined type for both registration types
interface CombinedRegistration {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  phone_number: string | null;
  mobile_operator: string | null;
  source_table: 'registrations' | 'event_bookings'; // Track which table it came from
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  events?: Event;
}

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [registrations, setRegistrations] = useState<CombinedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchRegistrations(selectedEvent);
  }, [selectedEvent, activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Get events with registration counts from both tables
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (eventsError) throw eventsError;
      
      // Get counts from registrations table
      const { data: regCounts, error: regError } = await supabase
        .from('registrations')
        .select('event_id, count')
        .group('event_id');
        
      if (regError) throw regError;
      
      // Get counts from event_bookings table
      const { data: bookingCounts, error: bookingError } = await supabase
        .from('event_bookings')
        .select('event_id, count')
        .group('event_id');
        
      if (bookingError) throw bookingError;
      
      // Process and combine the data
      const eventsWithCounts = eventsData.map(event => {
        // Count from registrations table
        const regCount = regCounts.find(r => r.event_id === event.id)?.count || 0;
        
        // Count from bookings table
        const bookingCount = bookingCounts.find(b => b.event_id === event.id)?.count || 0;
        
        return {
          ...event,
          registrations_count: parseInt(regCount),
          bookings_count: parseInt(bookingCount),
          total_attendees: parseInt(regCount) + parseInt(bookingCount)
        };
      }) as EventWithRegistrations[];
      
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

      // Prepare arrays to hold results from both tables
      let oldRegistrations: CombinedRegistration[] = [];
      let newBookings: CombinedRegistration[] = [];

      // Fetch from registrations table (if showing all or registrations tab)
      if (activeTab === 'all' || activeTab === 'registrations') {
        let regQuery = supabase
          .from('registrations')
          .select(`
            *,
            events(*),
            profiles:user_id(full_name, email:username)
          `)
          .order('created_at', { ascending: false });
        
        if (eventId !== 'all') {
          regQuery = regQuery.eq('event_id', eventId);
        }
        
        const { data: regData, error: regError } = await regQuery;
        
        if (regError) throw regError;
        
        oldRegistrations = regData.map(reg => ({
          ...reg,
          source_table: 'registrations' as const
        }));
      }

      // Fetch from event_bookings table (if showing all or bookings tab)
      if (activeTab === 'all' || activeTab === 'bookings') {
        let bookingQuery = supabase
          .from('event_bookings')
          .select(`
            *,
            events(*),
            profiles:user_id(full_name, email:username)
          `)
          .order('created_at', { ascending: false });
        
        if (eventId !== 'all') {
          bookingQuery = bookingQuery.eq('event_id', eventId);
        }
        
        const { data: bookingData, error: bookingError } = await bookingQuery;
        
        if (bookingError) throw bookingError;
        
        newBookings = bookingData.map(booking => ({
          ...booking,
          source_table: 'event_bookings' as const
        }));
      }

      // Combine both datasets
      const combined = [...oldRegistrations, ...newBookings];
      setRegistrations(combined);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (registration: CombinedRegistration, status: string, paymentStatus: string) => {
    try {
      // Update in the correct table based on source
      const table = registration.source_table;
      
      const { error } = await supabase
        .from(table)
        .update({ status, payment_status: paymentStatus })
        .eq('id', registration.id);
      
      if (error) throw error;
      
      toast.success('Registration updated successfully');
      fetchRegistrations(selectedEvent);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const handleDeleteRegistration = async (registration: CombinedRegistration) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    
    try {
      // Delete from the correct table based on source
      const table = registration.source_table;
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', registration.id);
      
      if (error) throw error;
      
      toast.success('Registration deleted successfully');
      fetchRegistrations(selectedEvent);
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  const exportAttendees = (eventId: string, format: 'xlsx' | 'pdf') => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Filter registrations for the selected event
    const filteredRegistrations = registrations.filter(reg => reg.event_id === eventId);
    
    // Convert to export format
    const exportData = filteredRegistrations.map(reg => ({
      'Name': reg.profiles?.full_name || 'Unknown',
      'Email': reg.profiles?.email || 'Unknown',
      'Phone': reg.phone_number || 'Not provided',
      'Status': reg.status,
      'Payment Status': reg.payment_status,
      'Source': reg.source_table === 'registrations' ? 'Legacy System' : 'New System',
      'Registration Date': formatDate(reg.created_at || new Date().toISOString())
    }));
    
    if (format === 'xlsx') {
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `${event.title}-attendees.xlsx`);
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF();
      
      // Add event title as header
      doc.setFontSize(18);
      doc.text(event.title, 14, 22);
      doc.setFontSize(12);
      doc.text('Attendee List', 14, 32);
      
      // Create the table
      autoTable(doc, {
        head: [['Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Source', 'Registration Date']],
        body: exportData.map(row => [
          row.Name, 
          row.Email, 
          row.Phone, 
          row.Status, 
          row['Payment Status'],
          row.Source,
          row['Registration Date']
        ]),
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });
      
      // Save the PDF
      doc.save(`${event.title}-attendees.pdf`);
    }
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
    
    return registrations.filter(reg => {
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Registrations</TabsTrigger>
          <TabsTrigger value="registrations">Legacy Registrations</TabsTrigger>
          <TabsTrigger value="bookings">New Bookings</TabsTrigger>
        </TabsList>
      </Tabs>
      
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
                  {event.title} ({event.total_attendees})
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
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={`${registration.source_table}-${registration.id}`}>
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
                        {registration.events?.is_free ? 'Free' : registration.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {registration.source_table === 'registrations' ? 'Legacy' : 'New System'}
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
                          onClick={() => handleDeleteRegistration(registration)}
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
          {events.filter(event => event.total_attendees > 0).map(event => (
            <Card key={event.id} className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.total_attendees} {event.total_attendees === 1 ? 'attendee' : 'attendees'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportAttendees(event.id, 'xlsx')}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportAttendees(event.id, 'pdf')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Legacy System: </span> 
                    <Badge variant="outline">{event.registrations_count}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">New System: </span> 
                    <Badge variant="outline">{event.bookings_count}</Badge>
                  </div>
                </div>
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
                <h4 className="font-medium">{selectedRegistration.events?.title}</h4>
                <p className="text-sm">Attendee: {selectedRegistration.profiles?.full_name || 'Unknown'}</p>
                <Badge>{selectedRegistration.source_table === 'registrations' ? 'Legacy Registration' : 'New Booking'}</Badge>
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
                    selectedRegistration,
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
