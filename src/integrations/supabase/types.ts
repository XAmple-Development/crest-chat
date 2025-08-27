export interface Profile {
  id: string
  username: string
  discriminator: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_url?: string
  custom_status?: string
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
  theme: string
  locale: string
  timezone: string
  is_verified: boolean
  is_bot: boolean
  is_system: boolean
  flags: number
  premium_type: number
  premium_since?: string
  last_seen: string
  created_at: string
  updated_at: string
}

export interface Server {
  id: string
  name: string
  description?: string
  icon_url?: string
  banner_url?: string
  owner_id: string
  is_public: boolean
  is_verified: boolean
  max_members: number
  boost_level: number
  boost_count: number
  privacy_level: 'public' | 'private' | 'invite_only'
  invite_code?: string
  default_channel_id?: string
  system_channel_id?: string
  rules_channel_id?: string
  public_updates_channel_id?: string
  afk_channel_id?: string
  afk_timeout: number
  verification_level: number
  explicit_content_filter: number
  premium_tier: number
  created_at: string
  updated_at: string
  channels?: Channel[]
  isMember?: boolean
}

export interface Channel {
  id: string
  server_id: string
  name: string
  description?: string
  type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
  is_nsfw: boolean
  is_announcement: boolean
  is_pinned: boolean
  parent_id?: string
  topic?: string
  position: number
  rate_limit_per_user: number
  bitrate: number
  user_limit: number
  rtc_region?: string
  video_quality_mode: number
  created_at: string
  updated_at: string
}

export interface ServerMember {
  id: string
  server_id: string
  user_id: string
  nickname?: string
  avatar_url?: string
  roles: string[]
  joined_at: string
  user?: Profile
}

export interface Message {
  id: string
  channel_id: string
  author_id: string
  content: string
  type: 'default' | 'system' | 'user_join' | 'user_leave' | 'channel_pin' | 'channel_topic'
  is_pinned: boolean
  is_edited: boolean
  is_deleted: boolean
  mentions_everyone: boolean
  mention_roles: string[]
  mention_users: string[]
  embeds?: any
  attachments?: any
  reactions?: any
  flags: number
  created_at: string
  updated_at: string
  author?: Profile
}

export interface UserSettings {
  id: string
  theme: string
  language: string
  timezone: string
  notifications_enabled: boolean
  sound_enabled: boolean
  status_visibility: 'all' | 'friends' | 'none'
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      servers: {
        Row: Server
        Insert: Omit<Server, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Server, 'id' | 'created_at' | 'updated_at'>>
      }
      channels: {
        Row: Channel
        Insert: Omit<Channel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Channel, 'id' | 'created_at' | 'updated_at'>>
      }
      server_members: {
        Row: ServerMember
        Insert: Omit<ServerMember, 'id' | 'joined_at'>
        Update: Partial<Omit<ServerMember, 'id' | 'server_id' | 'user_id' | 'joined_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Message, 'id' | 'channel_id' | 'author_id' | 'created_at' | 'updated_at'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
