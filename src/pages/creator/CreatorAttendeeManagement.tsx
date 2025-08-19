import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, CheckCircle, Clock, QrCode, Calendar, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CreatorLayout from '@/components/creator/CreatorLayout';
import AttendeeExportButton from '@/components/creator/AttendeeExportButton';
import BulkAnnouncementModal from '@/components/creator/BulkAnnouncementModal';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

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

const ITEMS_PER_PAGE = 5;

const CreatorAttendeeManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchCreatorEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventAttendees();
      setCurrentPage(1);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAttendees(filteredAttendees.map(a => a.id));
    } else {
      setSelectedAttendees([]);
    }
  };

  const handleSelectAttendee = (attendeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttendees(prev => [...prev, attendeeId]);
    } else {
      setSelectedAttendees(prev => prev.filter(id => id !== attendeeId));
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
  const totalPages = Math.ceil(filteredAttendees.length / ITEMS_PER_PAGE);
  const paginatedAttendees = filteredAttendees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const selectedEventData = events.find(e => e.id === selectedEvent);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const renderAttendeeCard = (attendee: AttendeeData) => {
    const gradientClass = attendee.checked_in 
      ? 'bg-gradient-to-br from-green-500 to-teal-600' 
      : 'bg-gradient-to-br from-orange-500 to-purple-600';
    
    return (
      <Card 
        key={attendee.id} 
        className={`mb-4 ${gradientClass} text-white shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-white/30`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedAttendees.includes(attendee.id)}
                onCheckedChange={(checked) => handleSelectAttendee(attendee.id, !!checked)}
                className="mt-1 bg-white/20 border-white/50 text-white"
              />
              <div className="min-w-0">
                <CardTitle className="text-lg text-white truncate">
                  {truncateText(attendee.ticket_holder_name || attendee.user_profile?.full_name || 'Unknown', window.innerWidth < 640 ? 20 : 50)}
                </CardTitle>
                <CardDescription className="text-white/80 truncate">
                  {attendee.booking_code}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`bg-white/20 text-white border-white/50 ${attendee.payment_status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}
            >
              {attendee.payment_status === 'completed' ? 'Confirmed' : 'Pending'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/80">Ticket Code</p>
              <p className="font-mono text-sm text-white truncate">{attendee.ticket_code}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Check-in Status</p>
              <div className="flex items-center gap-2">
                {attendee.checked_in ? (
                  <Badge className="bg-white/20 text-white border-white/50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Checked In</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/50">
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Pending</span>
                    <span className="sm:hidden">⌛</span>
                  </Badge>
                )}
                {attendee.check_in_time && (
                  <span className="text-xs text-white/80 hidden sm:inline">
                    {format(new Date(attendee.check_in_time), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {!attendee.checked_in ? (
            <Button
              size="sm"
              onClick={() => handleCheckIn(attendee.id, attendee.booking_id)}
              disabled={checkingIn === attendee.id}
              className="bg-white text-orange-600 hover:bg-white/90 shadow-md"
            >
              {checkingIn === attendee.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Check In</span>
                  <span className="sm:hidden">Check</span>
                </>
              )}
            </Button>
          ) : (
            <Badge variant="outline" className="bg-white/20 text-white border-white/50">
              <span className="hidden sm:inline">✓ Checked In</span>
              <span className="sm:hidden">✓ Done</span>
            </Badge>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <CreatorLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-orange-100">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">Attendee Management</h1>
            <p className="text-xs sm:text-base text-gray-600">Track and manage your event attendees</p>
          </div>

          {/* Event Selection Card */}
          <Card className="mb-4 bg-gradient-to-br from-orange-500 to-purple-600 text-white border-white/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                Select Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <SelectValue placeholder="Choose an event to manage" className="text-white" />
                </SelectTrigger>
                <SelectContent className="bg-white" align="start">
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id} className="hover:bg-orange-50">
                      <span className="font-medium truncate">
                        {truncateText(event.title, window.innerWidth < 640 ? 20 : 50)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEvent && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-xs sm:text-sm font-medium">Checked In</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-700">{checkedInCount}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-xs sm:text-sm font-medium">Pending</p>
                        <p className="text-lg sm:text-2xl font-bold text-orange-700">{pendingCount}</p>
                      </div>
                      <Clock className="h-5 w-5 sm:h-8 sm:w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-xs sm:text-sm font-medium">Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-purple-700">{attendees.length}</p>
                      </div>
                      <Users className="h-5 w-5 sm:h-8 sm:w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <Card className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm border-orange-200 shadow-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search attendees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {selectedAttendees.length > 0 && (
                        <Button
                          onClick={() => setShowAnnouncementModal(true)}
                          className="bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white w-full sm:w-auto"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="whitespace-nowrap">
                            Send ({selectedAttendees.length})
                          </span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/ticket-verification', '_blank')}
                        className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:from-orange-600 hover:to-purple-700 transition-all duration-300 border-transparent hover:border-transparent shadow-sm hover:shadow-md w-full sm:w-auto"
                      >
                        <QrCode className="h-4 w-4" />
                        <span className="whitespace-nowrap">Scan</span>
                      </Button>
                      <AttendeeExportButton 
                        eventId={selectedEvent} 
                        eventTitle={selectedEventData?.title} 
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendee Cards with Pagination */}
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-sm w-full max-w-[95vw] mx-auto">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-base sm:text-xl">
                        Attendee List
                      </CardTitle>
                      {selectedEventData && (
                        <Badge variant="outline" className="ml-2 hidden sm:flex">
                          {truncateText(selectedEventData.title, 20)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedAttendees.length === filteredAttendees.length && filteredAttendees.length > 0}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="text-xs sm:text-sm text-gray-600">
                        Select all
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {loading ? (
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i} 
                          className="h-24 bg-gradient-to-br from-orange-100 to-purple-100 rounded-lg border-2 border-white/30 animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : filteredAttendees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No attendees found matching your search.' : 'No attendees found for this event.'}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {paginatedAttendees.map(renderAttendeeCard)}
                    </div>
                  )}
                </CardContent>
                {filteredAttendees.length > ITEMS_PER_PAGE && (
                  <CardFooter className="flex justify-center px-2 sm:px-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-xs sm:text-sm text-gray-700 px-2">
                            Page {currentPage} of {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </CardFooter>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Bulk Announcement Modal */}
      <BulkAnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        selectedAttendees={selectedAttendees}
        attendeesData={attendees}
        eventTitle={selectedEventData?.title || 'Event'}
      />
    </CreatorLayout>
  );
};

export default CreatorAttendeeManagement;
