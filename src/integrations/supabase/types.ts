export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          discriminator: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          custom_status: string | null
          status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
          theme: string
          locale: string
          timezone: string
          is_verified: boolean
          is_bot: boolean
          is_system: boolean
          flags: number
          premium_type: number
          premium_since: string | null
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          discriminator: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          custom_status?: string | null
          status?: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
          theme?: string
          locale?: string
          timezone?: string
          is_verified?: boolean
          is_bot?: boolean
          is_system?: boolean
          flags?: number
          premium_type?: number
          premium_since?: string | null
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          discriminator?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          custom_status?: string | null
          status?: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline'
          theme?: string
          locale?: string
          timezone?: string
          is_verified?: boolean
          is_bot?: boolean
          is_system?: boolean
          flags?: number
          premium_type?: number
          premium_since?: string | null
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      servers: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_url: string | null
          banner_url: string | null
          is_public: boolean
          is_verified: boolean
          max_members: number
          boost_level: number
          boost_count: number
          default_channel_id: string | null
          system_channel_id: string | null
          rules_channel_id: string | null
          public_updates_channel_id: string | null
          afk_channel_id: string | null
          afk_timeout: number
          verification_level: number
          explicit_content_filter: number
          premium_tier: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_url?: string | null
          banner_url?: string | null
          is_public?: boolean
          is_verified?: boolean
          max_members?: number
          boost_level?: number
          boost_count?: number
          default_channel_id?: string | null
          system_channel_id?: string | null
          rules_channel_id?: string | null
          public_updates_channel_id?: string | null
          afk_channel_id?: string | null
          afk_timeout?: number
          verification_level?: number
          explicit_content_filter?: number
          premium_tier?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          banner_url?: string | null
          is_public?: boolean
          is_verified?: boolean
          max_members?: number
          boost_level?: number
          boost_count?: number
          default_channel_id?: string | null
          system_channel_id?: string | null
          rules_channel_id?: string | null
          public_updates_channel_id?: string | null
          afk_channel_id?: string | null
          afk_timeout?: number
          verification_level?: number
          explicit_content_filter?: number
          premium_tier?: number
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          server_id: string | null
          name: string
          description: string | null
          type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
          is_nsfw: boolean
          is_announcement: boolean
          is_pinned: boolean
          parent_id: string | null
          topic: string | null
          position: number
          rate_limit_per_user: number
          bitrate: number
          user_limit: number
          rtc_region: string | null
          video_quality_mode: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id?: string | null
          name: string
          description?: string | null
          type?: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
          is_nsfw?: boolean
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          topic?: string | null
          position?: number
          rate_limit_per_user?: number
          bitrate?: number
          user_limit?: number
          rtc_region?: string | null
          video_quality_mode?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string | null
          name?: string
          description?: string | null
          type?: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
          is_nsfw?: boolean
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          topic?: string | null
          position?: number
          rate_limit_per_user?: number
          bitrate?: number
          user_limit?: number
          rtc_region?: string | null
          video_quality_mode?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          content: string | null
          type: string
          is_pinned: boolean
          is_edited: boolean
          is_deleted: boolean
          deleted_at: string | null
          mentions_everyone: boolean
          mention_roles: string[] | null
          mention_users: string[] | null
          embeds: Json | null
          attachments: Json | null
          reactions: Json | null
          flags: number
          webhook_id: string | null
          application_id: string | null
          message_reference: Json | null
          activity: Json | null
          application: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          author_id: string
          content?: string | null
          type?: string
          is_pinned?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          mentions_everyone?: boolean
          mention_roles?: string[] | null
          mention_users?: string[] | null
          embeds?: Json | null
          attachments?: Json | null
          reactions?: Json | null
          flags?: number
          webhook_id?: string | null
          application_id?: string | null
          message_reference?: Json | null
          activity?: Json | null
          application?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          author_id?: string
          content?: string | null
          type?: string
          is_pinned?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          mentions_everyone?: boolean
          mention_roles?: string[] | null
          mention_users?: string[] | null
          embeds?: Json | null
          attachments?: Json | null
          reactions?: Json | null
          flags?: number
          webhook_id?: string | null
          application_id?: string | null
          message_reference?: Json | null
          activity?: Json | null
          application?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      server_members: {
        Row: {
          id: string
          server_id: string
          user_id: string
          nickname: string | null
          avatar_url: string | null
          premium_since: string | null
          is_deafened: boolean
          is_muted: boolean
          is_streaming: boolean
          is_video: boolean
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          nickname?: string | null
          avatar_url?: string | null
          premium_since?: string | null
          is_deafened?: boolean
          is_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          nickname?: string | null
          avatar_url?: string | null
          premium_since?: string | null
          is_deafened?: boolean
          is_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
          joined_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          locale: string
          timezone: string
          enable_notifications: boolean
          enable_sounds: boolean
          enable_animations: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          locale?: string
          timezone?: string
          enable_notifications?: boolean
          enable_sounds?: boolean
          enable_animations?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          locale?: string
          timezone?: string
          enable_notifications?: boolean
          enable_sounds?: boolean
          enable_animations?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Server = Database['public']['Tables']['servers']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ServerMember = Database['public']['Tables']['server_members']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
