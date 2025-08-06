
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

interface ComprehensiveAttendeeData {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string;
  ticket_code: string;
  payment_status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  phone_number?: string;
  payment_amount: number;
  payment_currency: string;
  ticket_quantity: number;
  check_in_status: string;
  check_in_time?: string;
  checked_in_by?: string;
  ticket_holder_name: string;
}

interface AttendeeExportButtonProps {
  eventId?: string;
  eventTitle?: string;
}

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ eventId, eventTitle }) => {
  const { user } = useAuth();

  const fetchComprehensiveAttendeeData = async (): Promise<ComprehensiveAttendeeData[]> => {
    try {
      let ticketsQuery = supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!generated_tickets_booking_id_fkey (
            booking_code,
            status,
            payment_status,
            payment_amount,
            payment_currency,
            phone_number
          ),
          check_in:check_ins!check_ins_ticket_id_fkey (
            check_in_time,
            checked_in_by
          )
        `)
        .eq('ticket_status', 'active');

      // If eventId is provided, filter by specific event
      if (eventId) {
        ticketsQuery = ticketsQuery.eq('event_id', eventId);
      } else {
        // Get all events for the current creator
        const { data: creatorEvents, error: eventsError } = await supabase
          .from('events')
          .select('id')
          .eq('creator_id', user?.id);

        if (eventsError) throw eventsError;
        
        const eventIds = creatorEvents?.map(e => e.id) || [];
        if (eventIds.length === 0) return [];
        
        ticketsQuery = ticketsQuery.in('event_id', eventIds);
      }

      const { data: tickets, error: ticketsError } = await ticketsQuery.order('created_at', { ascending: false });
      if (ticketsError) throw ticketsError;

      if (!tickets || tickets.length === 0) return [];

      // Get user profiles and emails
      const userIds = [...new Set(tickets.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      // Get user emails
      const { data: userEmails } = await supabase.rpc('get_user_emails', { user_ids: userIds });

      // Get event details
      const eventIds = [...new Set(tickets.map(t => t.event_id))];
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      // Get check-in performer details
      const checkedInByIds = [...new Set(tickets.flatMap(t => t.check_in?.map(ci => ci.checked_in_by).filter(Boolean)) || [])];
      const { data: checkedInByProfiles } = checkedInByIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', checkedInByIds) : { data: [] };

      // Combine all data - one entry per ticket
      const comprehensiveData: ComprehensiveAttendeeData[] = tickets.map(ticket => {
        const profile = profiles?.find(p => p.id === ticket.user_id);
        const email = userEmails?.find(e => e.id === ticket.user_id);
        const event = events?.find(e => e.id === ticket.event_id);
        const checkIn = ticket.check_in?.[0];
        const checkedInBy = checkIn?.checked_in_by ? 
          checkedInByProfiles?.find(p => p.id === checkIn.checked_in_by) : null;
        
        return {
          id: ticket.id,
          user_id: ticket.user_id,
          event_id: ticket.event_id,
          event_title: event?.title || 'Unknown Event',
          ticket_code: ticket.ticket_code,
          payment_status: ticket.booking?.payment_status || 'pending',
          created_at: ticket.created_at,
          user_name: profile?.full_name || profile?.username || 'Unknown',
          user_email: email?.email || 'Not available',
          phone_number: ticket.booking?.phone_number || 'Not provided',
          payment_amount: ticket.booking?.payment_amount || 0,
          payment_currency: ticket.booking?.payment_currency || 'USD',
          ticket_quantity: 1, // Each ticket is one entry
          check_in_status: checkIn ? 'Checked In' : 'Not Checked In',
          check_in_time: checkIn?.check_in_time || undefined,
          checked_in_by: checkedInBy ? (checkedInBy.full_name || checkedInBy.username) : undefined,
          ticket_holder_name: ticket.ticket_holder_name || profile?.full_name || 'Unknown'
        };
      });

      return comprehensiveData;
    } catch (error) {
      console.error('Error fetching comprehensive attendee data:', error);
      toast.error('Failed to fetch attendee data');
      return [];
    }
  };

  const exportToCSV = async () => {
    const attendees = await fetchComprehensiveAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const csvContent = [
      ['Event Title', 'Attendee Name', 'Email', 'Phone', 'Ticket Code', 'Payment Status', 'Payment Amount', 'Currency', 'Check-in Status', 'Check-in Time', 'Checked In By', 'Registration Date'],
      ...attendees.map(attendee => [
        attendee.event_title,
        attendee.ticket_holder_name,
        attendee.user_email,
        attendee.phone_number || 'Not provided',
        attendee.ticket_code,
        attendee.payment_status,
        attendee.payment_amount.toString(),
        attendee.payment_currency,
        attendee.check_in_status,
        attendee.check_in_time ? formatDate(attendee.check_in_time) : 'N/A',
        attendee.checked_in_by || 'N/A',
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
      ? `${eventTitle}-comprehensive-attendees.csv` 
      : `all-events-comprehensive-attendees-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Comprehensive CSV report exported successfully');
  };

  const exportToExcel = async () => {
    const attendees = await fetchComprehensiveAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const exportData = attendees.map(attendee => ({
      'Event Title': attendee.event_title,
      'Attendee Name': attendee.ticket_holder_name,
      'Email': attendee.user_email,
      'Phone': attendee.phone_number || 'Not provided',
      'Ticket Code': attendee.ticket_code,
      'Payment Status': attendee.payment_status,
      'Payment Amount': attendee.payment_amount,
      'Currency': attendee.payment_currency,
      'Check-in Status': attendee.check_in_status,
      'Check-in Time': attendee.check_in_time ? formatDate(attendee.check_in_time) : 'N/A',
      'Checked In By': attendee.checked_in_by || 'N/A',
      'Registration Date': formatDate(attendee.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    
    const filename = eventTitle 
      ? `${eventTitle}-comprehensive-attendees.xlsx` 
      : `all-events-comprehensive-attendees-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    toast.success('Comprehensive Excel report exported successfully');
  };

  const exportToPDF = async () => {
    const attendees = await fetchComprehensiveAttendeeData();
    if (attendees.length === 0) {
      toast.error('No attendee data available for export');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4'); // Portrait orientation
    
    // Add header
    doc.setFontSize(18);
    doc.text(eventTitle ? `${eventTitle} - Comprehensive Attendee Report` : 'Comprehensive Attendee Report', 40, 40);
    doc.setFontSize(12);
    doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 40, 60);
    
    // Summary statistics
    const totalAttendees = attendees.length;
    const checkedInCount = attendees.filter(a => a.check_in_status === 'Checked In').length;
    const totalRevenue = attendees.reduce((sum, a) => sum + a.payment_amount, 0);
    
    doc.text(`Total Tickets: ${totalAttendees}`, 40, 85);
    doc.text(`Checked In: ${checkedInCount} (${Math.round((checkedInCount / totalAttendees) * 100)}%)`, 200, 85);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 400, 85);
    
    // Prepare table data for portrait orientation
    const tableData = attendees.map(attendee => [
      attendee.ticket_holder_name,
      attendee.user_email,
      attendee.ticket_code,
      `$${attendee.payment_amount}`,
      attendee.check_in_status,
      attendee.check_in_time ? formatDate(attendee.check_in_time) : 'N/A'
    ]);

    // Create table optimized for portrait
    autoTable(doc, {
      head: [['Name', 'Email', 'Ticket Code', 'Amount', 'Check-in', 'Check-in Time']],
      body: tableData,
      startY: 110,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 }, // Name
        1: { cellWidth: 120 }, // Email
        2: { cellWidth: 80 }, // Ticket Code
        3: { cellWidth: 50 }, // Amount
        4: { cellWidth: 70 }, // Check-in Status
        5: { cellWidth: 80 }, // Check-in Time
      },
      margin: { left: 40, right: 40 },
    });
    
    const filename = eventTitle 
      ? `${eventTitle}-comprehensive-attendees.pdf` 
      : `all-events-comprehensive-attendees-${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
    toast.success('Comprehensive PDF report exported successfully');
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
          Export as CSV (All Data)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel (All Data)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF (Portrait)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttendeeExportButton;
