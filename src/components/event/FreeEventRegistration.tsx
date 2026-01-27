import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, Calendar, Ticket } from 'lucide-react';

interface FreeEventRegistrationProps {
  event: {
    id: string;
    title: string;
    is_free: boolean;
    capacity: number;
    start_time: string;
    _count?: {
      event_bookings: number;
    };
  };
  onRegistrationSuccess?: (bookingData: any) => void;
}

const FreeEventRegistration: React.FC<FreeEventRegistrationProps> = ({
  event,
  onRegistrationSuccess
}) => {
  const { user, setRedirectAfterOTP } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    checkExistingRegistration();
  }, [user, event.id]);

  const checkExistingRegistration = async () => {
    if (!user) {
      setCheckingRegistration(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          id,
          status,
          generated_tickets (
            id,
            ticket_code,
            ticket_status
          )
        `)
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .single();

      setIsRegistered(!error && !!data);
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const generateBookingCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `FREE-${event.id.slice(0, 4).toUpperCase()}-${timestamp}-${random}`;
  };

  const generateTicketCode = () => {
    return `TKT-${event.id.slice(0, 4).toUpperCase()}-${user?.id.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-8)}`;
  };

  const getFreeEventTicket = async (eventId: string) => {
    // Look for existing free ticket type for this event
    const { data: existingTickets, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .eq('price', 0)
      .single();

    if (error || !existingTickets) {
      // Create a default free ticket if none exists
      const { data: newTicket, error: createError } = await supabase
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ticket_type: 'free_general_admission',
          name: 'Free Registration',
          description: 'General admission for free event',
          price: 0,
          quantity_available: event.capacity || 1000,
          quantity_sold: 0,
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;
      return newTicket;
    }

    return existingTickets;
  };

  const handleFreeRegistration = async () => {
    if (!user) {
      // Set the redirect URL in the auth context before navigating
      setRedirectAfterOTP(`/event-detail/${event.id}`);
      navigate('/auth', { state: { redirectTo: `/event-detail/${event.id}` } });
      return;
    }

    if (!event.is_free) {
      toast.error("This is not a free event");
      return;
    }

    // Check if event has already started
    const eventStartTime = new Date(event.start_time);
    if (eventStartTime < new Date()) {
      toast.error("This event has already started");
      return;
    }

    // Check capacity
    const currentAttendees = event._count?.event_bookings || 0;
    if (event.capacity && currentAttendees >= event.capacity) {
      toast.error("This event has reached its capacity");
      return;
    }

    setIsLoading(true);

    try {
      // Get or create free event ticket
      const freeTicket = await getFreeEventTicket(event.id);

      // Create booking with 0 payment
      const bookingCode = generateBookingCode();
      const { data: booking, error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          payment_status: 'free',
          payment_amount: 0,
          payment_currency: 'USD',
          event_ticket_id: freeTicket.id,
          ticket_quantity: 1,
          booking_code: bookingCode
        })
        .select()
        .single();

      if (bookingError) {
        if (bookingError.code === '23505') {
          toast.error("You are already registered for this event");
          await checkExistingRegistration();
          return;
        }
        throw bookingError;
      }

      // Generate ticket
      const ticketCode = generateTicketCode();
      const { data: generatedTicket, error: ticketError } = await supabase
        .from('generated_tickets')
        .insert({
          booking_id: booking.id,
          event_id: event.id,
          user_id: user.id,
          event_ticket_id: freeTicket.id,
          ticket_code: ticketCode,
          ticket_holder_name: user.user_metadata?.full_name || 'Guest',
          ticket_holder_email: user.email,
          qr_code_data: `${event.id}-${user.id}-${booking.id}-${ticketCode}`,
          ticket_status: 'active'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Update ticket sold count
      await supabase
        .from('event_tickets')
        .update({
          quantity_sold: freeTicket.quantity_sold + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', freeTicket.id);

      setIsRegistered(true);
      toast.success("🎉 Successfully registered! Your free ticket has been generated.");

      if (onRegistrationSuccess) {
        onRegistrationSuccess({
          booking,
          generatedTicket,
          event
        });
      }

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message?.includes('duplicate key') || error.code === '23505') {
        toast.error("You are already registered for this event");
        await checkExistingRegistration();
      } else {
        toast.error(error.message || "Failed to register for event. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToGoogleCalendar = () => {
    if (!event) return;

    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('dates', `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`);
    googleCalendarUrl.searchParams.set('details', `Event: ${event.title}\n\nTicket Code: ${generateTicketCode()}`);
    googleCalendarUrl.searchParams.set('location', event.location || '');

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  if (checkingRegistration) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
        <h3 className="font-semibold text-orange-800 mb-2">You're Registered!</h3>
        <p className="text-orange-700 text-sm mb-4">
          Your free ticket has been generated and is ready to use.
        </p>
        <div className="space-y-2">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            <a href="/my-events">
              <Ticket className="h-4 w-4 mr-2" />
              View My Ticket
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            onClick={addToGoogleCalendar}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">Free Registration</h3>
        <p className="text-gray-600 text-sm mb-4">
          Register for this event and get your free ticket instantly
        </p>
      </div>

      <Button
        onClick={handleFreeRegistration}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Registration...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Register for Free
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        No payment required. Your ticket will be generated immediately.
      </div>
    </div>
  );
};

export default FreeEventRegistration;