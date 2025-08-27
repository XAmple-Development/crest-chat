import { useState } from 'react'
import { useServers } from '../hooks/useServers'
import { Server, Channel } from '../integrations/supabase/types'
import { toast } from 'sonner'

interface ServerSidebarProps {
  servers: Server[]
  currentServer: Server | null
  currentChannel: Channel | null
  onServerSelect: (server: Server) => void
  onChannelSelect: (channel: Channel) => void
  user: any
}

export default function ServerSidebar({
  servers,
  currentServer,
  currentChannel,
  onServerSelect,
  onChannelSelect,
  user
}: ServerSidebarProps) {
  const { createServer, createChannel, joinServer, refreshServers } = useServers()
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [serverForm, setServerForm] = useState({ name: '', description: '', privacyLevel: 'public' })
  const [channelForm, setChannelForm] = useState({ name: '', type: 'text' })

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverForm.name.trim()) {
      toast.error('Server name is required')
      return
    }

    try {
      await createServer.mutateAsync(serverForm)
      setShowCreateServer(false)
      setServerForm({ name: '', description: '', privacyLevel: 'public' })
    } catch (error) {
      console.error('Failed to create server:', error)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentServer || !channelForm.name.trim()) {
      toast.error('Channel name is required')
      return
    }

    try {
      await createChannel.mutateAsync({
        name: channelForm.name,
        serverId: currentServer.id,
        type: channelForm.type
      })
      setShowCreateChannel(false)
      setChannelForm({ name: '', type: 'text' })
    } catch (error) {
      console.error('Failed to create channel:', error)
    }
  }

  const handleJoinServer = async (server: Server) => {
    try {
      await joinServer.mutateAsync(server.id)
    } catch (error) {
      console.error('Failed to join server:', error)
    }
  }

  return (
    <div className="w-64 bg-discord-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-discord-text">CrestChat</h1>
          <button
            onClick={refreshServers}
            className="p-2 hover:bg-discord-channel rounded-md transition-colors"
          >
            <svg className="w-4 h-4 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-discord-text truncate">
              {user?.display_name || user?.username || 'User'}
            </p>
            <p className="text-xs text-discord-muted truncate">
              {user?.email}
            </p>
          </div>
          <div className="w-4 h-4"></div>
        </div>
      </div>

      {/* Create Server Button */}
      <div className="p-4">
        <button
          onClick={() => setShowCreateServer(true)}
          className="w-full bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Create Server
        </button>
      </div>

      {/* Servers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {servers.map((server) => (
          <div key={server.id} className="space-y-2">
            {/* Server */}
            <div
              onClick={() => onServerSelect(server)}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                currentServer?.id === server.id
                  ? 'bg-discord-channel text-discord-text'
                  : 'hover:bg-discord-channel/50 text-discord-muted hover:text-discord-text'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
                    {server.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{server.name}</p>
                    {!server.isMember && (
                      <p className="text-xs text-discord-muted">(Public)</p>
                    )}
                  </div>
                </div>
                {!server.isMember && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinServer(server)
                    }}
                    className="px-2 py-1 bg-discord-primary hover:bg-discord-primary/90 text-white text-xs rounded transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>

            {/* Channels */}
            {currentServer?.id === server.id && server.channels && (
              <div className="ml-6 space-y-1">
                {server.channels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => onChannelSelect(channel)}
                    className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                      currentChannel?.id === channel.id
                        ? 'bg-discord-channel text-discord-text'
                        : 'hover:bg-discord-channel/50 text-discord-muted hover:text-discord-text'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-discord-muted">#</span>
                      <span>{channel.name}</span>
                    </div>
                  </div>
                ))}
                
                {/* Create Channel Button */}
                {server.isMember && (
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="w-full px-3 py-2 text-left text-discord-muted hover:text-discord-text hover:bg-discord-channel/50 rounded transition-colors"
                  >
                    + Create Channel
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Server Modal */}
      {showCreateServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold text-discord-text mb-4">Create Server</h3>
            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverForm.name}
                  onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter server name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={serverForm.description}
                  onChange={(e) => setServerForm({ ...serverForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter server description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Privacy Level
                </label>
                <select
                  value={serverForm.privacyLevel}
                  onChange={(e) => setServerForm({ ...serverForm, privacyLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createServer.isPending}
                  className="flex-1 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {createServer.isPending ? 'Creating...' : 'Create Server'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateServer(false)}
                  className="flex-1 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold text-discord-text mb-4">Create Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Channel Type
                </label>
                <select
                  value={channelForm.type}
                  onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                >
                  <option value="text">Text</option>
                  <option value="voice">Voice</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createChannel.isPending}
                  className="flex-1 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {createChannel.isPending ? 'Creating...' : 'Create Channel'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
