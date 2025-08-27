import { useState } from 'react'
import ChannelList from '@/components/ChannelList'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'

export default function Messenger() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-discord-bg text-discord-text flex">
      <ChannelList selectedChannelId={selectedChannelId} onSelectChannel={setSelectedChannelId} />
      <div className="flex-1 flex flex-col">
        <MessageList channelId={selectedChannelId} />
        <MessageInput channelId={selectedChannelId} />
      </div>
    </div>
  )
}


