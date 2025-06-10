
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="section-container">
          <div className="text-center mb-12">
            <h1 className="heading-lg mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Events & Workshops
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join me at upcoming events, webinars, and workshops to learn about technology, 
              entrepreneurship, and innovation. Connect with like-minded individuals and expand your knowledge.
            </p>
          </div>
          
          <Tabs defaultValue="upcoming" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm border border-orange-200">
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Upcoming Events
              </TabsTrigger>
              <TabsTrigger 
                value="past"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
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
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-xl">
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
                  {upcomingEvents.map(event => (
                    <Card key={event.id} className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl border border-orange-200 hover:shadow-2xl transition-all duration-300">
                      <div className="grid lg:grid-cols-3 gap-0">
                        <div className="lg:col-span-2 p-8">
                          <div className="flex flex-wrap gap-3 mb-6">
                            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-4 py-2">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            {event.is_free ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">Free Event</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
                                <PriceDisplay amount={event.price} originalCurrency={event.currency} />
                              </Badge>
                            )}
                          </div>
                          
                          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                            {event.title}
                          </h2>
                          
                          <div className="grid sm:grid-cols-2 gap-6 mb-6">
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
                                    {isRegistered(event.id) && event.online_meeting_link && (
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
                          
                          {event.description && (
                            <div className="mb-8">
                              <p className="text-gray-600 leading-relaxed">{event.description}</p>
                            </div>
                          )}
                          
                          {isRegistered(event.id) ? (
                            <div className="flex items-center space-x-4">
                              <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                                ✓ Registered
                              </Badge>
                              {getRegistration(event.id)?.status === 'confirmed' && (
                                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-4 py-2">
                                  Confirmed
                                </Badge>
                              )}
                              {getRegistration(event.id)?.status === 'pending' && (
                                <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 px-4 py-2">
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
                            <Button 
                              onClick={() => handleRegister(event)}
                              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
                            >
                              Register Now
                            </Button>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                          {event.image_url ? (
                            <div className="w-full h-full relative">
                              <img 
                                src={event.image_url} 
                                alt={event.title}
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6">
                                <div className="text-center text-white">
                                  <div className="text-4xl font-bold">
                                    {format(parseISO(event.start_time), 'dd')}
                                  </div>
                                  <div className="text-xl font-medium">
                                    {format(parseISO(event.start_time), 'MMM')}
                                  </div>
                                  <div className="mt-3 flex items-center justify-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="text-sm">
                                      {format(parseISO(event.start_time), 'p')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-8">
                              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="text-3xl font-bold text-white">
                                  {format(parseISO(event.start_time), 'dd')}
                                </div>
                              </div>
                              <div className="text-xl font-medium text-purple-600">
                                {format(parseISO(event.start_time), 'MMM')}
                              </div>
                              <div className="mt-4 flex items-center justify-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(event.start_time), 'p')}
                                </span>
                              </div>
                            </div>
                          )}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
                </div>
              ) : pastEvents.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-xl">
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
                    <Card key={event.id} className="bg-white/80 backdrop-blur-sm overflow-hidden border border-orange-200 hover:shadow-lg transition-all duration-300">
                      <div className="lg:grid lg:grid-cols-4 gap-6">
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
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            <Badge variant="secondary" className="bg-muted/50">Past Event</Badge>
                            {!event.is_free && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <PriceDisplay amount={event.price} originalCurrency={event.currency} />
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
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                          )}
                          
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
      
      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border border-orange-200">
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
