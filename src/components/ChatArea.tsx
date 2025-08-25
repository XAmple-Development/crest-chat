import { Send, Smile, Paperclip, Mic, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { useChannels } from "@/hooks/useServers";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface ChatAreaProps {
  selectedChannelId: string | null;
  selectedServerId: string | null;
}

export function ChatArea({ selectedChannelId, selectedServerId }: ChatAreaProps) {
  const { messages, loading, sendMessage } = useMessages(selectedChannelId);
  const { channels } = useChannels(selectedServerId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannel = channels.find(c => c.id === selectedChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage("");
  };

  if (!selectedChannelId || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to LovableChat!</h3>
          <p className="text-muted-foreground">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat Header */}
      <div className="h-12 px-4 flex items-center border-b border-border bg-card shadow-sm">
        <Hash className="w-5 h-5 text-muted-foreground mr-2" />
        <h3 className="font-semibold text-foreground">{currentChannel.name}</h3>
        <div className="ml-2 text-sm text-muted-foreground">
          {currentChannel.description || `Welcome to #${currentChannel.name}`}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 discord-scrollbar overflow-y-auto">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>This is the beginning of #{currentChannel.name}</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message-item rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-secondary text-secondary-foreground">
                      {message.profiles.username.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-foreground">
                        {message.profiles.display_name || message.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center space-x-3 bg-input rounded-lg p-3">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Input
              placeholder={`Message #${currentChannel.name}`}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            
            <div className="flex items-center space-x-1">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button 
                type="submit"
                size="sm" 
                className="gradient-blurple text-white border-0 hover:opacity-90"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}