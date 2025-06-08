
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Clock, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface VideoTranscriptsProps {
  lessonId: string;
  currentVideoTime?: number;
  onTimeSeek?: (time: number) => void;
}

const VideoTranscripts: React.FC<VideoTranscriptsProps> = ({
  lessonId,
  currentVideoTime = 0,
  onTimeSeek
}) => {
  const [transcriptData, setTranscriptData] = useState<TranscriptSegment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredTranscripts, setFilteredTranscripts] = useState<TranscriptSegment[]>([]);

  useEffect(() => {
    loadTranscripts();
  }, [lessonId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = transcriptData.filter(segment =>
        segment.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTranscripts(filtered);
    } else {
      setFilteredTranscripts(transcriptData);
    }
  }, [searchTerm, transcriptData]);

  const loadTranscripts = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('transcript_data')
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.transcript_data) {
        // Safely cast the Json type to TranscriptSegment[]
        const transcripts = data.transcript_data as unknown as TranscriptSegment[];
        setTranscriptData(transcripts);
      } else {
        // Mock transcript data for demonstration
        const mockTranscript: TranscriptSegment[] = [
          {
            start: 0,
            end: 15,
            text: "Welcome to this lesson. Today we'll be covering the fundamentals of web development.",
            speaker: "Instructor"
          },
          {
            start: 15,
            end: 35,
            text: "We'll start by understanding how the internet works and the role of web browsers.",
            speaker: "Instructor"
          },
          {
            start: 35,
            end: 55,
            text: "HTML, CSS, and JavaScript are the three core technologies we'll focus on in this course.",
            speaker: "Instructor"
          },
          {
            start: 55,
            end: 75,
            text: "Let's begin with HTML, which stands for HyperText Markup Language.",
            speaker: "Instructor"
          },
          {
            start: 75,
            end: 95,
            text: "HTML provides the structure and content of web pages using various tags and elements.",
            speaker: "Instructor"
          }
        ];
        setTranscriptData(mockTranscript);
      }
    } catch (error) {
      console.error('Error loading transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSegment = () => {
    return transcriptData.find(segment => 
      currentVideoTime >= segment.start && currentVideoTime <= segment.end
    );
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    if (onTimeSeek) {
      onTimeSeek(segment.start);
    }
  };

  const downloadTranscript = () => {
    const transcriptText = transcriptData
      .map(segment => `[${formatTime(segment.start)}] ${segment.text}`)
      .join('\n\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Video Transcript
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTranscript}
                disabled={transcriptData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transcript Content */}
          <ScrollArea className="h-96">
            {filteredTranscripts.length > 0 ? (
              <div className="space-y-3">
                {filteredTranscripts.map((segment, index) => {
                  const isCurrentSegment = getCurrentSegment()?.start === segment.start;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isCurrentSegment
                          ? 'bg-purple-100 border-purple-300 shadow-md'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSegmentClick(segment)}
                    >
                      <div className="flex items-start gap-3">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${
                            isCurrentSegment ? 'border-purple-500 text-purple-700' : ''
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {formatTime(segment.start)}
                        </Badge>
                        <div className="flex-1">
                          <p
                            className={`text-sm leading-relaxed ${
                              isCurrentSegment ? 'text-purple-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {searchTerm ? (
                              segment.text.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
                                part.toLowerCase() === searchTerm.toLowerCase() ? (
                                  <span key={i} className="bg-yellow-200 px-1 rounded">
                                    {part}
                                  </span>
                                ) : (
                                  part
                                )
                              )
                            ) : (
                              segment.text
                            )}
                          </p>
                          {segment.speaker && (
                            <p className="text-xs text-gray-500 mt-1">
                              — {segment.speaker}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : transcriptData.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No transcript available for this lesson</p>
                <p className="text-sm text-gray-400 mt-1">
                  Transcripts will be generated automatically for new videos
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No results found for "{searchTerm}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoTranscripts;
