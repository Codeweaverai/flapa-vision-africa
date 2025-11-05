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
  verificationType: 'login' | 'registration' | 'inactive' | 'suspicious_location' | null;
  checkOTPRequirement: (userToCheck?: User, isNewLogin?: boolean) => Promise<void>;
  generateOTP: (userId: string, email: string, type: 'login' | 'registration' | 'inactive' | 'suspicious_location') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to get user's IP address
const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP address:', error);
    // Fallback: generate a session-based identifier
    return `session-${Math.random().toString(36).substr(2, 9)}`;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [verificationType, setVerificationType] = useState<'login' | 'registration' | 'inactive' | 'suspicious_location' | null>(null);
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Generate OTP using your existing edge function
  const generateOTP = async (userId: string, email: string, type: 'login' | 'registration' | 'inactive' | 'suspicious_location') => {
    try {
      console.log(`Requesting OTP generation for ${email} (${type})`);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error('No active session found');
      }

      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationType: type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate OTP');
      }

      const result = await response.json();
      console.log('OTP generation successful:', result.message);
      
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
  };

  // Check if IP address has changed and trigger OTP if it has
  const checkIPChange = async (userId: string): Promise<boolean> => {
    try {
      const userIP = await getUserIP();
      console.log('Current IP:', userIP);
      
      // Get the last known IP from user's profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('last_known_ip')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile for IP check:', error);
        // First time, store the IP
        await supabase
          .from('profiles')
          .update({ last_known_ip: userIP })
          .eq('id', userId);
        return false;
      }

      // Check if IP has changed
      const ipChanged = profile.last_known_ip !== userIP;
      
      if (ipChanged) {
        console.log(`IP address changed from ${profile.last_known_ip} to ${userIP}`);
        // Update the IP in database
        await supabase
          .from('profiles')
          .update({ last_known_ip: userIP })
          .eq('id', userId);
        
        // Trigger OTP for suspicious location
        setVerificationType('suspicious_location');
        setOtpRequired(true);
        await generateOTP(userId, user?.email!, 'suspicious_location');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking IP change:', error);
      return false;
    }
  };

  // Helper function to update last activity without triggering OTP
  const updateLastActivity = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          last_activity: new Date().toISOString(),
          otp_required: false 
        });
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  useEffect(() => {
    // Get user's IP address on initial load
    getUserIP().then(ip => {
      setCurrentIP(ip);
    });

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log('Initial session loaded:', initialSession?.user?.id);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        // Check if this is a fresh login (has recent login timestamp)
        const hasRecentLogin = localStorage.getItem('hasRecentLogin') === 'true';
        
        if (hasRecentLogin) {
          console.log('Fresh login detected, requiring OTP');
          // This is a fresh login - require OTP
          await triggerOTPForLogin(initialSession.user);
        } else {
          console.log('Existing session, checking for IP changes only');
          // This is an existing session - only check IP changes
          const ipChanged = await checkIPChange(initialSession.user.id);
          if (!ipChanged) {
            // No IP change, just update activity and don't show OTP
            await updateLastActivity(initialSession.user.id);
          }
        }
        
        // Clear the recent login flag after processing
        localStorage.removeItem('hasRecentLogin');
      }
      
      setIsInitialLoad(false);
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
          console.log('User signed in, setting recent login flag');
          // Set flag to indicate this is a fresh login
          localStorage.setItem('hasRecentLogin', 'true');
          
          // Trigger OTP for the fresh login
          setTimeout(async () => {
            await triggerOTPForLogin(session.user!);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing OTP state');
          setOtpRequired(false);
          setVerificationType(null);
          localStorage.removeItem('hasRecentLogin');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refresh - check for IP changes but don't trigger OTP for normal refreshes
          console.log('Token refreshed, checking IP changes');
          await checkIPChange(session.user.id);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Separate function to trigger OTP for login scenarios
  const triggerOTPForLogin = async (currentUser: User) => {
    try {
      console.log('Triggering OTP for login:', currentUser.id);
      
      // Get user profile to determine verification type
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('otp_verified, last_activity, created_at')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setVerificationType('registration');
        setOtpRequired(true);
        await generateOTP(currentUser.id, currentUser.email!, 'registration');
        return;
      }

      let type: 'login' | 'registration' | 'inactive' | 'suspicious_location' = 'login';
      
      if (profile) {
        if (!profile.otp_verified && !profile.last_activity) {
          type = 'registration';
          console.log('New user detected, needs registration verification');
        } else if (profile.last_activity) {
          const daysSinceActivity = Math.floor(
            (Date.now() - new Date(profile.last_activity).getTime()) / (1000 * 60 * 60 * 24)
          );
          type = daysSinceActivity >= 10 ? 'inactive' : 'login';
          console.log('Existing user, days since activity:', daysSinceActivity, 'type:', type);
        }
      } else {
        // No profile exists
        type = 'registration';
        await supabase
          .from('profiles')
          .insert({ 
            id: currentUser.id,
            otp_required: true,
            otp_verified: false 
          });
      }

      console.log('Setting OTP required with type:', type);
      setVerificationType(type);
      setOtpRequired(true);
      await generateOTP(currentUser.id, currentUser.email!, type);
      
      // Update profile
      await supabase
        .from('profiles')
        .update({ 
          otp_required: true,
          last_activity: new Date().toISOString()
        })
        .eq('id', currentUser.id);

    } catch (error) {
      console.error('Error in triggerOTPForLogin:', error);
    }
  };

  const checkOTPRequirement = async (userToCheck?: User, isNewLogin: boolean = false) => {
    const currentUser = userToCheck || user;
    
    if (!currentUser) {
      console.log('No user found for OTP check');
      return;
    }

    // For explicit OTP checks, trigger OTP
    await triggerOTPForLogin(currentUser);
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful, user:', data.user?.id);
    
    // The auth state change listener will handle OTP requirement
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

    const { data, error } = await supabase.auth.signUp(signUpOptions);
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    
    console.log('Sign up successful, user:', data.user?.id);
    
    // The auth state change listener will handle OTP when they confirm email
  };

  const signOut = async () => {
    console.log('Signing out user');
    // Clean up OTP state
    setOtpRequired(false);
    setVerificationType(null);
    localStorage.removeItem('hasRecentLogin');
    
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
    checkOTPRequirement,
    generateOTP
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
