
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

interface AttendeeExportButtonProps {
  attendees: AttendeeData[];
  eventTitle: string;
}

const AttendeeExportButton: React.FC<AttendeeExportButtonProps> = ({ 
  attendees, 
  eventTitle 
}) => {
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.text('Attendee Report', 14, 22);
    doc.setFontSize(14);
    doc.text(eventTitle, 14, 32);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 42);
    
    // Prepare data for table
    const tableData = attendees.map(attendee => [
      attendee.ticket_holder_name || attendee.user_profile?.full_name || 'Unknown',
      attendee.ticket_code,
      attendee.booking_code,
      attendee.payment_status === 'completed' ? 'Confirmed' : 'Pending',
      attendee.checked_in ? 'Checked In' : 'Pending',
      attendee.check_in_time ? format(new Date(attendee.check_in_time), 'HH:mm') : '-'
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Attendee Name', 'Ticket Code', 'Booking Code', 'Status', 'Check-in', 'Time']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      }
    });
    
    // Save
    doc.save(`${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.pdf`);
  };

  const exportToCSV = () => {
    const csvData = attendees.map(attendee => ({
      'Attendee Name': attendee.ticket_holder_name || attendee.user_profile?.full_name || 'Unknown',
      'Ticket Code': attendee.ticket_code,
      'Booking Code': attendee.booking_code,
      'Payment Status': attendee.payment_status === 'completed' ? 'Confirmed' : 'Pending',
      'Check-in Status': attendee.checked_in ? 'Checked In' : 'Pending',
      'Check-in Time': attendee.check_in_time ? format(new Date(attendee.check_in_time), 'yyyy-MM-dd HH:mm:ss') : '',
      'Booking Status': attendee.booking_status
    }));
    
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    
    XLSX.writeFile(wb, `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.xlsx`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttendeeExportButton;
