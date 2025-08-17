import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, Clock, MapPin, VideoIcon, AlertCircle, Ticket, Plus, Minus, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@/constants/currencies';

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
  event_tickets?: EventTicket[];
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const getCurrencyCode = (currency?: string): CurrencyCode => {
    if (!currency) return 'USD';
    const upperCurrency = currency.toUpperCase() as CurrencyCode;
    return SUPPORTED_CURRENCIES[upperCurrency] ? upperCurrency : 'USD';
  };

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data: eventsData, error } = await supabase
          .from('events')
          .select(`
            *,
            event_tickets:event_tickets!event_tickets_event_id_fkey(
              *,
              quantity_available,
              quantity_sold,
              is_active
            )
          `)
          .order('start_time', { ascending: true });

        if (error) throw error;

        setEvents(eventsData as Event[]);
        
        if (user) {
          const { data: userRegs, error: regError } = await supabase
            .from('event_bookings')
            .select('*')
            .eq('user_id', user.id);

          if (regError) throw regError;
          setRegistrations(userRegs as Registration[]);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [user]);

  const handleAddToCart = (eventId: string, ticketId: string, quantity: number) => {
    if (!user) {
      toast.error("Please sign in to purchase tickets");
      navigate("/auth");
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const ticket = event.event_tickets?.find(t => t.id === ticketId);
    if (!ticket) return;

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

  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.event_id === eventId && reg.status !== 'cancelled');
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(parseISO(dateTimeStr), 'PPP p');
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      return format(parseISO(dateTimeStr), 'p');
    } catch (e) {
      return dateTimeStr;
    }
  };
  
  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'webinar':
        return 'Online Webinar';
      case 'in-person':
        return 'In-Person Event';
      case 'mentorship':
        return 'Mentorship Session';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const upcomingEvents = events.filter(event => 
    new Date(event.start_time) > new Date()
  );
  
  const pastEvents = events.filter(event => 
    new Date(event.start_time) <= new Date()
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Events & Workshops
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join our upcoming events, webinars, and workshops to learn about technology, 
              entrepreneurship, and innovation.
            </p>
          </div>
          
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-xl">
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
              >
                Upcoming Events
              </TabsTrigger>
              <TabsTrigger 
                value="past"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
              >
                Past Events
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-sm">
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    No Upcoming Events
                  </h3>
                  <p className="text-muted-foreground text-lg">Check back soon for exciting new events and workshops</p>
                </div>
              ) : (
                <div className="grid gap-8">
                  {upcomingEvents.map(event => {
                    const availableTickets = event.event_tickets?.filter(ticket => 
                      ticket.is_active && (ticket.quantity_available - ticket.quantity_sold) > 0
                    ) || [];
                    
                    const registered = isRegistered(event.id);

                    return (
                      <Card key={event.id} className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-sm border border-orange-200 hover:shadow-md transition-all duration-300">
                        {/* Mobile Layout - Stacked */}
                        <div className="lg:hidden flex flex-col">
                          {/* Image */}
                          <div className="w-full">
                            <AspectRatio ratio={16/9}>
                              {event.image_url ? (
                                <img 
                                  src={event.image_url} 
                                  alt={event.title}
                                  className="w-full h-full object-cover" 
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center">
                                  <CalendarIcon className="h-12 w-12 text-purple-600" />
                                </div>
                              )}
                            </AspectRatio>
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                                {getEventTypeLabel(event.event_type)}
                              </Badge>
                              {event.is_free && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Free Event</Badge>
                              )}
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                              {event.title}
                            </h2>
                            
                            <div className="grid sm:grid-cols-2 gap-4 mb-6">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 mb-1">Date & Time</p>
                                  <p className="text-gray-600">{formatDateTime(event.start_time)}</p>
                                  {event.end_time && (
                                    <p className="text-muted-foreground text-sm">
                                      Until {formatTime(event.end_time)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-3">
                                {event.event_type === 'webinar' ? (
                                  <>
                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                      <VideoIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800 mb-1">Location</p>
                                      <p className="text-gray-600">Online Webinar</p>
                                      {registered && event.online_meeting_link && (
                                        <a 
                                          href={event.online_meeting_link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-orange-600 hover:text-orange-800 hover:underline text-sm font-medium"
                                        >
                                          Join Meeting →
                                        </a>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                      <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800 mb-1">Location</p>
                                      <p className="text-gray-600">{event.location || 'To be announced'}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <p className="text-gray-600 leading-relaxed line-clamp-3">
                                {event.description}
                              </p>
                            </div>
                            
                            {/* Event Tickets Section - Mobile */}
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-orange-600" />
                                Event Tickets
                              </h3>
                              
                              {registered ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                      <div>
                                        <p className="font-medium text-green-800">You're registered for this event</p>
                                        <p className="text-sm text-green-600">Your ticket details are available in your account</p>
                                      </div>
                                    </div>
                                    <Button asChild variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                      <Link to="/my-events">
                                        View My Events
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              ) : availableTickets.length > 0 ? (
                                <div className="space-y-4">
                                  {availableTickets.map((ticket) => {
                                    const available = ticket.quantity_available - ticket.quantity_sold;
                                    const selectedQty = selectedTickets[ticket.id] || 0;
                                    
                                    return (
                                      <div key={ticket.id} className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-purple-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                                          <div>
                                            <h4 className="font-semibold">{ticket.name}</h4>
                                            <p className="text-xl font-bold text-orange-600">
                                              <PriceDisplay 
                                                amount={ticket.price} 
                                                originalCurrency={getCurrencyCode(event.currency)} 
                                              />
                                            </p>
                                          </div>
                                          <Badge variant="outline">{available} left</Badge>
                                        </div>
                                        
                                        {ticket.description && (
                                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                                        )}
                                        
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                          <div className="flex items-center border rounded bg-white w-full sm:w-auto">
                                            <button
                                              onClick={() => updateTicketQuantity(ticket.id, selectedQty - 1)}
                                              className="px-3 py-2 hover:bg-gray-100 rounded-l"
                                              disabled={selectedQty <= 0}
                                            >
                                              <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="px-3 py-2 border-x">{selectedQty}</span>
                                            <button
                                              onClick={() => updateTicketQuantity(ticket.id, selectedQty + 1)}
                                              className="px-3 py-2 hover:bg-gray-100 rounded-r"
                                              disabled={selectedQty >= available}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </button>
                                          </div>
                                          <Button
                                            onClick={() => handleAddToCart(event.id, ticket.id, selectedQty || 1)}
                                            disabled={selectedQty === 0}
                                            className="w-full sm:w-auto px-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                                          >
                                            Add to Cart
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : event.event_tickets && event.event_tickets.length > 0 ? (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                  <p className="text-orange-800">No tickets currently available</p>
                                </div>
                              ) : (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                  <p className="text-orange-800">Ticket information coming soon</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout - Image Left, Content Middle, Tickets Right */}
                        <div className="hidden lg:flex flex-row">
                          {/* Image Column - Left */}
                          <div className="w-1/4">
                            <AspectRatio ratio={3/4}>
                              {event.image_url ? (
                                <img 
                                  src={event.image_url} 
                                  alt={event.title}
                                  className="w-full h-full object-cover" 
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center">
                                  <CalendarIcon className="h-12 w-12 text-purple-600" />
                                </div>
                              )}
                            </AspectRatio>
                          </div>

                          {/* Content Column - Middle */}
                          <div className="w-2/4 p-6 border-r border-orange-200">
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                                {getEventTypeLabel(event.event_type)}
                              </Badge>
                              {event.is_free && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Free Event</Badge>
                              )}
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                              {event.title}
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 mb-1">Date & Time</p>
                                  <p className="text-gray-600">{formatDateTime(event.start_time)}</p>
                                  {event.end_time && (
                                    <p className="text-muted-foreground text-sm">
                                      Until {formatTime(event.end_time)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-3">
                                {event.event_type === 'webinar' ? (
                                  <>
                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                      <VideoIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800 mb-1">Location</p>
                                      <p className="text-gray-600">Online Webinar</p>
                                      {registered && event.online_meeting_link && (
                                        <a 
                                          href={event.online_meeting_link} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-orange-600 hover:text-orange-800 hover:underline text-sm font-medium"
                                        >
                                          Join Meeting →
                                        </a>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center">
                                      <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-800 mb-1">Location</p>
                                      <p className="text-gray-600">{event.location || 'To be announced'}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <p className="text-gray-600 leading-relaxed">
                                {event.description}
                              </p>
                            </div>
                          </div>

                          {/* Tickets Column - Right */}
                          <div className="w-1/4 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <Ticket className="h-5 w-5 text-orange-600" />
                              Event Tickets
                            </h3>
                            
                            {registered ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                      <p className="font-medium text-green-800">You're registered</p>
                                    </div>
                                  </div>
                                  <Button asChild variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                    <Link to="/my-events">
                                      View My Events
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ) : availableTickets.length > 0 ? (
                              <div className="space-y-4">
                                {availableTickets.map((ticket) => {
                                  const available = ticket.quantity_available - ticket.quantity_sold;
                                  const selectedQty = selectedTickets[ticket.id] || 0;
                                  
                                  return (
                                    <div key={ticket.id} className="border rounded-lg p-4 bg-gradient-to-r from-orange-50 to-purple-50">
                                      <div className="flex flex-col gap-2 mb-3">
                                        <div className="flex justify-between items-center">
                                          <h4 className="font-semibold">{ticket.name}</h4>
                                          <Badge variant="outline">{available} left</Badge>
                                        </div>
                                        <p className="text-xl font-bold text-orange-600">
                                          <PriceDisplay 
                                            amount={ticket.price} 
                                            originalCurrency={getCurrencyCode(event.currency)} 
                                          />
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center border rounded bg-white w-full">
                                          <button
                                            onClick={() => updateTicketQuantity(ticket.id, selectedQty - 1)}
                                            className="px-3 py-2 hover:bg-gray-100 rounded-l"
                                            disabled={selectedQty <= 0}
                                          >
                                            <Minus className="h-4 w-4" />
                                          </button>
                                          <span className="px-3 py-2 border-x">{selectedQty}</span>
                                          <button
                                            onClick={() => updateTicketQuantity(ticket.id, selectedQty + 1)}
                                            className="px-3 py-2 hover:bg-gray-100 rounded-r"
                                            disabled={selectedQty >= available}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <Button
                                        onClick={() => handleAddToCart(event.id, ticket.id, selectedQty || 1)}
                                        disabled={selectedQty === 0}
                                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                                      >
                                        Add to Cart
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : event.event_tickets && event.event_tickets.length > 0 ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <p className="text-orange-800">No tickets available</p>
                              </div>
                            ) : (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <p className="text-orange-800">Ticket info coming soon</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
                </div>
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-sm">
                  <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-12 w-12 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    No Past Events
                  </h3>
                  <p className="text-muted-foreground text-lg">Check the upcoming events tab for future opportunities</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {pastEvents.map(event => (
                    <Card key={event.id} className="bg-white/80 backdrop-blur-sm overflow-hidden border border-orange-200 hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col lg:flex-row">
                        {event.image_url && (
                          <div className="lg:w-1/4">
                            <AspectRatio ratio={4/3}>
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </AspectRatio>
                          </div>
                        )}
                        <div className={`p-6 ${event.image_url ? 'lg:w-3/4' : 'w-full'}`}>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            <Badge variant="secondary" className="bg-muted/50">Past Event</Badge>
                            {!event.is_free && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <PriceDisplay amount={event.price} originalCurrency={getCurrencyCode(event.currency)} />
                              </Badge>
                            )}
                          </div>
                          
                          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                            {event.title}
                          </h2>
                          
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDateTime(event.start_time)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {event.event_type === 'webinar' ? (
                                <>
                                  <VideoIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Online Webinar</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{event.location || 'Location not specified'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                          
                          {isRegistered(event.id) && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              ✓ You attended this event
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default EventsPage;
