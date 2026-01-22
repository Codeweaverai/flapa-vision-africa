import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, MessageSquare, Copy, Check, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface LessonTranscriptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  videoUrl?: string;
  transcriptSegments: any[];
  loadingTranscript: boolean;
  hasTranscript: boolean;
  onTranscriptUpdated: () => void;
}

const LessonTranscriptViewer = ({
  open,
  onOpenChange,
  lessonId,
  videoUrl,
  transcriptSegments,
  loadingTranscript,
  hasTranscript,
  onTranscriptUpdated
}: LessonTranscriptViewerProps) => {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lessonId && open) {
      loadTranscript();
    }
  }, [lessonId, open]);

  const loadTranscript = async () => {
    try {
      setLoading(true);
      const transcriptData = await getLessonTranscript(lessonId);
      setSegments(transcriptData);
    } catch (error) {
      console.error('Error loading transcript:', error);
      toast.error('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!videoUrl) {
      toast.error('Video URL is required to regenerate transcript');
      return;
    }

    if (!lessonId) {
      toast.error('Lesson ID is required');
      return;
    }

    setProcessing(true);
    try {
      // Update the lesson transcription status to 'processing'
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          transcription_status: 'processing',
          transcription_updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Error updating transcription status:', updateError);
      }

      toast.info('Starting video transcription...', {
        id: 'transcript-start',
        duration: 3000,
      });

      // Delete existing transcript
      await deleteLessonTranscript(lessonId);

      // Regenerate new transcript
      const result = await transcribeLessonVideo(lessonId, videoUrl);

      if (result.success) {
        toast.success(`Transcription completed! Generated ${result.segmentCount} segments.`, {
          duration: 5000,
        });
        
        // Update the lesson transcription status to 'completed'
        const { error: updateSuccessError } = await supabase
          .from('lessons')
          .update({
            transcription_status: 'completed',
            transcription_updated_at: new Date().toISOString()
          })
          .eq('id', lessonId);

        if (updateSuccessError) {
          console.error('Error updating transcription status:', updateSuccessError);
        }

        await loadTranscript();
        if (onTranscriptUpdated) {
          onTranscriptUpdated();
        }
      } else {
        toast.error(`Transcription failed: ${result.error}`, {
          duration: 5000,
        });

        // Update the lesson transcription status to 'failed'
        const { error: updateFailError } = await supabase
          .from('lessons')
          .update({
            transcription_status: 'failed',
            transcription_updated_at: new Date().toISOString()
          })
          .eq('id', lessonId);

        if (updateFailError) {
          console.error('Error updating transcription status:', updateFailError);
        }
      }
    } catch (error: any) {
      console.error('Error regenerating transcript:', error);
      toast.error(`Failed to regenerate transcript: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedIndex(index);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy');
      });
  };

  const exportTranscript = () => {
    const transcriptText = segments.map(segment =>
      `[${formatTime(segment.start_time)} - ${formatTime(segment.end_time)}]\n${segment.text}\n`
    ).join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-lesson-${lessonId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transcript exported successfully');
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
              Lesson Transcript
              {lessonId && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  - Loading...
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Loading transcript for this lesson video
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
            <span className="text-gray-600">Loading transcript...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (segments.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
              Lesson Transcript
            </DialogTitle>
            <DialogDescription>
              No transcript available for this lesson yet.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No transcript found</h3>
            <p className="text-gray-500 mb-6">
              This lesson doesn't have a transcript yet. Generate one from the video.
            </p>
            {videoUrl && lessonId && (
              <Button onClick={handleRegenerate} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Transcript
                  </>
                )}
              </Button>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2 sm:mb-0">
              Ready to make your video content accessible and searchable
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
            Lesson Transcript
            {lessonId && (
              <span className="ml-2 text-lg font-normal text-gray-600">
                - {segments.length} segments
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            View and manage the transcript for this lesson video
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <Card key={segment.id} className="border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(segment.text, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{segment.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">
            {segments.length} transcript segments • Total duration: {formatTime(segments[segments.length - 1]?.end_time || 0)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportTranscript}>
              Export as TXT
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonTranscriptViewer;