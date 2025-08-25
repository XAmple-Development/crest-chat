import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  discriminator: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status: string | null;
  theme: string;
  locale: string;
  timezone: string;
  is_verified: boolean;
  is_bot: boolean;
  is_system: boolean;
  flags: number;
  premium_type: number;
  premium_since: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      subscribeToProfileChanges();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
      } else {
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToProfileChanges = () => {
    if (!user) return;

    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        setError(error.message);
        return null;
      }

      setProfile(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return null;
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    return await updateProfile({ avatar_url: avatarUrl });
  };

  const updateBanner = async (bannerUrl: string) => {
    return await updateProfile({ banner_url: bannerUrl });
  };

  const updateUsername = async (username: string) => {
    return await updateProfile({ username });
  };

  const updateDisplayName = async (displayName: string) => {
    return await updateProfile({ display_name: displayName });
  };

  const updateBio = async (bio: string) => {
    return await updateProfile({ bio });
  };

  const updateStatus = async (status: 'online' | 'idle' | 'dnd' | 'offline') => {
    return await updateProfile({ status });
  };

  const updateCustomStatus = async (customStatus: string) => {
    return await updateProfile({ custom_status: customStatus });
  };

  const updateTheme = async (theme: string) => {
    return await updateProfile({ theme });
  };

  const updateLocale = async (locale: string) => {
    return await updateProfile({ locale });
  };

  const updateTimezone = async (timezone: string) => {
    return await updateProfile({ timezone });
  };

  const getProfileByUsername = async (username: string, discriminator: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('discriminator', discriminator)
        .single();

      if (error) {
        console.error('Error fetching profile by username:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching profile by username:', err);
      return null;
    }
  };

  const getProfileById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile by ID:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching profile by ID:', err);
      return null;
    }
  };

  const searchProfiles = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching profiles:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error searching profiles:', err);
      return [];
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    updateBanner,
    updateUsername,
    updateDisplayName,
    updateBio,
    updateStatus,
    updateCustomStatus,
    updateTheme,
    updateLocale,
    updateTimezone,
    getProfileByUsername,
    getProfileById,
    searchProfiles,
    refetch: fetchProfile,
  };
}
