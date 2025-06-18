
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/contexts/CartContext';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';
import { toast } from 'sonner';

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  ticket_type: 'ordinary' | 'standard' | 'vip';
  quantity_available: number;
  quantity_sold: number;
}

interface TicketTypeSelectorProps {
  eventId: string;
  currency: CurrencyCode;
}

const TicketTypeSelector: React.FC<TicketTypeSelectorProps> = ({ eventId, currency }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchTicketTypes();
  }, [eventId]);

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
      toast.error('Failed to load ticket types');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (ticketId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max(0, (prev[ticketId] || 0) + change)
    }));
  };

  const addTicketsToCart = (ticket: TicketType) => {
    const quantity = quantities[ticket.id] || 1;
    
    addToCart({
      itemId: ticket.id,
      itemType: 'event_ticket',
      itemName: `${ticket.name} - ${ticket.ticket_type.charAt(0).toUpperCase() + ticket.ticket_type.slice(1)}`,
      price: ticket.price,
      quantity,
      ticketHolderNames: []
    });

    toast.success(`Added ${quantity} ${ticket.name} ticket(s) to cart`);
    setQuantities(prev => ({ ...prev, [ticket.id]: 0 }));
  };

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'ordinary':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'standard':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'vip':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAvailableTickets = (ticket: TicketType) => {
    return ticket.quantity_available - ticket.quantity_sold;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">No tickets available for this event</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Select Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.map((ticket) => {
          const availableTickets = getAvailableTickets(ticket);
          const selectedQuantity = quantities[ticket.id] || 0;

          return (
            <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{ticket.name}</h4>
                    <Badge className={getTicketTypeColor(ticket.ticket_type)}>
                      {ticket.ticket_type.charAt(0).toUpperCase() + ticket.ticket_type.slice(1)}
                    </Badge>
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <PriceDisplay amount={ticket.price} originalCurrency={currency} className="text-lg font-bold" />
                    <span className="text-sm text-gray-500">
                      {availableTickets} tickets available
                    </span>
                  </div>
                </div>
              </div>

              {availableTickets > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(ticket.id, -1)}
                      disabled={selectedQuantity === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{selectedQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(ticket.id, 1)}
                      disabled={selectedQuantity >= availableTickets}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => addTicketsToCart(ticket)}
                    disabled={selectedQuantity === 0}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Badge variant="destructive">Sold Out</Badge>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TicketTypeSelector;
