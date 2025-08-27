import { useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'
import { Server, Channel } from '../integrations/supabase/types'
import { toast } from 'sonner'

interface ServerSettingsModalProps {
  server: Server | null
  isOpen: boolean
  onClose: () => void
  onServerUpdate: () => void
  onChannelUpdate: () => void
}

export default function ServerSettingsModal({
  server,
  isOpen,
  onClose,
  onServerUpdate,
  onChannelUpdate
}: ServerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [serverForm, setServerForm] = useState({
    name: '',
    description: '',
    privacyLevel: 'public'
  })
  const [newChannelName, setNewChannelName] = useState('')

  useEffect(() => {
    if (server && isOpen) {
      setServerForm({
        name: server.name,
        description: server.description || '',
        privacyLevel: server.privacy_level
      })
      loadChannels()
      loadMembers()
    }
  }, [server, isOpen])

  const loadChannels = async () => {
    if (!server) return
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
    }
  }

  const loadMembers = async () => {
    if (!server) return
    setLoadingMembers(true)
    try {
      console.log('Loading members for server:', server.id)

      const { data, error } = await supabase
        .from('server_members')
        .select(`
          user_id,
          user:profiles!server_members_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .eq('server_id', server.id)

      if (error) {
        console.error('Supabase error loading members:', error)
        throw error
      }

      console.log('Members loaded successfully:', data)
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Failed to load members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSaveServer = async () => {
    if (!server) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('servers')
        .update({
          name: serverForm.name,
          description: serverForm.description,
          privacy_level: serverForm.privacyLevel
        })
        .eq('id', server.id)

      if (error) throw error
      toast.success('Server updated successfully!')
      onServerUpdate()
    } catch (error: any) {
      toast.error(`Failed to update server: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChannel = async () => {
    if (!server || !newChannelName.trim()) return
    try {
      const { error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName.trim(),
          server_id: server.id,
          type: 'text'
        })

      if (error) throw error
      toast.success('Channel created successfully!')
      setNewChannelName('')
      loadChannels()
      onChannelUpdate()
    } catch (error: any) {
      toast.error(`Failed to create channel: ${error.message}`)
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId)

      if (error) throw error
      toast.success('Channel deleted successfully!')
      loadChannels()
      onChannelUpdate()
    } catch (error: any) {
      toast.error(`Failed to delete channel: ${error.message}`)
    }
  }

  const handleRemoveMember = async (userId: string, username: string) => {
    if (!server || !confirm(`Are you sure you want to remove ${username} from this server?`)) return
    try {
      const { error } = await supabase
        .from('server_members')
        .delete()
        .eq('server_id', server.id)
        .eq('user_id', userId)

      if (error) throw error
      toast.success('Member removed successfully!')
      loadMembers()
    } catch (error: any) {
      toast.error(`Failed to remove member: ${error.message}`)
    }
  }

  if (!isOpen || !server) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-discord-sidebar rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-discord-text">Server Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-discord-channel rounded-md transition-colors"
            >
              <svg className="w-5 h-5 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Tabs */}
          <div className="w-48 bg-discord-channel p-4">
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'channels', label: 'Channels' },
                { id: 'members', label: 'Members' },
                { id: 'roles', label: 'Roles' },
                { id: 'safety', label: 'Safety' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-discord-primary text-white'
                      : 'text-discord-muted hover:text-discord-text hover:bg-discord-channel/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-discord-text">Server Overview</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-discord-text mb-2">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={serverForm.name}
                      onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-discord-text mb-2">
                      Description
                    </label>
                    <textarea
                      value={serverForm.description}
                      onChange={(e) => setServerForm({ ...serverForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
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

                  <button
                    onClick={handleSaveServer}
                    disabled={loading}
                    className="px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors duration-200"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-discord-text">Channels</h3>
                
                {/* Create New Channel */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-discord-text">Create Channel</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="Enter channel name"
                      className="flex-1 px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleCreateChannel}
                      disabled={!newChannelName.trim()}
                      className="px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors duration-200"
                    >
                      Create
                    </button>
                  </div>
                </div>

                {/* Channel List */}
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-discord-text">Existing Channels</h4>
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 bg-discord-channel rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-discord-muted">#</span>
                        <span className="text-discord-text">{channel.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="px-3 py-1 bg-discord-danger hover:bg-discord-danger/90 text-white text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-discord-text">Members</h3>
                
                {loadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-primary mx-auto mb-2"></div>
                    <p className="text-discord-muted">Loading members...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 bg-discord-channel rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
                            {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-discord-text font-medium">
                              {member.user?.display_name || member.user?.username || 'Unknown User'}
                            </p>
                            <p className="text-discord-muted text-sm">
                              {member.user?.username}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.user_id, member.user?.username || 'User')}
                          className="px-3 py-1 bg-discord-danger hover:bg-discord-danger/90 text-white text-sm rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-discord-text">Roles</h3>
                <p className="text-discord-muted">Role management coming soon...</p>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-discord-text">Safety</h3>
                <p className="text-discord-muted">Safety settings coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
