
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Calendar, Users, MapPin, Clock, Tag, CalendarClock, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { fetchEvents, fetchUserRegistrations, registerForEvent, cancelRegistration, Event, Registration } from '@/services/eventService';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  // Fetch events and user registrations
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData);
        
        if (user) {
          const registrationsData = await fetchUserRegistrations(user);
          setUserRegistrations(registrationsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Filter events by type
  const upcomingEvents = events.filter(event => new Date(event.start_time) > new Date());
  const webinarEvents = events.filter(event => event.event_type === 'webinar');
  const inPersonEvents = events.filter(event => event.event_type === 'in-person');
  
  // Check if user is registered for an event
  const isRegistered = (eventId: string) => {
    return userRegistrations.some(reg => reg.event_id === eventId && reg.status !== 'cancelled');
  };
  
  // Handle registration
  const handleRegisterClick = (event: Event) => {
    if (!user) {
      toast.error("Please sign in to register for events");
      return;
    }
    
    setSelectedEvent(event);
    setRegistrationDialogOpen(true);
  };
  
  const confirmRegistration = async () => {
    if (!selectedEvent) return;
    
    setRegistering(true);
    try {
      const registration = await registerForEvent(selectedEvent, user);
      if (registration) {
        // If it's a free event, update the UI
        if (selectedEvent.is_free || !selectedEvent.price) {
          setUserRegistrations([...userRegistrations, registration]);
        }
        setRegistrationDialogOpen(false);
      }
    } catch (error) {
      console.error('Error registering:', error);
    } finally {
      setRegistering(false);
    }
  };
  
  // Handle cancellation
  const handleCancelRegistration = async (registrationId: string) => {
    if (!user) return;
    
    try {
      const success = await cancelRegistration(registrationId, user);
      if (success) {
        // Update the registration in the UI
        setUserRegistrations(userRegistrations.map(reg => 
          reg.id === registrationId ? { ...reg, status: 'cancelled' } : reg
        ));
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
    }
  };
  
  // Format the date and time
  const formatEventDate = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${format(startDate, 'MMMM d, yyyy')} • ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    } else {
      return `${format(startDate, 'MMMM d')} - ${format(endDate, 'MMMM d, yyyy')}`;
    }
  };
  
  return (
    <Layout>
      <div className="section-container">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Live Events</h1>
          <p className="text-lg">
            Connect with Mbolela Pule through interactive webinars, mentorship sessions, 
            and in-person events focused on business growth, technology, and African entrepreneurship.
          </p>
          <div className="flex justify-center mt-6 gap-4">
            <Button size="lg">
              <Calendar className="h-5 w-5 mr-2" /> Browse All Events
            </Button>
            <Button size="lg" variant="outline">
              <CalendarClock className="h-5 w-5 mr-2" /> Subscribe to Calendar
            </Button>
          </div>
        </div>

        {/* User's registrations */}
        {user && userRegistrations.length > 0 && (
          <div className="mb-12 border p-6 rounded-lg bg-muted/50">
            <h2 className="text-xl font-bold mb-4">Your Registrations</h2>
            <div className="space-y-4">
              {userRegistrations
                .filter(reg => reg.status !== 'cancelled')
                .map(reg => (
                  <div key={reg.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">{reg.events.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatEventDate(reg.events.start_time, reg.events.end_time)}
                      </p>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Badge variant={reg.status === 'confirmed' ? 'default' : 'outline'}>
                          {reg.status}
                        </Badge>
                        <Badge variant={reg.payment_status === 'completed' ? 'default' : 'outline'}>
                          {reg.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelRegistration(reg.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="upcoming" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="webinars">Webinars</TabsTrigger>
            <TabsTrigger value="in-person">In-Person Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-pulse space-y-6 w-full">
                    <div className="h-64 bg-slate-200 rounded-lg"></div>
                    <div className="h-64 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <Card key={event.id}>
                    <div className="md:flex">
                      <div className="md:w-1/3 bg-primary/10 flex items-center justify-center p-6 md:p-0 md:rounded-l-lg">
                        <div className="text-center">
                          <div className="text-4xl font-bold">{format(new Date(event.start_time), 'd')}</div>
                          <div className="text-lg">{format(new Date(event.start_time), 'MMM')}</div>
                          <div className="text-lg">{format(new Date(event.start_time), 'yyyy')}</div>
                          <Badge className="mt-2">{event.event_type}</Badge>
                        </div>
                      </div>
                      <div className="md:w-2/3 p-6">
                        <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                        <p className="mb-4">{event.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')} (CAT)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.event_type === 'webinar' ? (
                              <>
                                <Video className="h-5 w-5 text-primary" />
                                <span>Online {event.online_meeting_link && '(Zoom)'}</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>{event.location || 'TBD'}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <span>
                              {event.is_free ? 'Free Registration' : (
                                `${event.price} ${event.currency || 'ZMW'}`
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span>{event.capacity ? `${event.capacity} Spots Available` : 'Unlimited Spots'}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegisterClick(event)}
                          disabled={isRegistered(event.id)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {isRegistered(event.id) ? 'Already Registered' : 'Register Now'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No upcoming events at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="webinars" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="h-48 bg-slate-200 rounded-lg"></div>
                  </div>
                ))
              ) : webinarEvents.length > 0 ? (
                webinarEvents.map(event => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(event.start_time), 'MMMM d, yyyy')} • {format(new Date(event.start_time), 'h:mm a')} (CAT)
                          </CardDescription>
                        </div>
                        <Badge>Webinar</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 line-clamp-3">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Video className="h-4 w-4 mr-1" />
                          <span>Online</span>
                        </div>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          <span>{event.is_free ? 'Free' : `${event.price} ${event.currency || 'ZMW'}`}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handleRegisterClick(event)}
                        disabled={isRegistered(event.id)}
                      >
                        {isRegistered(event.id) ? 'Already Registered' : 'Register Now'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground">No webinar events available at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="in-person" className="mt-6">
            <div className="space-y-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="h-64 bg-slate-200 rounded-lg"></div>
                  </div>
                ))
              ) : inPersonEvents.length > 0 ? (
                inPersonEvents.map(event => (
                  <Card key={event.id}>
                    <div className="md:flex">
                      <div className="md:w-1/3 relative">
                        <img 
                          src={`https://source.unsplash.com/random/800x600?conference,business&${event.id}`}
                          alt={event.title} 
                          className="w-full h-full object-cover md:absolute rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                        <p className="mb-4">{event.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <span>{format(new Date(event.start_time), 'MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span>{event.location || 'Location TBD'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            <span>
                              {event.is_free ? 'Free' : `${event.price} ${event.currency || 'ZMW'}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <span>
                              {event.capacity ? `Limited to ${event.capacity} attendees` : 'Unlimited spots'}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegisterClick(event)}
                          disabled={isRegistered(event.id)}
                        >
                          {isRegistered(event.id) ? 'Already Registered' : 'Learn More & Register'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No in-person events available at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="heading-md mb-4">Never Miss an Event</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Stay updated on all upcoming events, webinars, and appearances by 
            subscribing to our newsletter or adding events to your calendar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">
              <CalendarClock className="h-5 w-5 mr-2" /> Subscribe to Calendar
            </Button>
            <Button size="lg" variant="outline">
              <Users className="h-5 w-5 mr-2" /> Join Our Community
            </Button>
          </div>
        </div>
        
        {/* Registration Dialog */}
        <Dialog open={registrationDialogOpen} onOpenChange={setRegistrationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register for Event</DialogTitle>
              <DialogDescription>
                You are registering for the following event:
              </DialogDescription>
            </DialogHeader>
            
            {selectedEvent && (
              <div className="py-4">
                <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{formatEventDate(selectedEvent.start_time, selectedEvent.end_time)}</p>
                  <p className="mt-1">
                    {selectedEvent.event_type === 'webinar' ? 'Online Event' : selectedEvent.location || 'Location TBD'}
                  </p>
                </div>
                
                {!selectedEvent.is_free && selectedEvent.price && (
                  <div className="mt-4 p-3 border rounded-md bg-muted">
                    <div className="flex justify-between">
                      <span>Registration Fee:</span>
                      <span className="font-medium">{selectedEvent.price} {selectedEvent.currency || 'ZMW'}</span>
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                      You will be redirected to our secure payment provider to complete your registration.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegistrationDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmRegistration} disabled={registering}>
                {registering ? 'Processing...' : 'Confirm Registration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EventsPage;
