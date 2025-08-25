import { Hash, Volume2, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChannels, Server } from "@/hooks/useServers";
import { useServers } from "@/hooks/useServers";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

  const currentServer = servers.find(s => s.id === selectedServerId);

  const handleCreateServer = async () => {
    if (!newServerName.trim()) return;
    
    setIsCreating(true);
    const server = await createServer(newServerName.trim());
    
    if (server) {
      onServerSelect(server.id);
      setNewServerName("");
      setIsDialogOpen(false);
      toast({
        title: "Server created!",
        description: `Welcome to ${server.name}`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create server"
      });
    }
    setIsCreating(false);
  };

  const handleChannelClick = (channelId: string) => {
    onChannelSelect(channelId);
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
      </div>

      {/* Channels Column */}
      <div className="w-60 bg-discord-gray-200 flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shadow-sm">
          <h2 className="font-semibold text-foreground">
            {currentServer ? currentServer.name : 'Select a server'}
          </h2>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-2 discord-scrollbar overflow-y-auto">
          {selectedServerId && !channelsLoading ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Text Channels
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
        <div className="h-14 bg-discord-gray-300 px-2 flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.email?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 status-online rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-xs text-muted-foreground">#0001</div>
          </div>
        </div>
      </div>
    </div>
  );
}