
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AttendeeData {
  id: string;
  user_id: string;
  event_id: string;
  booking_code: string;
  payment_status: string;
  created_at: string;
  user_name: string;
  event_title: string;
}

interface AttendeeExportButtonProps {
  eventId?: string;
  eventTitle?: string;
}

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ eventId, eventTitle }) => {
  const { user } = useAuth();

  const fetchAttendeeData = async (): Promise<AttendeeData[]> => {
    try {
      let bookingsQuery = supabase
        .from('event_bookings')
        .select('id, user_id, event_id, booking_code, payment_status, created_at')
        .eq('payment_status', 'completed');

      // If eventId is provided, filter by specific event
      if (eventId) {
        bookingsQuery = bookingsQuery.eq('event_id', eventId);
      } else {
        // Get all events for the current creator
        const { data: creatorEvents, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('creator_id', user?.id);

        if (eventsError) throw eventsError;
        
        const eventIds = creatorEvents?.map(e => e.id) || [];
        if (eventIds.length === 0) return [];
        
        bookingsQuery = bookingsQuery.in('event_id', eventIds);
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery.order('created_at', { ascending: false });
      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) return [];

      // Get user profiles
      const userIds = [...new Set(bookings.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      // Get event details
      const eventIds = [...new Set(bookings.map(b => b.event_id))];
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      // Combine data manually
      const attendees: AttendeeData[] = bookings.map(booking => {
        const profile = profiles?.find(p => p.id === booking.user_id);
        const event = events?.find(e => e.id === booking.event_id);
        
        return {
          id: booking.id,
          user_id: booking.user_id,
          event_id: booking.event_id,
          booking_code: booking.booking_code || 'N/A',
          payment_status: booking.payment_status,
          created_at: booking.created_at,
          user_name: profile?.full_name || profile?.username || 'Unknown',
          event_title: event?.title || 'Unknown Event'
        };
      });

      return attendees;
    } catch (error) {
      console.error('Error fetching attendee data:', error);
      toast.error('Failed to fetch attendee data');
      return [];
    }
  };

  const exportToCSV = async () => {
    const attendees = await fetchAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const csvContent = [
      ['Event Title', 'Attendee Name', 'Booking Code', 'Payment Status', 'Registration Date'],
      ...attendees.map(attendee => [
        attendee.event_title,
        attendee.user_name,
        attendee.booking_code,
        attendee.payment_status,
        formatDate(attendee.created_at)
      ])
    ];

    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = eventTitle 
      ? `${eventTitle}-attendees.csv` 
      : `all-event-attendees-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV report exported successfully');
  };

  const exportToExcel = async () => {
    const attendees = await fetchAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const exportData = attendees.map(attendee => ({
      'Event Title': attendee.event_title,
      'Attendee Name': attendee.user_name,
      'Booking Code': attendee.booking_code,
      'Payment Status': attendee.payment_status,
      'Registration Date': formatDate(attendee.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    
    const filename = eventTitle 
      ? `${eventTitle}-attendees.xlsx` 
      : `all-event-attendees-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    toast.success('Excel report exported successfully');
  };

  const exportToPDF = async () => {
    const attendees = await fetchAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.text(eventTitle || 'Event Attendees Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, 32);
    
    // Prepare table data
    const tableData = attendees.map(attendee => [
      attendee.event_title,
      attendee.user_name,
      attendee.booking_code,
      attendee.payment_status,
      formatDate(attendee.created_at)
    ]);

    // Create table
    autoTable(doc, {
      head: [['Event Title', 'Attendee Name', 'Booking Code', 'Payment Status', 'Registration Date']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
    
    const filename = eventTitle 
      ? `${eventTitle}-attendees.pdf` 
      : `all-event-attendees-${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    toast.success('PDF report exported successfully');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttendeeExportButton;
