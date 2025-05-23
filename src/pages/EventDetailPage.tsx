
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import EventRegistrationButton from '@/components/payment/EventRegistrationButton';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location: string;
  is_free: boolean;
  price: number;
  currency: string;
  capacity: number;
  image_url: string;
  online_meeting_link: string;
}

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    fetchEventDetails();
    fetchRegistrationsCount();
    
    if (user) {
      checkUserRegistration();
    }
  }, [id, user]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setEvent(data as Event);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id);
      
      if (error) throw error;
      setRegisteredCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching registrations count:', error);
    }
  };

  const checkUserRegistration = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select()
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setIsUserRegistered(!!data);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex justify-center items-center">
          <p>Loading event details...</p>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="section-container min-h-[50vh] flex flex-col justify-center items-center gap-4">
          <p>Event not found</p>
          <Button as={Link} to="/events">Back to Events</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <Button variant="ghost" className="mb-4" asChild>
          <Link to="/events" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>
        </Button>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <Badge className="mb-2">{event.event_type}</Badge>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_time), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location || 'Online'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{registeredCount} registered</span>
                </div>
              </div>
            </div>
            
            {event.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-8">
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-semibold mb-4">About This Event</h2>
              <p className="whitespace-pre-line">{event.description}</p>
            </div>
            
            {event.online_meeting_link && isUserRegistered && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Meeting Link</h3>
                <a 
                  href={event.online_meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {event.online_meeting_link}
                </a>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {event.is_free ? 'Free' : `${event.currency} ${event.price?.toFixed(2)}`}
                  </p>
                  
                  {event.capacity > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {event.capacity - registeredCount} spots left
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <EventRegistrationButton
                  eventId={event.id}
                  eventName={event.title}
                  isFree={event.is_free}
                  price={event.price}
                  currency={event.currency}
                  isUserRegistered={isUserRegistered}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
