import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import Layout from '@/components/layout/Layout';
import { Clock, MapPin, Calendar, Users, Star, Globe, Building } from 'lucide-react';
import EventDetailActions from '@/components/event/EventDetailActions';
import EventRegistrationForm from '@/components/event/EventRegistrationForm';
import WishlistButton from '@/components/wishlist/WishlistButton';
import GiftEventButton from '@/components/event/GiftEventButton';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  location: string;
  is_online: boolean;
  venue?: string;
  organizer: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  registration_deadline?: string;
  capacity?: number;
  is_free: boolean;
  creator_id: string;
  is_featured: boolean;
  is_published: boolean;
  is_recurring: boolean;
  recurrence_rule?: string;
  timezone: string;
}

interface Ticket {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available?: number;
  event_id: string;
  created_at: string;
  updated_at: string;
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadRegistrationStatus();
    }
  }, [id, user]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);

      // Fetch event data
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData);

      // Fetch tickets for the event
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', id);

      if (ticketsError) throw ticketsError;

      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationStatus = async () => {
    if (!user) return;

    try {
      const { data: registrationData, error: registrationError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();

      if (registrationError && registrationError.message !== 'No rows found') {
        throw registrationError;
      }

      setIsRegistered(!!registrationData);
    } catch (error) {
      console.error('Error loading registration status:', error);
      toast.error('Failed to load registration status');
      setIsRegistered(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
          <div className="container mx-auto px-4">
            <Card className="w-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
          <div className="container mx-auto px-4">
            <Card className="w-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4">Event Not Found</h2>
                <p className="text-gray-600">The event you're looking for doesn't exist.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Content */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-t-md"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{event.title}</CardTitle>
                  <CardDescription>
                    <ReactMarkdown>{event.description}</ReactMarkdown>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.start_time), 'PPP p')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    {event.is_online && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="h-4 w-4" />
                        <span>Online Event</span>
                      </div>
                    )}
                    {event.venue && !event.is_online && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>Venue: {event.venue}</span>
                      </div>
                    )}
                    <Separator className="my-6" />
                    <h3 className="text-xl font-semibold">About the Event</h3>
                    <ReactMarkdown>{event.description}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Details Actions */}
            <div className="space-y-6">
              <EventDetailActions
                event={event}
                tickets={tickets}
                isRegistered={isRegistered}
              />
              
              {/* Wishlist and Gift Buttons */}
              {event && tickets.length > 0 && (
                <div className="space-y-3">
                  <WishlistButton 
                    itemId={event.id}
                    itemType="event"
                    className="w-full"
                  />
                  <GiftEventButton 
                    event={{
                      id: event.id,
                      title: event.title,
                      start_time: event.start_time,
                      location: event.location
                    }}
                    ticket={tickets[0]} // Use the first ticket type
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
