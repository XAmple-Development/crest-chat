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
          display_name: string | null
          discriminator: string
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          status: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status: string | null
          theme: string
          locale: string
          timezone: string
          is_verified: boolean
          is_bot: boolean
          is_system: boolean
          flags: number
          premium_type: number
          premium_since: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          discriminator: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          status?: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status?: string | null
          theme?: string
          locale?: string
          timezone?: string
          is_verified?: boolean
          is_bot?: boolean
          is_system?: boolean
          flags?: number
          premium_type?: number
          premium_since?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          discriminator?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          status?: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status?: string | null
          theme?: string
          locale?: string
          timezone?: string
          is_verified?: boolean
          is_bot?: boolean
          is_system?: boolean
          flags?: number
          premium_type?: number
          premium_since?: string | null
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
          owner_id: string
          is_public: boolean
          is_verified: boolean
          member_count: number
          max_members: number
          boost_level: number
          boost_count: number
          invite_code: string | null
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
          owner_id: string
          is_public?: boolean
          is_verified?: boolean
          member_count?: number
          max_members?: number
          boost_level?: number
          boost_count?: number
          invite_code?: string | null
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
          owner_id?: string
          is_public?: boolean
          is_verified?: boolean
          member_count?: number
          max_members?: number
          boost_level?: number
          boost_count?: number
          invite_code?: string | null
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
      server_roles: {
        Row: {
          id: string
          server_id: string
          name: string
          color: number
          hoist: boolean
          position: number
          permissions: number
          mentionable: boolean
          managed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          server_id: string
          name: string
          color?: number
          hoist?: boolean
          position?: number
          permissions?: number
          mentionable?: boolean
          managed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          name?: string
          color?: number
          hoist?: boolean
          position?: number
          permissions?: number
          mentionable?: boolean
          managed?: boolean
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
          position: number
          is_private: boolean
          is_nsfw: boolean
          is_announcement: boolean
          is_pinned: boolean
          parent_id: string | null
          topic: string | null
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
          position?: number
          is_private?: boolean
          is_nsfw?: boolean
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          topic?: string | null
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
          position?: number
          is_private?: boolean
          is_nsfw?: boolean
          is_announcement?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          topic?: string | null
          rate_limit_per_user?: number
          bitrate?: number
          user_limit?: number
          rtc_region?: string | null
          video_quality_mode?: number
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
          joined_at: string
          premium_since: string | null
          is_deafened: boolean
          is_muted: boolean
          is_streaming: boolean
          is_video: boolean
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          nickname?: string | null
          avatar_url?: string | null
          joined_at?: string
          premium_since?: string | null
          is_deafened?: boolean
          is_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          nickname?: string | null
          avatar_url?: string | null
          joined_at?: string
          premium_since?: string | null
          is_deafened?: boolean
          is_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
        }
      }
      member_roles: {
        Row: {
          member_id: string
          role_id: string
        }
        Insert: {
          member_id: string
          role_id: string
        }
        Update: {
          member_id?: string
          role_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          content: string | null
          type: 'text' | 'image' | 'video' | 'file' | 'embed' | 'system'
          is_pinned: boolean
          is_edited: boolean
          edited_at: string | null
          is_deleted: boolean
          deleted_at: string | null
          mentions_everyone: boolean
          mention_roles: string[] | null
          mention_users: string[] | null
          embeds: Json[] | null
          attachments: Json[] | null
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
          type?: 'text' | 'image' | 'video' | 'file' | 'embed' | 'system'
          is_pinned?: boolean
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          mentions_everyone?: boolean
          mention_roles?: string[] | null
          mention_users?: string[] | null
          embeds?: Json[] | null
          attachments?: Json[] | null
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
          type?: 'text' | 'image' | 'video' | 'file' | 'embed' | 'system'
          is_pinned?: boolean
          is_edited?: boolean
          edited_at?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          mentions_everyone?: boolean
          mention_roles?: string[] | null
          mention_users?: string[] | null
          embeds?: Json[] | null
          attachments?: Json[] | null
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
      direct_messages: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          last_message_id: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          last_message_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          last_message_id?: string | null
          last_message_at?: string
          created_at?: string
        }
      }
      dm_channels: {
        Row: {
          id: string
          dm_id: string
          name: string | null
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          dm_id: string
          name?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dm_id?: string
          name?: string | null
          icon_url?: string | null
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      voice_states: {
        Row: {
          id: string
          user_id: string
          channel_id: string | null
          server_id: string | null
          session_id: string
          is_deafened: boolean
          is_muted: boolean
          is_self_deafened: boolean
          is_self_muted: boolean
          is_streaming: boolean
          is_video: boolean
          is_speaking: boolean
          request_to_speak_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel_id?: string | null
          server_id?: string | null
          session_id: string
          is_deafened?: boolean
          is_muted?: boolean
          is_self_deafened?: boolean
          is_self_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
          is_speaking?: boolean
          request_to_speak_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          channel_id?: string | null
          server_id?: string | null
          session_id?: string
          is_deafened?: boolean
          is_muted?: boolean
          is_self_deafened?: boolean
          is_self_muted?: boolean
          is_streaming?: boolean
          is_video?: boolean
          is_speaking?: boolean
          request_to_speak_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          code: string
          server_id: string
          channel_id: string
          inviter_id: string
          max_uses: number
          uses: number
          max_age: number
          is_temporary: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          server_id: string
          channel_id: string
          inviter_id: string
          max_uses?: number
          uses?: number
          max_age?: number
          is_temporary?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          server_id?: string
          channel_id?: string
          inviter_id?: string
          max_uses?: number
          uses?: number
          max_age?: number
          is_temporary?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          server_id: string
          user_id: string
          target_id: string | null
          target_type: string | null
          action_type: string
          changes: Json | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          server_id: string
          user_id: string
          target_id?: string | null
          target_type?: string | null
          action_type: string
          changes?: Json | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string
          user_id?: string
          target_id?: string | null
          target_type?: string | null
          action_type?: string
          changes?: Json | null
          reason?: string | null
          created_at?: string
        }
      }
      emojis: {
        Row: {
          id: string
          server_id: string | null
          name: string
          image_url: string
          is_animated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          server_id?: string | null
          name: string
          image_url: string
          is_animated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string | null
          name?: string
          image_url?: string
          is_animated?: boolean
          created_at?: string
        }
      }
      stickers: {
        Row: {
          id: string
          server_id: string | null
          name: string
          description: string | null
          image_url: string
          format_type: number
          created_at: string
        }
        Insert: {
          id?: string
          server_id?: string | null
          name: string
          description?: string | null
          image_url: string
          format_type?: number
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string | null
          name?: string
          description?: string | null
          image_url?: string
          format_type?: number
          created_at?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          server_id: string | null
          channel_id: string
          name: string
          avatar_url: string | null
          token: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          server_id?: string | null
          channel_id: string
          name: string
          avatar_url?: string | null
          token: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          server_id?: string | null
          channel_id?: string
          name?: string
          avatar_url?: string | null
          token?: string
          created_by?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: string
          locale: string
          timezone: string
          status: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status: string | null
          message_notifications: number
          mention_notifications: boolean
          sound_notifications: boolean
          show_current_game: boolean
          show_activity_status: boolean
          allow_friend_requests: boolean
          allow_direct_messages: boolean
          show_online_status: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: string
          locale?: string
          timezone?: string
          status?: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status?: string | null
          message_notifications?: number
          mention_notifications?: boolean
          sound_notifications?: boolean
          show_current_game?: boolean
          show_activity_status?: boolean
          allow_friend_requests?: boolean
          allow_direct_messages?: boolean
          show_online_status?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: string
          locale?: string
          timezone?: string
          status?: 'online' | 'idle' | 'dnd' | 'offline'
          custom_status?: string | null
          message_notifications?: number
          mention_notifications?: boolean
          sound_notifications?: boolean
          show_current_game?: boolean
          show_activity_status?: boolean
          allow_friend_requests?: boolean
          allow_direct_messages?: boolean
          show_online_status?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_status: 'online' | 'idle' | 'dnd' | 'offline'
      channel_type: 'text' | 'voice' | 'announcement' | 'stage' | 'forum'
      message_type: 'text' | 'image' | 'video' | 'file' | 'embed' | 'system'
      role_permission: 'manage_channels' | 'manage_roles' | 'manage_messages' | 'manage_server' | 'kick_members' | 'ban_members' | 'administrator' | 'mention_everyone' | 'use_external_emojis' | 'use_external_stickers' | 'add_reactions' | 'priority_speaker' | 'stream' | 'view_channel' | 'send_messages' | 'send_tts_messages' | 'manage_messages' | 'embed_links' | 'attach_files' | 'read_message_history' | 'use_slash_commands' | 'connect' | 'speak' | 'use_vad' | 'change_nickname' | 'manage_nicknames' | 'view_audit_log'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
