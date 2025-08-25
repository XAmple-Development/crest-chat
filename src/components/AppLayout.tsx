import { useState } from "react";
import { ServerSidebar } from "@/components/ServerSidebar";
import { ChatArea } from "@/components/ChatArea";
import { OnlineUsers } from "@/components/OnlineUsers";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function AppLayout() {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className="relative">
        <WelcomeScreen />
        <div className="fixed bottom-6 right-6 z-10">
          <Button
            onClick={() => setShowDemo(true)}
            className="gradient-blurple text-white shadow-discord animate-pulse-glow"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Chat Interface
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden relative">
      {/* Demo Mode Toggle */}
      <div className="fixed top-4 right-4 z-10">
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
        <ServerSidebar />
        
        {/* Chat Area */}
        <ChatArea />
        
        {/* Online Users */}
        <OnlineUsers />
      </main>
    </div>
  );
}