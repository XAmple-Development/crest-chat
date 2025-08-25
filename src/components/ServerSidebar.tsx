import { Hash, Volume2, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Server {
  id: string;
  name: string;
  icon?: string;
  active?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  active?: boolean;
}

const servers: Server[] = [
  { id: '1', name: 'LovableChat', icon: 'LC', active: true },
  { id: '2', name: 'Gaming Hub', icon: 'GH' },
  { id: '3', name: 'Dev Community', icon: 'DC' },
];

const channels: Channel[] = [
  { id: '1', name: 'general', type: 'text', active: true },
  { id: '2', name: 'announcements', type: 'text' },
  { id: '3', name: 'random', type: 'text' },
  { id: '4', name: 'General Voice', type: 'voice' },
  { id: '5', name: 'Gaming', type: 'voice' },
];

export function ServerSidebar() {
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
            className={`server-icon ${server.active ? 'active' : ''}`}
          >
            {server.icon}
          </div>
        ))}
        
        {/* Add Server Button */}
        <div className="server-icon bg-muted hover:bg-primary hover:text-primary-foreground">
          <Plus className="w-5 h-5" />
        </div>
      </div>

      {/* Channels Column */}
      <div className="w-60 bg-discord-gray-200 flex flex-col">
        {/* Server Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border shadow-sm">
          <h2 className="font-semibold text-foreground">LovableChat</h2>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Channels List */}
        <div className="flex-1 p-2 discord-scrollbar overflow-y-auto">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Text Channels
            </div>
            
            {channels
              .filter(channel => channel.type === 'text')
              .map((channel) => (
                <div
                  key={channel.id}
                  className={`channel-item ${channel.active ? 'active' : ''}`}
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
                  className={`channel-item ${channel.active ? 'active' : ''}`}
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  <span className="text-sm">{channel.name}</span>
                </div>
              ))}
          </div>
        </div>

        {/* User Area */}
        <div className="h-14 bg-discord-gray-300 px-2 flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              JD
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 status-online rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">John Doe</div>
            <div className="text-xs text-muted-foreground">#1234</div>
          </div>
        </div>
      </div>
    </div>
  );
}