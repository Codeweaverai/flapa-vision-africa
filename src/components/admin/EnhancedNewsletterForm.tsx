import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Eye, Save, Users, Calendar, BookOpen, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedNewsletterFormProps {
  selectedRecipients: string[];
  selectedContent: any[];
  onNewsletterSent: () => void;
}

const EnhancedNewsletterForm = ({ selectedRecipients, selectedContent, onNewsletterSent }: EnhancedNewsletterFormProps) => {
  const { user } = useAuth();
  const [newsletter, setNewsletter] = useState({
    subject: '',
    body_html: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);

  // Dynamic content variables
  const dynamicVariables = [
    { name: '{{full_name}}', description: 'Recipient\'s full name' },
    { name: '{{course_names}}', description: 'List of available courses' },
    { name: '{{event_titles}}', description: 'List of upcoming events' },
    { name: '{{display_name}}', description: 'Recipient\'s display name' }
  ];

  const generateCourseHTML = (course: any) => {
    const siteUrl = window.location.origin;
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: Arial, sans-serif; border: 1px solid #e5e7eb; height: 100%;">
        ${course.thumbnail_url ? `
          <div style="height: 200px; background: linear-gradient(135deg, #f97316, #a855f7); position: relative; overflow: hidden;">
            <img src="${course.thumbnail_url}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #f97316;">
              $${course.price || '0'}
            </div>
          </div>
        ` : `
          <div style="height: 200px; background: linear-gradient(135deg, #f97316, #a855f7); display: flex; align-items: center; justify-content: center;">
            <div style="color: white; font-size: 48px;">📚</div>
          </div>
        `}
        <div style="padding: 24px; height: calc(100% - 200px); display: flex; flex-direction: column;">
          <div style="margin-bottom: 16px; flex-grow: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1f2937; line-height: 1.3;">${course.title}</h3>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${(course.description || '').substring(0, 120)}${course.description && course.description.length > 120 ? '...' : ''}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
              <span style="background: #fef7ed; color: #ea580c; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${course.category || 'Course'}</span>
              <span style="background: #f0f9ff; color: #0284c7; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${course.difficulty_level || 'Beginner'}</span>
            </div>
          </div>
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #6b7280;">
              <span>⏱️ ${course.duration_minutes ? `${Math.floor(course.duration_minutes / 60)}h ${course.duration_minutes % 60}m` : 'Self-paced'}</span>
              <span>👤 by ${course.creator?.full_name || 'Instructor'}</span>
            </div>
          </div>
          <div style="text-align: center;">
            <a href="${siteUrl}/course-detail/${course.id}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
              View Course Details →
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const generateEventHTML = (event: any) => {
    const siteUrl = window.location.origin;
    const eventDate = event.start_time ? new Date(event.start_time) : null;
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: Arial, sans-serif; border: 1px solid #e5e7eb; height: 100%;">
        ${event.image_url ? `
          <div style="height: 200px; background: linear-gradient(135deg, #f97316, #a855f7); position: relative; overflow: hidden;">
            <img src="${event.image_url}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #f97316;">
              $${event.price || '0'}
            </div>
          </div>
        ` : `
          <div style="height: 200px; background: linear-gradient(135deg, #f97316, #a855f7); display: flex; align-items: center; justify-content: center;">
            <div style="color: white; font-size: 48px;">🎉</div>
          </div>
        `}
        <div style="padding: 24px; height: calc(100% - 200px); display: flex; flex-direction: column;">
          <div style="margin-bottom: 16px; flex-grow: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1f2937; line-height: 1.3;">${event.title}</h3>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${(event.description || '').substring(0, 120)}${event.description && event.description.length > 120 ? '...' : ''}</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
              <span style="background: #fef7ed; color: #ea580c; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${event.event_type || 'Event'}</span>
              ${eventDate ? `<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">📅 ${eventDate.toLocaleDateString()}</span>` : ''}
            </div>
          </div>
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #6b7280;">
              <span>📍 ${event.location || 'TBD'}</span>
              <span>👤 by ${event.creator?.full_name || 'Organizer'}</span>
            </div>
            ${eventDate ? `
              <div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
                🕒 ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            ` : ''}
          </div>
          <div style="text-align: center;">
            <a href="${siteUrl}/events/${event.id}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
              View Event Details →
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const generateCreatorHTML = (creator: any) => {
    const siteUrl = window.location.origin;
    return `
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: Arial, sans-serif; border: 1px solid #e5e7eb; height: 100%;">
        <div style="height: 120px; background: linear-gradient(135deg, #f97316, #a855f7); position: relative; display: flex; align-items: center; justify-content: center;">
          ${creator.avatar_url ? `
            <img src="${creator.avatar_url}" alt="${creator.full_name}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
          ` : `
            <div style="width: 80px; height: 80px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 32px; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              👤
            </div>
          `}
        </div>
        <div style="padding: 24px; height: calc(100% - 120px); display: flex; flex-direction: column;">
          <div style="margin-bottom: 16px; flex-grow: 1;">
            <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #1f2937; text-align: center;">${creator.full_name || creator.username || 'Creator'}</h3>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">${(creator.bio || 'Talented creator on our platform').substring(0, 120)}${creator.bio && creator.bio.length > 120 ? '...' : ''}</p>
          </div>
          <div style="margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 12px;">
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <div style="font-size: 18px; font-weight: bold; color: #f97316;">${creator.total_courses || 0}</div>
                <div style="font-size: 12px; color: #6b7280;">Courses</div>
              </div>
              <div>
                <div style="font-size: 18px; font-weight: bold; color: #a855f7;">${creator.total_events || 0}</div>
                <div style="font-size: 12px; color: #6b7280;">Events</div>
              </div>
              <div>
                <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${creator.total_students || 0}</div>
                <div style="font-size: 12px; color: #6b7280;">Students</div>
              </div>
            </div>
          </div>
          <div style="text-align: center;">
            <a href="${siteUrl}/creator/profile/${creator.id}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
              View Profile →
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          subject: newsletter.subject,
          body_html: newsletter.body_html,
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Newsletter saved as draft');
      console.log('Newsletter saved:', data);
      onNewsletterSent();
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      if (!newsletter.subject.trim()) {
        toast.error('Please enter a subject');
        return;
      }

      if (!newsletter.body_html.trim()) {
        toast.error('Please enter newsletter content');
        return;
      }

      if (selectedRecipients.length === 0) {
        toast.error('Please select recipients');
        return;
      }

      setLoading(true);

      // Generate content with selected dynamic content
      let enhancedContent = newsletter.body_html;

      // Add selected content to the newsletter with enhanced designs
      if (selectedContent.length > 0) {
        enhancedContent += '\n\n<div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #fef7ed, #faf5ff); border-radius: 16px;">';
        enhancedContent += '<h2 style="color: #1f2937; margin-bottom: 30px; text-align: center; font-size: 28px; font-weight: bold;">✨ Featured Content Just For You</h2>';
        
        // Grid container for content items
        enhancedContent += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin: 0 auto; max-width: 1200px;">';
        
        selectedContent.forEach((item) => {
          if (item.type === 'course') {
            enhancedContent += generateCourseHTML(item);
          } else if (item.type === 'event') {
            enhancedContent += generateEventHTML(item);
          } else if (item.type === 'creator') {
            enhancedContent += generateCreatorHTML(item);
          }
        });
        
        enhancedContent += '</div></div>'; // Close grid container and parent div
      }

      // Create newsletter record
      const { data: newsletterData, error: newsletterError } = await supabase
        .from('newsletters')
        .insert({
          subject: newsletter.subject,
          body_html: enhancedContent,
          status: 'sending',
          created_by: user.id
        })
        .select()
        .single();

      if (newsletterError) throw newsletterError;

      console.log('Newsletter created:', newsletterData);

      // Send via edge function
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-newsletter-now', {
        body: {
          newsletterId: newsletterData.id
        }
      });

      if (sendError) throw sendError;

      console.log('Newsletter send result:', sendResult);

      toast.success(`Newsletter sent to ${sendResult.total_recipients} recipients`);
      
      // Reset form
      setNewsletter({
        subject: '',
        body_html: '',
        status: 'draft'
      });

      onNewsletterSent();
      
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    } finally {
      setLoading(false);
    }
  };

  const insertDynamicVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="body_html"]') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPosition = textarea.selectionStart;
      const textBefore = newsletter.body_html.substring(0, cursorPosition);
      const textAfter = newsletter.body_html.substring(cursorPosition);
      
      setNewsletter(prev => ({
        ...prev,
        body_html: textBefore + variable + textAfter
      }));
    }
  };

  const generatePreview = () => {
    let preview = newsletter.body_html;
    
    // Replace dynamic variables with sample data
    preview = preview.replace(/\{\{full_name\}\}/g, 'John Doe');
    preview = preview.replace(/\{\{display_name\}\}/g, 'John');
    preview = preview.replace(/\{\{course_names\}\}/g, 'React Development, Python Basics, Digital Marketing');
    preview = preview.replace(/\{\{event_titles\}\}/g, 'Tech Conference 2024, Web Dev Workshop, AI Summit');
    
    // Add selected content to preview with enhanced designs
    if (selectedContent.length > 0) {
      preview += '\n\n<div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #fef7ed, #faf5ff); border-radius: 16px;">';
      preview += '<h2 style="color: #1f2937; margin-bottom: 30px; text-align: center; font-size: 28px; font-weight: bold;">✨ Featured Content Just For You</h2>';
      
      // Grid container for content items
      preview += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin: 0 auto; max-width: 1200px;">';
      
      selectedContent.forEach((item) => {
        if (item.type === 'course') {
          preview += generateCourseHTML(item);
        } else if (item.type === 'event') {
          preview += generateEventHTML(item);
        } else if (item.type === 'creator') {
          preview += generateCreatorHTML(item);
        }
      });
      
      preview += '</div></div>'; // Close grid container and parent div
    }
    
    return preview;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
          <Mail className="h-6 w-6" />
          Create Newsletter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-orange-100 to-purple-100">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Newsletter Form */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    value={newsletter.subject}
                    onChange={(e) => setNewsletter(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter newsletter subject..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    name="body_html"
                    value={newsletter.body_html}
                    onChange={(e) => setNewsletter(prev => ({ ...prev, body_html: e.target.value }))}
                    placeholder="Write your newsletter content here..."
                    className="min-h-[400px] w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveDraft}
                    variant="outline"
                    disabled={loading}
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  
                  <Button
                    onClick={handleSendNewsletter}
                    disabled={loading || selectedRecipients.length === 0}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Newsletter
                  </Button>
                </div>
              </div>

              {/* Dynamic Variables Panel */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-orange-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Dynamic Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dynamicVariables.map((variable) => (
                      <div key={variable.name} className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => insertDynamicVariable(variable.name)}
                          className="w-full justify-start text-xs hover:bg-white"
                        >
                          {variable.name}
                        </Button>
                        <p className="text-xs text-gray-500">{variable.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Newsletter Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Selected Recipients:</span>
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        {selectedRecipients.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Selected Content:</span>
                      <Badge variant="outline">{selectedContent.length}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Newsletter Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="mb-4 pb-4 border-b">
                    <h2 className="text-xl font-bold">{newsletter.subject || 'Newsletter Subject'}</h2>
                  </div>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: generatePreview() || '<p>Newsletter content will appear here...</p>' 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedNewsletterForm;
