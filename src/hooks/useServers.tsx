import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Server, Channel } from '@/integrations/supabase/types'
import { useAuth } from './useAuth'

export function useServers() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)

  // Fetch user's servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ['servers', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          server_id,
          servers (
            *,
            channels (*)
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching servers:', error)
        return []
      }

      if (!data) return []

      return data.map(item => {
        const server = item.servers as unknown as Server
        const channels = (item.servers as any).channels as Channel[] || []
        return {
          ...server,
          channels
        }
      })
    },
    enabled: !!user
  })

  // Create server mutation
  const createServer = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Create server
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name,
          description,
          is_public: false
        })
        .select()
        .single()

      if (serverError) throw serverError

      // Create default channels
      const defaultChannels = [
        { name: 'general', type: 'text' as const, position: 0 },
        { name: 'announcements', type: 'announcement' as const, position: 1 }
      ]

      for (const channelData of defaultChannels) {
        await supabase
          .from('channels')
          .insert({
            server_id: server.id,
            name: channelData.name,
            type: channelData.type,
            position: channelData.position
          })
      }

      // Add user as server owner
      await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id
        })

      return server
    },
    onSuccess: (server) => {
      toast.success(`Server "${server.name}" created successfully!`)
      queryClient.invalidateQueries({ queryKey: ['servers', user?.id] })
      setCurrentServer(server)
    },
    onError: (error) => {
      toast.error(`Failed to create server: ${error.message}`)
    }
  })

  // Create channel mutation
  const createChannel = useMutation({
    mutationFn: async ({ 
      serverId, 
      name, 
      type = 'text' as const, 
      description 
    }: { 
      serverId: string
      name: string
      type?: 'text' | 'voice' | 'announcement'
      description?: string 
    }) => {
      const { data: channel, error } = await supabase
        .from('channels')
        .insert({
          server_id: serverId,
          name,
          type,
          description,
          position: 999 // Will be updated by trigger
        })
        .select()
        .single()

      if (error) throw error
      return channel
    },
    onSuccess: (channel) => {
      toast.success(`Channel "#${channel.name}" created successfully!`)
      queryClient.invalidateQueries({ queryKey: ['servers', user?.id] })
    },
    onError: (error) => {
      toast.error(`Failed to create channel: ${error.message}`)
    }
  })

  // Join server mutation
  const joinServer = useMutation({
    mutationFn: async (serverId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('server_members')
        .insert({
          server_id: serverId,
          user_id: user.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Joined server successfully!')
      queryClient.invalidateQueries({ queryKey: ['servers', user?.id] })
    },
    onError: (error) => {
      toast.error(`Failed to join server: ${error.message}`)
    }
  })

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    const serversSubscription = supabase
      .channel('servers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'servers'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['servers', user.id] })
      })
      .subscribe()

    const channelsSubscription = supabase
      .channel('channels')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['servers', user.id] })
      })
      .subscribe()

    const membersSubscription = supabase
      .channel('server_members')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'server_members'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['servers', user.id] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(serversSubscription)
      supabase.removeChannel(channelsSubscription)
      supabase.removeChannel(membersSubscription)
    }
  }, [user, queryClient])

  return {
    servers,
    serversLoading,
    currentServer,
    setCurrentServer,
    currentChannel,
    setCurrentChannel,
    createServer,
    createChannel,
    joinServer
  }
}
