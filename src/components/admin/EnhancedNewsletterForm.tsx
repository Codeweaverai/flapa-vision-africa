
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Send, Eye, Save, Search, X, ExternalLink, Users, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DynamicContentSearch from './DynamicContentSearch';

interface NewsletterTemplate {
  id: string;
  name: string;
  body_html_template: string;
  subject_template: string;
  category: string;
  description?: string;
  is_active: boolean;
  created_by: string;
}

interface DynamicContent {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'event' | 'creator';
  image_url?: string;
  link_url?: string;
  creator_name?: string;
  price?: number;
  date?: string;
}

const EnhancedNewsletterForm = () => {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    body_html: '',
    created_by: ''
  });
  const [selectedContent, setSelectedContent] = useState<DynamicContent[]>([]);
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplates();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setFormData(prev => ({ ...prev, created_by: user.id }));
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: NewsletterTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      subject: template.subject_template,
      body_html: template.body_html_template
    }));
  };

  const handleContentSelect = (content: DynamicContent[]) => {
    setSelectedContent(content);
    // Auto-generate content blocks
    generateContentBlocks(content);
  };

  const generateContentBlocks = (content: DynamicContent[]) => {
    let htmlBlocks = '';

    // Group content by type
    const courses = content.filter(c => c.type === 'course');
    const events = content.filter(c => c.type === 'event');
    const creators = content.filter(c => c.type === 'creator');

    // Generate course blocks
    if (courses.length > 0) {
      htmlBlocks += `
        <div style="margin: 30px 0;">
          <h2 style="color: #ea580c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
            🎓 Featured Courses
          </h2>
          <div style="display: grid; gap: 20px;">
            ${courses.map(course => `
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #fef3e2 0%, #f3e8ff 100%);">
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #7c3aed;">
                    ${course.title}
                  </h3>
                  <p style="color: #6b7280; margin-bottom: 15px; line-height: 1.5;">
                    ${course.description}
                  </p>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span style="color: #ea580c; font-weight: bold; font-size: 16px;">
                      ${course.price ? `$${course.price}` : 'Free'}
                    </span>
                    <a href="${course.link_url || `https://skillpulse.cloud/courses/${course.id}`}" 
                       style="background: linear-gradient(135deg, #ea580c 0%, #7c3aed 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;">
                      Enroll Now →
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Generate event blocks
    if (events.length > 0) {
      htmlBlocks += `
        <div style="margin: 30px 0;">
          <h2 style="color: #7c3aed; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
            📅 Upcoming Events
          </h2>
          <div style="display: grid; gap: 20px;">
            ${events.map(event => `
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #f3e8ff 0%, #fef3e2 100%);">
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #ea580c;">
                    ${event.title}
                  </h3>
                  <p style="color: #6b7280; margin-bottom: 15px; line-height: 1.5;">
                    ${event.description}
                  </p>
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <span style="color: #7c3aed; font-weight: bold;">
                      ${event.date ? new Date(event.date).toLocaleDateString() : 'Date TBA'}
                    </span>
                    <a href="${event.link_url || `https://skillpulse.cloud/events/${event.id}`}" 
                       style="background: linear-gradient(135deg, #7c3aed 0%, #ea580c 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;">
                      Register Now →
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Generate creator blocks
    if (creators.length > 0) {
      htmlBlocks += `
        <div style="margin: 30px 0;">
          <h2 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
            👥 Featured Creators
          </h2>
          <div style="display: grid; gap: 20px;">
            ${creators.map(creator => `
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #ecfdf5 0%, #fef3e2 100%);">
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #059669;">
                    ${creator.title}
                  </h3>
                  <p style="color: #6b7280; margin-bottom: 15px; line-height: 1.5;">
                    ${creator.description}
                  </p>
                  <div style="text-align: right;">
                    <a href="${creator.link_url || `https://skillpulse.cloud/creators/${creator.id}`}" 
                       style="background: linear-gradient(135deg, #059669 0%, #ea580c 100%); color: white; padding: 8px 16px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;">
                      Follow Creator →
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Insert content blocks into template
    if (htmlBlocks) {
      const updatedBody = formData.body_html + htmlBlocks;
      setFormData(prev => ({
        ...prev,
        body_html: updatedBody
      }));
    }
  };

  const removeContentItem = (contentId: string) => {
    setSelectedContent(prev => prev.filter(item => item.id !== contentId));
  };

  const handleSendNewsletter = async () => {
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (!formData.body_html.trim()) {
      toast.error('Email content is required');
      return;
    }

    setSending(true);
    try {
      // First create the newsletter record
      const { data: newsletter, error: createError } = await supabase
        .from('newsletters')
        .insert({
          subject: formData.subject,
          body_html: formData.body_html,
          created_by: formData.created_by,
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Then send it via edge function
      const { error: sendError } = await supabase.functions.invoke('send-newsletter-now', {
        body: { newsletterId: newsletter.id }
      });

      if (sendError) throw sendError;

      toast.success('Newsletter sent successfully!');
      
      // Reset form
      setFormData(prev => ({
        subject: '',
        body_html: '',
        created_by: prev.created_by
      }));
      setSelectedContent([]);
      setSelectedTemplate(null);

    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter: ' + (error as any).message);
    } finally {
      setSending(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      const { error } = await supabase
        .from('newsletters')
        .insert({
          subject: formData.subject,
          body_html: formData.body_html,
          created_by: formData.created_by,
          status: 'draft'
        });

      if (error) throw error;
      toast.success('Newsletter saved as draft');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Choose Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTemplate?.id === template.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <Badge variant="secondary">{template.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Content Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Dynamic Content
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContentSearch(!showContentSearch)}
              className="ml-auto"
            >
              {showContentSearch ? 'Hide Search' : 'Add Content'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showContentSearch && (
            <div className="mb-6">
              <DynamicContentSearch onContentSelect={handleContentSelect} />
            </div>
          )}
          
          {selectedContent.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Selected Content:</h4>
              <div className="grid gap-3">
                {selectedContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.type === 'course' && <BookOpen className="h-4 w-4 text-blue-600" />}
                      {item.type === 'event' && <Calendar className="h-4 w-4 text-green-600" />}
                      {item.type === 'creator' && <Users className="h-4 w-4 text-purple-600" />}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.creator_name && `by ${item.creator_name}`}
                          {item.price && ` • $${item.price}`}
                          {item.date && ` • ${new Date(item.date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContentItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Newsletter subject line..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="body_html">Email Content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
            
            {previewMode ? (
              <div 
                className="border rounded-lg p-4 min-h-[300px] bg-white"
                dangerouslySetInnerHTML={{ __html: formData.body_html }}
              />
            ) : (
              <Textarea
                id="body_html"
                value={formData.body_html}
                onChange={(e) => setFormData(prev => ({ ...prev, body_html: e.target.value }))}
                placeholder="Write your newsletter content here..."
                className="min-h-[300px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSendNewsletter}
          disabled={sending}
          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Newsletter'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleSaveAsDraft}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
      </div>
    </div>
  );
};

export default EnhancedNewsletterForm;
