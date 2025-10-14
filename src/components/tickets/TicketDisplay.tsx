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
        event_type?: string; // Made optional with fallback
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
      const imgWidth = 180;
      const pageHeight = 275;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
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

  // Get appropriate gradient based on event type with fallback
  const getHeaderGradient = (eventType: string | undefined): string => {
    const gradients = {
      'webinar': 'from-orange-500 to-amber-600',
      'conference': 'from-blue-500 to-indigo-600',
      'workshop': 'from-green-500 to-emerald-600',
      'concert': 'from-purple-500 to-pink-600',
      'meetup': 'from-cyan-500 to-blue-600',
      'seminar': 'from-violet-500 to-purple-600',
      'training': 'from-teal-500 to-green-600',
      'festival': 'from-rose-500 to-red-600',
      'sports-events': 'from-red-500 to-orange-600',
      'business-events': 'from-gray-600 to-gray-800',
      'live-music': 'from-purple-500 to-pink-600',
      'night-life': 'from-indigo-500 to-purple-600',
      'comedy-shows': 'from-yellow-500 to-orange-600',
      'wellness-events': 'from-green-500 to-teal-600',
      'summit': 'from-blue-500 to-cyan-600',
      'picnic': 'from-green-500 to-lime-600',
      'festivals': 'from-rose-500 to-pink-600',
      'gaming-events': 'from-purple-500 to-indigo-600',
      'food-drink': 'from-red-500 to-orange-600',
      'art-exhibitions': 'from-pink-500 to-rose-600',
      'travel-events': 'from-blue-500 to-cyan-600',
      'tech-meetups': 'from-blue-500 to-indigo-600',
      'science-fairs': 'from-purple-500 to-violet-600',
      'cultural-events': 'from-orange-500 to-red-600',
      'auto-shows': 'from-gray-500 to-gray-700',
      'science-events': 'from-purple-500 to-blue-600',
      'community-events': 'from-green-500 to-emerald-600',
    };
    
    return gradients[eventType as keyof typeof gradients] || 'from-orange-500 to-amber-600';
  };

  // Safe event type access with fallback
  const eventType = event.event_type || 'event';
  const formattedEventType = formatEventType(eventType);
  const headerGradient = getHeaderGradient(eventType);

  return (
    <div className={`ticket-container ${showPrintStyles ? 'print-ticket' : ''}`}>
      {/* Action buttons */}
      {!showPrintStyles && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Printer className="h-5 w-5" />
            Print Ticket
          </button>
          <button
            onClick={downloadPdfTicket}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Download className="h-5 w-5" />
            Download PDF
          </button>
        </div>
      )}

      {/* Enhanced Ticket Design */}
      <div 
        ref={ticketRef}
        className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-auto print:max-w-none print:shadow-none"
        style={{ minHeight: '500px' }}
      >
        {/* Perforation on the right side */}
        <div className="absolute top-0 right-0 h-full w-6 flex flex-col items-center justify-around z-10 print:hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-100 rounded-full shadow-inner" />
          ))}
        </div>

        {/* Header with dynamic gradient */}
        <div className={`relative bg-gradient-to-r ${headerGradient} text-white p-6 print:bg-gradient-to-r print:from-orange-500 print:to-amber-600`}>
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-black tracking-wider mb-1">EVENT TICKET</h1>
            <h2 className="text-lg font-medium tracking-widest">
              {formattedEventType.toUpperCase()}
            </h2>
            
            {/* Decorative elements */}
            <div className="flex justify-center gap-3 mt-3">
              <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          {/* Event Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-900 relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:w-1/2 after:h-1 after:bg-gradient-to-r after:from-orange-500 after:to-amber-600 after:rounded print:after:bg-gradient-to-r print:after:from-orange-500 print:after:to-amber-600">
              {event.title}
            </h2>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Name:</span>
              <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                {ticket.ticket_holder_name}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Date:</span>
              <span className="font-semibold text-gray-900">
                {format(new Date(event.start_time), 'MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Time:</span>
              <span className="font-semibold text-gray-900">
                {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Venue:</span>
              <span className="font-semibold text-gray-900 text-right max-w-[60%]">
                {event.location}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Ticket Code:</span>
              <span className="font-semibold text-gray-900 font-mono">
                {ticket.ticket_code}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Booking Code:</span>
              <span className="font-semibold text-gray-900 font-mono">
                {ticket.booking.booking_code}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Ticket Type:</span>
              <span className="font-semibold text-gray-900">
                {eventTicket.name}
              </span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 shadow-inner border border-gray-200 print:bg-gray-50">
              <div className="bg-white p-4 rounded-lg mx-auto w-48 h-48 flex items-center justify-center border border-gray-300">
                <QRCodeSVG 
                  value={ticket.qr_code_data || JSON.stringify({
                    ticket_code: ticket.ticket_code,
                    booking_code: ticket.booking.booking_code,
                    event_title: event.title,
                    ticket_holder: ticket.ticket_holder_name
                  })}
                  size={160}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <p className="font-bold text-orange-500 text-lg mt-3 tracking-wider print:text-orange-600">
                SCAN HERE
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Present QR code at event entrance
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 text-center border-t-2 border-dashed border-gray-300 print:bg-gray-50">
          <p className="font-bold text-orange-500 mb-2 print:text-orange-600">
            BRING YOUR VALID ID CARD
          </p>
          <p className="font-semibold text-blue-600 text-sm mb-2 print:text-blue-700">
            Powered by SkillPulse Innovations Limited
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            This ticket is non-transferable and non-refundable. Management reserves the right to refuse admission. Lost or stolen tickets will not be replaced.
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
