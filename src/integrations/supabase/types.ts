export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_analysis: {
        Row: {
          admin_reviewed: boolean
          comment_text: string
          comment_type: string
          created_at: string
          evaluation_id: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean
          language_detected: string | null
        }
        Insert: {
          admin_reviewed?: boolean
          comment_text: string
          comment_type: string
          created_at?: string
          evaluation_id?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          language_detected?: string | null
        }
        Update: {
          admin_reviewed?: boolean
          comment_text?: string
          comment_type?: string
          created_at?: string
          evaluation_id?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          language_detected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_analysis_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          question_order: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          question_order: number
          question_text: string
          question_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          question_order?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluation_settings: {
        Row: {
          created_at: string
          current_semester: string
          id: string
          is_evaluation_active: boolean
          school_year: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_semester?: string
          id?: string
          is_evaluation_active?: boolean
          school_year?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_semester?: string
          id?: string
          is_evaluation_active?: boolean
          school_year?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          answers: Json | null
          classroom_management: number
          course_content: number
          evaluation_date: string | null
          id: string
          level: string | null
          negative_feedback: string | null
          overall_rating: number
          positive_feedback: string | null
          responsiveness: number
          section: string | null
          semester: string | null
          strand_course: string | null
          student_id: string
          student_name: string | null
          student_usn: string | null
          submitted_at: string
          suggestions: string | null
          teacher_id: string
          teacher_name: string | null
          teacher_position: string | null
          teaching_effectiveness: number
        }
        Insert: {
          answers?: Json | null
          classroom_management: number
          course_content: number
          evaluation_date?: string | null
          id?: string
          level?: string | null
          negative_feedback?: string | null
          overall_rating: number
          positive_feedback?: string | null
          responsiveness: number
          section?: string | null
          semester?: string | null
          strand_course?: string | null
          student_id: string
          student_name?: string | null
          student_usn?: string | null
          submitted_at?: string
          suggestions?: string | null
          teacher_id: string
          teacher_name?: string | null
          teacher_position?: string | null
          teaching_effectiveness: number
        }
        Update: {
          answers?: Json | null
          classroom_management?: number
          course_content?: number
          evaluation_date?: string | null
          id?: string
          level?: string | null
          negative_feedback?: string | null
          overall_rating?: number
          positive_feedback?: string | null
          responsiveness?: number
          section?: string | null
          semester?: string | null
          strand_course?: string | null
          student_id?: string
          student_name?: string | null
          student_usn?: string | null
          submitted_at?: string
          suggestions?: string | null
          teacher_id?: string
          teacher_name?: string | null
          teacher_position?: string | null
          teaching_effectiveness?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evaluations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          request_date: string
          status: string
          updated_at: string
          usn: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          request_date?: string
          status?: string
          updated_at?: string
          usn: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          request_date?: string
          status?: string
          updated_at?: string
          usn?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          level: string | null
          password: string | null
          password_hash: string | null
          phone_number: string | null
          role: string
          section: string | null
          semester: string | null
          status: string | null
          strand_course: string | null
          updated_at: string
          user_id: string
          usn: string | null
          year_level: number | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          level?: string | null
          password?: string | null
          password_hash?: string | null
          phone_number?: string | null
          role?: string
          section?: string | null
          semester?: string | null
          status?: string | null
          strand_course?: string | null
          updated_at?: string
          user_id: string
          usn?: string | null
          year_level?: number | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          level?: string | null
          password?: string | null
          password_hash?: string | null
          phone_number?: string | null
          role?: string
          section?: string | null
          semester?: string | null
          status?: string | null
          strand_course?: string | null
          updated_at?: string
          user_id?: string
          usn?: string | null
          year_level?: number | null
        }
        Relationships: []
      }
      section_capacity: {
        Row: {
          created_at: string
          current_count: number
          id: string
          level: string
          max_capacity: number
          section: string
          strand_course: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          id?: string
          level: string
          max_capacity?: number
          section: string
          strand_course: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_count?: number
          id?: string
          level?: string
          max_capacity?: number
          section?: string
          strand_course?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_evaluation_lists: {
        Row: {
          created_at: string
          id: string
          level: string
          section: string
          strand_course: string
          student_id: string
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          section: string
          strand_course: string
          student_id: string
          subject: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          section?: string
          strand_course?: string
          student_id?: string
          subject?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          created_at: string | null
          id: string
          level: string
          section: string
          strand_course: string
          subject: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          section: string
          strand_course: string
          subject: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          section?: string
          strand_course?: string
          subject?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_evaluation_results: {
        Row: {
          average_scores: Json | null
          created_at: string
          evaluation_period: string
          flagged_comments: string[] | null
          id: string
          negative_comments: string[] | null
          overall_rating: number
          positive_comments: string[] | null
          suggestions: string[] | null
          teacher_id: string | null
          total_evaluations: number
          updated_at: string
        }
        Insert: {
          average_scores?: Json | null
          created_at?: string
          evaluation_period: string
          flagged_comments?: string[] | null
          id?: string
          negative_comments?: string[] | null
          overall_rating: number
          positive_comments?: string[] | null
          suggestions?: string[] | null
          teacher_id?: string | null
          total_evaluations?: number
          updated_at?: string
        }
        Update: {
          average_scores?: Json | null
          created_at?: string
          evaluation_period?: string
          flagged_comments?: string[] | null
          id?: string
          negative_comments?: string[] | null
          overall_rating?: number
          positive_comments?: string[] | null
          suggestions?: string[] | null
          teacher_id?: string | null
          total_evaluations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_evaluation_results_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          department: string | null
          id: string
          is_active: boolean
          level: string | null
          name: string
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name: string
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          name?: string
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_teacher_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_profile_status: {
        Args: {
          profile_id: string
          new_status: string
          new_is_approved: boolean
        }
        Returns: undefined
      }
      update_section_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
