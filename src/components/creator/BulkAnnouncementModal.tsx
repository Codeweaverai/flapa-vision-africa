
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface BulkAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientType: 'all_students' | 'course_students' | 'event_attendees';
  courseId?: string;
  eventId?: string;
  onSuccess?: () => void;
}

const BulkAnnouncementModal: React.FC<BulkAnnouncementModalProps> = ({
  open,
  onOpenChange,
  recipientType,
  courseId,
  eventId,
  onSuccess
}) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to send announcements');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bulk-send-announcement', {
        body: {
          creatorId: user.id,
          subject,
          content: message,
          recipientType,
          courseId,
          eventId
        }
      });

      if (error) {
        console.error('Error sending announcement:', error);
        toast.error('Failed to send announcement');
        return;
      }

      toast.success(`Announcement sent successfully to ${data?.recipientCount || 0} recipients`);
      
      // Reset form
      setSubject('');
      setMessage('');
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error('Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const getRecipientDescription = () => {
    switch (recipientType) {
      case 'all_students':
        return 'all your students';
      case 'course_students':
        return 'students enrolled in the selected course';
      case 'event_attendees':
        return 'attendees of the selected event';
      default:
        return 'selected recipients';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Send Announcement
          </DialogTitle>
          <DialogDescription>
            Send a message to {getRecipientDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter announcement subject..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your announcement message..."
              rows={6}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {sending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAnnouncementModal;
