import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hash, Send, Edit, Trash2, Settings } from 'lucide-react'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { Channel, Server } from '@/integrations/supabase/types'
import { formatTime } from '@/lib/utils'
import { ServerSettingsModal } from './ServerSettingsModal'

interface ChatAreaProps {
  currentChannel: Channel | null
  currentServer: Server | null
}

export function ChatArea({ currentChannel, currentServer }: ChatAreaProps) {
  const { user } = useAuth()
  const { messages, sendMessage, editMessage, deleteMessage } = useMessages(currentChannel?.id || null)
  const [messageContent, setMessageContent] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showServerSettings, setShowServerSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim() || !currentChannel) return

    try {
      await sendMessage.mutateAsync(messageContent.trim())
      setMessageContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!content.trim()) return

    try {
      await editMessage.mutateAsync({ messageId, content: content.trim() })
      setEditingMessageId(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage.mutateAsync(messageId)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
  }

  const startEditing = (message: any) => {
    setEditingMessageId(message.id)
    setEditContent(message.content || '')
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleServerUpdate = (_updatedServer: Server) => {
    // This will be handled by the parent component
    window.location.reload() // Simple refresh for now
  }

  const handleChannelUpdate = () => {
    // This will be handled by the parent component
    window.location.reload() // Simple refresh for now
  }

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Hash className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Select a Channel</h2>
          <p className="text-muted-foreground">
            Choose a channel to start chatting
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Channel Header */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center">
          <Hash className="w-5 h-5 mr-2 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{currentChannel.name}</h2>
          {currentChannel.description && (
            <span className="ml-2 text-sm text-muted-foreground">
              - {currentChannel.description}
            </span>
          )}
        </div>
        
        {/* Server Settings Button (only for owners) */}
        {currentServer && currentServer.owner_id === user?.id && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowServerSettings(true)}
            className="h-8 w-8 p-0"
            title="Server Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 discord-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3 group">
              {/* User Avatar */}
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                  {message.author?.username?.charAt(0).toUpperCase() || 'U'}
                </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm">
                      {message.author?.display_name || message.author?.username || 'Unknown User'}
                    </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                  </span>
                  {message.is_edited && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                </div>

                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditMessage(message.id, editContent)
                        } else if (e.key === 'Escape') {
                          cancelEditing()
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditMessage(message.id, editContent)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between group">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {/* Message Actions */}
                    {user?.id === message.author_id && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(message)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMessage(message.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Message #${currentChannel.name}`}
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!messageContent.trim() || sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Server Settings Modal */}
      <ServerSettingsModal
        server={currentServer}
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        onServerUpdate={handleServerUpdate}
        onChannelUpdate={handleChannelUpdate}
      />
    </div>
  )
}
