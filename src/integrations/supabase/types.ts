// TypeScript types for Supabase database schema

export interface Profile {
  id: string
  username: string
  display_name?: string
  email: string
  avatar_url?: string
  bio?: string
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
  created_at: string
  updated_at: string
}

export interface Server {
  id: string
  name: string
  description?: string
  owner_id: string
  invite_code?: string
  privacy_level: string
  created_at: string
  updated_at: string
  channels?: Channel[]
  isMember?: boolean
}

export interface Channel {
  id: string
  name: string
  server_id: string
  type: 'text' | 'voice' | 'announcement'
  description?: string
  position: number
  created_at: string
  updated_at: string
}

export interface ServerMember {
  id: string
  server_id: string
  user_id: string
  role: 'member' | 'moderator' | 'admin' | 'owner'
  joined_at: string
  user?: Profile
}

export interface Message {
  id: string
  channel_id: string
  author_id: string
  content: string
  type: 'default' | 'system' | 'user_join' | 'user_leave'
  is_pinned: boolean
  is_edited: boolean
  is_deleted: boolean
  mentions_everyone: boolean
  mention_roles?: string[]
  mention_users?: string[]
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
  user_id: string
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
  display_name?: string
  bio?: string
  theme: string
  notifications: boolean
  created_at: string
  updated_at: string
}

// Database interface for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
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
        Update: Partial<Omit<ServerMember, 'id' | 'joined_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at' | 'updated_at'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_server_by_invite: {
        Args: { invite_code_param: string }
        Returns: boolean
      }
    }
    Enums: {
      user_status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
      channel_type: 'text' | 'voice' | 'announcement'
      message_type: 'default' | 'system' | 'user_join' | 'user_leave'
      role_permission: 'member' | 'moderator' | 'admin' | 'owner'
    }
  }
}
