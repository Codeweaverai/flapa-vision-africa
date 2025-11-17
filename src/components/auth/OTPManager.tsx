import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';

const OTPManager: React.FC = () => {
  const { otpRequired, verificationType, user, setOtpRequired, completeOTPVerification } = useAuth();

  const handleOTPVerified = async () => {
    try {
      console.log('OTP verified successfully, updating verification status');
      await completeOTPVerification();
      toast.success('Email verified successfully!');
    } catch (error) {
      console.error('Failed to complete OTP verification:', error);
      toast.error('Failed to complete verification. Please try again.');
    }
  };

  const handleClose = () => {
    // Don't allow closing the OTP modal until verified
    console.log('OTP modal close attempted - verification required');
    toast.info('Please complete OTP verification to continue');
  };

  // Only show modal if OTP is required and we have all necessary data
  if (!otpRequired || !user || !verificationType) {
    return null;
  }

  console.log('OTPManager rendering modal:', { otpRequired, verificationType, userEmail: user.email });

  return (
    <OTPVerificationModal
      isOpen={otpRequired}
      onClose={handleClose}
      onVerified={handleOTPVerified}
      verificationType={verificationType}
      userEmail={user.email || ''}
    />
  );
};

export default OTPManager;
