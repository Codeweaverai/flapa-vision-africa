
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { BookOpen, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Course } from '@/services/courseService';
import { CourseComment, fetchCourseComments, createCourseComment } from '@/services/communityService';
import { supabase } from '@/lib/supabaseClient';

interface CourseDiscussionSectionProps {
  course: Course;
  userId: string;
}

const CourseDiscussionSection = ({ course, userId }: CourseDiscussionSectionProps) => {
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
    
    // Set up realtime subscription for this course's comments
    const channel = supabase
      .channel(`course-comments-${course.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'course_comments',
          filter: `course_id=eq.${course.id}` 
        }, 
        (payload) => {
          console.log('Comment change received!', payload);
          loadComments(); // Reload comments when there's a change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [course.id]);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchCourseComments(course.id);
    setComments(data);
    setLoading(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const comment = await createCourseComment(userId, course.id, newComment);
    if (comment) {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>
            {course.category} • {course.difficulty_level}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{course.summary}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {Math.round(course.duration_minutes / 60)} hours of content
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`/learning/course/${course.id}`}>View Course</a>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discussion</CardTitle>
          <CardDescription>
            Share your thoughts and questions about this course
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmitComment} className="mb-6">
            <Textarea
              placeholder="Add to the discussion..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                Post Comment
              </Button>
            </div>
          </form>
          
          <Separator className="my-4" />
          
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center p-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary/40" />
              <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
              <p className="text-muted-foreground">
                Be the first to start a discussion about this course!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={comment.profiles?.avatar_url || ''} />
                      <AvatarFallback>
                        {(comment.profiles?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {comment.profiles?.full_name || comment.profiles?.username || 'Anonymous'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                  {comments.indexOf(comment) < comments.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseDiscussionSection;
