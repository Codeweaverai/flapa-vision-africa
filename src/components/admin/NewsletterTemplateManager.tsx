
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
import { Plus, Edit, Trash2, Eye, Copy, Mail, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

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
      setTemplates(data || []);
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
      body_html_template: '',
      thumbnail_url: '',
      placeholders: '',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Newsletter Templates</h2>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="body_html_template">HTML Body Template *</Label>
              <Textarea
                id="body_html_template"
                name="body_html_template"
                value={formData.body_html_template}
                onChange={handleChange}
                rows={15}
                className="font-mono text-sm"
                placeholder="HTML template with placeholders like {{course.title}}"
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

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTemplate ? 'Update' : 'Create'} Template
              </Button>
            </div>
          </form>
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
