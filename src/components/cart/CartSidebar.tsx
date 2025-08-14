
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const CartSidebar: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-500">Add some courses or events to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.itemId} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.itemName}</h4>
                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.itemId, Math.max(0, item.quantity - 1))}
                  >
                    -
                  </Button>
                  <Badge variant="secondary">{item.quantity}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromCart(item.itemId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total: ${getTotalPrice().toFixed(2)}</span>
        </div>
        <div className="space-y-2">
          <Button 
            className="w-full" 
            onClick={() => navigate('/checkout')}
          >
            Checkout
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={clearCart}
          >
            Clear Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
