
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import EnhancedPaymentButton from './EnhancedPaymentButton';

interface CourseEnrollmentButtonProps {
  courseId: string;
  courseName: string;
  isFree: boolean;
  price: number;
  currency?: string;
  isUserEnrolled: boolean;
  creatorId?: string;
}

const CourseEnrollmentButton: React.FC<CourseEnrollmentButtonProps> = ({
  courseId,
  courseName,
  isFree,
  price,
  currency = 'USD',
  isUserEnrolled,
  creatorId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFreeEnrollment = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          payment_status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "Enrollment Successful",
        description: `You've successfully enrolled in ${courseName}`,
      });

      window.location.reload();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in the course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserEnrolled) {
    return (
      <Button disabled className="w-full">
        Already Enrolled
      </Button>
    );
  }

  if (isFree) {
    return (
      <Button 
        onClick={handleFreeEnrollment} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Enrolling..." : "Enroll for Free"}
      </Button>
    );
  }

  return (
    <EnhancedPaymentButton
      referenceType="course"
      referenceId={courseId}
      amount={price}
      currency={currency}
      title={courseName}
      creatorId={creatorId}
      className="w-full"
    >
      Enroll Now - {currency} {price.toFixed(2)}
    </EnhancedPaymentButton>
  );
};

export default CourseEnrollmentButton;
