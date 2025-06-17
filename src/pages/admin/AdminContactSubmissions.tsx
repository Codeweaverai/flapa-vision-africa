
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Eye, 
  Calendar, 
  User, 
  MessageSquare, 
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ContactSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

const AdminContactSubmissions = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure the status field matches our interface
      const typedSubmissions = (data || []).map(submission => ({
        ...submission,
        status: submission.status as 'new' | 'in_progress' | 'resolved'
      }));
      
      setSubmissions(typedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: status as 'new' | 'in_progress' | 'resolved', admin_notes: notes, updated_at: new Date().toISOString() }
            : sub
        )
      );

      toast.success('Submission updated successfully');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const handleReplyViaEmail = (submission: ContactSubmission) => {
    const subject = encodeURIComponent(`Re: ${submission.subject}`);
    const body = encodeURIComponent(`Dear ${submission.first_name} ${submission.last_name},\n\nThank you for contacting us regarding "${submission.subject}".\n\n\n\nBest regards,\nSupport Team`);
    const mailtoLink = `mailto:${submission.email}?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    
    // Update status to in_progress when reply is initiated
    if (submission.status === 'new') {
      updateSubmissionStatus(submission.id, 'in_progress');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout title="Contact Submissions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Contact Submissions">
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Total: {filteredSubmissions.length} submissions
          </div>
        </div>

        {/* Submissions Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contact Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No contact submissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 font-medium">
                              <User className="h-4 w-4 text-gray-400" />
                              {submission.first_name} {submission.last_name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {submission.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={submission.subject}>
                            {submission.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(submission.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSubmission(submission);
                                    setAdminNotes(submission.admin_notes || '');
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Contact Submission Details</DialogTitle>
                                </DialogHeader>
                                {selectedSubmission && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Name</Label>
                                        <p className="text-sm text-gray-600">
                                          {selectedSubmission.first_name} {selectedSubmission.last_name}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm text-gray-600">{selectedSubmission.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Badge className={getStatusColor(selectedSubmission.status)}>
                                          {selectedSubmission.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Date</Label>
                                        <p className="text-sm text-gray-600">
                                          {format(new Date(selectedSubmission.created_at), 'PPp')}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-sm font-medium">Subject</Label>
                                      <p className="text-sm text-gray-600 mt-1">{selectedSubmission.subject}</p>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-sm font-medium">Message</Label>
                                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                          {selectedSubmission.message}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor="admin-notes" className="text-sm font-medium">
                                        Admin Notes
                                      </Label>
                                      <Textarea
                                        id="admin-notes"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add internal notes about this submission..."
                                        className="mt-1"
                                        rows={3}
                                      />
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <Button
                                        onClick={() => handleReplyViaEmail(selectedSubmission)}
                                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white flex items-center gap-2"
                                      >
                                        <Mail className="h-4 w-4" />
                                        Reply via Email
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateSubmissionStatus(selectedSubmission.id, 'in_progress', adminNotes)}
                                          disabled={selectedSubmission.status === 'in_progress'}
                                        >
                                          Mark In Progress
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => updateSubmissionStatus(selectedSubmission.id, 'resolved', adminNotes)}
                                          disabled={selectedSubmission.status === 'resolved'}
                                        >
                                          Mark Resolved
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReplyViaEmail(submission)}
                              className="bg-gradient-to-r from-orange-50 to-purple-50 hover:from-orange-100 hover:to-purple-100 border-orange-200"
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">New</p>
                  <p className="text-2xl font-bold text-red-800">
                    {submissions.filter(s => s.status === 'new').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {submissions.filter(s => s.status === 'in_progress').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Resolved</p>
                  <p className="text-2xl font-bold text-green-800">
                    {submissions.filter(s => s.status === 'resolved').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total</p>
                  <p className="text-2xl font-bold text-blue-800">{submissions.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactSubmissions;
