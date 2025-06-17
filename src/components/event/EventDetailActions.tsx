
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Clock, Plus, Minus, CalendarPlus, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

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
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTickets();
  }, [event.id]);

  const getCurrencyCode = (currency?: string): CurrencyCode => {
    if (!currency) return 'USD';
    const upperCurrency = currency.toUpperCase() as CurrencyCode;
    return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(upperCurrency) ? upperCurrency : 'USD';
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

  const handleAddToCart = async (ticket: EventTicket, quantity: number) => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (quantity <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [ticket.id]: true }));
    
    try {
      await addToCart({
        item_type: 'event_ticket',
        item_id: ticket.id,
        title: `${event.title} - ${ticket.name}`,
        quantity,
        price: ticket.price,
        event_id: event.id,
        ticket_holder_names: []
      });
      
      toast.success(`Added ${quantity} ticket(s) to cart`);
      
      // Reset quantity for this ticket
      setSelectedTickets(prev => ({ ...prev, [ticket.id]: 0 }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add ticket to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [ticket.id]: false }));
    }
  };

  const handleAddEventToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    if (!event.price || event.price <= 0) {
      toast.error('Invalid event price');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [event.id]: true }));
    
    try {
      await addToCart({
        item_type: 'event_ticket',
        item_id: event.id,
        title: event.title,
        quantity: 1,
        price: event.price,
        event_id: event.id,
        ticket_holder_names: []
      });
      
      toast.success('Added event to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add event to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [event.id]: false }));
    }
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
    <Card className="sticky top-24 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
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
          className="w-full flex items-center gap-2 bg-gradient-to-r from-orange-100 to-purple-100 hover:from-orange-200 hover:to-purple-200 border-orange-200"
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
                {/* Paid Event with Tickets */}
                <div className="space-y-4">
                  {/* Ticket Selection for Paid Events */}
                  {tickets.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Tickets</h4>
                      {tickets.map((ticket) => {
                        const availableQty = getAvailableQuantity(ticket);
                        const selectedQty = selectedTickets[ticket.id] || 0;
                        
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
                                  <p className="font-bold">
                                    <PriceDisplay 
                                      amount={ticket.price} 
                                      originalCurrency="USD" 
                                    />
                                  </p>
                                </div>
                              </div>

                              {availableQty > 0 ? (
                                <div className="flex items-center justify-between mb-3">
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
                                <Badge variant="destructive" className="w-full justify-center mb-3">
                                  Sold Out
                                </Badge>
                              )}

                              {/* Add to Cart Button for each ticket type */}
                              {selectedQty > 0 && (
                                <Button
                                  onClick={() => handleAddToCart(ticket, selectedQty)}
                                  disabled={addingToCart[ticket.id]}
                                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                                >
                                  {addingToCart[ticket.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                  ) : (
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                  )}
                                  Add to Cart
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    // No tickets configured - fallback with add to cart for event price
                    <div className="space-y-4">
                      {event.price && event.price > 0 ? (
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary mb-4">
                              <PriceDisplay 
                                amount={event.price} 
                                originalCurrency={getCurrencyCode(event.currency)} 
                              />
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleAddEventToCart}
                            disabled={addingToCart[event.id]}
                            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                          >
                            {addingToCart[event.id] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            Add to Cart
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-600">
                          <p>Ticket information will be available soon.</p>
                        </div>
                      )}
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
