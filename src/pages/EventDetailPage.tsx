
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Video, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { useAuth } from '@/contexts/AuthContext';
import { Event, fetchEvents } from '@/services/eventService';

const EventDetailPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadEventDetails = async () => {
      try {
        setLoading(true);
        const events = await fetchEvents();
        const currentEvent = events.find(e => e.id === eventId);
        
        if (currentEvent) {
          setEvent(currentEvent);
        } else {
          toast.error('Event not found');
        }
      } catch (error) {
        console.error('Error loading event details:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    
    loadEventDetails();
  }, [eventId]);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'p');
    } catch (error) {
      return dateString;
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      toast('Please sign in to register for this event', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth'
        }
      });
      return;
    }
    
    setShowRegistrationForm(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="section-container min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading event details...</div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="section-container min-h-[60vh] flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-container">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div>
              <Link to="/events" className="text-primary hover:underline flex items-center mb-4">
                ← Back to Events
              </Link>
              
              <h1 className="heading-lg mb-2">{event.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="text-sm">
                  {event.event_type}
                </Badge>
                {event.is_free ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Free</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {event.currency || 'USD'} {event.price}
                  </Badge>
                )}
              </div>
              
              {event.image_url && (
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-64 md:h-80 object-cover rounded-lg mb-8" 
                />
              )}
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-muted-foreground">{formatDate(event.start_time)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Time</p>
                        <p className="text-muted-foreground">
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      {event.location ? (
                        <MapPin className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <Video className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{event.location ? 'Location' : 'Online'}</p>
                        <p className="text-muted-foreground">
                          {event.location || 'Virtual Event'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {event.capacity && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Users className="h-5 w-5 mr-2 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Capacity</p>
                          <p className="text-muted-foreground">
                            {event.capacity} attendees
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-4">About the Event</h2>
              <div className="prose max-w-none mb-8">
                <p>{event.description}</p>
              </div>
              
              {!showRegistrationForm && (
                <div className="flex justify-center my-8">
                  <Button 
                    size="lg" 
                    onClick={handleRegisterClick}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    Register for this Event
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-1">
            {showRegistrationForm ? (
              <div className="sticky top-24">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-bold mb-4">Register for Event</h2>
                    <EventRegistrationForm 
                      event={event} 
                      onCancel={() => setShowRegistrationForm(false)} 
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Event Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-muted-foreground">
                        {formatDate(event.start_time)} at {formatTime(event.start_time)}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium">{event.location ? 'Location' : 'Online'}</p>
                      <p className="text-muted-foreground">
                        {event.location || 'Virtual Event'}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium">Price</p>
                      <div className="flex items-center">
                        {event.is_free ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Free</Badge>
                        ) : (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{event.currency || 'USD'} {event.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600" 
                        onClick={handleRegisterClick}
                      >
                        Register Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
