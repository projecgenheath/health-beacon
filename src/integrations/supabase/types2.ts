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
      access_logs: {
        Row: {
          id: string
          ip_address: unknown
          logged_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: unknown
          logged_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: unknown
          logged_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_key: string
          created_at: string | null
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          created_at?: string | null
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          created_at?: string | null
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bmi_history: {
        Row: {
          bmi: number | null
          created_at: string
          exam_id: string | null
          height: number
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          bmi?: number | null
          created_at?: string
          exam_id?: string | null
          height: number
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          bmi?: number | null
          created_at?: string
          exam_id?: string | null
          height?: number
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "bmi_history_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_reminders: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          exam_type: string
          frequency_months: number
          id: string
          last_done: string | null
          next_due: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          exam_type: string
          frequency_months?: number
          id?: string
          last_done?: string | null
          next_due?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          exam_type?: string
          frequency_months?: number
          id?: string
          last_done?: string | null
          next_due?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          category: string | null
          conclusion: string | null
          created_at: string
          description: string | null
          exam_date: string
          exam_id: string
          exam_type: string | null
          id: string
          name: string
          reference_max: number | null
          reference_min: number | null
          status: string
          text_value: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          category?: string | null
          conclusion?: string | null
          created_at?: string
          description?: string | null
          exam_date: string
          exam_id: string
          exam_type?: string | null
          id?: string
          name: string
          reference_max?: number | null
          reference_min?: number | null
          status?: string
          text_value?: string | null
          unit: string
          user_id: string
          value: number
        }
        Update: {
          category?: string | null
          conclusion?: string | null
          created_at?: string
          description?: string | null
          exam_date?: string
          exam_id?: string
          exam_type?: string | null
          id?: string
          name?: string
          reference_max?: number | null
          reference_min?: number | null
          status?: string
          text_value?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string | null
          file_name: string
          file_url: string | null
          id: string
          lab_name: string | null
          processed: boolean | null
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          lab_name?: string | null
          processed?: boolean | null
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          lab_name?: string | null
          processed?: boolean | null
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          created_at: string
          current_value: number | null
          deadline: string | null
          exam_name: string
          id: string
          notes: string | null
          status: string
          target_max: number | null
          target_min: number | null
          target_type: string
          target_value: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          exam_name: string
          id?: string
          notes?: string | null
          status?: string
          target_max?: number | null
          target_min?: number | null
          target_type?: string
          target_value: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          exam_name?: string
          id?: string
          notes?: string | null
          status?: string
          target_max?: number | null
          target_min?: number | null
          target_type?: string
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          digest_frequency: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          sex: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          digest_frequency?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          sex?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          digest_frequency?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          sex?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string | null
          exam_id: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
          views: number | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
          views?: number | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_links_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
