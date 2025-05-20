
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import EventForm from '@/pages/admin/EventForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const CreatorEventForm = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    const checkEventOwnership = async () => {
      if (!eventId || !user) {
        setAuthorized(true); // New event, always authorized
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('creator_id')
          .eq('id', eventId)
          .single();
          
        if (error) {
          console.error('Error checking event ownership:', error);
          toast.error("Failed to verify event ownership. Please try again.");
          throw error;
        }
        
        if (data.creator_id === user.id) {
          setAuthorized(true);
        } else {
          toast.error("You don't have permission to edit this event");
          // Not authorized, redirect to creator events page
          navigate('/creator/events');
          return;
        }
      } catch (error) {
        console.error('Error checking event ownership:', error);
        toast.error("Error checking event permissions");
        navigate('/creator/events');
        return;
      } finally {
        setLoading(false);
      }
    };
    
    checkEventOwnership();
  }, [eventId, user, navigate]);
  
  if (!user) {
    toast.error("You must be logged in to create or edit events");
    navigate('/auth');
    return null;
  }
  
  if (loading) {
    return (
      <CreatorLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CreatorLayout>
    );
  }
  
  if (!authorized) {
    return (
      <CreatorLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Not Authorized</h2>
          <p>You don't have permission to edit this event.</p>
        </div>
      </CreatorLayout>
    );
  }
  
  return (
    <CreatorLayout>
      <EventForm isCreator={true} creatorId={user.id} />
    </CreatorLayout>
  );
};

export default CreatorEventForm;
