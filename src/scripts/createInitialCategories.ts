
import { supabase } from '@/lib/supabaseClient';

// This function can be called from the browser console to create initial categories
export const createInitialCategories = async () => {
  console.log('Creating initial media categories...');
  
  const categories = [
    { name: 'Technology', description: 'Latest tech news and updates' },
    { name: 'Business', description: 'Business strategies and market trends' },
    { name: 'Education', description: 'Educational content and learning resources' },
    { name: 'Health & Wellness', description: 'Health tips and wellness information' },
    { name: 'Entertainment', description: 'Entertainment industry news and content' }
  ];
  
  try {
    const { data, error } = await supabase
      .from('media_categories')
      .insert(categories)
      .select();
      
    if (error) {
      console.error('Error creating categories:', error);
      return false;
    }
    
    console.log('Categories created successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception occurred:', error);
    return false;
  }
};

// To run this in the browser console:
// import { createInitialCategories } from './src/scripts/createInitialCategories';
// createInitialCategories();
