import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { MessageCircle, Plus, Settings, LogOut } from 'lucide-react'

export function ChatApp() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 animate-pulse" />
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
      <div className="w-20 bg-card border-r border-border flex flex-col items-center py-4 space-y-4">
        {/* Home Server */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>

        {/* Separator */}
        <div className="w-8 h-px bg-border" />

        {/* Add Server */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Settings */}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80"
          onClick={() => {/* TODO: Open settings */}}
        >
          <Settings className="w-6 h-6" />
        </Button>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80"
          onClick={signOut}
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 bg-card border-b border-border flex items-center px-4">
          <h1 className="text-lg font-semibold">Welcome to CrestChat!</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Welcome, {user.email}!</h2>
            <p className="text-muted-foreground mb-6">
              This is your Discord-like chat application. More features coming soon!
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Create servers and channels
              </p>
              <p className="text-sm text-muted-foreground">
                • Send real-time messages
              </p>
              <p className="text-sm text-muted-foreground">
                • Voice and video chat
              </p>
              <p className="text-sm text-muted-foreground">
                • User roles and permissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
