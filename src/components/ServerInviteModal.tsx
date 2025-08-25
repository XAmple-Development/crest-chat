import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServerInvites } from '@/hooks/useServerInvites';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServerInviteModalProps {
  serverId: string;
  serverName: string;
  currentInviteCode?: string;
  trigger?: React.ReactNode;
}

export function ServerInviteModal({ 
  serverId, 
  serverName, 
  currentInviteCode,
  trigger 
}: ServerInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState(currentInviteCode || '');
  const { generateInviteCode, loading } = useServerInvites();
  const { toast } = useToast();

  const handleGenerateInvite = async () => {
    const newInviteCode = await generateInviteCode(serverId);
    if (newInviteCode) {
      setInviteCode(newInviteCode);
      toast({
        title: "Invite code generated!",
        description: "Share this code with others to invite them to your server."
      });
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy invite code."
      });
    }
  };

  const inviteUrl = inviteCode ? `${window.location.origin}/invite/${inviteCode}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">Invite People</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to {serverName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Invite Code</Label>
            <div className="flex space-x-2">
              <Input
                value={inviteCode}
                readOnly
                placeholder="Generate an invite code"
                className="font-mono text-center"
              />
              <Button
                onClick={handleGenerateInvite}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {inviteCode && (
            <>
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex space-x-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCopyInvite}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Share this invite code or link with others to invite them to your server.
              </div>
            </>
          )}

          {!inviteCode && (
            <div className="text-center py-4">
              <Button onClick={handleGenerateInvite} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invite Code'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
