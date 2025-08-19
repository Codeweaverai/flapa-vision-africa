
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users, Tag, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import WishlistButton from '@/components/wishlist/WishlistButton';
import GiftEventButton from '@/components/event/GiftEventButton';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer?: string;
  category?: string;
  tags?: string[];
  is_online?: boolean;
  url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  event_type?: string;
  currency?: string;
  capacity?: number;
  is_free?: boolean;
  is_published?: boolean;
  price?: number;
  creator_id?: string;
  workplace_id?: string;
}

interface EventTicket {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  created_at: string;
  updated_at: string;
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [ticketHolderNames, setTicketHolderNames] = useState<string[]>(['']);

  useEffect(() => {
    if (id) {
      fetchEventDetails(id);
    }
  }, [id]);

  const fetchEventDetails = async (eventId: string) => {
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw eventError;
      }

      // Map the database event to our Event interface
      const mappedEvent: Event = {
        ...eventData,
        organizer: eventData.creator_id || 'Unknown Organizer',
        category: eventData.event_type || 'General',
        tags: eventData.tags || [],
        is_online: eventData.is_online || false,
      };

      setEvent(mappedEvent);

      const { data: ticketData, error: ticketError } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId);

      if (ticketError) {
        throw ticketError;
      }

      setTickets(ticketData);
      setSelectedTicket(ticketData[0] || null);
    } catch (error: any) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedTicket) {
      toast.error('Please select a ticket.');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be at least 1.');
      return;
    }

    if (quantity > selectedTicket.quantity_available) {
      toast.error('Not enough tickets available.');
      return;
    }

    if (ticketHolderNames.length !== quantity) {
      toast.error('Please enter a name for each ticket.');
      return;
    }

    if (ticketHolderNames.some(name => !name.trim())) {
      toast.error('Ticket holder names cannot be empty.');
      return;
    }

    setRegistering(true);
    try {
      addToCart({
        itemId: selectedTicket.id,
        itemType: 'event_ticket',
        itemName: `${event?.title} - ${selectedTicket.name}`,
        price: selectedTicket.price,
        quantity: quantity,
        ticketHolderNames: ticketHolderNames
      });
      toast.success('Tickets added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add tickets to cart.');
    } finally {
      setRegistering(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    setTicketHolderNames(Array(newQuantity).fill(''));
  };

  const updateTicketHolderName = (index: number, name: string) => {
    const newNames = [...ticketHolderNames];
    newNames[index] = name;
    setTicketHolderNames(newNames);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto space-y-6">
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-full h-64" />
              <Skeleton className="w-full h-48" />
              <Skeleton className="w-full h-48" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-semibold">Event Not Found</CardTitle>
              <p className="text-gray-600">Sorry, the event you are looking for could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Breadcrumbs */}
        <div className="bg-white py-3 shadow-sm">
          <div className="container mx-auto px-4">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <a href="/" className="text-purple-600 hover:underline">Home</a>
                <span className="mx-2 text-gray-400">/</span>
              </li>
              <li className="flex items-center">
                <a href="/events" className="text-purple-600 hover:underline">Events</a>
                <span className="mx-2 text-gray-400">/</span>
              </li>
              <li className="text-gray-700">{event.title}</li>
            </ol>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative py-12 md:py-24 bg-gray-100 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="lg:flex lg:items-center">
              {/* Image */}
              <div className="lg:w-1/2 mb-6 lg:mb-0">
                <img
                  src={event.image_url || 'https://via.placeholder.com/600x400'}
                  alt={event.title}
                  className="rounded-lg shadow-md w-full h-auto max-h-96 object-cover"
                />
              </div>

              {/* Details */}
              <div className="lg:w-1/2 lg:pl-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                <p className="text-gray-700 leading-relaxed mb-6">{event.description}</p>

                <div className="flex flex-wrap gap-4 mb-4">
                  <Badge className="space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(event.start_time), 'PPP')}</span>
                  </Badge>
                  <Badge className="space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}</span>
                  </Badge>
                  <Badge className="space-x-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{event.location}</span>
                  </Badge>
                  {event.is_online && (
                    <Badge className="space-x-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>Online Event</span>
                    </Badge>
                  )}
                </div>

                <div>
                  <span className="font-semibold">Organizer:</span> {event.organizer}
                </div>
                <div>
                  <span className="font-semibold">Category:</span> {event.category}
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div>
                    <span className="font-semibold">Tags:</span> {event.tags.join(', ')}
                  </div>
                )}
                {event.url && (
                  <div className="mt-4">
                    <LinkIcon className="inline-block h-5 w-5 mr-1 text-purple-500" />
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      Event Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Event Details Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800">{event.description}</p>
                </CardContent>
              </Card>

              {/* Agenda Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Day 1: Event Kickoff</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5">
                          <li>9:00 AM: Registration and Welcome</li>
                          <li>10:00 AM: Keynote Speech</li>
                          <li>12:00 PM: Lunch Break</li>
                          <li>1:30 PM: Workshop Session 1</li>
                          <li>3:30 PM: Networking Session</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Day 2: Advanced Topics</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc pl-5">
                          <li>9:00 AM: Morning Coffee and Networking</li>
                          <li>10:00 AM: Deep Dive Session 1</li>
                          <li>12:00 PM: Lunch Break</li>
                          <li>1:30 PM: Workshop Session 2</li>
                          <li>3:30 PM: Panel Discussion</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Speakers Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Speakers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src="https://via.placeholder.com/80"
                        alt="Speaker 1"
                        className="rounded-full w-12 h-12"
                      />
                      <div>
                        <div className="font-semibold">John Doe</div>
                        <div className="text-sm text-gray-500">CEO, Tech Corp</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <img
                        src="https://via.placeholder.com/80"
                        alt="Speaker 2"
                        className="rounded-full w-12 h-12"
                      />
                      <div>
                        <div className="font-semibold">Jane Smith</div>
                        <div className="text-sm text-gray-500">CTO, Innovate Inc</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Calendar className="h-4 w-4 inline-block mr-1 text-gray-500" />
                    {format(new Date(event.start_time), 'PPP')}
                  </div>
                  <div>
                    <Clock className="h-4 w-4 inline-block mr-1 text-gray-500" />
                    {format(new Date(event.start_time), 'p')} - {format(new Date(event.end_time), 'p')}
                  </div>
                  <div>
                    <MapPin className="h-4 w-4 inline-block mr-1 text-gray-500" />
                    {event.location}
                  </div>
                  {event.is_online && (
                    <div>
                      <Users className="h-4 w-4 inline-block mr-1 text-gray-500" />
                      Online Event
                    </div>
                  )}
                  <div>
                    <Tag className="h-4 w-4 inline-block mr-1 text-gray-500" />
                    {event.category}
                  </div>
                </CardContent>
              </Card>

              {/* Tickets and Registration */}
              <Card>
                <CardHeader>
                  <CardTitle>Tickets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="text-gray-500">No tickets available for this event.</div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ticketType">Ticket Type</Label>
                        <Select onValueChange={(value) => {
                          const selected = tickets.find(ticket => ticket.id === value);
                          setSelectedTicket(selected || null);
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a ticket type" />
                          </SelectTrigger>
                          <SelectContent>
                            {tickets.map((ticket) => (
                              <SelectItem key={ticket.id} value={ticket.id}>{ticket.name} - ${ticket.price}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTicket && (
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value, 10);
                              if (!isNaN(newQuantity) && newQuantity > 0) {
                                handleQuantityChange(newQuantity);
                              } else {
                                setQuantity(1);
                                handleQuantityChange(1);
                              }
                            }}
                            min="1"
                            max={selectedTicket.quantity_available}
                          />
                          {quantity > selectedTicket.quantity_available && (
                            <p className="text-red-500 text-sm">Only {selectedTicket.quantity_available} tickets left.</p>
                          )}
                        </div>
                      )}

                      {selectedTicket && Array.from({ length: quantity }).map((_, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`ticketHolderName-${index}`}>Ticket Holder Name {index + 1}</Label>
                          <Input
                            type="text"
                            id={`ticketHolderName-${index}`}
                            placeholder="Enter ticket holder name"
                            value={ticketHolderNames[index] || ''}
                            onChange={(e) => updateTicketHolderName(index, e.target.value)}
                          />
                        </div>
                      ))}

                      {selectedTicket && (
                        <div>
                          <Button
                            className="w-full"
                            onClick={handleAddToCart}
                            disabled={registering}
                          >
                            {registering ? 'Adding to Cart...' : 'Add to Cart'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Wishlist Button */}
                <WishlistButton
                  itemId={event?.id || ''}
                  itemType="event"
                  className="w-full"
                />

                {/* Gift Event Button */}
                {selectedTicket && event && (
                  <GiftEventButton 
                    event={{
                      id: event.id,
                      title: event.title,
                      start_time: event.start_time,
                      location: event.location || ''
                    }}
                    ticket={{
                      id: selectedTicket.id,
                      name: selectedTicket.name,
                      price: selectedTicket.price || 0
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
