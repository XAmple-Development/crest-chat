import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username?: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserStatus: (status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        // Update user status to online
        await updateUserStatus('online')
      } else if (event === 'SIGNED_OUT') {
        // Update user status to offline before signing out
        if (user) {
          await updateUserStatus('offline')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateUserStatus = async (status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline') => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user status:', error)
      }
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        throw error
      }

      toast.success('Signed in successfully!')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            display_name: username || email.split('@')[0],
          },
        },
      })

      if (error) {
        toast.error(error.message)
        throw error
      }

      toast.success('Account created successfully! Please check your email to verify your account.')
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Update status to offline before signing out
      if (user) {
        await updateUserStatus('offline')
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error(error.message)
        throw error
      }

      toast.success('Signed out successfully!')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
