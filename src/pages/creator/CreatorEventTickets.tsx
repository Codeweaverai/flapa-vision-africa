
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';

interface EventTicket {
  id: string;
  event_id: string;
  ticket_type: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  early_bird_end_date?: string;
  is_active: boolean;
}

const CreatorEventTickets = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [formData, setFormData] = useState({
    ticket_type: 'standard',
    name: '',
    description: '',
    price: 0,
    quantity_available: 100,
    early_bird_end_date: '',
    is_active: true
  });

  useEffect(() => {
    if (eventId) {
      loadTickets();
    }
  }, [eventId]);

  const loadTickets = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicket = () => {
    setEditingTicket(null);
    setFormData({
      ticket_type: 'standard',
      name: '',
      description: '',
      price: 0,
      quantity_available: 100,
      early_bird_end_date: '',
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleEditTicket = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    setFormData({
      ticket_type: ticket.ticket_type,
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price,
      quantity_available: ticket.quantity_available,
      early_bird_end_date: ticket.early_bird_end_date || '',
      is_active: ticket.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      if (editingTicket) {
        const { error } = await supabase
          .from('event_tickets')
          .update(formData)
          .eq('id', editingTicket.id);

        if (error) throw error;
        toast.success('Ticket updated successfully');
      } else {
        const { error } = await supabase
          .from('event_tickets')
          .insert({
            ...formData,
            event_id: eventId,
            quantity_sold: 0
          });

        if (error) throw error;
        toast.success('Ticket created successfully');
      }

      await loadTickets();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Failed to save ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      const { error } = await supabase
        .from('event_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      
      await loadTickets();
      toast.success('Ticket deleted successfully');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  if (loading) {
    return (
      <CreatorLayout title="Event Tickets">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout title="Event Tickets">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/creator/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Event Tickets</h2>
        <Button onClick={handleAddTicket}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2">No tickets yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Create ticket types for your event
            </p>
            <Button onClick={handleAddTicket}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{ticket.ticket_type}</p>
                    <p className="text-lg font-bold text-primary">${ticket.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTicket(ticket)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTicket(ticket.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ticket.description && (
                  <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                )}
                <p className="text-sm">Available: {ticket.quantity_available - ticket.quantity_sold}</p>
                <p className="text-sm">Sold: {ticket.quantity_sold}</p>
                {ticket.early_bird_end_date && (
                  <p className="text-sm text-orange-600">
                    Early bird until: {new Date(ticket.early_bird_end_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTicket ? 'Edit Ticket' : 'Add Ticket'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ticket Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Early Bird, VIP, Standard"
                />
              </div>
              <div>
                <Label htmlFor="ticket_type">Ticket Type</Label>
                <select
                  id="ticket_type"
                  name="ticket_type"
                  value={formData.ticket_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="early_bird">Early Bird</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What's included with this ticket?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity_available">Quantity Available *</Label>
                <Input
                  id="quantity_available"
                  name="quantity_available"
                  type="number"
                  min="1"
                  value={formData.quantity_available}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="early_bird_end_date">Early Bird End Date (Optional)</Label>
              <Input
                id="early_bird_end_date"
                name="early_bird_end_date"
                type="datetime-local"
                value={formData.early_bird_end_date}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (available for purchase)</Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTicket ? 'Update' : 'Create'} Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CreatorLayout>
  );
};

export default CreatorEventTickets;
