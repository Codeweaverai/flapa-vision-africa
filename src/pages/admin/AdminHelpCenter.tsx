
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, Save, X, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['Getting Started', 'Account Settings', 'Billing & Payments', 'Privacy & Security'];

const AdminHelpCenter = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    order_index: 0,
    is_published: true
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('help_center_faqs')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !formData.category || !formData.question || !formData.answer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .insert([{
          ...formData,
          created_by: user.id
        }]);

      if (error) throw error;

      toast.success('FAQ created successfully');
      setIsCreating(false);
      resetForm();
      fetchFAQs();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.category || !formData.question || !formData.answer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .update({
          category: formData.category,
          question: formData.question,
          answer: formData.answer,
          order_index: formData.order_index,
          is_published: formData.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('FAQ updated successfully');
      setEditingFaq(null);
      resetForm();
      fetchFAQs();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('FAQ deleted successfully');
      fetchFAQs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      order_index: faq.order_index,
      is_published: faq.is_published
    });
  };

  const resetForm = () => {
    setFormData({
      category: '',
      question: '',
      answer: '',
      order_index: 0,
      is_published: true
    });
  };

  const cancelEdit = () => {
    setEditingFaq(null);
    setIsCreating(false);
    resetForm();
  };

  const filteredFAQs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  const faqsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = faqs.filter(faq => faq.category === category);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <AdminLayout title="Help Center Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Help Center Management">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category} ({faqsByCategory[category]?.length || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingFaq}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingFaq) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New FAQ' : 'Edit FAQ'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter the FAQ question"
                />
              </div>

              <div>
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter the FAQ answer"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <div>
                  <Label htmlFor="order_index">Order</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={isCreating ? handleCreate : () => editingFaq && handleUpdate(editingFaq.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Create' : 'Update'}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQs by Category */}
        <div className="space-y-6">
          {CATEGORIES.map(category => {
            const categoryFaqs = faqsByCategory[category] || [];
            
            if (selectedCategory && selectedCategory !== category) return null;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    {category}
                    <Badge variant="secondary">{categoryFaqs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryFaqs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No FAQs in this category yet.
                    </p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {categoryFaqs.map((faq, index) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="flex-1">{faq.question}</span>
                              <div className="flex items-center gap-2">
                                {!faq.is_published && <Badge variant="secondary">Draft</Badge>}
                                <Badge variant="outline">#{faq.order_index}</Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">{faq.answer}</p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => startEdit(faq)}
                                  disabled={editingFaq !== null || isCreating}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDelete(faq.id)}
                                  disabled={editingFaq !== null || isCreating}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHelpCenter;
