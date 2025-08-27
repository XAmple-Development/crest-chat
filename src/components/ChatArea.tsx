import { useState, useRef, useEffect } from 'react'
import { useMessages } from '../hooks/useMessages'
import { Channel } from '../integrations/supabase/types'
import { toast } from 'sonner'

interface ChatAreaProps {
  channel: Channel
  server?: any
  onServerUpdate: () => void
  onChannelUpdate: () => void
  onOpenServerSettings?: () => void
}

export default function ChatArea({ channel, server, onOpenServerSettings }: ChatAreaProps) {
  const { messages, messagesLoading, sendMessage, editMessage, deleteMessage } = useMessages(channel.id)
  const [messageContent, setMessageContent] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when channel changes
  useEffect(() => {
    inputRef.current?.focus()
    setEditingMessageId(null)
    setEditContent('')
  }, [channel.id])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return
    
    try {
      await sendMessage.mutateAsync(messageContent.trim())
      setMessageContent('')
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessageId || !editContent.trim()) return
    
    try {
      await editMessage.mutateAsync({ messageId: editingMessageId, content: editContent.trim() })
      setEditingMessageId(null)
      setEditContent('')
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    
    try {
      await deleteMessage.mutateAsync(messageId)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessageId) {
        handleEditMessage()
      } else {
        handleSendMessage()
      }
    }
  }

  const startEditing = (message: any) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const addReaction = (_messageId: string, _emoji: string) => {
    // TODO: Implement reaction system
    toast.info('Reactions coming soon!')
  }

  return (
    <div className="flex flex-col h-full bg-discord-bg">
      {/* Channel Header */}
      <div className="bg-discord-channel border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-discord-muted text-2xl">#</span>
            <div>
              <h2 className="text-xl font-bold text-discord-text">{channel.name}</h2>
              <p className="text-sm text-discord-muted">
                {channel.description || 'No description'}
              </p>
            </div>
          </div>
          
          {/* Server Settings Button */}
          {server && onOpenServerSettings && (
            <button
              onClick={onOpenServerSettings}
              className="p-2 hover:bg-discord-channel/80 rounded-md transition-colors"
              title="Server Settings"
            >
              <svg className="w-5 h-5 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-xl font-bold text-discord-text mb-2">Welcome to #{channel.name}!</h3>
              <p className="text-discord-muted">This is the beginning of the #{channel.name} channel.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group hover:bg-discord-channel/30 rounded-md p-2 transition-colors">
              {editingMessageId === message.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent resize-none"
                    rows={Math.max(1, editContent.split('\n').length)}
                    autoFocus
                  />
                  <div className="flex items-center space-x-2 text-xs text-discord-muted">
                    <span>Press ESC to cancel • Enter to save</span>
                    <button
                      onClick={cancelEditing}
                      className="text-discord-danger hover:text-discord-danger/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex space-x-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-discord-primary flex items-center justify-center text-white font-medium">
                      {message.author?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-discord-text">
                        {message.author?.display_name || message.author?.username || 'Unknown User'}
                      </span>
                      <span className="text-xs text-discord-muted">
                        {formatTime(message.created_at)}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-discord-muted">(edited)</span>
                      )}
                    </div>
                    
                    <div className="text-discord-text text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>

                    {/* Message Actions */}
                    <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => addReaction(message.id, '👍')}
                        className="p-1 hover:bg-discord-channel rounded text-discord-muted hover:text-discord-text transition-colors"
                        title="Add reaction"
                      >
                        😊
                      </button>
                      <button
                        onClick={() => startEditing(message)}
                        className="p-1 hover:bg-discord-channel rounded text-discord-muted hover:text-discord-text transition-colors"
                        title="Edit message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 hover:bg-discord-channel rounded text-discord-muted hover:text-discord-danger transition-colors"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${channel.name}`}
              className="w-full px-4 py-3 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent resize-none"
              rows={Math.max(1, Math.min(4, messageContent.split('\n').length))}
            />
            
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 bottom-3 p-1 hover:bg-discord-channel/80 rounded text-discord-muted hover:text-discord-text transition-colors"
              title="Add emoji"
            >
              😊
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || sendMessage.isPending}
            className="px-4 py-3 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {sendMessage.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-discord-muted">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{messageContent.length}/2000</span>
        </div>
      </div>
    </div>
  )
}
