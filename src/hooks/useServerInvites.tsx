import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useServerInvites() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const joinServerByInvite = async (inviteCode: string) => {
    if (!user || !inviteCode.trim()) return null;

    setLoading(true);
    
    try {
      // First, find the server by invite code
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (serverError || !server) {
        toast({
          variant: "destructive",
          title: "Invalid invite",
          description: "This invite code is invalid or has expired."
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

      // Join the server
      const { error: joinError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to join server. Please try again."
        });
        return null;
      }

      toast({
        title: "Welcome!",
        description: `You've joined ${server.name}!`
      });

      return server;
    } catch (error) {
      console.error('Error joining server:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again."
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async (serverId: string) => {
    if (!user) return null;

    setLoading(true);
    
    try {
      // Generate a new invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error } = await supabase
        .from('servers')
        .update({ invite_code: inviteCode })
        .eq('id', serverId)
        .eq('owner_id', user.id) // Only server owner can generate invites
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate invite code."
        });
        return null;
      }

      return inviteCode;
    } catch (error) {
      console.error('Error generating invite code:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    joinServerByInvite,
    generateInviteCode,
    loading
  };
}
