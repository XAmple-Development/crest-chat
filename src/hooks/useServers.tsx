import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  owner_id: string;
  invite_code: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice';
  position: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchServers = async () => {
      const { data, error } = await supabase
        .from('servers')
        .select(`
          *,
          server_members!inner(user_id)
        `)
        .eq('server_members.user_id', user.id);

      if (error) {
        console.error('Error fetching servers:', error);
        return;
      }

      setServers(data || []);
      setLoading(false);
    };

    fetchServers();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('servers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'servers'
      }, () => {
        fetchServers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'server_members'
      }, () => {
        fetchServers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const createServer = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      // First, ensure the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.substring(0, 8)}`,
            display_name: user.email?.split('@')[0] || `User ${user.id.substring(0, 8)}`
          });

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          throw new Error('Failed to create user profile');
        }
      }

      // Create the server
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name,
          description,
          owner_id: user.id
        })
        .select()
        .single();

      if (serverError) {
        console.error('Error creating server:', serverError);
        throw new Error('Failed to create server');
      }

      // Add owner as member
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding owner as member:', memberError);
        // Don't throw here, as the server was created successfully
      }

      // Create default channels
      const { error: channelError } = await supabase
        .from('channels')
        .insert([
          {
            server_id: server.id,
            name: 'general',
            type: 'text',
            position: 0
          },
          {
            server_id: server.id,
            name: 'General Voice',
            type: 'voice',
            position: 1
          }
        ]);

      if (channelError) {
        console.error('Error creating default channels:', channelError);
        // Don't throw here, as the server was created successfully
      }

      return server;
    } catch (error) {
      console.error('Error in createServer:', error);
      throw error;
    }
  };

  return {
    servers,
    loading,
    createServer
  };
}

export function useChannels(serverId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position');

      if (error) {
        console.error('Error fetching channels:', error);
        return;
      }

      setChannels(data || []);
      setLoading(false);
    };

    fetchChannels();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels',
        filter: `server_id=eq.${serverId}`
      }, () => {
        fetchChannels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [serverId]);

  return { channels, loading };
}