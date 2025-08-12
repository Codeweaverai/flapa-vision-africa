
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
import NewsletterRecipients from './NewsletterRecipients';

interface Recipient {
  id: string;
  email: string;
  full_name: string;
  email_confirmed_at: string | null;
  created_at: string;
  role?: string;
  selected?: boolean;
}

const EnhancedNewsletterForm = () => {
  const { user } = useAuth();
  const [newsletter, setNewsletter] = useState({
    subject: '',
    body_html: '',
    status: 'draft'
  });
  const [recipientCount, setRecipientCount] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Dynamic content variables
  const dynamicVariables = [
    { name: '{{full_name}}', description: 'Recipient\'s full name' },
    { name: '{{course_names}}', description: 'List of available courses' },
    { name: '{{event_titles}}', description: 'List of upcoming events' },
    { name: '{{display_name}}', description: 'Recipient\'s display name' }
  ];

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

      // Create newsletter record
      const { data: newsletterData, error: newsletterError } = await supabase
        .from('newsletters')
        .insert({
          subject: newsletter.subject,
          body_html: newsletter.body_html,
          status: 'sending',
          created_by: user.id
        })
        .select()
        .single();

      if (newsletterError) throw newsletterError;

      console.log('Newsletter created:', newsletterData);

      // Send via edge function with selected recipients
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-newsletter-now', {
        body: {
          newsletterId: newsletterData.id,
          selectedRecipients: selectedRecipients.map(r => ({
            id: r.id,
            email: r.email,
            full_name: r.full_name
          }))
        }
      });

      if (sendError) throw sendError;

      console.log('Newsletter send result:', sendResult);

      toast.success(`Newsletter sent to ${selectedRecipients.length} recipients`);
      
      // Reset form
      setNewsletter({
        subject: '',
        body_html: '',
        status: 'draft'
      });
      
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
    
    return preview;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              <Mail className="h-6 w-6" />
              Create Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="compose" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-orange-100 to-purple-100">
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="recipients">Recipients ({selectedRecipients.length})</TabsTrigger>
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
                          <span>Total Recipients:</span>
                          <Badge variant="outline">{recipientCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Selected:</span>
                          <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                            {selectedRecipients.length}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recipients">
                <NewsletterRecipients 
                  onRecipientCountChange={setRecipientCount}
                  onSelectedRecipientsChange={setSelectedRecipients}
                />
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
      </div>
    </div>
  );
};

export default EnhancedNewsletterForm;
