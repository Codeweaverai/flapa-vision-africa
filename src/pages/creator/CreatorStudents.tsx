
import React, { useState, useEffect } from 'react';
import { Users, Mail, BookOpen, Calendar, Search, Send, Check, AlertCircle } from 'lucide-react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student {
  id: string;
  user_id: string;
  enrollment_date: string;
  course_title: string;
  course_id: string;
  student_name: string;
  student_email: string;
  progress_percentage?: number;
  is_completed?: boolean;
}

const CreatorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch course enrollments for the creator's courses
      const { data: enrollmentsData, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          user_id,
          enrollment_date,
          is_completed,
          courses!inner (
            id,
            title,
            creator_id
          ),
          profiles!inner (
            full_name,
            username
          )
        `)
        .eq('courses.creator_id', user.id)
        .order('enrollment_date', { ascending: false });

      if (error) throw error;

      // Get user emails for the students
      const userIds = enrollmentsData?.map(e => e.user_id) || [];
      const { data: userEmails } = await supabase.rpc('get_user_emails', { 
        user_ids: userIds 
      });

      const studentsWithEmails = enrollmentsData?.map(enrollment => {
        const userEmail = userEmails?.find(u => u.id === enrollment.user_id);
        return {
          id: enrollment.id,
          user_id: enrollment.user_id,
          enrollment_date: enrollment.enrollment_date,
          course_title: enrollment.courses.title,
          course_id: enrollment.courses.id,
          student_name: enrollment.profiles?.full_name || enrollment.profiles?.username || 'Unknown Student',
          student_email: userEmail?.email || 'No email available',
          is_completed: enrollment.is_completed
        };
      }) || [];

      setStudents(studentsWithEmails);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.subject.trim() || !announcementForm.message.trim()) {
      toast.error('Please provide both subject and message');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setSending(true);

    try {
      // Get selected students' user IDs
      const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));
      const userIds = selectedStudentData.map(s => s.user_id);

      // Send inbox messages to selected students
      const inboxPromises = userIds.map(userId =>
        supabase.from('inbox_messages').insert({
          sender_id: user?.id,
          recipient_id: userId,
          subject: `[Course Announcement] ${announcementForm.subject}`,
          content: announcementForm.message,
          message_type: 'announcement'
        })
      );

      await Promise.all(inboxPromises);

      // Send email notifications via edge function
      try {
        await supabase.functions.invoke('send-student-announcement', {
          body: {
            senderUserId: user?.id,
            subject: announcementForm.subject,
            message: announcementForm.message,
            studentUserIds: userIds
          }
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast.warning('Messages sent to inbox, but email delivery may have failed');
      }

      toast.success(`Announcement sent to ${selectedStudents.length} students successfully!`);
      setShowAnnouncementModal(false);
      setAnnouncementForm({ subject: '', message: '' });
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error('Failed to send announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const uniqueCourses = [...new Set(students.map(s => s.course_title))];
  const totalEnrollments = students.length;
  const completedEnrollments = students.filter(s => s.is_completed).length;

  if (loading) {
    return (
      <CreatorLayout title="My Students">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="My Students">
      {/* Orange-Purple Gradient Background */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl text-white">
            <div>
              <h1 className="text-2xl font-bold">My Students</h1>
              <p className="text-orange-100">Manage and communicate with your course enrollments</p>
            </div>
            <Button
              onClick={() => setShowAnnouncementModal(true)}
              disabled={selectedStudents.length === 0}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Announcement ({selectedStudents.length})
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Total Students</p>
                    <p className="text-2xl font-bold text-orange-900">{totalEnrollments}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Completed</p>
                    <p className="text-2xl font-bold text-purple-900">{completedEnrollments}</p>
                  </div>
                  <Check className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-700">Active Courses</p>
                    <p className="text-2xl font-bold text-pink-900">{uniqueCourses.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">Completion Rate</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0}%
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="border-orange-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search students, courses, or emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({filteredStudents.length})
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground">
                  {students.length === 0 
                    ? 'Students will appear here when they enroll in your courses.' 
                    : 'Try adjusting your search terms.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-purple-500/10">
                <CardTitle className="text-orange-900">Student Enrollments</CardTitle>
                <CardDescription className="text-orange-700">
                  Showing {filteredStudents.length} of {students.length} student enrollments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-orange-100">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleSelectStudent(student.id)}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{student.student_name}</p>
                              {student.is_completed && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{student.student_email}</p>
                            <p className="text-sm font-medium text-purple-700">
                              Enrolled in: {student.course_title}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Enrolled: {format(new Date(student.enrollment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Announcement Modal */}
          <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Mail className="h-6 w-6 text-orange-600" />
                  Send Announcement to Students
                </DialogTitle>
                <p className="text-sm text-gray-600">
                  This will send a message to {selectedStudents.length} selected students' inboxes and email addresses.
                </p>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter announcement subject..."
                    value={announcementForm.subject}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your announcement message..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAnnouncementModal(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendAnnouncement}
                  disabled={sending || !announcementForm.subject.trim() || !announcementForm.message.trim()}
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
        </div>
      </div>
    </CreatorLayout>
  );
};

export default CreatorStudents;
