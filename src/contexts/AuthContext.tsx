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
  redirectAfterOTP: string | null;
  setRedirectAfterOTP: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [verificationType, setVerificationType] = useState<'login' | 'registration' | 'inactive' | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [redirectAfterOTP, setRedirectAfterOTP] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let initialSessionProcessed = false;

    const initializeAuth = async () => {
      try {
        // Get initial session first
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Initial session loaded:', initialSession?.user?.id);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        // Mark that we've processed the initial session
        initialSessionProcessed = true;
        
        // For initial session, OTP should NOT be required
        if (initialSession?.user) {
          console.log('Existing session found from initial load, OTP not required');
          setOtpRequired(false);
          setVerificationType(null);
        }
        
        setLoading(false);
        setInitialLoadComplete(true);
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        // Update session and user regardless of event
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is from initial load or a new authentication
          if (initialSessionProcessed && initialLoadComplete) {
            // This is a NEW authentication (user just logged in)
            console.log('NEW authentication detected, requiring OTP verification');
            setVerificationType('login');
            setOtpRequired(true);
          } else {
            // This is from initial page load
            console.log('Initial session from page load, OTP not required');
            setOtpRequired(false);
            setVerificationType(null);
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all states');
          setOtpRequired(false);
          setVerificationType(null);
        }
        else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          console.log('Session maintenance event, OTP not required');
          setOtpRequired(false);
          setVerificationType(null);
        }
        else {
          // For all other events, no OTP required
          console.log('Other auth event:', event, '- OTP not required');
          setOtpRequired(false);
          setVerificationType(null);
        }
        
        // Set loading to false if this is the initial session
        if (!initialLoadComplete) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const completeOTPVerification = async () => {
    console.log('OTP verification completed');
    // Store the redirect URL before clearing states
    const redirectUrl = redirectAfterOTP;

    setOtpRequired(false);
    setVerificationType(null);
    setRedirectAfterOTP(null);

    // If there's a redirect URL, handle it here
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
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
      console.log('OTP will be required for verification');
      
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
    completeOTPVerification,
    redirectAfterOTP,
    setRedirectAfterOTP
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
