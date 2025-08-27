import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useServers } from '../hooks/useServers'
import ServerSidebar from '../components/ServerSidebar'
import ChatArea from '../components/ChatArea'
import UserArea from '../components/UserArea'
import ServerSettingsModal from '../components/ServerSettingsModal'
import { Server, Channel } from '../integrations/supabase/types'

export default function ChatApp() {
  const { user } = useAuth()
  const { servers, isLoading } = useServers()
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [showServerSettings, setShowServerSettings] = useState(false)

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

  const handleServerSettings = () => {
    setShowServerSettings(true)
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
        user={user}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentServer && currentChannel ? (
          <ChatArea
            channel={currentChannel}
            server={currentServer}
            onServerUpdate={() => {
              // Refresh servers when server is updated
              window.location.reload()
            }}
            onChannelUpdate={() => {
              // Refresh servers when channel is updated
              window.location.reload()
            }}
            onOpenServerSettings={handleServerSettings}
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

      {/* User Area */}
      <div className="w-64 bg-discord-sidebar border-l border-gray-700 p-4">
        <UserArea server={currentServer} />
      </div>

      {/* Server Settings Modal */}
      <ServerSettingsModal
        server={currentServer}
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        onServerUpdate={() => {
          window.location.reload()
        }}
        onChannelUpdate={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
