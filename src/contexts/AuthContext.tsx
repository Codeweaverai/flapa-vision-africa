
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authInitialized: boolean;
  signUp: (email: string, password: string, userData: { full_name: string; username: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  // Clean up auth state helper
  const cleanupAuthState = () => {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    // Remove from sessionStorage if in use
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Defer data fetch to prevent deadlocks
          setTimeout(() => {
            toast.success("Welcome! You have successfully signed in.");
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          toast.info("You have successfully signed out.");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: { full_name: string; username: string }) => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      setLoading(true);
      
      // Check if username already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', userData.username)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking username:', checkError);
        throw new Error('Error checking username availability');
      }
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username already exists. Please choose a different username.');
      }
      
      console.log('Signing up with:', { email, userData });
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
          },
          emailRedirectTo: window.location.origin + '/account',
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      
      console.log('Sign up successful:', data);
      toast.success("Account created! Check your email to verify your account.");
      navigate('/');
    } catch (error: any) {
      console.error('Sign up error catch:', error);
      toast.error(error.message || "An error occurred during sign up");
      throw error; // Re-throw to allow component to handle it
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      setLoading(true);
      console.log('Signing in with:', { email });
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data);
      navigate('/account');
    } catch (error: any) {
      console.error('Sign in error catch:', error);
      toast.error(error.message || "An error occurred during sign in");
      throw error; // Re-throw to allow component to handle it
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      setLoading(true);
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force a page reload to ensure clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || "An error occurred during sign out");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add updateUser function to update the user data
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    session,
    loading,
    authInitialized,
    signUp,
    signIn,
    signOut,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
