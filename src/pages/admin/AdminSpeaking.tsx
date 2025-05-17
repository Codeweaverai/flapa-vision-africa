
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SpeakingBookingsTable from '@/components/admin/SpeakingBookingsTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

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

const AdminSpeaking = () => {
  const [bookings, setBookings] = useState<SpeakingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSpeakingBookings();
  }, []);

  const fetchSpeakingBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('speaking_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Cast the data to ensure type compatibility
      const typedData = (data || []).map(booking => ({
        ...booking,
        status: booking.status as 'pending' | 'approved' | 'rejected' | 'completed'
      }));

      setBookings(typedData);
    } catch (error) {
      console.error('Error fetching speaking bookings:', error);
      toast.error('Failed to load speaking booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'pending' | 'approved' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('speaking_bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking status updated successfully');
      fetchSpeakingBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const filterBookings = () => {
    if (!searchQuery) return bookings;
    
    const query = searchQuery.toLowerCase();
    return bookings.filter(booking => {
      const name = booking.name.toLowerCase();
      const email = booking.email.toLowerCase();
      const organization = booking.organization.toLowerCase();
      const eventType = booking.event_type.toLowerCase();
      
      return name.includes(query) || 
             email.includes(query) || 
             organization.includes(query) || 
             eventType.includes(query);
    });
  };
  
  const filteredBookings = filterBookings();

  return (
    <AdminLayout title="Speaking & Media Requests">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Speaking & Media Requests</h2>
          <p className="text-muted-foreground">Manage speaking engagement and media appearance requests.</p>
        </div>
      </div>
      
      <div className="w-full max-w-md mb-6">
        <Label htmlFor="search">Search Requests</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name, email, organization..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <SpeakingBookingsTable 
        bookings={filteredBookings}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
      />
    </AdminLayout>
  );
};

export default AdminSpeaking;
