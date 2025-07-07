
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MessageCircle, Reply, Send } from 'lucide-react';

interface Discussion {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string;
  profiles?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface LessonDiscussionTabProps {
  lessonId: string;
}

const LessonDiscussionTab: React.FC<LessonDiscussionTabProps> = ({ lessonId }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchDiscussions();
    }
  }, [lessonId]);

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_discussions')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: newComment
        });

      if (error) throw error;
      
      setNewComment('');
      await fetchDiscussions();
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_discussions')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: replyContent,
          parent_id: parentId
        });

      if (error) throw error;
      
      setReplyContent('');
      setReplyTo(null);
      await fetchDiscussions();
      toast.success('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const topLevelDiscussions = discussions.filter(d => !d.parent_id);
  const getReplies = (parentId: string) => discussions.filter(d => d.parent_id === parentId);

  if (!user) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Please sign in to join the discussion</p>
      </div>
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
      {/* New Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-orange-500" />
            Join the Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share your thoughts about this lesson..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={submitComment}
            disabled={submitting || !newComment.trim()}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </CardContent>
      </Card>

      {/* Discussions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discussion ({discussions.length})</h3>
        
        {topLevelDiscussions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No discussions yet. Be the first to start the conversation!</p>
            </CardContent>
          </Card>
        ) : (
          topLevelDiscussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={discussion.profiles?.avatar_url} />
                    <AvatarFallback>
                      {discussion.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {discussion.profiles?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(discussion.created_at), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-2">{discussion.content}</p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
                      className="text-orange-600 hover:text-orange-700 p-0 h-auto"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>

                    {/* Reply Form */}
                    {replyTo === discussion.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => submitReply(discussion.id)}
                            disabled={submitting || !replyContent.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Reply
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyContent('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {getReplies(discussion.id).map((reply) => (
                      <div key={reply.id} className="mt-4 ml-6 border-l-2 border-gray-200 pl-4">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {reply.profiles?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-xs">
                                {reply.profiles?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(reply.created_at), 'MMM d, yyyy • h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LessonDiscussionTab;
