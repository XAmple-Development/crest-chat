import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useMessages(channelId: string | null) {
  const queryClient = useQueryClient()

  // Fetch messages for a channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) return []
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          author:profiles!messages_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Error fetching messages:', error)
        return []
      }

      return data || []
    },
    enabled: !!channelId
  })

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!channelId) throw new Error('No channel selected')

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          author_id: (await supabase.auth.getUser()).data.user?.id,
          content,
          type: 'default',
          is_pinned: false,
          is_edited: false,
          is_deleted: false,
          mentions_everyone: false,
          mention_roles: [],
          mention_users: [],
          embeds: null,
          attachments: null,
          reactions: null,
          flags: 0
        })
        .select(`
          *,
          author:profiles!messages_author_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .single()

      if (error) throw error
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Edit message mutation
  const editMessage = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data: message, error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return message
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      toast.success('Message edited successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to edit message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
      toast.success('Message deleted successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return {
    messages,
    messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage
  }
}
