
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  Mail, 
  Plus, 
  Calendar, 
  Send, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Newsletter {
  id: string;
  subject: string;
  body_html: string;
  scheduled_at: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  created_at: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
}

const AdminNewsletters = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Type assertion to ensure proper typing
      setNewsletters((data || []) as Newsletter[]);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: 'draft' | 'scheduled') => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('Subject and content are required');
      return;
    }

    if (status === 'scheduled' && !scheduledAt) {
      toast.error('Scheduled date is required');
      return;
    }

    try {
      setSaving(true);
      
      const newsletterData = {
        subject: subject.trim(),
        body_html: bodyHtml.trim(),
        status,
        scheduled_at: status === 'scheduled' ? scheduledAt : null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from('newsletters')
        .insert([newsletterData]);

      if (error) throw error;

      toast.success(status === 'draft' ? 'Newsletter saved as draft' : 'Newsletter scheduled successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchNewsletters();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setBodyHtml('');
    setScheduledAt('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'sending':
        return <Send className="h-4 w-4" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Newsletter Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Newsletter Management">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Newsletters</h2>
            <p className="text-gray-600 mt-1">Create and manage email newsletters</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Newsletter</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter newsletter subject..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule Date & Time (optional)</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-gray-500">
                    Leave empty to save as draft. Set a future date to schedule.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">HTML Content</Label>
                  <Textarea
                    id="content"
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Enter HTML content for your newsletter..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Use HTML to format your newsletter content. Unsubscribe links will be added automatically.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave('scheduled')}
                    disabled={saving || !scheduledAt}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Schedule Newsletter'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Newsletters Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              All Newsletters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No newsletters found. Create your first newsletter!
                      </TableCell>
                    </TableRow>
                  ) : (
                    newsletters.map((newsletter) => (
                      <TableRow key={newsletter.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium">{newsletter.subject}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(newsletter.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(newsletter.status)}
                              {newsletter.status.toUpperCase()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {newsletter.scheduled_at ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {format(new Date(newsletter.scheduled_at), 'MMM d, yyyy HH:mm')}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {newsletter.total_recipients || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {newsletter.total_recipients > 0 ? (
                            <div className="text-sm">
                              <div className="font-medium text-green-600">
                                {newsletter.successful_sends || 0} sent
                              </div>
                              {newsletter.failed_sends > 0 && (
                                <div className="text-red-600">
                                  {newsletter.failed_sends} failed
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedNewsletter(newsletter);
                              setPreviewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Newsletter Preview</DialogTitle>
            </DialogHeader>
            {selectedNewsletter && (
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Subject</Label>
                  <p className="text-lg">{selectedNewsletter.subject}</p>
                </div>
                <div>
                  <Label className="font-medium">Content Preview</Label>
                  <div 
                    className="border rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedNewsletter.body_html }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletters;
