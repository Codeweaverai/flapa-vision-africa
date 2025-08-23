
import { supabase } from '@/lib/supabaseClient';

export interface UserWorkplace {
  id: string;
  name: string;
  description: string | null;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

export async function fetchUserWorkplaces(): Promise<UserWorkplace[]> {
  try {
    const { data: memberships, error } = await supabase
      .from('creator_workplace_members')
      .select(`
        role,
        creator_workplaces (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .in('role', ['owner', 'editor']);

    if (error) throw error;

    return (memberships || []).map(membership => ({
      id: membership.creator_workplaces.id,
      name: membership.creator_workplaces.name,
      description: membership.creator_workplaces.description,
      role: membership.role as 'owner' | 'editor',
      created_at: membership.creator_workplaces.created_at
    }));
  } catch (error) {
    console.error('Error fetching user workplaces:', error);
    return [];
  }
}

export async function fetchWorkplaceContent(workplaceId: string) {
  try {
    // Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, created_at, is_published')
      .eq('workplace_id', workplaceId)
      .order('created_at', { ascending: false });

    if (coursesError) throw coursesError;

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, created_at, start_time')
      .eq('workplace_id', workplaceId)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    return {
      courses: courses || [],
      events: events || []
    };
  } catch (error) {
    console.error('Error fetching workplace content:', error);
    return { courses: [], events: [] };
  }
}
