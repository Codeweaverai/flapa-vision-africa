
// Add a function to create an event with creator_id
export const createEventWithCreator = async (
  eventData: Partial<Event>, 
  creatorId: string
): Promise<Event | null> => {
  try {
    // Make sure required fields are present
    if (!eventData.title || !eventData.event_type || 
        !eventData.start_time || !eventData.end_time) {
      console.error('Error creating event: Missing required fields');
      toast.error('Please fill in all required fields');
      return null;
    }
    
    // Create the complete event object with required fields
    const eventWithCreator = {
      title: eventData.title,
      event_type: eventData.event_type,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      description: eventData.description || '',
      location: eventData.location,
      online_meeting_link: eventData.online_meeting_link,
      capacity: eventData.capacity,
      is_free: eventData.is_free !== undefined ? eventData.is_free : false,
      price: eventData.price,
      currency: eventData.currency || 'USD',
      image_url: eventData.image_url,
      creator_id: creatorId,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventWithCreator)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data as Event;
  } catch (error) {
    console.error('Error in createEventWithCreator:', error);
    return null;
  }
};
