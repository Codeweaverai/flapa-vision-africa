
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  item_type: 'course' | 'event_ticket';
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  course?: {
    id: string;
    title: string;
    thumbnail_url?: string;
  };
  event_ticket?: {
    id: string;
    name: string;
    ticket_type: string;
    event_id: string;
    event_title?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  // Load cart items on mount and when user changes
  useEffect(() => {
    loadCartItems();
  }, [user]);

  const loadCartItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('carts')
        .select('*');

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      const { data: cartData, error } = await query;

      if (error) throw error;

      // Now fetch the related course and event data separately
      const cartItems: CartItem[] = [];
      
      for (const item of cartData || []) {
        let itemName = 'Unknown Item';
        let courseData = undefined;
        let eventData = undefined;

        // Ensure item_type is properly typed
        const itemType = item.item_type as 'course' | 'event_ticket';

        if (itemType === 'course') {
          const { data: course } = await supabase
            .from('courses')
            .select('id, title, thumbnail_url')
            .eq('id', item.item_id)
            .single();
          
          if (course) {
            itemName = course.title;
            courseData = course;
          }
        } else if (itemType === 'event_ticket') {
          const { data: event } = await supabase
            .from('events')
            .select('id, title')
            .eq('id', item.item_id)
            .single();
          
          if (event) {
            itemName = `${event.title} - Ticket`;
            eventData = {
              id: item.item_id,
              name: itemName,
              ticket_type: 'ordinary',
              event_id: item.item_id,
              event_title: event.title,
            };
          }
        }

        cartItems.push({
          id: item.id,
          item_type: itemType,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
          item_name: itemName,
          course: courseData,
          event_ticket: eventData,
        });
      }

      setItems(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (newItem: Omit<CartItem, 'id'>) => {
    try {
      const existingItem = items.find(
        item => item.item_type === newItem.item_type && item.item_id === newItem.item_id
      );

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + newItem.quantity);
        return;
      }

      const insertData: any = {
        item_type: newItem.item_type,
        item_id: newItem.item_id,
        quantity: newItem.quantity,
        price: newItem.price,
      };

      if (user) {
        insertData.user_id = user.id;
      } else {
        insertData.session_id = getSessionId();
      }

      const { error } = await supabase
        .from('carts')
        .insert(insertData);

      if (error) throw error;

      await loadCartItems();
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('carts')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    try {
      let query = supabase.from('carts').delete();

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', getSessionId());
      }

      const { error } = await query;
      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loading,
    }}>
      {children}
    </CartContext.Provider>
  );
};
