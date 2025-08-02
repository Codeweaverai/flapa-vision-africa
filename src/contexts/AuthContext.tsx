
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
  checkOTPRequirement: () => Promise<void>;
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
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        await checkOTPRequirement();
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            await checkOTPRequirement();
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setOtpRequired(false);
          setVerificationType(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkOTPRequirement = async () => {
    if (!user) return;

    try {
      // Check if user needs OTP verification using the database function
      const { data, error } = await supabase.rpc('user_needs_otp_verification', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error checking OTP requirement:', error);
        return;
      }

      if (data === true) {
        // Get user profile to determine verification type
        const { data: profile } = await supabase
          .from('profiles')
          .select('otp_verified, last_activity, created_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          let type: 'login' | 'registration' | 'inactive';
          
          if (!profile.otp_verified && !profile.last_activity) {
            type = 'registration'; // New user
          } else if (profile.last_activity) {
            const daysSinceActivity = Math.floor(
              (Date.now() - new Date(profile.last_activity).getTime()) / (1000 * 60 * 60 * 24)
            );
            type = daysSinceActivity >= 10 ? 'inactive' : 'login';
          } else {
            type = 'login';
          }

          setVerificationType(type);
          setOtpRequired(true);
          
          // Update profile to mark OTP as required
          await supabase
            .from('profiles')
            .update({ otp_required: true })
            .eq('id', user.id);
        }
      } else {
        setOtpRequired(false);
        setVerificationType(null);
        
        // Update last activity
        await supabase
          .from('profiles')
          .update({ 
            last_activity: new Date().toISOString(),
            otp_required: false 
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error in checkOTPRequirement:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string }) => {
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
    if (error) throw error;
  };

  const signOut = async () => {
    // Clean up OTP state
    setOtpRequired(false);
    setVerificationType(null);
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
