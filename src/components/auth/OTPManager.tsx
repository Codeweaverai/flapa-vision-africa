
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import OTPVerificationModal from './OTPVerificationModal';

const OTPManager: React.FC = () => {
  const { otpRequired, verificationType, user, setOtpRequired } = useAuth();

  const handleOTPVerified = () => {
    setOtpRequired(false);
    toast.success('Email verified successfully!');
  };

  if (!otpRequired || !user || !verificationType) {
    return null;
  }

  return (
    <OTPVerificationModal
      isOpen={otpRequired}
      onClose={() => {}}
      onVerified={handleOTPVerified}
      verificationType={verificationType}
      userEmail={user.email || ''}
    />
  );
};

export default OTPManager;
