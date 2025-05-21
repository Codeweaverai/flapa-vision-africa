
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export interface CourseEnrollment {
  id: string;
  enrollment_date: string;
  completion_date: string | null;
  is_completed: boolean;
  payment_status: string;
  user_id: string;
  course_id: string;
  payment_id?: string | null;
  profiles?: {
    full_name?: string;
    email?: string;
    id: string;
  } | any; // Allow any type for profiles to handle error cases
  courses?: {
    title: string;
    id: string;
    price: number;
    is_free: boolean;
  };
}

interface EnrollmentsTableProps {
  enrollments: CourseEnrollment[];
  onEdit: (enrollment: CourseEnrollment) => void;
  onDelete: (enrollment: CourseEnrollment) => void;
  loading: boolean;
}

const EnrollmentsTable = ({ 
  enrollments, 
  onEdit, 
  onDelete, 
  loading 
}: EnrollmentsTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (enrollments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No enrollments found</h3>
        <p className="text-muted-foreground">
          There are no course enrollments matching your criteria.
        </p>
      </Card>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => {
              // Safely get the profile properties
              const fullName = enrollment.profiles && 
                (typeof enrollment.profiles === 'object' && 'full_name' in enrollment.profiles) 
                ? enrollment.profiles.full_name 
                : 'Unknown';
                
              return (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{fullName || 'Unknown'}</p>
                      {enrollment.profiles && 
                       typeof enrollment.profiles === 'object' && 
                       'email' in enrollment.profiles && (
                        <p className="text-xs text-muted-foreground">{enrollment.profiles.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.courses?.title || 'Unknown Course'}</TableCell>
                  <TableCell>{formatDate(enrollment.enrollment_date)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      enrollment.is_completed ? 'default' : 'secondary'
                    }>
                      {enrollment.is_completed ? 'Completed' : 'In Progress'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      enrollment.payment_status === 'confirmed' ? 'outline' : 
                      enrollment.payment_status === 'failed' ? 'destructive' :
                      enrollment.payment_status === 'free' ? 'secondary' :
                      'secondary'
                    }>
                      {enrollment.courses?.is_free ? 'Free' : enrollment.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onEdit(enrollment)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDelete(enrollment)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EnrollmentsTable;
