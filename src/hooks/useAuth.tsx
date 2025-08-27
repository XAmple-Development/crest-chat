import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthUser {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url?: string
  status: string
  created_at: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (authUser: User) => {
    try {
      // First try to get from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile && !profileError) {
        // Profile exists, use it
        setUser({
          id: profile.id,
          email: authUser.email || '',
          username: profile.username,
          display_name: profile.display_name || profile.username,
          avatar_url: profile.avatar_url,
          status: profile.status,
          created_at: profile.created_at
        })
        return
      }

      // Profile doesn't exist, create one
      console.log('Profile not found, creating one...')
      const username = authUser.email?.split('@')[0] || 'user'
      const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          username: cleanUsername,
          discriminator: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
          display_name: authUser.user_metadata?.full_name || cleanUsername,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          status: 'online',
          theme: 'dark',
          locale: 'en-US',
          timezone: 'UTC',
          is_verified: false,
          is_bot: false,
          is_system: false,
          flags: 0,
          premium_type: 0,
          premium_since: null,
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (newProfile && !createError) {
        setUser({
          id: newProfile.id,
          email: authUser.email || '',
          username: newProfile.username,
          display_name: newProfile.display_name || newProfile.username,
          avatar_url: newProfile.avatar_url,
          status: newProfile.status,
          created_at: newProfile.created_at
        })
      } else {
        // Fallback: use auth user data directly
        console.warn('Failed to create profile, using auth data:', createError)
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          username: cleanUsername,
          display_name: authUser.user_metadata?.full_name || cleanUsername,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          status: 'online',
          created_at: authUser.created_at
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      // Fallback: use auth user data directly
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        username: authUser.email?.split('@')[0] || 'user',
        display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'user',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        status: 'online',
        created_at: authUser.created_at
      })
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user
  }
}
