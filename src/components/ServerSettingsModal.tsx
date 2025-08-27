import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Users, Hash, Volume2, Megaphone, Edit, Trash2, Plus, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Server, Channel } from '@/integrations/supabase/types'

interface ServerSettingsModalProps {
  server: Server | null
  isOpen: boolean
  onClose: () => void
  onServerUpdate: (updatedServer: Server) => void
  onChannelUpdate: () => void
}

export function ServerSettingsModal({ 
  server, 
  isOpen, 
  onClose, 
  onServerUpdate,
  onChannelUpdate 
}: ServerSettingsModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'members' | 'roles' | 'safety'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Server form data
  const [serverName, setServerName] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'private' | 'invite_only'>('public')
  
  // Channel form data
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  
  // Members data
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  // Channels data
  const [channels, setChannels] = useState<Channel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)

  const isOwner = server?.owner_id === user?.id

  useEffect(() => {
    if (server && isOpen) {
      setServerName(server.name)
      setServerDescription(server.description || '')
      setPrivacyLevel(server.privacy_level as any || 'public')
      loadChannels()
      loadMembers()
    }
  }, [server, isOpen])

  const loadChannels = async () => {
    if (!server) return
    setLoadingChannels(true)
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', server.id)
        .order('position', { ascending: true })
      
      if (error) throw error
      setChannels(data || [])
    } catch (error) {
      console.error('Error loading channels:', error)
      toast.error('Failed to load channels')
    } finally {
      setLoadingChannels(false)
    }
  }

  const loadMembers = async () => {
    if (!server) return
    setLoadingMembers(true)
    try {
      const { data, error } = await supabase
        .from('server_members')
        .select(`
          user_id,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .eq('server_id', server.id)
      
      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSaveServer = async () => {
    if (!server || !isOwner) return
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('servers')
        .update({
          name: serverName,
          description: serverDescription || null,
          privacy_level: privacyLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', server.id)
        .select()
        .single()
      
      if (error) throw error
      
      onServerUpdate(data)
      setIsEditing(false)
      toast.success('Server updated successfully!')
    } catch (error) {
      console.error('Error updating server:', error)
      toast.error('Failed to update server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server || !channelName.trim()) return
    
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          server_id: server.id,
          name: channelName.trim(),
          type: channelType,
          position: channels.length
        })
      
      if (error) throw error
      
      setChannelName('')
      setChannelType('text')
      setShowCreateChannel(false)
      loadChannels()
      onChannelUpdate()
      toast.success(`Channel "${channelName}" created!`)
    } catch (error) {
      console.error('Error creating channel:', error)
      toast.error('Failed to create channel')
    }
  }

  const handleDeleteChannel = async (channelId: string, channelName: string) => {
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"?`)) return
    
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)
      
      if (error) throw error
      
      loadChannels()
      onChannelUpdate()
      toast.success(`Channel "${channelName}" deleted!`)
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast.error('Failed to delete channel')
    }
  }

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!server || !isOwner) return
    if (!confirm(`Are you sure you want to remove ${username} from the server?`)) return
    
    try {
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', server.id)
        .eq('user_id', userId)
      
      if (error) throw error
      
      loadMembers()
      toast.success(`${username} removed from server`)
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text': return <Hash className="w-4 h-4" />
      case 'voice': return <Volume2 className="w-4 h-4" />
      case 'announcement': return <Megaphone className="w-4 h-4" />
      default: return <Hash className="w-4 h-4" />
    }
  }

  if (!isOpen || !server) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-4xl h-[80vh] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {server.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{server.name}</h2>
                <p className="text-sm text-muted-foreground">Server Settings</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: Settings },
            { id: 'channels', label: 'Channels', icon: Hash },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'roles', label: 'Roles', icon: Shield },
            { id: 'safety', label: 'Safety', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Server Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="server-name">Server Name</Label>
                    <Input
                      id="server-name"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      disabled={!isEditing || !isOwner}
                    />
                  </div>
                  <div>
                    <Label htmlFor="server-description">Description</Label>
                    <textarea
                      id="server-description"
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      disabled={!isEditing || !isOwner}
                      rows={3}
                      className="w-full p-2 border rounded-md bg-background disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="privacy-level">Privacy Level</Label>
                    <select
                      id="privacy-level"
                      value={privacyLevel}
                      onChange={(e) => setPrivacyLevel(e.target.value as any)}
                      disabled={!isEditing || !isOwner}
                      className="w-full p-2 border rounded-md bg-background disabled:opacity-50"
                    >
                      <option value="public">Public - Anyone can join</option>
                      <option value="invite_only">Invite Only - Requires invite link</option>
                      <option value="private">Private - Only owner can add members</option>
                    </select>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSaveServer} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Server
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Channels</h3>
                {isOwner && (
                  <Button onClick={() => setShowCreateChannel(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Channel
                  </Button>
                )}
              </div>

              {loadingChannels ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading channels...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getChannelIcon(channel.type)}
                        <span className="font-medium">{channel.name}</span>
                        <span className="text-sm text-muted-foreground capitalize">{channel.type}</span>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChannel(channel.id, channel.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {channels.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No channels yet. {isOwner && 'Create your first channel!'}
                    </p>
                  )}
                </div>
              )}

              {/* Create Channel Modal */}
              {showCreateChannel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-background p-6 rounded-lg w-96 max-w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Create Channel</h3>
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
                        <Button type="submit">
                          Create Channel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Members ({members.length})</h3>
              
              {loadingMembers ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading members...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.display_name || member.profiles?.username || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.username}
                          </p>
                        </div>
                      </div>
                      {isOwner && member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id, member.profiles?.username || 'User')}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Roles</h3>
              <p className="text-muted-foreground">
                Role management coming soon. For now, server owners have full control.
              </p>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Safety & Privacy</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Privacy Level</h4>
                  <p className="text-sm text-muted-foreground">
                    Current: <span className="font-medium capitalize">{privacyLevel}</span>
                  </p>
                  {privacyLevel === 'public' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Anyone can find and join this server
                    </p>
                  )}
                  {privacyLevel === 'invite_only' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Only users with invite links can join
                    </p>
                  )}
                  {privacyLevel === 'private' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Only you can add members to this server
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
