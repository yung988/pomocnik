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
    }
  }
} 