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

export interface LumoAIResponse {
  response: string;
  explanation?: string;
  key_points?: string[];
  suggestions?: string[];
  next_steps?: string;
  confidence?: number;
  error?: boolean;
}

export const saveChatMessage = async (
  messageType: 'user' | 'assistant',
  content: string | LumoAIResponse,
  lessonId?: string,
  courseId?: string,
  contextData: Record<string, any> = {}
): Promise<AIChatMessage | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // Stringify if it's a structured response
    const contentToSave = typeof content === 'string' 
      ? content 
      : JSON.stringify(content);

    const { data, error } = await supabase
      .from('ai_chat_history')
      .insert({
        user_id: user.id,
        message_type: messageType,
        content: contentToSave,
        lesson_id: lessonId || null,
        course_id: courseId || null,
        context_data: {
          ...contextData,
          is_structured_response: typeof content !== 'string'
        }
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

export const callLumoAI = async (
  message: string,
  lessonTitle?: string,
  lessonContent?: string,
  courseId?: string,
  lessonId?: string
): Promise<{ success: boolean; response?: LumoAIResponse; error?: string }> => {
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

    // Parse the structured response
    let structuredResponse: LumoAIResponse;
    try {
      if (typeof data.response === 'string') {
        structuredResponse = JSON.parse(data.response);
      } else {
        structuredResponse = data.response;
      }
      
      // Ensure it has the required structure
      if (!structuredResponse.response) {
        structuredResponse = {
          response: structuredResponse as any || 'No response generated',
          explanation: "AI provided response in unexpected format",
          key_points: [],
          suggestions: [],
          next_steps: "Continue exploring the topic",
          confidence: 0.8
        };
      }
    } catch (parseError) {
      console.error('Error parsing LumoAI response:', parseError);
      structuredResponse = {
        response: typeof data.response === 'string' ? data.response : 'Invalid response format',
        explanation: "I've analyzed your question and here's what I found.",
        key_points: ["Response provided in text format"],
        suggestions: ["Ask follow-up questions for more details"],
        next_steps: "Review the response and ask for clarification if needed",
        confidence: 0.9,
        error: true
      };
    }

    return {
      success: true,
      response: structuredResponse
    };
  } catch (error: any) {
    console.error('Error calling LumoAI:', error);
    return {
      success: false,
      error: error.message || 'Network error calling LumoAI'
    };
  }
};

export const getConversationSummary = async (
  lessonId?: string,
  courseId?: string
): Promise<string> => {
  try {
    const messages = await loadChatHistory(lessonId, courseId, 10, false);
    
    if (messages.length === 0) {
      return '';
    }

    const recentMessages = messages.slice(0, 5).reverse();
    
    return recentMessages
      .map(msg => {
        let content = msg.content;
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed && parsed.response) {
            content = parsed.response;
          }
        } catch {
          // Keep as-is if not JSON
        }
        return `${msg.message_type}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
      })
      .join('\n');
  } catch (error) {
    console.error('Error getting conversation summary:', error);
    return '';
  }
};

// Helper to parse message content
export const parseMessageContent = (message: AIChatMessage): string | LumoAIResponse => {
  try {
    const parsed = JSON.parse(message.content);
    if (parsed && typeof parsed === 'object' && 'response' in parsed) {
      return parsed as LumoAIResponse;
    }
    return message.content;
  } catch {
    return message.content;
  }
};
