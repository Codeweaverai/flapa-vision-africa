
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

const CATEGORIES = [
  'Getting Started',
  'Account Settings', 
  'Billing & Payments',
  'Privacy & Security'
];

const AdminHelpCenter = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({
    category: 'Getting Started',
    question: '',
    answer: '',
    order_index: 1
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('help_center_faqs')
        .select('*')
        .order('category')
        .order('order_index');

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaq = async () => {
    if (!user) {
      toast.error('You must be logged in to add FAQs');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('help_center_faqs')
        .insert([{
          ...newFaq,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setFaqs([...faqs, data]);
      setNewFaq({
        category: 'Getting Started',
        question: '',
        answer: '',
        order_index: 1
      });
      setShowAddForm(false);
      toast.success('FAQ added successfully');
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast.error('Failed to add FAQ');
    }
  };

  const handleUpdateFaq = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .update({
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          order_index: faq.order_index,
          is_published: faq.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('id', faq.id);

      if (error) throw error;

      setFaqs(faqs.map(f => f.id === faq.id ? faq : f));
      setEditingFaq(null);
      toast.success('FAQ updated successfully');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFaqs(faqs.filter(f => f.id !== id));
      toast.success('FAQ deleted successfully');
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const togglePublishStatus = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('help_center_faqs')
        .update({ is_published: !faq.is_published })
        .eq('id', faq.id);

      if (error) throw error;

      setFaqs(faqs.map(f => 
        f.id === faq.id ? { ...f, is_published: !f.is_published } : f
      ));
      toast.success(`FAQ ${!faq.is_published ? 'published' : 'unpublished'}`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const groupedFaqs = CATEGORIES.reduce((acc, category) => {
    acc[category] = faqs.filter(faq => faq.category === category);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (loading) {
    return (
      <AdminLayout title="Help Center Management">
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Help Center Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage FAQ content for the help center
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({...newFaq, category: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <Input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                  placeholder="Enter FAQ question"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <Textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                  placeholder="Enter FAQ answer"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Index</label>
                <Input
                  type="number"
                  value={newFaq.order_index}
                  onChange={(e) => setNewFaq({...newFaq, order_index: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddFaq}>
                  <Save className="h-4 w-4 mr-2" />
                  Save FAQ
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {CATEGORIES.map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category}
                <Badge variant="outline">
                  {groupedFaqs[category]?.length || 0} FAQs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupedFaqs[category]?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No FAQs in this category yet
                  </p>
                ) : (
                  groupedFaqs[category]?.map(faq => (
                    <div key={faq.id} className="border rounded-lg p-4">
                      {editingFaq?.id === faq.id ? (
                        <div className="space-y-4">
                          <Input
                            value={editingFaq.question}
                            onChange={(e) => setEditingFaq({
                              ...editingFaq,
                              question: e.target.value
                            })}
                            placeholder="Question"
                          />
                          <Textarea
                            value={editingFaq.answer}
                            onChange={(e) => setEditingFaq({
                              ...editingFaq,
                              answer: e.target.value
                            })}
                            placeholder="Answer"
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingFaq.order_index}
                              onChange={(e) => setEditingFaq({
                                ...editingFaq,
                                order_index: parseInt(e.target.value)
                              })}
                              className="w-20"
                              min="1"
                            />
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingFaq.is_published}
                                onChange={(e) => setEditingFaq({
                                  ...editingFaq,
                                  is_published: e.target.checked
                                })}
                              />
                              Published
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateFaq(editingFaq)}>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingFaq(null)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{faq.question}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant={faq.is_published ? "default" : "secondary"}>
                                {faq.is_published ? "Published" : "Draft"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFaq(faq)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePublishStatus(faq)}
                              >
                                {faq.is_published ? "Unpublish" : "Publish"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFaq(faq.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Order: {faq.order_index}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminHelpCenter;
