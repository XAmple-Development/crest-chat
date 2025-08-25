import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserStatus: (status: 'online' | 'idle' | 'dnd' | 'offline') => Promise<void>;
  updateCustomStatus: (status: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Update user status when they sign in/out
      if (event === 'SIGNED_IN' && session?.user) {
        await updateUserStatus('online');
      } else if (event === 'SIGNED_OUT') {
        // Status will be set to offline by the database trigger
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username?: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (!error) {
      // Update user status to online after successful signup
      await updateUserStatus('online');
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Update user status to online after successful signin
      await updateUserStatus('online');
    }

    return { error };
  };

  const signOut = async () => {
    // Set status to offline before signing out
    if (user) {
      await updateUserStatus('offline');
    }
    
    await supabase.auth.signOut();
  };

  const updateUserStatus = async (status: 'online' | 'idle' | 'dnd' | 'offline') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user status:', error);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateCustomStatus = async (customStatus: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_status: customStatus })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating custom status:', error);
      }
    } catch (error) {
      console.error('Error updating custom status:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserStatus,
    updateCustomStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}