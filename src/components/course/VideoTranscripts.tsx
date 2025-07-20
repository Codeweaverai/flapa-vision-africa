
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Book, Play } from 'lucide-react';

interface TranscriptSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
  lesson_id: string;
}

interface VideoTranscriptsProps {
  lessonId: string;
  onSeekTo?: (time: number) => void;
  currentTime?: number;
}

const VideoTranscripts: React.FC<VideoTranscriptsProps> = ({ 
  lessonId, 
  onSeekTo, 
  currentTime = 0 
}) => {
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      fetchTranscripts();
    }
  }, [lessonId]);

  useEffect(() => {
    // Find active segment based on current video time
    const activeSegment = transcripts.find(segment => 
      currentTime >= segment.start_time && currentTime <= segment.end_time
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime, transcripts]);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the database data to match our interface
      const transformedTranscripts: TranscriptSegment[] = [];
      
      if (data && data.length > 0) {
        data.forEach((item: any) => {
          if (item.transcript_data) {
            let segments: TranscriptSegment[] = [];
            
            if (typeof item.transcript_data === 'object') {
              // If transcript_data contains segments array
              if (Array.isArray(item.transcript_data.segments)) {
                segments = item.transcript_data.segments.map((seg: any, index: number) => ({
                  id: `${item.id}-${index}`,
                  start_time: seg.start_time || seg.start || 0,
                  end_time: seg.end_time || seg.end || (seg.start_time || seg.start || 0) + 30,
                  text: seg.text || seg.content || '',
                  lesson_id: lessonId
                }));
              } else if (item.transcript_data.text) {
                // Single text block - create one segment
                segments = [{
                  id: item.id,
                  start_time: 0,
                  end_time: 300, // Default 5 minutes
                  text: item.transcript_data.text,
                  lesson_id: lessonId
                }];
              }
            } else if (typeof item.transcript_data === 'string') {
              // Handle string transcript data
              segments = [{
                id: item.id,
                start_time: 0,
                end_time: 300,
                text: item.transcript_data,
                lesson_id: lessonId
              }];
            }
            
            transformedTranscripts.push(...segments);
          }
        });
      }
      
      setTranscripts(transformedTranscripts);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      // Don't show error toast for missing transcripts as it's optional
    } finally {
      setLoading(false);
    }
  };

  const handleSeekTo = (time: number) => {
    if (onSeekTo) {
      onSeekTo(time);
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

  if (!transcripts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-orange-500" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No transcript available for this lesson</p>
          </div>
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
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {transcripts.map((segment) => (
            <div
              key={segment.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                activeSegmentId === segment.id
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => handleSeekTo(segment.start_time)}
            >
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs font-mono"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeekTo(segment.start_time);
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {formatTime(segment.start_time)}
                </Button>
                <p className="text-sm leading-relaxed flex-1">
                  {segment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTranscripts;
