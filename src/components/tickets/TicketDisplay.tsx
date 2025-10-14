import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, User, Ticket, Hash, Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TicketProps {
  ticket: {
    id: string;
    ticket_code: string;
    ticket_holder_name: string;
    qr_code_data: string;
    ticket_status: string;
    booking: {
      booking_code: string;
      event: {
        title: string;
        start_time: string;
        end_time: string;
        location: string;
        image_url?: string;
        description?: string;
        event_type?: string;
      };
      event_ticket: {
        name: string;
        ticket_type: string;
      };
    };
  };
  showPrintStyles?: boolean;
}

const TicketDisplay: React.FC<TicketProps> = ({ ticket, showPrintStyles = false }) => {
  const event = ticket.booking.event;
  const eventTicket = ticket.booking.event_ticket;
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white !important;
        }
        .ticket-container {
          width: 100% !important;
          max-width: none !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
        }
      }
    `,
  });

  const downloadPdfTicket = () => {
    if (!ticketRef.current) return;

    const input = ticketRef.current;
    const scale = 2;

    html2canvas(input, {
      scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 160;
      const pageHeight = 275;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${event.title}_${ticket.ticket_code}.pdf`);
    });
  };

  // Safe format event type for display with error handling
  const formatEventType = (eventType: string | undefined): string => {
    if (!eventType) return 'EVENT';
    
    try {
      return eventType
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      console.warn('Error formatting event type:', error);
      return eventType.toUpperCase();
    }
  };

  // Safe event type access with fallback
  const eventType = event.event_type || 'event';
  const formattedEventType = formatEventType(eventType);

  return (
    <div className={`ticket-container ${showPrintStyles ? 'print-ticket' : ''}`}>
      {/* Action buttons */}
      {!showPrintStyles && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            style={{ backgroundColor: '#FFAC1C' }}
          >
            <Printer className="h-5 w-5" />
            Print Ticket
          </button>
          <button
            onClick={downloadPdfTicket}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-all duration-300"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
        </div>
      )}

      {/* Enhanced Ticket Design */}
      <div 
        ref={ticketRef}
        className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto print:max-w-none print:shadow-none"
        style={{ minHeight: '480px' }}
      >
        {/* Perforation on the right side */}
        <div className="absolute top-0 right-0 h-full w-6 flex flex-col items-center justify-around z-10 print:hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-100 rounded-full shadow-inner" />
          ))}
        </div>

        {/* Header with bright orange background */}
        <div 
          className="relative text-white p-5 print:bg-[#FFAC1C]"
          style={{ backgroundColor: '#FFAC1C' }}
        >
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Ticket className="h-5 w-5 text-white" />
              <h1 className="text-xl font-black tracking-wider">EVENT TICKET</h1>
            </div>
            <h2 className="text-base font-medium tracking-widest">
              {formattedEventType.toUpperCase()}
            </h2>
            
            {/* Decorative elements */}
            <div className="flex justify-center gap-2 mt-2">
              <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
              <div className="w-1 h-1 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5">
          {/* Event Title */}
          <div className="text-center mb-4">
            <h2 
              className="text-lg font-black text-gray-900 relative pb-2"
              style={{ 
                borderBottom: '2px solid #FFAC1C',
                paddingBottom: '8px'
              }}
            >
              {event.title}
            </h2>
          </div>

          {/* Ticket Details */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Name:</span>
              <span className="font-semibold text-gray-900 text-right max-w-[55%] text-sm">
                {ticket.ticket_holder_name}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Date:</span>
              <span className="font-semibold text-gray-900 text-sm">
                {format(new Date(event.start_time), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Time:</span>
              <span className="font-semibold text-gray-900 text-sm">
                {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Venue:</span>
              <span className="font-semibold text-gray-900 text-right max-w-[55%] text-sm">
                {event.location}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Ticket Code:</span>
              <span className="font-semibold text-gray-900 font-mono text-sm">
                {ticket.ticket_code}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Booking Code:</span>
              <span className="font-semibold text-gray-900 font-mono text-sm">
                {ticket.booking.booking_code}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600 text-sm">Ticket Type:</span>
              <span className="font-semibold text-gray-900 text-sm">
                {eventTicket.name}
              </span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center mb-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:bg-gray-50">
              <div className="bg-white p-3 rounded-lg mx-auto w-40 h-40 flex items-center justify-center border border-gray-300">
                <QRCodeSVG 
                  value={ticket.qr_code_data}
                  size={140}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <p 
                className="font-bold text-lg mt-2 tracking-wider"
                style={{ color: '#FFAC1C' }}
              >
                SCAN HERE
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Present QR code at event entrance
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Simplified */}
        <div className="bg-gray-50 p-4 text-center border-t-2 border-dashed border-gray-300 print:bg-gray-50">
          <p 
            className="font-bold mb-1 text-sm"
            style={{ color: '#FFAC1C' }}
          >
            BRING YOUR VALID ID CARD
          </p>
          <p className="font-semibold text-blue-600 text-xs">
            Powered by SkillPulse Innovations Limited
          </p>
        </div>
      </div>

      {showPrintStyles && (
        <style>
          {`
            @media print {
              .print-ticket {
                page-break-after: always;
                margin: 0;
                box-shadow: none;
              }
              .print-ticket:last-child {
                page-break-after: avoid;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: white !important;
              }
            }
          `}
        </style>
      )}
    </div>
  );
};

export default TicketDisplay;
