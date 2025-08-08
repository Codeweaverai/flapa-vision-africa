import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminLayout from '@/components/admin/AdminLayout';
import NewsletterRecipients from '@/components/admin/NewsletterRecipients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Mail, 
  Plus, 
  Calendar, 
  Send, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Info,
  BookOpen,
  ShoppingCart,
  Sparkles,
  Palette
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
  template_id?: string;
}

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject_template: string;
  body_html_template: string;
  placeholders: string[];
  is_active: boolean;
}

const AdminNewsletters = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
  const [recipientCount, setRecipientCount] = useState(0);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNewsletters();
    fetchTemplates();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsletters((data || []) as Newsletter[]);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      toast.error('Failed to load newsletters');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const transformedData: NewsletterTemplate[] = (data || []).map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders 
          : typeof template.placeholders === 'string'
          ? JSON.parse(template.placeholders)
          : []
      }));
      
      setTemplates(transformedData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSelectTemplate = (template: NewsletterTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject_template);
    setBodyHtml(template.body_html_template);
  };

  const handleRecipientCountChange = (count: number) => {
    setRecipientCount(count);
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
        template_id: selectedTemplate?.id || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (selectedNewsletter) {
        // Update existing newsletter
        const { error } = await supabase
          .from('newsletters')
          .update(newsletterData)
          .eq('id', selectedNewsletter.id);

        if (error) throw error;
        toast.success('Newsletter updated successfully');
        setEditDialogOpen(false);
      } else {
        // Create new newsletter
        const { error } = await supabase
          .from('newsletters')
          .insert([newsletterData]);

        if (error) throw error;
        toast.success(status === 'draft' ? 'Newsletter saved as draft' : 'Newsletter scheduled successfully');
        setCreateDialogOpen(false);
      }

      resetForm();
      fetchNewsletters();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async (newsletterId: string) => {
    try {
      setSending(true);
      
      const { data, error } = await supabase.functions.invoke('send-newsletter-now', {
        body: { newsletterId }
      });

      if (error) throw error;

      toast.success(`Newsletter sent! ${data.successful_sends} successful, ${data.failed_sends} failed`);
      fetchNewsletters();
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (newsletterId: string) => {
    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', newsletterId);

      if (error) throw error;
      
      toast.success('Newsletter deleted successfully');
      fetchNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      toast.error('Failed to delete newsletter');
    }
  };

  const openEditDialog = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setSubject(newsletter.subject);
    setBodyHtml(newsletter.body_html);
    setScheduledAt(newsletter.scheduled_at ? newsletter.scheduled_at.slice(0, 16) : '');
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setSubject('');
    setBodyHtml('');
    setScheduledAt('');
    setSelectedNewsletter(null);
    setSelectedTemplate(null);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: Users,
      course: BookOpen,
      event: Calendar,
      promotional: ShoppingCart,
      engagement: Sparkles
    };
    const Icon = icons[category as keyof typeof icons] || Users;
    return <Icon className="h-4 w-4" />;
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

  const PlaceholderInfo = () => (
    <div className="bg-blue-50 p-4 rounded-lg mb-4">
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <Info className="h-4 w-4" />
        Available Placeholders
      </h4>
      <div className="text-sm space-y-1">
        <p><code>{`{{full_name}}`}</code> - User's full name or display name</p>
        <p><code>{`{{display_name}}`}</code> - User's display name</p>
        <p><code>{`{{course_names}}`}</code> - List of published courses</p>
        <p><code>{`{{event_titles}}`}</code> - List of upcoming events</p>
      </div>
    </div>
  );

  const NewsletterForm = ({ isEdit = false }) => (
    <div className="space-y-6">
      <PlaceholderInfo />
      
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-green-700">
          <Users className="h-4 w-4" />
          <span className="font-medium">Recipients: {recipientCount} total users</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Includes all users (both verified and unverified users, regular users and creators)
        </p>
      </div>

      {/* Template Selection */}
      {!isEdit && (
        <div className="space-y-4">
          <Label>Choose a Template (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(template.category)}
                  <h4 className="font-medium text-sm">{template.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{template.description}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {template.category}
                </Badge>
              </div>
            ))}
          </div>
          {selectedTemplate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <Palette className="h-4 w-4 inline mr-1" />
                Using template: <strong>{selectedTemplate.name}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter newsletter subject... (use {{full_name}} for personalization)"
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
          placeholder="Enter HTML content... Use placeholders like {{full_name}}, {{course_names}}, {{event_titles}}"
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
        {scheduledAt && (
          <Button
            onClick={() => handleSave('scheduled')}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Scheduling...' : 'Schedule Newsletter'}
          </Button>
        )}
        {!isEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!subject.trim() || !bodyHtml.trim() || sending}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                {sending ? 'Sending...' : 'Send Now'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Newsletter Now?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately send the newsletter to {recipientCount} users (both verified and unverified). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    // First save as draft, then send
                    await handleSave('draft');
                    if (selectedNewsletter || newsletters.length > 0) {
                      // Get the newsletter ID after saving
                      const latestNewsletter = newsletters[0];
                      if (latestNewsletter) {
                        await handleSendNow(latestNewsletter.id);
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Send Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );

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
              <Button 
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Newsletter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Newsletter</DialogTitle>
              </DialogHeader>
              <NewsletterForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Recipients Section */}
        <NewsletterRecipients onRecipientCountChange={handleRecipientCountChange} />

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
                    <TableHead>Template</TableHead>
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
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                          {newsletter.template_id ? (
                            <Badge variant="outline" className="text-xs">
                              <Palette className="h-3 w-3 mr-1" />
                              Template
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Custom</span>
                          )}
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
                            {newsletter.total_recipients || recipientCount}
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedNewsletter(newsletter);
                                setPreviewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {newsletter.status === 'draft' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(newsletter)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={sending}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Send Newsletter Now?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will send "{newsletter.subject}" to {recipientCount} users immediately.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleSendNow(newsletter.id)}
                                        className="bg-gradient-to-r from-orange-500 to-purple-600"
                                      >
                                        Send Now
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Newsletter?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{newsletter.subject}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(newsletter.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Newsletter</DialogTitle>
            </DialogHeader>
            <NewsletterForm isEdit={true} />
          </DialogContent>
        </Dialog>

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
