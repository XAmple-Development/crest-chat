import { useState } from 'react'
import { useMessages } from '@/hooks/useMessages'

interface MessageInputProps {
  channelId: string | null
}

export default function MessageInput({ channelId }: MessageInputProps) {
  const [value, setValue] = useState('')
  const { sendMessage } = useMessages(channelId)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || !channelId) return
    try {
      await sendMessage.mutateAsync(value.trim())
      setValue('')
    } catch (err) {
      // Inform user in case of failure
      console.error('Failed to send message', err)
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-3 border-t border-discord-border">
      <input
        disabled={!channelId || sendMessage.isPending}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={!channelId ? 'Select a channel to start messaging' : 'Message #channel'}
        className="w-full px-4 py-3 rounded-md bg-discord-input text-discord-text placeholder:text-discord-text/50 focus:outline-none"
      />
    </form>
  )
}


