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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if user has verified OTP in the last 24 hours
  const hasRecentOTPVerification = async (userId: string): Promise<boolean> => {
    try {
      const { data: recentVerification, error } = await supabase
        .from('user_otp_verifications')
        .select('verified_at')
        .eq('user_id', userId)
        .not('verified_at', 'is', null)
        .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('verified_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return false;
        }
        console.error('Error checking recent OTP verification:', error);
        return false; // Default to requiring OTP on error
      }

      return !!recentVerification;
    } catch (error) {
      console.error('Error in hasRecentOTPVerification:', error);
      return false; // Default to requiring OTP on error
    }
  };

  // Check if user needs OTP based on various factors
  const shouldRequireOTP = async (userId: string, event: string): Promise<{ required: boolean; type: 'login' | 'registration' | 'inactive' }> => {
    // For signups, always require OTP regardless of recent verification
    if (event === 'SIGNED_UP') {
      return { required: true, type: 'registration' };
    }

    // For logins, check if they have recent verification
    const hasRecentVerification = await hasRecentOTPVerification(userId);
    
    if (hasRecentVerification) {
      console.log('User has OTP verification within 24 hours, skipping OTP');
      return { required: false, type: 'login' };
    }

    // If no recent verification, require OTP for login
    console.log('No recent OTP verification found, requiring OTP');
    return { required: true, type: 'login' };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session first
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session loaded:', initialSession?.user?.id);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        // For initial session, check if OTP is needed
        if (initialSession?.user) {
          const otpCheck = await shouldRequireOTP(initialSession.user.id, 'INITIAL_SESSION');
          if (!otpCheck.required) {
            console.log('Existing session with recent OTP verification, OTP not required');
            setOtpRequired(false);
            setVerificationType(null);
          } else {
            console.log('Existing session needs OTP verification');
            setOtpRequired(true);
            setVerificationType(otpCheck.type);
          }
        }
        
        setLoading(false);
        setIsInitialLoad(false);
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        // Handle SIGNED_IN events that are NOT from initial load
        if (event === 'SIGNED_IN' && session?.user && !isInitialLoad) {
          console.log('New sign in detected, checking OTP requirement');
          
          const otpCheck = await shouldRequireOTP(session.user.id, 'SIGNED_IN');
          
          setSession(session);
          setUser(session.user);
          
          if (otpCheck.required) {
            setVerificationType(otpCheck.type);
            setOtpRequired(true);
            console.log('OTP required for', otpCheck.type);
          } else {
            setOtpRequired(false);
            setVerificationType(null);
            console.log('OTP not required due to recent verification');
          }
        } 
        // Handle initial sign in from page load
        else if (event === 'SIGNED_IN' && session?.user && isInitialLoad) {
          console.log('Initial sign in from page load');
          
          const otpCheck = await shouldRequireOTP(session.user.id, 'INITIAL_SESSION');
          
          setSession(session);
          setUser(session.user);
          
          if (otpCheck.required) {
            setVerificationType(otpCheck.type);
            setOtpRequired(true);
          } else {
            setOtpRequired(false);
            setVerificationType(null);
          }
        }
        // Handle user signed up (new registration)
        else if (event === 'SIGNED_IN' && session?.user) {
          // For new registrations, check if it's a new user by looking at profile creation time
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', session.user.id)
            .single();

          const isNewUser = profile && 
            (new Date().getTime() - new Date(profile.created_at).getTime()) < 5 * 60 * 1000; // Within 5 minutes
          
          if (isNewUser) {
            console.log('New user registration detected, requiring OTP');
            setSession(session);
            setUser(session.user);
            setVerificationType('registration');
            setOtpRequired(true);
          } else {
            const otpCheck = await shouldRequireOTP(session.user.id, 'SIGNED_IN');
            setSession(session);
            setUser(session.user);
            setOtpRequired(otpCheck.required);
            setVerificationType(otpCheck.required ? otpCheck.type : null);
          }
        }
        else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all states');
          setSession(null);
          setUser(null);
          setOtpRequired(false);
          setVerificationType(null);
        }
        else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          console.log('Session updated, no OTP required');
          setSession(session);
          setUser(session?.user ?? null);
          setOtpRequired(false);
          setVerificationType(null);
        }
        else {
          // For other events, update session but don't require OTP
          console.log('Other auth event:', event, '- OTP not required');
          setSession(session);
          setUser(session?.user ?? null);
          setOtpRequired(false);
          setVerificationType(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialLoad]);

  const completeOTPVerification = async () => {
    if (!user) {
      throw new Error('No user to verify');
    }

    try {
      // Create a new OTP verification record with current timestamp
      const { error } = await supabase
        .from('user_otp_verifications')
        .insert({
          user_id: user.id,
          otp_code: '000000', // Placeholder since we're using serverless functions
          verification_type: verificationType || 'login',
          verified_at: new Date().toISOString(),
          expires_at: new Date().toISOString(),
          attempts: 1
        });

      if (error) {
        console.error('Error creating OTP verification record:', error);
        // Continue anyway - don't block the user
      }

      console.log('OTP verification completed for user:', user.id);
      
      // Clear OTP states
      setOtpRequired(false);
      setVerificationType(null);
      
    } catch (error) {
      console.error('Failed to complete OTP verification:', error);
      // Still clear the OTP requirement even if there's an error
      setOtpRequired(false);
      setVerificationType(null);
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
    
    console.log('Sign in successful - OTP requirement will be checked');
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string }) => {
    console.log('Attempting sign up for:', email);
    
    // Reset OTP state before sign up
    setOtpRequired(false);
    setVerificationType(null);
    
    try {
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
        console.error('Sign up auth error:', error);
        
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else {
          throw error;
        }
      }

      console.log('Sign up successful, user:', data.user?.id);
      console.log('OTP will be required for new registration');
      
      return data;
      
    } catch (error: any) {
      console.error('Sign up failed:', error);
      throw error;
    }
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
