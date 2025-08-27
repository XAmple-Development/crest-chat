import { useState } from 'react'
import { useMessages } from '../hooks/useMessages'
import { Channel } from '../integrations/supabase/types'

interface ChatAreaProps {
  channel: Channel
  onServerUpdate: () => void
  onChannelUpdate: () => void
}

export default function ChatArea({ channel }: ChatAreaProps) {
  const { messages, messagesLoading, sendMessage, editMessage, deleteMessage } = useMessages(channel.id)
  const [messageContent, setMessageContent] = useState('')
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim()) return

    try {
      await sendMessage.mutateAsync(messageContent)
      setMessageContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      await editMessage.mutateAsync({ messageId, content: editContent })
      setEditingMessage(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await deleteMessage.mutateAsync(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-primary mx-auto mb-2"></div>
          <p className="text-discord-muted">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Channel Header */}
      <div className="bg-discord-channel border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="text-discord-muted text-2xl">#</span>
          <div>
            <h2 className="text-xl font-bold text-discord-text">{channel.name}</h2>
            <p className="text-sm text-discord-muted">
              {channel.description || 'No description'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-discord-muted">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3 group">
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-medium">
                {message.author?.username?.charAt(0).toUpperCase() || 'U'}
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

                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="px-3 py-1 bg-discord-primary hover:bg-discord-primary/90 text-white text-sm rounded transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(null)
                          setEditContent('')
                        }}
                        className="px-3 py-1 bg-discord-channel hover:bg-discord-channel/80 text-discord-text text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between group">
                    <p className="text-discord-text whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Message Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingMessage(message.id)
                          setEditContent(message.content)
                        }}
                        className="p-1 hover:bg-discord-channel rounded transition-colors"
                        title="Edit message"
                      >
                        <svg className="w-4 h-4 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 hover:bg-discord-danger rounded transition-colors"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4 text-discord-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="flex-1 px-4 py-2 bg-discord-channel border border-gray-600 rounded-md text-discord-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-primary focus:border-transparent"
            disabled={sendMessage.isPending}
          />
          <button
            type="submit"
            disabled={sendMessage.isPending || !messageContent.trim()}
            className="px-6 py-2 bg-discord-primary hover:bg-discord-primary/90 disabled:opacity-50 text-white font-medium rounded-md transition-colors duration-200"
          >
            {sendMessage.isPending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
