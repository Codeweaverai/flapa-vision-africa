
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Clock, Plus, Minus, CalendarPlus } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNavigate } from 'react-router-dom';

interface EventTicket {
  id: string;
  ticket_type: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  early_bird_end_date?: string;
  is_active: boolean;
}

interface EventDetailActionsProps {
  event: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    capacity?: number;
    event_type: string;
    is_free: boolean;
    price?: number;
    currency?: string;
  };
  isRegistered: boolean;
  registrationCount: number;
}

const EventDetailActions: React.FC<EventDetailActionsProps> = ({
  event,
  isRegistered,
  registrationCount
}) => {
  const { user } = useAuth();
  const { formatPrice, convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});
  const [convertingPrices, setConvertingPrices] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [event.id]);

  useEffect(() => {
    if (tickets.length > 0) {
      convertTicketPrices();
    }
  }, [tickets]);

  const convertTicketPrices = async () => {
    setConvertingPrices(true);
    const priceMap: Record<string, number> = {};
    
    try {
      for (const ticket of tickets) {
        try {
          console.log(`Converting price for ticket ${ticket.id}: ${ticket.price} USD`);
          const convertedPrice = await convertPrice(ticket.price, 'USD');
          console.log(`Converted price: ${convertedPrice}`);
          priceMap[ticket.id] = convertedPrice;
        } catch (error) {
          console.error('Error converting price for ticket:', ticket.id, error);
          priceMap[ticket.id] = ticket.price;
        }
      }
      setConvertedPrices(priceMap);
    } catch (error) {
      console.error('Error in convertTicketPrices:', error);
      // Fallback to original prices
      tickets.forEach(ticket => {
        priceMap[ticket.id] = ticket.price;
      });
      setConvertedPrices(priceMap);
    } finally {
      setConvertingPrices(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }
      
      console.log('Fetched tickets:', data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load ticket information');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeRegistration = async () => {
    if (!user) {
      toast.error('Please sign in to register for this event');
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setRegistering(true);
    try {
      const { error } = await supabase
        .from('event_bookings')
        .insert({
          user_id: user.id,
          event_id: event.id,
          payment_status: 'completed',
          status: 'confirmed',
          payment_amount: 0,
          payment_currency: event.currency || 'USD'
        });

      if (error) throw error;

      toast.success(`You've successfully registered for ${event.title}`);
      window.location.reload();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for the event. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleSignInPrompt = () => {
    toast.error('Please sign in to register for this event');
    navigate('/auth', { state: { redirectTo: window.location.pathname } });
  };

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const getAvailableQuantity = (ticket: EventTicket) => {
    return ticket.quantity_available - ticket.quantity_sold;
  };

  const isEarlyBird = (ticket: EventTicket) => {
    if (!ticket.early_bird_end_date) return false;
    return new Date() < new Date(ticket.early_bird_end_date);
  };

  const getTotalPrice = () => {
    return tickets.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      const convertedPrice = convertedPrices[ticket.id] || ticket.price;
      return total + (convertedPrice * quantity);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('dates', `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`);
    googleCalendarUrl.searchParams.set('details', `Event: ${event.title}\n\nLocation: ${event.location || 'TBD'}`);
    googleCalendarUrl.searchParams.set('location', event.location || '');

    window.open(googleCalendarUrl.toString(), '_blank');
  };

  if (loading) {
    return (
      <Card className="sticky top-24">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Event Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(event.start_time), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{registrationCount} registered</span>
            {event.capacity && <span>/ {event.capacity} capacity</span>}
          </div>
        </div>

        {/* Add to Google Calendar Button */}
        <Button 
          onClick={addToGoogleCalendar}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Add to Google Calendar
        </Button>

        {/* Registration Section */}
        {isRegistered ? (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 mb-4">Already Registered</Badge>
            <div className="text-sm text-gray-600">You're already registered for this event!</div>
          </div>
        ) : (
          <>
            {/* Free Event Registration */}
            {event.is_free ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-4">Free Event</div>
                  <Button 
                    onClick={user ? handleFreeRegistration : handleSignInPrompt}
                    disabled={registering}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {registering ? "Registering..." : "Register for Free"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Paid Event */}
                <div className="space-y-4">
                  <div className="text-center">
                    {event.price && (
                      <div className="text-2xl font-bold text-primary mb-4">
                        {formatPrice(event.price)}
                      </div>
                    )}
                  </div>

                  {/* Ticket Selection for Paid Events */}
                  {tickets.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Tickets</h4>
                      {convertingPrices && (
                        <div className="text-sm text-gray-500">Converting prices...</div>
                      )}
                      {tickets.map((ticket) => {
                        const availableQty = getAvailableQuantity(ticket);
                        const selectedQty = selectedTickets[ticket.id] || 0;
                        const convertedPrice = convertedPrices[ticket.id] || ticket.price;
                        
                        return (
                          <Card key={ticket.id} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium flex items-center gap-2">
                                    {ticket.name}
                                    {isEarlyBird(ticket) && (
                                      <Badge variant="secondary" className="text-xs">Early Bird</Badge>
                                    )}
                                  </h5>
                                  {ticket.description && (
                                    <p className="text-sm text-gray-600">{ticket.description}</p>
                                  )}
                                  <p className="text-sm text-gray-500">
                                    {availableQty} tickets available
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{formatPrice(convertedPrice)}</p>
                                  {convertedPrice !== ticket.price && (
                                    <p className="text-xs text-gray-500">
                                      (${ticket.price} USD)
                                    </p>
                                  )}
                                </div>
                              </div>

                              {availableQty > 0 ? (
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`qty-${ticket.id}`} className="text-sm">Quantity:</Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateTicketQuantity(ticket.id, selectedQty - 1)}
                                      disabled={selectedQty === 0}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      id={`qty-${ticket.id}`}
                                      type="number"
                                      min="0"
                                      max={availableQty}
                                      value={selectedQty}
                                      onChange={(e) => updateTicketQuantity(ticket.id, parseInt(e.target.value) || 0)}
                                      className="w-16 text-center"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateTicketQuantity(ticket.id, selectedQty + 1)}
                                      disabled={selectedQty >= availableQty}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="destructive" className="w-full justify-center">
                                  Sold Out
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Add to Cart for Selected Tickets - Show for each ticket type */}
                      {tickets.map((ticket) => {
                        const quantity = selectedTickets[ticket.id] || 0;
                        if (quantity === 0) return null;
                        
                        const convertedPrice = convertedPrices[ticket.id] || ticket.price;
                        
                        return (
                          <div key={`cart-${ticket.id}`} className="space-y-2 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {ticket.name} ({quantity} {quantity === 1 ? 'ticket' : 'tickets'}):
                              </span>
                              <span className="text-lg font-bold">
                                {formatPrice(convertedPrice * quantity)}
                              </span>
                            </div>
                            
                            <AddToCartButton
                              itemType="event_ticket"
                              itemId={ticket.id}
                              itemName={`${event.title} - ${ticket.name}`}
                              price={convertedPrice}
                              ticketType={ticket.ticket_type}
                              eventId={event.id}
                              eventTitle={event.title}
                              className="w-full"
                            />
                          </div>
                        );
                      })}

                      {/* Total Summary */}
                      {getTotalTickets() > 0 && (
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total ({getTotalTickets()} tickets):</span>
                            <span>{formatPrice(getTotalPrice())}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // No tickets configured - fallback
                    <div className="space-y-4">
                      <div className="text-center text-gray-600">
                        <p>Ticket information will be available soon.</p>
                      </div>
                      {!user && (
                        <p className="text-sm text-gray-600 text-center">
                          Please sign in to register for this event
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventDetailActions;
