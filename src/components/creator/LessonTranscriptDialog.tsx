import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface TranscriptSegment {
  id?: string;
  start_time: number;
  end_time: number;
  text: string;
  lesson_id: string;
}

interface LessonTranscriptDialogProps {
  lessonId: string;
  lessonTitle: string;
}

const LessonTranscriptDialog = ({ lessonId, lessonTitle }: LessonTranscriptDialogProps) => {
  const [open, setOpen] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSegment, setNewSegment] = useState({
    start_time: '',
    end_time: '',
    text: ''
  });

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
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading transcript:', error);
        if (error.code !== 'PGRST116') {
          toast.error('Failed to load transcript');
        }
      } else {
        console.log('Transcripts loaded:', data);
        setTranscriptSegments(data || []);
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
      // Delete existing segments for this lesson
      const { error: deleteError } = await supabase
        .from('lesson_transcripts')
        .delete()
        .eq('lesson_id', lessonId);

      if (deleteError) {
        console.error('Error deleting existing transcripts:', deleteError);
        throw deleteError;
      }

      // Insert new segments
      if (transcriptSegments.length > 0) {
        const segmentsToInsert = transcriptSegments.map(segment => ({
          lesson_id: lessonId,
          start_time: segment.start_time,
          end_time: segment.end_time,
          text: segment.text
        }));

        const { error: insertError } = await supabase
          .from('lesson_transcripts')
          .insert(segmentsToInsert);

        if (insertError) {
          console.error('Error inserting transcripts:', insertError);
          throw insertError;
        }
      }

      toast.success('Transcript saved successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error saving transcript:', error);
      toast.error('Failed to save transcript');
    } finally {
      setSaving(false);
    }
  };

  const addSegment = () => {
    if (!newSegment.text.trim()) {
      toast.error('Please enter transcript text');
      return;
    }

    const startTime = parseFloat(newSegment.start_time) || 0;
    const endTime = parseFloat(newSegment.end_time) || startTime + 10;

    const segment: TranscriptSegment = {
      lesson_id: lessonId,
      start_time: startTime,
      end_time: endTime,
      text: newSegment.text.trim()
    };

    setTranscriptSegments([...transcriptSegments, segment]);
    setNewSegment({ start_time: '', end_time: '', text: '' });
  };

  const removeSegment = (index: number) => {
    setTranscriptSegments(transcriptSegments.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Manage Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Video Transcript - {lessonTitle}</DialogTitle>
          <DialogDescription>
            Add time-stamped transcript segments for better accessibility and SEO
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Segment */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Add New Segment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="start_time">Start Time (seconds)</Label>
                <Input
                  id="start_time"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={newSegment.start_time}
                  onChange={(e) => setNewSegment({ ...newSegment, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time (seconds)</Label>
                <Input
                  id="end_time"
                  type="number"
                  step="0.1"
                  placeholder="10"
                  value={newSegment.end_time}
                  onChange={(e) => setNewSegment({ ...newSegment, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addSegment} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Segment
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="transcript_text">Transcript Text</Label>
              <Textarea
                id="transcript_text"
                placeholder="Enter the spoken text for this time segment..."
                value={newSegment.text}
                onChange={(e) => setNewSegment({ ...newSegment, text: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Existing Segments */}
          <div>
            <h3 className="font-medium mb-3">Transcript Segments ({transcriptSegments.length})</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transcript...</p>
              </div>
            ) : transcriptSegments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcript segments added yet</p>
                <p className="text-sm">Add your first segment above to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcriptSegments
                  .sort((a, b) => a.start_time - b.start_time)
                  .map((segment, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSegment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">{segment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveTranscript} 
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? 'Saving...' : 'Save Transcript'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonTranscriptDialog;
