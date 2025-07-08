
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Book, Play } from 'lucide-react';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface VideoTranscriptsProps {
  lessonId: string;
  onSeekTo?: (time: number) => void;
}

const VideoTranscripts: React.FC<VideoTranscriptsProps> = ({ lessonId, onSeekTo }) => {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      fetchTranscript();
    }
  }, [lessonId]);

  const fetchTranscript = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('transcript_data')
        .eq('lesson_id', lessonId)
        .eq('language', 'en')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.transcript_data) {
        setTranscript(data.transcript_data as TranscriptSegment[]);
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      toast.error('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading transcript...</p>
        </CardContent>
      </Card>
    );
  }

  if (transcript.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No transcript available for this lesson</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5 text-orange-500" />
          Video Transcript
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transcript.map((segment, index) => (
            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSeekTo?.(segment.start)}
                className="flex-shrink-0 text-orange-600 hover:text-orange-700"
              >
                <Play className="h-3 w-3 mr-1" />
                {formatTime(segment.start)}
              </Button>
              <p className="text-sm text-gray-700 leading-relaxed">{segment.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTranscripts;
