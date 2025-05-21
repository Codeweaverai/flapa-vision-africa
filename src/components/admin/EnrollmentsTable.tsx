
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Enrollment {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  course_title: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  is_completed: boolean;
  payment_status: string;
  [key: string]: any;
}

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  loading: boolean;
  onDelete: (enrollmentId: string) => void;
}

const EnrollmentsTable = ({ 
  enrollments, 
  loading, 
  onDelete 
}: EnrollmentsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      enrollment.user?.email?.toLowerCase().includes(searchLower) ||
      enrollment.user?.full_name?.toLowerCase().includes(searchLower) ||
      enrollment.course_title?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (isCompleted: boolean) => {
    return isCompleted ? (
      <Badge variant="success">Completed</Badge>
    ) : (
      <Badge variant="secondary">In Progress</Badge>
    );
  };

  const getPaymentStatusBadge = (status: string, isFree: boolean) => {
    if (isFree) return <Badge variant="outline">Free</Badge>;
    
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No enrollments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchTerm && (
        <div className="relative">
          <Input
            type="text"
            placeholder="Filter enrollments..."
            className="px-4 py-2 border rounded-md w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="font-medium">{enrollment.user?.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{enrollment.user?.email || 'N/A'}</div>
                </TableCell>
                <TableCell>{enrollment.course_title || 'N/A'}</TableCell>
                <TableCell>{formatDate(enrollment.enrollment_date)}</TableCell>
                <TableCell>
                  {getStatusBadge(enrollment.is_completed)}
                  {enrollment.completion_date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Completed: {formatDate(enrollment.completion_date)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {getPaymentStatusBadge(enrollment.payment_status, enrollment.is_free)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`/admin/courses/content/${enrollment.course_id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View Course</span>
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(enrollment.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EnrollmentsTable;
