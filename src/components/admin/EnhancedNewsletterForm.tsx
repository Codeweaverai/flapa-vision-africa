
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Eye, Palette, BookOpen, Calendar, ShoppingCart, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';

interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject_template: string;
  body_html_template: string;
  placeholders: string[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  is_free: boolean;
  difficulty_level: string;
  duration_minutes: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location?: string;
  start_time: string;
  price: number;
}

const EnhancedNewsletterForm = () => {
  const [searchParams] = useSearchParams();
  const preselectedTemplateId = searchParams.get('template');
  
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [contentSelectionOpen, setContentSelectionOpen] = useState(false);
  const [contentType, setContentType] = useState<'courses' | 'events'>('courses');

  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    send_immediately: false,
    scheduled_time: '',
    target_audience: 'all'
  });

  useEffect(() => {
    loadTemplates();
    loadCourses();
    loadEvents();
  }, []);

  useEffect(() => {
    if (preselectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === preselectedTemplateId);
      if (template) {
        handleSelectTemplate(template);
      }
    }
  }, [preselectedTemplateId, templates]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleSelectTemplate = (template: NewsletterTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      subject: template.subject_template,
      content: template.body_html_template
    }));
  };

  const generateCourseCards = (courses: Course[]) => {
    return courses.map(course => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
        ${course.thumbnail_url ? `<img src="${course.thumbnail_url}" alt="${course.title}" style="width: 100%; height: 150px; object-fit: cover;">` : ''}
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${course.title}</h3>
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">${course.description.substring(0, 120)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${course.difficulty_level}</span>
            <span style="font-weight: bold; color: #f97316;">${course.is_free ? 'FREE' : '$' + course.price}</span>
          </div>
          <a href="https://skillpulse.cloud/courses/${course.id}" style="display: block; background-color: #f97316; color: white; text-decoration: none; padding: 10px; text-align: center; border-radius: 6px; margin-top: 15px;">Enroll Now</a>
        </div>
      </div>
    `).join('');
  };

  const generateEventCards = (events: Event[]) => {
    return events.map(event => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" style="width: 100%; height: 150px; object-fit: cover;">` : ''}
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">${event.title}</h3>
          <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">${event.description.substring(0, 120)}...</p>
          <div style="margin-bottom: 15px;">
            <div style="margin-bottom: 5px; font-size: 14px; color: #6b7280;">📅 ${new Date(event.start_time).toLocaleDateString()}</div>
            ${event.location ? `<div style="margin-bottom: 5px; font-size: 14px; color: #6b7280;">📍 ${event.location}</div>` : ''}
            <div style="font-weight: bold; color: #3b82f6;">$${event.price}</div>
          </div>
          <a href="https://skillpulse.cloud/events/${event.id}" style="display: block; background-color: #3b82f6; color: white; text-decoration: none; padding: 10px; text-align: center; border-radius: 6px;">Register Now</a>
        </div>
      </div>
    `).join('');
  };

  const insertContent = (type: 'courses' | 'events') => {
    let content = '';
    if (type === 'courses' && selectedCourses.length > 0) {
      content = generateCourseCards(selectedCourses);
    } else if (type === 'events' && selectedEvents.length > 0) {
      content = generateEventCards(selectedEvents);
    }

    setFormData(prev => ({
      ...prev,
      content: prev.content.replace(
        type === 'courses' ? '{{course_cards}}' : '{{event_cards}}',
        content
      )
    }));

    setContentSelectionOpen(false);
    toast.success(`${type === 'courses' ? 'Course' : 'Event'} cards inserted successfully`);
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newsletterData = {
        ...formData,
        template_id: selectedTemplate?.id || null,
        status: formData.send_immediately ? 'sending' : 'draft'
      };

      const { error } = await supabase
        .from('newsletters')
        .insert([newsletterData]);

      if (error) throw error;

      toast.success(
        formData.send_immediately 
          ? 'Newsletter is being sent!' 
          : 'Newsletter saved as draft'
      );
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create Newsletter</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!formData.content}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Choose Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>
        </div>

        {/* Newsletter Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Content</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter newsletter subject"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Newsletter Content *</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContentType('courses');
                        setContentSelectionOpen(true);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Insert Courses
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setContentType('events');
                        setContentSelectionOpen(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Insert Events
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Newsletter HTML content..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Select 
                      value={formData.target_audience} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="creators">Creators Only</SelectItem>
                        <SelectItem value="inactive">Inactive Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="scheduled_time">Schedule (Optional)</Label>
                    <Input
                      id="scheduled_time"
                      name="scheduled_time"
                      type="datetime-local"
                      value={formData.scheduled_time}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="send_immediately"
                    checked={formData.send_immediately}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_immediately: checked }))}
                  />
                  <Label htmlFor="send_immediately">Send Immediately</Label>
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline">
                    Save Draft
                  </Button>
                  <Button type="submit">
                    {formData.send_immediately ? 'Send Newsletter' : 'Schedule Newsletter'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Selection Dialog */}
      <Dialog open={contentSelectionOpen} onOpenChange={setContentSelectionOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Select {contentType === 'courses' ? 'Courses' : 'Events'} to Include
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentType === 'courses' 
              ? courses.map((course) => (
                  <Card key={course.id} className={`cursor-pointer transition-colors ${
                    selectedCourses.some(c => c.id === course.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedCourses.some(c => c.id === course.id)) {
                      setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
                    } else {
                      setSelectedCourses(prev => [...prev, course]);
                    }
                  }}>
                    <CardContent className="p-4">
                      {course.thumbnail_url && (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.description.substring(0, 100)}...</p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline">{course.difficulty_level}</Badge>
                        <span className="font-bold">{course.is_free ? 'FREE' : `$${course.price}`}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : events.map((event) => (
                  <Card key={event.id} className={`cursor-pointer transition-colors ${
                    selectedEvents.some(e => e.id === event.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (selectedEvents.some(e => e.id === event.id)) {
                      setSelectedEvents(prev => prev.filter(e => e.id !== event.id));
                    } else {
                      setSelectedEvents(prev => [...prev, event]);
                    }
                  }}>
                    <CardContent className="p-4">
                      {event.image_url && (
                        <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.description.substring(0, 100)}...</p>
                      <div className="text-sm text-muted-foreground mt-2">
                        <div>📅 {new Date(event.start_time).toLocaleDateString()}</div>
                        {event.location && <div>📍 {event.location}</div>}
                        <div className="font-bold text-primary">${event.price}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            }
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setContentSelectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => insertContent(contentType)}>
              Insert Selected ({contentType === 'courses' ? selectedCourses.length : selectedEvents.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Newsletter Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject Line</Label>
              <div className="p-3 bg-muted rounded">{formData.subject}</div>
            </div>
            <div>
              <Label>Email Content</Label>
              <div 
                className="border rounded p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedNewsletterForm;
