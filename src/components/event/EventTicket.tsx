
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Ticket, Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface EventTicketProps {
  ticketId: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  eventDate: string;
  eventLocation: string;
  ticketNumber: string;
  isPaid: boolean;
  ticketType?: string;
  qrValue?: string;
}

const EventTicket: React.FC<EventTicketProps> = ({
  ticketId,
  eventId,
  eventName,
  attendeeName,
  eventDate,
  eventLocation,
  ticketNumber,
  isPaid,
  ticketType = 'Standard Admission',
  qrValue
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const qrCodeValue = qrValue || `${eventId}:${ticketId}:${ticketNumber}`;

  const handleDownloadPDF = () => {
    if (!ticketRef.current) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });
    
    // Set background color
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Add event details
    doc.setFontSize(24);
    doc.text(eventName, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Date: ${format(new Date(eventDate), 'PPP')}`, 105, 45, { align: 'center' });
    doc.text(`Location: ${eventLocation}`, 105, 55, { align: 'center' });
    doc.text(`Attendee: ${attendeeName}`, 105, 65, { align: 'center' });
    
    // Add ticket type and number
    doc.setFontSize(14);
    doc.text(`Ticket Type: ${ticketType}`, 105, 80, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`Ticket #: ${ticketNumber}`, 105, 90, { align: 'center' });
    
    // Add QR code - need to use an image for jspdf
    // A placeholder for the QR code (normally we would add the actual QR code as an image)
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(70, 100, 70, 70, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.text(`QR Code: ${qrCodeValue}`, 105, 135, { align: 'center' });

    // Add paid/free indicator
    doc.setFontSize(12);
    if (isPaid) {
      doc.setTextColor(0, 128, 0);
      doc.text('PAID', 105, 180, { align: 'center' });
    } else {
      doc.setTextColor(0, 0, 255);
      doc.text('FREE ADMISSION', 105, 180, { align: 'center' });
    }
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Add footer
    doc.setFontSize(9);
    doc.text('This ticket serves as proof of purchase. Please present this ticket at the event.', 105, 190, { align: 'center' });
    
    // Save the PDF
    doc.save(`${eventName.replace(/\s+/g, '_')}_Ticket_${ticketNumber}.pdf`);
  };
  
  const handlePrint = () => {
    const printContent = document.createElement('div');
    if (!ticketRef.current) return;
    
    printContent.innerHTML = ticketRef.current.innerHTML;
    document.body.appendChild(printContent);
    
    window.print();
    
    document.body.removeChild(printContent);
  };

  return (
    <div>
      <Card className="w-full max-w-md mx-auto overflow-hidden border-2" ref={ticketRef}>
        <div className="bg-primary p-4 text-primary-foreground">
          <div className="flex justify-between items-center">
            <Ticket className="h-6 w-6" />
            <h3 className="text-lg font-bold">Event Ticket</h3>
            <div className="py-1 px-2 rounded-full bg-background text-xs text-foreground font-medium">
              {isPaid ? 'PAID' : 'FREE'}
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">{eventName}</h2>
            <p className="text-muted-foreground mb-2">
              {format(new Date(eventDate), 'PPP')}
            </p>
            <p className="text-sm">{eventLocation}</p>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Attendee</p>
                <p className="font-medium">{attendeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket Type</p>
                <p className="font-medium">{ticketType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket #</p>
                <p className="font-medium">{ticketNumber}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="border p-3 bg-white rounded-lg">
              <QRCodeSVG value={qrCodeValue} size={150} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-4 gap-2">
        <Button 
          variant="outline" 
          onClick={handleDownloadPDF}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button 
          onClick={handlePrint}
          className="flex items-center gap-1"
        >
          <Printer className="h-4 w-4" /> Print Ticket
        </Button>
      </div>
    </div>
  );
};

export default EventTicket;
