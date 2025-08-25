import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Server {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
  is_public: boolean;
  is_verified: boolean;
  member_count: number;
  max_members: number;
  boost_level: number;
  boost_count: number;
  invite_code: string | null;
  default_channel_id: string | null;
  system_channel_id: string | null;
  rules_channel_id: string | null;
  public_updates_channel_id: string | null;
  afk_channel_id: string | null;
  afk_timeout: number;
  verification_level: number;
  explicit_content_filter: number;
  premium_tier: number;
  created_at: string;
  updated_at: string;
  channels?: Channel[];
  roles?: ServerRole[];
  members?: ServerMember[];
}

export interface Channel {
  id: string;
  server_id: string | null;
  name: string;
  description: string | null;
  type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum';
  position: number;
  is_private: boolean;
  is_nsfw: boolean;
  is_announcement: boolean;
  is_pinned: boolean;
  parent_id: string | null;
  topic: string | null;
  rate_limit_per_user: number;
  bitrate: number;
  user_limit: number;
  rtc_region: string | null;
  video_quality_mode: number;
  created_at: string;
  updated_at: string;
}

export interface ServerRole {
  id: string;
  server_id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: number;
  mentionable: boolean;
  managed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  joined_at: string;
  premium_since: string | null;
  is_deafened: boolean;
  is_muted: boolean;
  is_streaming: boolean;
  is_video: boolean;
  roles?: ServerRole[];
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    status: 'online' | 'idle' | 'dnd' | 'offline';
  };
}

export function useServers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchServers();
      subscribeToServerChanges();
    } else {
      setServers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchServers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('servers')
        .select(`
          *,
          channels (*),
          server_roles (*),
          server_members (
            *,
            profiles (
              username,
              display_name,
              avatar_url,
              status
            )
          )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching servers:', error);
        setError(error.message);
      } else {
        setServers(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError('Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToServerChanges = () => {
    if (!user) return;

    const subscription = supabase
      .channel('server_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servers',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setServers(prev => [...prev, payload.new as Server]);
          } else if (payload.eventType === 'UPDATE') {
            setServers(prev => prev.map(server => 
              server.id === payload.new.id ? payload.new as Server : server
            ));
          } else if (payload.eventType === 'DELETE') {
            setServers(prev => prev.filter(server => server.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const createServer = async (serverData: {
    name: string;
    description?: string;
    icon_url?: string;
    is_public?: boolean;
  }) => {
    if (!user) return null;

    try {
      // First, ensure user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User profile not found. Please try again."
        });
        return null;
      }

      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();

      const { data, error } = await supabase
        .from('servers')
        .insert({
          ...serverData,
          owner_id: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating server:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      // Create default channels
      await createDefaultChannels(data.id);

      toast({
        title: "Server created",
        description: `${serverData.name} has been created successfully.`
      });

      return data;
    } catch (err) {
      console.error('Error creating server:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create server"
      });
      return null;
    }
  };

  const createDefaultChannels = async (serverId: string) => {
    const defaultChannels = [
      { name: 'general', type: 'text' as const, position: 0 },
      { name: 'announcements', type: 'announcement' as const, position: 1 },
      { name: 'General', type: 'voice' as const, position: 2 },
    ];

    for (const channel of defaultChannels) {
      await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name: channel.name,
          type: channel.type,
          position: channel.position,
        });
    }
  };

  const updateServer = async (serverId: string, updates: Partial<Server>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('servers')
        .update(updates)
        .eq('id', serverId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating server:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Server updated",
        description: "Server has been updated successfully."
      });

      return data;
    } catch (err) {
      console.error('Error updating server:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update server"
      });
      return null;
    }
  };

  const deleteServer = async (serverId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error deleting server:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Server deleted",
        description: "Server has been deleted successfully."
      });

      return true;
    } catch (err) {
      console.error('Error deleting server:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete server"
      });
      return false;
    }
  };

  const joinServer = async (inviteCode: string) => {
    if (!user) return null;

    try {
      // Find server by invite code
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (serverError || !server) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid invite code"
        });
        return null;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('server_members')
        .select('*')
        .eq('server_id', server.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this server."
        });
        return server;
      }

      // Add user to server
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id,
        });

      if (memberError) {
        console.error('Error joining server:', memberError);
        toast({
          variant: "destructive",
          title: "Error",
          description: memberError.message
        });
        return null;
      }

      toast({
        title: "Joined server",
        description: `You have joined ${server.name}.`
      });

      return server;
    } catch (err) {
      console.error('Error joining server:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join server"
      });
      return null;
    }
  };

  const leaveServer = async (serverId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', serverId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving server:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Left server",
        description: "You have left the server."
      });

      return true;
    } catch (err) {
      console.error('Error leaving server:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave server"
      });
      return false;
    }
  };

  const getServerById = async (serverId: string) => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select(`
          *,
          channels (*),
          server_roles (*),
          server_members (
            *,
            profiles (
              username,
              display_name,
              avatar_url,
              status
            )
          )
        `)
        .eq('id', serverId)
        .single();

      if (error) {
        console.error('Error fetching server:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching server:', err);
      return null;
    }
  };

  return {
    servers,
    loading,
    error,
    createServer,
    updateServer,
    deleteServer,
    joinServer,
    leaveServer,
    getServerById,
    refetch: fetchServers,
  };
}

export function useChannels(serverId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serverId) {
      fetchChannels();
      subscribeToChannelChanges();
    } else {
      setChannels([]);
      setLoading(false);
    }
  }, [serverId]);

  const fetchChannels = async () => {
    if (!serverId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching channels:', error);
      } else {
        setChannels(data || []);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChannelChanges = () => {
    if (!serverId) return;

    const subscription = supabase
      .channel('channel_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `server_id=eq.${serverId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setChannels(prev => [...prev, payload.new as Channel]);
          } else if (payload.eventType === 'UPDATE') {
            setChannels(prev => prev.map(channel => 
              channel.id === payload.new.id ? payload.new as Channel : channel
            ));
          } else if (payload.eventType === 'DELETE') {
            setChannels(prev => prev.filter(channel => channel.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return {
    channels,
    loading,
  };
}