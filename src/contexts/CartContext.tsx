
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface TicketHolder {
  name: string;
  email?: string;
}

interface CartItem {
  id: string;
  item_id: string;
  item_type: 'course' | 'event_ticket';
  price: number;
  quantity: number;
  title: string;
  thumbnail_url?: string;
  event_id?: string;
  ticket_holder_names?: TicketHolder[];
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateTicketHolders: (itemId: string, holders: TicketHolder[]) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getItemCount: () => number;
  getConvertedTotalPrice: () => Promise<number>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper function to safely convert Json to TicketHolder[]
const convertToTicketHolders = (jsonData: any): TicketHolder[] => {
  if (!jsonData) return [];
  
  try {
    if (Array.isArray(jsonData)) {
      return jsonData.filter((item): item is TicketHolder => 
        typeof item === 'object' && 
        item !== null && 
        typeof item.name === 'string'
      );
    }
    return [];
  } catch (error) {
    console.error('Error converting ticket holders:', error);
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems: CartItem[] = await Promise.all(
        data.map(async (item) => {
          let title = '';
          let thumbnail_url = '';
          let event_id = '';

          if (item.item_type === 'course') {
            try {
              const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('title, thumbnail_url')
                .eq('id', item.item_id)
                .maybeSingle();
              
              if (courseError) {
                console.error('Error fetching course:', courseError);
              } else if (course) {
                title = course.title || 'Unknown Course';
                thumbnail_url = course.thumbnail_url || '';
              }
            } catch (err) {
              console.error('Error in course query:', err);
              title = 'Unknown Course';
            }
          } else if (item.item_type === 'event_ticket') {
            try {
              // First get the ticket details
              const { data: ticket, error: ticketError } = await supabase
                .from('event_tickets')
                .select('name, event_id')
                .eq('id', item.item_id)
                .maybeSingle();
              
              if (ticketError) {
                console.error('Error fetching ticket:', ticketError);
                title = 'Unknown Ticket';
              } else if (ticket) {
                title = ticket.name || 'Unknown Ticket';
                event_id = ticket.event_id || '';
                
                // Then get the event details if we have an event_id
                if (ticket.event_id) {
                  try {
                    const { data: event, error: eventError } = await supabase
                      .from('events')
                      .select('title, image_url')
                      .eq('id', ticket.event_id)
                      .maybeSingle();
                    
                    if (eventError) {
                      console.error('Error fetching event:', eventError);
                    } else if (event) {
                      thumbnail_url = event.image_url || '';
                    }
                  } catch (err) {
                    console.error('Error in event query:', err);
                  }
                }
              } else {
                title = 'Unknown Ticket';
              }
            } catch (err) {
              console.error('Error in ticket query:', err);
              title = 'Unknown Ticket';
            }
          }

          return {
            id: item.id,
            item_id: item.item_id,
            item_type: item.item_type as 'course' | 'event_ticket',
            price: parseFloat(item.price.toString()),
            quantity: item.quantity,
            title,
            thumbnail_url,
            event_id,
            ticket_holder_names: convertToTicketHolders(item.ticket_holder_names)
          };
        })
      );

      setItems(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      // Check if item already exists in cart
      const existingItem = items.find(
        (cartItem) => cartItem.item_id === item.item_id && cartItem.item_type === item.item_type
      );

      if (existingItem) {
        // Update quantity instead of creating duplicate
        await updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
        toast.success('Item quantity updated in cart');
        return;
      }

      // For event tickets, initialize with empty ticket holder names based on quantity
      const initialTicketHolders = item.item_type === 'event_ticket' 
        ? Array.from({ length: item.quantity }, () => ({ name: '', email: '' }))
        : [];

      const { data, error } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          item_id: item.item_id,
          item_type: item.item_type,
          price: item.price,
          quantity: item.quantity,
          ticket_holder_names: initialTicketHolders as any
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Handle duplicate key error by updating existing item
          const { data: existing } = await supabase
            .from('carts')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_id', item.item_id)
            .eq('item_type', item.item_type)
            .single();

          if (existing) {
            await updateQuantity(existing.id, existing.quantity + item.quantity);
            toast.success('Item quantity updated in cart');
            return;
          }
        }
        throw error;
      }

      const newCartItem: CartItem = {
        id: data.id,
        item_id: item.item_id,
        item_type: item.item_type,
        price: item.price,
        quantity: item.quantity,
        title: item.title,
        thumbnail_url: item.thumbnail_url,
        event_id: item.event_id,
        ticket_holder_names: initialTicketHolders
      };

      setItems([...items, newCartItem]);
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
      toast.error('Failed to remove item');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      // For event tickets, adjust ticket holder names array to match quantity
      let updatedTicketHolders = item.ticket_holder_names || [];
      if (item.item_type === 'event_ticket') {
        if (quantity > updatedTicketHolders.length) {
          // Add new empty holders
          const newHolders = Array.from({ length: quantity - updatedTicketHolders.length }, () => ({ name: '', email: '' }));
          updatedTicketHolders = [...updatedTicketHolders, ...newHolders];
        } else if (quantity < updatedTicketHolders.length) {
          // Remove excess holders
          updatedTicketHolders = updatedTicketHolders.slice(0, quantity);
        }
      }

      const { error } = await supabase
        .from('carts')
        .update({ 
          quantity,
          ticket_holder_names: updatedTicketHolders as any
        })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity, ticket_holder_names: updatedTicketHolders } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const updateTicketHolders = async (itemId: string, holders: TicketHolder[]) => {
    try {
      console.log('Updating ticket holders for item:', itemId, 'with holders:', holders);
      
      const { error } = await supabase
        .from('carts')
        .update({ ticket_holder_names: holders as any })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prevItems => prevItems.map(item => 
        item.id === itemId ? { ...item, ticket_holder_names: holders } : item
      ));
      
      console.log('Successfully updated ticket holders in database');
    } catch (error) {
      console.error('Error updating ticket holders:', error);
      toast.error('Failed to update ticket holders');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getConvertedTotalPrice = async () => {
    try {
      const totalUSD = getTotalPrice();
      return await convertPrice(totalUSD, 'USD');
    } catch (error) {
      console.error('Error converting total price:', error);
      return getTotalPrice();
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateTicketHolders,
      clearCart,
      getTotalPrice,
      getItemCount,
      getConvertedTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
