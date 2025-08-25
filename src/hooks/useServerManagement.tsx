import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
  roles?: {
    id: string;
    name: string;
    color: number;
    position: number;
    permissions: number;
  }[];
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    status: 'online' | 'idle' | 'dnd' | 'offline';
  };
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

export function useServerManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Update server details
  const updateServer = async (serverId: string, updates: {
    name?: string;
    description?: string;
    icon_url?: string;
    banner_url?: string;
    is_public?: boolean;
    verification_level?: number;
    explicit_content_filter?: number;
    afk_timeout?: number;
  }) => {
    if (!user) return null;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Create new channel
  const createChannel = async (serverId: string, channelData: {
    name: string;
    description?: string;
    type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum';
    is_private?: boolean;
    is_nsfw?: boolean;
    parent_id?: string;
    topic?: string;
    rate_limit_per_user?: number;
    bitrate?: number;
    user_limit?: number;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Get the highest position for new channel
      const { data: existingChannels } = await supabase
        .from('channels')
        .select('position')
        .eq('server_id', serverId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = (existingChannels?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name: channelData.name,
          description: channelData.description,
          type: channelData.type,
          position: newPosition,
          is_private: channelData.is_private || false,
          is_nsfw: channelData.is_nsfw || false,
          parent_id: channelData.parent_id,
          topic: channelData.topic,
          rate_limit_per_user: channelData.rate_limit_per_user || 0,
          bitrate: channelData.bitrate || 64000,
          user_limit: channelData.user_limit || 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating channel:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Channel created",
        description: `Channel #${channelData.name} has been created.`
      });

      return data;
    } catch (err) {
      console.error('Error creating channel:', err);
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
    is_nsfw?: boolean;
    topic?: string;
    rate_limit_per_user?: number;
    bitrate?: number;
    user_limit?: number;
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
        console.error('Error updating channel:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Channel updated",
        description: "Channel has been updated successfully."
      });

      return data;
    } catch (err) {
      console.error('Error updating channel:', err);
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
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) {
        console.error('Error deleting channel:', error);
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
    } catch (err) {
      console.error('Error deleting channel:', err);
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
            avatar_url,
            status
          ),
          member_roles (
            server_roles (
              id,
              name,
              color,
              position,
              permissions
            )
          )
        `)
        .eq('server_id', serverId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching server members:', error);
        return [];
      }

      return data?.map(member => ({
        ...member,
        roles: member.member_roles?.map((mr: any) => mr.server_roles) || [],
        profile: member.profiles,
      })) || [];
    } catch (err) {
      console.error('Error fetching server members:', err);
      return [];
    }
  };

  // Update member role
  const updateMemberRole = async (serverId: string, userId: string, roleId: string, action: 'add' | 'remove') => {
    if (!user) return false;

    setLoading(true);
    try {
      // Get member ID
      const { data: member } = await supabase
        .from('server_members')
        .select('id')
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Member not found"
        });
        return false;
      }

      if (action === 'add') {
        const { error } = await supabase
          .from('member_roles')
          .insert({
            member_id: member.id,
            role_id: roleId,
          });

        if (error) {
          console.error('Error adding role to member:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message
          });
          return false;
        }
      } else {
        const { error } = await supabase
          .from('member_roles')
          .delete()
          .eq('member_id', member.id)
          .eq('role_id', roleId);

        if (error) {
          console.error('Error removing role from member:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message
          });
          return false;
        }
      }

      toast({
        title: "Role updated",
        description: `Role has been ${action === 'add' ? 'added to' : 'removed from'} member.`
      });

      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update member role"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove member from server
  const removeMember = async (serverId: string, userId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', serverId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
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
    } catch (err) {
      console.error('Error removing member:', err);
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

  // Ban member from server
  const banMember = async (serverId: string, userId: string, reason?: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      // First remove from server
      await removeMember(serverId, userId);

      // Then add to audit log
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          server_id: serverId,
          user_id: user.id,
          target_id: userId,
          target_type: 'user',
          action_type: 'ban',
          reason: reason || 'No reason provided',
        });

      if (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      toast({
        title: "Member banned",
        description: "Member has been banned from the server."
      });

      return true;
    } catch (err) {
      console.error('Error banning member:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to ban member"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create server role
  const createRole = async (serverId: string, roleData: {
    name: string;
    color?: number;
    hoist?: boolean;
    permissions?: number;
    mentionable?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Get the highest position for new role
      const { data: existingRoles } = await supabase
        .from('server_roles')
        .select('position')
        .eq('server_id', serverId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = (existingRoles?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('server_roles')
        .insert({
          server_id: serverId,
          name: roleData.name,
          color: roleData.color || 0,
          hoist: roleData.hoist || false,
          position: newPosition,
          permissions: roleData.permissions || 0,
          mentionable: roleData.mentionable || false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Role created",
        description: `Role ${roleData.name} has been created.`
      });

      return data;
    } catch (err) {
      console.error('Error creating role:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create role"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update server role
  const updateRole = async (roleId: string, updates: {
    name?: string;
    color?: number;
    hoist?: boolean;
    permissions?: number;
    mentionable?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('server_roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Role updated",
        description: "Role has been updated successfully."
      });

      return data;
    } catch (err) {
      console.error('Error updating role:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete server role
  const deleteRole = async (roleId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('server_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        console.error('Error deleting role:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully."
      });

      return true;
    } catch (err) {
      console.error('Error deleting role:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete role"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete server
  const deleteServer = async (serverId: string) => {
    if (!user) return false;

    setLoading(true);
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
    banMember,
    createRole,
    updateRole,
    deleteRole,
    deleteServer,
  };
}
