
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Plus, Trash2 } from 'lucide-react';

interface LessonNote {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  timestamp_seconds: number; // This matches the actual database column
  created_at: string;
  updated_at: string;
}

interface LessonNotesTabProps {
  lessonId: string;
  currentTime?: number;
  onSeekTo?: (time: number) => void;
}

const LessonNotesTab: React.FC<LessonNotesTabProps> = ({ 
  lessonId, 
  currentTime = 0,
  onSeekTo 
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!user || !lessonId) return;

    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .order('timestamp_seconds', { ascending: true });

      if (error) throw error;

      console.log('Fetched notes:', data);
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [lessonId, user]);

  const addNote = async () => {
    if (!user || !newNote.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_notes')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: newNote.trim(),
          timestamp_seconds: Math.floor(currentTime)
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please sign in to take notes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new note */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>At {formatTime(Math.floor(currentTime))}</span>
            </div>
            <Textarea
              placeholder="Add a note at this timestamp..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={addNote} 
              disabled={loading || !newNote.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Add your first note above!
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => onSeekTo?.(note.timestamp_seconds)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTime(note.timestamp_seconds)}
                      </button>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LessonNotesTab;
