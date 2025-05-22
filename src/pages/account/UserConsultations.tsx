
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
  consultation_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link?: string;
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

      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('user_id', user.id)
        .order('consultation_date', { ascending: true });

      if (error) throw error;
      
      setConsultations(data || []);
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
              const consultationDate = new Date(consultation.consultation_date);
              const isPast = consultationDate < new Date();
              const isToday = format(consultationDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
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
                        {consultation.start_time} - {consultation.end_time}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {consultation.meeting_link && consultation.status === 'confirmed' && !isPast ? (
                      <Button 
                        className="w-full" 
                        onClick={() => joinMeeting(consultation.meeting_link || '')}
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
