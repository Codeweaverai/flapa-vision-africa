import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Clock, Plus, Minus } from 'lucide-react';
import AddToCartButton from '@/components/cart/AddToCartButton';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  };
  isRegistered: boolean;
  registrationCount: number;
}

const EventDetailActions: React.FC<EventDetailActionsProps> = ({
  event,
  isRegistered,
  registrationCount
}) => {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [event.id]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load ticket information');
    } finally {
      setLoading(false);
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

  const getTotalPrice = () => {
    return tickets.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      return total + (ticket.price * quantity);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
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

        {isRegistered ? (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 mb-4">Registered</Badge>
            <div className="text-sm text-gray-600">You're already registered for this event!</div>
          </div>
        ) : (
          <>
            {/* Ticket Selection */}
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
                            <p className="font-bold">${ticket.price}</p>
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

                {/* Add to Cart for Selected Tickets */}
                {getTotalTickets() > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total ({getTotalTickets()} tickets):</span>
                      <span className="text-xl font-bold">${getTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {tickets.map((ticket) => {
                        const quantity = selectedTickets[ticket.id] || 0;
                        if (quantity === 0) return null;
                        
                        return (
                          <AddToCartButton
                            key={ticket.id}
                            itemType="event_ticket"
                            itemId={ticket.id}
                            itemName={event.title}
                            price={ticket.price}
                            ticketType={ticket.ticket_type}
                            eventId={event.id}
                            eventTitle={event.title}
                            className="w-full"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">No tickets available for this event.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventDetailActions;
