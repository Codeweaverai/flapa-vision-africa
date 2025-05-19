import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Calendar, Users, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { EventWithRegistrations, CombinedRegistration } from '@/types/eventTypes';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';

const AdminRegistrations = () => {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events with registration counts
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations:event_registrations(count)
        `)
        .order('start_time', { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch detailed registrations for each event
      const eventsWithRegistrations = await Promise.all(
        data.map(async (event) => {
          const { data: registrations, error: regError } = await supabase
            .from('event_registrations')
            .select(`
              *,
              user:profiles(id, email, full_name)
            `)
            .eq('event_id', event.id);

          if (regError) {
            console.error('Error fetching registrations:', regError);
            return {
              ...event,
              date: event.start_time,
              registrations: []
            };
          }

          return {
            ...event,
            date: event.start_time,
            registrations: registrations as unknown as CombinedRegistration[]
          };
        })
      );

      setEvents(eventsWithRegistrations as EventWithRegistrations[]);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'upcoming') return matchesSearch && new Date(event.date) > new Date();
    if (activeTab === 'past') return matchesSearch && new Date(event.date) <= new Date();
    
    return matchesSearch;
  });

  const getTotalRegistrations = (event: EventWithRegistrations) => {
    return event.registrations?.length || 0;
  };

  const getRegistrationData = () => {
    const data: any[] = [];
    
    events.forEach(event => {
      event.registrations?.forEach(reg => {
        data.push({
          'Event Name': event.title,
          'Event Date': format(new Date(event.date), 'PPP'),
          'Registration Date': format(new Date(reg.registration_date), 'PPP'),
          'Attendee Name': reg.user?.full_name || 'N/A',
          'Attendee Email': reg.user?.email || 'N/A',
          'Status': reg.status,
          'Payment Status': reg.payment_status
        });
      });
    });
    
    return data;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Event Registrations</h1>
          <CSVLink 
            data={getRegistrationData()} 
            filename="event-registrations.csv"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </CSVLink>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Registration Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <Calendar className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <Users className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registrations</p>
                    <p className="text-2xl font-bold">
                      {events.reduce((acc, event) => acc + getTotalRegistrations(event), 0)}
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg flex items-center">
                  <DollarSign className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Events</p>
                    <p className="text-2xl font-bold">
                      {events.filter(event => new Date(event.date) > new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Event Registrations</CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
                  <TabsTrigger value="all">All Events</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No events found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Registrations</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            {event.date ? format(new Date(event.date), 'PPP') : 'N/A'}
                            <Badge 
                              variant={new Date(event.date) > new Date() ? "outline" : "secondary"}
                              className="ml-2"
                            >
                              {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTotalRegistrations(event)} / {event.capacity || '∞'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Implement view details functionality
                                // This could open a modal or navigate to a details page
                                toast.info(`Viewing details for ${event.title}`);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRegistrations;
