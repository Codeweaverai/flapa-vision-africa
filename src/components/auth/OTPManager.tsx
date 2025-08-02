
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';

const OTPManager: React.FC = () => {
  const { otpRequired, verificationType, user, setOtpRequired } = useAuth();

  const handleOTPVerified = () => {
    console.log('OTP verified successfully');
    setOtpRequired(false);
    toast.success('Email verified successfully!');
  };

  const handleClose = () => {
    // Don't allow closing the OTP modal until verified
    console.log('OTP modal close attempted - verification required');
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
