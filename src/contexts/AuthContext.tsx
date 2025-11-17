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
        
        // For initial session, OTP should NOT be required
        if (initialSession?.user) {
          console.log('Existing session found, OTP not required');
          setOtpRequired(false);
          setVerificationType(null);
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
        
        // Only process SIGNED_IN events that are NOT from initial load
        if (event === 'SIGNED_IN' && session?.user && !isInitialLoad) {
          console.log('New sign in detected, requiring OTP verification');
          setSession(session);
          setUser(session.user);
          setVerificationType('login');
          setOtpRequired(true);
        } 
        else if (event === 'SIGNED_IN' && session?.user && isInitialLoad) {
          console.log('Initial sign in from page load, OTP not required');
          setSession(session);
          setUser(session.user);
          setOtpRequired(false);
          setVerificationType(null);
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
      // Mark OTP as verified in the database
      const { error } = await supabase
        .from('user_otp_verifications')
        .update({ 
          verified_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .is('verified_at', null);

      if (error) {
        console.error('Error completing OTP verification:', error);
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
    
    console.log('Sign in successful - OTP will be required by auth state change');
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
