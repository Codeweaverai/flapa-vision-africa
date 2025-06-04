
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Reply, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Discussion {
  id: string;
  content: string;
  is_instructor_reply: boolean;
  created_at: string;
  user_id: string;
  parent_id?: string;
  user_profile?: {
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Discussion[];
}

interface LessonDiscussionsProps {
  lessonId: string;
}

const LessonDiscussions = ({ lessonId }: LessonDiscussionsProps) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId) {
      loadDiscussions();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`lesson_discussions_${lessonId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'lesson_discussions',
            filter: `lesson_id=eq.${lessonId}` 
          }, 
          () => {
            loadDiscussions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [lessonId]);

  const loadDiscussions = async () => {
    const { data, error } = await supabase
      .from('lesson_discussions')
      .select(`
        *,
        user_profile:profiles!user_id(full_name, avatar_url)
      `)
      .eq('lesson_id', lessonId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Load replies for each discussion
      const discussionsWithReplies = await Promise.all(
        data.map(async (discussion) => {
          const { data: replies } = await supabase
            .from('lesson_discussions')
            .select(`
              *,
              user_profile:profiles!user_id(full_name, avatar_url)
            `)
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true });

          return {
            ...discussion,
            replies: replies || []
          };
        })
      );

      setDiscussions(discussionsWithReplies);
    }
  };

  const postQuestion = async () => {
    if (!user || !newQuestion.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('lesson_discussions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        content: newQuestion.trim(),
        is_instructor_reply: false
      });

    if (error) {
      toast.error('Failed to post question');
    } else {
      toast.success('Question posted successfully');
      setNewQuestion('');
      loadDiscussions();
    }
    setLoading(false);
  };

  const postReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('lesson_discussions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        parent_id: parentId,
        content: replyContent.trim(),
        is_instructor_reply: false
      });

    if (error) {
      toast.error('Failed to post reply');
    } else {
      toast.success('Reply posted successfully');
      setReplyContent('');
      setReplyingTo(null);
      loadDiscussions();
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Post Question */}
      <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            Ask a Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Have a question about this lesson? Ask here..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={3}
            className="border-orange-200 focus:border-orange-400"
          />
          <Button 
            onClick={postQuestion} 
            disabled={!newQuestion.trim() || loading}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Post Question
          </Button>
        </CardContent>
      </Card>

      {/* Discussions */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={discussion.user_profile?.avatar_url} />
                  <AvatarFallback>
                    {discussion.user_profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {discussion.user_profile?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(discussion.created_at)}
                    </span>
                    {discussion.is_instructor_reply && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Instructor
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{discussion.content}</p>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                    className="mb-4"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>

                  {/* Reply Form */}
                  {replyingTo === discussion.id && (
                    <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => postReply(discussion.id)}
                          disabled={!replyContent.trim() || loading}
                        >
                          Post Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
                    <div className="space-y-3 ml-4 border-l-2 border-gray-200 pl-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.user_profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {reply.user_profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {reply.user_profile?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(reply.created_at)}
                              </span>
                              {reply.is_instructor_reply && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                  Instructor
                                </span>
                              )}
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
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No questions yet</h3>
              <p className="text-gray-600">Be the first to ask a question about this lesson!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LessonDiscussions;
