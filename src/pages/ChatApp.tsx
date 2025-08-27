import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useServers } from '../hooks/useServers'
import ServerSidebar from '../components/ServerSidebar'
import ChatArea from '../components/ChatArea'
import { Server, Channel } from '../integrations/supabase/types'

export default function ChatApp() {
  const { user, signOut } = useAuth()
  const { servers, isLoading } = useServers()
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)

  const handleServerSelect = (server: Server) => {
    setCurrentServer(server)
    // Set first channel as default
    if (server.channels && server.channels.length > 0) {
      setCurrentChannel(server.channels[0])
    } else {
      setCurrentChannel(null)
    }
  }

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-discord-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-discord-primary mx-auto mb-4"></div>
          <p className="text-discord-text text-lg">Loading servers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-discord-bg">
      {/* Server Sidebar */}
      <ServerSidebar
        servers={servers}
        currentServer={currentServer}
        currentChannel={currentChannel}
        onServerSelect={handleServerSelect}
        onChannelSelect={handleChannelSelect}
        onSignOut={handleSignOut}
        user={user}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentServer && currentChannel ? (
          <ChatArea
            server={currentServer}
            channel={currentChannel}
            onServerUpdate={() => {
              // Refresh servers when server is updated
              window.location.reload()
            }}
            onChannelUpdate={() => {
              // Refresh servers when channel is updated
              window.location.reload()
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-discord-text mb-2">Welcome to CrestChat!</h2>
              <p className="text-discord-muted">
                {currentServer 
                  ? 'Select a channel to start chatting'
                  : 'Select a server to get started'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
