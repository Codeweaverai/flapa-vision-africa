
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Registration {
  id: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_currency?: string;
  phone_number?: string;
  mobile_operator?: string;
  created_at: string;
  profiles: {
    full_name?: string;
    username?: string;
  };
}

interface EventRegistrationsListProps {
  eventId: string;
}

const EventRegistrationsList = ({ eventId }: EventRegistrationsListProps) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!eventId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_bookings')
          .select(`
            id,
            status,
            payment_status,
            payment_amount,
            payment_currency,
            phone_number,
            mobile_operator,
            created_at,
            profiles:user_id(full_name, username)
          `)
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRegistrations(data || []);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No registrations yet for this event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total Registrations: {registrations.length}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Registered At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                {registration.profiles?.full_name || registration.profiles?.username || 'Unknown User'}
              </TableCell>
              <TableCell>
                <Badge variant={registration.status === 'confirmed' ? 'default' : 'secondary'}>
                  {registration.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={
                  registration.payment_status === 'paid' ? 'default' : 
                  registration.payment_status === 'free' ? 'secondary' : 'outline'
                }>
                  {registration.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                {registration.payment_amount ? 
                  `${registration.payment_currency || 'USD'} ${registration.payment_amount}` : 
                  'Free'
                }
              </TableCell>
              <TableCell>{registration.phone_number || '-'}</TableCell>
              <TableCell>
                {format(new Date(registration.created_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EventRegistrationsList;
