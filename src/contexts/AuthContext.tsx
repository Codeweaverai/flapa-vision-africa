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
      setOtpRequired(false);
      setVerificationType(null);
    } catch (error) {
      console.error('Error in handleExistingSession:', error);
      setVerificationType('login');
      setOtpRequired(true);
    }
  };

  const handleNewAuthentication = async (user: User, event: string) => {
    const type = event === 'SIGNED_IN' ? 'login' : 'registration';
    
    setVerificationType(type);
    setOtpRequired(true);
  };

  const completeOTPVerification = async () => {
    if (!user) {
      throw new Error('No user to verify');
    }

    try {
      // Mark OTP as verified
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
      setOtpRequired(false);
      setVerificationType(null);
      
    } catch (error) {
      console.error('Failed to complete OTP verification:', error);
      setOtpRequired(false);
      setVerificationType(null);
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
      // Create auth user - the trigger will automatically create the profile
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
        } else if (error.message.includes('Database error')) {
          // With the trigger in place, this should no longer happen
          throw new Error('Unable to create account. Please try again.');
        } else {
          throw error;
        }
      }

      console.log('Sign up successful, user:', data.user?.id);
      console.log('Profile should be created automatically by trigger');
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
