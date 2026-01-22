import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getLessonTranscript, deleteLessonTranscript, transcribeLessonVideo } from "@/services/transcriptionService";
import { supabase } from '@/integrations/supabase/client';

interface LessonTranscriptViewerProps {
  lessonId: string;
  videoUrl?: string;
  onTranscriptUpdated?: () => void;
}

const LessonTranscriptViewer: React.FC<LessonTranscriptViewerProps> = ({
  lessonId,
  videoUrl,
  onTranscriptUpdated
}) => {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadTranscript();
      loadTranscriptionStatus();
    }
  }, [lessonId]);

  const loadTranscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('transcription_status')
        .eq('id', lessonId)
        .single();

      if (error) throw error;

      if (data) {
        setTranscriptionStatus(data.transcription_status);
      }
    } catch (error) {
      console.error('Error loading transcription status:', error);
    }
  };

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

      // Update local state
      setTranscriptionStatus('processing');

      toast.info('Starting video transcription...', {
        id: 'transcript-start',
        duration: 3000,
      });

      // Delete existing transcript
      await deleteLessonTranscript(lessonId);

      // Regenerate new transcript
      const result = await transcribeLessonVideo(lessonId, videoUrl);

      if (result.success) {
        toast.success('Transcript regenerated successfully');

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
        } else {
          // Update local state
          setTranscriptionStatus('completed');
        }

        await loadTranscript();
        if (onTranscriptUpdated) {
          onTranscriptUpdated();
        }
      } else {
        toast.error(`Transcription failed: ${result.error}`);

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
        } else {
          // Update local state
          setTranscriptionStatus('failed');
        }

        return; // Exit early to prevent the catch block from handling this
      }
    } catch (error: any) {
      console.error('Error regenerating transcript:', error);
      toast.error(`Failed to regenerate transcript: ${error.message}`);

      // Update transcription status to 'failed'
      const { error: updateCatchError } = await supabase
        .from('lessons')
        .update({
          transcription_status: 'failed',
          transcription_updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (updateCatchError) {
        console.error('Error updating transcription status:', updateCatchError);
      } else {
        // Update local state
        setTranscriptionStatus('failed');
      }
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
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading transcript...</span>
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0) {
    // Show different messages based on transcription status
    if (transcriptionStatus === 'processing') {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Transcription in Progress</h3>
            <p className="text-gray-500 mb-4">Your video is being processed. Please wait...</p>
            <div className="flex items-center justify-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
              </div>
              <span className="ml-2 text-sm text-gray-500">Processing...</span>
            </div>
          </CardContent>
        </Card>
      );
    } else if (transcriptionStatus === 'pending') {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Transcription Pending</h3>
            <p className="text-gray-500 mb-4">Transcription has not started yet.</p>
            {videoUrl && (
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
          </CardContent>
        </Card>
      );
    } else if (transcriptionStatus === 'failed') {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Transcription Failed</h3>
            <p className="text-gray-500 mb-4">There was an error processing your video. Please try again.</p>
            {videoUrl && (
              <Button onClick={handleRegenerate} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Transcript
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No transcript available</h3>
            <p className="text-gray-500 mb-4">This lesson doesn't have a transcript yet.</p>
            {videoUrl && (
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
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
            Lesson Transcript
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={processing || !videoUrl}
            >
              {processing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportTranscript}
            >
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(segment.text, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{segment.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
          <span>{segments.length} transcript segments</span>
          <span>Total duration: {formatTime(segments[segments.length - 1]?.end_time || 0)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonTranscriptViewer;
