
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface LessonTranscriptManagerProps {
  lessonId: string;
  lessonTitle: string;
}

const LessonTranscriptManager: React.FC<LessonTranscriptManagerProps> = ({
  lessonId,
  lessonTitle
}) => {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [manualTranscript, setManualTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);

  useEffect(() => {
    loadTranscript();
  }, [lessonId]);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTranscript(data.transcript_data as TranscriptSegment[]);
        setHasTranscript(true);
        // Convert transcript to manual text format
        const textVersion = (data.transcript_data as TranscriptSegment[])
          .map(segment => `[${formatTime(segment.start)}] ${segment.text}`)
          .join('\n\n');
        setManualTranscript(textVersion);
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseManualTranscript = (text: string): TranscriptSegment[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const segments: TranscriptSegment[] = [];
    
    lines.forEach((line, index) => {
      const timeMatch = line.match(/\[(\d+):(\d+)\]/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseInt(timeMatch[2]);
        const startTime = minutes * 60 + seconds;
        const text = line.replace(/\[\d+:\d+\]\s*/, '');
        
        segments.push({
          start: startTime,
          end: startTime + 10, // Default 10 second segments
          text: text,
          speaker: 'Instructor'
        });
      } else if (line.trim()) {
        // If no timestamp, add to previous segment or create new one
        if (segments.length > 0) {
          segments[segments.length - 1].text += ' ' + line.trim();
        } else {
          segments.push({
            start: index * 10,
            end: (index + 1) * 10,
            text: line.trim(),
            speaker: 'Instructor'
          });
        }
      }
    });

    return segments;
  };

  const saveTranscript = async () => {
    try {
      setSaving(true);
      
      let transcriptData: TranscriptSegment[] = [];
      
      if (manualTranscript.trim()) {
        transcriptData = parseManualTranscript(manualTranscript);
      }

      const { error } = await supabase
        .from('lesson_transcripts')
        .upsert({
          lesson_id: lessonId,
          transcript_data: transcriptData,
          language: 'en'
        });

      if (error) throw error;

      setTranscript(transcriptData);
      setHasTranscript(transcriptData.length > 0);
      toast.success('Transcript saved successfully');
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  const deleteTranscript = async () => {
    try {
      const { error } = await supabase
        .from('lesson_transcripts')
        .delete()
        .eq('lesson_id', lessonId);

      if (error) throw error;

      setTranscript([]);
      setManualTranscript('');
      setHasTranscript(false);
      toast.success('Transcript deleted successfully');
    } catch (error) {
      console.error('Error deleting transcript:', error);
      toast.error('Failed to delete transcript');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcript for {lessonTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasTranscript && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Has Transcript
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="transcript">
            Manual Transcript Entry
          </Label>
          <p className="text-sm text-gray-500 mb-2">
            Enter transcript with timestamps in format: [MM:SS] Text content
          </p>
          <Textarea
            id="transcript"
            value={manualTranscript}
            onChange={(e) => setManualTranscript(e.target.value)}
            placeholder="[0:00] Welcome to this lesson...
[0:15] Today we'll be covering...
[0:30] Let's start with..."
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveTranscript}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Transcript'}
          </Button>
          
          {hasTranscript && (
            <Button
              onClick={deleteTranscript}
              variant="destructive"
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {transcript.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Current Transcript Preview:</h4>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {transcript.slice(0, 3).map((segment, index) => (
                <div key={index} className="mb-2 text-sm">
                  <span className="font-mono text-blue-600">
                    [{formatTime(segment.start)}]
                  </span>
                  <span className="ml-2">{segment.text}</span>
                </div>
              ))}
              {transcript.length > 3 && (
                <p className="text-gray-500 text-sm">
                  ... and {transcript.length - 3} more segments
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonTranscriptManager;
