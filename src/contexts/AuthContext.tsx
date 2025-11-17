import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; username?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  otpRequired: boolean;
  setOtpRequired: (required: boolean) => void;
  verificationType: 'login' | 'registration' | 'inactive' | null;
  completeOTPVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [verificationType, setVerificationType] = useState<'login' | 'registration' | 'inactive' | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log('Initial session loaded:', initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      // For existing sessions, check if OTP verification is needed
      if (initialSession?.user) {
        await handleExistingSession(initialSession.user);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, requiring OTP verification');
          // Always require OTP for every login/signup
          await handleNewAuthentication(session.user, event);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing OTP state');
          setOtpRequired(false);
          setVerificationType(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleExistingSession = async (user: User) => {
    try {
      // Check for valid, unexpired OTP verification in user_otp_verifications table
      const { data: activeOtp, error } = await supabase
        .from('user_otp_verifications')
        .select('*')
        .eq('user_id', user.id)
        .is('verified_at', null) // Not verified yet
        .gt('expires_at', new Date().toISOString()) // Not expired
        .lt('attempts', 5) // Under max attempts
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking OTP verifications:', error);
        // On error, require OTP for security
        setVerificationType('login');
        setOtpRequired(true);
        return;
      }

      if (activeOtp) {
        // Active OTP verification exists and needs completion
        console.log('Active OTP verification found:', activeOtp.verification_type);
        setVerificationType(activeOtp.verification_type as 'login' | 'registration' | 'inactive');
        setOtpRequired(true);
      } else {
        // No active OTP found, check if we need to create one for daily requirement
        const needsDailyOTP = await shouldRequireDailyOTP(user.id);
        
        if (needsDailyOTP) {
          console.log('Daily OTP requirement triggered');
          setVerificationType('login');
          setOtpRequired(true);
        } else {
          // User is fully verified for current session
          setOtpRequired(false);
          setVerificationType(null);
        }
      }

    } catch (error) {
      console.error('Error in handleExistingSession:', error);
      // On error, require OTP for security
      setVerificationType('login');
      setOtpRequired(true);
    }
  };

  const handleNewAuthentication = async (user: User, event: string) => {
    // Always require OTP for new authentications (login/signup)
    const type = event === 'SIGNED_IN' ? 'login' : 'registration';
    
    setVerificationType(type);
    setOtpRequired(true);
    
    // Clean up any existing OTP verifications for this user
    try {
      await supabase
        .from('user_otp_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('verified_at', null);
    } catch (error) {
      console.error('Error cleaning up old OTP verifications:', error);
    }
  };

  const shouldRequireDailyOTP = async (userId: string): Promise<boolean> => {
    try {
      // Check the most recent successful OTP verification
      const { data: lastVerification, error } = await supabase
        .from('user_otp_verifications')
        .select('verified_at')
        .eq('user_id', userId)
        .not('verified_at', 'is', null)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking last OTP verification:', error);
        return true; // Require OTP on error
      }

      if (!lastVerification) {
        // No previous OTP verification found
        return true;
      }

      // Check if last verification was within 24 hours
      const lastVerified = new Date(lastVerification.verified_at);
      const now = new Date();
      const hoursSinceLastOTP = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60);
      
      // Require OTP every 24 hours
      return hoursSinceLastOTP >= 24;
      
    } catch (error) {
      console.error('Error in shouldRequireDailyOTP:', error);
      return true; // Require OTP on error
    }
  };

  const completeOTPVerification = async () => {
    if (!user) {
      throw new Error('No user to verify');
    }

    try {
      // Mark all active OTP verifications as verified
      const { error } = await supabase
        .from('user_otp_verifications')
        .update({ 
          verified_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .is('verified_at', null);

      if (error) {
        console.error('Error completing OTP verification:', error);
        throw error;
      }

      console.log('OTP verification completed for user:', user.id);
      setOtpRequired(false);
      setVerificationType(null);
      
    } catch (error) {
      console.error('Failed to complete OTP verification:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    // Reset OTP state before sign in
    setOtpRequired(false);
    setVerificationType(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful - OTP will be required');
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string }) => {
    console.log('Attempting sign up for:', email);
    
    // Reset OTP state before sign up
    setOtpRequired(false);
    setVerificationType(null);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          username: metadata?.username || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      
      if (error.message.includes('Database error saving new user')) {
        throw new Error('Unable to create user account. Please try again.');
      } else if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else {
        throw error;
      }
    }

    console.log('Sign up successful, user:', data.user?.id);
    console.log('OTP will be required for verification');
    
    return data;
  };

  const signOut = async () => {
    console.log('Signing out user');
    setOtpRequired(false);
    setVerificationType(null);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    console.log('Sign out successful');
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    otpRequired,
    setOtpRequired,
    verificationType,
    completeOTPVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
