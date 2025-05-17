
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchEvents, Event, Registration, registerForEvent, fetchUserRegistrations } from '@/services/eventService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin, Tag, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mobileOperator, setMobileOperator] = useState<string>('MTN_MOMO_ZMB');
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const getEvents = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, [user]);

  const handleRegister = async (event: Event) => {
    if (!user) {
      toast.error("Please sign in to register for events");
      return;
    }
    
    // For free events, register directly
    if (event.is_free) {
      const result = await registerForEvent(event, user);
      if (result) {
        // Refresh registrations
        const userRegs = await fetchUserRegistrations(user);
        setRegistrations(userRegs as Registration[]);
      }
    } else {
      // For paid events, open dialog to collect phone number
      setRegisteringEventId(event.id);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!registeringEventId) return;
    
    const event = events.find(e => e.id === registeringEventId);
    if (!event) return;
    
    // Validate phone number
    if (!phoneNumber) {
      toast.error("Please enter a phone number for payment");
      return;
    }
    
    await registerForEvent(event, user, phoneNumber, mobileOperator);
    setRegisteringEventId(null);
  };

  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.event_id === eventId);
  };

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <h1 className="heading-lg mb-8 text-gradient">Events</h1>
        
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="my-events" disabled={!user}>My Registrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-64 bg-slate-200 rounded-lg w-full max-w-3xl"></div>
                </div>
              </div>
            ) : events.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(event => new Date(event.start_time) > new Date()).map((event) => (
                  <Card key={event.id} className="bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-1">{event.title}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <Badge>{event.event_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 mb-4 text-sm">
                        {event.description}
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {event.is_free ? 'Free' : `${event.price} ${event.currency || 'ZMW'}`}
                          </span>
                        </div>
                        {isRegistered(event.id) ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Registered
                          </Badge>
                        ) : (
                          <Button onClick={() => handleRegister(event)} size="sm">
                            Register
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-white/70 rounded-lg">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground">Check back later for new events or subscribe to our newsletter.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-events">
            {user ? (
              registrations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {registrations.map((reg) => {
                    const event = events.find(e => e.id === reg.event_id);
                    if (!event) return null;
                    
                    return (
                      <Card key={reg.id} className="bg-white/95">
                        <CardHeader>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription>
                            <Badge className="mb-2">{reg.status}</Badge>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{format(new Date(event.start_time), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{format(new Date(event.start_time), 'h:mm a')}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <Badge variant="outline">{reg.payment_status}</Badge>
                            </div>
                            {reg.status === 'pending' && (
                              <Button variant="outline" size="sm">
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-12 bg-white/70 rounded-lg">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Registrations</h3>
                  <p className="text-muted-foreground">You haven't registered for any events yet.</p>
                </div>
              )
            ) : (
              <div className="text-center p-12 bg-white/70 rounded-lg">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Sign In Required</h3>
                <p className="text-muted-foreground">Please sign in to view your event registrations.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Payment Dialog for paid events */}
      <Dialog open={!!registeringEventId} onOpenChange={(open) => !open && setRegisteringEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
            <DialogDescription>
              Please provide your mobile money details to complete payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Mobile Money Number</Label>
              <Input 
                id="phone" 
                placeholder="e.g., 26097XXXXXXX" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground">Enter your mobile money number without spaces or dashes</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="operator">Mobile Operator</Label>
              <Select value={mobileOperator} onValueChange={setMobileOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN_MOMO_ZMB">MTN Mobile Money (Zambia)</SelectItem>
                  <SelectItem value="AIRTEL_MONEY_ZMB">Airtel Money (Zambia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisteringEventId(null)}>Cancel</Button>
            <Button onClick={handlePaymentSubmit}>Proceed to Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EventsPage;
