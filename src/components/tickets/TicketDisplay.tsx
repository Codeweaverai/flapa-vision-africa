import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, User, Ticket, Hash, Printer, Download, Music } from 'lucide-react';
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
        size: auto;
        margin: 0mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const downloadPdfTicket = () => {
    if (!ticketRef.current) return;

    const input = ticketRef.current;
    const scale = 2; // Increase scale for better quality

    html2canvas(input, {
      scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${event.title}_${ticket.ticket_code}.pdf`);
    });
  };

  return (
    <div className={`ticket-container ${showPrintStyles ? 'print-ticket' : ''}`}>
      {/* Action buttons */}
      {!showPrintStyles && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
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

      {/* New Ticket Design */}
      <div 
        ref={ticketRef}
        className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md mx-auto"
      >
        {/* Perforation on the right side */}
        <div className="absolute top-0 right-0 h-full w-6 flex flex-col items-center justify-around z-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-100 rounded-full shadow-inner" />
          ))}
        </div>

        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white p-6">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center">
            <h1 className="text-2xl font-black tracking-wider mb-1">TICKET</h1>
            <h2 className="text-lg font-medium tracking-widest">MUSIC EVENT</h2>
            
            {/* Music icons */}
            <div className="flex justify-center gap-3 mt-3">
              <Music className="h-5 w-5 text-white" />
              <div className="h-5 w-5 rounded-full border-2 border-white"></div>
              <div className="h-5 w-5 transform rotate-45 border-2 border-white"></div>
              <div className="h-5 w-5 border-2 border-white"></div>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6">
          {/* Event Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-gray-900 relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-1/4 after:w-1/2 after:h-1 after:bg-gradient-to-r after:from-red-500 after:to-pink-600 after:rounded">
              {event.title}
            </h2>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Name:</span>
              <span className="font-semibold text-gray-900">{ticket.ticket_holder_name}</span>
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
              <span className="font-semibold text-gray-900 text-right max-w-[60%]">{event.location}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Ticket Code:</span>
              <span className="font-semibold text-gray-900">{ticket.ticket_code}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Booking Code:</span>
              <span className="font-semibold text-gray-900">{ticket.booking.booking_code}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-dashed border-gray-300">
              <span className="font-semibold text-gray-600">Ticket Type:</span>
              <span className="font-semibold text-gray-900">{eventTicket.name}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 shadow-inner border border-gray-200">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 w-48 h-48 mx-auto rounded-lg flex items-center justify-center text-white font-bold relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="text-center z-10">
                  <div className="text-lg mb-2">QR CODE</div>
                  <div className="text-xs">Scan for entry</div>
                </div>
              </div>
              <p className="font-bold text-red-500 text-lg mt-3 tracking-wider">SCAN HERE</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 text-center border-t-2 border-dashed border-gray-300">
          <p className="font-bold text-red-500 mb-2">BRING YOUR VALID ID CARD</p>
          <p className="font-semibold text-blue-600 text-sm mb-2">Powered by SkillPulse Innovations Limited</p>
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
              }
            }
          `}
        </style>
      )}
    </div>
  );
};

export default TicketDisplay;
