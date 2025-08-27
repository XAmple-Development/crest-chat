import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Users, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Server } from '@/integrations/supabase/types'

export function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [serverInfo, setServerInfo] = useState<Server | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (inviteCode) {
      // TODO: Fetch server info from invite code
      setServerInfo({
        id: 'temp-id',
        name: 'Sample Server',
        description: 'A sample server for testing invites',
        owner_id: 'temp-owner',
        privacy_level: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Server)
      setIsLoading(false)
    }
  }, [inviteCode])

  const handleJoinServer = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      // TODO: Join server logic
      console.log('Joining server with invite code:', inviteCode)
      navigate('/app')
    } catch (error) {
      console.error('Error joining server:', error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 animate-pulse text-white" />
          <p className="text-white">Loading invite...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <MessageCircle className="w-8 h-8 mx-auto text-white mb-2" />
          <span className="text-2xl font-bold text-white">CrestChat</span>
        </div>

        {/* Invite Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">You've been invited to join</CardTitle>
            <CardDescription className="text-gray-300">
              {serverInfo?.name || 'Unknown Server'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Server Info */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{serverInfo?.name || 'Unknown Server'}</h3>
                  <div className="flex items-center space-x-1 text-gray-300 text-sm">
                    <Users className="w-4 h-4" />
                    <span>0 members</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                {serverInfo?.description || 'Join this server to start chatting with the community!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user ? (
                <Button
                  onClick={handleJoinServer}
                  className="w-full gradient-blurple text-white"
                >
                  Accept Invite
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full gradient-blurple text-white"
                >
                  Sign in to join
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
