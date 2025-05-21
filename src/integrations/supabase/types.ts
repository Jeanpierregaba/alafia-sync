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
      appointment_documents: {
        Row: {
          appointment_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          appointment_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          appointment_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          center_id: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          is_emergency: boolean | null
          medical_history: string | null
          notes: string | null
          notification_status: Json | null
          patient_id: string
          practitioner_id: string
          reason: string | null
          start_time: string
          status: string
          symptoms: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          center_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          is_emergency?: boolean | null
          medical_history?: string | null
          notes?: string | null
          notification_status?: Json | null
          patient_id: string
          practitioner_id: string
          reason?: string | null
          start_time: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          center_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          is_emergency?: boolean | null
          medical_history?: string | null
          notes?: string | null
          notification_status?: Json | null
          patient_id?: string
          practitioner_id?: string
          reason?: string | null
          start_time?: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "health_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      health_centers: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          appointment_id: string
          content: string | null
          error: string | null
          id: string
          notification_type: string
          recipient: string
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id: string
          content?: string | null
          error?: string | null
          id?: string
          notification_type: string
          recipient: string
          sent_at?: string
          status: string
        }
        Update: {
          appointment_id?: string
          content?: string | null
          error?: string | null
          id?: string
          notification_type?: string
          recipient?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          phone_number: string | null
          reminder_24h: boolean
          reminder_same_day: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          phone_number?: string | null
          reminder_24h?: boolean
          reminder_same_day?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          phone_number?: string | null
          reminder_24h?: boolean
          reminder_same_day?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      practitioner_availability: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          practitioner_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          practitioner_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          practitioner_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_availability_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_centers: {
        Row: {
          center_id: string
          created_at: string
          id: string
          practitioner_id: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          practitioner_id: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_centers_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "health_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practitioner_centers_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          created_at: string
          description: string | null
          experience_years: number
          id: string
          speciality: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          experience_years: number
          id?: string
          speciality: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          experience_years?: number
          id?: string
          speciality?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          medical_history: string | null
          phone: number | null
          updated_at: string
          user_type: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          medical_history?: string | null
          phone?: number | null
          updated_at?: string
          user_type: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          medical_history?: string | null
          phone?: number | null
          updated_at?: string
          user_type?: string
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          appointment_id: string | null
          arrival_time: string | null
          created_at: string
          delay_notes: string | null
          delay_request_at: string | null
          end_time: string | null
          estimated_wait_time: number | null
          id: string
          notified_at: string | null
          patient_id: string
          position: number | null
          practitioner_id: string | null
          queue_id: string
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          arrival_time?: string | null
          created_at?: string
          delay_notes?: string | null
          delay_request_at?: string | null
          end_time?: string | null
          estimated_wait_time?: number | null
          id?: string
          notified_at?: string | null
          patient_id: string
          position?: number | null
          practitioner_id?: string | null
          queue_id: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          arrival_time?: string | null
          created_at?: string
          delay_notes?: string | null
          delay_request_at?: string | null
          end_time?: string | null
          estimated_wait_time?: number | null
          id?: string
          notified_at?: string | null
          patient_id?: string
          position?: number | null
          practitioner_id?: string | null
          queue_id?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "waiting_queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_logs: {
        Row: {
          details: Json | null
          entry_id: string | null
          event_time: string
          event_type: string
          id: string
          queue_id: string
        }
        Insert: {
          details?: Json | null
          entry_id?: string | null
          event_time?: string
          event_type: string
          id?: string
          queue_id: string
        }
        Update: {
          details?: Json | null
          entry_id?: string | null
          event_time?: string
          event_type?: string
          id?: string
          queue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_logs_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "queue_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "waiting_queues"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_queues: {
        Row: {
          average_wait_time: number
          center_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          average_wait_time?: number
          center_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          average_wait_time?: number
          center_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_queues_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "health_centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      appointments_view: {
        Row: {
          center_city: string | null
          center_id: string | null
          center_name: string | null
          created_at: string | null
          end_time: string | null
          id: string | null
          notes: string | null
          patient_first_name: string | null
          patient_id: string | null
          patient_last_name: string | null
          practitioner_first_name: string | null
          practitioner_id: string | null
          practitioner_last_name: string | null
          practitioner_speciality: string | null
          reason: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "health_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      available_slots: {
        Row: {
          day_of_week: number | null
          is_available: boolean | null
          practitioner_id: string | null
          slot_date: string | null
          slot_end: string | null
          slot_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_availability_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: {
        Args: { uid: string }
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
