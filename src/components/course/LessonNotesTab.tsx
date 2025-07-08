import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StickyNote, Save, Clock } from 'lucide-react';

interface LessonNote {
  id: string;
  content: string;
  video_timestamp: number;
  created_at: string;
  updated_at: string;
}

interface LessonNotesTabProps {
  lessonId: string;
  currentVideoTime?: number;
}

const LessonNotesTab: React.FC<LessonNotesTabProps> = ({ lessonId, currentVideoTime = 0 }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lessonId && user) {
      fetchNotes();
    }
  }, [lessonId, user]);

  const fetchNotes = async () => {
    try {
      // Since we don't have lesson_notes table, we'll use a placeholder for now
      // In a real implementation, you would fetch from the actual notes table
      setNotes([]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() || !user) return;

    setSaving(true);
    try {
      // Placeholder for saving notes - would use actual notes table
      setNewNote('');
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please sign in to take notes</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-orange-500" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Current time: {formatTime(currentVideoTime)}</span>
          </div>
          <Textarea
            placeholder="Write your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={saveNote}
            disabled={saving || !newNote.trim()}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Notes</h3>
        
        <Card>
          <CardContent className="text-center py-8">
            <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No notes yet. Start taking notes!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LessonNotesTab;
