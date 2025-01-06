export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          template_id: string
          title: string
          recipient_name: string
          issue_date: string
          status: 'draft' | 'generated' | 'sent' | 'revoked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          title: string
          recipient_name: string
          issue_date: string
          status?: 'draft' | 'generated' | 'sent' | 'revoked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          title?: string
          recipient_name?: string
          issue_date?: string
          status?: 'draft' | 'generated' | 'sent' | 'revoked'
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          design_data: Json
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          design_data: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          design_data?: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      user_role: 'admin' | 'user'
      certificate_status: 'draft' | 'generated' | 'sent' | 'revoked'
      batch_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
}