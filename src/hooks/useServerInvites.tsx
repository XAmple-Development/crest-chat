import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Invite {
  id: string;
  code: string;
  server_id: string;
  channel_id: string;
  inviter_id: string;
  max_uses: number;
  uses: number;
  max_age: number;
  is_temporary: boolean;
  expires_at: string | null;
  created_at: string;
  server?: {
    name: string;
    icon_url: string | null;
    member_count: number;
  };
  channel?: {
    name: string;
    type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum';
  };
  inviter?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useServerInvites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateInviteCode = async (serverId: string, channelId: string, options?: {
    max_uses?: number;
    max_age?: number;
    is_temporary?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Generate a unique invite code
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      // Calculate expiration date if max_age is provided
      const expires_at = options?.max_age && options.max_age > 0 
        ? new Date(Date.now() + options.max_age * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('invites')
        .insert({
          code,
          server_id: serverId,
          channel_id: channelId,
          inviter_id: user.id,
          max_uses: options?.max_uses || 0,
          max_age: options?.max_age || 0,
          is_temporary: options?.is_temporary || false,
          expires_at,
        })
        .select(`
          *,
          servers (
            name,
            icon_url,
            member_count
          ),
          channels (
            name,
            type
          ),
          profiles!invites_inviter_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error generating invite code:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Invite created",
        description: `Invite code ${code} has been created.`
      });

      return {
        ...data,
        server: data.servers,
        channel: data.channels,
        inviter: data.profiles,
      } as Invite;
    } catch (err) {
      console.error('Error generating invite code:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invite code"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinServerByInvite = async (inviteCode: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      // First, get the invite details
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select(`
          *,
          servers (
            name,
            icon_url,
            member_count
          ),
          channels (
            name,
            type
          ),
          profiles!invites_inviter_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('code', inviteCode)
        .single();

      if (inviteError || !invite) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid invite code"
        });
        return null;
      }

      // Check if invite has expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This invite has expired"
        });
        return null;
      }

      // Check if invite has reached max uses
      if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This invite has reached its maximum uses"
        });
        return null;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('server_members')
        .select('*')
        .eq('server_id', invite.server_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this server."
        });
        return {
          ...invite,
          server: invite.servers,
          channel: invite.channels,
          inviter: invite.profiles,
        } as Invite;
      }

      // Add user to server
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: invite.server_id,
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

      // Increment invite uses
      await supabase
        .from('invites')
        .update({ uses: invite.uses + 1 })
        .eq('id', invite.id);

      toast({
        title: "Joined server",
        description: `You have joined ${invite.servers.name}.`
      });

      return {
        ...invite,
        server: invite.servers,
        channel: invite.channels,
        inviter: invite.profiles,
      } as Invite;
    } catch (err) {
      console.error('Error joining server by invite:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join server"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getInviteByCode = async (inviteCode: string) => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select(`
          *,
          servers (
            name,
            icon_url,
            member_count
          ),
          channels (
            name,
            type
          ),
          profiles!invites_inviter_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('code', inviteCode)
        .single();

      if (error) {
        console.error('Error fetching invite:', error);
        return null;
      }

      return {
        ...data,
        server: data.servers,
        channel: data.channels,
        inviter: data.profiles,
      } as Invite;
    } catch (err) {
      console.error('Error fetching invite:', err);
      return null;
    }
  };

  const getServerInvites = async (serverId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('invites')
        .select(`
          *,
          channels (
            name,
            type
          ),
          profiles!invites_inviter_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('server_id', serverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching server invites:', error);
        return [];
      }

      return data?.map(invite => ({
        ...invite,
        channel: invite.channels,
        inviter: invite.profiles,
      })) || [];
    } catch (err) {
      console.error('Error fetching server invites:', err);
      return [];
    }
  };

  const deleteInvite = async (inviteId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('Error deleting invite:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Invite deleted",
        description: "Invite has been deleted successfully."
      });

      return true;
    } catch (err) {
      console.error('Error deleting invite:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invite"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateInvite = async (inviteId: string, updates: {
    max_uses?: number;
    max_age?: number;
    is_temporary?: boolean;
  }) => {
    if (!user) return null;

    setLoading(true);
    try {
      // Calculate new expiration date if max_age is being updated
      let expires_at = null;
      if (updates.max_age !== undefined) {
        if (updates.max_age > 0) {
          expires_at = new Date(Date.now() + updates.max_age * 1000).toISOString();
        }
      }

      const { data, error } = await supabase
        .from('invites')
        .update({
          ...updates,
          ...(expires_at !== null && { expires_at }),
        })
        .eq('id', inviteId)
        .select()
        .single();

      if (error) {
        console.error('Error updating invite:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Invite updated",
        description: "Invite has been updated successfully."
      });

      return data;
    } catch (err) {
      console.error('Error updating invite:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invite"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getInviteUrl = (inviteCode: string) => {
    return `${window.location.origin}/invite/${inviteCode}`;
  };

  const copyInviteUrl = async (inviteCode: string) => {
    const inviteUrl = getInviteUrl(inviteCode);
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Invite copied",
        description: "Invite link has been copied to clipboard."
      });
    } catch (err) {
      console.error('Error copying invite URL:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy invite link"
      });
    }
  };

  return {
    loading,
    generateInviteCode,
    joinServerByInvite,
    getInviteByCode,
    getServerInvites,
    deleteInvite,
    updateInvite,
    getInviteUrl,
    copyInviteUrl,
  };
}
