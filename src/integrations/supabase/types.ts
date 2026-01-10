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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_tag: string | null
          category: string | null
          condition: string | null
          created_at: string
          gym_id: string
          id: string
          is_active: boolean | null
          last_maintenance_date: string | null
          location_id: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          updated_at: string
        }
        Insert: {
          asset_tag?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          gym_id: string
          id?: string
          is_active?: boolean | null
          last_maintenance_date?: string | null
          location_id?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          updated_at?: string
        }
        Update: {
          asset_tag?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          is_active?: boolean | null
          last_maintenance_date?: string | null
          location_id?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          gym_id: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          gym_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          gym_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
          identifier_type: string
          last_attempt_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
          identifier_type: string
          last_attempt_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          identifier_type?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      bank_reconciliation_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          matched_payment_id: string | null
          reconciliation_id: string
          reference: string | null
          status: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          matched_payment_id?: string | null
          reconciliation_id: string
          reference?: string | null
          status?: string | null
          transaction_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          matched_payment_id?: string | null
          reconciliation_id?: string
          reference?: string | null
          status?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_items_matched_payment_id_fkey"
            columns: ["matched_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_items_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliations: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          gym_id: string
          id: string
          imported_at: string
          matched_transactions: number | null
          status: string | null
          total_transactions: number | null
          unmatched_transactions: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          gym_id: string
          id?: string
          imported_at?: string
          matched_transactions?: number | null
          status?: string | null
          total_transactions?: number | null
          unmatched_transactions?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          gym_id?: string
          id?: string
          imported_at?: string
          matched_transactions?: number | null
          status?: string | null
          total_transactions?: number | null
          unmatched_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          gym_id: string
          id: string
          member_id: string
          notes: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          gym_id: string
          id?: string
          member_id: string
          notes?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          gym_id?: string
          id?: string
          member_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          booked_at: string
          cancelled_at: string | null
          checked_in_at: string | null
          class_id: string
          created_at: string
          id: string
          member_id: string
          promoted_at: string | null
          status: string | null
        }
        Insert: {
          booked_at?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id: string
          created_at?: string
          id?: string
          member_id: string
          promoted_at?: string | null
          status?: string | null
        }
        Update: {
          booked_at?: string
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id?: string
          created_at?: string
          id?: string
          member_id?: string
          promoted_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      class_series: {
        Row: {
          capacity: number
          class_type_id: string | null
          coach_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          end_time: string
          gym_id: string
          id: string
          is_mandatory: boolean | null
          location_id: string | null
          recurrence_days: number[] | null
          recurrence_type: string
          start_date: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          class_type_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time: string
          gym_id: string
          id?: string
          is_mandatory?: boolean | null
          location_id?: string | null
          recurrence_days?: number[] | null
          recurrence_type: string
          start_date: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          class_type_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string
          gym_id?: string
          id?: string
          is_mandatory?: boolean | null
          location_id?: string | null
          recurrence_days?: number[] | null
          recurrence_type?: string
          start_date?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_series_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_series_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          capacity: number | null
          color: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          gym_id: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_types_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          class_type_id: string | null
          coach_id: string | null
          created_at: string
          description: string | null
          discipline_id: string | null
          end_time: string
          gym_id: string
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          is_recurring: boolean | null
          location_id: string | null
          recurrence_rule: string | null
          series_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          workout_template_id: string | null
        }
        Insert: {
          capacity?: number | null
          class_type_id?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          end_time: string
          gym_id: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_recurring?: boolean | null
          location_id?: string | null
          recurrence_rule?: string | null
          series_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          workout_template_id?: string | null
        }
        Update: {
          capacity?: number | null
          class_type_id?: string | null
          coach_id?: string | null
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          end_time?: string
          gym_id?: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          is_recurring?: boolean | null
          location_id?: string | null
          recurrence_rule?: string | null
          series_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "class_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          expires_at: string | null
          id: string
          requested_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          id?: string
          requested_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          expires_at?: string | null
          id?: string
          requested_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          cooling_off_ends_at: string | null
          created_at: string | null
          id: string
          reason: string | null
          requested_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          cooling_off_ends_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          cooling_off_ends_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      discipline_ranks: {
        Row: {
          color: string | null
          created_at: string
          criteria: Json | null
          discipline_id: string
          id: string
          level: number
          name: string
          requirements: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          discipline_id: string
          id?: string
          level?: number
          name: string
          requirements?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          discipline_id?: string
          id?: string
          level?: number
          name?: string
          requirements?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_ranks_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          gym_id: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplines_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number
          gym_id: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          name: string
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value: number
          gym_id: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          gym_id?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name?: string
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discounts_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gdpr_consents: {
        Row: {
          consent_type: string
          created_at: string | null
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: string | null
          revoked_at: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          revoked_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gym_classes: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          default_capacity: number | null
          default_duration: number | null
          description: string | null
          gym_id: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          default_capacity?: number | null
          default_duration?: number | null
          description?: string | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          default_capacity?: number | null
          default_duration?: number | null
          description?: string | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_classes_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_exercises: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          discipline_id: string | null
          equipment: string | null
          gym_id: string
          id: string
          instructions: string | null
          is_active: boolean | null
          max_rank_level: number | null
          min_rank_level: number | null
          muscle_groups: string[] | null
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          equipment?: string | null
          gym_id: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          muscle_groups?: string[] | null
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          equipment?: string | null
          gym_id?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          muscle_groups?: string[] | null
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_exercises_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_owner_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string
          gym_name: string
          id: string
          invited_by: string
          message: string | null
          phone: string | null
          status: string
          temp_password: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name: string
          gym_name: string
          id?: string
          invited_by: string
          message?: string | null
          phone?: string | null
          status?: string
          temp_password?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          gym_name?: string
          id?: string
          invited_by?: string
          message?: string | null
          phone?: string | null
          status?: string
          temp_password?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gym_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          gym_id: string
          id: string
          plan_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gym_id: string
          id?: string
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gym_id?: string
          id?: string
          plan_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "platform_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_workouts: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          discipline_id: string | null
          estimated_duration: number | null
          exercises: Json | null
          gym_id: string
          id: string
          is_active: boolean | null
          max_rank_level: number | null
          min_rank_level: number | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          estimated_duration?: number | null
          exercises?: Json | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          estimated_duration?: number | null
          exercises?: Json | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_workouts_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          bank_beneficiary: string | null
          bank_iban: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_beneficiary?: string | null
          bank_iban?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_beneficiary?: string | null
          bank_iban?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string | null
          gym_id: string
          id: string
          invoice_number: string
          member_id: string
          notes: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          gym_id: string
          id?: string
          invoice_number: string
          member_id: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          gym_id?: string
          id?: string
          invoice_number?: string
          member_id?: string
          notes?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          gym_id: string
          id: string
          lead_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          gym_id: string
          id?: string
          lead_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          gym_id?: string
          id?: string
          lead_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          converted_member_id: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          full_name: string
          gym_id: string
          id: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          full_name: string
          gym_id: string
          id?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_member_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          full_name?: string
          gym_id?: string
          id?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_member_id_fkey"
            columns: ["converted_member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          description: string | null
          equipment: string[] | null
          floor_number: number | null
          gym_id: string
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          equipment?: string[] | null
          floor_number?: number | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          equipment?: string[] | null
          floor_number?: number | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      member_dependents: {
        Row: {
          can_checkin_alone: boolean | null
          created_at: string | null
          dependent_member_id: string
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          primary_member_id: string
          relationship: string
          updated_at: string | null
        }
        Insert: {
          can_checkin_alone?: boolean | null
          created_at?: string | null
          dependent_member_id: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          primary_member_id: string
          relationship: string
          updated_at?: string | null
        }
        Update: {
          can_checkin_alone?: boolean | null
          created_at?: string | null
          dependent_member_id?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          primary_member_id?: string
          relationship?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_dependents_dependent_member_id_fkey"
            columns: ["dependent_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_dependents_dependent_member_id_fkey"
            columns: ["dependent_member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_dependents_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_dependents_primary_member_id_fkey"
            columns: ["primary_member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      member_ranks: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          discipline_id: string
          id: string
          member_id: string
          notes: string | null
          rank_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          discipline_id: string
          id?: string
          member_id: string
          notes?: string | null
          rank_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          discipline_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          rank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_ranks_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_ranks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_ranks_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_ranks_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "discipline_ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      member_sensitive_data: {
        Row: {
          allergies: string | null
          blood_type: string | null
          created_at: string
          emergency_medical_info: string | null
          health_conditions: string | null
          id: string
          last_medical_update: string | null
          medical_notes: string | null
          member_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          emergency_medical_info?: string | null
          health_conditions?: string | null
          id?: string
          last_medical_update?: string | null
          medical_notes?: string | null
          member_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string | null
          blood_type?: string | null
          created_at?: string
          emergency_medical_info?: string | null
          health_conditions?: string | null
          id?: string
          last_medical_update?: string | null
          medical_notes?: string | null
          member_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_sensitive_data_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_sensitive_data_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      member_workouts: {
        Row: {
          assigned_by: string | null
          assigned_date: string
          completed_at: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          results: Json | null
          workout_template_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          results?: Json | null
          workout_template_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          results?: Json | null
          workout_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_workouts_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          gdpr_anonymized_at: string | null
          gdpr_consent_at: string | null
          gym_id: string
          health_conditions: string | null
          id: string
          is_dependent: boolean | null
          is_minor: boolean | null
          membership_end_date: string | null
          membership_plan_id: string | null
          membership_start_date: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          tutor_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name: string
          gdpr_anonymized_at?: string | null
          gdpr_consent_at?: string | null
          gym_id: string
          health_conditions?: string | null
          id?: string
          is_dependent?: boolean | null
          is_minor?: boolean | null
          membership_end_date?: string | null
          membership_plan_id?: string | null
          membership_start_date?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tutor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          gdpr_anonymized_at?: string | null
          gdpr_consent_at?: string | null
          gym_id?: string
          health_conditions?: string | null
          id?: string
          is_dependent?: boolean | null
          is_minor?: boolean | null
          membership_end_date?: string | null
          membership_plan_id?: string | null
          membership_start_date?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tutor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          gym_id: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          gym_id: string
          id: string
          invoice_id: string | null
          member_id: string
          multicaixa_reference: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          proof_transaction_id: string | null
          proof_url: string | null
          proof_verified: boolean | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          gym_id: string
          id?: string
          invoice_id?: string | null
          member_id: string
          multicaixa_reference?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          proof_transaction_id?: string | null
          proof_url?: string | null
          proof_verified?: boolean | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          gym_id?: string
          id?: string
          invoice_id?: string | null
          member_id?: string
          multicaixa_reference?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          proof_transaction_id?: string | null
          proof_url?: string | null
          proof_verified?: boolean | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_records: {
        Row: {
          exercise_name: string
          gym_id: string
          id: string
          is_pr: boolean | null
          member_id: string
          notes: string | null
          recorded_at: string
          unit: string
          value: number
        }
        Insert: {
          exercise_name: string
          gym_id: string
          id?: string
          is_pr?: boolean | null
          member_id: string
          notes?: string | null
          recorded_at?: string
          unit: string
          value: number
        }
        Update: {
          exercise_name?: string
          gym_id?: string
          id?: string
          is_pr?: boolean | null
          member_id?: string
          notes?: string | null
          recorded_at?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_records_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_members: number | null
          max_staff: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          max_staff?: number | null
          name: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          max_staff?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"] | null
          cost: number | null
          created_at: string
          description: string | null
          gym_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"] | null
          cost?: number | null
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"] | null
          cost?: number | null
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotion_criteria: {
        Row: {
          created_at: string
          discipline_id: string
          from_rank_id: string | null
          id: string
          min_attendance_percent: number | null
          min_classes: number | null
          min_months: number | null
          requirements: string | null
          test_required: boolean | null
          to_rank_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discipline_id: string
          from_rank_id?: string | null
          id?: string
          min_attendance_percent?: number | null
          min_classes?: number | null
          min_months?: number | null
          requirements?: string | null
          test_required?: boolean | null
          to_rank_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discipline_id?: string
          from_rank_id?: string | null
          id?: string
          min_attendance_percent?: number | null
          min_classes?: number | null
          min_months?: number | null
          requirements?: string | null
          test_required?: boolean | null
          to_rank_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_criteria_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_criteria_from_rank_id_fkey"
            columns: ["from_rank_id"]
            isOneToOne: false
            referencedRelation: "discipline_ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_criteria_to_rank_id_fkey"
            columns: ["to_rank_id"]
            isOneToOne: false
            referencedRelation: "discipline_ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_promotions: {
        Row: {
          certificate_url: string | null
          created_at: string
          discipline_id: string
          from_rank_id: string | null
          id: string
          member_id: string
          notes: string | null
          promoted_by: string | null
          promotion_date: string
          to_rank_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          discipline_id: string
          from_rank_id?: string | null
          id?: string
          member_id: string
          notes?: string | null
          promoted_by?: string | null
          promotion_date?: string
          to_rank_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          discipline_id?: string
          from_rank_id?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          promoted_by?: string | null
          promotion_date?: string
          to_rank_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_promotions_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_promotions_from_rank_id_fkey"
            columns: ["from_rank_id"]
            isOneToOne: false
            referencedRelation: "discipline_ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_promotions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_promotions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rank_promotions_to_rank_id_fkey"
            columns: ["to_rank_id"]
            isOneToOne: false
            referencedRelation: "discipline_ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string | null
          created_at: string
          gym_id: string
          id: string
          member_id: string | null
          notes: string | null
          payment_method: string | null
          subtotal: number
          tax: number | null
          total: number
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string
          gym_id: string
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Update: {
          cashier_id?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_absences: {
        Row: {
          created_at: string
          end_date: string
          gym_id: string
          id: string
          reason: string | null
          start_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          gym_id: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          gym_id?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_absences_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_certifications: {
        Row: {
          created_at: string
          expiry_date: string | null
          gym_id: string
          id: string
          issued_date: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          gym_id: string
          id?: string
          issued_date?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          gym_id?: string
          id?: string
          issued_date?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          class_reminders: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          gym_id: string | null
          id: string
          marketing_emails: boolean | null
          membership_reminders: boolean | null
          payment_reminders: boolean | null
          reminder_days_before: number | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_reminders?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          gym_id?: string | null
          id?: string
          marketing_emails?: boolean | null
          membership_reminders?: boolean | null
          payment_reminders?: boolean | null
          reminder_days_before?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_reminders?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          gym_id?: string | null
          id?: string
          marketing_emails?: boolean | null
          membership_reminders?: boolean | null
          payment_reminders?: boolean | null
          reminder_days_before?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          gym_id: string | null
          id: string
          is_trainer: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id?: string | null
          id?: string
          is_trainer?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string | null
          id?: string
          is_trainer?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          discipline_id: string | null
          estimated_duration: number | null
          exercises: Json | null
          gym_id: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_rank_level: number | null
          min_rank_level: number | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          estimated_duration?: number | null
          exercises?: Json | null
          gym_id: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          discipline_id?: string | null
          estimated_duration?: number | null
          exercises?: Json | null
          gym_id?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_rank_level?: number | null
          min_rank_level?: number | null
          name: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_rate_limit_stats: {
        Row: {
          avg_attempts: number | null
          high_attempt_count: number | null
          identifier_type: string | null
          max_attempts: number | null
          total_entries: number | null
        }
        Relationships: []
      }
      members_safe: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string | null
          gdpr_anonymized_at: string | null
          gdpr_consent_at: string | null
          gym_id: string | null
          id: string | null
          is_minor: boolean | null
          membership_end_date: string | null
          membership_plan_id: string | null
          membership_start_date: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          tutor_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          gdpr_anonymized_at?: string | null
          gdpr_consent_at?: string | null
          gym_id?: string | null
          id?: string | null
          is_minor?: boolean | null
          membership_end_date?: string | null
          membership_plan_id?: string | null
          membership_start_date?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tutor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string | null
          gdpr_anonymized_at?: string | null
          gdpr_consent_at?: string | null
          gym_id?: string | null
          id?: string | null
          is_minor?: boolean | null
          membership_end_date?: string | null
          membership_plan_id?: string | null
          membership_start_date?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tutor_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "members_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_auth_rate_limit: {
        Args: { p_identifier: string; p_identifier_type?: string }
        Returns: Json
      }
      check_coach_overlap: {
        Args: {
          p_coach_id: string
          p_end_time: string
          p_exclude_class_id?: string
          p_start_time: string
        }
        Returns: {
          conflicting_classes: Json
          is_available: boolean
        }[]
      }
      check_location_overlap: {
        Args: {
          p_end_time: string
          p_exclude_class_id?: string
          p_location_id: string
          p_start_time: string
        }
        Returns: {
          conflicting_classes: Json
          is_available: boolean
        }[]
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      get_user_gym_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _gym_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _gym_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_gym_role: {
        Args: {
          _gym_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_full: { Args: { class_id_param: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_auth_rate_limit: {
        Args: { p_identifier: string; p_identifier_type?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "gym_owner"
        | "admin"
        | "staff"
        | "member"
        | "coach"
        | "trainer"
        | "instructor"
        | "receptionist"
        | "physiotherapist"
        | "nutritionist"
        | "manager"
      invoice_status: "draft" | "issued" | "paid" | "overdue" | "void"
      lead_source:
        | "walk_in"
        | "instagram"
        | "facebook"
        | "referral"
        | "website"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      member_status: "active" | "inactive" | "suspended" | "pending"
      payment_method: "multicaixa" | "cash" | "bank_transfer" | "other"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      product_category: "supplement" | "gear" | "apparel" | "snack" | "other"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
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
    Enums: {
      app_role: [
        "super_admin",
        "gym_owner",
        "admin",
        "staff",
        "member",
        "coach",
        "trainer",
        "instructor",
        "receptionist",
        "physiotherapist",
        "nutritionist",
        "manager",
      ],
      invoice_status: ["draft", "issued", "paid", "overdue", "void"],
      lead_source: [
        "walk_in",
        "instagram",
        "facebook",
        "referral",
        "website",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      member_status: ["active", "inactive", "suspended", "pending"],
      payment_method: ["multicaixa", "cash", "bank_transfer", "other"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      product_category: ["supplement", "gear", "apparel", "snack", "other"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
