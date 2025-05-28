
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

interface Registration {
  id: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  phone_number: string;
  mobile_operator: string;
  created_at: string;
  user_profile?: {
    full_name?: string;
    username?: string;
  };
}

interface EventRegistrationsListProps {
  eventId: string;
}

const EventRegistrationsList: React.FC<EventRegistrationsListProps> = ({ eventId }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [eventId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      // First get registrations
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      // Then get user profiles separately
      if (registrationsData && registrationsData.length > 0) {
        const userIds = registrationsData.map(registration => registration.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const registrationsWithProfiles = registrationsData.map(registration => ({
          ...registration,
          user_profile: profilesData?.find(profile => profile.id === registration.user_id)
        }));

        setRegistrations(registrationsWithProfiles);
      } else {
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load event registrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'completed') {
      return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
    }
    if (paymentStatus === 'pending') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        {registration.user_profile?.full_name || registration.user_profile?.username || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(registration.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.status, registration.payment_status)}
                      </TableCell>
                      <TableCell>
                        {registration.payment_amount > 0 ? 
                          `${registration.payment_currency} ${registration.payment_amount}` : 
                          'Free'
                        }
                      </TableCell>
                      <TableCell>
                        {registration.phone_number || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventRegistrationsList;
