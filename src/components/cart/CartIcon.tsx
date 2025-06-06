
import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const CartIcon = () => {
  const { items, totalItems, totalAmount, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500"
            >
              {totalItems > 9 ? '9+' : totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? 'Your cart is empty' : `${totalItems} item(s) in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add some courses or event tickets to get started!</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.item_name}</h4>
                          <p className="text-xs text-gray-500">
                            {item.item_type === 'course' ? 'Course' : `Event Ticket - ${item.event_ticket?.ticket_type}`}
                          </p>
                          <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.item_type === 'event_ticket' && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">${totalAmount.toFixed(2)}</span>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartIcon;
