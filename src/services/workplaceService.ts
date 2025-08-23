
import { supabase } from '@/lib/supabaseClient';

export interface UserWorkplace {
  id: string;
  name: string;
  description: string | null;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

export interface CreatorCourse {
  id: string;
  title: string;
  workplace_id: string | null;
  workplace_name: string | null;
}

export interface CreatorEvent {
  id: string;
  title: string;
  start_time: string;
  workplace_id: string | null;
  workplace_name: string | null;
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

export async function fetchCreatorCoursesForSelection(): Promise<CreatorCourse[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        workplace_id,
        creator_workplaces (
          name
        )
      `)
      .eq('creator_id', user.user.id)
      .order('title');

    if (error) throw error;

    return (courses || []).map(course => ({
      id: course.id,
      title: course.title,
      workplace_id: course.workplace_id,
      workplace_name: course.creator_workplaces?.name || null
    }));
  } catch (error) {
    console.error('Error fetching creator courses:', error);
    return [];
  }
}

export async function fetchCreatorEventsForSelection(): Promise<CreatorEvent[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        start_time,
        workplace_id,
        creator_workplaces (
          name
        )
      `)
      .eq('creator_id', user.user.id)
      .order('title');

    if (error) throw error;

    return (events || []).map(event => ({
      id: event.id,
      title: event.title,
      start_time: event.start_time,
      workplace_id: event.workplace_id,
      workplace_name: event.creator_workplaces?.name || null
    }));
  } catch (error) {
    console.error('Error fetching creator events:', error);
    return [];
  }
}

export async function linkCourseToWorkplace(courseId: string, workplaceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ workplace_id: workplaceId })
      .eq('id', courseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking course to workplace:', error);
    return false;
  }
}

export async function linkEventToWorkplace(eventId: string, workplaceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .update({ workplace_id: workplaceId })
      .eq('id', eventId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking event to workplace:', error);
    return false;
  }
}
