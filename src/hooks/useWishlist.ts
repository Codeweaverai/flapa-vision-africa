import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'course' | 'event';
  added_at: string;
}

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch course favorites
      const { data: courseFavorites, error: courseError } = await supabase
        .from('course_favorites')
        .select('*')
        .eq('user_id', user.id);

      if (courseError) throw courseError;

      // Fetch event favorites
      const { data: eventFavorites, error: eventError } = await supabase
        .from('event_favorites')
        .select('*')
        .eq('user_id', user.id);

      if (eventError) throw eventError;

      // Combine and transform the data
      const courseItems: WishlistItem[] = (courseFavorites || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        item_id: item.course_id,
        item_type: 'course' as const,
        added_at: item.added_at
      }));

      const eventItems: WishlistItem[] = (eventFavorites || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        item_id: item.event_id,
        item_type: 'event' as const,
        added_at: item.added_at
      }));

      setWishlistItems([...courseItems, ...eventItems]);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (itemId: string, itemType: 'course' | 'event') => {
    if (!user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }

    try {
      if (itemType === 'course') {
        const { data, error } = await supabase
          .from('course_favorites')
          .insert({ user_id: user.id, course_id: itemId })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const newItem: WishlistItem = {
            id: data[0].id,
            user_id: data[0].user_id,
            item_id: data[0].course_id,
            item_type: 'course',
            added_at: data[0].added_at
          };

          setWishlistItems(prev => [...prev, newItem]);
          toast.success('Added to wishlist');
        }
      } else if (itemType === 'event') {
        const { data, error } = await supabase
          .from('event_favorites')
          .insert({ user_id: user.id, event_id: itemId })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const newItem: WishlistItem = {
            id: data[0].id,
            user_id: data[0].user_id,
            item_id: data[0].event_id,
            item_type: 'event',
            added_at: data[0].added_at
          };

          setWishlistItems(prev => [...prev, newItem]);
          toast.success('Added to wishlist');
        }
      }
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        toast.error('Item is already in your wishlist');
      } else {
        toast.error('Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (itemId: string, itemType: 'course' | 'event') => {
    if (!user) return;

    try {
      if (itemType === 'course') {
        const { error } = await supabase
          .from('course_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', itemId);

        if (error) throw error;

        setWishlistItems(prev => prev.filter(item => !(item.item_id === itemId && item.item_type === itemType)));
        toast.success('Removed from wishlist');
      } else if (itemType === 'event') {
        const { error } = await supabase
          .from('event_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', itemId);

        if (error) throw error;

        setWishlistItems(prev => prev.filter(item => !(item.item_id === itemId && item.item_type === itemType)));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const toggleWishlist = async (itemId: string, itemType: 'course' | 'event') => {
    if (isInWishlist(itemId, itemType)) {
      await removeFromWishlist(itemId, itemType);
    } else {
      await addToWishlist(itemId, itemType);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const isInWishlist = (itemId: string, itemType: 'course' | 'event') => {
    return wishlistItems.some(item => item.item_id === itemId && item.item_type === itemType);
  };

  // Helper methods to get specific types of wishlist items
  const getCourseWishlistItems = () => {
    return wishlistItems.filter(item => item.item_type === 'course');
  };

  const getEventWishlistItems = () => {
    return wishlistItems.filter(item => item.item_type === 'event');
  };

  return {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    fetchWishlist,
    getCourseWishlistItems,
    getEventWishlistItems
  };
};
