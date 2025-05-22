
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, ArrowRight, Video } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import UserAccountLayout from '@/components/account/UserAccountLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Consultation {
  id: string;
  user_id: string;
  scheduled_time: string;
  duration: number;
  status: string;
  online_meeting_link?: string;
  topic: string;
  created_at: string;
}

const UserConsultations: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      fetchUserConsultations();
    }
  }, [user]);

  const fetchUserConsultations = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Using the correct table name and type-safe approach
      const { data, error } = await supabase
        .from('consultation_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      
      // Safely cast the data to our Consultation type
      const typedConsultations: Consultation[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        scheduled_time: item.scheduled_time,
        duration: item.duration,
        status: item.status,
        online_meeting_link: item.online_meeting_link,
        topic: item.topic || 'General Consultation',
        created_at: item.created_at
      }));
      
      setConsultations(typedConsultations);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast.error('Failed to load your consultations');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  return (
    <UserAccountLayout activeTab="consultations">
      <div>
        <h1 className="text-2xl font-bold mb-6">My Consultations</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : consultations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consultations.map((consultation) => {
              const consultationDate = new Date(consultation.scheduled_time);
              const isPast = consultationDate < new Date();
              const isToday = format(consultationDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              // Calculate end time based on duration
              const startTime = new Date(consultation.scheduled_time);
              const endTime = new Date(startTime.getTime() + consultation.duration * 60000);
              const formattedStartTime = format(startTime, 'h:mm a');
              const formattedEndTime = format(endTime, 'h:mm a');
              
              return (
                <Card key={consultation.id} className={isPast ? 'opacity-70' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{consultation.topic}</CardTitle>
                      <Badge variant={
                        consultation.status === 'confirmed' ? 'default' :
                        consultation.status === 'pending' ? 'outline' :
                        consultation.status === 'completed' ? 'success' : 'secondary'
                      }>
                        {consultation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(consultationDate, 'MMMM d, yyyy')}</span>
                      {isToday && <Badge variant="outline" className="ml-2">Today</Badge>}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {formattedStartTime} - {formattedEndTime}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {consultation.online_meeting_link && consultation.status === 'confirmed' && !isPast ? (
                      <Button 
                        className="w-full" 
                        onClick={() => joinMeeting(consultation.online_meeting_link || '')}
                      >
                        Join Meeting <Video className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button disabled={isPast} className="w-full" variant="outline">
                        {isPast ? 'Consultation Complete' : 'Details'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-md bg-muted/30">
            <h3 className="text-lg font-medium mb-2">No consultations booked</h3>
            <p className="text-muted-foreground mb-6">You haven't booked any consultations yet.</p>
            <Button asChild>
              <a href="/consult">Book a Consultation</a>
            </Button>
          </div>
        )}
      </div>
    </UserAccountLayout>
  );
};

export default UserConsultations;
