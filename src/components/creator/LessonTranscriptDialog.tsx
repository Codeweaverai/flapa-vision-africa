
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface LessonTranscriptDialogProps {
  lessonId: string;
  lessonTitle: string;
  onTranscriptSaved?: () => void;
}

const LessonTranscriptDialog: React.FC<LessonTranscriptDialogProps> = ({
  lessonId,
  lessonTitle,
  onTranscriptSaved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTranscript();
    }
  }, [isOpen, lessonId]);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('transcript_data')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.transcript_data) {
        // Convert transcript data to text format
        const transcriptData = Array.isArray(data.transcript_data) 
          ? data.transcript_data as any[]
          : [];
        
        const textVersion = transcriptData
          .map((segment: any) => {
            const start = Number(segment.start) || 0;
            const mins = Math.floor(start / 60);
            const secs = Math.floor(start % 60);
            const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
            return `[${timeStr}] ${segment.text || ''}`;
          })
          .join('\n\n');
        
        setTranscript(textVersion);
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTranscript = (text: string): TranscriptSegment[] => {
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
      
      const transcriptData = parseTranscript(transcript);
      
      // Convert to plain object format for Json compatibility
      const transcriptForDb = transcriptData.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        speaker: segment.speaker
      }));

      const { error } = await supabase
        .from('lesson_transcripts')
        .upsert({
          lesson_id: lessonId,
          transcript_data: transcriptForDb,
          language: 'en'
        });

      if (error) throw error;

      toast.success('Transcript saved successfully');
      setIsOpen(false);
      onTranscriptSaved?.();
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Video Transcript - {lessonTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="transcript">
              Transcript Text
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Enter transcript with timestamps in format: [MM:SS] Text content
            </p>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="[0:00] Welcome to this lesson...
[0:15] Today we'll be covering...
[0:30] Let's start with..."
              rows={15}
              className="font-mono text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTranscript}
              disabled={saving || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Transcript'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonTranscriptDialog;
