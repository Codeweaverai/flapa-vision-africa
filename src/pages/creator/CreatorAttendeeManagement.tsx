
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, CheckCircle, Clock, QrCode, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CreatorLayout from '@/components/creator/CreatorLayout';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
}

interface AttendeeData {
  id: string;
  ticket_code: string;
  booking_code: string;
  ticket_holder_name: string;
  user_id: string;
  event_id: string;
  booking_id: string;
  checked_in: boolean;
  check_in_time?: string;
  user_profile?: {
    full_name: string;
  };
  booking_status: string;
  payment_status: string;
}

const CreatorAttendeeManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCreatorEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventAttendees();
    }
  }, [selectedEvent]);

  const fetchCreatorEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_time, end_time, location')
        .eq('creator_id', user?.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      
      if (data && data.length > 0) {
        setSelectedEvent(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching creator events:', error);
      toast({
        title: "Error",
        description: "Failed to load your events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventAttendees = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);
      
      // Fetch generated tickets with booking and check-in data
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!generated_tickets_booking_id_fkey (
            booking_code,
            status,
            payment_status
          ),
          check_in:check_ins!check_ins_ticket_id_fkey (
            check_in_time,
            checked_in_by
          )
        `)
        .eq('event_id', selectedEvent);

      if (ticketsError) throw ticketsError;

      // Get user profiles separately (without email field)
      const userIds = ticketsData?.map(ticket => ticket.user_id).filter(Boolean) || [];
      
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profilesData = profiles || [];
      }

      // Combine data
      const attendeesData: AttendeeData[] = ticketsData?.map(ticket => ({
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        booking_code: ticket.booking?.booking_code || '',
        ticket_holder_name: ticket.ticket_holder_name,
        user_id: ticket.user_id,
        event_id: ticket.event_id,
        booking_id: ticket.booking_id,
        checked_in: ticket.checked_in || false,
        check_in_time: ticket.check_in?.[0]?.check_in_time,
        user_profile: profilesData.find(profile => profile.id === ticket.user_id),
        booking_status: ticket.booking?.status || 'pending',
        payment_status: ticket.booking?.payment_status || 'pending'
      })) || [];

      setAttendees(attendeesData);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast({
        title: "Error",
        description: "Failed to load attendees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId: string, bookingId: string) => {
    try {
      setCheckingIn(ticketId);
      
      const { error } = await supabase.functions.invoke('checkin-ticket', {
        body: {
          ticketId,
          bookingId,
          eventId: selectedEvent,
          checkedInBy: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendee checked in successfully",
      });

      // Refresh attendees
      fetchEventAttendees();
    } catch (error) {
      console.error('Error checking in attendee:', error);
      toast({
        title: "Error",
        description: "Failed to check in attendee",
        variant: "destructive"
      });
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredAttendees = attendees.filter(attendee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      attendee.ticket_holder_name?.toLowerCase().includes(searchLower) ||
      attendee.ticket_code?.toLowerCase().includes(searchLower) ||
      attendee.booking_code?.toLowerCase().includes(searchLower) ||
      attendee.user_profile?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const checkedInCount = attendees.filter(a => a.checked_in).length;
  const pendingCount = attendees.length - checkedInCount;

  const selectedEventData = events.find(e => e.id === selectedEvent);

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendee Management</h1>
            <p className="text-gray-600">Track and manage your event attendees in real-time</p>
          </div>

          {/* Event Selection */}
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Select Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an event to manage" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(event.start_time), 'PPP')} • {event.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEvent && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Checked In</p>
                        <p className="text-2xl font-bold text-green-700">{checkedInCount}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">Pending</p>
                        <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Total Attendees</p>
                        <p className="text-2xl font-bold text-purple-700">{attendees.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <Card className="mb-6 bg-white/80 backdrop-blur-sm border-orange-200">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, ticket code, or booking code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/ticket-verification', '_blank')}
                        className="flex items-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Scan Tickets
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendees Table */}
              <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    Attendee List
                    {selectedEventData && (
                      <Badge variant="outline" className="ml-2">
                        {selectedEventData.title}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Attendee</TableHead>
                            <TableHead>Ticket Code</TableHead>
                            <TableHead>Booking Code</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check-in Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttendees.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                {searchTerm ? 'No attendees found matching your search.' : 'No attendees found for this event.'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAttendees.map((attendee) => (
                              <TableRow key={attendee.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {attendee.ticket_holder_name || attendee.user_profile?.full_name || 'Unknown'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {attendee.ticket_code}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {attendee.booking_code}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={attendee.payment_status === 'completed' ? 'default' : 'secondary'}
                                    className={
                                      attendee.payment_status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }
                                  >
                                    {attendee.payment_status === 'completed' ? 'Confirmed' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {attendee.checked_in ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Checked In
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                    {attendee.check_in_time && (
                                      <span className="text-xs text-gray-500">
                                        {format(new Date(attendee.check_in_time), 'HH:mm')}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {!attendee.checked_in ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCheckIn(attendee.id, attendee.booking_id)}
                                      disabled={checkingIn === attendee.id}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {checkingIn === attendee.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Check In
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      ✓ Checked In
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAttendeeManagement;
