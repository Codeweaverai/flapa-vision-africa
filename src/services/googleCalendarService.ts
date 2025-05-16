
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GoogleMeetEventData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
}

export const createGoogleMeetEvent = async (eventData: GoogleMeetEventData) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-google-meet', {
      body: {
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime.toISOString(),
        endTime: eventData.endTime.toISOString(),
        attendeeEmails: eventData.attendeeEmails
      }
    });

    if (error) {
      console.error('Error creating Google Meet event:', error);
      toast.error("Failed to create meeting link");
      return null;
    }

    return data.meetLink;
  } catch (error) {
    console.error('Unexpected error creating Google Meet event:', error);
    toast.error("An unexpected error occurred");
    return null;
  }
};
