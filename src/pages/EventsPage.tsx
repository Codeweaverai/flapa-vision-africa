import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event, Registration, fetchEvents, fetchUserRegistrations, cancelRegistration } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { CalendarIcon, Clock, MapPin, VideoIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EventRegistrationForm from '@/components/EventRegistrationForm';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
        
        // Fetch user registrations if logged in
        if (user) {
          const userRegs = await fetchUserRegistrations(user);
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

  const handleRegister = (event: Event) => {
    if (!user) {
      toast.error("Please sign in to register for events");
      navigate("/auth");
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };
  
  const handleRegistrationComplete = async () => {
    setIsDialogOpen(false);
    
    // Refresh registrations to show the updated status
    if (user) {
      const userRegs = await fetchUserRegistrations(user);
      setRegistrations(userRegs as Registration[]);
    }
  };
  
  const handleCancelRegistration = async (registrationId: string) => {
    if (confirm('Are you sure you want to cancel this registration?')) {
      const success = await cancelRegistration(registrationId, user);
      if (success) {
        // Update the registrations list by filtering out the cancelled one
        setRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
      }
    }
  };
  
  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.event_id === eventId && reg.status !== 'cancelled');
  };
  
  // Find registration for an event
  const getRegistration = (eventId: string) => {
    return registrations.find(reg => reg.event_id === eventId && reg.status !== 'cancelled');
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
  
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
  
  const upcomingEvents = sortedEvents.filter(event => 
    new Date(event.start_time) > new Date()
  );
  
  const pastEvents = sortedEvents.filter(event => 
    new Date(event.start_time) <= new Date()
  );

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <h1 className="heading-lg mb-2 text-gradient text-center">Events</h1>
        <p className="text-center mb-12 max-w-3xl mx-auto">
          Join me at upcoming events, webinars, and workshops to learn about technology, 
          entrepreneurship, and innovation.
        </p>
        
        <Tabs defaultValue="upcoming" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-background/60">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground mb-6">Check back soon for new events</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {upcomingEvents.map(event => (
                  <Card key={event.id} className="overflow-hidden bg-background/95 shadow-md">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 p-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                          {event.is_free ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            <Badge variant="secondary">
                              {event.currency} {event.price}
                            </Badge>
                          )}
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start space-x-2">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">Date & Time</p>
                              <p>{formatDateTime(event.start_time)}</p>
                              {event.end_time && (
                                <p className="text-muted-foreground text-sm">
                                  Until {formatTime(event.end_time)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            {event.event_type === 'webinar' ? (
                              <>
                                <VideoIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">Location</p>
                                  <p>Online Webinar</p>
                                  {isRegistered(event.id) && event.online_meeting_link && (
                                    <a 
                                      href={event.online_meeting_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-sm"
                                    >
                                      Join Meeting
                                    </a>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">Location</p>
                                  <p>{event.location || 'To be announced'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {event.description && (
                          <div className="mb-6">
                            <p className="text-muted-foreground">{event.description}</p>
                          </div>
                        )}
                        
                        {isRegistered(event.id) ? (
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Registered
                            </Badge>
                            {getRegistration(event.id)?.status === 'confirmed' && (
                              <Badge variant="outline" className="bg-green-50">
                                Confirmed
                              </Badge>
                            )}
                            {getRegistration(event.id)?.status === 'pending' && (
                              <Badge variant="outline" className="bg-yellow-50">
                                Pending
                              </Badge>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const reg = getRegistration(event.id);
                                if (reg) handleCancelRegistration(reg.id);
                              }}
                            >
                              Cancel Registration
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => handleRegister(event)}>
                            Register Now
                          </Button>
                        )}
                      </div>
                      
                      <CardContent className="p-0 bg-gradient-to-br from-purple-100 to-blue-50 flex items-center justify-center relative">
                        {event.image_url ? (
                          <div className="w-full h-full absolute inset-0">
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                              <div className="text-center text-white">
                                <div className="text-4xl font-bold">
                                  {format(parseISO(event.start_time), 'dd')}
                                </div>
                                <div className="text-xl font-medium">
                                  {format(parseISO(event.start_time), 'MMM')}
                                </div>
                                <div className="mt-2 flex items-center justify-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span className="text-sm">
                                    {format(parseISO(event.start_time), 'p')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6">
                            <div className="text-4xl font-bold text-primary">
                              {format(parseISO(event.start_time), 'dd')}
                            </div>
                            <div className="text-xl font-medium text-primary/80">
                              {format(parseISO(event.start_time), 'MMM')}
                            </div>
                            <div className="mt-4 flex items-center justify-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(parseISO(event.start_time), 'p')}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-background/60">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Past Events</h3>
                <p className="text-muted-foreground mb-6">Check the upcoming events tab</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {pastEvents.map(event => (
                  <Card key={event.id} className="bg-background/80 overflow-hidden">
                    <div className="md:grid md:grid-cols-4 gap-4">
                      {event.image_url && (
                        <div className="col-span-1">
                          <AspectRatio ratio={1}>
                            <img 
                              src={event.image_url} 
                              alt={event.title} 
                              className="w-full h-full object-cover"
                            />
                          </AspectRatio>
                        </div>
                      )}
                      <div className={`p-6 ${event.image_url ? 'col-span-3' : 'col-span-4'}`}>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                          <Badge variant="secondary" className="bg-muted/50">Past Event</Badge>
                        </div>
                        
                        <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                        
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDateTime(event.start_time)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {event.event_type === 'webinar' ? (
                              <>
                                <VideoIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Online Webinar</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{event.location || 'Location not specified'}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                        )}
                        
                        {isRegistered(event.id) && (
                          <Badge variant="outline" className="bg-muted">
                            You attended this event
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
      
      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <EventRegistrationForm 
              event={selectedEvent} 
              user={user}
              onSuccess={handleRegistrationComplete}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventsPage;
