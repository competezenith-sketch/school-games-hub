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
      administrative_fees: {
        Row: {
          amount_kg: number | null
          article_ref: string | null
          created_at: string | null
          description: string
          fee_code: string | null
          id: string
          notes: string | null
        }
        Insert: {
          amount_kg?: number | null
          article_ref?: string | null
          created_at?: string | null
          description: string
          fee_code?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          amount_kg?: number | null
          article_ref?: string | null
          created_at?: string | null
          description?: string
          fee_code?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      age_categories: {
        Row: {
          birth_years: string | null
          created_at: string | null
          event_type: string | null
          id: string
          max_age: number | null
          min_age: number | null
          name: string
        }
        Insert: {
          birth_years?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          max_age?: number | null
          min_age?: number | null
          name: string
        }
        Update: {
          birth_years?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          max_age?: number | null
          min_age?: number | null
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          org_id: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          year_max: number | null
          year_min: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          year_max?: number | null
          year_min?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          year_max?: number | null
          year_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_rules: {
        Row: {
          category_id: string
          competition_id: string
          created_at: string
          id: string
          modality_id: string
          org_id: string
          rules_config: Json
          updated_at: string
        }
        Insert: {
          category_id: string
          competition_id: string
          created_at?: string
          id?: string
          modality_id: string
          org_id: string
          rules_config?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string
          competition_id?: string
          created_at?: string
          id?: string
          modality_id?: string
          org_id?: string
          rules_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_rules_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_rules_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_stages: {
        Row: {
          city: string | null
          competition_id: string | null
          congress_date: string | null
          congress_time: string | null
          created_at: string | null
          credential_date: string | null
          end_date: string | null
          id: string
          name: string | null
          stage_number: number | null
          stage_type: string | null
          start_date: string | null
        }
        Insert: {
          city?: string | null
          competition_id?: string | null
          congress_date?: string | null
          congress_time?: string | null
          created_at?: string | null
          credential_date?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          stage_number?: number | null
          stage_type?: string | null
          start_date?: string | null
        }
        Update: {
          city?: string | null
          competition_id?: string | null
          congress_date?: string | null
          congress_time?: string | null
          created_at?: string | null
          credential_date?: string | null
          end_date?: string | null
          id?: string
          name?: string | null
          stage_number?: number | null
          stage_type?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          org_id: string
          start_date: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          org_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          org_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      delegation_staff_rules: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          max_athletes_trigger: number | null
          max_count: number | null
          min_athletes_trigger: number | null
          min_count: number | null
          notes: string | null
          role_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_athletes_trigger?: number | null
          max_count?: number | null
          min_athletes_trigger?: number | null
          min_count?: number | null
          notes?: string | null
          role_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          max_athletes_trigger?: number | null
          max_count?: number | null
          min_athletes_trigger?: number | null
          min_count?: number | null
          notes?: string | null
          role_name?: string
        }
        Relationships: []
      }
      delegations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          type: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_rules: {
        Row: {
          article_ref: string | null
          created_at: string | null
          description: string
          id: string
          penalty: string | null
          rule_code: string | null
        }
        Insert: {
          article_ref?: string | null
          created_at?: string | null
          description: string
          id?: string
          penalty?: string | null
          rule_code?: string | null
        }
        Update: {
          article_ref?: string | null
          created_at?: string | null
          description?: string
          id?: string
          penalty?: string | null
          rule_code?: string | null
        }
        Relationships: []
      }
      inscriptions: {
        Row: {
          competition_rule_id: string
          created_at: string
          delegation_id: string
          id: string
          notes: string | null
          org_id: string
          participant_id: string
          status: Database["public"]["Enums"]["inscription_status"]
          updated_at: string
        }
        Insert: {
          competition_rule_id: string
          created_at?: string
          delegation_id: string
          id?: string
          notes?: string | null
          org_id: string
          participant_id: string
          status?: Database["public"]["Enums"]["inscription_status"]
          updated_at?: string
        }
        Update: {
          competition_rule_id?: string
          created_at?: string
          delegation_id?: string
          id?: string
          notes?: string | null
          org_id?: string
          participant_id?: string
          status?: Database["public"]["Enums"]["inscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_competition_rule_id_fkey"
            columns: ["competition_rule_id"]
            isOneToOne: false
            referencedRelation: "competition_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          competition_id: string
          competition_rule_id: string | null
          created_at: string
          delegation_a_id: string
          delegation_b_id: string
          id: string
          location: string | null
          match_date: string | null
          match_number: number | null
          match_time: string | null
          notes: string | null
          org_id: string
          scanned_sheet_url: string | null
          score_a: number | null
          score_b: number | null
          status: string
          updated_at: string
          winner_delegation_id: string | null
        }
        Insert: {
          competition_id: string
          competition_rule_id?: string | null
          created_at?: string
          delegation_a_id: string
          delegation_b_id: string
          id?: string
          location?: string | null
          match_date?: string | null
          match_number?: number | null
          match_time?: string | null
          notes?: string | null
          org_id: string
          scanned_sheet_url?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          updated_at?: string
          winner_delegation_id?: string | null
        }
        Update: {
          competition_id?: string
          competition_rule_id?: string | null
          created_at?: string
          delegation_a_id?: string
          delegation_b_id?: string
          id?: string
          location?: string | null
          match_date?: string | null
          match_number?: number | null
          match_time?: string | null
          notes?: string | null
          org_id?: string
          scanned_sheet_url?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          updated_at?: string
          winner_delegation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_competition_rule_id_fkey"
            columns: ["competition_rule_id"]
            isOneToOne: false
            referencedRelation: "competition_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_delegation_a_id_fkey"
            columns: ["delegation_a_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_delegation_b_id_fkey"
            columns: ["delegation_b_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_delegation_id_fkey"
            columns: ["winner_delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
        ]
      }
      modalities: {
        Row: {
          created_at: string
          gender: string
          gender_type: string | null
          icon: string | null
          id: string
          is_team_sport: boolean | null
          name: string
          org_id: string
          type: string
        }
        Insert: {
          created_at?: string
          gender?: string
          gender_type?: string | null
          icon?: string | null
          id?: string
          is_team_sport?: boolean | null
          name: string
          org_id: string
          type?: string
        }
        Update: {
          created_at?: string
          gender?: string
          gender_type?: string | null
          icon?: string | null
          id?: string
          is_team_sport?: boolean | null
          name?: string
          org_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "modalities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modality_athlete_limits: {
        Row: {
          age_category_id: string | null
          created_at: string | null
          gender: string | null
          id: string
          is_national_qualifier: boolean | null
          max_athletes: number | null
          min_athletes: number | null
          modality_id: string | null
        }
        Insert: {
          age_category_id?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_national_qualifier?: boolean | null
          max_athletes?: number | null
          min_athletes?: number | null
          modality_id?: string | null
        }
        Update: {
          age_category_id?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          is_national_qualifier?: boolean | null
          max_athletes?: number | null
          min_athletes?: number | null
          modality_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modality_athlete_limits_age_category_id_fkey"
            columns: ["age_category_id"]
            isOneToOne: false
            referencedRelation: "age_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modality_athlete_limits_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          state: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          state?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          state?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          birth_date: string | null
          cpf: string
          created_at: string
          delegation_id: string | null
          full_name: string
          id: string
          org_id: string
          photo_url: string | null
          role: Database["public"]["Enums"]["participant_role"]
          sex: Database["public"]["Enums"]["sex_type"] | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf: string
          created_at?: string
          delegation_id?: string | null
          full_name: string
          id?: string
          org_id: string
          photo_url?: string | null
          role: Database["public"]["Enums"]["participant_role"]
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string
          created_at?: string
          delegation_id?: string | null
          full_name?: string
          id?: string
          org_id?: string
          photo_url?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_periods: {
        Row: {
          close_date: string | null
          competition_id: string | null
          created_at: string | null
          enrollment_url: string | null
          event_type: string | null
          id: string
          notes: string | null
          open_date: string | null
        }
        Insert: {
          close_date?: string | null
          competition_id?: string | null
          created_at?: string | null
          enrollment_url?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          open_date?: string | null
        }
        Update: {
          close_date?: string | null
          competition_id?: string | null
          created_at?: string | null
          enrollment_url?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          open_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_periods_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          competition_id: string | null
          created_at: string | null
          id: string
          placement: number
          points: number
        }
        Insert: {
          competition_id?: string | null
          created_at?: string | null
          id?: string
          placement: number
          points: number
        }
        Update: {
          competition_id?: string | null
          created_at?: string | null
          id?: string
          placement?: number
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_team_quotas: {
        Row: {
          city: string
          created_at: string | null
          id: string
          notes: string | null
          quota: number
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quota: number
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          quota?: number
        }
        Relationships: []
      }
      uniform_rules: {
        Row: {
          applies_to: string | null
          article_ref: string | null
          created_at: string | null
          id: string
          item_type: string | null
          label: string
          max_applications: number | null
          max_area_cm2: number | null
          notes: string | null
        }
        Insert: {
          applies_to?: string | null
          article_ref?: string | null
          created_at?: string | null
          id?: string
          item_type?: string | null
          label: string
          max_applications?: number | null
          max_area_cm2?: number | null
          notes?: string | null
        }
        Update: {
          applies_to?: string | null
          article_ref?: string | null
          created_at?: string | null
          id?: string
          item_type?: string | null
          label?: string
          max_applications?: number | null
          max_area_cm2?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      inscription_status:
        | "pendente"
        | "validado"
        | "rejeitado"
        | "rascunho"
        | "enviado"
      participant_role:
        | "atleta"
        | "tecnico"
        | "dirigente"
        | "motorista"
        | "arbitro"
      sex_type: "M" | "F"
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
      app_role: ["admin", "moderator", "user"],
      inscription_status: [
        "pendente",
        "validado",
        "rejeitado",
        "rascunho",
        "enviado",
      ],
      participant_role: [
        "atleta",
        "tecnico",
        "dirigente",
        "motorista",
        "arbitro",
      ],
      sex_type: ["M", "F"],
    },
  },
} as const
