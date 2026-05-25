// Hand-maintained types matching supabase/migrations/001_initial.sql.
// If the migration changes, update these to match.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string;
          created_at: string;
          submitted_by: string | null;
          submitter_email: string | null;
          team: string;
          component_name: string;
          title: string;
          problem_description: string;
          use_case: string;
          why_insufficient: string;
          proposed_support: string;
          gap_type: string;
          frequency_impact: string;
          figma_url: string | null;
          storybook_url: string | null;
          open_questions: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          submitted_by: string | null;
          submitter_email?: string | null;
          team: string;
          component_name: string;
          title: string;
          problem_description: string;
          use_case: string;
          why_insufficient: string;
          proposed_support: string;
          gap_type: string;
          frequency_impact: string;
          figma_url?: string | null;
          storybook_url?: string | null;
          open_questions?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
        Relationships: [];
      };
      submission_images: {
        Row: {
          id: string;
          submission_id: string;
          storage_path: string;
          caption: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          submission_id: string;
          storage_path: string;
          caption?: string | null;
          position?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["submission_images"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "submission_images_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_runs: {
        Row: {
          id: string;
          created_at: string;
          triggered_by: string | null;
          input_count: number;
          payload: Json;
          mode: "fixtures" | "live";
        };
        Insert: {
          id?: string;
          created_at?: string;
          triggered_by: string | null;
          input_count: number;
          payload: Json;
          mode: "fixtures" | "live";
        };
        Update: Partial<
          Database["public"]["Tables"]["analysis_runs"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
