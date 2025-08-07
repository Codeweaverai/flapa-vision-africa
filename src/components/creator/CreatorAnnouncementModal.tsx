
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  enrollment_date?: string;
  booking_date?: string;
  course_title?: string;
  event_title?: string;
  type: 'course' | 'event';
  payment_status: string;
}

interface CreatorAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: string[];
  studentsData: Student[];
  onSuccess?: () => void;
}

const CreatorAnnouncementModal: React.FC<CreatorAnnouncementModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  studentsData,
  onSuccess
}) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const selectedStudentsData = studentsData.filter(
    student => selectedStudents.includes(student.user_id)
  );

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please provide both subject and message');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-creator-announcement', {
        body: {
          creatorId: user.id,
          subject: subject.trim(),
          message: message.trim(),
          recipientUserIds: selectedStudents
        }
      });

      if (error) {
        console.error('Announcement error:', error);
        throw error;
      }

      toast.success(`Announcement sent to ${selectedStudents.length} students successfully!`);
      onClose();
      setSubject('');
      setMessage('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error('Failed to send announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-6 w-6 text-orange-600" />
            Send Student Announcement
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{selectedStudents.length} selected students</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Students Preview */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recipients:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedStudentsData.slice(0, 10).map((student) => (
                <Badge key={student.user_id} variant="secondary" className="text-xs">
                  {student.full_name}
                </Badge>
              ))}
              {selectedStudentsData.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedStudentsData.length - 10} more
                </Badge>
              )}
            </div>
          </div>

          {/* Subject Input */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Enter announcement subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Enter your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="text-base resize-none"
            />
            <p className="text-sm text-gray-500">
              This message will be sent to your students' inboxes and email addresses.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
          >
            {sending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send to {selectedStudents.length} Students
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorAnnouncementModal;
