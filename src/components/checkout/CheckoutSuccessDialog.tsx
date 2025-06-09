
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, MapPin, User, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface TicketInfo {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  pdf_url: string;
  event_title: string;
  event_date: string;
  event_location: string;
  ticket_type: string;
}

interface CheckoutSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderData: any;
}

const CheckoutSuccessDialog = ({ open, onOpenChange, orderId, orderData }: CheckoutSuccessDialogProps) => {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadTickets();
    }
  }, [open, orderId]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          id,
          ticket_code,
          ticket_holder_name,
          pdf_url,
          events (
            title,
            start_time,
            location
          ),
          event_tickets (
            name
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const ticketInfo: TicketInfo[] = data?.map(ticket => ({
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        ticket_holder_name: ticket.ticket_holder_name,
        pdf_url: ticket.pdf_url,
        event_title: ticket.events?.title || 'Event',
        event_date: ticket.events?.start_time ? new Date(ticket.events.start_time).toLocaleDateString() : 'TBA',
        event_location: ticket.events?.location || 'TBA',
        ticket_type: ticket.event_tickets?.name || 'General'
      })) || [];

      setTickets(ticketInfo);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load ticket information');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = (ticket: TicketInfo) => {
    if (ticket.pdf_url) {
      window.open(ticket.pdf_url, '_blank');
      toast.success('Ticket opened in new tab');
    } else {
      toast.error('Ticket download not available');
    }
  };

  const downloadAllTickets = () => {
    tickets.forEach(ticket => {
      if (ticket.pdf_url) {
        window.open(ticket.pdf_url, '_blank');
      }
    });
    toast.success('All tickets opened in new tabs');
  };

  const goToMyOrders = () => {
    onOpenChange(false);
    window.location.href = '/account/orders';
  };

  const hasEventTickets = tickets.length > 0;
  const hasCoursePurchases = orderData?.order_items?.some((item: any) => item.item_type === 'course');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            Purchase Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Order Summary</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  Order #{orderData?.id?.slice(-8)?.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-bold">{orderData?.order_items?.length || 0}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Event Tickets</p>
                  <p className="text-xl font-bold">{tickets.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold">${orderData?.total_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Tickets Section */}
          {hasEventTickets && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Event Tickets
                  </h3>
                  <Button onClick={downloadAllTickets} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading tickets...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold">{ticket.ticket_holder_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {ticket.ticket_type}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{ticket.event_title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{ticket.event_date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{ticket.event_location}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                              Ticket Code: {ticket.ticket_code}
                            </p>
                          </div>
                          <Button 
                            onClick={() => downloadTicket(ticket)}
                            size="sm"
                            className="ml-4"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Course Purchases Section */}
          {hasCoursePurchases && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Course Access
                </h3>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">✓ Course access has been granted!</p>
                  <p className="text-sm text-green-700 mt-1">
                    You can now access your purchased courses from your account dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={goToMyOrders} className="flex-1" size="lg">
              <ShoppingBag className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
            {hasEventTickets && (
              <Button onClick={downloadAllTickets} variant="outline" className="flex-1" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download All Tickets
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>A confirmation email has been sent to your email address.</p>
            <p>Keep your tickets safe and present them at the event entrance.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutSuccessDialog;
