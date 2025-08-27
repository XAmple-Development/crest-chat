import { useMemo } from 'react'
import { useServers } from '@/hooks/useServers'

interface ChannelListProps {
  selectedChannelId: string | null
  onSelectChannel: (channelId: string) => void
}

export default function ChannelList({ selectedChannelId, onSelectChannel }: ChannelListProps) {
  const { servers, isLoading } = useServers()

  const channels = useMemo(() => {
    const firstServerWithChannels = servers.find(s => (s.channels || []).length > 0)
    return firstServerWithChannels?.channels || []
  }, [servers])

  if (isLoading) {
    return (
      <div className="w-64 p-4 text-discord-text/70">Loading channels…</div>
    )
  }

  return (
    <div className="w-64 border-r border-discord-border bg-discord-sidebar p-2 space-y-1 overflow-y-auto">
      {channels.map((ch: any) => (
        <button
          key={ch.id}
          className={`w-full text-left px-3 py-2 rounded-md hover:bg-discord-hover text-discord-text ${selectedChannelId === ch.id ? 'bg-discord-active font-medium' : ''}`}
          onClick={() => onSelectChannel(ch.id)}
        >
          # {ch.name}
        </button>
      ))}
      {channels.length === 0 && (
        <div className="px-3 py-2 text-sm text-discord-text/70">No channels. Create one from server settings.</div>
      )}
    </div>
  )
}


