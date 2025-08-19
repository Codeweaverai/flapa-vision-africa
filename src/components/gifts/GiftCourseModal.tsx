
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Gift } from 'lucide-react';

interface GiftCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    price: number;
  };
}

const GiftCourseModal: React.FC<GiftCourseModalProps> = ({ isOpen, onClose, course }) => {
  const { addToCart } = useCart();
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGiftCourse = async () => {
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
      // Add gift course to cart with special metadata
      addToCart({
        itemId: course.id,
        itemType: 'gift_course',
        itemName: `Gift: ${course.title}`,
        price: course.price,
        quantity: 1,
        giftMetadata: {
          senderName,
          recipientName,
          recipientEmail,
          personalMessage
        }
      });

      toast.success('Gift course added to cart!');
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
            <Gift className="h-5 w-5 text-purple-600" />
            Gift This Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <h4 className="font-semibold text-sm">{course.title}</h4>
            <p className="text-sm text-gray-600">${course.price.toFixed(2)}</p>
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
              onClick={handleGiftCourse}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftCourseModal;
