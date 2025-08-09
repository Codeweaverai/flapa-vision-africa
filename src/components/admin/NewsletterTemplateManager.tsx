
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, Copy, Mail, Palette, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import DynamicContentSearch from './DynamicContentSearch';

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject_template: string;
  body_html_template: string;
  thumbnail_url?: string;
  placeholders: string[];
  is_active: boolean;
  created_at: string;
}

const NewsletterTemplateManager = () => {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NewsletterTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NewsletterTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    subject_template: '',
    body_html_template: '',
    thumbnail_url: '',
    placeholders: '',
    is_active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .order('created_at', { ascending: false });

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
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'general',
      subject_template: '',
      body_html_template: getDefaultTemplate(),
      thumbnail_url: '',
      placeholders: 'course.title, course.price, event.date, creator.name',
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: NewsletterTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      subject_template: template.subject_template,
      body_html_template: template.body_html_template,
      thumbnail_url: template.thumbnail_url || '',
      placeholders: template.placeholders.join(', '),
      is_active: template.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const templateData = {
        ...formData,
        placeholders: formData.placeholders.split(',').map(p => p.trim()).filter(p => p)
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('newsletter_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('newsletter_templates')
          .insert([templateData]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      await loadTemplates();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('newsletter_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Template deleted successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handlePreview = (template: NewsletterTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleDuplicate = async (template: NewsletterTemplate) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        subject_template: template.subject_template,
        body_html_template: template.body_html_template,
        thumbnail_url: template.thumbnail_url,
        placeholders: template.placeholders,
        is_active: false
      };

      const { error } = await supabase
        .from('newsletter_templates')
        .insert([duplicatedTemplate]);

      if (error) throw error;
      
      toast.success('Template duplicated successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      course: 'bg-blue-100 text-blue-800',
      event: 'bg-green-100 text-green-800',
      promotional: 'bg-orange-100 text-orange-800',
      engagement: 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectDynamicContent = (content: any, type: 'creator' | 'course' | 'event') => {
    const contentHtml = generateContentHtml(content, type);
    setFormData(prev => ({
      ...prev,
      body_html_template: prev.body_html_template + '\n\n' + contentHtml
    }));
    toast.success(`${type} content added to template`);
  };

  const generateContentHtml = (content: any, type: 'creator' | 'course' | 'event') => {
    const baseUrl = 'https://skillpulse.cloud';
    
    if (type === 'creator') {
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            ${content.avatar_url ? 
              `<img src="${content.avatar_url}" alt="${content.full_name}" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 15px;">` : 
              `<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 15px;">${content.full_name?.charAt(0) || 'U'}</div>`
            }
            <div>
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.full_name || content.username}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">@${content.username}</p>
            </div>
          </div>
          ${content.bio ? `<p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.bio}</p>` : ''}
          <a href="${baseUrl}/creator/profile/${content.id}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Profile</a>
        </div>
      `;
    } else if (type === 'course') {
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; margin-bottom: 15px;">
            ${content.thumbnail_url ? 
              `<img src="${content.thumbnail_url}" alt="${content.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px;">` : 
              `<div style="width: 120px; height: 80px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 15px;"><span style="color: white; font-size: 24px;">📚</span></div>`
            }
            <div style="flex: 1;">
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.title}</h3>
              <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">by ${content.profiles?.full_name || 'Unknown'}</p>
              <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <span style="background: #ddd6fe; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${content.category}</span>
                <span style="font-weight: 600; color: #059669;">${content.is_free ? 'Free' : `$${content.price}`}</span>
              </div>
            </div>
          </div>
          <p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.description?.substring(0, 150)}${content.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a href="${baseUrl}/course/${content.id}" style="padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Course</a>
            <a href="${baseUrl}/course/${content.id}/enroll" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Enroll Now</a>
          </div>
        </div>
      `;
    } else if (type === 'event') {
      const startDate = new Date(content.start_time);
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; margin-bottom: 15px;">
            ${content.image_url ? 
              `<img src="${content.image_url}" alt="${content.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px;">` : 
              `<div style="width: 120px; height: 80px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 15px;"><span style="color: white; font-size: 24px;">📅</span></div>`
            }
            <div style="flex: 1;">
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.title}</h3>
              <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">by ${content.profiles?.full_name || 'Unknown'}</p>
              <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <span style="background: #ddd6fe; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${content.event_type}</span>
                <span style="font-weight: 600; color: #059669;">${content.is_free ? 'Free' : `$${content.price || 'TBA'}`}</span>
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                <div>📅 ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}</div>
                ${content.location ? `<div>📍 ${content.location}</div>` : ''}
              </div>
            </div>
          </div>
          <p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.description?.substring(0, 150)}${content.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a href="${baseUrl}/events/${content.id}" style="padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Event</a>
            <a href="${baseUrl}/events/${content.id}" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Register</a>
          </div>
        </div>
      `;
    }
    return '';
  };

  const getDefaultTemplate = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b, #8b5cf6); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SkillPulse Newsletter</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Stay updated with the latest courses and events</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hello {{full_name}}!</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We're excited to share some amazing updates with you. Check out what's new on SkillPulse!
            </p>
            
            <!-- Dynamic content will be inserted here -->
            
            <p style="color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Thanks for being part of the SkillPulse community!
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
                © 2024 SkillPulse. All rights reserved.
            </p>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
                If you no longer wish to receive these emails, you can 
                <a href="{{unsubscribe_url}}" style="color: #8b5cf6;">unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Newsletter Templates</h2>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      {!template.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium text-muted-foreground">
                    Subject: {template.subject_template.substring(0, 50)}...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Placeholders: {template.placeholders.length} available
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm" asChild>
                    <a href={`/admin/newsletters/new?template=${template.id}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Use
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic Content</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of what this template is for"
                  />
                </div>

                <div>
                  <Label htmlFor="subject_template">Subject Template *</Label>
                  <Input
                    id="subject_template"
                    name="subject_template"
                    value={formData.subject_template}
                    onChange={handleChange}
                    placeholder="e.g., 🎉 New Course: {{course.title}} is Live!"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="placeholders">Available Placeholders</Label>
                  <Input
                    id="placeholders"
                    name="placeholders"
                    value={formData.placeholders}
                    onChange={handleChange}
                    placeholder="e.g., course.title, course.price, event.date"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated list of placeholders available in this template
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="body_html_template">HTML Body Template *</Label>
                  <Textarea
                    id="body_html_template"
                    name="body_html_template"
                    value={formData.body_html_template}
                    onChange={handleChange}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="HTML template with placeholders like {{course.title}}"
                    required
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="dynamic" className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Search and select dynamic content to automatically add to your template. 
                    This will generate HTML blocks with working links and buttons.
                  </p>
                  <DynamicContentSearch onSelectContent={handleSelectDynamicContent} />
                </div>
              </TabsContent>
              
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <div className="p-3 bg-muted rounded">{previewTemplate.subject_template}</div>
              </div>
              <div>
                <Label>HTML Preview</Label>
                <div 
                  className="border rounded p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ 
                    __html: previewTemplate.body_html_template 
                  }}
                />
              </div>
              <div>
                <Label>Available Placeholders</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewTemplate.placeholders.map((placeholder) => (
                    <Badge key={placeholder} variant="outline">
                      {`{{${placeholder}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsletterTemplateManager;
