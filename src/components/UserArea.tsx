import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import OnlineUsers from './OnlineUsers'
import { supabase } from '../integrations/supabase/client'
import { toast } from 'sonner'
import { Server } from '../integrations/supabase/types'

interface UserAreaProps {
  server?: Server
}

interface UserSettings {
  status: string
  display_name: string
  bio: string
  theme: string
  notifications: boolean
}

export default function UserArea({ server }: UserAreaProps) {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    status: 'online',
    display_name: '',
    bio: '',
    theme: 'dark',
    notifications: true
  })
  const [loading, setLoading] = useState(false)

  const loadUserSettings = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setUserSettings({
          status: data.status || 'online',
          display_name: data.display_name || user.display_name || '',
          bio: data.bio || '',
          theme: data.theme || 'dark',
          notifications: data.notifications !== false
        })
      } else {
        // Create default settings
        await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            status: 'online',
            display_name: user.display_name || user.username,
            bio: '',
            theme: 'dark',
            notifications: true
          })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user, loadUserSettings])

  const updateUserStatus = async (status: string) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          status,
          display_name: userSettings.display_name,
          bio: userSettings.bio,
          theme: userSettings.theme,
          notifications: userSettings.notifications
        })

      if (error) throw error

      setUserSettings(prev => ({ ...prev, status }))
      setShowStatusMenu(false)
      toast.success('Status updated successfully!')
    } catch (error) {
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateUserSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          status: userSettings.status,
          display_name: userSettings.display_name,
          bio: userSettings.bio,
          theme: userSettings.theme,
          notifications: userSettings.notifications
        })

      if (error) throw error

      setShowSettings(false)
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      default: return 'bg-green-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'idle': return 'Idle'
      case 'dnd': return 'Do Not Disturb'
      case 'invisible': return 'Invisible'
      default: return 'Online'
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col h-full">
      {/* Online Users */}
      <div className="flex-1 overflow-y-auto">
        <OnlineUsers server={server || null} />
      </div>

      {/* User Info Bar */}
      <div className="mt-4 relative">
        <div 
          className="bg-discord-channel hover:bg-discord-channel/80 p-3 rounded-md cursor-pointer transition-colors"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              {/* Online Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(userSettings.status)} rounded-full border-2 border-discord-channel`}></div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-discord-text truncate">
                {userSettings.display_name || user.display_name || user.username}
              </p>
              <p className="text-xs text-discord-muted truncate">
                {getStatusText(userSettings.status)}
              </p>
            </div>

            {/* Dropdown Arrow */}
            <svg 
              className={`w-4 h-4 text-discord-muted transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-discord-sidebar border border-gray-700 rounded-md shadow-lg z-50">
            <div className="p-3 border-b border-gray-700">
              <p className="text-sm font-medium text-discord-text">
                {userSettings.display_name || user.display_name || user.username}
              </p>
              <p className="text-xs text-discord-muted">
                {user.email}
              </p>
            </div>
            
            <div className="py-1">
              {/* Status Management */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full px-3 py-2 text-left text-sm text-discord-text hover:bg-discord-channel transition-colors flex items-center justify-between"
                >
                  <span>Set Status</span>
                  <div className={`w-3 h-3 ${getStatusColor(userSettings.status)} rounded-full`}></div>
                </button>
                
                {showStatusMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-discord-sidebar border border-gray-700 rounded-md shadow-lg">
                    {[
                      { status: 'online', label: 'Online', color: 'bg-green-500' },
                      { status: 'idle', label: 'Idle', color: 'bg-yellow-500' },
                      { status: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
                      { status: 'invisible', label: 'Invisible', color: 'bg-gray-500' }
                    ].map((statusOption) => (
                      <button
                        key={statusOption.status}
                        onClick={() => updateUserStatus(statusOption.status)}
                        disabled={loading}
                        className="w-full px-3 py-2 text-left text-sm text-discord-text hover:bg-discord-channel transition-colors flex items-center space-x-2"
                      >
                        <div className={`w-3 h-3 ${statusOption.color} rounded-full`}></div>
                        <span>{statusOption.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false)
                  setShowSettings(true)
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-text hover:bg-discord-channel transition-colors"
              >
                User Settings
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  // TODO: Open privacy settings
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-text hover:bg-discord-channel transition-colors"
              >
                Privacy & Safety
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  // TODO: Open activity status
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-text hover:bg-discord-channel transition-colors"
              >
                Activity Status
              </button>
            </div>

            <div className="border-t border-gray-700 py-1">
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  signOut()
                }}
                className="w-full px-3 py-2 text-left text-sm text-discord-danger hover:bg-discord-channel transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-discord-sidebar rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-discord-text">User Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-discord-channel rounded-md transition-colors"
                >
                  <svg className="w-5 h-5 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={userSettings.display_name}
                  onChange={(e) => setUserSettings({ ...userSettings, display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  placeholder="Enter display name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Bio
                </label>
                <textarea
                  value={userSettings.bio}
                  onChange={(e) => setUserSettings({ ...userSettings, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Theme
                </label>
                <select
                  value={userSettings.theme}
                  onChange={(e) => setUserSettings({ ...userSettings, theme: e.target.value })}
                  className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-discord-text">
                    Notifications
                  </label>
                  <p className="text-xs text-discord-muted">
                    Receive notifications for mentions and messages
                  </p>
                </div>
                <button
                  onClick={() => setUserSettings({ ...userSettings, notifications: !userSettings.notifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    userSettings.notifications ? 'bg-discord-primary' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-discord-channel hover:bg-discord-channel/80 text-discord-text font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserSettings}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
