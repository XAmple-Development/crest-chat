import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  nickname?: string;
  joined_at: string;
  profiles: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export function useServerManagement() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Update server details
  const updateServer = async (serverId: string, updates: {
    name?: string;
    description?: string;
    icon_url?: string;
    is_public?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servers')
        .update(updates)
        .eq('id', serverId)
        .eq('owner_id', user.id) // Only owner can update server
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Server updated",
        description: "Server details have been updated successfully."
      });

      return data;
    } catch (error) {
      console.error('Error updating server:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update server"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new channel
  const createChannel = async (serverId: string, channelData: {
    name: string;
    description?: string;
    type: 'text' | 'voice';
    is_private?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Get current highest position
      const { data: existingChannels } = await supabase
        .from('channels')
        .select('position')
        .eq('server_id', serverId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = existingChannels?.[0]?.position + 1 || 0;

      const { data, error } = await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name: channelData.name,
          description: channelData.description,
          type: channelData.type,
          position: newPosition,
          is_private: channelData.is_private || false
        })
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Channel created",
        description: `#${channelData.name} has been created.`
      });

      return data;
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create channel"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update channel
  const updateChannel = async (channelId: string, updates: {
    name?: string;
    description?: string;
    is_private?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelId)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Channel updated",
        description: "Channel details have been updated."
      });

      return data;
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update channel"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete channel
  const deleteChannel = async (channelId: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Channel deleted",
        description: "Channel has been deleted successfully."
      });

      return true;
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete channel"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get server members
  const getServerMembers = async (serverId: string): Promise<ServerMember[]> => {
    try {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('server_id', serverId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching server members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching server members:', error);
      return [];
    }
  };

  // Update member role
  const updateMemberRole = async (serverId: string, userId: string, role: 'admin' | 'moderator' | 'member') => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('server_members')
        .update({ role })
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Role updated",
        description: "Member role has been updated."
      });

      return data;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update member role"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Remove member from server
  const removeMember = async (serverId: string, userId: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', serverId)
        .eq('user_id', userId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Member removed",
        description: "Member has been removed from the server."
      });

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete server
  const deleteServer = async (serverId: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId)
        .eq('owner_id', user.id); // Only owner can delete

      if (error) {
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
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete server"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateServer,
    createChannel,
    updateChannel,
    deleteChannel,
    getServerMembers,
    updateMemberRole,
    removeMember,
    deleteServer
  };
}
