import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Calendar, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DynamicContent {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'event' | 'creator';
  image_url?: string;
  link_url?: string;
  creator_name?: string;
  price?: number;
  date?: string;
}

interface DynamicContentSearchProps {
  onContentSelect: (content: DynamicContent[]) => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  creator_name?: string;
  is_published: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  price?: number;
  creator_name?: string;
  is_published: boolean;
}

interface Creator {
  id: string;
  full_name?: string;
  username?: string;
  bio?: string;
}

const DynamicContentSearch: React.FC<DynamicContentSearchProps> = ({ onContentSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'all' | 'course' | 'event' | 'creator'>('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedItems, setSelectedItems] = useState<DynamicContent[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('id, title, description, price, creator_id, is_published')
        .eq('is_published', true)
        .ilike('title', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Get creator names separately
      const coursesWithCreators = await Promise.all(
        (coursesData || []).map(async (course) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', course.creator_id)
            .single();
          
          return {
            ...course,
            creator_name: profile?.full_name || profile?.username || 'Unknown Creator'
          };
        })
      );

      setCourses(coursesWithCreators);
    } catch (error) {
      console.error('Error searching courses:', error);
    }
  };

  const searchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('id, title, description, start_time, price, creator_id, is_published')
        .eq('is_published', true)
        .ilike('title', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Get creator names separately
      const eventsWithCreators = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', event.creator_id)
            .single();
          
          return {
            ...event,
            creator_name: profile?.full_name || profile?.username || 'Unknown Creator'
          };
        })
      );

      setEvents(eventsWithCreators);
    } catch (error) {
      console.error('Error searching events:', error);
    }
  };

  const searchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, bio')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error searching creators:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (contentType === 'all' || contentType === 'course') {
        await searchCourses();
      }
      if (contentType === 'all' || contentType === 'event') {
        await searchEvents();
      }
      if (contentType === 'all' || contentType === 'creator') {
        await searchCreators();
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const addToSelected = (item: Course | Event | Creator, type: 'course' | 'event' | 'creator') => {
    const dynamicContent: DynamicContent = {
      id: item.id,
      title: type === 'creator' 
        ? (item as Creator).full_name || (item as Creator).username || 'Unnamed Creator'
        : (item as Course | Event).title,
      description: type === 'creator' 
        ? (item as Creator).bio || 'Creator profile'
        : (item as Course | Event).description,
      type,
      creator_name: type !== 'creator' ? (item as Course | Event).creator_name : undefined,
      price: type !== 'creator' ? (item as Course | Event).price : undefined,
      date: type === 'event' ? (item as Event).start_time : undefined
    };

    if (!selectedItems.find(selected => selected.id === item.id && selected.type === type)) {
      const newSelected = [...selectedItems, dynamicContent];
      setSelectedItems(newSelected);
    }
  };

  const removeFromSelected = (itemId: string, type: string) => {
    const newSelected = selectedItems.filter(item => !(item.id === itemId && item.type === type));
    setSelectedItems(newSelected);
  };

  const handleConfirmSelection = () => {
    onContentSelect(selectedItems);
    toast.success(`Selected ${selectedItems.length} items for newsletter`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Dynamic Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search Query</Label>
              <Input
                id="search"
                placeholder="Search for courses, events, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="type">Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="course">Courses Only</SelectItem>
                  <SelectItem value="event">Events Only</SelectItem>
                  <SelectItem value="creator">Creators Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleSearch} disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search Content'}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {(courses.length > 0 || events.length > 0 || creators.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Courses Results */}
            {courses.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses ({courses.length})
                </h4>
                <div className="grid gap-2">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {course.creator_name} • ${course.price || 0}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToSelected(course, 'course')}
                        disabled={selectedItems.some(item => item.id === course.id && item.type === 'course')}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events Results */}
            {events.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events ({events.length})
                </h4>
                <div className="grid gap-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {event.creator_name} • {new Date(event.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToSelected(event, 'event')}
                        disabled={selectedItems.some(item => item.id === event.id && item.type === 'event')}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Creators Results */}
            {creators.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Creators ({creators.length})
                </h4>
                <div className="grid gap-2">
                  {creators.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{creator.full_name || creator.username}</p>
                        <p className="text-sm text-muted-foreground">{creator.bio || 'Creator profile'}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToSelected(creator, 'creator')}
                        disabled={selectedItems.some(item => item.id === creator.id && item.type === 'creator')}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Items ({selectedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedItems.map((item) => (
              <div key={`${item.id}-${item.type}`} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {item.type === 'course' && <BookOpen className="h-4 w-4 text-blue-600" />}
                  {item.type === 'event' && <Calendar className="h-4 w-4 text-green-600" />}
                  {item.type === 'creator' && <Users className="h-4 w-4 text-purple-600" />}
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromSelected(item.id, item.type)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="pt-4">
              <Button onClick={handleConfirmSelection} className="w-full">
                Add {selectedItems.length} Items to Newsletter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicContentSearch;
