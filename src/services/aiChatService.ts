
import { supabase } from '@/lib/supabaseClient';

export interface AIChatMessage {
  id: string;
  user_id: string;
  lesson_id?: string;
  course_id?: string;
  message_type: 'user' | 'assistant';
  content: string;
  context_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const saveChatMessage = async (
  messageType: 'user' | 'assistant',
  content: string,
  lessonId?: string,
  courseId?: string,
  contextData: Record<string, any> = {}
): Promise<AIChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert({
        message_type: messageType,
        content,
        lesson_id: lessonId,
        course_id: courseId,
        context_data: contextData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
};

export const loadChatHistory = async (
  lessonId?: string,
  courseId?: string,
  limit: number = 50
): Promise<AIChatMessage[]> => {
  try {
    let query = supabase
      .from('ai_chat_history')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

export const clearChatHistory = async (
  lessonId?: string,
  courseId?: string
): Promise<boolean> => {
  try {
    let query = supabase.from('ai_chat_history').delete();

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
};
