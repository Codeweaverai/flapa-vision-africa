
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Enrollment {
  id: string;
  enrollment_date: string;
  payment_status: string;
  is_completed: boolean;
  completion_date?: string;
  profiles: {
    full_name?: string;
    username?: string;
  };
}

interface CourseEnrollmentsListProps {
  courseId: string;
}

const CourseEnrollmentsList = ({ courseId }: CourseEnrollmentsListProps) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!courseId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            enrollment_date,
            payment_status,
            is_completed,
            completion_date,
            profiles:user_id(full_name, username)
          `)
          .eq('course_id', courseId)
          .order('enrollment_date', { ascending: false });

        if (error) throw error;
        setEnrollments(data || []);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        toast.error('Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No enrollments yet for this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total Enrollments: {enrollments.length}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Enrolled At</TableHead>
            <TableHead>Completed At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell>
                {enrollment.profiles?.full_name || enrollment.profiles?.username || 'Unknown User'}
              </TableCell>
              <TableCell>
                <Badge variant={enrollment.payment_status === 'completed' ? 'default' : 'outline'}>
                  {enrollment.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={enrollment.is_completed ? 'default' : 'secondary'}>
                  {enrollment.is_completed ? 'Completed' : 'In Progress'}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(enrollment.enrollment_date), 'MMM d, yyyy HH:mm')}
              </TableCell>
              <TableCell>
                {enrollment.completion_date ? 
                  format(new Date(enrollment.completion_date), 'MMM d, yyyy HH:mm') : 
                  '-'
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseEnrollmentsList;
