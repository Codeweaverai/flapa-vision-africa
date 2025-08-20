import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Gift, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay'; // Add this import

interface GiftEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    start_time: string;
    location: string;
  };
  ticket: {
    id: string;
    name: string;
    price: number;
  };
}

const GiftEventModal: React.FC<GiftEventModalProps> = ({ isOpen, onClose, event, ticket }) => {
  const { addToCart } = useCart();
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGiftEvent = async () => {
    if (!senderName || !recipientName || !recipientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Add gift event to cart with special metadata
      addToCart({
        itemId: ticket.id,
        itemType: 'gift_event',
        itemName: `Gift: ${event.title} - ${ticket.name}`,
        price: ticket.price,
        quantity: 1,
        giftMetadata: {
          senderName,
          recipientName,
          recipientEmail,
          personalMessage,
          eventTitle: event.title,
          eventDate: event.start_time,
          eventLocation: event.location
        }
      });

      toast.success('Gift event ticket added to cart!');
      onClose();
      
      // Reset form
      setSenderName('');
      setRecipientName('');
      setRecipientEmail('');
      setPersonalMessage('');
    } catch (error) {
      console.error('Error adding gift to cart:', error);
      toast.error('Failed to add gift to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-orange-600" />
            Gift This Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
            <h4 className="font-semibold text-sm">{event.title}</h4>
            <div className="text-xs text-gray-600 mt-1 space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(event.start_time), 'PPP p')}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{event.location}</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-medium">{ticket.name}</span>
              <span className="text-sm text-gray-600 ml-2">
                <PriceDisplay amount={ticket.price} originalCurrency="USD" />
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="senderName">Your Name *</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <Label htmlFor="recipientName">Recipient's Name *</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's name"
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail">Recipient's Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient's email"
              />
            </div>

            <div>
              <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
              <Textarea
                id="personalMessage"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleGiftEvent}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-700 hover:to-purple-700"
            >
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftEventModal;
