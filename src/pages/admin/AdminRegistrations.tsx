
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Search } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CombinedRegistration, EventWithRegistrations } from '@/types/eventTypes';
import RegistrationEditDialog from '@/components/admin/RegistrationEditDialog';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import AttendeeExport from '@/components/admin/AttendeeExport';
import { ensureCountFunctions } from '@/lib/utils';

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [registrations, setRegistrations] = useState<CombinedRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
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
      
      // Ensure the count function exists in Supabase
      await ensureCountFunctions(supabase);
      
      // Get events data
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (eventsError) throw eventsError;
      
      // Count bookings by event_id from the table
      const { data: bookingCountsData, error: bookingError } = await supabase
        .rpc('count_bookings_by_event') as { data: {event_id: string, count: string}[] | null, error: any };
        
      if (bookingError) {
        console.error('Error counting bookings:', bookingError);
        // Fallback if RPC doesn't exist - fetch all and count manually
        const { data: bookingData } = await supabase.from('event_bookings').select('event_id');
        const bookingCountsMap = {};
        if (bookingData) {
          bookingData.forEach(booking => {
            bookingCountsMap[booking.event_id] = (bookingCountsMap[booking.event_id] || 0) + 1;
          });
        }
        
        // Process the data
        const eventsWithCounts = eventsData.map(event => {
          // Count from bookings table
          const bookingCount = bookingCountsMap[event.id] || 0;
          
          return {
            ...event,
            registrations_count: 0, // We're not using registrations anymore
            bookings_count: bookingCount,
            total_attendees: bookingCount
          };
        }) as EventWithRegistrations[];
        
        setEvents(eventsWithCounts);
      } else {
        // If RPC succeeded, use the results
        const bookingCountsMap = {};
        if (bookingCountsData && Array.isArray(bookingCountsData)) {
          bookingCountsData.forEach(item => {
            bookingCountsMap[item.event_id] = parseInt(item.count);
          });
        }
        
        const eventsWithCounts = eventsData.map(event => {
          // Count from bookings table
          const bookingCount = bookingCountsMap[event.id] || 0;
          
          return {
            ...event,
            registrations_count: 0, // We're not using registrations anymore
            bookings_count: bookingCount,
            total_attendees: bookingCount
          };
        }) as EventWithRegistrations[];
        
        setEvents(eventsWithCounts);
      }
      
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

      // Fetch from event_bookings table only
      let bookingQuery = supabase
        .from('event_bookings')
        .select(`
          *,
          events(*),
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (eventId !== 'all') {
        bookingQuery = bookingQuery.eq('event_id', eventId);
      }
      
      const { data: bookingData, error: bookingError } = await bookingQuery;
      
      if (bookingError) {
        console.error('Error fetching from event_bookings table:', bookingError);
        toast.error('Failed to load registrations');
        setRegistrations([]);
      } else {
        const bookings = (bookingData || []).map(booking => ({
          ...booking,
          created_at: booking.created_at || new Date().toISOString(),
          phone_number: booking.phone_number || null,
          mobile_operator: booking.mobile_operator || null,
          source_table: 'event_bookings' as const
        })) as unknown as CombinedRegistration[];

        setRegistrations(bookings);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (registration: CombinedRegistration, status: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('event_bookings')
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
      const { error } = await supabase
        .from('event_bookings')
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

  const filterRegistrations = () => {
    if (!searchQuery) return registrations;
    
    return registrations.filter(reg => {
      // Safely get the profile properties
      const fullName = reg.profiles && 'full_name' in reg.profiles 
        ? (reg.profiles.full_name?.toLowerCase() || '') 
        : '';
      
      const email = reg.profiles && 'email' in reg.profiles 
        ? (reg.profiles.email?.toLowerCase() || '') 
        : '';
      
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

      <RegistrationsTable 
        registrations={filteredRegistrations}
        loading={loading}
        onEdit={(registration) => {
          setSelectedRegistration(registration);
          setIsDialogOpen(true);
        }}
        onDelete={handleDeleteRegistration}
      />

      <AttendeeExport events={events} registrations={registrations} />

      <RegistrationEditDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        registration={selectedRegistration}
        onUpdate={handleUpdateStatus}
        setRegistration={setSelectedRegistration}
      />
    </AdminLayout>
  );
};

export default AdminRegistrations;
