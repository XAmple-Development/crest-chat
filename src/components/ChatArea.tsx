import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic, Hash, MoreHorizontal, Edit, Trash2, Pin, Reply, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMessages } from "@/hooks/useMessages";
import { useChannels } from "@/hooks/useServers";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatAreaProps {
  selectedChannelId: string | null;
  selectedServerId: string | null;
}

export function ChatArea({ selectedChannelId, selectedServerId }: ChatAreaProps) {
  const { messages, loading, sendMessage, editMessage, deleteMessage, pinMessage, unpinMessage, addReaction, removeReaction } = useMessages(selectedChannelId);
  const { channels } = useChannels(selectedServerId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
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

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;
    
    await editMessage(messageId, editContent);
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  const handlePinMessage = async (messageId: string) => {
    await pinMessage(messageId);
  };

  const handleUnpinMessage = async (messageId: string) => {
    await unpinMessage(messageId);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    const hasReacted = message?.reactions?.[emoji]?.users?.includes(user?.id || '');
    
    if (hasReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  };

  const formatMentions = (content: string) => {
    // Simple mention formatting - you can enhance this
    return content.replace(/@(\w+)/g, '<span class="text-blue-500 font-medium">@$1</span>');
  };

  const renderReactions = (reactions: any, messageId: string) => {
    if (!reactions) return null;

    return Object.entries(reactions).map(([emoji, data]: [string, any]) => {
      const hasReacted = data.users?.includes(user?.id || '');
      return (
        <button
          key={emoji}
          onClick={() => handleReaction(messageId, emoji)}
          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            hasReacted 
              ? 'bg-blue-500 text-white' 
              : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
          } transition-colors`}
        >
          <span>{emoji}</span>
          <span>{data.count}</span>
        </button>
      );
    });
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
      <div className="h-12 px-4 flex items-center justify-between border-b border-border bg-card shadow-sm">
        <div className="flex items-center">
          <Hash className="w-5 h-5 text-muted-foreground mr-2" />
          <h3 className="font-semibold text-foreground">{currentChannel.name}</h3>
          <div className="ml-2 text-sm text-muted-foreground">
            {currentChannel.description || `Welcome to #${currentChannel.name}`}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentChannel.topic && (
            <Badge variant="secondary" className="text-xs">
              {currentChannel.topic}
            </Badge>
          )}
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
              <div key={message.id} className="message-item group hover:bg-secondary/50 rounded-lg p-2 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    {message.author?.avatar_url ? (
                      <img 
                        src={message.author.avatar_url} 
                        alt={message.author.display_name || message.author.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-secondary text-secondary-foreground">
                        {(message.author?.display_name || message.author?.username || 'U').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {message.author?.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-foreground">
                        {message.author?.display_name || message.author?.username || 'Unknown User'}
                      </span>
                      {message.author?.is_bot && (
                        <Badge variant="secondary" className="text-xs">BOT</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                      {message.is_pinned && (
                        <Pin className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleEditMessage(message.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditContent("");
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleEditMessage(message.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingMessageId(null);
                            setEditContent("");
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        
                        {/* Reactions */}
                        {message.reactions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {renderReactions(message.reactions, message.id)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReaction(message.id, '👍')}>
                          👍 Add Reaction
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReaction(message.id, '❤️')}>
                          ❤️ Add Reaction
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReaction(message.id, '😂')}>
                          😂 Add Reaction
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        {message.author_id === user?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setEditingMessageId(message.id);
                              setEditContent(message.content || '');
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {message.is_pinned ? (
                          <DropdownMenuItem onClick={() => handleUnpinMessage(message.id)}>
                            <Pin className="w-4 h-4 mr-2" />
                            Unpin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePinMessage(message.id)}>
                            <Pin className="w-4 h-4 mr-2" />
                            Pin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
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