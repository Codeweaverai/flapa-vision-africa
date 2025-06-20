
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Copy, Calendar, Percent } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  creator_id: string;
  item_type: 'course' | 'event';
  item_id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
}

interface Event {
  id: string;
  title: string;
  price: number;
}

const PromoCodeManager = () => {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    item_type: 'course' as 'course' | 'event',
    item_id: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    max_uses: null as number | null,
    min_order_amount: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null as string | null,
    is_active: true
  });

  useEffect(() => {
    if (user) {
      fetchPromoCodes();
      fetchCreatorContent();
    }
  }, [user]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorContent = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('creator_id', user?.id)
        .eq('is_published', true);

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, price')
        .eq('creator_id', user?.id);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching creator content:', error);
    }
  };

  const generatePromoCode = async () => {
    try {
      // Generate a random promo code
      const randomCode = 'PROMO' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setFormData(prev => ({ ...prev, code: randomCode }));
    } catch (error) {
      console.error('Error generating promo code:', error);
      const randomCode = 'PROMO' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setFormData(prev => ({ ...prev, code: randomCode }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const promoCodeData = {
        ...formData,
        creator_id: user.id,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        current_uses: 0
      };

      if (editingPromoCode) {
        // Update existing promo code
        const { error } = await supabase
          .from('promo_codes')
          .update(promoCodeData)
          .eq('id', editingPromoCode.id);

        if (error) throw error;
        toast.success('Promo code updated successfully');
      } else {
        // Create new promo code
        const { error } = await supabase
          .from('promo_codes')
          .insert([promoCodeData]);

        if (error) throw error;
        toast.success('Promo code created successfully');
      }

      // Reset form and close dialog
      setFormData({
        code: '',
        item_type: 'course',
        item_id: '',
        discount_type: 'percentage',
        discount_value: 0,
        max_uses: null,
        min_order_amount: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: null,
        is_active: true
      });
      setIsCreateDialogOpen(false);
      setEditingPromoCode(null);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast.error('Failed to save promo code');
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      item_type: promoCode.item_type,
      item_id: promoCode.item_id,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      max_uses: promoCode.max_uses,
      min_order_amount: promoCode.min_order_amount,
      valid_from: promoCode.valid_from.split('T')[0],
      valid_until: promoCode.valid_until ? promoCode.valid_until.split('T')[0] : null,
      is_active: promoCode.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promo code deleted successfully');
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Promo code ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPromoCodes();
    } catch (error) {
      console.error('Error updating promo code status:', error);
      toast.error('Failed to update promo code status');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard');
  };

  const getItemTitle = (itemType: string, itemId: string) => {
    if (itemType === 'course') {
      const course = courses.find(c => c.id === itemId);
      return course?.title || 'Unknown Course';
    } else {
      const event = events.find(e => e.id === itemId);
      return event?.title || 'Unknown Event';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Promo Codes</h2>
          <p className="text-gray-600">Create and manage discount codes for your courses and events</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPromoCode(null);
              setFormData({
                code: '',
                item_type: 'course',
                item_id: '',
                discount_type: 'percentage',
                discount_value: 0,
                max_uses: null,
                min_order_amount: 0,
                valid_from: new Date().toISOString().split('T')[0],
                valid_until: null,
                is_active: true
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPromoCode ? 'Edit Promo Code' : 'Create New Promo Code'}
              </DialogTitle>
              <DialogDescription>
                Set up a discount code for your courses or events
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Enter promo code"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generatePromoCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="item_type">Apply To</Label>
                  <Select value={formData.item_type} onValueChange={(value: 'course' | 'event') => {
                    setFormData(prev => ({ ...prev, item_type: value, item_id: '' }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="item_id">
                  {formData.item_type === 'course' ? 'Course' : 'Event'}
                </Label>
                <Select value={formData.item_id} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, item_id: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${formData.item_type}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.item_type === 'course' ? (
                      courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title} - ${course.price}
                        </SelectItem>
                      ))
                    ) : (
                      events.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - ${event.price}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed') => {
                    setFormData(prev => ({ ...prev, discount_type: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max Uses (optional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value ? Number(e.target.value) : null }))}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="min_order_amount">Min Order Amount ($)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until (optional)</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value || null }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPromoCode ? 'Update' : 'Create'} Promo Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Promo Codes</CardTitle>
          <CardDescription>
            Manage your discount codes and track their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No promo codes created yet</p>
              <p className="text-sm text-gray-400">Create your first promo code to start offering discounts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promoCode) => (
                    <TableRow key={promoCode.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {promoCode.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(promoCode.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getItemTitle(promoCode.item_type, promoCode.item_id)}</p>
                          <Badge variant="outline" className="text-xs">
                            {promoCode.item_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {promoCode.discount_type === 'percentage' ? (
                            <Percent className="h-3 w-3" />
                          ) : (
                            <span className="text-xs">$</span>
                          )}
                          {promoCode.discount_value}
                          {promoCode.discount_type === 'percentage' ? '%' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {promoCode.current_uses}/{promoCode.max_uses || '∞'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(promoCode.valid_from), 'MMM dd')}
                          </div>
                          {promoCode.valid_until && (
                            <div className="text-gray-500">
                              to {format(new Date(promoCode.valid_until), 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promoCode.is_active ? 'default' : 'secondary'}>
                          {promoCode.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(promoCode)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(promoCode.id, promoCode.is_active)}
                          >
                            {promoCode.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(promoCode.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodeManager;
