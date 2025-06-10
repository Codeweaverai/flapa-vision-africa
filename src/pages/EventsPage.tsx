
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
import { CalendarIcon, Clock, MapPin, VideoIcon, AlertCircle, Star, Users, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import PriceDisplay from '@/components/currency/PriceDisplay';

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Events & Workshops
              </h1>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-orange-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join me at upcoming events, webinars, and workshops to learn about technology, 
              entrepreneurship, and innovation. Connect with like-minded professionals and expand your network.
            </p>
          </div>
        
          <Tabs defaultValue="upcoming" className="w-full max-w-6xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold"
                >
                  Upcoming Events
                </TabsTrigger>
                <TabsTrigger 
                  value="past"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold"
                >
                  Past Events
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                    <CalendarIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Upcoming Events</h3>
                  <p className="text-gray-600 mb-6">Check back soon for new events and workshops</p>
                  <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    Explore Past Events
                  </Button>
                </div>
              ) : (
                <div className="grid gap-8">
                  {upcomingEvents.map(event => (
                    <Card key={event.id} className="group overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-0 hover:-translate-y-1">
                      <div className="grid md:grid-cols-5 gap-6">
                        {/* Event Image/Date */}
                        <div className="md:col-span-1 relative">
                          {event.image_url ? (
                            <div className="relative h-full min-h-[200px]">
                              <img 
                                src={event.image_url} 
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                              <div className="absolute bottom-4 left-4 text-center text-white">
                                <div className="text-3xl font-bold">
                                  {format(parseISO(event.start_time), 'dd')}
                                </div>
                                <div className="text-lg font-medium">
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
                          ) : (
                            <div className="h-full min-h-[200px] bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white p-4">
                              <div className="text-3xl font-bold">
                                {format(parseISO(event.start_time), 'dd')}
                              </div>
                              <div className="text-lg font-medium">
                                {format(parseISO(event.start_time), 'MMM')}
                              </div>
                              <div className="mt-4 flex items-center justify-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                  {format(parseISO(event.start_time), 'p')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Event Content */}
                        <div className="md:col-span-4 p-6">
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge 
                              variant="outline" 
                              className="bg-gradient-to-r from-orange-100 to-purple-100 border-orange-200 text-orange-700 font-medium"
                            >
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            {event.is_free ? (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                                Free Event
                              </Badge>
                            ) : (
                              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                                <PriceDisplay amount={event.price || 0} originalCurrency="USD" />
                              </Badge>
                            )}
                          </div>
                          
                          <h2 className="text-2xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                            {event.title}
                          </h2>
                          
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-start space-x-2">
                              <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                                <CalendarIcon className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-700">Date & Time</p>
                                <p className="text-sm">{formatDateTime(event.start_time)}</p>
                                {event.end_time && (
                                  <p className="text-muted-foreground text-xs">
                                    Until {formatTime(event.end_time)}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                              {event.event_type === 'webinar' ? (
                                <>
                                  <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                                    <VideoIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-700">Location</p>
                                    <p className="text-sm">Online Webinar</p>
                                    {isRegistered(event.id) && event.online_meeting_link && (
                                      <a 
                                        href={event.online_meeting_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-purple-600 text-xs hover:underline transition-colors duration-200"
                                      >
                                        Join Meeting
                                      </a>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                                    <MapPin className="h-4 w-4 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-700">Location</p>
                                    <p className="text-sm">{event.location || 'To be announced'}</p>
                                  </div>
                                </>
                              )}
                            </div>

                            {event.capacity && (
                              <div className="flex items-start space-x-2">
                                <div className="p-1 rounded-full bg-gradient-to-r from-orange-100 to-purple-100">
                                  <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-700">Capacity</p>
                                  <p className="text-sm">Max {event.capacity} attendees</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {event.description && (
                            <div className="mb-6">
                              <p className="text-gray-600 leading-relaxed line-clamp-3">{event.description}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {isRegistered(event.id) ? (
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                                  ✓ Registered
                                </Badge>
                                {getRegistration(event.id)?.status === 'confirmed' && (
                                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                    Confirmed
                                  </Badge>
                                )}
                                {getRegistration(event.id)?.status === 'pending' && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                    Pending
                                  </Badge>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    const reg = getRegistration(event.id);
                                    if (reg) handleCancelRegistration(reg.id);
                                  }}
                                >
                                  Cancel Registration
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <Button 
                                  onClick={() => handleRegister(event)}
                                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 font-semibold px-6"
                                >
                                  Register Now
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => navigate(`/event/${event.id}`)}
                                  className="border-gray-200 hover:bg-gray-50"
                                >
                                  View Details
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                </div>
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Past Events</h3>
                  <p className="text-gray-600 mb-6">Check the upcoming events tab for new opportunities</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {pastEvents.map(event => (
                    <Card key={event.id} className="bg-white/80 backdrop-blur-sm overflow-hidden border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="md:grid md:grid-cols-4 gap-4">
                        {event.image_url && (
                          <div className="col-span-1 relative">
                            <AspectRatio ratio={4/3}>
                              <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover opacity-75"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="bg-gray-800/70 text-white border-0">
                                  Past Event
                                </Badge>
                              </div>
                            </AspectRatio>
                          </div>
                        )}
                        <div className={`p-6 ${event.image_url ? 'col-span-3' : 'col-span-4'}`}>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Completed
                            </Badge>
                          </div>
                          
                          <h2 className="text-xl font-bold mb-2 text-gray-700">{event.title}</h2>
                          
                          <div className="grid sm:grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDateTime(event.start_time)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {event.event_type === 'webinar' ? (
                                <>
                                  <VideoIcon className="h-4 w-4" />
                                  <span>Online Webinar</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location || 'Location not specified'}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            {isRegistered(event.id) && (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                ✓ You attended this event
                              </Badge>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/event/${event.id}`)}
                              className="ml-auto border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          {!loading && (upcomingEvents.length > 0 || pastEvents.length > 0) && (
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                <h3 className="text-2xl font-bold mb-4">Want to stay updated on upcoming events?</h3>
                <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                  Join our community to get notified about new events, workshops, and exclusive networking opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
                  >
                    <div onClick={() => navigate('/community')}>Join Community</div>
                  </Button>
                  <Button 
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 font-semibold px-8"
                  >
                    <div onClick={() => navigate('/explore/events')}>Explore More Events</div>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Registration Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
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
    </div>
  );
};

export default EventsPage;
