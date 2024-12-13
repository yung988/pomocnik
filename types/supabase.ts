export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          fragments_used: number
          fragments_used_reset_at: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          fragments_used?: number
          fragments_used_reset_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          fragments_used?: number
          fragments_used_reset_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          is_archived: boolean
          last_message: string | null
          model: string | null
          template: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          last_message?: string | null
          model?: string | null
          template?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          is_archived?: boolean
          last_message?: string | null
          model?: string | null
          template?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant'
          content: Array<{
            type: 'text' | 'code' | 'image'
            text?: string
            image?: string
          }>
          created_at: string
          tokens_used: number | null
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content: Array<{
            type: 'text' | 'code' | 'image'
            text?: string
            image?: string
          }>
          created_at?: string
          tokens_used?: number | null
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant'
          content?: Array<{
            type: 'text' | 'code' | 'image'
            text?: string
            image?: string
          }>
          created_at?: string
          tokens_used?: number | null
        }
      }
    }
  }
} 