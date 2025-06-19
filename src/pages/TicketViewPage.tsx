
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import TicketDisplay from '@/components/tickets/TicketDisplay';
import html2pdf from 'html2pdf.js';

interface TicketData {
  id: string;
  ticket_code: string;
  ticket_number?: string;
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
      image_url: string;
      event_type: string;
    };
    event_ticket: {
      name: string;
      ticket_type: string;
    };
  };
}

const TicketViewPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId && user) {
      loadTickets();
    }
  }, [bookingId, user]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      // First verify the booking belongs to the user
      const { data: booking, error: bookingError } = await supabaseClient
        .from('event_bookings')
        .select('user_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking || booking.user_id !== user?.id) {
        throw new Error('Unauthorized access to tickets');
      }

      // Fetch all generated tickets for this booking
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          booking:event_bookings!inner (
            booking_code,
            user_id,
            event:events (
              title,
              start_time,
              end_time,
              location,
              image_url,
              event_type
            ),
            event_ticket:event_tickets (
              name,
              ticket_type
            )
          )
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const printTickets = () => {
    window.print();
  };

  const downloadAsPDF = () => {
    const element = document.getElementById('tickets-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `tickets-${bookingId?.slice(0, 8)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  if (tickets.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md text-center shadow-xl">
            <CardContent className="pt-6">
              <Ticket className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">No Tickets Found</h2>
              <p className="text-gray-600 mb-4">The tickets you're looking for don't exist or you don't have permission to view them.</p>
              <Button onClick={() => window.history.back()} className="bg-gradient-to-r from-orange-500 to-purple-600">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Print Styles */}
            <style>
              {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #tickets-content, #tickets-content * {
                    visibility: visible;
                  }
                  #tickets-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .ticket-container {
                    page-break-after: always;
                  }
                  .ticket-container:last-child {
                    page-break-after: avoid;
                  }
                }
              `}
            </style>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mb-6 no-print">
              <Button onClick={printTickets} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Printer className="h-4 w-4 mr-2" />
                Print Tickets
              </Button>
              <Button onClick={downloadAsPDF} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Tickets Content */}
            <div id="tickets-content" className="space-y-8">
              {tickets.map((ticket, index) => (
                <div key={ticket.id}>
                  <TicketDisplay ticket={ticket} showPrintStyles={true} />
                  {index < tickets.length - 1 && <div className="h-8"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketViewPage;
