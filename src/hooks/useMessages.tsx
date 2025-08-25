import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Message {
  id: string;
  channel_id: string;
  author_id: string;
  content: string | null;
  type: 'text' | 'image' | 'video' | 'file' | 'embed' | 'system';
  is_pinned: boolean;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  mentions_everyone: boolean;
  mention_roles: string[] | null;
  mention_users: string[] | null;
  embeds: any[] | null;
  attachments: any[] | null;
  reactions: any | null;
  flags: number;
  webhook_id: string | null;
  application_id: string | null;
  message_reference: any | null;
  activity: any | null;
  application: any | null;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    discriminator: string;
    is_verified: boolean;
    is_bot: boolean;
  };
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  me: boolean;
}

export function useMessages(channelId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchMessages();
      subscribeToMessageChanges();
    } else {
      setMessages([]);
      setLoading(false);
      setHasMore(true);
    }
  }, [channelId]);

  const fetchMessages = async (before?: string) => {
    if (!channelId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_author_id_fkey (
            username,
            display_name,
            avatar_url,
            discriminator,
            is_verified,
            is_bot
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        setError(error.message);
      } else {
        const formattedMessages = data?.map(msg => ({
          ...msg,
          author: msg.profiles,
        })) || [];

        if (before) {
          setMessages(prev => [...prev, ...formattedMessages]);
        } else {
          setMessages(formattedMessages);
        }

        setHasMore(data?.length === 50);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldestMessage = messages[messages.length - 1];
    await fetchMessages(oldestMessage.created_at);
    setLoadingMore(false);
  };

  const subscribeToMessageChanges = () => {
    if (!channelId) return;

    const subscription = supabase
      .channel('message_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.is_deleted) {
            const newMessage = {
              ...payload.new,
              author: payload.new.profiles,
            } as Message;
            setMessages(prev => [newMessage, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'file' | 'embed' = 'text') => {
    if (!user || !channelId || !content.trim()) return null;

    try {
      // Check for mentions
      const mentionUsers = extractUserMentions(content);
      const mentionRoles = extractRoleMentions(content);
      const mentionsEveryone = content.includes('@everyone') || content.includes('@here');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          author_id: user.id,
          content: content.trim(),
          type,
          mentions_everyone: mentionsEveryone,
          mention_users: mentionUsers.length > 0 ? mentionUsers : null,
          mention_roles: mentionRoles.length > 0 ? mentionRoles : null,
        })
        .select(`
          *,
          profiles!messages_author_id_fkey (
            username,
            display_name,
            avatar_url,
            discriminator,
            is_verified,
            is_bot
          )
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      return {
        ...data,
        author: data.profiles,
      } as Message;
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
      return null;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: content.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('author_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error editing message:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return null;
      }

      toast({
        title: "Message edited",
        description: "Message has been updated successfully."
      });

      return data;
    } catch (err) {
      console.error('Error editing message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to edit message"
      });
      return null;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('author_id', user.id);

      if (error) {
        console.error('Error deleting message:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Message deleted",
        description: "Message has been deleted successfully."
      });

      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete message"
      });
      return false;
    }
  };

  const pinMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: true })
        .eq('id', messageId);

      if (error) {
        console.error('Error pinning message:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Message pinned",
        description: "Message has been pinned to the channel."
      });

      return true;
    } catch (err) {
      console.error('Error pinning message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to pin message"
      });
      return false;
    }
  };

  const unpinMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: false })
        .eq('id', messageId);

      if (error) {
        console.error('Error unpinning message:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
        return false;
      }

      toast({
        title: "Message unpinned",
        description: "Message has been unpinned from the channel."
      });

      return true;
    } catch (err) {
      console.error('Error unpinning message:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unpin message"
      });
      return false;
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      // Get current reactions
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      const currentReactions = message?.reactions || {};
      const reactionKey = emoji;
      
      if (!currentReactions[reactionKey]) {
        currentReactions[reactionKey] = {
          count: 0,
          users: [],
        };
      }

      // Add user to reaction if not already there
      if (!currentReactions[reactionKey].users.includes(user.id)) {
        currentReactions[reactionKey].count += 1;
        currentReactions[reactionKey].users.push(user.id);
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId);

      if (error) {
        console.error('Error adding reaction:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error adding reaction:', err);
      return false;
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      // Get current reactions
      const { data: message } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      const currentReactions = message?.reactions || {};
      const reactionKey = emoji;
      
      if (currentReactions[reactionKey]) {
        currentReactions[reactionKey].users = currentReactions[reactionKey].users.filter(
          (userId: string) => userId !== user.id
        );
        currentReactions[reactionKey].count = currentReactions[reactionKey].users.length;

        if (currentReactions[reactionKey].count === 0) {
          delete currentReactions[reactionKey];
        }
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId);

      if (error) {
        console.error('Error removing reaction:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error removing reaction:', err);
      return false;
    }
  };

  const extractUserMentions = (content: string): string[] => {
    const userMentions = content.match(/<@!?(\d+)>/g);
    if (!userMentions) return [];
    
    return userMentions.map(mention => {
      const match = mention.match(/<@!?(\d+)>/);
      return match ? match[1] : '';
    }).filter(Boolean);
  };

  const extractRoleMentions = (content: string): string[] => {
    const roleMentions = content.match(/<@&(\d+)>/g);
    if (!roleMentions) return [];
    
    return roleMentions.map(mention => {
      const match = mention.match(/<@&(\d+)>/);
      return match ? match[1] : '';
    }).filter(Boolean);
  };

  const getPinnedMessages = async () => {
    if (!channelId) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_author_id_fkey (
            username,
            display_name,
            avatar_url,
            discriminator,
            is_verified,
            is_bot
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_pinned', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pinned messages:', error);
        return [];
      }

      return data?.map(msg => ({
        ...msg,
        author: msg.profiles,
      })) || [];
    } catch (err) {
      console.error('Error fetching pinned messages:', err);
      return [];
    }
  };

  return {
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    addReaction,
    removeReaction,
    loadMoreMessages,
    getPinnedMessages,
    refetch: () => fetchMessages(),
  };
}