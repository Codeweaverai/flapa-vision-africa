
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  Eye, 
  Ticket,
  Download,
  QrCode
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import TicketDisplay from '@/components/tickets/TicketDisplay';

interface EventBooking {
  id: string;
  event: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url?: string;
  };
  status: string;
  payment_status: string;
  booking_date: string;
  payment_amount: number;
  payment_currency: string;
  ticket_quantity: number;
  booking_code: string;
}

const UserEvents = () => {
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['user-event-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:events (
            id,
            title,
            description,
            start_time,
            end_time,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      return data as EventBooking[];
    }
  });

  const handleViewTickets = (booking: EventBooking) => {
    setSelectedBooking(booking);
    setTicketDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <UserAccountLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">My Events</h1>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </UserAccountLayout>
    );
  }

  return (
    <UserAccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-muted-foreground">
            View and manage your event bookings and tickets
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Event Bookings</h3>
              <p className="text-muted-foreground text-center">
                You haven't booked any events yet. Browse our events to find something interesting!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="md:flex">
                  {booking.event.image_url && (
                    <div className="md:w-48 h-48 md:h-auto">
                      <img
                        src={booking.event.image_url}
                        alt={booking.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">
                            {booking.event.title}
                          </CardTitle>
                          <p className="text-muted-foreground">
                            {booking.event.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge variant={getPaymentStatusBadgeVariant(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(booking.event.start_time), 'PPP')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(booking.event.start_time), 'p')} - {format(new Date(booking.event.end_time), 'p')}
                            </span>
                          </div>
                          {booking.event.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {booking.payment_amount} {booking.payment_currency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Ticket className="h-4 w-4" />
                            <span>{booking.ticket_quantity} ticket(s)</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Booking Code: {booking.booking_code}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTickets(booking)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Tickets
                        </Button>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <QrCode className="h-4 w-4" />
                            Show QR Code
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Ticket Display Dialog */}
        {selectedBooking && (
          <TicketDisplay
            booking={{
              id: selectedBooking.id,
              event: selectedBooking.event,
              booking_code: selectedBooking.booking_code,
              ticket_quantity: selectedBooking.ticket_quantity,
              payment_amount: selectedBooking.payment_amount,
              payment_currency: selectedBooking.payment_currency,
              status: selectedBooking.status
            }}
            open={ticketDialogOpen}
            onOpenChange={setTicketDialogOpen}
          />
        )}
      </div>
    </UserAccountLayout>
  );
};

export default UserEvents;
