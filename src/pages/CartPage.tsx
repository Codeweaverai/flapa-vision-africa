
import React from 'react';
import { useCart } from '@/contexts/CartContext';

const CartPage: React.FC = () => {
  const { items, removeFromCart, clearCart } = useCart();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          {items.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <div>
              <p className="text-gray-600">Cart items: {items.length}</p>
              <p className="mt-4">Cart functionality is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
