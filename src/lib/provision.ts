import { supabase } from '@/integrations/supabase/client'

export async function ensureDefaultServerAndChannel(userId: string, username: string) {
  // Check if the user is already a member of any server
  const { data: membership, error: membershipError } = await supabase
    .from('server_members')
    .select('server_id')
    .eq('user_id', userId)
    .limit(1)

  if (membershipError) return
  if (membership && membership.length > 0) return

  // Create server
  const serverName = `${username}'s server`
  const { data: server, error: serverError } = await supabase
    .from('servers')
    .insert({
      name: serverName,
      owner_id: userId,
      privacy_level: 'public'
    })
    .select()
    .single()

  if (serverError || !server) return

  // Create default channel
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .insert({
      name: 'general',
      server_id: server.id,
      type: 'text',
      position: 0
    })
    .select()
    .single()

  if (channelError || !channel) return

  // Add the user as a member
  await supabase
    .from('server_members')
    .insert({ server_id: server.id, user_id: userId })
}


