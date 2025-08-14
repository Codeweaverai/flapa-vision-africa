
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'course' | 'event';
  added_at: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchWishlistItems();
    } else {
      setWishlistItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWishlistItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });
        
      if (error) throw error;
      
      setWishlistItems((data || []) as WishlistItem[]);
    } catch (err) {
      console.error('Error fetching wishlist items:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (itemId: string, itemType: 'course' | 'event') => {
    if (!user) {
      toast.error('Please log in to add items to your wishlist');
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') {
          toast.error('Item is already in your wishlist');
          return false;
        }
        throw error;
      }
      
      setWishlistItems(prev => [data as WishlistItem, ...prev]);
      toast.success('Added to wishlist');
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast.error('Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (itemId: string, itemType: 'course' | 'event') => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType);
        
      if (error) throw error;
      
      setWishlistItems(prev => prev.filter(item => 
        !(item.item_id === itemId && item.item_type === itemType)
      ));
      toast.success('Removed from wishlist');
      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  };

  const isInWishlist = (itemId: string, itemType: 'course' | 'event') => {
    return wishlistItems.some(item => 
      item.item_id === itemId && item.item_type === itemType
    );
  };

  return {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlistItems
  };
};
