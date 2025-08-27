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

  // Fetch user's servers and public servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ['servers', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      console.log('Fetching servers for user:', user.id)
      
      // Fetch servers the user is a member of
      const { data: memberServers, error: memberError } = await supabase
        .from('server_members')
        .select(`
          server_id,
          servers (
            *,
            channels (*)
          )
        `)
        .eq('user_id', user.id)

      if (memberError) {
        console.error('Error fetching member servers:', memberError)
      }

      // Fetch public servers the user is not a member of
      const { data: publicServers, error: publicError } = await supabase
        .from('servers')
        .select(`
          *,
          channels (*)
        `)
        .eq('privacy_level', 'public')
        .not('id', 'in', `(${memberServers?.map(s => s.server_id).join(',') || '00000000-0000-0000-0000-000000000000'})`)

      if (publicError) {
        console.error('Error fetching public servers:', publicError)
      }

      // Combine member servers and public servers
      const memberServerList = memberServers?.map(item => {
        const server = item.servers as unknown as Server
        const channels = (item.servers as any).channels as Channel[] || []
        return {
          ...server,
          channels,
          isMember: true
        }
      }) || []

      const publicServerList = publicServers?.map(server => {
        const channels = (server as any).channels as Channel[] || []
        return {
          ...server,
          channels,
          isMember: false
        }
      }) || []

      const allServers = [...memberServerList, ...publicServerList]
      
      console.log('All servers (members + public):', allServers)
      return allServers
    },
    enabled: !!user
  })

  // Create server mutation
  const createServer = useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      privacyLevel = 'public' 
    }: { 
      name: string; 
      description?: string; 
      privacyLevel?: 'public' | 'private' | 'invite_only' 
    }) => {
      if (!user) throw new Error('User not authenticated')

      try {
        // Generate invite code for the server (fallback if RPC doesn't exist)
        let inviteCode: string
        try {
          const { data: inviteCodeData } = await supabase.rpc('generate_invite_code')
          inviteCode = inviteCodeData || Math.random().toString(36).substring(2, 10).toUpperCase()
        } catch (rpcError) {
          console.warn('RPC function not available, using fallback:', rpcError)
          inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        }

        // Create server
        const { data: server, error: serverError } = await supabase
          .from('servers')
          .insert({
            name,
            description,
            owner_id: user.id,
            privacy_level: privacyLevel,
            invite_code: inviteCode,
            is_public: privacyLevel === 'public'
          })
          .select()
          .single()

        if (serverError) {
          console.error('Server creation error:', serverError)
          throw serverError
        }

        console.log('Server created:', server)

        // Create default channels
        const defaultChannels = [
          { name: 'general', type: 'text' as const, position: 0 },
          { name: 'announcements', type: 'announcement' as const, position: 1 }
        ]

        for (const channelData of defaultChannels) {
          const { error: channelError } = await supabase
            .from('channels')
            .insert({
              server_id: server.id,
              name: channelData.name,
              type: channelData.type,
              position: channelData.position
            })
          
          if (channelError) {
            console.error('Channel creation error:', channelError)
          }
        }

        // Add user as server owner
        const { error: memberError } = await supabase
          .from('server_members')
          .insert({
            server_id: server.id,
            user_id: user.id
          })

        if (memberError) {
          console.error('Member creation error:', memberError)
          // Don't throw here, just log the error
        }

        console.log('Server creation completed successfully')
        return server
      } catch (error) {
        console.error('Error in createServer:', error)
        throw error
      }
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

  // Join server by invite code mutation
  const joinServerByInvite = useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('join_server_by_invite', {
        invite_code_param: inviteCode
      })

      if (error) throw error
      return data
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

  // Manual refresh function for debugging
  const refreshServers = () => {
    console.log('Manual refresh triggered')
    queryClient.invalidateQueries({ queryKey: ['servers', user?.id] })
  }

  return {
    servers,
    serversLoading,
    currentServer,
    setCurrentServer,
    currentChannel,
    setCurrentChannel,
    createServer,
    createChannel,
    joinServer,
    joinServerByInvite,
    refreshServers
  }
}
