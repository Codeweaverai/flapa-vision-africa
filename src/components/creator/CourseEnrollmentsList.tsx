
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

interface Enrollment {
  id: string;
  enrollment_date: string;
  payment_status: string;
  is_completed: boolean;
  completion_date: string | null;
  user_profile?: {
    full_name?: string;
    username?: string;
  };
}

interface CourseEnrollmentsListProps {
  courseId: string;
}

const CourseEnrollmentsList: React.FC<CourseEnrollmentsListProps> = ({ courseId }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrollments();
  }, [courseId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      
      // First get enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .order('enrollment_date', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Then get user profiles separately
      if (enrollmentsData && enrollmentsData.length > 0) {
        const userIds = enrollmentsData.map(enrollment => enrollment.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const enrollmentsWithProfiles = enrollmentsData.map(enrollment => ({
          ...enrollment,
          user_profile: profilesData?.find(profile => profile.id === enrollment.user_id)
        }));

        setEnrollments(enrollmentsWithProfiles);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: "Error",
        description: "Failed to load course enrollments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (paymentStatus: string, isCompleted: boolean) => {
    if (paymentStatus === 'completed') {
      return isCompleted ? 
        <Badge className="bg-green-100 text-green-800">Completed</Badge> :
        <Badge className="bg-blue-100 text-blue-800">Enrolled</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Enrollments</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Completion Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        {enrollment.user_profile?.full_name || enrollment.user_profile?.username || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(enrollment.enrollment_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enrollment.payment_status, enrollment.is_completed)}
                      </TableCell>
                      <TableCell>
                        {enrollment.is_completed ? 'Completed' : 'In Progress'}
                      </TableCell>
                      <TableCell>
                        {enrollment.completion_date ? 
                          format(new Date(enrollment.completion_date), 'MMM dd, yyyy') : 
                          '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseEnrollmentsList;
