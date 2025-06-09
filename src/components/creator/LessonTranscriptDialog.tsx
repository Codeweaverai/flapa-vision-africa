
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Save, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface LessonTranscriptDialogProps {
  lessonId: string;
  lessonTitle: string;
}

const LessonTranscriptDialog = ({ lessonId, lessonTitle }: LessonTranscriptDialogProps) => {
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [rawText, setRawText] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Type guard function to validate transcript segment
  const isValidTranscriptSegment = (obj: any): obj is TranscriptSegment => {
    return obj && 
           typeof obj.start === 'number' && 
           typeof obj.end === 'number' && 
           typeof obj.text === 'string';
  };

  // Function to safely convert JSON to TranscriptSegment array
  const convertToTranscriptSegments = (data: any): TranscriptSegment[] => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(isValidTranscriptSegment);
  };

  useEffect(() => {
    if (open) {
      loadTranscript();
    }
  }, [open, lessonId]);

  const loadTranscript = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        if (data.transcript_data) {
          const transcriptData = convertToTranscriptSegments(data.transcript_data);
          setTranscript(transcriptData);
          setLanguage(data.language || 'en');
          setRawText(
            transcriptData.map((segment: TranscriptSegment) => segment.text).join('\n') || ''
          );
        }
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      toast.error('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const saveTranscript = async () => {
    setSaving(true);
    try {
      // Convert raw text to transcript segments (simple implementation)
      const segments: TranscriptSegment[] = rawText
        .split('\n')
        .filter(line => line.trim())
        .map((text, index) => ({
          start: index * 10, // Placeholder timing
          end: (index + 1) * 10,
          text: text.trim()
        }));

      const { error } = await supabase
        .from('lesson_transcripts')
        .upsert({
          lesson_id: lessonId,
          transcript_data: segments as unknown as any, // Cast through unknown to satisfy TypeScript
          language,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setTranscript(segments);
      toast.success('Transcript saved successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {transcript.length > 0 ? 'Edit Transcript' : 'Add Transcript'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lesson Transcript - {lessonTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transcript">Transcript Text</Label>
            <Textarea
              id="transcript"
              placeholder="Enter the lesson transcript here. Each line will be treated as a separate segment."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTranscript} disabled={saving}>
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
