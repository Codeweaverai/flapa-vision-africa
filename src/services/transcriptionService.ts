import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionSegment {
  id: string;
  lesson_id: string;
  start_time: number;
  end_time: number;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionResult {
  success: boolean;
  message?: string;
  error?: string;
  segmentCount?: number;
}

export const transcribeLessonVideo = async (lessonId: string, videoUrl: string): Promise<TranscriptionResult> => {
  try {
    console.log('Starting transcription for lesson:', lessonId);

    // Update lesson status to processing
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ 
        transcription_status: 'processing',
        transcription_updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (updateError) {
      throw new Error(`Failed to update lesson status: ${updateError.message}`);
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('transcribe-video', {
      body: { lessonId, videoUrl }
    });

    if (error) {
      throw new Error(`Transcription failed: ${error.message}`);
    }

    if (!data.success) {
      // Update lesson status to failed
      await supabase
        .from('lessons')
        .update({ 
          transcription_status: 'failed',
          transcription_updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);
      
      throw new Error(data.error || 'Transcription failed');
    }

    return {
      success: true,
      message: data.message,
      segmentCount: data.segmentCount
    };
  } catch (error: any) {
    console.error('Transcription service error:', error);
    
    // Update lesson status to failed
    await supabase
      .from('lessons')
      .update({ 
        transcription_status: 'failed',
        transcription_updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);
    
    return {
      success: false,
      error: error.message || 'Failed to transcribe video'
    };
  }
};

export const getLessonTranscript = async (lessonId: string): Promise<TranscriptionSegment[]> => {
  try {
    const { data, error } = await supabase
      .from('lesson_transcripts')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return [];
  }
};

export const deleteLessonTranscript = async (lessonId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lesson_transcripts')
      .delete()
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting transcript:', error);
    throw error;
  }
};
