import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlineUser {
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
  username: string;
  display_name: string | null;
  discriminator: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status: string | null;
  is_verified: boolean;
  is_bot: boolean;
  activity?: string;
  last_seen?: string;
  roles?: {
    id: string;
    name: string;
    color: number;
    position: number;
    permissions: number;
  }[];
}

export function useOnlineUsers(serverId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serverId) {
      fetchOnlineUsers();
      subscribeToUserChanges();
    } else {
      setOnlineUsers([]);
      setLoading(false);
    }
  }, [serverId]);

  const fetchOnlineUsers = async () => {
    if (!serverId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url,
            discriminator,
            status,
            custom_status,
            is_verified,
            is_bot
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
        console.error('Error fetching online users:', error);
        setError(error.message);
      } else {
        const formattedUsers = data?.map(member => ({
          id: member.id,
          server_id: member.server_id,
          user_id: member.user_id,
          nickname: member.nickname,
          avatar_url: member.avatar_url,
          joined_at: member.joined_at,
          premium_since: member.premium_since,
          is_deafened: member.is_deafened,
          is_muted: member.is_muted,
          is_streaming: member.is_streaming,
          is_video: member.is_video,
          username: member.profiles?.username || 'Unknown',
          display_name: member.profiles?.display_name,
          discriminator: member.profiles?.discriminator || '0000',
          status: member.profiles?.status || 'offline',
          custom_status: member.profiles?.custom_status,
          is_verified: member.profiles?.is_verified || false,
          is_bot: member.profiles?.is_bot || false,
          roles: member.member_roles?.map((mr: any) => mr.server_roles) || [],
        })) || [];

        setOnlineUsers(formattedUsers);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching online users:', err);
      setError('Failed to fetch online users');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUserChanges = () => {
    if (!serverId) return;

    const subscription = supabase
      .channel('online_users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_members',
          filter: `server_id=eq.${serverId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new member with profile data
            fetchMemberWithProfile(payload.new.user_id);
          } else if (payload.eventType === 'UPDATE') {
            // Update the member in the list
            setOnlineUsers(prev => prev.map(user => 
              user.user_id === payload.new.user_id 
                ? { ...user, ...payload.new }
                : user
            ));
          } else if (payload.eventType === 'DELETE') {
            // Remove the member from the list
            setOnlineUsers(prev => prev.filter(user => user.user_id !== payload.old.user_id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          // Update user status when profile changes
          setOnlineUsers(prev => prev.map(user => 
            user.user_id === payload.new.id
              ? {
                  ...user,
                  username: payload.new.username,
                  display_name: payload.new.display_name,
                  avatar_url: payload.new.avatar_url,
                  status: payload.new.status,
                  custom_status: payload.new.custom_status,
                  is_verified: payload.new.is_verified,
                  is_bot: payload.new.is_bot,
                }
              : user
          ));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchMemberWithProfile = async (userId: string) => {
    if (!serverId) return;

    try {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url,
            discriminator,
            status,
            custom_status,
            is_verified,
            is_bot
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
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const formattedUser = {
          id: data.id,
          server_id: data.server_id,
          user_id: data.user_id,
          nickname: data.nickname,
          avatar_url: data.avatar_url,
          joined_at: data.joined_at,
          premium_since: data.premium_since,
          is_deafened: data.is_deafened,
          is_muted: data.is_muted,
          is_streaming: data.is_streaming,
          is_video: data.is_video,
          username: data.profiles?.username || 'Unknown',
          display_name: data.profiles?.display_name,
          discriminator: data.profiles?.discriminator || '0000',
          status: data.profiles?.status || 'offline',
          custom_status: data.profiles?.custom_status,
          is_verified: data.profiles?.is_verified || false,
          is_bot: data.profiles?.is_bot || false,
          roles: data.member_roles?.map((mr: any) => mr.server_roles) || [],
        };

        setOnlineUsers(prev => [...prev, formattedUser]);
      }
    } catch (err) {
      console.error('Error fetching member with profile:', err);
    }
  };

  const updateUserStatus = async (userId: string, status: 'online' | 'idle' | 'dnd' | 'offline') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const updateUserActivity = async (userId: string, activity: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_status: activity })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user activity:', error);
      }
    } catch (err) {
      console.error('Error updating user activity:', err);
    }
  };

  const getUserById = (userId: string) => {
    return onlineUsers.find(user => user.user_id === userId);
  };

  const getUsersByStatus = (status: 'online' | 'idle' | 'dnd' | 'offline') => {
    return onlineUsers.filter(user => user.status === status);
  };

  const getUsersByRole = (roleName: string) => {
    return onlineUsers.filter(user => 
      user.roles?.some(role => role.name === roleName)
    );
  };

  const getOnlineCount = () => {
    return onlineUsers.filter(user => user.status === 'online').length;
  };

  const getIdleCount = () => {
    return onlineUsers.filter(user => user.status === 'idle').length;
  };

  const getDndCount = () => {
    return onlineUsers.filter(user => user.status === 'dnd').length;
  };

  const getOfflineCount = () => {
    return onlineUsers.filter(user => user.status === 'offline').length;
  };

  const getTotalCount = () => {
    return onlineUsers.length;
  };

  return {
    onlineUsers,
    loading,
    error,
    updateUserStatus,
    updateUserActivity,
    getUserById,
    getUsersByStatus,
    getUsersByRole,
    getOnlineCount,
    getIdleCount,
    getDndCount,
    getOfflineCount,
    getTotalCount,
    refetch: fetchOnlineUsers,
  };
}
