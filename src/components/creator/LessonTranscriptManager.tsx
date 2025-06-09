
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LessonTranscriptDialog from './LessonTranscriptDialog';

interface LessonTranscriptManagerProps {
  lessonId: string;
  lessonTitle: string;
}

const LessonTranscriptManager = ({ lessonId, lessonTitle }: LessonTranscriptManagerProps) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Video Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Add or edit video transcript for better accessibility and SEO
          </p>
          <LessonTranscriptDialog lessonId={lessonId} lessonTitle={lessonTitle} />
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonTranscriptManager;
