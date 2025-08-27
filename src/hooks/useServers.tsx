import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useServers() {
  const queryClient = useQueryClient()

  // Fetch servers the user is a member of
  const { data: userServers = [], isLoading: userServersLoading } = useQuery({
    queryKey: ['user-servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          server_id,
          servers (
            *,
            channels (*)
          )
        `)

      if (error) {
        console.error('Error fetching user servers:', error)
        return []
      }

      return data?.map((item: any) => ({
        ...item.servers,
        channels: item.servers.channels || []
      })) || []
    }
  })

  // Fetch public servers
  const { data: publicServers = [], isLoading: publicServersLoading } = useQuery({
    queryKey: ['public-servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servers')
        .select(`
          *,
          channels (*)
        `)
        .eq('privacy_level', 'public')

      if (error) {
        console.error('Error fetching public servers:', error)
        return []
      }

      return data || []
    }
  })

  // Combine servers and add isMember flag
  const allServers = [
    ...userServers.map((server: any) => ({ ...server, isMember: true })),
    ...publicServers
      .filter((publicServer: any) => !userServers.find((userServer: any) => userServer.id === publicServer.id))
      .map((server: any) => ({ ...server, isMember: false }))
  ]

  // Create server mutation
  const createServer = useMutation({
    mutationFn: async ({ name, description, privacyLevel }: { name: string; description?: string; privacyLevel: string }) => {
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name,
          description,
          privacy_level: privacyLevel,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (serverError) throw serverError

      // Create default channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: 'general',
          server_id: server.id,
          type: 'text'
        })
        .select()
        .single()

      if (channelError) throw channelError

      // Add user as member
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (memberError) throw memberError

      return { ...server, channels: [channel] }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] })
      queryClient.invalidateQueries({ queryKey: ['public-servers'] })
      toast.success('Server created successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to create server: ${error.message}`)
    }
  })

  // Create channel mutation
  const createChannel = useMutation({
    mutationFn: async ({ name, serverId, type = 'text' }: { name: string; serverId: string; type?: string }) => {
      const { data: channel, error } = await supabase
        .from('channels')
        .insert({
          name,
          server_id: serverId,
          type
        })
        .select()
        .single()

      if (error) throw error
      return channel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] })
      queryClient.invalidateQueries({ queryKey: ['public-servers'] })
      toast.success('Channel created successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to create channel: ${error.message}`)
    }
  })

  // Join server mutation
  const joinServer = useMutation({
    mutationFn: async (serverId: string) => {
      const { error } = await supabase
        .from('server_members')
        .insert({
          server_id: serverId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-servers'] })
      queryClient.invalidateQueries({ queryKey: ['public-servers'] })
      toast.success('Joined server successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to join server: ${error.message}`)
    }
  })

  // Refresh servers
  const refreshServers = () => {
    queryClient.invalidateQueries({ queryKey: ['user-servers'] })
    queryClient.invalidateQueries({ queryKey: ['public-servers'] })
  }

  return {
    servers: allServers,
    userServers,
    publicServers,
    isLoading: userServersLoading || publicServersLoading,
    createServer,
    createChannel,
    joinServer,
    refreshServers
  }
}
