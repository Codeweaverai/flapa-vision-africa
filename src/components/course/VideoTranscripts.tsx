
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Languages } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TranscriptSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

interface VideoTranscriptsProps {
  lessonId: string;
  onSeekTo?: (time: number) => void;
}

const VideoTranscripts = ({ lessonId, onSeekTo }: VideoTranscriptsProps) => {
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    sw: 'Swahili'
  };

  // Type guard function to validate transcript segment
  const isValidTranscriptSegment = (obj: any): obj is TranscriptSegment => {
    return obj && 
           typeof obj.id === 'string' && 
           typeof obj.start_time === 'number' && 
           typeof obj.end_time === 'number' && 
           typeof obj.text === 'string';
  };

  // Function to safely convert JSON to TranscriptSegment array
  const convertToTranscriptSegments = (data: any): TranscriptSegment[] => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(isValidTranscriptSegment);
  };

  useEffect(() => {
    if (lessonId) {
      loadTranscripts();
    }
  }, [lessonId, selectedLanguage]);

  const loadTranscripts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading transcripts for lesson:', lessonId);
      
      // First, get all available languages for this lesson
      const { data: allTranscripts, error: transcriptError } = await supabase
        .from('lesson_transcripts')
        .select('language, transcript_data')
        .eq('lesson_id', lessonId);

      if (transcriptError) {
        console.error('Error fetching transcripts:', transcriptError);
        throw transcriptError;
      }

      console.log('Fetched transcripts:', allTranscripts);

      if (allTranscripts && allTranscripts.length > 0) {
        const languages = allTranscripts.map(t => t.language);
        setAvailableLanguages(languages);

        // If selected language is not available, use the first available
        const targetLanguage = languages.includes(selectedLanguage) ? selectedLanguage : languages[0];
        setSelectedLanguage(targetLanguage);

        const targetTranscript = allTranscripts.find(t => t.language === targetLanguage);
        
        if (targetTranscript?.transcript_data) {
          console.log('Processing transcript data:', targetTranscript.transcript_data);
          const segments = convertToTranscriptSegments(targetTranscript.transcript_data);
          console.log('Converted segments:', segments);
          setTranscripts(segments);
        } else {
          console.log('No transcript data found for language:', targetLanguage);
          setTranscripts([]);
        }
      } else {
        console.log('No transcripts found for lesson:', lessonId);
        setAvailableLanguages([]);
        setTranscripts([]);
      }
    } catch (error) {
      console.error('Error loading transcripts:', error);
      setError('Failed to load transcripts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    console.log('Seeking to time:', segment.start_time);
    if (onSeekTo) {
      onSeekTo(segment.start_time);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-muted-foreground">Loading transcript...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadTranscripts}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transcripts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No transcript available for this lesson.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </CardTitle>
          {availableLanguages.length > 1 && (
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[140px]">
                <Languages className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {languageNames[lang] || lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-2">
            {transcripts.map((segment, index) => (
              <div
                key={segment.id || index}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSegmentClick(segment)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {formatTime(segment.start_time)}
                  </span>
                  <p className="text-sm leading-relaxed flex-1">{segment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 text-xs text-muted-foreground">
          {transcripts.length} transcript segments • Click any segment to jump to that time
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTranscripts;
