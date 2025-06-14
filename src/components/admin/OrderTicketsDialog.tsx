
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Ticket, 
  User, 
  Calendar, 
  Download, 
  QrCode,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface OrderTicketsDialogProps {
  order: {
    id: string;
    order_items: Array<{
      id: string;
      item_type: string;
      item_name: string;
      quantity: number;
    }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GeneratedTicket {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  ticket_holder_email?: string;
  ticket_status: string;
  generated_at: string;
  qr_code_data: string;
  pdf_url?: string;
  event_bookings?: {
    event_id: string;
    events?: {
      title: string;
      start_time: string;
      location: string;
    };
  };
}

const OrderTicketsDialog: React.FC<OrderTicketsDialogProps> = ({
  order,
  open,
  onOpenChange
}) => {
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['order-tickets', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_tickets')
        .select(`
          *,
          event_bookings!booking_id (
            event_id,
            events (
              title,
              start_time,
              location
            )
          )
        `)
        .eq('order_id', order.id);

      if (error) throw error;
      return data as GeneratedTicket[];
    },
    enabled: open
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'used': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'used': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const handleDownloadTicket = async (ticketId: string) => {
    try {
      // Call edge function to generate/download ticket PDF
      const { data, error } = await supabase.functions.invoke('generate-tickets', {
        body: { ticketId }
      });

      if (error) throw error;

      if (data?.pdf_url) {
        window.open(data.pdf_url, '_blank');
      } else {
        toast.error('PDF not available for download');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('generated_tickets')
        .update({ ticket_status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket status updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const eventItems = order.order_items.filter(item => item.item_type === 'event_ticket');

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Loading tickets...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Event Tickets for Order {order.id.slice(0, 8)}...
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Items ({eventItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eventItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <Badge variant="outline">Event Ticket</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generated Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Generated Tickets ({tickets.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets generated for this order yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket Code</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Holder</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {ticket.ticket_code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {ticket.event_bookings?.events?.title || 'Unknown Event'}
                              </p>
                              {ticket.event_bookings?.events?.start_time && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(ticket.event_bookings.events.start_time), 'PPP p')}
                                </p>
                              )}
                              {ticket.event_bookings?.events?.location && (
                                <p className="text-xs text-muted-foreground">
                                  {ticket.event_bookings.events.location}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.ticket_holder_name}</p>
                              {ticket.ticket_holder_email && (
                                <p className="text-sm text-muted-foreground">
                                  {ticket.ticket_holder_email}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(ticket.ticket_status)}>
                              {getStatusIcon(ticket.ticket_status)}
                              <span className="ml-1">{ticket.ticket_status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(ticket.generated_at), 'PPP p')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {ticket.pdf_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadTicket(ticket.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {ticket.ticket_status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'cancelled')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {ticket.ticket_status === 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'active')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Codes Section */}
          {tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      tickets.forEach(ticket => {
                        if (ticket.pdf_url) {
                          handleDownloadTicket(ticket.id);
                        }
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTicketsDialog;
