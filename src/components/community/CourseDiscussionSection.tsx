
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface CourseComment {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface CourseDiscussionSectionProps {
  courseId: string;
}

const CourseDiscussionSection: React.FC<CourseDiscussionSectionProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourseComments();

    // Set up realtime subscription for comments
    const channel = supabase
      .channel('course-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_comments',
        filter: `course_id=eq.${courseId}`,
      }, (payload) => {
        console.log('Course comment change:', payload);
        fetchCourseComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const fetchCourseComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_comments')
        .select(`
          *,
          profiles: user_id (id, username, full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as unknown as CourseComment[]);
    } catch (error) {
      console.error('Error fetching course comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const createCourseComment = async () => {
    if (!user?.id || !newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('course_comments')
        .insert({
          course_id: courseId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;
      
      setNewComment('');
      toast.success('Comment added successfully');
      // The realtime subscription will update the comments list
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseComment();
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold">Discussion</h3>
      
      {/* Comment submission form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea 
            placeholder="Share your thoughts on this course..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground italic">Sign in to join the discussion</p>
      )}
      
      {/* Comments list */}
      <div className="space-y-6 mt-8">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar className="h-10 w-10">
                {comment.profiles?.avatar_url ? (
                  <AvatarImage src={comment.profiles.avatar_url} alt={comment.profiles?.username || 'User'} />
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-line">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDiscussionSection;
