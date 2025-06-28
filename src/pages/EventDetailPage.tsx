import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  image_url: string;
  event_type: string;
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  online_meeting_link: string;
  creator_id: string;
  event_tickets: EventTicket[];
  event_agenda: AgendaItem[];
  keynote_speakers: Speaker[];
  _count?: {
    event_bookings: number;
  };
}

interface EventTicket {
  id: string;
  name: string;
  description: string;
  price: number;
  ticket_type: string;
  quantity_available: number;
  quantity_sold: number;
  is_active: boolean;
  early_bird_end_date: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  speaker_id: string;
  location: string;
  session_type: string;
}

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  twitter_url: string;
  speaking_topic: string;
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);

      // Load event with related data - fix the ambiguous relationship
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          event_tickets!event_tickets_event_id_fkey (*),
          event_agenda (*),
          keynote_speakers (*)
        `)
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData);

      // Check if user is registered
      if (user) {
        const { data: booking } = await supabase
          .from('event_bookings')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .single();

        setIsRegistered(!!booking);
      }

    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (ticketId: string, quantity: number) => {
    const ticket = event?.event_tickets.find(t => t.id === ticketId);
    if (!ticket || !event) return;

    if (quantity > ticket.quantity_available - ticket.quantity_sold) {
      toast.error('Not enough tickets available');
      return;
    }

    addToCart({
      itemId: ticketId,
      itemType: 'event_ticket',
      itemName: `${event.title} - ${ticket.name}`,
      price: ticket.price,
      quantity: quantity
    });

    toast.success(`${quantity} ticket(s) added to cart`);
  };

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Event Not Found</h2>
              <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/events')} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Back to Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const availableTickets = event.event_tickets.filter(ticket => 
    ticket.is_active && (ticket.quantity_available - ticket.quantity_sold) > 0
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Header */}
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  {event.image_url && (
                    <div className="h-64 bg-gray-200 rounded-t-lg overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline">{event.event_type}</Badge>
                      {event.is_free && <Badge className="bg-green-500">Free</Badge>}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{format(new Date(event.start_time), 'PPP')}</p>
                          <p className="text-sm">
                            {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-6">
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>

                    {isRegistered && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">You're registered for this event!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Event Description */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Speakers */}
              {event.keynote_speakers && event.keynote_speakers.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Featured Speakers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.keynote_speakers.map((speaker) => (
                        <div key={speaker.id} className="flex gap-4">
                          {speaker.image_url && (
                            <img
                              src={speaker.image_url}
                              alt={speaker.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">{speaker.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{speaker.title}</p>
                            {speaker.speaking_topic && (
                              <p className="text-sm text-gray-700">Topic: {speaker.speaking_topic}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agenda */}
              {event.event_agenda && event.event_agenda.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Event Agenda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event.event_agenda.map((item) => (
                        <div key={item.id} className="border-l-4 border-orange-500 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {format(new Date(item.start_time), 'h:mm a')} - {format(new Date(item.end_time), 'h:mm a')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <Card className="shadow-lg sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Event Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableTickets.length === 0 ? (
                    <div className="text-center py-6">
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No tickets available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableTickets.map((ticket) => {
                        const available = ticket.quantity_available - ticket.quantity_sold;
                        const selectedQty = selectedTickets[ticket.id] || 0;
                        
                        return (
                          <div key={ticket.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{ticket.name}</h4>
                                <p className="text-2xl font-bold text-orange-600">
                                  {event.currency} {ticket.price.toFixed(2)}
                                </p>
                              </div>
                              <Badge variant="outline">{available} left</Badge>
                            </div>
                            
                            {ticket.description && (
                              <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                            )}
                            
                            {!isRegistered && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border rounded">
                                  <button
                                    onClick={() => updateTicketQuantity(ticket.id, selectedQty - 1)}
                                    className="px-3 py-1 hover:bg-gray-100"
                                    disabled={selectedQty <= 0}
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 border-x">{selectedQty}</span>
                                  <button
                                    onClick={() => updateTicketQuantity(ticket.id, selectedQty + 1)}
                                    className="px-3 py-1 hover:bg-gray-100"
                                    disabled={selectedQty >= available}
                                  >
                                    +
                                  </button>
                                </div>
                                <Button
                                  onClick={() => handleAddToCart(ticket.id, selectedQty || 1)}
                                  disabled={selectedQty === 0 && !selectedTickets[ticket.id]}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600"
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Stats */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type</span>
                    <span className="font-medium">{event.event_type}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{event.capacity || 'Unlimited'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium">English</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
