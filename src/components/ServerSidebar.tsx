import { useState } from 'react'
import { Server, Channel } from '../integrations/supabase/types'
import { supabase } from '../integrations/supabase/client'
import { toast } from 'sonner'

interface ServerSidebarProps {
  servers: Server[]
  currentServer: Server | null
  currentChannel: Channel | null
  onServerSelect: (_server: Server) => void
  onChannelSelect: (_channel: Channel) => void
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
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showJoinServer, setShowJoinServer] = useState(false)
  const [serverName, setServerName] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [serverPrivacy, setServerPrivacy] = useState('public')
  const [channelName, setChannelName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateServer = async () => {
    if (!serverName.trim()) {
      toast.error('Please enter a server name')
      return
    }

    setLoading(true)
    try {
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Create server first
      const { data: server, error: serverError } = await supabase
        .from('servers')
        .insert({
          name: serverName.trim(),
          description: serverDescription.trim() || null,
          owner_id: user.id,
          privacy_level: serverPrivacy,
          invite_code: inviteCode
        })
        .select()
        .single()

      if (serverError) {
        console.error('Server creation error:', serverError)
        throw serverError
      }

      console.log('Server created:', server)

      // Create default channel
      const { error: channelError } = await supabase
        .from('channels')
        .insert({
          name: 'general',
          server_id: server.id,
          type: 'text'
        })

      if (channelError) {
        console.error('Channel creation error:', channelError)
        throw channelError
      }

      console.log('Default channel created')

      // Add owner as member
      const { error: memberError } = await supabase
        .from('server_members')
        .insert({
          server_id: server.id,
          user_id: user.id
        })

      if (memberError) {
        console.error('Member creation error:', memberError)
        throw memberError
      }

      console.log('Owner added as member')

      toast.success('Server created successfully!')
      setShowCreateServer(false)
      setServerName('')
      setServerDescription('')
      setServerPrivacy('public')
      
      // Refresh the page to show new server
      window.location.reload()
    } catch (error: any) {
      console.error('Full error:', error)
      toast.error(`Failed to create server: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!currentServer || !channelName.trim()) {
      toast.error('Please enter a channel name')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          name: channelName.trim(),
          server_id: currentServer.id,
          type: 'text'
        })

      if (error) throw error

      toast.success('Channel created successfully!')
      setShowCreateChannel(false)
      setChannelName('')
      
      // Refresh the page to show new channel
      window.location.reload()
    } catch (error: any) {
      toast.error(`Failed to create channel: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinServer = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.rpc('join_server_by_invite', {
        invite_code_param: inviteCode.trim().toUpperCase()
      })

      if (error) throw error

      toast.success('Joined server successfully!')
      setShowJoinServer(false)
      setInviteCode('')
      
      // Refresh the page to show new server
      window.location.reload()
    } catch (error: any) {
      toast.error(`Failed to join server: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text': return '#'
      case 'voice': return '🔊'
      case 'announcement': return '📢'
      default: return '#'
    }
  }

  return (
    <div className="w-64 bg-discord-sidebar flex flex-col h-full">
      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Home Button */}
        <button
          onClick={() => onServerSelect(null as any)}
          className={`w-full p-3 rounded-lg transition-colors ${
            !currentServer 
              ? 'bg-discord-primary text-white' 
              : 'bg-discord-channel hover:bg-discord-channel/80 text-discord-text'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="font-medium">Home</span>
          </div>
        </button>

        {/* Server Separator */}
        <div className="border-t border-gray-700 my-4"></div>

        {/* Servers */}
        {servers.map((server) => (
          <div key={server.id} className="space-y-2">
            {/* Server Button */}
            <button
              onClick={() => onServerSelect(server)}
              className={`w-full p-3 rounded-lg transition-colors ${
                currentServer?.id === server.id 
                  ? 'bg-discord-primary text-white' 
                  : 'bg-discord-channel hover:bg-discord-channel/80 text-discord-text'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center font-medium">
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium truncate">{server.name}</p>
                  <p className="text-xs opacity-75 truncate">
                    {server.channels?.length || 0} channels
                  </p>
                </div>
              </div>
            </button>

            {/* Channels for current server */}
            {currentServer?.id === server.id && server.channels && (
              <div className="ml-4 space-y-1">
                {server.channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel)}
                    className={`w-full p-2 rounded transition-colors text-left ${
                      currentChannel?.id === channel.id
                        ? 'bg-discord-primary text-white'
                        : 'text-discord-muted hover:text-discord-text hover:bg-discord-channel/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getChannelIcon(channel.type)}</span>
                      <span className="text-sm truncate">{channel.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Create Server Button */}
        <button
          onClick={() => setShowCreateServer(true)}
          className="w-full p-3 rounded-lg bg-discord-channel hover:bg-discord-channel/80 text-discord-text transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Create Server</span>
          </div>
        </button>

        {/* Join Server Button */}
        <button
          onClick={() => setShowJoinServer(true)}
          className="w-full p-3 rounded-lg bg-discord-channel hover:bg-discord-channel/80 text-discord-text transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Join Server</span>
          </div>
        </button>

        {/* Create Channel Button (only show if server is selected) */}
        {currentServer && (
          <button
            onClick={() => setShowCreateChannel(true)}
            className="w-full p-3 rounded-lg bg-discord-channel hover:bg-discord-channel/80 text-discord-text transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-medium">Create Channel</span>
            </div>
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-discord-text truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-discord-muted truncate">
              {user.email}
            </p>
          </div>
          <div className="w-4 h-4"></div>
        </div>
      </div>

      {/* Create Server Modal */}
      {showCreateServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-discord-text mb-4">Create Server</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter server name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={serverDescription}
                  onChange={(e) => setServerDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  rows={3}
                  placeholder="Describe your server..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Privacy Level
                </label>
                <select
                  value={serverPrivacy}
                  onChange={(e) => setServerPrivacy(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Invite only</option>
                  <option value="invite_only">Invite Only - Requires invite link</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateServer(false)}
                  className="flex-1 px-4 py-2 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateServer}
                  disabled={loading || !serverName.trim()}
                  className="flex-1 px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Server'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-discord-text mb-4">Create Channel</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter channel name"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 px-4 py-2 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={loading || !channelName.trim()}
                  className="flex-1 px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Server Modal */}
      {showJoinServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-discord-text mb-4">Join Server</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter invite code"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowJoinServer(false)}
                  className="flex-1 px-4 py-2 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinServer}
                  disabled={loading || !inviteCode.trim()}
                  className="flex-1 px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Server'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
