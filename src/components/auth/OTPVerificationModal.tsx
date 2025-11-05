import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw, Shield, Clock, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  verificationType: 'login' | 'registration' | 'inactive' | 'suspicious_location';
  userEmail: string;
}

const OTPVerificationModal = ({
  isOpen,
  onClose,
  onVerified,
  verificationType,
  userEmail
}: OTPVerificationModalProps) => {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen) {
      handleGenerateOTP();
      setOtpCode('');
      setAttempts(0);
    }
  }, [isOpen]);

  const handleGenerateOTP = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase.functions.invoke('generate-otp', {
        body: { verificationType },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Verification code sent!');
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { otpCode },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Identity verified!');
      onVerified();
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setAttempts(prev => prev + 1);
      toast.error(error.message || 'Invalid verification code');
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationMessage = () => {
    switch (verificationType) {
      case 'registration':
        return 'Welcome to SkillPulse! Verify your email to secure your account.';
      case 'inactive':
        return 'Welcome back! Verify your identity to continue securely.';
      case 'suspicious_location':
        return 'We detected a login from a new location. Verify your identity to continue securely.';
      default:
        return 'Secure your account with two-factor verification.';
    }
  };

  const getVerificationTitle = () => {
    switch (verificationType) {
      case 'registration':
        return 'Secure Your Account';
      case 'inactive':
        return 'Verify Your Identity';
      case 'suspicious_location':
        return 'New Location Detected';
      default:
        return 'Two-Factor Verification';
    }
  };

  const getHeaderIcon = () => {
    switch (verificationType) {
      case 'registration':
        return <Shield className="h-8 w-8" />;
      case 'inactive':
        return <Clock className="h-8 w-8" />;
      case 'suspicious_location':
        return <MapPin className="h-8 w-8" />;
      default:
        return <Shield className="h-8 w-8" />;
    }
  };

  const getHeaderGradient = () => {
    switch (verificationType) {
      case 'registration':
        return 'bg-gradient-to-r from-green-500 to-blue-500';
      case 'inactive':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'suspicious_location':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      default:
        return 'bg-gradient-to-r from-orange-500 to-purple-600';
    }
  };

  const getSecurityNote = () => {
    switch (verificationType) {
      case 'suspicious_location':
        return 'For your security, we require verification when logging in from new locations.';
      default:
        return 'Secure verification helps protect your account from unauthorized access.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl">
        {/* Header with dynamic gradient based on verification type */}
        <div className={cn("p-6 text-white", getHeaderGradient())}>
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-lg rounded-full"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3">
                  {getHeaderIcon()}
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {getVerificationTitle()}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base">
              {getVerificationMessage()}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Email display */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Code sent to:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{userEmail}</span>
            </div>
          </div>

          {/* Security Note for suspicious location */}
          {verificationType === 'suspicious_location' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {getSecurityNote()}
              </p>
            </div>
          )}

          {/* OTP Input */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
                disabled={isVerifying}
                containerClassName="gap-3"
                onComplete={(value) => {
                  if (value.length === 6) {
                    handleVerifyOTP();
                  }
                }}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot 
                      key={index}
                      index={index}
                      className={cn(
                        "w-12 h-12 border-2 text-lg font-semibold transition-all duration-200",
                        "border-slate-300 dark:border-slate-600 hover:border-slate-400",
                        "data-[state=active]:border-orange-500 data-[state=active]:ring-2 data-[state=active]:ring-orange-200",
                        "data-[state=active]:shadow-lg data-[state=active]:scale-105"
                      )}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Auto-submit notification */}
            {otpCode.length === 6 && (
              <div className="text-center">
                <p className="text-xs text-green-600 dark:text-green-400 animate-pulse">
                  ✓ Code complete - verifying automatically...
                </p>
              </div>
            )}

            {/* Verify Button */}
            <Button 
              onClick={handleVerifyOTP}
              disabled={otpCode.length !== 6 || isVerifying}
              className={cn(
                "w-full h-12 text-base font-semibold transition-all duration-200",
                verificationType === 'suspicious_location' 
                  ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                  : verificationType === 'inactive'
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  : verificationType === 'registration'
                  ? "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  : "bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700",
                "shadow-lg hover:shadow-xl transform hover:scale-[1.02]",
                "disabled:opacity-50 disabled:transform-none disabled:shadow-none"
              )}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                `Verify & ${verificationType === 'registration' ? 'Get Started' : 'Continue'}`
              )}
            </Button>
          </div>

          {/* Resend Code */}
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-50 dark:bg-slate-900 px-2 text-muted-foreground">
                  Didn't receive it?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGenerateOTP}
              disabled={resendCooldown > 0 || isGenerating}
              className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Code
                </>
              )}
            </Button>
          </div>

          {/* Security Info */}
          <div className="space-y-3">
            {attempts > 2 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Multiple failed attempts detected. Please check your code carefully.
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Expires in 10min</span>
              </div>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{verificationType === 'suspicious_location' ? 'Location Security' : 'Secure verification'}</span>
              </div>
            </div>

            {/* Additional security context */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {getSecurityNote()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationModal;
