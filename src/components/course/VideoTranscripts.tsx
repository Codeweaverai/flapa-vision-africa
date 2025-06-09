
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Languages } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface TranscriptSegment {
  start: number;
  end: number;
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

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    sw: 'Swahili'
  };

  useEffect(() => {
    loadTranscripts();
  }, [lessonId, selectedLanguage]);

  const loadTranscripts = async () => {
    setLoading(true);
    try {
      // First, get all available languages for this lesson
      const { data: allTranscripts } = await supabase
        .from('lesson_transcripts')
        .select('language, transcript_data')
        .eq('lesson_id', lessonId);

      if (allTranscripts && allTranscripts.length > 0) {
        const languages = allTranscripts.map(t => t.language);
        setAvailableLanguages(languages);

        // If selected language is not available, use the first available
        const targetLanguage = languages.includes(selectedLanguage) ? selectedLanguage : languages[0];
        setSelectedLanguage(targetLanguage);

        const targetTranscript = allTranscripts.find(t => t.language === targetLanguage);
        setTranscripts(targetTranscript?.transcript_data || []);
      } else {
        setAvailableLanguages([]);
        setTranscripts([]);
      }
    } catch (error) {
      console.error('Error loading transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    if (onSeekTo) {
      onSeekTo(segment.start);
    }
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
          <p className="text-muted-foreground">Loading transcript...</p>
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
          <p className="text-muted-foreground">No transcript available for this lesson.</p>
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
                key={index}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSegmentClick(segment)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                    {Math.floor(segment.start / 60)}:{(segment.start % 60).toString().padStart(2, '0')}
                  </span>
                  <p className="text-sm leading-relaxed flex-1">{segment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VideoTranscripts;
