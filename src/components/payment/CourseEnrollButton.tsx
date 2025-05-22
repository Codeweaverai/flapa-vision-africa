
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface CourseEnrollButtonProps {
  courseId: string;
  title: string;
  isFree: boolean;
  price?: number;
  isEnrolled?: boolean;
  className?: string;
}

const CourseEnrollButton = ({
  courseId,
  title,
  isFree,
  price = 0,
  isEnrolled = false,
  className = ''
}: CourseEnrollButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll');
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);

    try {
      // Check if already enrolled
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingEnrollment) {
        toast.info('You are already enrolled in this course');
        navigate(`/learning/course/${courseId}`);
        return;
      }

      if (isFree) {
        // Process free enrollment directly
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            enrollment_date: new Date().toISOString(),
            payment_status: 'free',
            is_completed: false
          });

        if (enrollError) throw enrollError;

        toast.success('Successfully enrolled in course!');
        navigate(`/learning/course/${courseId}`);
      } else {
        // Process paid enrollment with Stripe
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: {
            amount: price,
            currency: 'usd',
            itemName: `Course: ${title}`,
            itemId: courseId,
            itemType: 'course'
          }
        });

        if (error) throw error;

        if (data?.url) {
          // Open Stripe checkout in a new tab
          window.open(data.url, '_blank');
        } else {
          throw new Error('Invalid response from payment service');
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to process enrollment');
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <Button 
        onClick={() => navigate(`/learning/course/${courseId}`)} 
        className={className}
      >
        Continue Learning
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleEnroll} 
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {isFree ? 'Enroll for Free' : `Enroll for $${price}`}
    </Button>
  );
};

export default CourseEnrollButton;
