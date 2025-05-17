
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
      
      // Ensure the count functions exist in Supabase
      await ensureCountFunctions(supabase);
      
      // Get events data
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (eventsError) throw eventsError;
      
      // Count registrations by event_id from the old table
      const { data: regCountsData, error: regError } = await supabase
        .rpc('count_registrations_by_event');
        
      if (regError) {
        console.error('Error counting registrations:', regError);
        // Fallback if RPC doesn't exist - fetch all and count manually
        const { data: regData } = await supabase.from('registrations').select('event_id');
        const regCountsMap = {};
        regData?.forEach(reg => {
          regCountsMap[reg.event_id] = (regCountsMap[reg.event_id] || 0) + 1;
        });
        
        // Count bookings by event_id from the new table
        const { data: bookingData } = await supabase.from('event_bookings').select('event_id');
        const bookingCountsMap = {};
        bookingData?.forEach(booking => {
          bookingCountsMap[booking.event_id] = (bookingCountsMap[booking.event_id] || 0) + 1;
        });
        
        // Process and combine the data
        const eventsWithCounts = eventsData.map(event => {
          // Count from registrations table
          const regCount = regCountsMap[event.id] || 0;
          
          // Count from bookings table
          const bookingCount = bookingCountsMap[event.id] || 0;
          
          return {
            ...event,
            registrations_count: regCount,
            bookings_count: bookingCount,
            total_attendees: regCount + bookingCount
          };
        }) as EventWithRegistrations[];
        
        setEvents(eventsWithCounts);
      } else {
        // If RPC succeeded, use the results
        // Get counts from event_bookings table
        const { data: bookingCountsData, error: bookingError } = await supabase
          .rpc('count_bookings_by_event');
          
        if (bookingError) {
          console.error('Error counting bookings:', bookingError);
          // Handle the error but continue
        }
        
        // Process and combine the data
        const regCountsMap = {};
        if (regCountsData && Array.isArray(regCountsData)) {
          regCountsData.forEach(item => {
            regCountsMap[item.event_id] = parseInt(item.count);
          });
        }
        
        const bookingCountsMap = {};
        if (bookingCountsData && Array.isArray(bookingCountsData)) {
          bookingCountsData.forEach(item => {
            bookingCountsMap[item.event_id] = parseInt(item.count);
          });
        }
        
        const eventsWithCounts = eventsData.map(event => {
          // Count from registrations table
          const regCount = regCountsMap[event.id] || 0;
          
          // Count from bookings table
          const bookingCount = bookingCountsMap[event.id] || 0;
          
          return {
            ...event,
            registrations_count: regCount,
            bookings_count: bookingCount,
            total_attendees: regCount + bookingCount
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
            profiles:user_id(full_name, email)
          `)
          .order('created_at', { ascending: false });
        
        if (eventId !== 'all') {
          regQuery = regQuery.eq('event_id', eventId);
        }
        
        const { data: regData, error: regError } = await regQuery;
        
        if (regError) throw regError;
        
        oldRegistrations = (regData || []).map(reg => ({
          ...reg,
          created_at: reg.created_at || new Date().toISOString(),
          phone_number: reg.phone_number || null,
          mobile_operator: reg.mobile_operator || null,
          source_table: 'registrations' as const
        })) as unknown as CombinedRegistration[];
      }

      // Fetch from event_bookings table (if showing all or bookings tab)
      if (activeTab === 'all' || activeTab === 'bookings') {
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
        
        if (bookingError) throw bookingError;
        
        newBookings = (bookingData || []).map(booking => ({
          ...booking,
          created_at: booking.created_at || new Date().toISOString(),
          phone_number: booking.phone_number || null,
          mobile_operator: booking.mobile_operator || null,
          source_table: 'event_bookings' as const
        })) as unknown as CombinedRegistration[];
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
