
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import CourseForm from '@/pages/admin/CourseForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

const CreatorCourseForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    const checkCourseOwnership = async () => {
      if (!courseId || !user) {
        setAuthorized(true); // New course, always authorized
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('creator_id')
          .eq('id', courseId)
          .single();
          
        if (error) throw error;
        
        if (data.creator_id === user.id) {
          setAuthorized(true);
        } else {
          // Not authorized, redirect to creator courses page
          navigate('/creator/courses');
          return;
        }
      } catch (error) {
        console.error('Error checking course ownership:', error);
        navigate('/creator/courses');
        return;
      } finally {
        setLoading(false);
      }
    };
    
    checkCourseOwnership();
  }, [courseId, user, navigate]);
  
  if (loading) {
    return (
      <CreatorLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CreatorLayout>
    );
  }
  
  if (!authorized) {
    return (
      <CreatorLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Not Authorized</h2>
          <p>You don't have permission to edit this course.</p>
        </div>
      </CreatorLayout>
    );
  }
  
  return (
    <CreatorLayout>
      <CourseForm creatorId={user?.id} />
    </CreatorLayout>
  );
};

export default CreatorCourseForm;
