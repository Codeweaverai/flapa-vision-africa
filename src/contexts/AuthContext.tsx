
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { full_name: string; username: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
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
        throw new Error('Error checking username availability');
      }
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username already exists. Please choose a different username.');
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
          },
        }
      });
      
      if (error) throw error;
      
      toast.success("Account created! Check your email to verify your account.");
      navigate('/');
    } catch (error: any) {
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
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      navigate('/account');
    } catch (error: any) {
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
      toast.error(error.message || "An error occurred during sign out");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
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
