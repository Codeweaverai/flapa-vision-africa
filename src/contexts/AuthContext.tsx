
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
  checkOTPRequirement: (userToCheck?: User) => Promise<void>;
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
        // Use setTimeout to defer OTP check and prevent deadlocks
        setTimeout(async () => {
          await checkOTPRequirement(initialSession.user);
        }, 100);
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
          console.log('User signed in, checking OTP requirement');
          // Use setTimeout to defer OTP check and prevent potential deadlocks
          setTimeout(async () => {
            await checkOTPRequirement(session.user);
          }, 100);
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

  const checkOTPRequirement = async (userToCheck?: User) => {
    const currentUser = userToCheck || user;
    
    if (!currentUser) {
      console.log('No user found for OTP check');
      return;
    }

    try {
      console.log('Checking OTP requirement for user:', currentUser.id);
      
      // Check if user needs OTP verification using the database function
      const { data, error } = await supabase.rpc('user_needs_otp_verification', {
        user_uuid: currentUser.id
      });

      if (error) {
        console.error('Error checking OTP requirement:', error);
        return;
      }

      console.log('OTP requirement check result:', data);

      if (data === true) {
        // Get user profile to determine verification type
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('otp_verified, last_activity, created_at')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // If profile doesn't exist, treat as new user needing registration verification
          console.log('No profile found, setting verification type to registration');
          setVerificationType('registration');
          setOtpRequired(true);
          return;
        }

        if (profile) {
          let type: 'login' | 'registration' | 'inactive';
          
          if (!profile.otp_verified && !profile.last_activity) {
            type = 'registration'; // New user
            console.log('New user detected, needs registration verification');
          } else if (profile.last_activity) {
            const daysSinceActivity = Math.floor(
              (Date.now() - new Date(profile.last_activity).getTime()) / (1000 * 60 * 60 * 24)
            );
            type = daysSinceActivity >= 10 ? 'inactive' : 'login';
            console.log('Existing user, days since activity:', daysSinceActivity, 'type:', type);
          } else {
            type = 'login';
            console.log('User needs login verification');
          }

          console.log('Setting OTP required with type:', type);
          setVerificationType(type);
          setOtpRequired(true);
          
          // Update profile to mark OTP as required
          await supabase
            .from('profiles')
            .update({ otp_required: true })
            .eq('id', currentUser.id);
        } else {
          // No profile exists, create one and set as registration
          console.log('Creating new profile for user');
          await supabase
            .from('profiles')
            .insert({ 
              id: currentUser.id,
              otp_required: true,
              otp_verified: false 
            });
          setVerificationType('registration');
          setOtpRequired(true);
        }
      } else {
        console.log('OTP not required, updating last activity');
        setOtpRequired(false);
        setVerificationType(null);
        
        // Update last activity
        await supabase
          .from('profiles')
          .upsert({ 
            id: currentUser.id,
            last_activity: new Date().toISOString(),
            otp_required: false 
          });
      }
    } catch (error) {
      console.error('Error in checkOTPRequirement:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    console.log('Sign in successful');
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string }) => {
    console.log('Attempting sign up for:', email);
    const signUpOptions: any = {
      email,
      password,
    };

    if (metadata) {
      signUpOptions.options = {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`
      };
    } else {
      signUpOptions.options = {
        emailRedirectTo: `${window.location.origin}/`
      };
    }

    const { error } = await supabase.auth.signUp(signUpOptions);
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    console.log('Sign up successful');
  };

  const signOut = async () => {
    console.log('Signing out user');
    // Clean up OTP state
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
    checkOTPRequirement
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
