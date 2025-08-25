import { Send, Smile, Paperclip, Mic, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
}

const messages: Message[] = [
  {
    id: '1',
    author: 'Alice Cooper',
    avatar: 'AC',
    content: 'Hey everyone! Welcome to our awesome Discord-style chat app! 🎉',
    timestamp: 'Today at 2:30 PM'
  },
  {
    id: '2',
    author: 'Bob Wilson',
    avatar: 'BW',
    content: 'This looks amazing! The design is so clean and modern.',
    timestamp: 'Today at 2:32 PM'
  },
  {
    id: '3',
    author: 'ChatBot',
    avatar: 'CB',
    content: 'Welcome to LovableChat! Type /help for available commands.',
    timestamp: 'Today at 2:35 PM',
    isBot: true
  },
  {
    id: '4',
    author: 'Sarah Chen',
    avatar: 'SC',
    content: 'I love the dark theme! Perfect for late night coding sessions 💻',
    timestamp: 'Today at 2:37 PM'
  }
];

export function ChatArea() {
  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat Header */}
      <div className="h-12 px-4 flex items-center border-b border-border bg-card shadow-sm">
        <Hash className="w-5 h-5 text-muted-foreground mr-2" />
        <h3 className="font-semibold text-foreground">general</h3>
        <div className="ml-2 text-sm text-muted-foreground">
          Community chat for everyone
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 discord-scrollbar overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="message-item rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    message.isBot 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.avatar}
                  </div>
                  {message.isBot && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                      BOT
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-foreground">{message.author}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-center space-x-3 bg-input rounded-lg p-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Input
            placeholder="Message #general"
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <Mic className="w-4 h-4" />
            </Button>
            <Button size="sm" className="gradient-blurple text-white border-0 hover:opacity-90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}