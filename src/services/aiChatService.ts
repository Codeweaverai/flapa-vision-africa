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
    // Get the current user
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
        lesson_id: lessonId || null,
        course_id: courseId || null,
        context_data: contextData
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIChatMessage;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
};

export const loadChatHistory = async (
  lessonId?: string,
  courseId?: string,
  limit: number = 50,
  ascending: boolean = true
): Promise<AIChatMessage[]> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return [];
    }

    let query = supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: ascending })
      .limit(limit);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
    } else {
      // Load messages without specific context
      query = query.or(`lesson_id.is.null,course_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AIChatMessage[];
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
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    let query = supabase
      .from('ai_chat_history')
      .delete()
      .eq('user_id', user.id);

    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    } else if (courseId) {
      query = query.eq('course_id', courseId);
    } else {
      // Only clear messages without context if no IDs provided
      query = query.or(`lesson_id.is.null,course_id.is.null`);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
};

// New function to call LumoAI assistant
export const callLumoAI = async (
  message: string,
  lessonTitle?: string,
  lessonContent?: string,
  courseId?: string,
  lessonId?: string
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        message,
        lessonTitle: lessonTitle || '',
        lessonContent: lessonContent || '',
        courseId: courseId || null,
        lessonId: lessonId || null,
        userId: user.id
      }
    });

    if (error) {
      console.error('LumoAI function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to call LumoAI'
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'LumoAI returned an error'
      };
    }

    return {
      success: true,
      response: data.response
    };
  } catch (error: any) {
    console.error('Error calling LumoAI:', error);
    return {
      success: false,
      error: error.message || 'Network error calling LumoAI'
    };
  }
};

// Get conversation summary for context
export const getConversationSummary = async (
  lessonId?: string,
  courseId?: string
): Promise<string> => {
  try {
    const messages = await loadChatHistory(lessonId, courseId, 10, false); // Get last 10 messages
    
    if (messages.length === 0) {
      return '';
    }

    const recentMessages = messages.slice(0, 5).reverse(); // Get most recent 5 messages
    
    return recentMessages
      .map(msg => `${msg.message_type}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
      .join('\n');
  } catch (error) {
    console.error('Error getting conversation summary:', error);
    return '';
  }
};
