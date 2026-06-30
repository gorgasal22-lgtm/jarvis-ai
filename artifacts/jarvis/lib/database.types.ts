/**
 * Lightweight hand-written DB types covering the tables JARVIS uses.
 * Matches the GenericTable shape required by @supabase/supabase-js v2.108+:
 * each table must have Row, Insert, Update, and Relationships.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          auth_provider: string | null;
          google_id: string | null;
          display_name: string | null;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          auth_provider?: string | null;
          google_id?: string | null;
          display_name?: string | null;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          auth_provider?: string | null;
          google_id?: string | null;
          display_name?: string | null;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: number;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: string;
          content?: string;
        };
        Relationships: [];
      };
      trial_usage: {
        Row: {
          user_id: string;
          message_count: number;
          window_start: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          message_count?: number;
          window_start?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          message_count?: number;
          window_start?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: number;
          user_id: string;
          plan: string;
          status: string;
          started_at: string;
          current_period_end: string;
        };
        Insert: {
          user_id: string;
          plan: string;
          status: string;
          started_at?: string;
          current_period_end?: string;
        };
        Update: {
          user_id?: string;
          plan?: string;
          status?: string;
          started_at?: string;
          current_period_end?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
