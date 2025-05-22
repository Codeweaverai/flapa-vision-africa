
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventRegistration {
  id: string;
  event_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  events: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    image_url: string;
  };
}

const UserEvents: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  const fetchUserRegistrations = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          event_id,
          created_at,
          status,
          payment_status,
          events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load your event registrations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserAccountLayout activeTab="events">
      <div>
        <h1 className="text-2xl font-bold mb-6">My Events</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : registrations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {registrations.map((registration) => (
              <Card key={registration.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
                  {registration.events.image_url && (
                    <div className="relative h-40 md:h-full">
                      <img 
                        src={registration.events.image_url} 
                        alt={registration.events.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 md:py-6 md:pr-6 md:pl-0">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant={registration.status === 'confirmed' ? 'default' : 'outline'}>
                          {registration.status}
                        </Badge>
                        <Badge variant={registration.payment_status === 'paid' ? 'success' : 'secondary'}>
                          {registration.payment_status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{registration.events.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {registration.events.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {format(new Date(registration.events.start_date), 'MMM d, yyyy')}
                          {registration.events.end_date && (
                            <> - {format(new Date(registration.events.end_date), 'MMM d, yyyy')}</>
                          )}
                        </span>
                      </div>
                      {registration.events.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{registration.events.location}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-0 pt-4">
                      <Button asChild variant="outline">
                        <Link to={`/events/${registration.events.id}`}>
                          View Event <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-md bg-muted/30">
            <h3 className="text-lg font-medium mb-2">No event registrations yet</h3>
            <p className="text-muted-foreground mb-6">You haven't registered for any events yet.</p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </div>
        )}
      </div>
    </UserAccountLayout>
  );
};

export default UserEvents;
