export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          completion_tokens: number
          cost_usd: number
          created_at: string
          duration_ms: number
          function_name: string
          id: string
          meta: Json | null
          model: string
          prompt_tokens: number
          status: number
          total_tokens: number
        }
        Insert: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          duration_ms?: number
          function_name: string
          id?: string
          meta?: Json | null
          model: string
          prompt_tokens?: number
          status?: number
          total_tokens?: number
        }
        Update: {
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          duration_ms?: number
          function_name?: string
          id?: string
          meta?: Json | null
          model?: string
          prompt_tokens?: number
          status?: number
          total_tokens?: number
        }
        Relationships: []
      }
      compliance_intake_drafts: {
        Row: {
          code: string
          created_at: string
          data: Json
          id: string
          tool: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          data: Json
          id?: string
          tool: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          data?: Json
          id?: string
          tool?: string
          updated_at?: string
        }
        Relationships: []
      }
      moon_crash_participants: {
        Row: {
          id: string
          name: string
          ranking: Json | null
          session_id: string
          slot: number
          submitted_at: string | null
          token_hash: string | null
        }
        Insert: {
          id?: string
          name: string
          ranking?: Json | null
          session_id: string
          slot: number
          submitted_at?: string | null
          token_hash?: string | null
        }
        Update: {
          id?: string
          name?: string
          ranking?: Json | null
          session_id?: string
          slot?: number
          submitted_at?: string | null
          token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moon_crash_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "moon_crash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      moon_crash_sessions: {
        Row: {
          code: string
          created_at: string
          id: string
          revealed: boolean
          title: string
          trainer_hash: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          revealed?: boolean
          title: string
          trainer_hash: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          revealed?: boolean
          title?: string
          trainer_hash?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          count: number
          page: string
          updated_at: string
        }
        Insert: {
          count?: number
          page: string
          updated_at?: string
        }
        Update: {
          count?: number
          page?: string
          updated_at?: string
        }
        Relationships: []
      }
      ttx_registrations: {
        Row: {
          company: string | null
          created_at: string
          email: string
          event_date: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          price_cents: number
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          event_date: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          price_cents?: number
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          event_date?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          price_cents?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_page_visit: { Args: { p_page: string }; Returns: number }
      moon_crash_claim: {
        Args: { p_hash: string; p_session: string; p_slot: number }
        Returns: boolean
      }
      moon_crash_submit: {
        Args: {
          p_hash: string
          p_ranking: Json
          p_session: string
          p_slot: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
