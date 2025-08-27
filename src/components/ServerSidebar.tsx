import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageCircle, Plus, Hash, Volume2, Megaphone, LogOut, Settings } from 'lucide-react'
import { useServers } from '@/hooks/useServers'
import { useAuth } from '@/hooks/useAuth'
import { Server, Channel } from '@/integrations/supabase/types'
import { ServerSettingsModal } from './ServerSettingsModal'

interface ServerSidebarProps {
  currentServer: Server | null
  setCurrentServer: (server: Server | null) => void
  currentChannel: Channel | null
  setCurrentChannel: (channel: Channel | null) => void
}

export function ServerSidebar({ 
  currentServer, 
  setCurrentServer, 
  currentChannel, 
  setCurrentChannel 
}: ServerSidebarProps) {
  const { user, signOut } = useAuth()
  const { servers, createServer, createChannel, joinServer, refreshServers } = useServers()
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [serverName, setServerName] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [serverPrivacy, setServerPrivacy] = useState<'public' | 'private' | 'invite_only'>('public')
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text')

  const handleCreateServer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Creating server:', { serverName, serverDescription, serverPrivacy })
    if (!serverName.trim()) return

    try {
      await createServer.mutateAsync({
        name: serverName.trim(),
        description: serverDescription.trim() || undefined,
        privacyLevel: serverPrivacy
      })
      setServerName('')
      setServerDescription('')
      setServerPrivacy('public')
      setShowCreateServer(false)
    } catch (error) {
      console.error('Failed to create server:', error)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Creating channel:', { channelName, channelType, currentServer })
    if (!channelName.trim() || !currentServer) return

    try {
      await createChannel.mutateAsync({
        serverId: currentServer.id,
        name: channelName.trim(),
        type: channelType
      })
      setChannelName('')
      setChannelType('text')
      setShowCreateChannel(false)
    } catch (error) {
      console.error('Failed to create channel:', error)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Hash className="w-4 h-4" />
      case 'voice':
        return <Volume2 className="w-4 h-4" />
      case 'announcement':
        return <Megaphone className="w-4 h-4" />
      default:
        return <Hash className="w-4 h-4" />
    }
  }

  const handleServerUpdate = (_updatedServer: Server) => {
    // This will trigger a refresh of the servers list
    refreshServers()
  }

  const handleChannelUpdate = () => {
    // Refresh servers to get updated channel list
    refreshServers()
  }

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Servers</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshServers}
            className="h-6 w-6 p-0"
            title="Refresh servers"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Home Server */}
        <Button
          variant="ghost"
          className={`w-full justify-start h-12 ${
            !currentServer ? 'bg-primary text-primary-foreground' : ''
          }`}
          onClick={() => {
            setCurrentServer(null)
            setCurrentChannel(null)
          }}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Home
        </Button>

        {/* User's Servers and Public Servers */}
        {servers.map((server) => (
          <div key={server.id} className="space-y-1">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className={`flex-1 justify-start h-12 ${
                  currentServer?.id === server.id ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => {
                  setCurrentServer(server)
                  setCurrentChannel(server.channels[0] || null)
                }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  {server.name}
                  {!server.isMember && (
                    <span className="text-xs text-muted-foreground ml-2">(Public)</span>
                  )}
                </div>
              </Button>
              
              {/* Join button for public servers user isn't a member of */}
              {!server.isMember && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 px-2"
                  onClick={() => joinServer.mutate(server.id)}
                  disabled={joinServer.isPending}
                >
                  Join
                </Button>
              )}
            </div>

            {/* Channels for current server */}
            {currentServer?.id === server.id && (
              <div className="ml-4 space-y-1">
                {server.channels.map((channel: any) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start h-8 ${
                      currentChannel?.id === channel.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setCurrentChannel(channel)}
                  >
                    {getChannelIcon(channel.type)}
                    <span className="ml-2">{channel.name}</span>
                  </Button>
                ))}
                
                {/* Create Channel Button (only for members) */}
                {server.isMember && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCreateChannel(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Channel
                  </Button>
                )}

                {/* Server Settings Button (only for owners) */}
                {server.isMember && server.owner_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowServerSettings(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Server Settings
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Create Server Button */}
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-muted-foreground hover:text-foreground"
          onClick={() => setShowCreateServer(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Server
        </Button>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create Server Modal */}
      {showCreateServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96 max-w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create a Server</h2>
            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Enter server name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="server-description">Description (Optional)</Label>
                <textarea
                  id="server-description"
                  value={serverDescription}
                  onChange={(e) => setServerDescription(e.target.value)}
                  placeholder="Enter server description"
                  rows={3}
                  className="w-full p-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <Label htmlFor="server-privacy">Privacy Level</Label>
                <select
                  id="server-privacy"
                  value={serverPrivacy}
                  onChange={(e) => setServerPrivacy(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="invite_only">Invite Only - Requires invite link</option>
                  <option value="private">Private - Only owner can add members</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateServer(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createServer.isPending}>
                  {createServer.isPending ? 'Creating...' : 'Create Server'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96 max-w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Create a Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="channel-type">Channel Type</Label>
                <select
                  id="channel-type"
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as any)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="text">Text Channel</option>
                  <option value="voice">Voice Channel</option>
                  <option value="announcement">Announcement Channel</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateChannel(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createChannel.isPending}>
                  {createChannel.isPending ? 'Creating...' : 'Create Channel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server Settings Modal */}
      <ServerSettingsModal
        server={currentServer}
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        onServerUpdate={handleServerUpdate}
        onChannelUpdate={handleChannelUpdate}
      />
    </div>
  )
}
