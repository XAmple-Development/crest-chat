import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useServers } from '@/hooks/useServers'
import { ServerSidebar } from '@/components/ServerSidebar'
import { ChatArea } from '@/components/ChatArea'


export function ChatApp() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { 
    serversLoading, 
    currentServer, 
    setCurrentServer, 
    currentChannel, 
    setCurrentChannel 
  } = useServers()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading || serversLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-pulse bg-primary/20 rounded-full" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Server Sidebar */}
      <ServerSidebar
        currentServer={currentServer}
        setCurrentServer={setCurrentServer}
        currentChannel={currentChannel}
        setCurrentChannel={setCurrentChannel}
      />

      {/* Chat Area */}
      <ChatArea
        currentChannel={currentChannel}
        currentServer={currentServer}
      />
    </div>
  )
}
