import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, GraduationCap, User2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Student {
  id: string;
  full_name: string;
  username: string;
  email: string;
  enrollments: any[];
}

const CreatorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch course enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrollment_date,
          user_id,
          course_id,
          courses!inner(title, creator_id)
        `)
        .eq('courses.creator_id', user.id);

      if (enrollmentsError) throw enrollmentsError;

      // Get unique user IDs
      const userIds = [...new Set(enrollmentsData?.map(e => e.user_id) || [])];
      
      // Fetch user profiles separately
      const { data: profilesData } = userIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, username, email')
        .in('id', userIds) : { data: [] };

      // Merge enrollments with profiles
      const enrichedEnrollments = enrollmentsData?.map(enrollment => ({
        ...enrollment,
        profiles: profilesData?.find(p => p.id === enrollment.user_id)
      })) || [];

      // Group by user to get unique students
      const studentsMap = new Map();
      
      enrichedEnrollments.forEach(enrollment => {
        const userId = enrollment.user_id;
        if (!studentsMap.has(userId)) {
          studentsMap.set(userId, {
            id: userId,
            full_name: enrollment.profiles?.full_name || 'Unknown Student',
            username: enrollment.profiles?.username || '',
            email: enrollment.profiles?.email || '',
            enrollments: []
          });
        }
        studentsMap.get(userId).enrollments.push(enrollment);
      });

      setStudents(Array.from(studentsMap.values()));

    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Your Students
        </h1>
        <p className="text-muted-foreground">
          A list of students enrolled in your courses.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <User2 className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Yet</h3>
          <p className="text-muted-foreground">As students enroll in your courses, they will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of students enrolled in your courses.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrolled Courses</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${student.email}.png`} />
                      <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {student.enrollments.map((enrollment) => (
                      <Badge key={enrollment.id} className="mr-1 mb-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {enrollment.courses.title}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {student.enrollments.map((enrollment) => (
                      <div key={enrollment.id}>
                        <CalendarIcon className="h-4 w-4 inline-block mr-1" />
                        {format(parseISO(enrollment.enrollment_date), 'PPP')}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CreatorStudents;
