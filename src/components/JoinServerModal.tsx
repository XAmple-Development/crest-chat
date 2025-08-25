import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServerInvites } from '@/hooks/useServerInvites';
import { Plus, Loader2 } from 'lucide-react';

interface JoinServerModalProps {
  onServerJoined?: (serverId: string) => void;
}

export function JoinServerModal({ onServerJoined }: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { joinServerByInvite, loading } = useServerInvites();

  const handleJoinServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    const server = await joinServerByInvite(inviteCode);
    if (server) {
      setInviteCode('');
      setIsOpen(false);
      onServerJoined?.(server.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleJoinServer} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code (e.g., ABC123)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="uppercase"
            />
          </div>
          <Button 
            type="submit"
            className="w-full"
            disabled={loading || !inviteCode.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Server'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
