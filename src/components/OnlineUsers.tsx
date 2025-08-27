import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { Server } from '../integrations/supabase/types'

interface OnlineUsersProps {
  server: Server | null
}

interface OnlineUser {
  id: string
  username: string
  display_name: string
  status: string
  avatar_url?: string
}

export default function OnlineUsers({ server }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (server) {
      loadOnlineUsers()
    }
  }, [server])

  const loadOnlineUsers = async () => {
    if (!server) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          user_id,
          user:profiles!server_members_user_id_fkey (
            id,
            username,
            display_name,
            status,
            avatar_url
          )
        `)
        .eq('server_id', server.id)

      if (error) throw error

      const users = data
        ?.map(item => item.user)
        .filter((user: any) => user && user.status !== 'offline')
        .sort((a: any, b: any) => {
          // Sort by status priority: online > idle > dnd > invisible
          const statusOrder = { online: 0, idle: 1, dnd: 2, invisible: 3 }
          return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
        }) || []

      setOnlineUsers(users as unknown as OnlineUser[])
    } catch (error) {
      console.error('Error loading online users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'dnd': return 'bg-red-500'
      case 'invisible': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'idle': return 'Idle'
      case 'dnd': return 'Do Not Disturb'
      case 'invisible': return 'Invisible'
      default: return 'Offline'
    }
  }

  if (!server) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-discord-text uppercase tracking-wide">
        Online — {onlineUsers.length}
      </h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-discord-primary mx-auto mb-2"></div>
          <p className="text-xs text-discord-muted">Loading...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-discord-channel/50 rounded-md transition-colors">
              {/* User Avatar with Status */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-discord-channel`}></div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-discord-text truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-discord-muted truncate">
                  {getStatusText(user.status)}
                </p>
              </div>
            </div>
          ))}
          
          {onlineUsers.length === 0 && (
            <p className="text-xs text-discord-muted text-center py-4">
              No one is online
            </p>
          )}
        </div>
      )}
    </div>
  )
}
