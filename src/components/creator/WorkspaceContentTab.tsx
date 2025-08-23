
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Calendar, 
  Plus, 
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  fetchWorkplaceContent, 
  fetchCreatorCoursesForSelection,
  fetchCreatorEventsForSelection,
  linkCourseToWorkplace,
  linkEventToWorkplace,
  CreatorCourse,
  CreatorEvent
} from '@/services/workplaceService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface WorkspaceContentTabProps {
  workplaceId: string;
  userRole: 'owner' | 'editor' | 'viewer';
}

interface WorkplaceCourse {
  id: string;
  title: string;
  created_at: string;
  is_published: boolean;
}

interface WorkplaceEvent {
  id: string;
  title: string;
  created_at: string;
  start_time: string;
}

const WorkspaceContentTab: React.FC<WorkspaceContentTabProps> = ({ 
  workplaceId, 
  userRole 
}) => {
  const [courses, setCourses] = useState<WorkplaceCourse[]>([]);
  const [events, setEvents] = useState<WorkplaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelectCourse, setShowSelectCourse] = useState(false);
  const [showSelectEvent, setShowSelectEvent] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<CreatorCourse[]>([]);
  const [availableEvents, setAvailableEvents] = useState<CreatorEvent[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [linkingCourse, setLinkingCourse] = useState(false);
  const [linkingEvent, setLinkingEvent] = useState(false);
  const navigate = useNavigate();

  const canEdit = userRole === 'owner' || userRole === 'editor';
  const canSelect = userRole === 'owner'; // Only owners can select/assign content

  useEffect(() => {
    loadContent();
  }, [workplaceId]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await fetchWorkplaceContent(workplaceId);
      setCourses(content.courses);
      setEvents(content.events);
    } catch (error) {
      console.error('Error loading workspace content:', error);
      toast.error('Failed to load workspace content');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const courses = await fetchCreatorCoursesForSelection();
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error loading available courses:', error);
      toast.error('Failed to load available courses');
    }
  };

  const loadAvailableEvents = async () => {
    try {
      const events = await fetchCreatorEventsForSelection();
      setAvailableEvents(events);
    } catch (error) {
      console.error('Error loading available events:', error);
      toast.error('Failed to load available events');
    }
  };

  const handleSelectCourse = () => {
    setShowSelectCourse(true);
    loadAvailableCourses();
  };

  const handleSelectEvent = () => {
    setShowSelectEvent(true);
    loadAvailableEvents();
  };

  const handleLinkCourse = async () => {
    if (!selectedCourseId) return;

    setLinkingCourse(true);
    try {
      const success = await linkCourseToWorkplace(selectedCourseId, workplaceId);
      if (success) {
        toast.success('Course linked to workspace successfully');
        setShowSelectCourse(false);
        setSelectedCourseId('');
        loadContent(); // Reload content
      } else {
        toast.error('Failed to link course to workspace');
      }
    } catch (error) {
      console.error('Error linking course:', error);
      toast.error('Failed to link course to workspace');
    } finally {
      setLinkingCourse(false);
    }
  };

  const handleLinkEvent = async () => {
    if (!selectedEventId) return;

    setLinkingEvent(true);
    try {
      const success = await linkEventToWorkplace(selectedEventId, workplaceId);
      if (success) {
        toast.success('Event linked to workspace successfully');
        setShowSelectEvent(false);
        setSelectedEventId('');
        loadContent(); // Reload content
      } else {
        toast.error('Failed to link event to workspace');
      }
    } catch (error) {
      console.error('Error linking event:', error);
      toast.error('Failed to link event to workspace');
    } finally {
      setLinkingEvent(false);
    }
  };

  const getAssignmentBadge = (item: CreatorCourse | CreatorEvent, currentWorkplaceId: string) => {
    if (!item.workplace_id) {
      return <Badge variant="outline" className="text-green-600">Unassigned</Badge>;
    }
    if (item.workplace_id === currentWorkplaceId) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Already in this workspace</Badge>;
    }
    return (
      <Badge variant="secondary" className="text-orange-600">
        Assigned to {item.workplace_name}
      </Badge>
    );
  };

  const isItemSelectable = (item: CreatorCourse | CreatorEvent, currentWorkplaceId: string) => {
    return !item.workplace_id || item.workplace_id === currentWorkplaceId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workspace Content</h3>
        {canSelect && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectCourse}
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Course
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectEvent}
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Event
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Events ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courses assigned to this workspace yet.</p>
                  {canSelect && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleSelectCourse}
                    >
                      Select First Course
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="font-medium">{course.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={course.is_published ? "default" : "secondary"}
                            className="flex items-center gap-1 w-fit"
                          >
                            {course.is_published ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                            {course.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(course.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/courses/${course.id}`)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/creator/courses/${course.id}/edit`)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events assigned to this workspace yet.</p>
                  {canSelect && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleSelectEvent}
                    >
                      Select First Event
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="font-medium">{event.title}</div>
                        </TableCell>
                        <TableCell>
                          {new Date(event.start_time).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(event.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/events/${event.id}`)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/creator/events/${event.id}/edit`)}
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Select Course Dialog */}
      <Dialog open={showSelectCourse} onOpenChange={setShowSelectCourse}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Course</DialogTitle>
            <DialogDescription>
              Choose a course from your created courses to assign to this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem
                    key={course.id}
                    value={course.id}
                    disabled={!isItemSelectable(course, workplaceId)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{course.title}</span>
                      {getAssignmentBadge(course, workplaceId)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectCourse(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLinkCourse} 
              disabled={!selectedCourseId || linkingCourse}
            >
              {linkingCourse ? 'Linking...' : 'Link Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Event Dialog */}
      <Dialog open={showSelectEvent} onOpenChange={setShowSelectEvent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Event</DialogTitle>
            <DialogDescription>
              Choose an event from your created events to assign to this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    disabled={!isItemSelectable(event, workplaceId)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div>{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.start_time).toLocaleDateString()}
                        </div>
                      </div>
                      {getAssignmentBadge(event, workplaceId)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectEvent(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLinkEvent} 
              disabled={!selectedEventId || linkingEvent}
            >
              {linkingEvent ? 'Linking...' : 'Link Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspaceContentTab;
