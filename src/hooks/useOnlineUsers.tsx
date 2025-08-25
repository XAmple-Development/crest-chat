import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlineUser {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  activity?: string;
}

export function useOnlineUsers(serverId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles (
            id,
            user_id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .eq('server_id', serverId);

      if (error) {
        console.error('Error fetching online users:', error);
        return;
      }

      const users = data?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        username: member.profiles.username,
        display_name: member.profiles.display_name,
        avatar_url: member.profiles.avatar_url,
        status: member.profiles.status || 'online',
        role: member.role,
        activity: member.nickname ? `Nickname: ${member.nickname}` : undefined
      })) || [];

      setOnlineUsers(users);
      setLoading(false);
    };

    fetchOnlineUsers();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('online-users-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'server_members',
        filter: `server_id=eq.${serverId}`
      }, () => {
        fetchOnlineUsers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [serverId]);

  return {
    onlineUsers,
    loading
  };
}
