
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';

interface CourseEnrollmentButtonProps {
  courseId: string;
  courseName: string;
  isFree: boolean;
  price: number;
  currency?: string;
  isUserEnrolled?: boolean;
  creatorId?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const CourseEnrollmentButton: React.FC<CourseEnrollmentButtonProps> = ({
  courseId,
  courseName,
  isFree,
  price,
  currency = 'USD',
  isUserEnrolled = false,
  creatorId,
  className,
  variant = "default"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFreeEnrollment = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting free enrollment for user:', user.id, 'course:', courseId);
      
      // Check for existing enrollment with more detailed logging
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id, user_id, course_id, payment_status')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      console.log('Existing enrollment check result:', { existingEnrollment, checkError });

      if (checkError) {
        console.error('Error checking enrollment:', checkError);
        toast.error('Failed to check enrollment status');
        return;
      }

      // If any enrollment exists (regardless of payment status), consider user enrolled
      if (existingEnrollment && existingEnrollment.length > 0) {
        console.log('User already has enrollment:', existingEnrollment[0]);
        toast.success(`You are already enrolled in ${courseName}`);
        window.location.reload();
        return;
      }

      console.log('No existing enrollment found, proceeding with insertion...');

      // Proceed with enrollment
      const enrollmentData = {
        user_id: user.id,
        course_id: courseId,
        payment_status: 'completed',
        enrollment_date: new Date().toISOString()
      };

      console.log('Inserting enrollment with data:', enrollmentData);

      const { data: newEnrollment, error: insertError } = await supabase
        .from('course_enrollments')
        .insert(enrollmentData)
        .select();

      console.log('Insert result:', { newEnrollment, insertError });

      if (insertError) {
        console.error('Enrollment error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });

        // Handle specific error cases
        if (insertError.code === '23505') { // Unique constraint violation
          console.log('Unique constraint violation detected');
          toast.success(`You are already enrolled in ${courseName}`);
          window.location.reload();
          return;
        }
        
        toast.error(`Failed to enroll: ${insertError.message}`);
        return;
      }

      console.log('Enrollment successful:', newEnrollment);
      toast.success(`You've successfully enrolled in ${courseName}`);
      window.location.reload();
    } catch (error) {
      console.error('Unexpected enrollment error:', error);
      toast.error('An unexpected error occurred during enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaidEnrollment = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: window.location.pathname } });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          referenceType: 'course',
          referenceId: courseId,
          amount: Math.round(price * 100), // Convert to cents
          currency: currency.toLowerCase(),
          title: courseName,
          creatorId,
          successUrl: `${window.location.origin}/payment/result?type=course&id=${courseId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/learning/course-detail/${courseId}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isUserEnrolled) {
    return (
      <Button disabled className={className} variant={variant}>
        Already Enrolled
      </Button>
    );
  }

  if (isFree) {
    return (
      <Button 
        onClick={handleFreeEnrollment} 
        disabled={loading}
        className={className}
        variant={variant}
      >
        {loading ? "Enrolling..." : "Enroll for Free"}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handlePaidEnrollment} 
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? "Processing..." : (
        <>
          Enroll Now - <PriceDisplay amount={price} originalCurrency={currency as any} />
        </>
      )}
    </Button>
  );
};

export default CourseEnrollmentButton;
