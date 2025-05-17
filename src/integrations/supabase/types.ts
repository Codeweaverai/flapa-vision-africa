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
      consultation_bookings: {
        Row: {
          booking_type: string
          created_at: string | null
          duration: number
          id: string
          location: string | null
          mobile_operator: string | null
          notes: string | null
          online_meeting_link: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          phone_number: string | null
          scheduled_time: string
          status: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          duration: number
          id?: string
          location?: string | null
          mobile_operator?: string | null
          notes?: string | null
          online_meeting_link?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status: string
          phone_number?: string | null
          scheduled_time: string
          status: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          duration?: number
          id?: string
          location?: string | null
          mobile_operator?: string | null
          notes?: string | null
          online_meeting_link?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          phone_number?: string | null
          scheduled_time?: string
          status?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_free: boolean | null
          location: string | null
          online_meeting_link: string | null
          price: number | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_free?: boolean | null
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_free?: boolean | null
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mobile_operators: {
        Row: {
          code: string
          country: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          country: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          correspondent: string | null
          created_at: string | null
          currency: string
          customer_timestamp: string | null
          deposit_id: string | null
          id: string
          metadata: Json | null
          payer_address: string | null
          payer_type: string | null
          phone_number: string | null
          provider: string
          provider_transaction_id: string | null
          reference_id: string
          reference_type: string
          statement_description: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          correspondent?: string | null
          created_at?: string | null
          currency: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          phone_number?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id: string
          reference_type: string
          statement_description?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          correspondent?: string | null
          created_at?: string | null
          currency?: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          phone_number?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id?: string
          reference_type?: string
          statement_description?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          mobile_operator: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          phone_number: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status: string
          phone_number?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_appearances: {
        Row: {
          appearance_type: string
          created_at: string
          description: string
          event_date: string
          event_name: string
          id: string
          image_url: string | null
          location: string
          media_link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          appearance_type: string
          created_at?: string
          description: string
          event_date: string
          event_name: string
          id?: string
          image_url?: string | null
          location: string
          media_link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          appearance_type?: string
          created_at?: string
          description?: string
          event_date?: string
          event_name?: string
          id?: string
          image_url?: string | null
          location?: string
          media_link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      speaking_bookings: {
        Row: {
          created_at: string
          description: string | null
          email: string
          event_date: string
          event_type: string
          id: string
          name: string
          organization: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email: string
          event_date: string
          event_type: string
          id?: string
          name: string
          organization: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string
          event_date?: string
          event_type?: string
          id?: string
          name?: string
          organization?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      speaking_topics: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
