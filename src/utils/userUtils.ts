
import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
  email?: string;
  display_name: string;
}

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    // Try to get profile from profiles table first
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('id', userId)
      .single();

    if (profileData) {
      return {
        id: profileData.id,
        full_name: profileData.full_name || undefined,
        username: profileData.username || undefined,
        display_name: profileData.full_name || profileData.username || 'Unknown User'
      };
    }

    // If no profile found, return minimal info
    return {
      id: userId,
      display_name: 'Unknown User'
    };
  } catch (error) {
    console.warn('Error fetching user profile:', error);
    return {
      id: userId,
      display_name: 'Unknown User'
    };
  }
};

export const getUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
  if (userIds.length === 0) return [];

  try {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', userIds);

    const profileMap = new Map(
      (profilesData || []).map(profile => [
        profile.id,
        {
          id: profile.id,
          full_name: profile.full_name || undefined,
          username: profile.username || undefined,
          display_name: profile.full_name || profile.username || 'Unknown User'
        }
      ])
    );

    // Ensure all requested user IDs have a profile entry
    return userIds.map(userId => 
      profileMap.get(userId) || {
        id: userId,
        display_name: 'Unknown User'
      }
    );
  } catch (error) {
    console.warn('Error fetching user profiles:', error);
    // Return minimal profiles for all requested users
    return userIds.map(userId => ({
      id: userId,
      display_name: 'Unknown User'
    }));
  }
};
