
import { EventWithRegistrations, CombinedRegistration } from '@/types/eventTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface AttendeeExportProps {
  events: EventWithRegistrations[];
  registrations: CombinedRegistration[];
}

const AttendeeExport = ({ events, registrations }: AttendeeExportProps) => {
  const exportAttendees = (eventId: string, format: 'xlsx' | 'pdf') => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Filter registrations for the selected event
    const filteredRegistrations = registrations.filter(reg => reg.event_id === eventId);
    
    // Convert to export format - safely access profile properties
    const exportData = filteredRegistrations.map(reg => {
      const fullName = reg.profiles && 'full_name' in reg.profiles ? reg.profiles.full_name : 'Unknown';
      const email = reg.profiles && 'email' in reg.profiles ? reg.profiles.email : 'Unknown';
      
      return {
        'Name': fullName || 'Unknown',
        'Email': email || 'Unknown',
        'Phone': reg.phone_number || 'Not provided',
        'Status': reg.status,
        'Payment Status': reg.payment_status,
        'Registration Date': formatDate(reg.created_at || new Date().toISOString())
      };
    });
    
    if (format === 'xlsx') {
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `${event.title}-attendees.xlsx`);
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF();
      
      // Add event title as header
      doc.setFontSize(18);
      doc.text(event.title, 14, 22);
      doc.setFontSize(12);
      doc.text('Attendee List', 14, 32);
      
      // Create the table
      autoTable(doc, {
        head: [['Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Registration Date']],
        body: exportData.map(row => [
          row.Name, 
          row.Email, 
          row.Phone, 
          row.Status, 
          row['Payment Status'],
          row['Registration Date']
        ]),
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });
      
      // Save the PDF
      doc.save(`${event.title}-attendees.pdf`);
    }
  };
  
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Export Attendees</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.filter(event => event.total_attendees > 0).map(event => (
          <Card key={event.id} className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {event.total_attendees} {event.total_attendees === 1 ? 'attendee' : 'attendees'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportAttendees(event.id, 'xlsx')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAttendees(event.id, 'pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Bookings: </span> 
                <Badge variant="outline">{event.bookings_count}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttendeeExport;
