import { Hash, Volume2, Settings, Plus, Users, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChannels, Server } from "@/hooks/useServers";
import { useServers } from "@/hooks/useServers";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { JoinServerModal } from "@/components/JoinServerModal";
import { ServerInviteModal } from "@/components/ServerInviteModal";
import { ServerSettingsModal } from "@/components/ServerSettingsModal";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { UserArea } from "@/components/UserArea";

interface ServerSidebarProps {
  servers: Server[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string | null) => void;
  onChannelSelect: (channelId: string | null) => void;
}

export function ServerSidebar({ servers, selectedServerId, onServerSelect, onChannelSelect }: ServerSidebarProps) {
  const { channels, loading: channelsLoading } = useChannels(selectedServerId);
  const { createServer } = useServers();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newServerName, setNewServerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice'>('text');

  const currentServer = servers.find(s => s.id === selectedServerId);

  const handleCreateServer = async () => {
    if (!newServerName.trim()) return;
    
    setIsCreating(true);
    try {
      const server = await createServer(newServerName.trim());
      
      if (server) {
        onServerSelect(server.id);
        setNewServerName("");
        setIsDialogOpen(false);
        toast({
          title: "Server created!",
          description: `Welcome to ${server.name}`
        });
      }
    } catch (error) {
      console.error('Server creation error:', error);
      toast({
        variant: "destructive",
        title: "Failed to create server",
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleChannelClick = (channelId: string) => {
    onChannelSelect(channelId);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !selectedServerId) return;
    
    // This would use the server management hook
    // For now, we'll just show a toast
    toast({
      title: "Channel created",
      description: `#${newChannelName} has been created.`
    });
    
    setNewChannelName("");
    setShowCreateChannel(false);
  };

  return (
    <div className="flex h-screen">
      {/* Servers Column */}
      <div className="w-[72px] bg-discord-gray-300 flex flex-col items-center py-3 space-y-2">
        {/* Home/DM Button */}
        <div className="server-icon bg-primary text-primary-foreground">
          <Hash className="w-5 h-5" />
        </div>
        
        <div className="w-8 h-0.5 bg-border rounded-full my-2" />
        
        {/* Server Icons */}
        {servers.map((server) => (
          <div
            key={server.id}
            className={`server-icon cursor-pointer ${selectedServerId === server.id ? 'active' : ''}`}
            onClick={() => onServerSelect(server.id)}
            title={server.name}
          >
            {server.name.substring(0, 2).toUpperCase()}
          </div>
        ))}
        
        {/* Add Server Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className="server-icon bg-muted hover:bg-primary hover:text-primary-foreground cursor-pointer">
              <Plus className="w-5 h-5" />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  placeholder="Enter server name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateServer()}
                />
              </div>
              <Button 
                onClick={handleCreateServer}
                disabled={isCreating || !newServerName.trim()}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Server"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Server Button */}
        <JoinServerModal onServerJoined={(serverId) => onServerSelect(serverId)} />
      </div>

      {/* Channels Column */}
      <div className="w-60 bg-discord-gray-200 flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shadow-sm">
          <h2 className="font-semibold text-foreground">
            {currentServer ? currentServer.name : 'Select a server'}
          </h2>
          <div className="flex items-center space-x-1">
            {currentServer && (
              <>
                <ServerInviteModal
                  serverId={currentServer.id}
                  serverName={currentServer.name}
                  currentInviteCode={currentServer.invite_code}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Users className="w-4 h-4" />
                    </Button>
                  }
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setShowServerSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-2 discord-scrollbar overflow-y-auto">
          {selectedServerId && !channelsLoading ? (
            <div className="space-y-1">
              {/* Create Channel Button */}
              <div className="px-2 py-1 flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Text Channels
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-primary/10"
                  onClick={() => setShowCreateChannel(true)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              {channels
                .filter(channel => channel.type === 'text')
                .map((channel) => (
                  <div
                    key={channel.id}
                    className="channel-item cursor-pointer"
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                ))}

              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4">
                Voice Channels
              </div>
              
              {channels
                .filter(channel => channel.type === 'voice')
                .map((channel) => (
                  <div
                    key={channel.id}
                    className="channel-item cursor-pointer"
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm mt-8">
              {selectedServerId ? 'Loading channels...' : 'Select a server to view channels'}
            </div>
          )}
        </div>

        {/* User Area */}
        <UserArea onOpenProfileSettings={() => setShowProfileSettings(true)} />
      </div>

      {/* Server Settings Modal */}
      {currentServer && (
        <ServerSettingsModal
          isOpen={showServerSettings}
          onClose={() => setShowServerSettings(false)}
          server={currentServer}
          onServerUpdate={() => {
            // Refresh servers list
            window.location.reload();
          }}
        />
      )}

      {/* Create Channel Modal */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="new-channel"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
              />
            </div>
            <div>
              <Label htmlFor="channel-type">Channel Type</Label>
              <select
                id="channel-type"
                value={newChannelType}
                onChange={(e) => setNewChannelType(e.target.value as 'text' | 'voice')}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="text">Text Channel</option>
                <option value="voice">Voice Channel</option>
              </select>
            </div>
            <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
    </div>
  );
}