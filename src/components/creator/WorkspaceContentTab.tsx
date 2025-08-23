
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { fetchWorkplaceContent } from '@/services/workplaceService';
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
  const navigate = useNavigate();

  const canEdit = userRole === 'owner' || userRole === 'editor';

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
        {canEdit && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/creator/courses/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/creator/events/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
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
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/creator/courses/create')}
                    >
                      Create First Course
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
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/creator/events/create')}
                    >
                      Create First Event
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
    </div>
  );
};

export default WorkspaceContentTab;
