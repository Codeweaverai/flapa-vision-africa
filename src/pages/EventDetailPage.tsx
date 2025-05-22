import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, User, Users, Share2, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/layout/Layout';
import EventRegistrationForm from '@/components/event/EventRegistrationForm';
import { Event, fetchEvents, registerForEvent, cancelRegistration, fetchUserRegistrations } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabaseClient';

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const events = await fetchEvents();
        const selectedEvent = events.find((event) => event.id === eventId);
        if (selectedEvent) {
          setEvent(selectedEvent);
        } else {
          toast.error('Event not found');
          navigate('/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvent();
  }, [eventId, navigate]);
  
  useEffect(() => {
    const checkRegistration = async () => {
      if (user && eventId) {
        try {
          const userRegistrations = await fetchUserRegistrations(user);
          setRegistrations(userRegistrations);
          const registered = userRegistrations.some(reg => reg.event_id === eventId && reg.status !== 'cancelled');
          setIsRegistered(registered);
        } catch (error) {
          console.error('Error checking registration:', error);
          toast.error('Failed to check registration status');
        }
      } else {
        setIsRegistered(false);
      }
    };
    
    checkRegistration();
  }, [user, eventId]);
  
  const handleRegisterClick = () => {
    if (user) {
      setShowRegistrationForm(true);
    } else {
      toast.error("Please sign in to register for events");
    }
  };
  
  const handleCloseEventRegistration = () => {
    setShowRegistrationForm(false);
  };
  
  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
    setShowRegistrationForm(false);
    toast.success('Registration successful!');
  };
  
  const handleCancelRegistration = async () => {
    if (!user || !event) return;
    
    setIsCancelling(true);
    try {
      // Find the registration to cancel
      const registrationToCancel = registrations.find(reg => reg.event_id === eventId && reg.user_id === user.id);
      
      if (registrationToCancel) {
        const success = await cancelRegistration(registrationToCancel.id, user);
        if (success) {
          setIsRegistered(false);
          // Optimistically update the registrations state
          setRegistrations(prevRegistrations =>
            prevRegistrations.map(reg =>
              reg.id === registrationToCancel.id ? { ...reg, status: 'cancelled' } : reg
            )
          );
          toast.success('Registration cancelled successfully.');
        } else {
          toast.error('Failed to cancel registration.');
        }
      } else {
        toast.error('No registration found to cancel.');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsCancelling(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="section-container py-12">
          <div className="w-full max-w-3xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-48 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
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
        <div className="section-container py-12">
          <div className="w-full max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold">Event Not Found</h2>
            <p>The event you are looking for does not exist.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="section-container py-12">
        <div className="w-full max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/events')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">{event?.title}</h1>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{event?.event_type}</Badge>
                  {event?.is_free ? (
                    <Badge variant="outline">Free</Badge>
                  ) : (
                    <Badge variant="default">
                      {event?.currency} {event?.price}
                    </Badge>
                  )}
                </div>
                
                {event?.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full rounded-md aspect-video object-cover"
                  />
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {event?.start_time && format(parseISO(event.start_time), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {event?.start_time && format(parseISO(event.start_time), 'h:mm a')} -{' '}
                      {event?.end_time && format(parseISO(event.end_time), 'h:mm a')}
                    </span>
                  </div>
                  
                  {event?.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event?.capacity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {event.capacity}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">About this event</h2>
                  <p>{event?.description || 'No description provided.'}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    {isRegistered ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">You are registered</Badge>
                    ) : (
                      <Badge variant="secondary">Limited seats available</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    
                    {isRegistered ? (
                      <Button 
                        variant="destructive"
                        onClick={handleCancelRegistration}
                        disabled={isCancelling}
                      >
                        {isCancelling && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                        Cancel Registration
                      </Button>
                    ) : (
                      <Button onClick={handleRegisterClick}>
                        Register Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {showRegistrationForm && event && (
        <EventRegistrationForm 
          event={event} 
          onCancel={handleCloseEventRegistration}
          user={user}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}
    </Layout>
  );
};

export default EventDetailPage;
