
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
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          payment_status: 'completed'
        });

      if (error) throw error;

      toast.success(`You've successfully enrolled in ${courseName}`);
      window.location.reload();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll in the course. Please try again.');
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
