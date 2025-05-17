
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import ConsultationBookingsTable from '@/components/admin/ConsultationBookingsTable';
import { ConsultationBooking } from '@/services/consultationService';

const AdminConsultations = () => {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConsultationBookings();
  }, []);

  const fetchConsultationBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Cast the data to match the expected types
      const typedBookings = data?.map(booking => ({
        ...booking,
        booking_type: booking.booking_type as 'google_meet' | 'in_person',
        status: booking.status,
        payment_status: booking.payment_status
      })) as ConsultationBooking[];

      setBookings(typedBookings || []);
    } catch (error) {
      console.error('Error fetching consultation bookings:', error);
      toast.error('Failed to load consultation bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('consultation_bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking status updated successfully');
      fetchConsultationBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const filterBookings = () => {
    if (!searchQuery) return bookings;
    
    const query = searchQuery.toLowerCase();
    return bookings.filter(booking => {
      // We need to handle possible undefined fields safely
      const topic = booking.topic?.toLowerCase() || '';
      const location = booking.location?.toLowerCase() || '';
      const bookingType = booking.booking_type.toLowerCase();
      
      return topic.includes(query) || 
             location.includes(query) || 
             bookingType.includes(query) ||
             booking.status.toLowerCase().includes(query);
    });
  };
  
  const filteredBookings = filterBookings();

  return (
    <AdminLayout title="Consultation Bookings">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Consultation Bookings</h2>
          <p className="text-muted-foreground">Manage consultation bookings and their statuses.</p>
        </div>
      </div>
      
      <div className="w-full max-w-md mb-6">
        <Label htmlFor="search">Search Bookings</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by topic, location, type..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ConsultationBookingsTable 
        bookings={filteredBookings}
        loading={loading}
        onUpdateStatus={handleUpdateStatus}
      />
    </AdminLayout>
  );
};

export default AdminConsultations;
