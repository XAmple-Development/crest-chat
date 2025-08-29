import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useServers } from '../hooks/useServers'
import ServerSidebar from '../components/ServerSidebar'
import ChatArea from '../components/ChatArea'
import UserArea from '../components/UserArea'
import ServerSettingsModal from '../components/ServerSettingsModal'
import { Server, Channel } from '../integrations/supabase/types'
import { useDMMessages } from '@/hooks/useDMs'
import { useEffect, useRef, useState as useLocalState } from 'react'

export default function ChatApp() {
  const { user } = useAuth()
  const { servers, isLoading } = useServers()
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [currentDMThreadId, setCurrentDMThreadId] = useState<string | null>(null)

  const handleServerSelect = (server: Server) => {
    setCurrentDMThreadId(null)
    setCurrentServer(server)
    // Set first channel as default
    if (server.channels && server.channels.length > 0) {
      setCurrentChannel(server.channels[0])
    } else {
      setCurrentChannel(null)
    }
  }

  const handleChannelSelect = (channel: Channel) => {
    setCurrentDMThreadId(null)
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
        onDMSelect={(threadId) => {
          setCurrentServer(null)
          setCurrentChannel(null as any)
          setCurrentDMThreadId(threadId)
        }}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentDMThreadId ? (
          <DMChat threadId={currentDMThreadId} />
        ) : currentServer && currentChannel ? (
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

function DMChat({ threadId }: { threadId: string }) {
  const { messages, messagesLoading, sendDM } = useDMMessages(threadId)
  const [value, setValue] = useLocalState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSend = async () => {
    if (!value.trim()) return
    await sendDM.mutateAsync({ threadId, content: value.trim() })
    setValue('')
  }

  return (
    <div className="flex flex-col h-full bg-discord-bg">
      <div className="bg-discord-channel border-b border-gray-700 px-6 py-4">
        <h2 className="text-lg font-semibold text-discord-text">Direct Message</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesLoading ? (
          <div className="text-discord-text/70">Loading…</div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-discord-primary text-white flex items-center justify-center">
                {m.author?.username?.[0]?.toUpperCase?.() || 'U'}
              </div>
              <div>
                <div className="text-sm text-discord-text/90">
                  <span className="font-medium mr-2">{m.author?.display_name || m.author?.username || 'User'}</span>
                  <span className="text-xs text-discord-text/60">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div className="text-discord-text whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            className="flex-1 px-4 py-3 rounded-md bg-discord-input text-discord-text placeholder:text-discord-text/50 focus:outline-none"
            placeholder="Message user"
          />
          <button
            onClick={onSend}
            disabled={!value.trim() || sendDM.isPending}
            className="px-4 py-3 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white rounded-md"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
