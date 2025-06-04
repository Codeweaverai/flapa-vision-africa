
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, CheckCircle, Reply } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  full_name?: string;
  avatar_url?: string;
}

interface Discussion {
  id: string;
  content: string;
  user_id: string;
  lesson_id: string;
  parent_id?: string;
  is_instructor_reply: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  replies?: Discussion[];
}

interface LessonDiscussionProps {
  lessonId: string;
  isInstructor?: boolean;
}

const LessonDiscussion: React.FC<LessonDiscussionProps> = ({ lessonId, isInstructor = false }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiscussions();
    subscribeToDiscussions();
  }, [lessonId]);

  const fetchDiscussions = async () => {
    try {
      // First, fetch all discussions for this lesson
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('lesson_discussions')
        .select('*')
        .eq('lesson_id', lessonId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (discussionsError) throw discussionsError;

      // Then, fetch user profiles separately
      const userIds = discussionsData?.map(d => d.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles for quick lookup
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, UserProfile>);

      // Fetch replies for each discussion
      const discussionsWithReplies = await Promise.all(
        (discussionsData || []).map(async (discussion) => {
          const { data: replies, error: repliesError } = await supabase
            .from('lesson_discussions')
            .select('*')
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true });

          if (repliesError) {
            console.error('Error fetching replies:', repliesError);
            return {
              ...discussion,
              user_profile: profilesMap[discussion.user_id] || {},
              replies: []
            };
          }

          // Fetch profiles for reply authors
          const replyUserIds = replies?.map(r => r.user_id) || [];
          const { data: replyProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', replyUserIds);

          const replyProfilesMap = (replyProfiles || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, UserProfile>);

          return {
            ...discussion,
            user_profile: profilesMap[discussion.user_id] || {},
            replies: replies?.map(reply => ({
              ...reply,
              user_profile: replyProfilesMap[reply.user_id] || {}
            })) || []
          };
        })
      );

      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
    }
  };

  const subscribeToDiscussions = () => {
    const channel = supabase
      .channel('lesson_discussions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lesson_discussions',
          filter: `lesson_id=eq.${lessonId}`
        },
        () => {
          fetchDiscussions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitQuestion = async () => {
    if (!user || !newQuestion.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .insert({
          content: newQuestion,
          user_id: user.id,
          lesson_id: lessonId,
          is_instructor_reply: isInstructor
        });

      if (error) throw error;

      setNewQuestion('');
      toast.success('Question posted successfully!');
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error('Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .insert({
          content: replyContent,
          user_id: user.id,
          lesson_id: lessonId,
          parent_id: parentId,
          is_instructor_reply: isInstructor
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Lesson Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Ask a question about this lesson..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmitQuestion} 
              disabled={loading || !newQuestion.trim()}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              Post Question
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={discussion.user_profile?.avatar_url} />
                  <AvatarFallback>
                    {discussion.user_profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {discussion.user_profile?.full_name || 'Anonymous'}
                    </span>
                    {discussion.is_instructor_reply && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        Instructor
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(discussion.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700">{discussion.content}</p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(discussion.id)}
                      className="text-sm"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === discussion.id && (
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleSubmitReply(discussion.id)}
                          disabled={loading || !replyContent.trim()}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                          Post Reply
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.user_profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {reply.user_profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {reply.user_profile?.full_name || 'Anonymous'}
                              </span>
                              {reply.is_instructor_reply && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                  Instructor
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {discussions.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
              <p className="text-muted-foreground">
                Be the first to ask a question about this lesson!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LessonDiscussion;
