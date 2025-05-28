
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import CreatorLayout from '@/components/creator/CreatorLayout';
import CreatorEventForm from './CreatorEventForm';

const CreatorEventEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .eq('creator_id', user.id)
          .single();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: "Event not found",
            description: "The event you're looking for doesn't exist or you don't have permission to edit it.",
            variant: "destructive"
          });
          navigate('/creator/events');
          return;
        }

        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive"
        });
        navigate('/creator/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [user, id, navigate, toast]);

  const handleUpdate = async (eventData: any) => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Event Updated",
        description: "Your event has been successfully updated.",
      });

      navigate('/creator/events');
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the event. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <CreatorLayout title="Edit Event">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </CreatorLayout>
    );
  }

  if (!event) {
    return (
      <CreatorLayout title="Edit Event">
        <div className="text-center py-8">
          <p>Event not found.</p>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Edit Event">
      <div className="max-w-4xl mx-auto">
        <CreatorEventForm
          initialData={event}
          onSubmit={handleUpdate}
          isEditing={true}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventEdit;
