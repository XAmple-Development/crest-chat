import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle, Plus, Hash, Volume2, Megaphone, LogOut } from 'lucide-react'
import { useServers } from '@/hooks/useServers'
import { useAuth } from '@/hooks/useAuth'
import { Server, Channel } from '@/integrations/supabase/types'

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
  const { servers, createServer, createChannel } = useServers()
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false)
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [serverName, setServerName] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text')

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverName.trim()) return

    try {
      await createServer.mutateAsync({
        name: serverName.trim(),
        description: serverDescription.trim() || undefined
      })
      setServerName('')
      setServerDescription('')
      setIsCreateServerOpen(false)
    } catch (error) {
      console.error('Failed to create server:', error)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelName.trim() || !currentServer) return

    try {
      await createChannel.mutateAsync({
        serverId: currentServer.id,
        name: channelName.trim(),
        type: channelType
      })
      setChannelName('')
      setChannelType('text')
      setIsCreateChannelOpen(false)
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

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Servers</h2>
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

        {/* User's Servers */}
        {servers.map((server) => (
          <div key={server.id} className="space-y-1">
            <Button
              variant="ghost"
              className={`w-full justify-start h-12 ${
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
              {server.name}
            </Button>

            {/* Channels for current server */}
            {currentServer?.id === server.id && (
              <div className="ml-4 space-y-1">
                {server.channels.map((channel) => (
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
                
                {/* Create Channel Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsCreateChannelOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Channel
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Create Server Button */}
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-muted-foreground hover:text-foreground"
          onClick={() => setIsCreateServerOpen(true)}
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

      {/* Create Server Dialog */}
      <Dialog open={isCreateServerOpen} onOpenChange={setIsCreateServerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Server</DialogTitle>
          </DialogHeader>
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
              <Textarea
                id="server-description"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder="Enter server description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateServerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createServer.isPending}>
                {createServer.isPending ? 'Creating...' : 'Create Server'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Channel</DialogTitle>
          </DialogHeader>
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
              <Select value={channelType} onValueChange={(value: any) => setChannelType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Channel</SelectItem>
                  <SelectItem value="voice">Voice Channel</SelectItem>
                  <SelectItem value="announcement">Announcement Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateChannelOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createChannel.isPending}>
                {createChannel.isPending ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
