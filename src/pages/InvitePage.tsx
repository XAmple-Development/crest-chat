import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useServerInvites } from '@/hooks/useServerInvites';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function InvitePage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { joinServerByInvite, loading: joinLoading } = useServerInvites();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    const fetchServerInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('servers')
          .select(`
            *,
            profiles!servers_owner_id_fkey (
              username,
              display_name
            )
          `)
          .eq('invite_code', inviteCode)
          .single();

        if (error || !data) {
          setError('This invite link is invalid or has expired');
          setLoading(false);
          return;
        }

        setServerInfo(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load server information');
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, [inviteCode]);

  const handleJoinServer = async () => {
    if (!inviteCode) return;

    const server = await joinServerByInvite(inviteCode);
    if (server) {
      navigate('/');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Sign in to join</CardTitle>
            <CardDescription>
              You need to sign in to join this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <MessageSquare className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
            {serverInfo?.name?.substring(0, 2).toUpperCase()}
          </div>
          <CardTitle className="text-xl">{serverInfo?.name}</CardTitle>
          <CardDescription>
            {serverInfo?.description || 'A Discord-style server'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{serverInfo?.member_count || 0} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>Text channels</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleJoinServer}
              disabled={joinLoading}
              className="w-full"
            >
              {joinLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Server'
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
