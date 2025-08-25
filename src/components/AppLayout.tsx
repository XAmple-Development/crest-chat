import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { ServerSidebar } from "@/components/ServerSidebar";
import { ChatArea } from "@/components/ChatArea";
import { OnlineUsers } from "@/components/OnlineUsers";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AppLayout() {
  const [showDemo, setShowDemo] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const { signOut } = useAuth();
  const { servers } = useServers();
  const { toast } = useToast();

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

      <main className="flex h-full">
        {/* Server Sidebar */}
        <ServerSidebar 
          servers={servers}
          selectedServerId={selectedServerId}
          onServerSelect={setSelectedServerId}
          onChannelSelect={setSelectedChannelId}
        />
        
        {/* Chat Area */}
        <ChatArea 
          selectedChannelId={selectedChannelId}
          selectedServerId={selectedServerId}
        />
        
        {/* Online Users */}
        <OnlineUsers selectedServerId={selectedServerId} />
      </main>
    </div>
  );
}