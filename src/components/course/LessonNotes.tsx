
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  timestamp_seconds: number;
  created_at: string;
}

interface Bookmark {
  id: string;
  timestamp_seconds: number;
  title?: string;
  created_at: string;
}

interface LessonNotesProps {
  lessonId: string;
  currentTime?: number;
}

const LessonNotes = ({ lessonId, currentTime = 0 }: LessonNotesProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && lessonId) {
      loadNotes();
      loadBookmarks();
    }
  }, [user, lessonId]);

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .order('timestamp_seconds', { ascending: true });

    if (!error && data) {
      setNotes(data);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('lesson_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .order('timestamp_seconds', { ascending: true });

    if (!error && data) {
      setBookmarks(data);
    }
  };

  const saveNote = async () => {
    if (!user || !newNote.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('lesson_notes')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        content: newNote.trim(),
        timestamp_seconds: Math.floor(currentTime)
      });

    if (error) {
      toast.error('Failed to save note');
    } else {
      toast.success('Note saved successfully');
      setNewNote('');
      loadNotes();
    }
    setLoading(false);
  };

  const addBookmark = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from('lesson_bookmarks')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        timestamp_seconds: Math.floor(currentTime),
        title: `Bookmark at ${Math.floor(currentTime / 60)}:${(Math.floor(currentTime) % 60).toString().padStart(2, '0')}`
      });

    if (error) {
      toast.error('Failed to add bookmark');
    } else {
      toast.success('Bookmark added');
      loadBookmarks();
    }
    setLoading(false);
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('id', noteId);

    if (!error) {
      toast.success('Note deleted');
      loadNotes();
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from('lesson_bookmarks')
      .delete()
      .eq('id', bookmarkId);

    if (!error) {
      toast.success('Bookmark deleted');
      loadBookmarks();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button 
              onClick={saveNote} 
              disabled={!newNote.trim() || loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Note at {formatTime(Math.floor(currentTime))}
            </Button>
            <Button 
              onClick={addBookmark} 
              variant="outline"
              disabled={loading}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{formatTime(bookmark.timestamp_seconds)}</span>
                    {bookmark.title && <span className="ml-2 text-sm text-muted-foreground">{bookmark.title}</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBookmark(bookmark.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-orange-600">
                      {formatTime(note.timestamp_seconds)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonNotes;
