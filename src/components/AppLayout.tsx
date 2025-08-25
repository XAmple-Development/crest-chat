import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { ServerSidebar } from "@/components/ServerSidebar";
import { ChatArea } from "@/components/ChatArea";
import { OnlineUsers } from "@/components/OnlineUsers";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogOut, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const [showDemo, setShowDemo] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const { servers } = useServers();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (!showDemo) {
    return (
      <div className="relative">
        <WelcomeScreen />
        <div className="fixed bottom-6 right-6 z-10 flex gap-2">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
          <Button
            onClick={() => setShowDemo(true)}
            className="gradient-blurple text-white shadow-discord animate-pulse-glow"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Enter Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden relative">
      {/* Demo Mode Toggle */}
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
        <Button
          onClick={() => setShowDemo(false)}
          variant="outline"
          className="bg-card/90 backdrop-blur-sm border-border hover:bg-secondary"
        >
          <EyeOff className="w-4 h-4 mr-2" />
          Back to Welcome
        </Button>
      </div>

      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-20 bg-card/90 backdrop-blur-sm border-border hover:bg-secondary"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      )}

      <main className="flex h-full">
        {/* Server Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-10 transform transition-transform duration-300 ease-in-out' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}
        `}>
          <ServerSidebar 
            servers={servers}
            selectedServerId={selectedServerId}
            onServerSelect={(serverId) => {
              setSelectedServerId(serverId);
              if (isMobile) setSidebarOpen(false);
            }}
            onChannelSelect={(channelId) => {
              setSelectedChannelId(channelId);
              if (isMobile) setSidebarOpen(false);
            }}
          />
        </div>
        
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-5"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Chat Area */}
        <div className={`flex-1 ${isMobile ? 'ml-0' : ''}`}>
          <ChatArea 
            selectedChannelId={selectedChannelId}
            selectedServerId={selectedServerId}
          />
        </div>
        
        {/* Online Users - Hidden on mobile */}
        {!isMobile && (
          <OnlineUsers selectedServerId={selectedServerId} />
        )}
      </main>
    </div>
  );
}