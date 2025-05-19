
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export interface CourseFavorite {
  id: string;
  user_id: string;
  course_id: string;
  added_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<CourseFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_favorites')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setFavorites(data || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (courseId: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('course_favorites')
        .insert({
          user_id: user.id,
          course_id: courseId,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setFavorites(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding favorite:', err);
      throw err;
    }
  };

  const removeFavorite = async (courseId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('course_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
        
      if (error) throw error;
      
      setFavorites(prev => prev.filter(fav => fav.course_id !== courseId));
      return true;
    } catch (err) {
      console.error('Error removing favorite:', err);
      throw err;
    }
  };

  const isFavorite = (courseId: string) => {
    return favorites.some(fav => fav.course_id === courseId);
  };

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites
  };
};
