import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useDMs() {
  const queryClient = useQueryClient()

  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['dm-threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dm_threads')
        .select(`
          *,
          participants:dm_participants(
            user_id,
            user:profiles!dm_participants_user_id_fkey(id, username, display_name, avatar_url, status)
          )
        `)

      if (error) throw error
      return data || []
    }
  })

  const startDM = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('create_or_get_dm_thread', { target_user_id: targetUserId })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-threads'] })
    }
  })

  return { threads, threadsLoading, startDM }
}

export function useDMMessages(threadId: string | null) {
  const queryClient = useQueryClient()

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['dm-messages', threadId],
    queryFn: async () => {
      if (!threadId) return []
      const { data, error } = await supabase
        .from('dm_messages')
        .select(`
          *,
          author:profiles!dm_messages_author_id_fkey(id, username, display_name, avatar_url, status)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!threadId
  })

  const sendDM = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const { data, error } = await supabase
        .from('dm_messages')
        .insert({
          thread_id: threadId,
          author_id: (await supabase.auth.getUser()).data.user?.id,
          content
        })
        .select(`
          *,
          author:profiles!dm_messages_author_id_fkey(id, username, display_name, avatar_url, status)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dm-messages', variables.threadId] })
    }
  })

  return { messages, messagesLoading, sendDM }
}


