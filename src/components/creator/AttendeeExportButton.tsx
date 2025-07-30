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
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
  events: {
    title: string;
  } | null;
}

interface AttendeeExportButtonProps {
  eventId?: string;
  eventTitle?: string;
}

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ eventId, eventTitle }) => {
  const { user } = useAuth();

  const fetchAttendeeData = async (): Promise<AttendeeData[]> => {
    try {
      let query = supabase
        .from('event_bookings')
        .select(`
          id,
          user_id,
          event_id,
          booking_code,
          payment_status,
          created_at,
          profiles:user_id (
            full_name,
            username
          ),
          events:event_id (
            title
          )
        `)
        .eq('payment_status', 'completed');

      // If eventId is provided, filter by specific event
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else {
        // Otherwise, get all events for the current creator
        const { data: creatorEvents, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('creator_id', user?.id);

        if (eventsError) throw eventsError;
        
        const eventIds = creatorEvents?.map(e => e.id) || [];
        if (eventIds.length === 0) return [];
        
        query = query.in('event_id', eventIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching attendee data:', error);
      toast.error('Failed to fetch attendee data');
      return [];
    }
  };

  const exportToExcel = async () => {
    const attendees = await fetchAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const exportData = attendees.map(attendee => ({
      'Event Title': attendee.events?.title || 'Unknown Event',
      'Attendee Name': attendee.profiles?.full_name || attendee.profiles?.username || 'Unknown',
      'Booking Code': attendee.booking_code || 'N/A',
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
      attendee.events?.title || 'Unknown Event',
      attendee.profiles?.full_name || attendee.profiles?.username || 'Unknown',
      attendee.booking_code || 'N/A',
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
