import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import OnlineUsers from './OnlineUsers'

export default function UserArea() {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      {/* User Info Bar */}
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
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-discord-channel"></div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-discord-text truncate">
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-discord-muted truncate">
              {user.status || 'Online'}
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
              {user.display_name || user.username}
            </p>
            <p className="text-xs text-discord-muted">
              {user.email}
            </p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                setShowUserMenu(false)
                // TODO: Open user settings
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
  )
}
