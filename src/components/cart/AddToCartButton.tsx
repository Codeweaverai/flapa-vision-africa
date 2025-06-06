
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AddToCartButtonProps {
  itemType: 'course' | 'event_ticket';
  itemId: string;
  itemName: string;
  price: number;
  ticketType?: string;
  eventId?: string;
  eventTitle?: string;
  className?: string;
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  itemType,
  itemId,
  itemName,
  price,
  ticketType,
  eventId,
  eventTitle,
  className,
  disabled
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      await addToCart({
        item_type: itemType,
        item_id: itemId,
        title: itemName,
        quantity: 1,
        price,
        event_id: eventId,
        ticket_holder_names: []
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (price === 0) {
    return null; // Don't show add to cart for free items
  }

  return (
    <Button 
      onClick={handleAddToCart}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      Add to Cart
    </Button>
  );
};

export default AddToCartButton;
