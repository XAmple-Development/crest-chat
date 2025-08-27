import { useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

interface MessageListProps {
  channelId: string | null
}

export default function MessageList({ channelId }: MessageListProps) {
  const { messages, messagesLoading } = useMessages(channelId)
  useRealtimeMessages(channelId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  if (!channelId) {
    return <div className="flex-1 flex items-center justify-center text-discord-text/70">Pick a channel to start messaging</div>
  }

  if (messagesLoading) {
    return <div className="flex-1 flex items-center justify-center text-discord-text/70">Loading messages…</div>
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m: any) => (
        <div key={m.id} className="flex gap-3">
          <img
            src={m.author?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${m.author?.username || 'user'}`}
            alt={m.author?.username}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="text-sm text-discord-text/90">
              <span className="font-medium mr-2">{m.author?.display_name || m.author?.username || 'User'}</span>
              <span className="text-xs text-discord-text/60">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <div className="text-discord-text whitespace-pre-wrap">{m.content}</div>
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-center text-discord-text/70">No messages yet. Say hello 👋</div>
      )}
    </div>
  )
}


