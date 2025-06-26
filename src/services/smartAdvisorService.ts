
import { supabase } from '@/lib/supabaseClient';

export interface SmartAdvisorMessage {
  id: string;
  user_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  context_data: Record<string, any>;
  action_ids: {
    courseId?: string;
    eventId?: string;
    bundleId?: string;
  } | null;
  created_at: string;
}

export const saveAdvisorMessage = async (
  messageType: 'user' | 'assistant',
  content: string,
  contextData: Record<string, any> = {},
  actionIds: any = null
): Promise<SmartAdvisorMessage | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert({
        user_id: user.id,
        message_type: messageType,
        content,
        context_data: contextData,
        action_ids: actionIds
      })
      .select()
      .single();

    if (error) throw error;
    return data as SmartAdvisorMessage;
  } catch (error) {
    console.error('Error saving advisor message:', error);
    return null;
  }
};

export const loadAdvisorHistory = async (limit: number = 50): Promise<SmartAdvisorMessage[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .is('lesson_id', null)
      .is('course_id', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as SmartAdvisorMessage[];
  } catch (error) {
    console.error('Error loading advisor history:', error);
    return [];
  }
};

export const clearAdvisorHistory = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    const { error } = await supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', user.id)
      .is('lesson_id', null)
      .is('course_id', null);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing advisor history:', error);
    return false;
  }
};
