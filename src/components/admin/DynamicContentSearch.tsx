
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, BookOpen, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Creator {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  thumbnail_url?: string;
  category: string;
  creator_id: string;
  profiles?: {
    full_name: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  price?: number;
  is_free: boolean;
  image_url?: string;
  event_type: string;
  creator_id: string;
  profiles?: {
    full_name: string;
  };
}

interface DynamicContentSearchProps {
  onSelectContent: (content: any, type: 'creator' | 'course' | 'event') => void;
}

const DynamicContentSearch: React.FC<DynamicContentSearchProps> = ({ onSelectContent }) => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'creators' | 'courses' | 'events'>('creators');

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchContent();
    } else {
      loadInitialContent();
    }
  }, [searchQuery, activeTab]);

  const loadInitialContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'creators') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .limit(10)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCreators(data || []);
      } else if (activeTab === 'courses') {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles:creator_id (
              full_name
            )
          `)
          .eq('is_published', true)
          .limit(10)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
      } else if (activeTab === 'events') {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles:creator_id (
              full_name
            )
          `)
          .limit(10)
          .order('start_time', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'creators') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        setCreators(data || []);
      } else if (activeTab === 'courses') {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles:creator_id (
              full_name
            )
          `)
          .eq('is_published', true)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        setCourses(data || []);
      } else if (activeTab === 'events') {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles:creator_id (
              full_name
            )
          `)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error searching content:', error);
      toast.error('Failed to search content');
    } finally {
      setLoading(false);
    }
  };

  const generateContentHtml = (content: any, type: 'creator' | 'course' | 'event') => {
    const baseUrl = 'https://skillpulse.cloud';
    
    if (type === 'creator') {
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            ${content.avatar_url ? 
              `<img src="${content.avatar_url}" alt="${content.full_name}" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 15px;">` : 
              `<div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 15px;">${content.full_name?.charAt(0) || 'U'}</div>`
            }
            <div>
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.full_name || content.username}</h3>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">@${content.username}</p>
            </div>
          </div>
          ${content.bio ? `<p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.bio}</p>` : ''}
          <a href="${baseUrl}/creator/profile/${content.id}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Profile</a>
        </div>
      `;
    } else if (type === 'course') {
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; margin-bottom: 15px;">
            ${content.thumbnail_url ? 
              `<img src="${content.thumbnail_url}" alt="${content.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px;">` : 
              `<div style="width: 120px; height: 80px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 15px;"><span style="color: white; font-size: 24px;">📚</span></div>`
            }
            <div style="flex: 1;">
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.title}</h3>
              <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">by ${content.profiles?.full_name || 'Unknown'}</p>
              <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <span style="background: #ddd6fe; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${content.category}</span>
                <span style="font-weight: 600; color: #059669;">${content.is_free ? 'Free' : `$${content.price}`}</span>
              </div>
            </div>
          </div>
          <p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.description?.substring(0, 150)}${content.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a href="${baseUrl}/course/${content.id}" style="padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Course</a>
            <a href="${baseUrl}/course/${content.id}/enroll" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Enroll Now</a>
          </div>
        </div>
      `;
    } else if (type === 'event') {
      const startDate = new Date(content.start_time);
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="display: flex; margin-bottom: 15px;">
            ${content.image_url ? 
              `<img src="${content.image_url}" alt="${content.title}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 15px;">` : 
              `<div style="width: 120px; height: 80px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 15px;"><span style="color: white; font-size: 24px;">📅</span></div>`
            }
            <div style="flex: 1;">
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${content.title}</h3>
              <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">by ${content.profiles?.full_name || 'Unknown'}</p>
              <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <span style="background: #ddd6fe; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${content.event_type}</span>
                <span style="font-weight: 600; color: #059669;">${content.is_free ? 'Free' : `$${content.price || 'TBA'}`}</span>
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                <div>📅 ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}</div>
                ${content.location ? `<div>📍 ${content.location}</div>` : ''}
              </div>
            </div>
          </div>
          <p style="margin: 10px 0; color: #4b5563; line-height: 1.5;">${content.description?.substring(0, 150)}${content.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a href="${baseUrl}/events/${content.id}" style="padding: 10px 20px; background: linear-gradient(135deg, #f59e0b, #8b5cf6); color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View Event</a>
            <a href="${baseUrl}/events/${content.id}" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Register</a>
          </div>
        </div>
      `;
    }
    return '';
  };

  const renderCreators = () => (
    <div className="space-y-4">
      {creators.map((creator) => (
        <Card key={creator.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={creator.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {creator.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{creator.full_name || creator.username}</h3>
                  <p className="text-sm text-muted-foreground">@{creator.username}</p>
                  {creator.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{creator.bio}</p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectContent(creator, 'creator')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div className="flex gap-3 flex-1">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-gradient-to-br from-orange-400 to-purple-600 rounded flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {course.profiles?.full_name || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{course.category}</Badge>
                    <span className="text-sm font-semibold text-green-600">
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectContent(course, 'course')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div className="flex gap-3 flex-1">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-12 bg-gradient-to-br from-orange-400 to-purple-600 rounded flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {event.profiles?.full_name || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                    <span className="text-sm font-semibold text-green-600">
                      {event.is_free ? 'Free' : `$${event.price || 'TBA'}`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.start_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectContent(event, 'event')}
                className="bg-gradient-to-r from-orange-500 to-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Label htmlFor="content-search">Search Dynamic Content</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="content-search"
            placeholder="Search creators, courses, or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'creators' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('creators')}
        >
          <User className="h-4 w-4 mr-1" />
          Creators
        </Button>
        <Button
          variant={activeTab === 'courses' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Courses
        </Button>
        <Button
          variant={activeTab === 'events' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('events')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Events
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'creators' && renderCreators()}
            {activeTab === 'courses' && renderCourses()}
            {activeTab === 'events' && renderEvents()}
          </>
        )}
      </div>
    </div>
  );
};

export default DynamicContentSearch;
