
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import EventTicket from '@/components/event/EventTicket';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  payment_amount?: number;
  payment_currency?: string;
  phone_number?: string;
  mobile_operator?: string;
  updated_at: string;
  booking_date?: string;
  payment_id?: string;
  ticket_number?: string; // Added ticket_number to the interface
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_free: boolean;
  price?: number;
  currency?: string;
  image_url?: string;
  online_meeting_link?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  email?: string;
}

const EventTicketPage = () => {
  const { eventId, bookingId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string>('');
  
  useEffect(() => {
    if (!user) return;
    fetchData();
    
    // Generate ticket number if it doesn't exist
    if (!ticketNumber) {
      // Create a shortened UUID-based ticket number
      const shortTicket = uuidv4().substring(0, 8).toUpperCase();
      setTicketNumber(`TCKT-${shortTicket}`);
    }
  }, [user, eventId, bookingId, ticketNumber]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      if (eventId) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
          
        if (eventError) throw eventError;
        setEvent(eventData as Event);
      }
      
      // Fetch booking details
      if (bookingId) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('event_bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
          
        if (bookingError) throw bookingError;
        setBooking(bookingData as Booking);
        
        // If booking has a ticket number, use it
        if (bookingData && bookingData.ticket_number) {
          setTicketNumber(bookingData.ticket_number);
        }
      }
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (profileError) throw profileError;
      setProfile(profileData as Profile);
      
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      toast.error('Failed to load ticket information');
    } finally {
      setLoading(false);
    }
  };
  
  // Save ticket number to booking if it doesn't exist
  useEffect(() => {
    const saveTicketNumber = async () => {
      if (!booking || !ticketNumber || booking.ticket_number) return;
      
      try {
        await supabase
          .from('event_bookings')
          .update({ ticket_number: ticketNumber })
          .eq('id', booking.id);
      } catch (error) {
        console.error('Error saving ticket number:', error);
      }
    };
    
    if (booking && ticketNumber) {
      saveTicketNumber();
    }
  }, [booking, ticketNumber]);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex justify-center items-center">
          <p>Loading your ticket...</p>
        </div>
      </Layout>
    );
  }
  
  if (!event || !booking) {
    return (
      <Layout>
        <div className="section-container py-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Ticket Not Found</h1>
            <p>Sorry, we couldn't find the ticket you're looking for.</p>
            <Button asChild>
              <Link to="/account">Go to Your Account</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="section-container py-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/account" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Account
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Ticket</h1>
          <p className="text-muted-foreground">
            Here's your ticket for {event.title}
          </p>
        </div>
        
        <EventTicket
          ticketId={booking.id}
          eventId={event.id}
          eventName={event.title}
          attendeeName={profile?.full_name || user.email}
          eventDate={event.start_time}
          eventLocation={event.location || 'Online Event'}
          ticketNumber={ticketNumber}
          isPaid={!event.is_free}
          ticketType={event.is_free ? 'Free Admission' : 'Paid Admission'}
          qrValue={`${process.env.VITE_APP_URL || window.location.origin}/verify-ticket/${booking.id}`}
        />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Registered on {format(new Date(booking.created_at), 'PPP')} •
            {booking.payment_status === 'completed' || event.is_free 
              ? ' Payment confirmed' 
              : ' Payment pending'}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default EventTicketPage;
